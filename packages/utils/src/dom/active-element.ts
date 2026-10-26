function isFocusRoot(node: Node): node is Document | ShadowRoot {
  return (node.nodeType === 9 || node.nodeType === 11) && 'activeElement' in node;
}
export function isShadowRoot(node: Node): node is ShadowRoot {
  return (
    node.nodeType === 11 &&
    'host' in node &&
    !!node.host &&
    typeof node.host === 'object' &&
    'nodeType' in node.host &&
    node.host.nodeType === 1
  );
}

/** Read focus relative to a known node, including its closed root and open descendants. */
export function getActiveElement(node?: Node | null): Element | null {
  const root = node?.getRootNode();
  let active =
    (root && isFocusRoot(root) ? root.activeElement : null) ??
    node?.ownerDocument?.activeElement ??
    (typeof document === 'undefined' ? null : document.activeElement);
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

/** DOM containment across shadow hosts without changing native contains() semantics. */
export function containsComposed(
  root: Node | null | undefined,
  node: Node | null | undefined,
): boolean {
  if (!root) return false;
  let current = node;
  while (current) {
    if (root === current || root.contains(current)) return true;
    const tree = current.getRootNode();
    current = isShadowRoot(tree) ? tree.host : null;
  }
  return false;
}
