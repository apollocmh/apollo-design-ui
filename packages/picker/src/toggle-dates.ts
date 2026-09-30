/**
 * 多选模式的「切换一个日期」。
 *
 * 读源码作规格：`@rc-component/picker@1.12.2` 的 `es/hooks/useToggleDates.js`（17 行）。
 * ⚠️ 上游那个 hook 本身**没有** `import React`，但它的消费方（`PickerPanel`）
 * 有 ⇒ 不满足「零 React 耦合文件」的固化条件，因此不进 `oracle/upstream/`，
 * 由 `src/__tests__/toggle-dates.test.ts` 覆盖（判据同契约 §2.1）。
 *
 * 语义：目标值**已在列表里**（按 `panelMode` 粒度判等）就移除，否则追加到**末尾**。
 * ⚠️ 返回的是**新数组**（不可变），移除时保持原顺序。
 */

import { isSame } from './date-util';
import type { GenerateConfig, PanelMode, PickerLocale } from './types';

/**
 * 在 `list` 上切换 `target`。
 *
 * ⚠️ 判等粒度是 `panelMode` —— 所以 `picker="week"` 时「同一周的另一天」会被
 * 当成同一个元素移除。`list` 里可以含 `null`（未选择的槽位），
 * `isSame` 对空值返回 `false`，不会误命中。
 */
export function toggleDates<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: PickerLocale,
  panelMode: PanelMode,
  list: readonly (DateType | null | undefined)[],
  target: DateType,
): (DateType | null | undefined)[] {
  const index = list.findIndex(
    (date) => date != null && isSame(generateConfig, locale, date, target, panelMode),
  );
  if (index === -1) {
    return [...list, target];
  }
  const sliceList = [...list];
  sliceList.splice(index, 1);
  return sliceList;
}
