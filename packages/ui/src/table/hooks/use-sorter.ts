/**
 * antd `table/hooks/useSorter.js`（386 行）—— Vue 移植。
 *
 * 受控判据（§3 验收点）：`'sortOrder' in column`（显式传 null 也算受控）；
 * 非受控时 `defaultSortOrder` 只在 init 收集。
 */

import { CaretDownOutlined, CaretUpOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { isFunction, isNumber, isPlainObject } from '@apollo-design/utils';
import { type ComputedRef, computed, h, ref, type VNodeChild } from 'vue';
import { clsx } from '../../_internal/clsx';
import Tooltip from '../../tooltip/Tooltip';
import type {
  ColumnsType,
  ColumnType,
  CompareFn,
  SorterResult,
  SortOrder,
  TableLocale,
} from '../interface';
import { getColumnKey, getColumnPos, renderColumnTitle, safeColumnTitle } from '../util';

const ASCEND = 'ascend';
const DESCEND = 'descend';

interface SortState<RecordType> {
  column: ColumnType<RecordType>;
  key: string | number;
  multiplePriority: number | false;
  sortOrder: SortOrder | undefined;
}

const getMultiplePriority = <RecordType>(column: ColumnType<RecordType>): number | false => {
  if (
    isPlainObject(column.sorter) &&
    isNumber((column.sorter as { multiple?: unknown }).multiple)
  ) {
    return (column.sorter as { multiple: number }).multiple;
  }
  return false;
};

const getSortFunction = <RecordType>(
  sorter: ColumnType<RecordType>['sorter'],
): CompareFn<RecordType> | false => {
  if (isFunction(sorter)) {
    return sorter as CompareFn<RecordType>;
  }
  if (isPlainObject(sorter) && (sorter as { compare?: unknown }).compare) {
    return (sorter as { compare: CompareFn<RecordType> }).compare;
  }
  return false;
};

const nextSortDirection = (
  sortDirections: SortOrder[],
  current: SortOrder,
): SortOrder | undefined => {
  if (!current) {
    return sortDirections[0];
  }
  return sortDirections[sortDirections.indexOf(current) + 1];
};

function collectSortStates<RecordType>(
  columns: ColumnsType<RecordType>,
  init: boolean,
  pos?: string,
): SortState<RecordType>[] {
  let sortStates: SortState<RecordType>[] = [];
  const pushState = (column: ColumnType<RecordType>, columnPos: string) => {
    sortStates.push({
      column,
      key: getColumnKey(column as never, columnPos),
      multiplePriority: getMultiplePriority(column),
      sortOrder: column.sortOrder,
    });
  };
  (columns || []).forEach((raw, index) => {
    const column = raw as ColumnType<RecordType>;
    const columnPos = getColumnPos(index, pos);
    if ((column as { children?: unknown }).children) {
      if ('sortOrder' in column) {
        pushState(column, columnPos);
      }
      sortStates = [
        ...sortStates,
        ...collectSortStates(
          (column as { children: ColumnsType<RecordType> }).children,
          init,
          columnPos,
        ),
      ];
    } else if (column.sorter) {
      if ('sortOrder' in column) {
        pushState(column, columnPos);
      } else if (init && column.defaultSortOrder) {
        sortStates.push({
          column,
          key: getColumnKey(column as never, columnPos),
          multiplePriority: getMultiplePriority(column),
          sortOrder: column.defaultSortOrder,
        });
      }
    }
  });
  return sortStates;
}

function injectSorter<RecordType>(
  prefixCls: string,
  columns: ColumnsType<RecordType>,
  sorterStates: SortState<RecordType>[],
  triggerSorter: (state: SortState<RecordType>) => void,
  defaultSortDirections: SortOrder[],
  tableLocale: TableLocale | undefined,
  tableShowSorterTooltip: boolean | { target?: string } | undefined,
  pos?: string,
  /** antd `useSorter.tsx:125` —— 无障碍文案源（`locale.global`）。 */
  a11yLocale?: { sortable?: string },
): ColumnsType<RecordType> {
  return (columns || []).map((raw, index) => {
    const column = raw as ColumnType<RecordType>;
    const columnPos = getColumnPos(index, pos);
    let newColumn = column;
    if (newColumn.sorter) {
      const sortDirections = newColumn.sortDirections || defaultSortDirections;
      const showSorterTooltip =
        newColumn.showSorterTooltip === undefined
          ? tableShowSorterTooltip
          : newColumn.showSorterTooltip;
      const columnKey = getColumnKey(newColumn as never, columnPos);
      const sorterState = sorterStates.find(({ key }) => key === columnKey);
      const sortOrder = sorterState ? sorterState.sortOrder : null;
      const nextSortOrder = nextSortDirection(sortDirections, sortOrder ?? null);

      let sorter: VNodeChild;
      if (column.sortIcon) {
        sorter = column.sortIcon({ sortOrder: sortOrder ?? null });
      } else {
        const upNode =
          sortDirections.includes(ASCEND) &&
          h(CaretUpOutlined, {
            class: clsx(`${prefixCls}-column-sorter-up`, {
              active: sortOrder === ASCEND,
            }),
          });
        const downNode =
          sortDirections.includes(DESCEND) &&
          h(CaretDownOutlined, {
            class: clsx(`${prefixCls}-column-sorter-down`, {
              active: sortOrder === DESCEND,
            }),
          });
        sorter = h(
          'span',
          {
            class: clsx(`${prefixCls}-column-sorter`, {
              [`${prefixCls}-column-sorter-full`]: Boolean(upNode && downNode),
            }),
          },
          [
            h('span', { class: `${prefixCls}-column-sorter-inner`, 'aria-hidden': 'true' }, [
              upNode as never,
              downNode as never,
            ]),
          ],
        );
      }

      const { cancelSort, triggerAsc, triggerDesc } = tableLocale ?? {};
      let sortTip: VNodeChild = cancelSort;
      if (nextSortOrder === DESCEND) {
        sortTip = triggerDesc;
      } else if (nextSortOrder === ASCEND) {
        sortTip = triggerAsc;
      }
      const tooltipTitle = sortTip;
      const showTip = Boolean(showSorterTooltip);
      const tipTarget =
        typeof showSorterTooltip !== 'boolean' && showSorterTooltip?.target
          ? showSorterTooltip.target
          : undefined;

      newColumn = {
        ...newColumn,
        // 🚨 **键必须是 `className`**（rc `ColumnType`，引擎 `Header.ts:39` /
        //    `Cell.ts` 读的都是它）—— 写成 Vue 风格的 `class` 会让排序列的
        //    `-column-sort` 类名**静默丢失**（该列 th/td 的背景样式是死规则，
        //    dom-probe 全变体扫描 table/sorter-filter 抓出）。
        className: clsx(newColumn.className, {
          [`${prefixCls}-column-sort`]: sortOrder,
        }),
        title: (renderProps: unknown) => {
          const columnSortersClass = `${prefixCls}-column-sorters`;
          const renderColumnTitleWrapper = h(
            'span',
            { class: `${prefixCls}-column-title` },
            renderColumnTitle(column.title, renderProps) as never,
          );
          const renderSortTitle = () =>
            h('div', { class: columnSortersClass }, [renderColumnTitleWrapper, sorter as never]);
          if (showTip) {
            const tooltipNode = h(Tooltip, { title: tooltipTitle } as never, {
              default: () => sorter as never,
            });
            if (tipTarget === 'sorter-icon') {
              return h(
                'div',
                { class: clsx(columnSortersClass, `${columnSortersClass}-tooltip-target-sorter`) },
                [renderColumnTitleWrapper, tooltipNode],
              );
            }
            return h(Tooltip, { title: tooltipTitle } as never, {
              default: () => renderSortTitle(),
            });
          }
          return renderSortTitle();
        },
        onHeaderCell: (col: ColumnType<RecordType>) => {
          const cell = (column.onHeaderCell?.(col) ?? {}) as Record<string, unknown>;
          const originOnClick = cell.onClick as ((e: Event) => void) | undefined;
          const originOKeyDown = cell.onKeyDown as ((e: KeyboardEvent) => void) | undefined;
          cell.onClick = (event: Event) => {
            triggerSorter({
              column,
              key: columnKey,
              sortOrder: nextSortOrder ?? null,
              multiplePriority: getMultiplePriority(column),
            });
            originOnClick?.(event);
          };
          cell.onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter' || event.keyCode === 13) {
              triggerSorter({
                column,
                key: columnKey,
                sortOrder: nextSortOrder ?? null,
                multiplePriority: getMultiplePriority(column),
              });
            }
            originOKeyDown?.(event);
          };
          const renderTitle = safeColumnTitle(column.title, {}) as string | undefined;
          const displayTitle = renderTitle?.toString();
          if (sortOrder) {
            cell['aria-sort'] = sortOrder === 'ascend' ? 'ascending' : 'descending';
          }
          cell['aria-description'] = a11yLocale?.sortable;
          cell['aria-label'] = displayTitle || '';
          cell.className = clsx(cell.className as string, `${prefixCls}-column-has-sorters`);
          cell.tabIndex = 0;
          if (column.ellipsis) {
            cell.title = (renderTitle ?? '').toString();
          }
          return cell;
        },
      };
    }
    if ('children' in newColumn) {
      newColumn = {
        ...newColumn,
        children: injectSorter(
          prefixCls,
          (newColumn as unknown as { children: ColumnsType<RecordType> }).children,
          sorterStates,
          triggerSorter,
          defaultSortDirections,
          tableLocale,
          tableShowSorterTooltip,
          columnPos,
          a11yLocale,
        ),
      } as ColumnType<RecordType>;
    }
    return newColumn;
  }) as ColumnsType<RecordType>;
}

function stateToInfo<RecordType>(sorterState: SortState<RecordType>): SorterResult<RecordType> {
  const { column, sortOrder } = sorterState;
  return {
    column,
    order: sortOrder ?? null,
    field: column.dataIndex as never,
    columnKey: column.key,
  };
}

function generateSorterInfo<RecordType>(
  sorterStates: SortState<RecordType>[],
): SorterResult<RecordType> | SorterResult<RecordType>[] {
  const activeSorters = sorterStates.reduce<SorterResult<RecordType>[]>((list, sorterState) => {
    if (sorterState.sortOrder) {
      list.push(stateToInfo(sorterState));
    }
    return list;
  }, []);
  // legacy 兼容：无激活排序但配置了 sorter ⇒ 返回全空壳（rc PR 19226）
  if (activeSorters.length === 0 && sorterStates.length) {
    const lastIndex = sorterStates.length - 1;
    return {
      ...stateToInfo(sorterStates[lastIndex] as SortState<RecordType>),
      column: undefined,
      order: undefined,
      field: undefined,
      columnKey: undefined,
    } as SorterResult<RecordType>;
  }
  if (activeSorters.length <= 1) {
    return activeSorters[0] ?? ({} as SorterResult<RecordType>);
  }
  return activeSorters;
}

export function getSortData<RecordType>(
  data: RecordType[],
  sortStates: SortState<RecordType>[],
  childrenColumnName: string,
): RecordType[] {
  const innerSorterStates = sortStates
    .slice()
    .sort((a, b) => Number(b.multiplePriority) - Number(a.multiplePriority));
  const cloneData = data.slice();
  const runningSorters = innerSorterStates.filter(
    ({ column: { sorter }, sortOrder }) => getSortFunction(sorter) && sortOrder,
  );
  if (!runningSorters.length) {
    return cloneData;
  }
  return cloneData
    .sort((record1, record2) => {
      for (let i = 0; i < runningSorters.length; i += 1) {
        const sorterState = runningSorters[i];
        const {
          column: { sorter },
          sortOrder,
        } = sorterState as SortState<RecordType>;
        const compareFn = getSortFunction(sorter);
        if (compareFn && sortOrder) {
          const compareResult = compareFn(record1, record2, sortOrder);
          if (compareResult !== 0) {
            return sortOrder === ASCEND ? compareResult : -compareResult;
          }
        }
      }
      return 0;
    })
    .map((record) => {
      const subRecords = (record as Record<string, unknown>)[childrenColumnName] as
        | RecordType[]
        | undefined;
      if (subRecords) {
        return {
          ...record,
          [childrenColumnName]: getSortData(subRecords, sortStates, childrenColumnName),
        };
      }
      return record;
    });
}

export interface UseSorterParams<RecordType> {
  prefixCls: string;
  mergedColumns: ComputedRef<ColumnsType<RecordType>>;
  baseColumns: ComputedRef<ColumnsType<RecordType>>;
  onSorterChange: (
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
    sorterStates: SortState<RecordType>[],
  ) => void;
  sortDirections: SortOrder[];
  tableLocale?: TableLocale;
  showSorterTooltip: boolean | { target?: string };
}

export function useSorter<RecordType>(params: UseSorterParams<RecordType>): {
  transformColumns: (columns: ColumnsType<RecordType>) => ColumnsType<RecordType>;
  sortStates: ComputedRef<SortState<RecordType>[]>;
  sorterTitleProps: ComputedRef<{
    sortColumns: { column: ColumnType<RecordType>; order: SortOrder }[];
    sortColumn?: ColumnType<RecordType>;
    sortOrder?: SortOrder;
  }>;
  getSorters: () => SorterResult<RecordType> | SorterResult<RecordType>[];
} {
  const {
    prefixCls,
    mergedColumns,
    baseColumns,
    sortDirections,
    tableLocale,
    showSorterTooltip,
    onSorterChange,
  } = params;
  // antd `useSorter.tsx:250`：可排序列的 `aria-description` 取 locale 的
  // `global.sortable` —— 屏幕阅读器靠它知道「这一列可以排序」。
  const [globalLocale] = useLocale('global');
  // baseColumns（responsive 过滤前）收种子状态 —— antd issue 32847
  const collectColumns = computed(() => baseColumns.value ?? mergedColumns.value);
  const sortStates = ref<SortState<RecordType>[]>(collectSortStates(collectColumns.value, true));

  const getColumnKeys = (columns: ColumnsType<RecordType>, pos?: string): (string | number)[] => {
    const newKeys: (string | number)[] = [];
    columns.forEach((raw, index) => {
      const item = raw as ColumnType<RecordType>;
      const columnPos = getColumnPos(index, pos);
      newKeys.push(getColumnKey(item as never, columnPos));
      if (Array.isArray((item as { children?: unknown }).children)) {
        const childKeys = getColumnKeys(
          (item as { children: ColumnsType<RecordType> }).children,
          columnPos,
        );
        newKeys.push(...childKeys);
      }
    });
    return newKeys;
  };

  const mergedSorterStates = computed<SortState<RecordType>[]>(() => {
    let validate = true;
    // ⚠️ any 化：compute 链 4 层泛型会 TS2589（与 use-filter 同判）
    // biome-ignore lint/suspicious/noExplicitAny: TS2589（4 层泛型链实例化过深），any 化是本仓已登记的逃生口
    const collectedStates = collectSortStates(collectColumns.value as never, false) as any[];
    if (!collectedStates.length) {
      const collectColumnsKeys = getColumnKeys(collectColumns.value);
      // biome-ignore lint/suspicious/noExplicitAny: TS2589（4 层泛型链实例化过深），any 化是本仓已登记的逃生口
      return (sortStates.value as any[]).filter(({ key }: any) =>
        collectColumnsKeys.includes(key),
      ) as SortState<RecordType>[];
    }
    const validateStates: SortState<RecordType>[] = [];
    const patchStates = (state: SortState<RecordType>) => {
      if (validate) {
        validateStates.push(state);
      } else {
        validateStates.push({ ...state, sortOrder: null });
      }
    };
    let multipleMode: boolean | null = null;
    collectedStates.forEach((state) => {
      if (multipleMode === null) {
        patchStates(state);
        if (state.sortOrder) {
          if (state.multiplePriority === false) {
            validate = false;
          } else {
            multipleMode = true;
          }
        }
      } else if (multipleMode && state.multiplePriority !== false) {
        patchStates(state);
      } else {
        validate = false;
        patchStates(state);
      }
    });
    return validateStates;
  });

  const sorterTitleProps = computed(() => {
    const sortColumns = mergedSorterStates.value.map(({ column, sortOrder }) => ({
      column,
      order: sortOrder ?? null,
    }));
    return {
      sortColumns,
      sortColumn: sortColumns[0]?.column,
      sortOrder: sortColumns[0]?.order,
    };
  });

  const triggerSorter = (sortState: SortState<RecordType>) => {
    let newSorterStates: SortState<RecordType>[];
    if (
      sortState.multiplePriority === false ||
      !mergedSorterStates.value.length ||
      mergedSorterStates.value[0]?.multiplePriority === false
    ) {
      newSorterStates = [sortState];
    } else {
      newSorterStates = [
        ...mergedSorterStates.value.filter(({ key }) => key !== sortState.key),
        sortState,
      ];
    }
    sortStates.value = newSorterStates;
    onSorterChange(generateSorterInfo(newSorterStates), newSorterStates);
  };

  const transformColumns = (innerColumns: ColumnsType<RecordType>): ColumnsType<RecordType> =>
    injectSorter(
      prefixCls,
      innerColumns,
      mergedSorterStates.value,
      triggerSorter,
      sortDirections,
      tableLocale,
      showSorterTooltip,
      undefined,
      globalLocale as { sortable?: string } | undefined,
    );

  const getSorters = () => generateSorterInfo(mergedSorterStates.value);

  // ⚠️ 断言返回而非再包 computed：TS2589（合并 computed 链的实例化深度已到顶）
  return {
    transformColumns,
    sortStates: sortStates as unknown as ComputedRef<SortState<RecordType>[]>,
    sorterTitleProps: sorterTitleProps as unknown as ComputedRef<{
      sortColumns: { column: ColumnType<RecordType>; order: SortOrder }[];
      sortColumn?: ColumnType<RecordType>;
      sortOrder?: SortOrder;
    }>,
    getSorters,
  };
}

export { collectSortStates, getMultiplePriority, nextSortDirection };
