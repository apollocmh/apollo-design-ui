/**
 * `useEscKeyDown` —— `@rc-component/portal@2.2.1` `es/useEscKeyDown.js` 的 Vue 版。
 *
 * 作用：给「浮层按 ESC 关闭」提供一个**全局层栈**。回调拿到的 `top` 表示
 * 「自己是不是最上层」—— 多层浮层同时打开时，只有最上层应该响应 ESC。
 *
 * 契约逐条对齐上游：
 *   1. 全局 `keydown`：只在 `event.key === 'Escape'` 且**不在输入法组合中**时触发；
 *   2. **IME 保护**：`compositionend` 之后 200ms 内的 Escape 被忽略（上游的
 *      `IME_LOCK_DURATION` —— 中文输入法按 ESC 取消候选词会顺带关掉浮层）；
 *   3. 从**栈顶往下**依次调用每一层的 `onEsc({ top: i === len - 1, event })`
 *      —— 注意是**每一层都调**，`top` 只是告知；要不要响应由回调自己决定
 *      （drawer 的用法就是 `if (top && keyboard) onClose(event)`）；
 *   4. `open` 为真时入栈 + 挂全局监听；`false` 时出栈；**栈空了才摘监听**。
 *
 * ⚠️ 与上游的差异（INTENDED）：上游 `useMemo` + `useEffect` 两条路径都做
 *   `ensure/clear`（一条同步保时序、一条负责 cleanup）；本仓合成**一个**
 *   `flush: 'sync'` 的 `watch` + `onScopeDispose`，可观测行为一致（更少的分支）。
 */
import { useId } from '@apollo-design/utils';
import { type MaybeRefOrGetter, onScopeDispose, toValue, watch } from 'vue';

export interface EscInfo {
  /** 自己是不是栈顶（最上层）。 */
  top: boolean;
  event: KeyboardEvent;
}

interface EscStackItem {
  id: string;
  onEsc: (info: EscInfo) => void;
}

let stack: EscStackItem[] = [];

/** 输入法组合结束后多久内忽略 ESC。 */
const IME_LOCK_DURATION = 200;

let lastCompositionEndTime = 0;

/** 全局 keydown（上游逐字：从栈顶往下遍历，`top` 只在最后一项为真）。 */
const onGlobalKeyDown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && !event.isComposing) {
    const now = Date.now();
    if (now - lastCompositionEndTime < IME_LOCK_DURATION) {
      return;
    }
    const len = stack.length;
    for (let i = len - 1; i >= 0; i -= 1) {
      stack[i]?.onEsc({ top: i === len - 1, event });
    }
  }
};

const onGlobalCompositionEnd = (): void => {
  lastCompositionEndTime = Date.now();
};

function attachGlobalEventListeners(): void {
  // ⚠️ SSR 守卫：`immediate: true` 的 watch 在 setup 期就会跑，此时没有 window
  //    （tooltip / popover / dropdown 的 SSR 冒烟会直接抛 `window is not defined`）
  if (typeof window === 'undefined') return;
  window.addEventListener('keydown', onGlobalKeyDown);
  window.addEventListener('compositionend', onGlobalCompositionEnd);
}

function detachGlobalEventListeners(): void {
  if (typeof window === 'undefined') return;
  if (stack.length === 0) {
    window.removeEventListener('keydown', onGlobalKeyDown);
    window.removeEventListener('compositionend', onGlobalCompositionEnd);
  }
}

export function useEscKeyDown(
  open: MaybeRefOrGetter<boolean>,
  onEsc: (info: EscInfo) => void,
): void {
  const id = useId();

  const ensure = (): void => {
    const existing = stack.find((item) => item.id === id);
    if (existing) {
      // 同 id 已在栈里 ⇒ 只更新回调（上游用 `useEvent` 保证回调永远是最新的）
      existing.onEsc = onEsc;
    } else {
      stack.push({ id, onEsc });
    }
  };

  const clear = (): void => {
    stack = stack.filter((item) => item.id !== id);
  };

  watch(
    () => !!toValue(open),
    (isOpen) => {
      if (isOpen) {
        ensure();
        attachGlobalEventListeners();
      } else {
        clear();
        detachGlobalEventListeners();
      }
    },
    { immediate: true, flush: 'sync' },
  );

  onScopeDispose(() => {
    clear();
    detachGlobalEventListeners();
  });
}

/**
 * 测试辅助（与上游 `_test` 同形）：`stack` 可读、`reset` **只**清 IME 计时器。
 * ⚠️ 上游注释写明「不清栈」—— 让 effect 的 cleanup 负责清，否则会漏摘监听。
 */
export const escKeyDownTest =
  process.env.NODE_ENV === 'test'
    ? {
        getStack: () => stack,
        reset: () => {
          lastCompositionEndTime = 0;
        },
      }
    : null;
