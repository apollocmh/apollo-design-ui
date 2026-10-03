/**
 * antd `table/hooks/{useLazyKVMap,usePagination,useContainerWidth,useFilledColumns,
 * useTitleColumns,useColumnTitleProps,useSpinProps}.js` —— Vue 移植（小 hook 合集）。
 */

import { isNonNullable, mergeProps, omit } from '@apollo-design/utils';
import { type ComputedRef, computed, type Ref, ref, shallowRef, unref } from 'vue';
import { EXPAND_COLUMN } from '../engine/constant';
import type {
  ColumnsType,
  ColumnTitleProps,
  ColumnType,
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
  mergedPagination: Record<string, unknown>,
  pagination: false | TablePaginationConfig,
): TablePaginationConfig {
  const param: Record<string, unknown> = {
    current: mergedPagination.current,
    pageSize: mergedPagination.pageSize,
  };
  const paginationObj = (pagination && typeof pagination === 'object' ? pagination : {}) as Record<
    string,
    unknown
  >;
  Object.keys(paginationObj).forEach((pageProp) => {
    const value = mergedPagination[pageProp];
    if (typeof value !== 'function') {
      param[pageProp] = value;
    }
  });
  return param as TablePaginationConfig;
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
  const initPagination = (): { current: number; pageSize: number } => {
    const paginationObj = (
      unref(pagination) && typeof unref(pagination) === 'object' ? unref(pagination) : {}
    ) as Record<string, unknown>;
    return {
      current: 'defaultCurrent' in paginationObj ? (paginationObj.defaultCurrent as number) : 1,
      pageSize:
        'defaultPageSize' in paginationObj
          ? (paginationObj.defaultPageSize as number)
          : DEFAULT_PAGE_SIZE,
    };
  };
  const innerPagination = ref<{ current: number; pageSize: number }>(initPagination());

  const mergedPagination = computed<TablePaginationConfig>(() => {
    if (unref(pagination) === false) {
      return {} as TablePaginationConfig;
    }
    const paginationObj = (unref(pagination) as TablePaginationConfig) ?? {};
    const { total: paginationTotal = 0, ...rest } = paginationObj;
    const base = mergeProps(
      { ...innerPagination.value } as Record<string, unknown>,
      { ...rest } as Record<string, unknown>,
      { total: paginationTotal > 0 ? paginationTotal : total.value } as Record<string, unknown>,
    ) as TablePaginationConfig;
    // 夹取 current（不 mutate 派生对象 —— analysis §4.4 #5）
    const maxPage = Math.ceil((paginationTotal || total.value) / (base.pageSize as number));
    if ((base.current as number) > maxPage) {
      base.current = maxPage || 1;
    }
    return base;
  });

  const refreshPagination = (current?: number, pageSize?: number) => {
    innerPagination.value = {
      current: current ?? 1,
      pageSize: pageSize || (mergedPagination.value.pageSize as number),
    };
  };

  const onInternalChange = (current: number, pageSize: number) => {
    const p = unref(pagination);
    if (p && typeof p === 'object') {
      (p as { onChange?: (c: number, ps: number) => void }).onChange?.(current, pageSize);
    }
    refreshPagination(current, pageSize);
    onChange(current, pageSize || (mergedPagination.value.pageSize as number));
  };

  const mergedWithOnChange = computed<TablePaginationConfig>(() => {
    if (unref(pagination) === false) {
      return {} as TablePaginationConfig;
    }
    return { ...mergedPagination.value, onChange: onInternalChange } as TablePaginationConfig;
  });

  return { mergedPagination: mergedWithOnChange, resetPagination: refreshPagination };
}

// ============================== useContainerWidth ==============================

export function useContainerWidth(prefixCls: string): (ele: HTMLElement, width: number) => number {
  const getContainerWidth = (ele: HTMLElement, width: number): number => {
    const container = ele.querySelector(`.${prefixCls}-container`);
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
export function useFilledColumns(
  columns: ComputedRef<ColumnsType>,
  column: Ref<Partial<ColumnType> | undefined>,
): ComputedRef<ColumnsType> {
  // ⚠️ 内部 any 化：与本文件 usePagination 同判（TS2589 深度上限）
  return computed(() => {
    const cols = columns.value;
    const col = column.value;
    if (!col) return cols;
    // biome-ignore lint/suspicious/noExplicitAny: TS2589（4 层泛型链实例化过深），any 化是本仓已登记的逃生口
    const fillColumns = (currentColumns: any[]): any[] =>
      // biome-ignore lint/suspicious/noExplicitAny: TS2589（4 层泛型链实例化过深），any 化是本仓已登记的逃生口
      currentColumns.map((raw: any) => {
        const colItem = raw as ColumnType;
        if (colItem === SELECTION_COLUMN || colItem === (EXPAND_COLUMN as unknown)) {
          return raw;
        }
        if ('children' in colItem && Array.isArray((colItem as { children?: unknown }).children)) {
          const mergedColumn = { ...col, ...colItem };
          return {
            ...mergedColumn,
            children: fillColumns((colItem as { children: ColumnsType }).children),
          };
        }
        const columnWithoutChildren = omit(col as Record<string, unknown>, ['children']) as Record<
          string,
          unknown
        >;
        return { ...columnWithoutChildren, ...colItem } as ColumnType;
      });
    return fillColumns(cols);
  });
}

// ============================== useTitleColumns ==============================

/** antd `useTitleColumns`：把函数 title 求值结果回填（columnTitleProps 通道）。 */
export function useTitleColumns<RecordType>(
  columnTitleProps: ComputedRef<ColumnTitleProps<RecordType>>,
): (columns: ColumnsType<RecordType>) => ColumnsType<RecordType> {
  const fillTitle = (columns: ColumnsType<RecordType>): ColumnsType<RecordType> =>
    columns.map((raw) => {
      const cloneColumn = { ...(raw as ColumnType<RecordType>) };
      cloneColumn.title = renderColumnTitle(
        cloneColumn.title,
        columnTitleProps.value,
      ) as ColumnType<RecordType>['title'];
      if ('children' in cloneColumn) {
        cloneColumn.children = fillTitle(
          (cloneColumn as unknown as { children: ColumnsType<RecordType> }).children,
        );
      }
      return cloneColumn as never;
    });
  return fillTitle;
}

// ============================== useColumnTitleProps ==============================

export function useColumnTitleProps<RecordType>(
  sorterTitleProps: Ref<Partial<ColumnTitleProps<RecordType>>>,
  filters: ComputedRef<Record<string, unknown>>,
): ComputedRef<ColumnTitleProps<RecordType>> {
  return computed(() => {
    const mergedFilters: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters.value)) {
      if (isNonNullable(value)) {
        mergedFilters[key] = value;
      }
    }
    return { ...unref(sorterTitleProps), filters: mergedFilters } as ColumnTitleProps<RecordType>;
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
    return {};
  });
}
