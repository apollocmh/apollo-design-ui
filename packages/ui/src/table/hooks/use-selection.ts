/**
 * antd `table/hooks/useSelection.js`（542 行）—— Vue 移植。
 *
 * 大额复用（analysis §0）：`conductCheck` / `convertDataToEntities` / `arrAdd` /
 * `arrDel` 来自本仓共享层。
 *
 * ⚠️ 2026-10-07 改路径（裁决 `early-extract-table-core-tree-core` = **C**）：
 *    原先写的是 `from '../../tree/utils'` —— 那是**跨组件 import 组件目录**，
 *    违反 `packages/ui/README.md` 的「组件间不得互相 import 组件目录；共享工具必须放
 *    `_internal/`」。现在这些都搬进了 `_internal/`：
 *      · `conductCheck`        → `_internal/tree/conduct-util`
 *      · `convertDataToEntities` → `_internal/tree/tree-util`
 *      · `arrAdd` / `arrDel`   → `_internal/array-util`（跟「树」无关，是通用键数组操作）
 * ⚠️ 逐字保留（analysis §4.4 #6）：`isCheckboxDisabled` 用 `has(某key)` 却
 * `get(重算的key)` —— 上游如此，不"修"。
 */

import { DownOutlined } from '@apollo-design/icons';
import { isFunction, useControlledValue } from '@apollo-design/utils';
import {
  type ComputedRef,
  computed,
  h,
  mergeProps,
  type Ref,
  ref,
  shallowRef,
  toRaw,
  unref,
  type VNodeChild,
  watch,
} from 'vue';
import { arrAdd, arrDel } from '../../_internal/array-util';
import { clsx } from '../../_internal/clsx';
import { conductCheck } from '../../_internal/tree/conduct-util';
import { convertDataToEntities } from '../../_internal/tree/tree-util';
import Checkbox from '../../checkbox/Checkbox';
import type { CheckboxProps } from '../../checkbox/interface';
import Dropdown from '../../dropdown/Dropdown';
import type { RadioChangeEvent } from '../../radio/interface';
import Radio from '../../radio/Radio';
import { INTERNAL_COL_DEFINE } from '../engine/utils/legacyUtil';
import type {
  ColumnsType,
  ColumnType,
  GetPopupContainer,
  SelectionItem,
  SelectionItemSelectFn,
  SelectionSelectFn,
  TableKey,
  TableRowSelection,
  TableSemanticClassNames,
} from '../interface';

// ============================== 哨兵 ==============================

/** 选择列的位置哨兵（引用相等；与 `Table.SELECTION_COLUMN` 同一单例）。 */
export const SELECTION_COLUMN = {};
export const SELECTION_ALL = 'SELECT_ALL';
export const SELECTION_INVERT = 'SELECT_INVERT';
export const SELECTION_NONE = 'SELECT_NONE';

function flattenData<RecordType>(
  childrenColumnName: string,
  data: RecordType[] | undefined,
  list: RecordType[] = [],
): RecordType[] {
  (data ?? []).forEach((record) => {
    list.push(record);
    if (
      record &&
      typeof record === 'object' &&
      childrenColumnName in (record as Record<string, unknown>)
    ) {
      flattenData(
        childrenColumnName,
        (record as Record<string, unknown>)[childrenColumnName] as RecordType[],
        list,
      );
    }
  });
  return list;
}

/** rc `_util/useMultipleSelect` 的等价物：shift 区间选择的 prev index。 */
function useMultipleSelect(): [
  (
    currentSelectedIndex: number,
    recordKeys: TableKey[],
    keySet: Set<TableKey>,
    selected: boolean,
  ) => TableKey[],
  (index: number | null) => void,
] {
  const prevIndex = ref<number | null>(null);
  const multipleSelect = (
    currentSelectedIndex: number,
    recordKeys: TableKey[],
    keySet: Set<TableKey>,
    selected: boolean,
  ): TableKey[] => {
    if (prevIndex.value === null) return [];
    const start = Math.min(prevIndex.value, currentSelectedIndex);
    const end = Math.max(prevIndex.value, currentSelectedIndex);
    const changedKeys: TableKey[] = [];
    for (let i = start; i <= end; i += 1) {
      const key = recordKeys[i] as TableKey;
      if (keySet.has(key) !== selected) {
        if (selected) keySet.add(key);
        else keySet.delete(key);
        changedKeys.push(key);
      }
    }
    return changedKeys;
  };
  const updatePrevSelectedIndex = (index: number | null) => {
    prevIndex.value = index;
  };
  return [multipleSelect, updatePrevSelectedIndex];
}

export interface UseSelectionConfig<RecordType> {
  prefixCls: string;
  data: ComputedRef<RecordType[]>;
  pageData: ComputedRef<RecordType[]>;
  getRecordByKey: (key: TableKey) => RecordType | undefined;
  getRowKey: Ref<(record: RecordType, index?: number) => TableKey>;
  expandType: Ref<'nest' | 'row' | null>;
  childrenColumnName: Ref<string>;
  locale: Partial<{
    selectionAll: VNodeChild;
    selectInvert: VNodeChild;
    selectNone: VNodeChild;
    selectAll: VNodeChild;
  }>;
  getPopupContainer?: GetPopupContainer;
  classNames?: Partial<TableSemanticClassNames>;
}

export function useSelection<RecordType extends object>(
  config: UseSelectionConfig<RecordType>,
  rowSelectionRef: Ref<TableRowSelection<RecordType> | undefined>,
): {
  transformColumns: (columns: ColumnsType<RecordType>) => ColumnsType<RecordType>;
  derivedSelectedKeySet: ComputedRef<Set<TableKey>>;
} {
  const getRowKey = computed(() => unref(config.getRowKey));
  // ========================= MultipleSelect =========================
  const [multipleSelect, updatePrevSelectedIndex] = useMultipleSelect();

  // ========================= Keys =========================
  const [mergedSelectedKeys, setMergedSelectedKeys] = useControlledValue<TableKey[]>({
    defaultValue: () => unref(rowSelectionRef)?.defaultSelectedRowKeys ?? [],
    getValue: () => unref(rowSelectionRef)?.selectedRowKeys,
  });

  // ======================== Caches ========================
  const preserveRecordsRef = shallowRef(new Map<TableKey, RecordType>());
  const getRecord = (key: TableKey) =>
    config.getRecordByKey(key) ?? preserveRecordsRef.value.get(key);
  const getRecords = (keys: TableKey[]) =>
    keys.flatMap((key) => {
      const record = getRecord(key);
      return record === undefined ? [] : [record];
    });
  watch(
    [mergedSelectedKeys, config.data, () => unref(rowSelectionRef)?.preserveSelectedRowKeys],
    ([keys]) => {
      const cache = new Map<TableKey, RecordType>();
      if (unref(rowSelectionRef)?.preserveSelectedRowKeys)
        for (const key of keys) {
          const record = getRecord(key);
          if (record !== undefined) cache.set(key, record);
        }
      preserveRecordsRef.value = cache;
    },
    { immediate: true, flush: 'sync' },
  );

  // Get flatten data
  const flattedData = computed<RecordType[]>(() =>
    flattenData(config.childrenColumnName.value, config.pageData.value),
  );

  const keyEntities = computed(() => {
    if (unref(rowSelectionRef)?.checkStrictly !== false) {
      return {};
    }
    let convertData = config.data.value;
    if (unref(rowSelectionRef)?.preserveSelectedRowKeys) {
      const keysSet = new Set(flattedData.value.map((r, i) => getRowKey.value(r, i)));
      const preserveRecords = Array.from(preserveRecordsRef.value.entries()).reduce<RecordType[]>(
        (total, [key, value]) => (keysSet.has(key) ? total : total.concat(value ?? [])),
        [],
      );
      convertData = [...convertData, ...preserveRecords];
    }
    type SelectionNode = { key: TableKey; disabled: boolean; children?: SelectionNode[] };
    const nodes = (records: RecordType[]): SelectionNode[] =>
      records.map((record, index) => {
        const children: unknown = Reflect.get(record, config.childrenColumnName.value);
        return {
          key: getRowKey.value(record, index),
          disabled: Boolean(unref(rowSelectionRef)?.getCheckboxProps?.(record)?.disabled),
          children: Array.isArray(children) ? nodes(children as RecordType[]) : undefined,
        };
      });
    const wrapper = convertDataToEntities(nodes(convertData));
    return wrapper.keyEntities;
  });

  // Get all checkbox props
  const checkboxPropsMap = computed(() => {
    const map = new Map<TableKey, Pick<CheckboxProps, 'disabled' | 'indeterminate'>>();
    flattedData.value.forEach((record, index) => {
      const key = getRowKey.value(record, index) as TableKey;
      const getCheckboxProps = unref(rowSelectionRef)?.getCheckboxProps;
      const checkboxProps = (getCheckboxProps ? getCheckboxProps(record) : null) ?? {};
      map.set(key, checkboxProps);
    });
    return map;
  });

  const isCheckboxDisabled = (r: RecordType): boolean => {
    const rowKey = getRowKey.value(r);
    let checkboxProps: Record<string, unknown> | undefined;
    if (checkboxPropsMap.value.has(rowKey)) {
      checkboxProps = checkboxPropsMap.value.get(getRowKey.value(r));
    } else {
      const getCheckboxProps = unref(rowSelectionRef)?.getCheckboxProps;
      checkboxProps = getCheckboxProps
        ? (getCheckboxProps(r) as Record<string, unknown>)
        : undefined;
    }
    return Boolean(checkboxProps?.disabled);
  };

  const derivedSelectedKeys = computed<[TableKey[], TableKey[]]>(() => {
    if (unref(rowSelectionRef)?.checkStrictly !== false) {
      return [mergedSelectedKeys.value, []];
    }
    const { checkedKeys, halfCheckedKeys } = conductCheck(
      mergedSelectedKeys.value,
      true,
      keyEntities.value,
    );
    return [checkedKeys, halfCheckedKeys];
  });

  const derivedSelectedKeySet = computed<Set<TableKey>>(() => {
    const [checked] = derivedSelectedKeys.value;
    const keys = unref(rowSelectionRef)?.type === 'radio' ? checked.slice(0, 1) : checked;
    return new Set(keys);
  });
  const derivedHalfSelectedKeySet = computed<Set<TableKey>>(() =>
    unref(rowSelectionRef)?.type === 'radio' ? new Set() : new Set(derivedSelectedKeys.value[1]),
  );

  // Reset if rowSelection reset
  watch(
    () => Boolean(unref(rowSelectionRef)),
    (has) => {
      if (!has) setMergedSelectedKeys([]);
    },
  );

  const setSelectedKeys = (
    keys: TableKey[],
    method: 'all' | 'none' | 'invert' | 'single' | 'multiple',
  ) => {
    let availableKeys: TableKey[];
    let records: (RecordType | undefined)[];
    if (unref(rowSelectionRef)?.preserveSelectedRowKeys) {
      availableKeys = keys;
      records = getRecords(keys);
    } else {
      availableKeys = [];
      records = [];
      keys.forEach((key) => {
        const record = config.getRecordByKey(key);
        if (record !== undefined) {
          availableKeys.push(key);
          records.push(record);
        }
      });
    }
    setMergedSelectedKeys(availableKeys);
    unref(rowSelectionRef)?.onChange?.(
      availableKeys,
      records.filter((record): record is RecordType => record !== undefined),
      { type: method },
    );
  };

  // Trigger single `onSelect` event
  const triggerSingleSelection = (
    key: TableKey,
    selected: boolean,
    keys: TableKey[],
    event: Event,
  ) => {
    const onSelect = unref(rowSelectionRef)?.onSelect as SelectionSelectFn<RecordType> | undefined;
    if (onSelect) {
      const rows = getRecords(keys);
      const record = getRecord(key);
      if (record !== undefined) onSelect(record, selected, rows, event);
    }
    setSelectedKeys(keys, 'single');
  };

  // ====================== Selections ======================
  const mergedSelections = computed<
    ((SelectionItem & { onSelect?: SelectionItemSelectFn }) | SelectionItem)[] | null
  >(() => {
    const rowSelection = unref(rowSelectionRef);
    if (!rowSelection?.selections || rowSelection.hideSelectAll) {
      return null;
    }
    const selectionList: (
      | typeof SELECTION_ALL
      | typeof SELECTION_INVERT
      | typeof SELECTION_NONE
      | SelectionItem
    )[] =
      rowSelection.selections === true
        ? [SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE]
        : rowSelection.selections;
    return selectionList.map((selection) => {
      let mergedSelection: SelectionItem;
      const sel = selection;
      if (sel === SELECTION_ALL) {
        mergedSelection = {
          key: 'all',
          text: config.locale.selectionAll,
          onSelect() {
            setSelectedKeys(
              config.data.value.reduce<TableKey[]>((keys, record, index) => {
                const key = getRowKey.value(record, index);
                if (!isCheckboxDisabled(record) || derivedSelectedKeySet.value.has(key)) {
                  keys.push(key);
                }
                return keys;
              }, []),
              'all',
            );
          },
        };
      } else if (sel === SELECTION_INVERT) {
        mergedSelection = {
          key: 'invert',
          text: config.locale.selectInvert,
          onSelect() {
            const keySet = new Set(derivedSelectedKeySet.value);
            config.pageData.value.forEach((record, index) => {
              const key = getRowKey.value(record, index);
              const checkProps = checkboxPropsMap.value.get(key);
              if (!checkProps?.disabled) {
                if (keySet.has(key)) keySet.delete(key);
                else keySet.add(key);
              }
            });
            const keys = Array.from(keySet);
            const onSelectInvert = rowSelection.onSelectInvert;
            onSelectInvert?.(keys);
            setSelectedKeys(keys, 'invert');
          },
        };
      } else if (sel === SELECTION_NONE) {
        mergedSelection = {
          key: 'none',
          text: config.locale.selectNone,
          onSelect() {
            rowSelection.onSelectNone?.();
            setSelectedKeys(
              Array.from(derivedSelectedKeySet.value).filter((key) => {
                const checkProps = checkboxPropsMap.value.get(key);
                return checkProps?.disabled;
              }),
              'none',
            );
          },
        };
      } else {
        mergedSelection = sel;
      }
      return {
        ...mergedSelection,
        onSelect: (currentRowKeys: TableKey[]) => {
          mergedSelection.onSelect?.(currentRowKeys);
          updatePrevSelectedIndex(null);
        },
      };
    });
  });

  // ======================= Columns ========================
  const transformColumns = (columns: ColumnsType<RecordType>): ColumnsType<RecordType> => {
    // ⚠️ 列定义可能被 Vue 的深层 reactive 代理（ctx/props 链）—— 哨兵的
    //    引用相等判断必须基于 toRaw（否则代理副本 ≠ 模块单例 ⇒ 选择列
    //    被重复插入、用户哨兵不被替换）。
    const rawColumns = columns.map((column) => toRaw(column));
    const rowSelection = unref(rowSelectionRef);
    if (!rowSelection) {
      return rawColumns.filter((col) => col !== SELECTION_COLUMN) as ColumnsType<RecordType>;
    }
    let cloneColumns: ColumnsType<RecordType> = [...rawColumns];
    const keySet = new Set(derivedSelectedKeySet.value);
    const recordKeys = flattedData.value.reduce<TableKey[]>((keys, record, index) => {
      const key = getRowKey.value(record, index);
      if (!checkboxPropsMap.value.get(key)?.disabled) {
        keys.push(key);
      }
      return keys;
    }, []);
    const checkedCurrentAll = recordKeys.every((key) => keySet.has(key));
    const checkedCurrentSome = recordKeys.some((key) => keySet.has(key));

    const onSelectAllChange = (checked: boolean) => {
      const changeKeys: TableKey[] = [];
      if (!checked) {
        recordKeys.forEach((key) => {
          keySet.delete(key);
          changeKeys.push(key);
        });
      } else {
        recordKeys.forEach((key) => {
          if (!keySet.has(key)) {
            keySet.add(key);
            changeKeys.push(key);
          }
        });
      }
      const keys = Array.from(keySet);
      rowSelection.onSelectAll?.(checked, getRecords(keys), getRecords(changeKeys));
      setSelectedKeys(keys, 'all');
      updatePrevSelectedIndex(null);
    };

    // ===================== Render =====================
    let title: VNodeChild;
    let columnTitleCheckbox: VNodeChild;
    if (rowSelection.type !== 'radio') {
      let customizeSelections: VNodeChild;
      if (mergedSelections.value) {
        customizeSelections = h('div', { class: `${config.prefixCls}-selection-extra` }, [
          h(
            Dropdown,
            {
              menu: {
                items: mergedSelections.value.map((selection) => ({
                  key: selection.key,
                  label: selection.text,
                  onClick: () => selection.onSelect?.(recordKeys),
                })),
              },
            },
            { default: () => h('span', null, h(DownOutlined)) },
          ),
        ]);
      }
      const allDisabledData = flattedData.value.reduce<Record<string, unknown>[]>(
        (list, record, index) => {
          const key = getRowKey.value(record, index);
          const checkboxProps = checkboxPropsMap.value.get(key) ?? {};
          const item: Record<string, unknown> = { checked: keySet.has(key), ...checkboxProps };
          if (item.disabled) {
            list.push(item);
          }
          return list;
        },
        [],
      );
      const allDisabled =
        allDisabledData.length > 0 && allDisabledData.length === flattedData.value.length;
      const allDisabledAndChecked = allDisabled && allDisabledData.every(({ checked }) => checked);
      const allDisabledSomeChecked = allDisabled && allDisabledData.some(({ checked }) => checked);
      const customCheckboxProps =
        (rowSelection.getTitleCheckboxProps?.() as Record<string, unknown>) ?? {};
      const { disabled } = customCheckboxProps;
      columnTitleCheckbox = h(
        Checkbox,
        mergeProps(customCheckboxProps ?? {}, {
          'aria-label': customizeSelections ? 'Custom selection' : 'Select all',
          checked: !allDisabled
            ? Boolean(flattedData.value.length) && checkedCurrentAll
            : allDisabledAndChecked,
          indeterminate: !allDisabled
            ? !checkedCurrentAll && checkedCurrentSome
            : !allDisabledAndChecked && allDisabledSomeChecked,
          onChange: (_event: Event, checked: boolean) => {
            onSelectAllChange(checked);
          },
          disabled: disabled ?? (flattedData.value.length === 0 || allDisabled),
          skipGroup: true,
        }),
      );
      title = (!rowSelection.hideSelectAll &&
        h('div', { class: `${config.prefixCls}-selection` }, [
          columnTitleCheckbox,
          customizeSelections,
        ])) as VNodeChild;
    }

    // Body Cell
    let renderCell: (
      _: unknown,
      record: RecordType,
      index: number,
    ) => { node: VNodeChild; checked: boolean };
    if (rowSelection.type === 'radio') {
      renderCell = (_, record, index) => {
        const key = getRowKey.value(record, index);
        const checked = keySet.has(key);
        const checkboxProps = rowSelection.getCheckboxProps?.(record);
        const defaultAriaLabel = `Select row ${index + 1}`;
        return {
          node: h(
            Radio,
            mergeProps(checkboxProps ?? {}, {
              'aria-label': defaultAriaLabel,
              checked,
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
              },
              onChange: (event: RadioChangeEvent) => {
                if (!keySet.has(key)) {
                  triggerSingleSelection(key, true, [key], event.nativeEvent);
                }
              },
            }),
          ),
          checked,
        };
      };
    } else {
      renderCell = (_, record, index) => {
        const key = getRowKey.value(record, index);
        const checked = keySet.has(key);
        const indeterminate = derivedHalfSelectedKeySet.value.has(key);
        const checkboxProps = rowSelection.getCheckboxProps?.(record);
        let mergedIndeterminate: boolean;
        if (config.expandType.value === 'nest') {
          mergedIndeterminate = indeterminate;
        } else {
          mergedIndeterminate = checkboxProps?.indeterminate ?? indeterminate;
        }
        const defaultAriaLabel = checked ? `Row ${index + 1} selected` : `Select row ${index + 1}`;
        let selectWithShift = false;
        return {
          node: h(
            Checkbox,
            mergeProps(checkboxProps ?? {}, {
              'aria-label': defaultAriaLabel,
              indeterminate: mergedIndeterminate,
              checked,
              skipGroup: true,
              onClick: (e: MouseEvent) => {
                selectWithShift = e.shiftKey;
                e.stopPropagation();
              },
              onChange: (nativeEvent: Event, proposedChecked: boolean) => {
                const shiftKey = selectWithShift;
                selectWithShift = false;
                const currentSelectedIndex = recordKeys.indexOf(key);
                const isMultiple =
                  derivedSelectedKeySet.value.size > 0 &&
                  recordKeys.some((k) => derivedSelectedKeySet.value.has(k));
                const checkStrictly = rowSelection.checkStrictly !== false;
                if (shiftKey && checkStrictly && isMultiple) {
                  const changedKeys = multipleSelect(
                    currentSelectedIndex,
                    recordKeys,
                    keySet,
                    proposedChecked,
                  );
                  const keys = Array.from(keySet);
                  rowSelection.onSelectMultiple?.(
                    proposedChecked,
                    getRecords(keys),
                    getRecords(changedKeys),
                  );
                  setSelectedKeys(keys, 'multiple');
                } else {
                  const originCheckedKeys = derivedSelectedKeys.value[0];
                  if (checkStrictly) {
                    const checkedKeys = !proposedChecked
                      ? arrDel(originCheckedKeys, key)
                      : arrAdd(originCheckedKeys, key);
                    triggerSingleSelection(key, proposedChecked, checkedKeys, nativeEvent);
                  } else {
                    const result = conductCheck(
                      [...originCheckedKeys, key],
                      true,
                      keyEntities.value,
                    );
                    let nextCheckedKeys = result.checkedKeys;
                    if (!proposedChecked) {
                      const tempKeySet = new Set(nextCheckedKeys);
                      tempKeySet.delete(key);
                      nextCheckedKeys = conductCheck(
                        Array.from(tempKeySet),
                        { checked: false, halfCheckedKeys: result.halfCheckedKeys },
                        keyEntities.value,
                      ).checkedKeys;
                    }
                    triggerSingleSelection(key, proposedChecked, nextCheckedKeys, nativeEvent);
                  }
                }
                if (!proposedChecked) {
                  updatePrevSelectedIndex(null);
                } else {
                  updatePrevSelectedIndex(currentSelectedIndex);
                }
              },
            }),
          ),
          checked,
        };
      };
    }

    const renderSelectionCell = (_: unknown, record: RecordType, index: number) => {
      const { node, checked } = renderCell(_, record, index);
      if (rowSelection.renderCell) {
        return rowSelection.renderCell(checked, record, index, node);
      }
      return node;
    };

    // Insert selection column if not exist
    if (!cloneColumns.includes(SELECTION_COLUMN)) {
      const expandColumn = cloneColumns[0];
      cloneColumns =
        expandColumn?.[INTERNAL_COL_DEFINE]?.columnType === 'EXPAND_COLUMN'
          ? [expandColumn, SELECTION_COLUMN, ...cloneColumns.slice(1)]
          : [SELECTION_COLUMN, ...cloneColumns];
    }
    // Deduplicate selection column
    const selectionColumnIndex = cloneColumns.indexOf(SELECTION_COLUMN);
    cloneColumns = cloneColumns.filter(
      (column, index) => column !== SELECTION_COLUMN || index === selectionColumnIndex,
    );
    // Fixed column logic
    const prevCol = cloneColumns[selectionColumnIndex - 1];
    const nextCol = cloneColumns[selectionColumnIndex + 1];
    let mergedFixed: ColumnType<RecordType>['fixed'] = rowSelection.fixed;
    if (mergedFixed === undefined) {
      if (nextCol?.fixed !== undefined) {
        mergedFixed = nextCol.fixed;
      } else if (prevCol?.fixed !== undefined) {
        mergedFixed = prevCol.fixed;
      }
    }
    if (
      mergedFixed &&
      prevCol &&
      prevCol[INTERNAL_COL_DEFINE]?.columnType === 'EXPAND_COLUMN' &&
      prevCol.fixed === undefined
    ) {
      prevCol.fixed = mergedFixed;
    }
    const columnCls = clsx(`${config.prefixCls}-selection-col`, {
      [`${config.prefixCls}-selection-col-with-dropdown`]:
        Boolean(rowSelection.selections) && rowSelection.type === 'checkbox',
    });
    const renderTitle = () => {
      if (rowSelection.columnTitle === undefined) {
        return title;
      }
      if (isFunction(rowSelection.columnTitle)) {
        return rowSelection.columnTitle(columnTitleCheckbox);
      }
      return rowSelection.columnTitle;
    };

    const selectionColumn = {
      fixed: mergedFixed,
      width: rowSelection.columnWidth,
      className: `${config.prefixCls}-selection-column`,
      title: renderTitle(),
      render: renderSelectionCell,
      onCell: rowSelection.onCell,
      align: rowSelection.align,
      [INTERNAL_COL_DEFINE]: { class: columnCls },
    };
    // 用真实选择列替换哨兵（rc 逐字）
    return cloneColumns.map((col) =>
      col === SELECTION_COLUMN ? selectionColumn : col,
    ) as ColumnsType<RecordType>;
  };

  return { transformColumns, derivedSelectedKeySet };
}
