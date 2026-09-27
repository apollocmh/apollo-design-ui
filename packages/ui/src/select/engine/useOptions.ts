/**
 * rc-select `hooks/useOptions.js` / `hooks/useCache.js` / `hooks/useFilterOptions.js` /
 * `hooks/useSearchConfig.js` / `hooks/useAllowClear.js` 的 Vue 版。
 *
 * 全部是**纯数据**组合式（不碰 DOM），便于 L1 逐分支覆盖。
 * 每个函数头都标注了对拍的 rc 文件与行号区间。
 */

import type { ComputedRef, Ref } from 'vue';
import { computed, unref } from 'vue';
import type {
  DefaultOptionType,
  FilterFunc,
  RawValueType,
  SearchConfig,
} from '../interface';
import type { LabelInValueType } from '../interface';
import type { ResolvedFieldNames } from './valueUtil';
import { convertChildrenToData, isValidCount, toArray } from './valueUtil';

// ---------------------------------------------------------------------------
// useOptions（rc hooks/useOptions.js，46 行）
// ---------------------------------------------------------------------------

export interface ParsedOptions {
  options: DefaultOptionType[];
  /** value → option（叶子项）。 */
  valueOptions: Map<RawValueType | null | undefined, DefaultOptionType>;
  /** label → option（供 `tokenSeparators` 的多选模式按 label 反查 value）。 */
  labelOptions: Map<unknown, DefaultOptionType>;
  childrenAsData: boolean;
}

function setLabelOptions(
  map: Map<unknown, DefaultOptionType>,
  option: DefaultOptionType,
  key: unknown,
): void {
  if (key && typeof key === 'string') {
    map.set(option[key as string], option);
  }
}

export function parseOptions(
  options: DefaultOptionType[] | undefined,
  childrenAsData: boolean,
  childrenData: DefaultOptionType[],
  fieldNames: ResolvedFieldNames,
  optionFilterProp: string[],
  optionLabelProp: string | undefined,
): ParsedOptions {
  const mergedOptions = options ?? childrenData;
  const valueOptions = new Map<RawValueType | null | undefined, DefaultOptionType>();
  const labelOptions = new Map<unknown, DefaultOptionType>();

  const dig = (optionList: DefaultOptionType[], isChildren = false): void => {
    for (let i = 0; i < optionList.length; i += 1) {
      const option = optionList[i];
      if (!option) continue;
      if (!option[fieldNames.options] || isChildren) {
        valueOptions.set((option[fieldNames.value] ?? undefined) as RawValueType | null, option);
        setLabelOptions(labelOptions, option, fieldNames.label);
        // https://github.com/ant-design/ant-design/issues/35304
        optionFilterProp.forEach((prop) => setLabelOptions(labelOptions, option, prop));
        setLabelOptions(labelOptions, option, optionLabelProp);
      } else {
        dig((option[fieldNames.options] as DefaultOptionType[]) ?? [], true);
      }
    }
  };

  dig(mergedOptions);
  return { options: mergedOptions, valueOptions, labelOptions, childrenAsData };
}

export interface UseOptionsInput {
  options: () => DefaultOptionType[] | undefined;
  /** 默认插槽的 vnode（`options` 缺省时才解析）。 */
  children: () => unknown;
  fieldNames: () => ResolvedFieldNames;
  optionFilterProp: () => string[];
  optionLabelProp: () => string | undefined;
}

export function useOptions(input: UseOptionsInput): ComputedRef<ParsedOptions> {
  return computed(() => {
    const options = input.options();
    const childrenAsData = !options;
    const childrenData = childrenAsData
      ? convertChildrenToData(input.children() as never)
      : [];
    return parseOptions(
      options,
      childrenAsData,
      childrenData,
      input.fieldNames(),
      input.optionFilterProp(),
      input.optionLabelProp(),
    );
  });
}

// ---------------------------------------------------------------------------
// useCache（rc hooks/useCache.js，39 行）
// ---------------------------------------------------------------------------

/**
 * 缓存「值 ↔ label / option」。
 *
 * 目的：option 列表异步变化（典型是搜索时过滤掉已选项）时，已选中的 tag 仍然
 * 显示得出 label。rc 用两个 Map + useMemo 做跨渲染缓存；Vue 侧用**非响应式**
 * 的 Map（它只做查表，不参与渲染依赖）+ computed 修补 label。
 */
export function useCache(
  labeledValues: Ref<LabelInValueType[]> | ComputedRef<LabelInValueType[]>,
  valueOptions: Ref<Map<RawValueType | null | undefined, DefaultOptionType>>,
): [ComputedRef<LabelInValueType[]>, (value: RawValueType) => DefaultOptionType | undefined] {
  let valueCache = new Map<RawValueType, LabelInValueType>();
  let optionCache = new Map<RawValueType, DefaultOptionType>();

  const filled = computed<LabelInValueType[]>(() => {
    const patched = unref(labeledValues).map((item) => {
      if (item.label === undefined && item.value !== undefined) {
        return { ...item, label: valueCache.get(item.value)?.label };
      }
      return item;
    });

    const nextValueCache = new Map<RawValueType, LabelInValueType>();
    const nextOptionCache = new Map<RawValueType, DefaultOptionType>();
    patched.forEach((item) => {
      if (item.value === undefined) return;
      nextValueCache.set(item.value, item);
      nextOptionCache.set(
        item.value,
        valueOptions.value.get(item.value) ??
          optionCache.get(item.value) ??
          ({} as DefaultOptionType),
      );
    });
    valueCache = nextValueCache;
    optionCache = nextOptionCache;
    return patched;
  });

  const getOption = (value: RawValueType): DefaultOptionType | undefined =>
    valueOptions.value.get(value) ?? optionCache.get(value);

  return [filled, getOption];
}

// ---------------------------------------------------------------------------
// useFilterOptions（rc hooks/useFilterOptions.js，58 行）
// ---------------------------------------------------------------------------

function includes(test: unknown, search: string): boolean {
  return toArray(test as unknown[]).join('').toUpperCase().includes(search);
}

/**
 * 默认过滤：**大小写不敏感**的 `includes`（两边都 `toUpperCase()`）。
 *
 * - 有 `optionFilterProp` ⇒ 按这些字段匹配；
 * - 否则：group（有 `options` 字段）先匹配自身 label，不匹配时过滤其子项；
 * - 叶子项按 `label` 匹配（`childrenAsData` 时 label 字段是 `children` ⇒ 上游
 *   hack 回 `label`），拿不到 label 时退化为按 `value` 匹配。
 */
export function filterOptions(
  options: DefaultOptionType[],
  fieldNames: ResolvedFieldNames,
  searchValue: string,
  filterOption: boolean | FilterFunc<DefaultOptionType> | undefined,
  optionFilterProp: string[],
): DefaultOptionType[] {
  if (!searchValue || filterOption === false) return options;

  const upperSearch = searchValue.toUpperCase();
  const customizeFilter = typeof filterOption === 'function';
  const filterFunc: FilterFunc<DefaultOptionType> = customizeFilter
    ? (filterOption as FilterFunc<DefaultOptionType>)
    : (_input, option) => {
        if (!option) return false;
        if (optionFilterProp.length) {
          return optionFilterProp.some((prop) => includes(option[prop], upperSearch));
        }
        if (option[fieldNames.options]) {
          // hack：group 的 label 字段名在 childrenAsData 时是 children
          const labelKey = fieldNames.label !== 'children' ? fieldNames.label : 'label';
          return includes(option[labelKey], upperSearch);
        }
        return includes(option[fieldNames.value], upperSearch);
      };

  const filteredOptions: DefaultOptionType[] = [];
  options.forEach((item) => {
    if (!item) return;
    if (item[fieldNames.options]) {
      if (filterFunc(searchValue, item)) {
        filteredOptions.push(item);
        return;
      }
      const subOptions = (item[fieldNames.options] as DefaultOptionType[]).filter((subItem) =>
        filterFunc(searchValue, subItem),
      );
      if (subOptions.length) {
        filteredOptions.push({ ...item, [fieldNames.options]: subOptions });
      }
      return;
    }
    if (filterFunc(searchValue, item)) {
      filteredOptions.push(item);
    }
  });
  return filteredOptions;
}

// ---------------------------------------------------------------------------
// useSearchConfig（rc hooks/useSearchConfig.js，25 行）
// ---------------------------------------------------------------------------

export interface ResolvedSearchConfig {
  filterOption?: boolean | FilterFunc<DefaultOptionType>;
  searchValue?: string;
  optionFilterProp?: string | string[];
  filterSort?: SearchConfig<DefaultOptionType>['filterSort'];
  onSearch?: (value: string) => void;
  autoClearSearchValue: boolean;
  searchIcon?: unknown;
}

/**
 * `showSearch` 归一。
 *
 * 强制为 true 的三种情况（rc 原文）：`showSearch` 是对象 / combobox / tags /
 * （multiple 且 showSearch 未传）。antd 的对象形态额外带 `searchIcon`。
 */
export function resolveSearchConfig(
  showSearch: boolean | (SearchConfig<DefaultOptionType> & { searchIcon?: unknown }) | undefined,
  legacy: {
    filterOption?: boolean | FilterFunc<DefaultOptionType>;
    searchValue?: string;
    optionFilterProp?: string | string[];
    filterSort?: SearchConfig<DefaultOptionType>['filterSort'];
    onSearch?: (value: string) => void;
    autoClearSearchValue?: boolean;
  },
  mode: string | undefined,
): [boolean, ResolvedSearchConfig] {
  const isObject = typeof showSearch === 'object' && showSearch !== null;
  const config: ResolvedSearchConfig = {
    filterOption: legacy.filterOption,
    searchValue: legacy.searchValue,
    optionFilterProp: legacy.optionFilterProp,
    filterSort: legacy.filterSort,
    onSearch: legacy.onSearch,
    autoClearSearchValue: legacy.autoClearSearchValue ?? true,
    ...(isObject ? (showSearch as SearchConfig<DefaultOptionType>) : {}),
  };
  const merged =
    isObject ||
    mode === 'combobox' ||
    mode === 'tags' ||
    (mode === 'multiple' && showSearch === undefined)
      ? true
      : Boolean(showSearch);
  return [merged, config];
}

// ---------------------------------------------------------------------------
// useAllowClear（rc hooks/useAllowClear.js，24 行）
// ---------------------------------------------------------------------------

export interface AllowClearResult {
  allowClear: boolean;
  clearIcon: unknown;
  label: string;
}

/**
 * 清除按钮的显隐：`disabled` 时不显示；有值或有搜索词时显示；
 * combobox 且搜索为空时不显示（否则空输入框也会挂个 ×）。
 */
export function resolveAllowClear(params: {
  displayValues: LabelInValueType[];
  allowClear: boolean | { allowClear?: boolean; clearIcon?: unknown; label?: string } | undefined;
  clearIcon?: unknown;
  disabled?: boolean;
  searchValue: string;
  mode?: string;
}): AllowClearResult {
  const { allowClear, clearIcon, disabled = false, searchValue, mode } = params;
  const config: { allowClear: boolean; clearIcon?: unknown; label?: string } =
    typeof allowClear === 'boolean'
      ? { allowClear }
      : allowClear && typeof allowClear === 'object'
        ? { ...allowClear, allowClear: allowClear.allowClear !== false }
        : { allowClear: false };

  const merged =
    !disabled &&
    config.allowClear !== false &&
    (params.displayValues.length > 0 || Boolean(searchValue)) &&
    !(mode === 'combobox' && searchValue === '');

  return {
    allowClear: merged,
    clearIcon: merged ? config.clearIcon ?? clearIcon ?? '×' : null,
    label: merged ? config.label ?? 'Clear' : '',
  };
}

/** `maxCount` 是否已满（rc `isValidCount` + rawValues.size）。 */
export function isOverMaxCount(
  multiple: boolean,
  maxCount: number | undefined,
  rawValuesSize: number,
): boolean {
  return multiple && isValidCount(maxCount) && rawValuesSize >= (maxCount as number);
}
