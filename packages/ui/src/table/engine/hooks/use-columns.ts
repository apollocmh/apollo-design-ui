/**
 * rc `hooks/useColumns/index.js`（195 行）+ `useWidthColumns.js`（69 行）—— Vue 移植。
 *
 * React 的 useMemo 链在 Vue 里是 `computed` 链；`transformColumns`（antd 层的
 * 排序/过滤/选择列注入）通过函数参数在 computed 里调用。
 */

import { type ComputedRef, computed, type Ref, toRaw } from 'vue';
import type { ColumnsType, ColumnType } from '../../interface';
import { EXPAND_COLUMN, INTERNAL_HOOKS } from '../constant';
import { INTERNAL_COL_DEFINE } from '../utils/legacyUtil';

/** 引擎层的列定义（antd/用户传入，可能有 children 分组）。 */
type AnyColumns = ColumnsType;

export interface UseColumnsParams<RecordType> {
  prefixCls: string;
  columns: AnyColumns | undefined;
  expandable: boolean;
  expandedKeys: Set<string | number>;
  columnTitle: unknown;
  getRowKey: (record: RecordType, index?: number) => string | number;
  onTriggerExpand: (record: RecordType, event?: Event) => void;
  expandIcon: (params: {
    prefixCls: string;
    expanded: boolean;
    expandable: boolean;
    record: RecordType;
    onExpand: (record: RecordType, event?: Event) => void;
  }) => unknown;
  rowExpandable?: (record: RecordType) => boolean;
  expandIconColumnIndex?: number;
  expandedRowOffset: number;
  direction?: 'ltr' | 'rtl';
  expandRowByClick?: boolean;
  columnWidth?: number | string;
  fixed?: string | boolean;
  scrollWidth: number | null;
  clientWidth: number;
  internalHooks?: string;
  __PARENT_RENDER_ICON__?: unknown;
  data?: RecordType[];
  childrenColumnName?: string | ComputedRef<string>;
}

function filterHiddenColumns(columns: AnyColumns): AnyColumns {
  return columns
    .filter(
      (column): column is ColumnType =>
        !!column && typeof column === 'object' && !(column as ColumnType).hidden,
    )
    .map((column) => {
      const subColumns = (column as ColumnGroupLike).children as AnyColumns | undefined;
      if (subColumns && subColumns.length > 0) {
        return { ...column, children: filterHiddenColumns(subColumns) };
      }
      return column;
    });
}

interface ColumnGroupLike {
  children?: AnyColumns;
}

export function flatColumns(columns: AnyColumns, parentKey = 'key'): ColumnType[] {
  return columns
    .filter((column) => column && typeof column === 'object')
    .reduce<ColumnType[]>((list, column, index) => {
      const { fixed } = column as ColumnType;
      const parsedFixed =
        fixed === true || fixed === 'left'
          ? 'start'
          : fixed === 'right'
            ? 'end'
            : (fixed as ColumnType['fixed']);
      const mergedKey = `${parentKey}-${index}`;
      const subColumns = (column as ColumnGroupLike).children as AnyColumns | undefined;
      // ⚠️ 不用 `[...list, …]`（`noAccumulatingSpread`）：每轮复制整个数组。
      //    `list` 是本次 reduce 私有的累加器，原地 push 外部看不到。
      if (subColumns && subColumns.length > 0) {
        list.push(
          ...flatColumns(subColumns, mergedKey).map((subColumn) => ({
            ...subColumn,
            fixed: subColumn.fixed ?? parsedFixed,
          })),
        );
        return list;
      }
      list.push({ key: mergedKey, ...(column as ColumnType), fixed: parsedFixed });
      return list;
    }, []);
}

function parseColWidth(totalWidth: number, width: number | string | undefined): number | null {
  if (typeof width === 'number') {
    return width;
  }
  if (typeof width === 'string' && width.endsWith('%')) {
    return (totalWidth * parseFloat(width)) / 100;
  }
  return null;
}

/**
 * Fill all column with width（rc `useWidthColumns`）。
 * 返回 [填充宽度后的列, 实际总宽]。
 */
export function useWidthColumns(
  flattenColumns: ComputedRef<ColumnType[]>,
  scrollWidth: ComputedRef<number | null>,
  clientWidth: Ref<number>,
): ComputedRef<[ColumnType[], number | null]> {
  return computed(() => {
    const cols = flattenColumns.value;
    const sw = scrollWidth.value;
    if (sw && sw > 0) {
      let totalWidth = 0;
      let missWidthCount = 0;
      cols.forEach((col) => {
        const colWidth = parseColWidth(sw, col.width);
        if (colWidth) {
          totalWidth += colWidth;
        } else {
          missWidthCount += 1;
        }
      });
      const maxFitWidth = Math.max(sw, clientWidth.value);
      let restWidth = Math.max(maxFitWidth - totalWidth, missWidthCount);
      let restCount = missWidthCount;
      const avgWidth = missWidthCount > 0 ? restWidth / missWidthCount : 0;
      let realTotal = 0;
      const filledColumns: ColumnType[] = cols.map((col) => {
        const clone = { ...col };
        const colWidth = parseColWidth(sw, clone.width);
        if (colWidth) {
          clone.width = colWidth;
        } else {
          const colAvgWidth = Math.floor(avgWidth);
          clone.width = restCount === 1 ? restWidth : colAvgWidth;
          restWidth -= colAvgWidth;
          restCount -= 1;
        }
        realTotal += clone.width as number;
        return clone;
      });
      if (realTotal < maxFitWidth) {
        const scale = maxFitWidth / realTotal;
        restWidth = maxFitWidth;
        filledColumns.forEach((col, index) => {
          const colWidth = Math.floor((col.width as number) * scale);
          col.width = index === filledColumns.length - 1 ? restWidth : colWidth;
          restWidth -= colWidth;
        });
      }
      return [filledColumns, Math.max(realTotal, maxFitWidth)];
    }
    return [cols, sw];
  });
}

/**
 * Parse `columns` & children into flatten pipeline —— rc `useColumns` 的 Vue 版。
 * 返回 [mergedColumns（分组保留）, filledColumns（填宽后展平）, realScrollWidth]。
 */
export function useColumns<RecordType>(
  params: ComputedRef<UseColumnsParams<RecordType>>,
  transformColumns: ((columns: ColumnsType<RecordType>) => ColumnsType<RecordType>) | null,
) {
  const baseColumns = computed<AnyColumns>(() => {
    const cols = params.value.columns || [];
    const filtered = filterHiddenColumns(cols.slice());
    return filtered;
  });

  // ========================== Expand ==========================
  const withExpandColumns = computed<AnyColumns>(() => {
    const p = params.value;
    if (p.expandable) {
      let cloneColumns = baseColumns.value.slice();
      if (!cloneColumns.some((c) => toRaw(c as object) === EXPAND_COLUMN)) {
        const expandColIndex = p.expandIconColumnIndex || 0;
        const insertIndex =
          expandColIndex === 0 && (p.fixed === 'right' || p.fixed === 'end')
            ? baseColumns.value.length
            : expandColIndex;
        if (insertIndex >= 0) {
          cloneColumns.splice(insertIndex, 0, EXPAND_COLUMN as never);
        }
      }
      const expandColumnIndex = cloneColumns.findIndex((c) => toRaw(c as object) === EXPAND_COLUMN);
      cloneColumns = cloneColumns.filter(
        (column, index) => toRaw(column as object) !== EXPAND_COLUMN || index === expandColumnIndex,
      );
      const prevColumn = baseColumns.value[expandColumnIndex] as ColumnType | undefined;
      // rc：`const fixedColumn = fixed ? nextColumn.fixed : prevColumn?.fixed;`
      //    rc 的 fixed 类型含 true（遗留兼容）—— 归一成严格联合（Vue 侧 ColumnType.fixed 不收 true）
      let fixedColumn: ColumnType['fixed'];
      if (p.fixed) {
        fixedColumn = (p.fixed === true ? 'left' : p.fixed) as ColumnType['fixed'];
      } else {
        fixedColumn = prevColumn ? prevColumn.fixed : undefined;
      }
      const expandColumn: ColumnType = {
        [INTERNAL_COL_DEFINE]: {
          className: `${p.prefixCls}-expand-icon-col`,
          columnType: 'EXPAND_COLUMN',
        },
        title: p.columnTitle as ColumnType['title'],
        fixed: fixedColumn as ColumnType['fixed'],
        className: `${p.prefixCls}-row-expand-icon-cell`,
        width: p.columnWidth,
        render: (_: unknown, record: RecordType, index: number) => {
          const rowKey = p.getRowKey(record, index);
          const expanded = p.expandedKeys.has(rowKey);
          const recordExpandable = p.rowExpandable ? p.rowExpandable(record) : true;
          const icon = p.expandIcon({
            prefixCls: p.prefixCls,
            expanded,
            expandable: recordExpandable,
            record,
            onExpand: p.onTriggerExpand,
          });
          if (p.expandRowByClick) {
            return ['span', { onClick: (e: Event) => e.stopPropagation() }, icon];
          }
          return icon;
        },
      };
      return cloneColumns.map((col, index) => {
        const column = toRaw(col as object) === EXPAND_COLUMN ? expandColumn : (col as ColumnType);
        if (index < p.expandedRowOffset) {
          return { ...column, fixed: column.fixed || 'start' };
        }
        return column;
      });
    }
    return baseColumns.value.filter((col) => toRaw(col as object) !== EXPAND_COLUMN);
  });

  // ========================= Transform ========================
  const mergedColumns = computed<AnyColumns>(() => {
    let finalColumns = withExpandColumns.value;
    if (transformColumns) {
      finalColumns = transformColumns(finalColumns as ColumnsType<RecordType>) as AnyColumns;
    }
    if (!finalColumns.length) {
      finalColumns = [{ render: () => null } as ColumnType];
    }
    return finalColumns;
  });

  // ========================== Flatten =========================
  const flattenColumns = computed<ColumnType[]>(() =>
    flatColumns(mergedColumns.value as AnyColumns),
  );

  // ========================= FillWidth ========================
  const scrollWidthRef = computed(() => params.value.scrollWidth);
  const clientWidthRef = computed(() => params.value.clientWidth);
  const widthResult = useWidthColumns(flattenColumns, scrollWidthRef, clientWidthRef);
  const filledColumns = computed(() => widthResult.value[0]);
  const realScrollWidth = computed(() => widthResult.value[1]);

  return { mergedColumns, filledColumns, realScrollWidth };
}

/** 引擎参数构造时判断 nest 展开类型（rc useExpand 里的判据搬过来共用）。 */
export function hasNestChildren<RecordType>(
  data: RecordType[] | undefined,
  childrenColumnName: string,
): boolean {
  return (data ?? []).some(
    (record) =>
      record &&
      typeof record === 'object' &&
      Boolean((record as Record<string, unknown>)[childrenColumnName]),
  );
}

export { INTERNAL_HOOKS };
