/**
 * `useMergedArrow` —— antd `components/tooltip/hook/useMergedArrow.ts` 的 Vue 版。
 *
 * `arrow` prop 与 ConfigProvider.tooltip.arrow 的合并：prop 优先、`show` 默认 true。
 */
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

export interface MergedArrow {
  show: boolean;
  pointAtCenter?: boolean;
}

type ArrowInput = boolean | { pointAtCenter?: boolean } | undefined;

const toConfig = (arrow?: ArrowInput): Partial<MergedArrow> =>
  typeof arrow === 'boolean' ? { show: arrow } : (arrow ?? {});

export function useMergedArrow(
  providedArrow: MaybeRefOrGetter<ArrowInput>,
  providedContextArrow: MaybeRefOrGetter<ArrowInput>,
) {
  return computed<MergedArrow>(() => {
    const arrowConfig = toConfig(toValue(providedArrow));
    const contextArrowConfig = toConfig(toValue(providedContextArrow));

    return {
      ...contextArrowConfig,
      ...arrowConfig,
      show: arrowConfig.show ?? contextArrowConfig.show ?? true,
    };
  });
}
