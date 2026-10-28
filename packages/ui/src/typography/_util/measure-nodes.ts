import {
  Comment,
  createTextVNode,
  Fragment,
  h,
  isVNode,
  Static,
  Teleport,
  Text,
  type VNode,
  type VNodeChild,
} from 'vue';

function isNode(value: unknown): value is Node {
  return (
    !!value &&
    typeof value === 'object' &&
    'nodeType' in value &&
    typeof value.nodeType === 'number' &&
    'cloneNode' in value
  );
}
function isElement(value: unknown): value is Element {
  return isNode(value) && value.nodeType === 1 && 'attributes' in value;
}
function propsForMeasure(props: Record<string, unknown> | null): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props ?? {})) {
    if (key !== 'ref' && key !== 'key' && key !== 'autofocus' && !key.startsWith('on'))
      result[key] = value;
  }
  return result;
}
function fromDom(node: Node): VNodeChild {
  if (node.nodeType === 3) return createTextVNode(node.textContent ?? '');
  if (!isElement(node)) return null;
  if (node.localName === 'script' || node.localName === 'style') return null;
  const props: Record<string, unknown> = {};
  for (const attribute of Array.from(node.attributes)) props[attribute.name] = attribute.value;
  if ('value' in node && typeof node.value === 'string') props.value = node.value;
  return h(node.localName, propsForMeasure(props), Array.from(node.childNodes).map(fromDom));
}
/** Project mounted native output. Measurement never mounts a second business component. */
export function measureNodes(content: VNodeChild, mounted: VNodeChild): VNodeChild {
  const live: VNode[] = [];
  const collect = (value: VNodeChild): void => {
    if (Array.isArray(value)) {
      for (const child of value) collect(child);
      return;
    }
    if (!isVNode(value)) return;
    if (value.suspense?.activeBranch) collect(value.suspense.activeBranch);
    if (value.component) {
      live.push(value);
      collect(value.component.subTree);
    }
    if (Array.isArray(value.children)) for (const child of value.children) collect(child);
  };
  collect(mounted);
  const project = (value: VNodeChild): VNodeChild => {
    if (Array.isArray(value)) return value.map(project);
    if (!isVNode(value)) return value;
    if (value.suspense?.activeBranch) return project(value.suspense.activeBranch);
    if (value.component) return project(value.component.subTree);
    if (value.type === Teleport)
      return value.props?.disabled && Array.isArray(value.children)
        ? value.children.map(project)
        : null;
    if (value.type === Comment) return null;
    if (value.type === Text)
      return createTextVNode(typeof value.children === 'string' ? value.children : '');
    if (value.type === Static) {
      const start: unknown = value.el,
        end: unknown = value.anchor;
      if (!isNode(start)) return null;
      const nodes: VNodeChild[] = [];
      for (let at: Node | null = start; at; at = at.nextSibling) {
        nodes.push(fromDom(at));
        if (!isNode(end) || at === end) break;
      }
      return nodes;
    }
    const children = Array.isArray(value.children)
      ? value.children.map(project)
      : typeof value.children === 'string'
        ? value.children
        : [];
    if (value.type === Fragment) return h(Fragment, null, [children]);
    if (typeof value.type === 'string') {
      if (value.type === 'script' || value.type === 'style') return null;
      const props = propsForMeasure(value.props);
      const element: unknown = value.el;
      if (
        isElement(element) &&
        (value.type.includes('-') ||
          ['iframe', 'img', 'video', 'audio', 'object', 'embed', 'canvas'].includes(value.type))
      ) {
        const box = element.getBoundingClientRect();
        const style = element.ownerDocument.defaultView?.getComputedStyle(element);
        return h('span', {
          style: {
            display:
              style?.display === 'none'
                ? 'none'
                : style?.display.startsWith('inline')
                  ? 'inline-block'
                  : 'block',
            width: `${box.width}px`,
            height: `${box.height}px`,
            margin: style?.margin,
            verticalAlign: style?.verticalAlign,
          },
        });
      }
      if (isElement(element) && 'value' in element && typeof element.value === 'string')
        props.value = element.value;
      return h(value.type, props, children);
    }
    for (let index = live.length - 1; index >= 0; index--) {
      const current = live[index];
      if (current?.type === value.type && current.key === value.key && current.component)
        return project(current.component.subTree);
    }
    return null;
  };
  return project(content);
}
