/**
 * antd `table/hooks/useFilter/`（index 222 + FilterDropdown 476 + FilterSearch 28 +
 * FilterWrapper 22 行）—— Vue 移植。
 *
 * 受控判据（§3 验收点）：`'filteredValue' in column`（显式 null 也算受控，
 * 收集时不再 String() 映射 —— antd 仅在 filterDropdown 缺席时才 map(String)）。
 */

import { FilterFilled } from '@apollo-design/icons';
import { isEqual, isFunction, isNumber } from '@apollo-design/utils';
import { type ComputedRef, computed, defineComponent, h, type PropType, ref, watch } from 'vue';
import Button from '../../button/Button.vue';
import Checkbox from '../../checkbox/Checkbox';
import Dropdown from '../../dropdown/Dropdown';
import Empty from '../../empty/Empty.vue';
import Menu from '../../menu/Menu';
import { clsx } from '../../notification/engine/util';
import Radio from '../../radio/Radio';
import Tree from '../../tree/Tree';
import type {
  ColumnFilterItem,
  ColumnsType,
  ColumnType,
  FilterValue,
  TableKey,
  TableLocale,
} from '../interface';
import { getColumnKey, getColumnPos, renderColumnTitle } from '../util';

// ============================== 类型 ==============================

/** 过滤列的内部状态（rc `FilterState`）。 */
export interface TableFilterState<RecordType = Record<string, unknown>> {
  column: ColumnType<RecordType>;
  key: TableKey;
  filteredKeys: FilterValue | null | undefined;
  forceFiltered?: boolean;
}

// ============================== FilterSearch ==============================

const FilterSearch = (props: {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  placeholder?: string;
}) =>
  h('div', { class: 'apollo-table-filter-dropdown-search' }, [
    h('input', {
      class: 'apollo-table-filter-dropdown-search-input',
      value: props.value,
      placeholder: props.placeholder,
      onInput: (e: Event) =>
        props.onChange({ target: { value: (e.target as HTMLInputElement).value } }),
    }),
  ]);

// ============================== FilterWrapper ==============================

const FilterWrapper = defineComponent({
  name: 'TableFilterDropdownMenuWrapper',
  props: { className: { type: String, default: undefined } },
  setup(props, { slots }) {
    return () => h('div', { class: props.className }, slots.default?.() as never);
  },
});

// ============================== flattenKeys ==============================

export function flattenKeys(filters?: ColumnFilterItem[]): (TableKey | boolean)[] {
  let keys: (TableKey | boolean)[] = [];
  (filters ?? []).forEach(({ value, children }) => {
    keys.push(value);
    if (children) {
      keys = [...keys, ...flattenKeys(children)];
    }
  });
  return keys;
}

function hasSubMenu(filters: ColumnFilterItem[]): boolean {
  return filters.some(({ children }) => children);
}

const searchValueMatched = (normalizedSearchValue: string, text: unknown): boolean => {
  if (typeof text === 'string' || isNumber(text)) {
    return (text as string).toString().toLowerCase().includes(normalizedSearchValue);
  }
  return false;
};

function wrapStringListType(keys: FilterValue | null | undefined): FilterValue {
  return keys || [];
}

// ============================== collectFilterStates ==============================

export function collectFilterStates<RecordType>(
  columns: ColumnsType<RecordType>,
  init: boolean,
  pos?: string,
): TableFilterState<RecordType>[] {
  let filterStates: TableFilterState<RecordType>[] = [];
  (columns ?? []).forEach((raw, index) => {
    const column = raw as ColumnType<RecordType>;
    const columnPos = getColumnPos(index, pos);
    const filterDropdownIsDefined = column.filterDropdown !== undefined;
    if (column.filters || filterDropdownIsDefined || 'onFilter' in column) {
      if ('filteredValue' in column) {
        // 受控
        let filteredValues = column.filteredValue as FilterValue | null | undefined;
        if (!filterDropdownIsDefined) {
          filteredValues = filteredValues?.map(String) as FilterValue | null | undefined;
        }
        filterStates.push({
          column,
          key: getColumnKey(column as never, columnPos),
          filteredKeys: filteredValues,
          forceFiltered: column.filtered,
        });
      } else {
        // 非受控
        filterStates.push({
          column,
          key: getColumnKey(column as never, columnPos),
          filteredKeys:
            init && column.defaultFilteredValue
              ? (column.defaultFilteredValue as FilterValue)
              : undefined,
          forceFiltered: column.filtered,
        });
      }
    }
    if ('children' in column) {
      filterStates = [
        ...filterStates,
        ...collectFilterStates(
          (column as unknown as { children: ColumnsType<RecordType> }).children,
          init,
          columnPos,
        ),
      ];
    }
  });
  return filterStates;
}

function injectFilter<RecordType>(
  prefixCls: string,
  dropdownPrefixCls: string,
  columns: ColumnsType<RecordType>,
  filterStates: TableFilterState<RecordType>[],
  locale: TableLocale,
  triggerFilter: (state: TableFilterState<RecordType>) => void,
  getPopupContainer: ((node: HTMLElement) => HTMLElement) | undefined,
  pos?: string,
  rootClassName?: string,
): ColumnsType<RecordType> {
  return columns.map((raw, index) => {
    const column = raw as ColumnType<RecordType>;
    const columnPos = getColumnPos(index, pos);
    const {
      filterOnClose = true,
      filterMultiple = true,
      filterMode,
      filterSearch,
    } = column as ColumnType<RecordType>;
    let newColumn = column;
    if (newColumn.filters || newColumn.filterDropdown) {
      const columnKey = getColumnKey(newColumn as never, columnPos);
      const filterState = filterStates.find(({ key }) => columnKey === key);
      newColumn = {
        ...newColumn,
        title: (renderProps: unknown) =>
          h(
            FilterDropdown,
            {
              tablePrefixCls: prefixCls,
              prefixCls: `${prefixCls}-filter`,
              dropdownPrefixCls,
              column: newColumn as never,
              columnKey,
              filterState: filterState as never,
              filterOnClose,
              filterMultiple,
              filterMode,
              filterSearch: filterSearch as never,
              triggerFilter: triggerFilter as never,
              locale,
              getPopupContainer,
              rootClassName,
            },
            { default: () => renderColumnTitle(column.title, renderProps) as never },
          ),
      } as ColumnType<RecordType>;
    }
    if ('children' in newColumn) {
      newColumn = {
        ...newColumn,
        children: injectFilter(
          prefixCls,
          dropdownPrefixCls,
          (newColumn as unknown as { children: ColumnsType<RecordType> }).children,
          filterStates,
          locale,
          triggerFilter,
          getPopupContainer,
          columnPos,
          rootClassName,
        ),
      } as ColumnType<RecordType>;
    }
    return newColumn;
  });
}

function generateFilterInfo<RecordType>(
  filterStates: TableFilterState<RecordType>[],
): Record<string, FilterValue | null> {
  const currentFilters: Record<string, FilterValue | null> = {};
  filterStates.forEach(({ key, filteredKeys, column }) => {
    const keyAsString = String(key);
    const { filters, filterDropdown } = column as ColumnType;
    if (filterDropdown) {
      currentFilters[keyAsString] = (filteredKeys as FilterValue) || null;
    } else if (Array.isArray(filteredKeys)) {
      const keys = flattenKeys(filters);
      currentFilters[keyAsString] = keys.filter((originKey) =>
        filteredKeys.includes(String(originKey)),
      );
    } else {
      currentFilters[keyAsString] = null;
    }
  });
  return currentFilters;
}

export function getFilterData<RecordType>(
  data: RecordType[],
  filterStates: TableFilterState<RecordType>[],
  childrenColumnName: string,
): RecordType[] {
  const filterDatas = filterStates.reduce((currentData, filterState) => {
    const {
      column: { onFilter, filters },
      filteredKeys,
    } = filterState;
    if (onFilter && filteredKeys?.length) {
      // 树形过滤键的预处理：Map 提升查找到 O(1)
      const flatKeys = flattenKeys(filters);
      const keyMap = new Map<string, TableKey | boolean>();
      flatKeys.forEach((k) => {
        const strKey = String(k);
        if (!keyMap.has(strKey)) {
          keyMap.set(strKey, k);
        }
      });
      const realKeys = filteredKeys.map((key) => keyMap.get(String(key)) ?? key);
      const internalFilter = (subset: RecordType[]): RecordType[] =>
        subset.reduce<RecordType[]>((acc, record) => {
          const clonedRecord = { ...(record as Record<string, unknown>) };
          if (clonedRecord[childrenColumnName]) {
            clonedRecord[childrenColumnName] = getFilterData(
              clonedRecord[childrenColumnName] as RecordType[],
              filterStates,
              childrenColumnName,
            );
          }
          if (
            realKeys.some((realKey) =>
              (onFilter as (v: TableKey | boolean, r: RecordType) => boolean)(
                realKey,
                clonedRecord as RecordType,
              ),
            )
          ) {
            acc.push(clonedRecord as RecordType);
          }
          return acc;
        }, []);
      return internalFilter(currentData);
    }
    return currentData;
  }, data);
  return filterDatas;
}

// ============================== FilterDropdown 组件 ==============================

const FilterDropdown = defineFilterDropdownComponent();
function defineFilterDropdownComponent() {
  return defineComponent({
    name: 'TableFilterDropdown',
    props: {
      tablePrefixCls: { type: String, required: true },
      prefixCls: { type: String, required: true },
      dropdownPrefixCls: { type: String, required: true },
      column: { type: Object as PropType<ColumnType>, required: true },
      columnKey: { type: [String, Number] as PropType<TableKey>, required: true },
      filterState: { type: Object as PropType<TableFilterState>, default: undefined },
      filterOnClose: { type: Boolean, default: true },
      filterMultiple: { type: Boolean, default: true },
      filterMode: { type: String as PropType<'menu' | 'tree'>, default: 'menu' },
      filterSearch: { type: null, default: false },
      triggerFilter: {
        type: Function as PropType<(state: TableFilterState) => void>,
        required: true,
      },
      locale: { type: Object as PropType<TableLocale>, required: true },
      getPopupContainer: { type: Function, default: undefined },
      rootClassName: { type: String, default: undefined },
    },
    setup(props, { slots }) {
      const column = computed(() => props.column);
      const {
        filterResetToDefaultFilteredValue,
        defaultFilteredValue,
        filterDropdownProps = {},
        filterDropdownOpen,
        onFilterDropdownOpenChange,
      } = column.value as ColumnType & {
        filterDropdownProps?: { onOpenChange?: (open: boolean) => void; open?: boolean };
      };

      const visible = ref(false);
      const filtered = computed(() =>
        Boolean(
          props.filterState &&
            (props.filterState.filteredKeys?.length || props.filterState.forceFiltered),
        ),
      );
      const triggerOpen = (nextOpen: boolean) => {
        visible.value = nextOpen;
        filterDropdownProps?.onOpenChange?.(nextOpen);
        // deprecated
        onFilterDropdownOpenChange?.(nextOpen);
      };
      const mergedVisible = computed(
        () => filterDropdownProps?.open ?? filterDropdownOpen ?? visible.value,
      );

      // ===================== Select Keys =====================
      const propFilteredKeys = computed(() => props.filterState?.filteredKeys);
      const filteredKeysSync = ref<FilterValue>(wrapStringListType(propFilteredKeys.value));
      const getFilteredKeysSync = () => filteredKeysSync.value;
      const setFilteredKeysSync = (keys: FilterValue) => {
        filteredKeysSync.value = keys;
      };
      const onSelectKeys = ({ selectedKeys }: { selectedKeys: FilterValue }) => {
        setFilteredKeysSync(selectedKeys);
      };
      const onCheck = (
        keys: (TableKey | boolean)[],
        info: { node: { key: TableKey }; checked: boolean },
      ) => {
        if (!props.filterMultiple) {
          onSelectKeys({ selectedKeys: info.checked ? [info.node.key] : [] });
        } else {
          onSelectKeys({ selectedKeys: keys as FilterValue });
        }
      };
      watch([propFilteredKeys, mergedVisible], () => {
        if (!mergedVisible.value) return;
        onSelectKeys({ selectedKeys: wrapStringListType(propFilteredKeys.value) });
      });

      // ====================== Search ======================
      const searchValue = ref('');
      const normalizedSearchValue = computed(() => searchValue.value.trim().toLowerCase());
      watch(mergedVisible, (v) => {
        if (!v) searchValue.value = '';
      });

      // ======================= Submit ========================
      const internalTriggerFilter = (keys: FilterValue | null) => {
        const mergedKeys = keys?.length ? keys : null;
        if (mergedKeys === null && !props.filterState?.filteredKeys) {
          return;
        }
        if (isEqual(mergedKeys, props.filterState?.filteredKeys ?? null)) {
          return;
        }
        props.triggerFilter({
          column: props.column,
          key: props.columnKey,
          filteredKeys: mergedKeys,
          forceFiltered: props.filterState?.forceFiltered,
        } as TableFilterState);
      };
      const onConfirm = () => {
        triggerOpen(false);
        internalTriggerFilter(getFilteredKeysSync());
      };
      const onReset = (opts?: { confirm?: boolean; closeDropdown?: boolean }) => {
        const { confirm = false, closeDropdown = false } = opts ?? {};
        if (confirm) internalTriggerFilter([]);
        if (closeDropdown) triggerOpen(false);
        searchValue.value = '';
        if (filterResetToDefaultFilteredValue) {
          setFilteredKeysSync((defaultFilteredValue ?? []).map(String));
        } else {
          setFilteredKeysSync([]);
        }
      };
      const doFilter = (opts?: { closeDropdown?: boolean }) => {
        const { closeDropdown = true } = opts ?? {};
        if (closeDropdown) triggerOpen(false);
        internalTriggerFilter(getFilteredKeysSync());
      };
      const onDropdownOpenChange = (nextOpen: boolean, info: { source?: string }) => {
        if (info.source === 'trigger') {
          if (nextOpen && propFilteredKeys.value !== undefined) {
            setFilteredKeysSync(wrapStringListType(propFilteredKeys.value));
          }
          if (!nextOpen && !column.value.filterDropdown && props.filterOnClose) {
            onConfirm();
          } else {
            triggerOpen(nextOpen);
          }
        }
      };

      const dropdownMenuClass = computed(() =>
        clsx({
          [`${props.dropdownPrefixCls}-menu-without-submenu`]: !hasSubMenu(
            (column.value.filters ?? []) as ColumnFilterItem[],
          ),
        }),
      );
      const onCheckAll = (e: { target: { checked: boolean } }) => {
        if (e.target.checked) {
          const allFilterKeys = flattenKeys(column.value.filters as ColumnFilterItem[]).map(String);
          setFilteredKeysSync(allFilterKeys);
        } else {
          setFilteredKeysSync([]);
        }
      };
      const getTreeData = (
        filters?: ColumnFilterItem[],
      ): { title: unknown; key: string; children?: unknown[] }[] =>
        (filters ?? []).map((filter, index) => {
          const key = String(filter.value);
          const item: { title: unknown; key: string; children?: unknown[] } = {
            title: filter.text,
            key: filter.value !== undefined ? key : String(index),
          };
          if (filter.children) {
            item.children = getTreeData(filter.children);
          }
          return item;
        });

      const renderFilterItems = (options: {
        filters: ColumnFilterItem[];
        filteredKeys: FilterValue;
        filterMultiple: boolean;
        normalizedSearchValue: string;
      }): unknown[] =>
        options.filters.map((filter, index) => {
          const key = String(filter.value);
          if (filter.children) {
            return {
              key: key || index,
              label: filter.text,
              children: renderFilterItems({
                filters: filter.children,
                filteredKeys: options.filteredKeys,
                filterMultiple: options.filterMultiple,
                normalizedSearchValue: options.normalizedSearchValue,
              }),
            };
          }
          const Comp = options.filterMultiple ? Checkbox : Radio;
          const item = {
            key: filter.value !== undefined ? key : index,
            label: h('span', null, [
              h(Comp, { checked: options.filteredKeys.includes(key) } as never),
              h('span', null, filter.text as never),
            ]),
          };
          if (options.normalizedSearchValue) {
            if (isFunction(props.filterSearch)) {
              return (props.filterSearch as (v: string, f: ColumnFilterItem) => boolean)(
                options.normalizedSearchValue,
                filter,
              )
                ? item
                : null;
            }
            return searchValueMatched(options.normalizedSearchValue, filter.text) ? item : null;
          }
          return item;
        });

      return () => {
        let dropdownContent: unknown;
        if (isFunction(column.value.filterDropdown)) {
          const fn = column.value.filterDropdown as unknown as (
            p: Record<string, unknown>,
          ) => unknown;
          dropdownContent = fn({
            prefixCls: `${props.dropdownPrefixCls}-custom`,
            setSelectedKeys: (selectedKeys: TableKey[]) =>
              onSelectKeys({ selectedKeys: selectedKeys as FilterValue }),
            selectedKeys: getFilteredKeysSync(),
            confirm: doFilter,
            clearFilters: onReset,
            filters: column.value.filters,
            visible: mergedVisible.value,
            close: () => triggerOpen(false),
          });
        } else if (column.value.filterDropdown) {
          dropdownContent = column.value.filterDropdown;
        } else {
          const selectedKeys = getFilteredKeysSync() ?? [];
          const empty = h(Empty, {
            description: props.locale.filterEmptyText,
            style: { margin: 0, padding: '16px 0' },
          } as never);
          const filters = (column.value.filters ?? []) as ColumnFilterItem[];
          let filterComponent: unknown;
          if (filters.length === 0) {
            filterComponent = empty;
          } else if (props.filterMode === 'tree') {
            const treeData = getTreeData(filters);
            const flatCount = flattenKeys(filters).length;
            filterComponent = h('div', { class: `${props.tablePrefixCls}-filter-dropdown-tree` }, [
              props.filterMultiple
                ? h(
                    Checkbox,
                    {
                      checked: selectedKeys.length === flatCount,
                      indeterminate: selectedKeys.length > 0 && selectedKeys.length < flatCount,
                      class: `${props.tablePrefixCls}-filter-dropdown-checkall`,
                      onChange: onCheckAll,
                    } as never,
                    { default: () => props.locale.filterCheckAll ?? props.locale.filterCheckall },
                  )
                : null,
              h(Tree, {
                checkable: true,
                selectable: false,
                blockNode: true,
                multiple: props.filterMultiple,
                checkStrictly: !props.filterMultiple,
                class: `${props.dropdownPrefixCls}-menu`,
                onCheck: onCheck,
                checkedKeys: selectedKeys,
                selectedKeys: selectedKeys,
                showIcon: false,
                treeData,
                autoExpandParent: true,
                defaultExpandAll: true,
                filterTreeNode: normalizedSearchValue.value
                  ? (node: { title?: unknown }) => {
                      if (isFunction(props.filterSearch)) {
                        return (props.filterSearch as (v: string, f: unknown) => boolean)(
                          searchValue.value,
                          node,
                        );
                      }
                      return searchValueMatched(normalizedSearchValue.value, node.title);
                    }
                  : undefined,
              } as never),
            ]);
          } else {
            const items = renderFilterItems({
              filters,
              filteredKeys: getFilteredKeysSync() ?? [],
              filterMultiple: props.filterMultiple,
              normalizedSearchValue: normalizedSearchValue.value,
            });
            const isEmpty = items.every((item) => item === null);
            filterComponent = [
              h(FilterSearch, {
                value: searchValue.value,
                onChange: (e: { target: { value: string } }) => {
                  searchValue.value = e.target.value;
                },
                placeholder: props.locale.filterSearchPlaceholder,
              }),
              isEmpty
                ? empty
                : h(Menu, {
                    selectable: true,
                    multiple: props.filterMultiple,
                    prefixCls: `${props.dropdownPrefixCls}-menu`,
                    class: dropdownMenuClass.value,
                    onSelect: (info: { selectedKeys: string[] }) =>
                      onSelectKeys({ selectedKeys: info.selectedKeys }),
                    onDeselect: (info: { selectedKeys: string[] }) =>
                      onSelectKeys({ selectedKeys: info.selectedKeys }),
                    selectedKeys: selectedKeys as string[],
                    getPopupContainer: props.getPopupContainer,
                    items: items as never,
                  } as never),
            ];
          }
          const getResetDisabled = () => {
            if (filterResetToDefaultFilteredValue) {
              return isEqual((defaultFilteredValue ?? []).map(String), selectedKeys);
            }
            return selectedKeys.length === 0;
          };
          dropdownContent = [
            filterComponent,
            h('div', { class: `${props.prefixCls}-dropdown-btns` }, [
              h(
                Button,
                {
                  type: 'link',
                  size: 'small',
                  disabled: getResetDisabled(),
                  onClick: () => onReset(),
                },
                { default: () => props.locale.filterReset },
              ),
              h(
                Button,
                { type: 'primary', size: 'small', onClick: onConfirm },
                { default: () => props.locale.filterConfirm },
              ),
            ]),
          ];
        }

        // ⚠️ 先捕获内层内容再包装 —— 若插槽闭包直接引用 dropdownContent 变量，
        //    变量已被重赋值为包装层 ⇒ 插槽渲染自身 ⇒ 无限递归（React 无此坑：
        //    children 是立即求值的引用）。
        const dropdownInner = dropdownContent;
        dropdownContent = h(
          FilterWrapper,
          { className: `${props.prefixCls}-dropdown` },
          { default: () => dropdownInner },
        );

        // 触发器
        let filterIcon: unknown;
        if (isFunction(column.value.filterIcon)) {
          filterIcon = (column.value.filterIcon as (f: boolean) => unknown)(filtered.value);
        } else if (column.value.filterIcon) {
          filterIcon = column.value.filterIcon;
        } else {
          filterIcon = h(FilterFilled);
        }
        const triggerNode = h(
          'span',
          {
            role: 'button',
            tabIndex: -1,
            class: clsx(`${props.prefixCls}-trigger`, { active: filtered.value }),
            onClick: (e: MouseEvent) => e.stopPropagation(),
          },
          [filterIcon as never],
        );

        return h('div', { class: `${props.prefixCls}-column` }, [
          h('span', { class: `${props.tablePrefixCls}-column-title` }, slots.default?.() as never),
          h(
            Dropdown,
            {
              trigger: ['click'],
              placement: 'bottomRight',
              getPopupContainer: props.getPopupContainer,
              ...(filterDropdownProps ?? {}),
              rootClassName: clsx(props.rootClassName, filterDropdownProps?.rootClassName),
              open: mergedVisible.value,
              onOpenChange: onDropdownOpenChange as never,
              menu: { items: [] },
            } as never,
            {
              default: () => [triggerNode as never],
              popupRender: (slotProps: { originNode: unknown }) => {
                void slotProps;
                if (
                  isFunction((filterDropdownProps as { dropdownRender?: unknown })?.dropdownRender)
                ) {
                  return (
                    filterDropdownProps as { dropdownRender: (n: unknown) => unknown }
                  ).dropdownRender(dropdownContent) as never;
                }
                return dropdownContent as never;
              },
            },
          ),
        ]);
      };
    },
  });
}

// ============================== useFilter ==============================

function getMergedColumns<RecordType>(
  rawMergedColumns: ColumnsType<RecordType>,
): ColumnsType<RecordType> {
  return rawMergedColumns.flatMap((column) => {
    if ('children' in column) {
      return [
        column,
        ...getMergedColumns(
          ((column as unknown as { children?: ColumnsType<RecordType> }).children ??
            []) as ColumnsType<RecordType>,
        ),
      ];
    }
    return [column];
  });
}

export interface UseFilterParams<RecordType> {
  prefixCls: string;
  dropdownPrefixCls: string;
  mergedColumns: ComputedRef<ColumnsType<RecordType>>;
  baseColumns: ComputedRef<ColumnsType<RecordType>>;
  onFilterChange: (
    filters: Record<string, FilterValue | null>,
    filterStates: TableFilterState<RecordType>[],
  ) => void;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  locale: TableLocale;
  rootClassName?: string;
}

export function useFilter<RecordType>(params: UseFilterParams<RecordType>): {
  transformColumns: (columns: ColumnsType<RecordType>) => ColumnsType<RecordType>;
  filterStates: ComputedRef<TableFilterState<RecordType>[]>;
  filters: ComputedRef<Record<string, FilterValue | null>>;
} {
  const {
    prefixCls,
    dropdownPrefixCls,
    baseColumns,
    onFilterChange,
    getPopupContainer,
    locale: tableLocale,
    rootClassName,
  } = params;
  const mergedColumns = computed(() =>
    getMergedColumns(baseColumns.value ?? params.mergedColumns.value ?? []),
  );
  const filterStates = ref<TableFilterState<RecordType>[]>(
    collectFilterStates(mergedColumns.value, true),
  );

  const mergedFilterStates = computed<TableFilterState<RecordType>[]>(() => {
    const collectedStates = collectFilterStates(mergedColumns.value, false);
    if (collectedStates.length === 0) {
      return collectedStates;
    }
    let filteredKeysIsAllNotControlled = true;
    let _filteredKeysIsAllControlled = true;
    collectedStates.forEach(({ filteredKeys }) => {
      if (filteredKeys !== undefined) {
        filteredKeysIsAllNotControlled = false;
      } else {
        _filteredKeysIsAllControlled = false;
      }
    });
    if (filteredKeysIsAllNotControlled) {
      const keyList = mergedColumns.value.map((column, index) =>
        getColumnKey(column as never, getColumnPos(index)),
      );
      // ⚠️ 显式 any：TS2589（实例化过深）在这里无解 —— reduce 链套了 4 层泛型
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // biome-ignore lint/suspicious/noExplicitAny: TS2589（4 层泛型链实例化过深），any 化是本仓已登记的逃生口
      return (filterStates.value as any[]).reduce<TableFilterState<RecordType>[]>(
        // biome-ignore lint/suspicious/noExplicitAny: TS2589（4 层泛型链实例化过深），any 化是本仓已登记的逃生口
        (list: any[], item: any) => {
          const keyIndex = keyList.indexOf(item.key);
          if (keyIndex !== -1) {
            const col = mergedColumns.value[keyIndex] as ColumnType<RecordType>;
            list.push({
              ...item,
              column: { ...item.column, ...col },
              forceFiltered: col.filtered,
            } as TableFilterState<RecordType>);
          }
          return list;
        },
        [],
      );
    }
    return collectedStates;
  });

  const filters = computed(() => generateFilterInfo(mergedFilterStates.value));

  const triggerFilter = (filterState: TableFilterState<RecordType>) => {
    const newFilterStates = mergedFilterStates.value.filter(({ key }) => key !== filterState.key);
    newFilterStates.push(filterState);
    filterStates.value = newFilterStates;
    onFilterChange(generateFilterInfo(newFilterStates), newFilterStates);
  };

  const transformColumns = (innerColumns: ColumnsType<RecordType>): ColumnsType<RecordType> =>
    injectFilter(
      prefixCls,
      dropdownPrefixCls,
      innerColumns,
      mergedFilterStates.value,
      tableLocale,
      triggerFilter,
      getPopupContainer,
      undefined,
      rootClassName,
    );

  return { transformColumns, filterStates: computed(() => mergedFilterStates.value), filters };
}
