// Original Escape/IME contract: @rc-component/portal 2.2.1 useEscKeyDown.
// Apollo extends ownership to independent windows and honors native cancellation.
import { useId } from '@apollo-design/utils';
import { type MaybeRefOrGetter, onScopeDispose, toValue, watch } from 'vue';

export interface EscInfo {
  top: boolean;
  event: KeyboardEvent;
}
interface EscStackItem {
  id: string;
  onEsc: (info: EscInfo) => void;
}
interface WindowState {
  view: Window;
  stack: EscStackItem[];
  compositionEnd: number | null;
  keydown: (event: KeyboardEvent) => void;
  compositionend: () => void;
}
const states = new WeakMap<Window, WindowState>();
const activeStates = new Set<WindowState>();
const IME_LOCK_DURATION = 200;

function getState(view: Window): WindowState {
  const existing = states.get(view);
  if (existing) return existing;
  const state: WindowState = {
    view,
    stack: [],
    compositionEnd: null,
    keydown: (event) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        event.isComposing ||
        (state.compositionEnd !== null && Date.now() - state.compositionEnd < IME_LOCK_DURATION)
      )
        return;
      // Snapshot before callbacks: closing the top layer must not promote another
      // layer during the same event. Every original layer still receives top.
      const stack = [...state.stack];
      for (let i = stack.length - 1; i >= 0; i--)
        stack[i]?.onEsc({ top: i === stack.length - 1, event });
    },
    compositionend: () => {
      state.compositionEnd = Date.now();
    },
  };
  states.set(view, state);
  return state;
}
function clear(state: WindowState, item: EscStackItem) {
  state.stack = state.stack.filter((current) => current !== item);
  if (state.stack.length) return;
  state.view.removeEventListener('keydown', state.keydown);
  state.view.removeEventListener('compositionend', state.compositionend);
  activeStates.delete(state);
  states.delete(state.view);
}

/** Escape layers use native cancellation and IME protection in their own window. */
export function useEscKeyDown(
  open: MaybeRefOrGetter<boolean>,
  onEsc: (info: EscInfo) => void,
): void {
  useWindowEscKeyDown(open, onEsc, () => (typeof window === 'undefined' ? null : window));
}

/** Internal Portal variant; no additional public prop or package export. */
export function useWindowEscKeyDown(
  open: MaybeRefOrGetter<boolean>,
  onEsc: (info: EscInfo) => void,
  owner: MaybeRefOrGetter<Window | null>,
): void {
  const item: EscStackItem = { id: useId(), onEsc };
  let current: WindowState | undefined;
  const release = () => {
    if (current) clear(current, item);
    current = undefined;
  };
  watch(
    [() => !!toValue(open), () => toValue(owner)],
    ([isOpen, view]) => {
      release();
      if (!isOpen || !view) return;
      current = getState(view);
      current.stack.push(item);
      if (!activeStates.has(current)) {
        activeStates.add(current);
        view.addEventListener('keydown', current.keydown);
        view.addEventListener('compositionend', current.compositionend);
      }
    },
    { immediate: true, flush: 'sync' },
  );
  onScopeDispose(release);
}

/** Test-only inspection; reset preserves live registrations and their cleanup. */
export const escKeyDownTest =
  process.env.NODE_ENV === 'test'
    ? {
        getStack: () => [...activeStates].flatMap((state) => state.stack),
        reset: () => {
          for (const state of activeStates) state.compositionEnd = null;
        },
      }
    : null;
