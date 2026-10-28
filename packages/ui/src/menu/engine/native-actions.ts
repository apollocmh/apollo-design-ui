/** Editors own their text/navigation keys even when rendered inside menu data. */
export function isEditableMenuTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const editor = target.closest('input,textarea,select,[contenteditable]');
  return (
    !!editor &&
    (editor.matches('input,textarea,select') || editor.getAttribute('contenteditable') !== 'false')
  );
}

/** Only controls in this item participate; nested menu items own their actions. */
export function ownedMenuActions(item: HTMLElement): HTMLElement[] {
  return [...item.querySelectorAll('a[href],button')].filter((control): control is HTMLElement => {
    if (!(control instanceof HTMLElement) || control.closest('[data-menu-id]') !== item)
      return false;
    for (let node: HTMLElement | null = control; node && node !== item; node = node.parentElement) {
      const style = node.ownerDocument.defaultView?.getComputedStyle(node);
      if (
        node.hidden ||
        node.getAttribute('aria-hidden') === 'true' ||
        style?.display === 'none' ||
        style?.visibility === 'hidden'
      )
        return false;
    }
    return true;
  });
}
