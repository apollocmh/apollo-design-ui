/**
 * 延迟编排。
 *
 * 契约来源：`@rc-component/trigger@3.10.1/es/hooks/useDelay.js`
 * 逐条对照见 `docs/foundation/overlay-contract.md` §3.2。
 *
 * ---------------------------------------------------------------------------
 * ⭐ 单位是**秒**，不是毫秒
 * ---------------------------------------------------------------------------
 *
 * antd 侧所有默认值都是秒：
 *
 * | 来源 | 值 |
 * |---|---|
 * | `trigger` 的 `mouseLeaveDelay`（`index.js:44`） | `0.1` |
 * | Tooltip / Popover / Popconfirm 的 `mouseEnterDelay`、`mouseLeaveDelay` | `0.1` |
 * | Dropdown 的 `mouseEnterDelay` / `mouseLeaveDelay` | `0.15` / `0.1` |
 * | `mouseEnterDelay` / `focusDelay` / `blurDelay` in trigger | **无默认值** |
 *
 * ---------------------------------------------------------------------------
 * ⭐⭐ `0` 与 `undefined` 不是一回事
 * ---------------------------------------------------------------------------
 *
 * rc 的实现是 `if (delay === 0) callback() else setTimeout(callback, delay * 1000)`。
 * `delay` 为 `undefined` 时算出的 `NaN` 被浏览器当作 `0`，于是走 `setTimeout` 分支 ——
 * 也就是**下一个宏任务**才执行，而 `0` 是**同步**执行。
 *
 * 这个差异可观测（比如「同步派发的 click 之后立刻读 DOM」），所以保留成两个不同的 kind，
 * 不要合并。裁决见契约 §8 P1。
 */

/** `resolveDelay` 的结果。`immediate` 为真时**同步**调用，否则是下一个宏任务。 */
export type DelayResolution =
  | { readonly immediate: true; readonly ms: 0 }
  | { readonly immediate: false; readonly ms: number };

/**
 * 把「秒」解析成执行方式。
 *
 * @param delay 秒。`undefined` 表示"上游没给默认值"。
 */
export function resolveDelay(delay: number | undefined): DelayResolution {
  if (delay === 0) {
    return { immediate: true, ms: 0 };
  }
  const ms = Number(delay) * 1000;
  return { immediate: false, ms: Number.isNaN(ms) ? 0 : ms };
}

/** 可注入的定时器 —— 生产用全局，测试用 fake timers（或更严格的自定义实现）。 */
export interface DelayTimers {
  setTimeout: (callback: () => void, ms: number) => number | object;
  clearTimeout: (handle: number | object | null | undefined) => void;
}

const defaultTimers: DelayTimers = {
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => {
    if (handle !== null && handle !== undefined) {
      clearTimeout(handle as number);
    }
  },
};

export interface DelayInvoker {
  /**
   * 排一次延迟调用。**总是先取消上一个待执行的**（rc 的 `clearDelay()`）。
   * 不排队 —— 连续两次 `triggerOpen(true, 0.1)` 只有最后一次生效。
   */
  invoke: (callback: () => void, delay: number | undefined) => void;
  /** 取消待执行的调用。卸载时必须调（rc 在 `useEffect` 的 cleanup 里做）。 */
  clear: () => void;
  /** 是否有待执行的调用。测试用。 */
  readonly pending: boolean;
}

export function createDelayInvoker(timers: DelayTimers = defaultTimers): DelayInvoker {
  let handle: number | object | null = null;

  const clear = (): void => {
    if (handle !== null) {
      timers.clearTimeout(handle);
      handle = null;
    }
  };

  return {
    invoke(callback, delay) {
      clear();
      const resolution = resolveDelay(delay);
      if (resolution.immediate) {
        callback();
        return;
      }
      handle = timers.setTimeout(() => {
        handle = null;
        callback();
      }, resolution.ms);
    },
    clear,
    get pending() {
      return handle !== null;
    },
  };
}
