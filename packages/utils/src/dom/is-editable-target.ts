/** Native editing targets, including composed events from another document/root. */
export function isEditableTarget(event: KeyboardEvent): boolean {
  const path = event.composedPath();
  if (!path.length && event.target) path.push(event.target);
  for (const target of path) {
    if (!isElement(target)) continue;
    if (
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
      ('isContentEditable' in target && target.isContentEditable === true)
    )
      return true;
    const editable = target.getAttribute('contenteditable');
    if (editable === 'false') return false;
    if (editable === '' || editable === 'true' || editable === 'plaintext-only') return true;
  }
  return false;
}

function isElement(target: EventTarget): target is Element {
  return (
    'nodeType' in target &&
    target.nodeType === 1 &&
    'tagName' in target &&
    typeof target.tagName === 'string' &&
    'getAttribute' in target &&
    typeof target.getAttribute === 'function'
  );
}
