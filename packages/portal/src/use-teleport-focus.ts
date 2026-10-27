import { isVNode, onBeforeUpdate, onScopeDispose, onUpdated, type VNode } from 'vue';
import { isNode } from './use-portal-document';

function isElement(value: unknown): value is Element {
  return isNode(value) && value.nodeType === 1;
}
function activeElement(node: Node): Element | null {
  const root = node.getRootNode();
  const candidate =
    'activeElement' in root ? root.activeElement : node.ownerDocument?.activeElement;
  let active = isElement(candidate) ? candidate : null;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}
function isFocusScope(node: Node): node is Document | ShadowRoot {
  return node.nodeType === 9 || (node.nodeType === 11 && 'host' in node);
}
function isActiveFrameDocument(doc: Document): boolean {
  if (!doc.hasFocus()) return false;
  for (
    let frame = doc.defaultView?.frameElement;
    frame;
    frame = frame.ownerDocument.defaultView?.frameElement
  ) {
    if (activeElement(frame) !== frame) return false;
  }
  return true;
}
function rememberScopes(node: Node, scopes: Map<Document | ShadowRoot, Element | null>): void {
  let at: Node | null = node;
  while (at) {
    const root = at.getRootNode();
    if (!isFocusScope(root)) return;
    scopes.set(root, root.activeElement);
    at = 'host' in root ? root.host : (root.defaultView?.frameElement ?? null);
  }
}
function owns(node: Node, active: Element): boolean {
  let current: Node | null = active;
  while (current) {
    if (node.contains(current)) return true;
    const root = current.getRootNode();
    current = 'host' in root && isNode(root.host) ? root.host : null;
  }
  return false;
}
/** Native Teleport moves keep node identity but may blur its owned editor. */
export function useTeleportFocus(destination: () => unknown) {
  let teleport: VNode | null = null;
  let pending:
    | {
        element: Element;
        destinationActive: Element | null;
        start: Node;
        parent: Node | null;
        target: unknown;
        disabled: boolean;
        scopes: Map<Document | ShadowRoot, Element | null>;
      }
    | undefined;
  onBeforeUpdate(() => {
    const previous = teleport;
    const inline = previous?.props?.disabled === true;
    const children = previous?.children;
    const first = Array.isArray(children) ? children.find(isVNode) : undefined;
    // Vue can leave targetStart in the former container after moving a Teleport.
    // The first mounted child and current end anchor identify its actual DOM range.
    const start: unknown = first?.el;
    const end: unknown = inline ? previous?.anchor : previous?.targetAnchor;
    if (pending) {
      const active = activeElement(pending.element);
      if (!active || active === pending.element.ownerDocument.body) return;
    }
    pending = undefined;
    if (!isNode(start) || !isNode(end)) return;
    const active = activeElement(start);
    if (!active || !isActiveFrameDocument(active.ownerDocument)) return;
    const target = destination();
    for (let node: Node | null = start; node && node !== end; node = node.nextSibling) {
      if (owns(node, active)) {
        const scopes = new Map<Document | ShadowRoot, Element | null>();
        rememberScopes(active, scopes);
        if (isNode(target)) rememberScopes(target, scopes);
        pending = {
          scopes,
          element: active,
          start,
          parent: start.parentNode,
          target: previous?.target,
          disabled: inline,
          destinationActive: activeElement(isNode(target) ? target : start),
        };
        break;
      }
    }
  });
  onUpdated(() => {
    const saved = pending;
    pending = undefined;
    if (!saved?.element.isConnected || !saved.start.isConnected) return;
    const moved =
      saved.start.parentNode !== saved.parent ||
      teleport?.target !== saved.target ||
      (teleport?.props?.disabled === true) !== saved.disabled;
    if (!moved) return;
    const active = activeElement(saved.element);
    if (active === saved.element) return;
    for (const [scope, before] of saved.scopes) {
      const current = scope.activeElement;
      const body = 'body' in scope ? scope.body : scope.ownerDocument.body;
      if (current && current !== before && current !== body) return;
    }
    if (active && active !== saved.element.ownerDocument.body && active !== saved.destinationActive)
      return;
    if ('focus' in saved.element && typeof saved.element.focus === 'function')
      saved.element.focus({ preventScroll: true });
  });
  onScopeDispose(() => {
    teleport = null;
    pending = undefined;
  });
  return <T extends VNode | null>(next: T): T => {
    teleport = next;
    return next;
  };
}
