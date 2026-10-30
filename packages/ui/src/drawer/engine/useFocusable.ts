import { containsComposed, getActiveElement, useLockFocus } from '@apollo-design/utils';
import { computed, type MaybeRefOrGetter, onScopeDispose, toValue, watch } from 'vue';

// Historical reference: @rc-component/drawer 1.4.2 es/hooks/useFocusable.js.

/** Focus belongs to the actual popup root and its document, including late Portal mounts. */
export function useFocusable(
  getContainer: () => HTMLElement | null,
  open: MaybeRefOrGetter<boolean>,
  autoFocus: MaybeRefOrGetter<boolean | undefined>,
  focusTrap: MaybeRefOrGetter<boolean | undefined>,
  mask: MaybeRefOrGetter<boolean>,
  focusTriggerAfterClose: MaybeRefOrGetter<boolean | undefined>,
): () => void {
  const mergedFocusTrap = computed(() => toValue(focusTrap) ?? toValue(mask));
  let lastActive: Element | null = null;

  // Capture before focus-lock's mounted/post effects, using the real owner document.
  watch(
    [() => toValue(open), getContainer],
    ([isOpen, element], [wasOpen, previousElement]) => {
      if (isOpen && element && (!wasOpen || !previousElement))
        lastActive = getActiveElement(element);
    },
    { flush: 'sync' },
  );

  useLockFocus(() => toValue(open) && mergedFocusTrap.value, getContainer);
  watch(
    [() => toValue(open), getContainer],
    ([isOpen, element], [wasOpen, previousElement]) => {
      if (isOpen && element && (!wasOpen || element !== previousElement) && toValue(autoFocus)) {
        element.focus({ preventScroll: true });
      }
    },
    { flush: 'post' },
  );

  const restoreFocus = () => {
    const target = lastActive;
    lastActive = null;
    if (
      toValue(focusTriggerAfterClose) !== false &&
      target?.isConnected &&
      !containsComposed(getContainer(), target) &&
      'focus' in target &&
      typeof target.focus === 'function'
    )
      target.focus({ preventScroll: true });
  };
  // Conditional unmounts still return focus and release the lock without a leave animation.
  onScopeDispose(restoreFocus);
  return restoreFocus;
}
