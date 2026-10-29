import {
  type AliasToken,
  type CSSVarScope,
  createCSSVarScope,
  token2CSSVar,
  transformToken,
} from '@apollo-design/theme';
import {
  type ComponentInternalInstance,
  type ComputedRef,
  cloneVNode,
  Fragment,
  getCurrentInstance,
  h,
  type InjectionKey,
  inject,
  isVNode,
  nextTick,
  onMounted,
  onScopeDispose,
  onUpdated,
  provide,
  ref,
  type VNode,
  type VNodeArrayChildren,
  type VNodeChild,
  watch,
} from 'vue';
import type { ConfigProviderScopeTag } from './interface';

type Target = HTMLElement | SVGElement;
type Inline = { value: string; priority: string };
type Entry = {
  depth: number;
  prefix: string;
  token: AliasToken;
  native: Set<string>;
  scope: CSSVarScope;
};
type Group = {
  entries: Set<Entry>;
  fingerprint: string;
  last: Map<string, Inline>;
  external: Set<string>;
};

// Weak registries coordinate several renderless providers sharing one native
// root. Actual variable ownership and restoration stay in the theme primitive.
const groups = new WeakMap<Target, Group>();
const nativeStyles = new WeakMap<VNode, unknown>();
const depthKey: InjectionKey<number> = Symbol('apollo-config-scope-depth');

function isTarget(value: unknown): value is Target {
  if (!isNode(value) || value.nodeType !== 1) return false;
  const view = value.ownerDocument?.defaultView;
  return Boolean(view && (value instanceof view.HTMLElement || value instanceof view.SVGElement));
}
function isNode(value: unknown): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nodeType' in value &&
    typeof value.nodeType === 'number' &&
    'ownerDocument' in value &&
    'parentNode' in value
  );
}
function read(target: Target, name: string): Inline {
  return {
    value: target.style.getPropertyValue(name),
    priority: target.style.getPropertyPriority(name),
  };
}
function equal(first: Inline, second: Inline): boolean {
  return first.value === second.value && first.priority === second.priority;
}
function restore(target: Target, name: string, value: Inline): void {
  if (equal(read(target, name), value)) return;
  if (value.value) target.style.setProperty(name, value.value, value.priority);
  else target.style.removeProperty(name);
}
function aliasKey(name: string, token: AliasToken): name is keyof AliasToken {
  return Object.hasOwn(token, name);
}
function assign<K extends keyof AliasToken>(
  target: Partial<AliasToken>,
  key: K,
  value: AliasToken[K],
): void {
  target[key] = value;
}
function filterToken(
  token: AliasToken,
  prefix: string,
  protectedNames: Set<string>,
): Partial<AliasToken> {
  const result: Partial<AliasToken> = {};
  for (const name of Object.keys(token)) {
    if (aliasKey(name, token) && !protectedNames.has(token2CSSVar(name, prefix))) {
      assign(result, name, token[name]);
    }
  }
  return result;
}
function declaredVariables(
  style: unknown,
  target: Target,
  result = new Set<string>(),
): Set<string> {
  if (Array.isArray(style)) {
    for (const value of style) declaredVariables(value, target, result);
  } else if (typeof style === 'string') {
    const parsed = target.ownerDocument.createElement('div').style;
    parsed.cssText = style;
    for (let index = 0; index < parsed.length; index++) {
      const name = parsed.item(index);
      if (name.startsWith('--') && parsed.getPropertyValue(name)) result.add(name);
    }
  } else if (typeof style === 'object' && style !== null) {
    for (const [name, value] of Object.entries(style)) {
      if (name.startsWith('--') && value !== undefined && value !== null && value !== '')
        result.add(name);
    }
  }
  return result;
}

function reconcile(target: Target, group: Group): void {
  const entries = [...group.entries].sort((first, second) => first.depth - second.depth);
  const protectedNames = new Set(entries.flatMap((entry) => [...entry.native]));
  for (const [name, previous] of group.last) {
    const current = read(target, name);
    if (!equal(current, previous) && current.value) group.external.add(name);
  }
  for (const name of group.external) {
    if (!read(target, name).value) group.external.delete(name);
    else protectedNames.add(name);
  }
  const plan = entries.map((entry) => {
    const token = filterToken(entry.token, entry.prefix, protectedNames);
    return { entry, token, vars: transformToken(token, entry.prefix).vars };
  });
  const fingerprint = JSON.stringify([
    plan.map(({ entry, vars }) => [entry.depth, entry.prefix, vars]),
    [...protectedNames].sort(),
  ]);
  if (
    fingerprint === group.fingerprint &&
    [...group.last].every(([name, value]) => equal(read(target, name), value))
  )
    return;

  // A native declaration can equal the previous projection. Keep its current
  // value while releasing the provider's claim; equality does not imply ownership.
  const preserved = new Map([...protectedNames].map((name) => [name, read(target, name)]));
  for (const { entry, token } of plan) entry.scope.apply(token);
  for (const [name, value] of preserved) restore(target, name, value);
  group.last = new Map(
    plan.flatMap(({ vars }) => Object.keys(vars)).map((name) => [name, read(target, name)]),
  );
  group.fingerprint = fingerprint;
}

function collect(
  node: unknown,
  roots: Map<Target, unknown>,
  covered = false,
  visited = new Set<VNode>(),
): void {
  if (Array.isArray(node)) {
    for (const child of node) collect(child, roots, covered, visited);
    return;
  }
  if (!isVNode(node) || visited.has(node)) return;
  visited.add(node);
  if (node.component) {
    collect(node.component.subTree, roots, covered, visited);
    return;
  }
  if (node.suspense?.activeBranch) {
    collect(node.suspense.activeBranch, roots, covered, visited);
    return;
  }
  const element: unknown = node.el;
  if (typeof node.type === 'string' && isTarget(element)) {
    if (!covered)
      roots.set(element, nativeStyles.has(node) ? nativeStyles.get(node) : node.props?.style);
    // Native descendants inherit. Teleported descendants start their own root.
    collect(node.children, roots, true, visited);
    return;
  }
  const teleported =
    typeof node.type === 'object' &&
    node.type !== null &&
    '__isTeleport' in node.type &&
    node.type.__isTeleport === true;
  collect(node.children, roots, teleported ? false : covered, visited);
}

export function useThemeScope(options: {
  enabled: ComputedRef<boolean>;
  token: ComputedRef<AliasToken>;
  prefix: ComputedRef<string>;
}) {
  const currentInstance = getCurrentInstance();
  if (!currentInstance) throw new Error('Theme scopes require a ConfigProvider setup context');
  const instance = currentInstance;
  const depth = inject(depthKey, -1) + 1;
  provide(depthKey, depth);
  const mounted = ref(false);
  const entries = new Map<Target, Entry>();
  const observers: MutationObserver[] = [];
  let disposed = false;
  let queued = false;

  function release(target: Target, entry: Entry): void {
    const group = groups.get(target);
    group?.entries.delete(entry);
    entry.scope.remove();
    if (group?.entries.size) {
      group.last = new Map([...group.last.keys()].map((name) => [name, read(target, name)]));
      reconcile(target, group);
    } else groups.delete(target);
    entries.delete(target);
  }
  function disconnect(): void {
    for (const observer of observers.splice(0)) observer.disconnect();
  }
  function schedule(): void {
    if (queued || disposed || !mounted.value) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      sync();
    });
  }
  function observe(roots: Map<Target, unknown>, current: ComponentInternalInstance): void {
    const nodes = new Set<Node>();
    const anchor: unknown = current.vnode.el;
    if (isNode(anchor) && anchor.parentNode) nodes.add(anchor.parentNode);
    for (const target of roots.keys()) {
      nodes.add(target);
      if (target.parentNode) nodes.add(target.parentNode);
    }
    const byDocument = new Map<Document, Node[]>();
    for (const node of nodes) {
      const document = node.ownerDocument;
      if (document) byDocument.set(document, [...(byDocument.get(document) ?? []), node]);
    }
    for (const [document, targets] of byDocument) {
      const Observer = document.defaultView?.MutationObserver;
      if (!Observer) continue;
      const observer = new Observer((records) => {
        if (
          records.some(
            (record) =>
              record.type === 'childList' || (isTarget(record.target) && roots.has(record.target)),
          )
        )
          schedule();
      });
      for (const target of targets)
        observer.observe(target, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style'],
        });
      observers.push(observer);
    }
  }
  function sync(): void {
    if (disposed || !mounted.value) return;
    disconnect();
    const roots = new Map<Target, unknown>();
    if (options.enabled.value) collect(instance.subTree, roots);
    const prefix = options.prefix.value;
    const token = options.token.value;
    for (const [target, entry] of entries) {
      if (!roots.has(target) || entry.prefix !== prefix) release(target, entry);
    }
    for (const [target, style] of roots) {
      let group = groups.get(target);
      if (!group) {
        group = { entries: new Set(), fingerprint: '', last: new Map(), external: new Set() };
        groups.set(target, group);
      }
      let entry = entries.get(target);
      if (!entry) {
        entry = {
          depth,
          prefix,
          token,
          native: new Set(),
          scope: createCSSVarScope(target, prefix),
        };
        entries.set(target, entry);
        group.entries.add(entry);
      }
      entry.token = token;
      entry.native = declaredVariables(style, target);
      reconcile(target, group);
    }
    if (options.enabled.value) observe(roots, instance);
  }

  onMounted(() => {
    // The matching first render hydrates SSR styles. Release the declarative
    // copy before taking ownership, within the same microtask checkpoint.
    mounted.value = true;
    void nextTick(sync);
  });
  onUpdated(schedule);
  watch([options.enabled, options.token, options.prefix], schedule, { flush: 'post' });
  onScopeDispose(() => {
    disposed = true;
    disconnect();
    for (const [target, entry] of entries) release(target, entry);
  });

  function variables(): Record<string, string> {
    return options.enabled.value && !mounted.value
      ? transformToken(options.token.value, options.prefix.value).vars
      : {};
  }
  function projectChild(child: VNodeArrayChildren[number]): VNodeArrayChildren[number] {
    if (Array.isArray(child)) return child.map(projectChild);
    return isVNode(child) ? project(child) : child;
  }
  function project(node: VNode): VNode {
    if (typeof node.type === 'string') {
      const style: unknown = node.props?.style;
      const result = cloneVNode(node, { style: [variables(), style] });
      nativeStyles.set(result, style);
      return result;
    }
    if (node.type === Fragment && Array.isArray(node.children)) {
      const result = cloneVNode(node);
      result.children = node.children.map(projectChild);
      return result;
    }
    return node;
  }
  return {
    prepare(children: VNodeChild, nativeRoots = true): VNodeChild {
      if (!nativeRoots || !options.enabled.value || mounted.value) return children;
      return Array.isArray(children)
        ? children.map(projectChild)
        : isVNode(children)
          ? project(children)
          : children;
    },
    host(tag: ConfigProviderScopeTag, attrs: Record<string, unknown>, content: VNode): VNode {
      const style = [{ display: 'contents' }, attrs.style];
      const result = h(
        tag,
        { ...attrs, style: [{ display: 'contents' }, variables(), attrs.style] },
        [content],
      );
      nativeStyles.set(result, style);
      return result;
    },
  };
}
