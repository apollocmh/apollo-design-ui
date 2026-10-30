/**
 * antd `table/hooks/{useLazyKVMap,usePagination,useContainerWidth,useFilledColumns,
 * useTitleColumns,useColumnTitleProps,useSpinProps}.js` —— Vue 移植（小 hook 合集）。
 */

import { isNonNullable, useControlledValue } from '@apollo-design/utils';
import {
  type ComputedRef,
  computed,
  type MaybeRefOrGetter,
  type Ref,
  shallowRef,
  toRaw,
  toValue,
  unref,
} from 'vue';
import { EXPAND_COLUMN } from '../engine/constant';
import type {
  ColumnsType,
  ColumnTitleProps,
  ColumnType,
  FilterValue,
  TableKey,
  TablePaginationConfig,
} from '../interface';
import { renderColumnTitle } from '../util';
import { SELECTION_COLUMN } from './use-selection';

export const DEFAULT_PAGE_SIZE = 10;

// ============================== useLazyKVMap ==============================

export function useLazyKVMap<RecordType>(
  data: ComputedRef<RecordType[]>,
  childrenColumnName: Ref<string>,
  getRowKey: Ref<(record: RecordType, index?: number) => TableKey>,
): (key: TableKey) => RecordType | undefined {
  const mapCacheRef = shallowRef<{
    data?: RecordType[];
    childrenColumnName?: string;
    kvMap?: Map<TableKey, RecordType>;
    getRowKey?: (record: RecordType, index?: number) => TableKey;
  }>({});

  const getRecordByKey = (key: TableKey): RecordType | undefined => {
    const cache = mapCacheRef.value;
    if (
      !cache ||
      cache.data !== data.value ||
      cache.childrenColumnName !== childrenColumnName.value ||
      cache.getRowKey !== getRowKey.value
    ) {
      const kvMap = new Map<TableKey, RecordType>();
      const dig = (records: RecordType[]) => {
        records.forEach((record, index) => {
          const rowKey = getRowKey.value(record, index);
          kvMap.set(rowKey, record);
          if (
            record &&
            typeof record === 'object' &&
            childrenColumnName.value in (record as Record<string, unknown>)
          ) {
            dig(
              ((record as Record<string, unknown>)[childrenColumnName.value] as RecordType[]) ?? [],
            );
          }
        });
      };
      dig(data.value);
      mapCacheRef.value = {
        data: data.value,
        childrenColumnName: childrenColumnName.value,
        kvMap,
        getRowKey: getRowKey.value,
      };
    }
    return mapCacheRef.value.kvMap?.get(key);
  };
  return getRecordByKey;
}

// ============================== usePagination ==============================

export function getPaginationParam(
  mergedPagination: TablePaginationConfig,
  pagination: false | TablePaginationConfig,
): TablePaginationConfig {
  const param: TablePaginationConfig = {
    current: mergedPagination.current,
    pageSize: mergedPagination.pageSize,
  };
  if (pagination)
    for (const key of Object.keys(pagination)) {
      const value: unknown = Reflect.get(mergedPagination, key);
      if (typeof value !== 'function') Reflect.set(param, key, value);
    }
  return param;
}

/**
 * antd `usePagination`（58 行）。⚠️ INTENDED 差异（analysis §4.4 #5）：
 * antd 对派生对象 `mergedPagination.current` 直接 mutate；本仓改成在 computed
 * 里算夹取后的值，不改派生对象。
 */
export function usePagination(
  total: ComputedRef<number>,
  onChange: (current: number, pageSize: number) => void,
  pagination: Ref<false | TablePaginationConfig>,
): {
  mergedPagination: ComputedRef<TablePaginationConfig>;
  resetPagination: (current?: number, pageSize?: number) => void;
} {
  const [current, setCurrent] = useControlledValue<number>({
    defaultValue: () => {
      const p = unref(pagination);
      return p && p.defaultCurrent !== undefined ? p.defaultCurrent : 1;
    },
    getValue: () => {
      const p = unref(pagination);
      return p ? p.current : undefined;
    },
  });
  const [pageSize, setPageSize] = useControlledValue<number>({
    defaultValue: () => {
      const p = unref(pagination);
      return p && p.defaultPageSize !== undefined ? p.defaultPageSize : DEFAULT_PAGE_SIZE;
    },
    getValue: () => {
      const p = unref(pagination);
      return p ? p.pageSize : undefined;
    },
  });
  const mergedPagination = computed<TablePaginationConfig>(() => {
    const p = unref(pagination);
    if (p === false) return {};
    const mergedTotal = p.total && p.total > 0 ? p.total : total.value;
    const maxPage = Math.ceil(mergedTotal / pageSize.value);
    return {
      ...p,
      current: Math.min(current.value, maxPage || 1),
      pageSize: pageSize.value,
      total: mergedTotal,
    };
  });
  const refreshPagination = (nextCurrent = 1, nextPageSize = pageSize.value) => {
    setCurrent(nextCurrent);
    setPageSize(nextPageSize);
  };
  const onInternalChange = (nextCurrent: number, nextPageSize: number) => {
    const p = unref(pagination);
    if (p) p.onChange?.(nextCurrent, nextPageSize);
    refreshPagination(nextCurrent, nextPageSize);
    onChange(nextCurrent, nextPageSize);
  };

  const mergedWithOnChange = computed<TablePaginationConfig>(() => {
    if (unref(pagination) === false) {
      return {};
    }
    return { ...mergedPagination.value, onChange: onInternalChange };
  });

  return { mergedPagination: mergedWithOnChange, resetPagination: refreshPagination };
}

// ============================== useContainerWidth ==============================

export function useContainerWidth(
  prefixCls: MaybeRefOrGetter<string>,
): (ele: HTMLElement, width: number) => number {
  const getContainerWidth = (ele: HTMLElement, width: number): number => {
    const container = ele.querySelector(`.${toValue(prefixCls)}-container`);
    let returnWidth = width;
    if (container) {
      const style = getComputedStyle(container);
      const borderLeft = Number.parseInt(style.borderLeftWidth, 10);
      const borderRight = Number.parseInt(style.borderRightWidth, 10);
      returnWidth = width - borderLeft - borderRight;
    }
    return returnWidth;
  };
  return getContainerWidth;
}

// ============================== useFilledColumns ==============================

/** antd `useFilledColumns`：`column` prop 全量注入到每列（SELECTION/EXPAND 哨兵跳过）。 */
export function useFilledColumns<RecordType>(
  columns: ComputedRef<ColumnsType<RecordType>>,
  column: Ref<Partial<ColumnType<RecordType>> | undefined>,
): ComputedRef<ColumnsType<RecordType>> {
  return computed(() => {
    const defaults = column.value;
    if (!defaults) return columns.value;
    const { children: _children, ...leafDefaults } = defaults;
    const fill = (current: ColumnsType<RecordType>): ColumnsType<RecordType> =>
      current.map((col) => {
        if (toRaw(col) === SELECTION_COLUMN || toRaw(col) === EXPAND_COLUMN) return col;
        return col.children
          ? { ...defaults, ...col, children: fill(col.children) }
          : { ...leafDefaults, ...col };
      });
    return fill(columns.value);
  });
}

// ============================== useTitleColumns ==============================

/** antd `useTitleColumns`：把函数 title 求值结果回填（columnTitleProps 通道）。 */
export function useTitleColumns<RecordType>(
  columnTitleProps: ComputedRef<ColumnTitleProps<RecordType>>,
): (columns: ColumnsType<RecordType>) => ColumnsType<RecordType> {
  const fillTitle = (columns: ColumnsType<RecordType>): ColumnsType<RecordType> =>
    columns.map((column) => ({
      ...column,
      title: renderColumnTitle(column.title, columnTitleProps.value),
      ...(column.children ? { children: fillTitle(column.children) } : {}),
    }));
  return fillTitle;
}

// ============================== useColumnTitleProps ==============================

export function useColumnTitleProps<RecordType>(
  sorterTitleProps: Ref<Partial<ColumnTitleProps<RecordType>>>,
  filters: ComputedRef<Record<string, FilterValue | null>>,
): ComputedRef<ColumnTitleProps<RecordType>> {
  return computed(() => {
    const mergedFilters: Record<string, FilterValue> = {};
    for (const [key, value] of Object.entries(filters.value)) {
      if (isNonNullable(value)) {
        mergedFilters[key] = value;
      }
    }
    return { ...unref(sorterTitleProps), filters: mergedFilters };
  });
}

// ============================== useSpinProps ==============================

export function useSpinProps(
  loading: Ref<boolean | Record<string, unknown> | undefined>,
): ComputedRef<Record<string, unknown>> {
  return computed(() => {
    const value = loading.value;
    if (typeof value === 'boolean') {
      return { spinning: value };
    }
    if (value && typeof value === 'object') {
      return { spinning: true, ...value };
    }
    return { spinning: false };
  });
}
