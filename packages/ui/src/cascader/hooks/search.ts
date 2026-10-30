/**
 * Cascader 的搜索 hooks —— `useSearchConfig` / `useSearchOptions` 的 Vue 版。
 *
 * 判据（docs/analysis/cascader.md §3.4）：
 * - `showSearch` 为对象时合入默认配置（`matchInputWidth: true` / `limit: 50`）；
 * - `limit <= 0` 视为 false（不限制）；
 * - 过滤只在**叶子**（或 changeOnSelect / 多选的任意层）上做；命中的结果项用
 *   `render` 产出 label（antd 薄壳会注入带高亮的 render），并挂 `SEARCH_MARK`
 *   保存完整路径（展示与回填都需要它）；
 * - `sort` 提供时覆盖默认顺序。
 */

import { type ComputedRef, computed, type Ref } from 'vue';

import {
  type BaseOptionType,
  type FieldNames,
  type FilledFieldNames,
  fillFieldNames,
  getOptionChildren,
  getOptionLabel,
  getOptionValue,
  getSearchPath,
  SEARCH_MARK,
} from '../utils';

export interface SearchConfig {
  filter?: (
    searchValue: string,
    pathOptions: BaseOptionType[],
    fieldNames: { label: string },
  ) => boolean;
  render?: (
    inputValue: string,
    pathOptions: BaseOptionType[],
    prefixCls: string,
    fieldNames: FieldNames,
  ) => unknown;
  sort?: (
    a: BaseOptionType[],
    b: BaseOptionType[],
    searchValue: string,
    fieldNames: FieldNames,
  ) => number;
  matchInputWidth?: boolean;
  limit?: number | false;
  autoClearSearchValue?: boolean;
}

/** `showSearch` → [是否开启, 配置]（上游 useSearchConfig）。 */
export function normalizeSearchConfig(
  showSearch: boolean | Omit<SearchConfig, 'render'> | undefined,
  props: { autoClearSearchValue?: boolean },
): [boolean, SearchConfig] {
  if (!showSearch) return [false, {}];

  let searchConfig: SearchConfig = {
    matchInputWidth: true,
    limit: 50,
    autoClearSearchValue: props.autoClearSearchValue,
  };
  if (showSearch && typeof showSearch === 'object') {
    const {
      filter,
      sort,
      matchInputWidth = true,
      limit = 50,
      autoClearSearchValue = props.autoClearSearchValue,
    } = showSearch;
    searchConfig = { filter, sort, matchInputWidth, limit, autoClearSearchValue };
  }
  if (typeof searchConfig.limit === 'number' && searchConfig.limit <= 0) {
    searchConfig.limit = false;
  }
  return [true, searchConfig];
}

const defaultFilter = (
  search: string,
  options: BaseOptionType[],
  { label = '' }: { label?: string },
): boolean =>
  options.some((opt) =>
    String(opt[label] ?? '')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

const defaultRender = (
  _inputValue: string,
  path: BaseOptionType[],
  _prefixCls: string,
  fieldNames: FieldNames,
): unknown => {
  const fields = fillFieldNames(fieldNames);
  const labels = path.map((option) =>
    getOptionLabel(option, fields, getOptionValue(option, fields)),
  );
  return labels.every((label) => typeof label === 'string' || typeof label === 'number')
    ? labels.join(' / ')
    : labels.flatMap((label, index) => (index ? [' / ', label] : [label]));
};

/** 搜索态的候选 options（过滤 + render + limit + sort；上游 useSearchOptions）。 */
export function computeSearchOptions(
  search: string,
  options: BaseOptionType[],
  fieldNames: FilledFieldNames,
  prefixCls: string,
  config: SearchConfig,
  enableHalfPath: boolean,
): BaseOptionType[] {
  const { filter = defaultFilter, render = defaultRender, limit = 50, sort } = config;

  const filteredOptions: BaseOptionType[] = [];
  if (!search) return [];

  function dig(
    list: BaseOptionType[],
    pathOptions: BaseOptionType[],
    parentDisabled = false,
  ): void {
    list.forEach((option) => {
      // 无 sort 且有 limit 时攒够即停（上游的 perf saving）
      if (!sort && limit !== false && limit > 0 && filteredOptions.length >= limit) return;

      const connectedPathOptions = [...pathOptions, option];
      const children = getOptionChildren(option, fieldNames);
      const mergedDisabled = parentDisabled || !!option.disabled;

      // 只在叶子（或 changeOnSelect / 多选的任意层）上做过滤
      if (!children || children.length === 0 || enableHalfPath) {
        if (filter(search, connectedPathOptions, { label: fieldNames.label })) {
          filteredOptions.push({
            ...option,
            disabled: mergedDisabled,
            [fieldNames.label]: render(search, connectedPathOptions, prefixCls, {
              label: fieldNames.label,
              value: fieldNames.value,
              children: fieldNames.children,
            }),
            [SEARCH_MARK]: connectedPathOptions,
            [fieldNames.children]: undefined,
          });
        }
      }
      if (children) {
        dig(children, connectedPathOptions, mergedDisabled);
      }
    });
  }
  dig(options, []);

  if (sort) {
    filteredOptions.sort((a, b) =>
      sort(getSearchPath(a) ?? [], getSearchPath(b) ?? [], search, {
        label: fieldNames.label,
        value: fieldNames.value,
        children: fieldNames.children,
      }),
    );
  }
  return limit !== false && limit > 0 ? filteredOptions.slice(0, limit) : filteredOptions;
}

/** 响应式包装（供组件层使用）。 */
export function useSearchOptions(
  search: Ref<string>,
  options: ComputedRef<BaseOptionType[]>,
  fieldNames: Ref<FilledFieldNames>,
  prefixCls: Ref<string>,
  config: Ref<SearchConfig>,
  enableHalfPath: boolean,
): ComputedRef<BaseOptionType[]> {
  return computed(() =>
    computeSearchOptions(
      search.value,
      options.value,
      fieldNames.value,
      prefixCls.value,
      config.value,
      enableHalfPath,
    ),
  );
}
