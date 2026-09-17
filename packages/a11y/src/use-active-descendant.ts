/**
 * `useActiveDescendant` —— combobox 的 `aria-activedescendant` 管理。
 *
 * 适用于「焦点留在输入框上、用 `aria-activedescendant` 指向当前选项」的控件
 * （Select / AutoComplete / TreeSelect / Cascader）。
 *
 * 三个 id 的关系（`OptionList.js:237-281`）：
 *   ```
 *   输入框  aria-controls        = `${baseId}_list`
 *           aria-activedescendant = `${baseId}_list_${index}`
 *   列表框  id                    = `${baseId}_list`
 *   选项    id                    = `${baseId}_list_${index}`
 *   ```
 *
 * ⚠️ 本组合式**只产出 id**，不渲染任何东西 —— DOM 结构属组件层（契约文档 §4）。
 *    `baseId` 复用 `@apollo-design/utils` 的 `useId`，本包不重复实现（`notDo` 第三条）。
 */

import { useId } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';
import { getListboxId, getOptionId } from './combobox';
import { NO_ACTIVE_INDEX } from './roving';

export interface UseActiveDescendantOptions {
  /** 显式指定基 id；不传则由 `useId` 生成 */
  id?: string;
  /** 当前项下标；`-1` / `undefined` 表示没有活动项（此时 `aria-activedescendant` 应为 `undefined`） */
  activeIndex?: MaybeRefOrGetter<number | undefined>;
}

export interface UseActiveDescendantReturn {
  /** 基 id */
  baseId: string;
  /** 列表框的 id，也是输入框 `aria-controls` 的取值 */
  listboxId: string;
  /** 输入框 `aria-activedescendant` 的取值；没有活动项时是 `undefined` */
  activeDescendantId: ComputedRef<string | undefined>;
  /** 第 `index` 个选项的 id */
  getOptionId(index: number): string;
}

export function useActiveDescendant(
  options: UseActiveDescendantOptions = {},
): UseActiveDescendantReturn {
  const baseId = useId(options.id);
  const listboxId = getListboxId(baseId);

  const activeDescendantId = computed(() => {
    const index = toValue(options.activeIndex);
    if (index === undefined || index === NO_ACTIVE_INDEX) {
      return undefined;
    }
    return getOptionId(baseId, index);
  });

  return {
    baseId,
    listboxId,
    activeDescendantId,
    getOptionId: (index: number) => getOptionId(baseId, index),
  };
}
