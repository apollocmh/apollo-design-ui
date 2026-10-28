import { getDOM } from '@apollo-design/utils';
import { onBeforeUpdate, onUpdated, type Ref } from 'vue';

/** Native keyed DOM moves can blur an editor; restore only a still-owned focus lost to body. */
export function useSpaceFocus(root: Readonly<Ref<HTMLElement | null>>): void {
  let previous: Element | null = null;
  onBeforeUpdate(() => {
    const element = root.value;
    const active = element?.ownerDocument.activeElement;
    previous = element && active && element.contains(active) ? active : null;
  });
  onUpdated(() => {
    const target = getDOM(previous);
    previous = null;
    if (
      target?.isConnected &&
      root.value?.contains(target) &&
      target.ownerDocument.activeElement === target.ownerDocument.body
    ) {
      target.focus({ preventScroll: true });
    }
  });
}
