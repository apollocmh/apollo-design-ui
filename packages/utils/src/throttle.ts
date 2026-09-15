/**
 * `throttle` / `debounce`。
 *
 * 契约来源：`throttle-debounce@5.0.2`（antd 的依赖，`spin` 使用 `debounce`）。
 * 语义按该包 v5 的**可观测行为**复刻，不复制其源码。
 *
 * 关于"为什么不直接复用这个包"（决策记录）：
 *   它确实是框架无关的（零依赖、零 peer），按 ADR 0002 的复用策略本可直接依赖。
 *   选择原生实现的理由是：它**没有附带类型声明**（需要额外引入 @types/...），
 *   而我们的产物要求类型是一等公民；同时核心逻辑不足 100 行，复刻风险可控。
 *   ⚠️ 若后续任何消费者发现行为差异，正确的动作是改为直接依赖该包，而不是继续修补我们的实现。
 *
 * 与直觉不同的几点（测试会锁定）：
 *   1. `cancel()` 会**永久**置 `cancelled = true`，此后该 wrapper 完全失效。
 *      传 `{ upcomingOnly: true }` 则只清掉待执行的定时器，wrapper 仍可用。
 *   2. `debounce(delay, cb, { atBegin: true })` 是**前缘**去抖：立即执行一次，然后静默 `delay`。
 *   3. `throttle` 的 `noLeading` + `noTrailing` 同时为 `true` 时，callback **永不执行**（不是"至少执行一次"）。
 */

type AnyFn = (...args: never[]) => void;

export interface CancelOptions {
  /** 只取消待执行的那一次，不使 wrapper 永久失效。 */
  upcomingOnly?: boolean;
}

export interface ThrottledFn<F extends AnyFn = AnyFn> {
  (...args: Parameters<F>): void;
  cancel(options?: CancelOptions): void;
}

export interface ThrottleOptions {
  /** 为 `true` 时不执行尾随调用（只在节流窗口的首次触发）。 */
  noTrailing?: boolean;
  /** 为 `true` 时跳过窗口内的首次触发。 */
  noLeading?: boolean;
  /** 内部使用：`true` = 前缘去抖，`false` = 后缘去抖，`undefined` = 纯节流。 */
  debounceMode?: boolean;
}

/**
 * 节流：限制 `callback` 在 `delay` 毫秒内的执行次数。
 *
 * @param delay 零或更大的毫秒数
 * @param callback 被节流的函数。调用时的 `this` 与全部实参原样透传。
 * @param options 见 {@link ThrottleOptions}
 */
export function throttle<F extends AnyFn>(
  delay: number,
  callback: F,
  options?: ThrottleOptions,
): ThrottledFn<F> {
  const noTrailing = options?.noTrailing ?? false;
  const noLeading = options?.noLeading ?? false;
  const debounceMode = options?.debounceMode;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;
  /** 上一次真正执行 callback 的时间戳。 */
  let lastExec = 0;

  function clearExistingTimeout(): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }

  function cancel(cancelOptions?: CancelOptions): void {
    const upcomingOnly = cancelOptions?.upcomingOnly ?? false;
    clearExistingTimeout();
    // ⚠️ 默认不是"只清定时器"，而是把整个 wrapper 作废
    cancelled = !upcomingOnly;
  }

  function wrapper(this: unknown, ...args: Parameters<F>): void {
    const self = this;
    const elapsed = Date.now() - lastExec;
    if (cancelled) return;

    function exec(): void {
      lastExec = Date.now();
      (callback as (...a: Parameters<F>) => void).apply(self, args);
    }

    function clear(): void {
      timeoutId = undefined;
    }

    // 前缘去抖：窗口内第一次调用立即执行
    if (!noLeading && debounceMode && timeoutId === undefined) {
      exec();
    }

    clearExistingTimeout();

    if (debounceMode === undefined && elapsed > delay) {
      if (noLeading) {
        // 已经过了窗口，但要求跳过前缘 → 只推进时间戳，把执行推到尾随
        lastExec = Date.now();
        if (!noTrailing) {
          timeoutId = setTimeout(exec, delay);
        }
      } else {
        exec();
      }
    } else if (noTrailing !== true) {
      // 尾随调用：距离上次执行还差 `delay - elapsed`
      timeoutId = setTimeout(
        debounceMode ? clear : exec,
        debounceMode === undefined ? delay - elapsed : delay,
      );
    }
  }

  wrapper.cancel = cancel;
  return wrapper as ThrottledFn<F>;
}

export interface DebounceOptions {
  /** 为 `true` 时在前缘执行（立即执行一次，随后静默 `delay`）。默认 `false`（后缘）。 */
  atBegin?: boolean;
}

/**
 * 去抖：保证一连串调用中 `callback` 只执行一次 —— 要么在最前，要么在最后。
 */
export function debounce<F extends AnyFn>(
  delay: number,
  callback: F,
  options?: DebounceOptions,
): ThrottledFn<F> {
  const atBegin = options?.atBegin ?? false;
  return throttle(delay, callback, { debounceMode: atBegin !== false });
}
