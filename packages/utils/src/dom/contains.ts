/**
 * `contains(root, n)` —— `n` 是否在 `root` 之内（含 `root` 自身）。
 *
 * 契约来源：`@rc-component/util/Dom/contains`。
 *
 * 优先走原生 `Node.contains`；没有时沿 `parentNode` 上溯。
 * `root` 为 falsy 时返回 `false`（而不是抛错）—— 浮层关闭瞬间 ref 已置空是常态。
 */
export default function contains(root: Node | null | undefined, n?: Node | null): boolean {
  if (!root) {
    return false;
  }

  if (root.contains) {
    return root.contains(n ?? null);
  }

  let node: Node | null | undefined = n;
  while (node) {
    if (node === root) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}
