/**
 * 计数三件套 —— `@rc-component/input` 的 `hooks/useCount*` 行为等价物。
 *
 * antd 的字数统计不是「显示长度」这么简单：它同时负责**裁剪**（exceedFormatter）
 * 与**计数策略**（strategy，默认 `value.length`，可换 grapheme/自定义），
 * 且裁剪在**输入法组合态**下必须让路（否则中文打到一半被截断）。
 */

/** `count` / `showCount` 合并后的配置。 */
export interface CountConfig {
  show: boolean;
  showFormatter?: (info: { value: string; count: number; maxLength?: number }) => unknown;
  strategy: (value: string) => number;
  max?: number;
  exceedFormatter?: (value: string, info: { max: number }) => string;
}

export interface InputCountProp {
  max?: number;
  strategy?: (value: string) => number;
  exceedFormatter?: (value: string, info: { max: number }) => string;
  show?: boolean | ((info: { value: string; count: number; maxLength?: number }) => unknown);
}

/** rc 的 `useCount(count, showCount)`。 */
export function useCount(
  count: InputCountProp | undefined,
  showCount:
    | boolean
    | {
        show?: boolean | ((info: { value: string; count: number; maxLength?: number }) => unknown);
        formatter?: CountConfig['showFormatter'];
      }
    | ((info: { value: string; count: number; maxLength?: number }) => unknown)
    | undefined,
): CountConfig {
  const merged: Record<string, unknown> = {};
  if (showCount) {
    merged.show =
      typeof showCount === 'object'
        ? (showCount.formatter ?? true)
        : typeof showCount === 'function'
          ? showCount
          : !!showCount;
  }
  Object.assign(merged, count);
  const { show, ...rest } = merged as { show?: unknown } & Partial<CountConfig>;
  return {
    ...rest,
    show: !!show,
    showFormatter: typeof show === 'function' ? (show as CountConfig['showFormatter']) : undefined,
    strategy: rest.strategy ?? ((value: string) => value.length),
  };
}

/** rc 的 `inCountRange`。 */
export function inCountRange(value: string, countConfig: CountConfig): boolean {
  if (!countConfig.max) {
    return true;
  }
  return countConfig.strategy(value) <= countConfig.max;
}

export interface CountDisplay {
  mergedMax?: number;
  isOutOfRange: boolean;
  dataCount?: string | number;
}

/** rc 的 `useCountDisplay`。 */
export function useCountDisplay(info: {
  countConfig: CountConfig;
  value: string;
  maxLength?: number;
}): CountDisplay {
  const { countConfig, value, maxLength } = info;
  const mergedMax = countConfig.max ?? maxLength;
  const valueLength = countConfig.strategy(value);
  const isOutOfRange = !!mergedMax && valueLength > mergedMax;
  const hasMaxLength = Number(mergedMax) > 0;
  const dataCount = countConfig.show
    ? countConfig.showFormatter
      ? (countConfig.showFormatter({ value, count: valueLength, maxLength: mergedMax }) as
          | string
          | number)
      : `${valueLength}${hasMaxLength ? ` / ${mergedMax}` : ''}`
    : undefined;
  return { mergedMax, isOutOfRange, dataCount };
}

/**
 * rc 的 `useCountExceed`：超长时按 `exceedFormatter` 裁剪，并在值被改动后
 * 恢复选区（否则光标会跳到末尾）。组合态期间**不裁剪**。
 */
export function useCountExceed(
  countConfig: () => CountConfig,
  getTarget: () => HTMLInputElement | HTMLTextAreaElement | null,
): (currentValue: string, isComposing: boolean) => string {
  let pendingSelection: [number, number] | null = null;

  return function getExceedValue(currentValue: string, isComposing: boolean): string {
    const config = countConfig();
    let nextValue = currentValue;
    if (
      !isComposing &&
      config.exceedFormatter &&
      config.max &&
      config.strategy(currentValue) > config.max
    ) {
      nextValue = config.exceedFormatter(currentValue, { max: config.max });
      if (currentValue !== nextValue) {
        const target = getTarget();
        pendingSelection = [target?.selectionStart ?? 0, target?.selectionEnd ?? 0];
      }
    }
    // 选区恢复：与 rc 的 effect 同步语义（这里在下一个 tick 由调用方 flushSelection 完成）
    if (pendingSelection) {
      const selection = pendingSelection;
      pendingSelection = null;
      const target = getTarget();
      if (target) {
        void Promise.resolve().then(() => {
          try {
            target.setSelectionRange(selection[0], selection[1]);
          } catch {
            // 部分类型不支持 setSelectionRange（如 email），上游同样吞掉
          }
        });
      }
    }
    return nextValue;
  };
}
