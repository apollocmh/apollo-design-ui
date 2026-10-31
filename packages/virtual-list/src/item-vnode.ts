import {
  Comment,
  createTextVNode,
  Fragment,
  isVNode,
  Text,
  type VNode,
  type VNodeChild,
} from 'vue';

/** Unwrap transparent slot fragments; a row still needs exactly one measurable root. */
export function singleItemVNode(content: VNodeChild): VNode | null {
  const nodes: VNode[] = [];
  function visit(value: VNodeChild): void {
    if (Array.isArray(value)) {
      for (const child of value) visit(child);
      return;
    }
    if (isVNode(value)) {
      if (
        value.type === Comment ||
        (value.type === Text && String(value.children ?? '').trim() === '')
      )
        return;
      if (value.type === Fragment && Array.isArray(value.children)) {
        for (const child of value.children) visit(child);
      } else nodes.push(value);
    } else if (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) {
      nodes.push(createTextVNode(String(value)));
    }
  }
  visit(content);
  const node = nodes[0];
  if (nodes.length !== 1 || !node || node.type === Text || node.type === Fragment) return null;
  return node;
}
