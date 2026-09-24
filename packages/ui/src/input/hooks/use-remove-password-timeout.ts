/**
 * `hooks/useRemovePasswordTimeout` —— Chrome 的密码自动填充规避。
 *
 * 契约来源：antd 6.6.4 `components/input/hooks/useRemovePasswordTimeout.ts`
 * （es 产物 21 行）。
 *
 * 背景：Chrome 会把 `type="password"` 的输入框在**失焦后一段时间**自动填充；
 * antd 的做法是在 focus / blur / change 时先清掉上一次的定时器，并在 focus 时
 * 立刻把 input 的 `type` 从 `password` 切走再切回（让浏览器丢失填充目标）。
 *
 * ⚠️ 这是**浏览器行为规避**，不是业务逻辑 —— 判据必须逐字保留，否则
 * autofill 相关的回归会复现（上游 issue 22611 一类）。
 */

import { onScopeDispose } from 'vue';

/** 自动填充的等待窗口（ms）。 */
const REMOVE_PASSWORD_TIMEOUT = 500;

export type RemovePasswordTimeout = () => void;

export function useRemovePasswordTimeout(
  getInput: () => { input?: HTMLInputElement | null } | null,
  enabled: boolean,
): RemovePasswordTimeout {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const clear = (): void => {
    clearTimeout(timeoutId);
  };

  onScopeDispose(clear);

  return function removePasswordTimeout(): void {
    if (!enabled) {
      return;
    }
    clear();
    timeoutId = setTimeout(() => {
      const input = getInput()?.input;
      if (input?.type !== 'password' || !input.value) {
        return;
      }
      // 切换 type 让浏览器失去自动填充目标
      input.setAttribute('type', 'text');
      input.setAttribute('type', 'password');
    }, REMOVE_PASSWORD_TIMEOUT);
  };
}
