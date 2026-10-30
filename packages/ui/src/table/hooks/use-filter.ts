/**
 * antd `table/hooks/useFilter/`（index 222 + FilterDropdown 476 + FilterSearch 28 +
 * FilterWrapper 22 行）—— Vue 移植。
 *
 * 受控判据（§3 验收点）：`'filteredValue' in column`（显式 null 也算受控，
 * 收集时不再 String() 映射 —— antd 仅在 filterDropdown 缺席时才 map(String)）。
 */

import { FilterFilled } from '@apollo-design/icons';
import { isEqual, isNumber, useControlledValue } from '@apollo-design/utils';
import {
  type ComputedRef,
  computed,
  defineComponent,
  h,
  type MaybeRefOrGetter,
  ref,
  type SetupContext,
  type SlotsType,
  toValue,
  type VNodeChild,
  watch,
} from 'vue';
import { clsx } from '../../_internal/clsx';
import Button from '../../button/Button.vue';
import Checkbox from '../../checkbox/Checkbox';
import Dropdown from '../../dropdown/Dropdown';
import type { DropdownOpenInfo } from '../../dropdown/interface';
import Empty from '../../empty/Empty.vue';
import type { ItemType } from '../../menu/interface';
import Menu from '../../menu/Menu';
import Radio from '../../radio/Radio';
import type {
  DataNode,
  EventDataNode,
  SafeKey,
  TreeCheckedKeys,
  TreeCheckInfo,
} from '../../tree/interface';
import Tree from '../../tree/Tree';
import type {
  ColumnFilterItem,
  ColumnsType,
  ColumnTitleProps,
  ColumnType,
  FilterSearchType,
  FilterValue,
  GetPopupContainer,
  TableKey,
  TableLocale,
} from '../interface';
import { useTableTheme } from '../use-table-theme';
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
  onChange: (value: string) => void;
  placeholder?: string;
}) =>
  h('div', { class: 'apollo-table-filter-dropdown-search' }, [
    h('input', {
      class: 'apollo-table-filter-dropdown-search-input',
      value: props.value,
      placeholder: props.placeholder,
      onInput: (e: Event) => props.onChange((e.currentTarget as HTMLInputElement).value),
    }),
  ]);

// ============================== FilterWrapper ==============================

const FilterWrapper = defineComponent({
  name: 'TableFilterDropdownMenuWrapper',
  props: { className: { type: String, default: undefined } },
  setup(props, { slots }) {
    return () => h('div', { class: props.className }, slots.default?.());
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
          key: getColumnKey(column, columnPos),
          filteredKeys: filteredValues,
          forceFiltered: column.filtered,
        });
      } else {
        // 非受控
        filterStates.push({
          column,
          key: getColumnKey(column, columnPos),
          filteredKeys:
            init && column.defaultFilteredValue
              ? (column.defaultFilteredValue as FilterValue)
              : undefined,
          forceFiltered: column.filtered,
        });
      }
    }
    if (column.children) {
      filterStates = [...filterStates, ...collectFilterStates(column.children, init, columnPos)];
    }
  });
  return filterStates;
}

function injectFilter<RecordType extends object>(
  prefixCls: string,
  dropdownPrefixCls: string,
  columns: ColumnsType<RecordType>,
  filterStates: TableFilterState<RecordType>[],
  locale: TableLocale,
  triggerFilter: (state: TableFilterState<RecordType>) => void,
  getPopupContainer: GetPopupContainer | undefined,
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
      const columnKey = getColumnKey(newColumn, columnPos);
      const filterState = filterStates.find(({ key }) => columnKey === key);
      newColumn = {
        ...newColumn,
        title: (renderProps: ColumnTitleProps<RecordType>) =>
          h(
            FilterDropdown<RecordType>,
            {
              tablePrefixCls: prefixCls,
              prefixCls: `${prefixCls}-filter`,
              dropdownPrefixCls,
              column: newColumn,
              columnKey,
              filterState,
              filterOnClose,
              filterMultiple,
              filterMode,
              filterSearch,
              triggerFilter,
              locale,
              getPopupContainer,
              rootClassName,
            },
            { default: () => renderColumnTitle(column.title, renderProps) },
          ),
      } as ColumnType<RecordType>;
    }
    if (newColumn.children) {
      newColumn = {
        ...newColumn,
        children: injectFilter(
          prefixCls,
          dropdownPrefixCls,
          newColumn.children,
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

interface FilterDropdownComponentProps<RecordType> {
  tablePrefixCls: string;
  prefixCls: string;
  dropdownPrefixCls: string;
  column: ColumnType<RecordType>;
  columnKey: TableKey;
  filterState?: TableFilterState<RecordType>;
  filterOnClose?: boolean;
  filterMultiple?: boolean;
  filterMode?: 'tree' | 'menu';
  filterSearch?: FilterSearchType<ColumnFilterItem>;
  triggerFilter: (state: TableFilterState<RecordType>) => void;
  locale: TableLocale;
  getPopupContainer?: GetPopupContainer;
  rootClassName?: string;
}
const NativeFilterDropdown = defineComponent(
  <RecordType extends object>(
    props: FilterDropdownComponentProps<RecordType>,
    { slots }: SetupContext<[], SlotsType<{ default?: () => VNodeChild }>>,
  ) => {
    const tablePrefix = () => props.prefixCls.replace(/-filter$/, '');
    const tableStyle = useTableTheme(tablePrefix);
    const column = computed(() => props.column);
    const filterDropdownProps = computed(() => column.value.filterDropdownProps ?? {});
    const [visible, setVisible] = useControlledValue<boolean>({
      defaultValue: () => filterDropdownProps.value.defaultOpen ?? false,
      getValue: () => filterDropdownProps.value.open ?? column.value.filterDropdownOpen,
    });
    const filtered = computed(() =>
      Boolean(
        props.filterState &&
          (props.filterState.filteredKeys?.length || props.filterState.forceFiltered),
      ),
    );
    const triggerOpen = (nextOpen: boolean, info: DropdownOpenInfo = { source: 'trigger' }) => {
      setVisible(nextOpen);
      filterDropdownProps.value.onOpenChange?.(nextOpen, info);
      column.value.onFilterDropdownOpenChange?.(nextOpen);
    };
    const mergedVisible = visible;

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
    const onCheck = (keys: SafeKey[] | TreeCheckedKeys, info: TreeCheckInfo) => {
      if (!props.filterMultiple) {
        onSelectKeys({ selectedKeys: info.checked ? [info.node.key] : [] });
      } else {
        onSelectKeys({ selectedKeys: Array.isArray(keys) ? keys : keys.checked });
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
      });
    };
    const onConfirm = () => {
      triggerOpen(false);
      internalTriggerFilter(getFilteredKeysSync());
    };
    const onReset = (opts?: { confirm?: boolean; closeDropdown?: boolean }) => {
      const { confirm = false, closeDropdown = false } = opts ?? {};
      if (closeDropdown) triggerOpen(false);
      searchValue.value = '';
      if (column.value.filterResetToDefaultFilteredValue) {
        setFilteredKeysSync((column.value.defaultFilteredValue ?? []).map(String));
      } else {
        setFilteredKeysSync([]);
      }
      if (confirm) internalTriggerFilter(getFilteredKeysSync());
    };
    const doFilter = (opts?: { closeDropdown?: boolean }) => {
      const { closeDropdown = true } = opts ?? {};
      if (closeDropdown) triggerOpen(false);
      internalTriggerFilter(getFilteredKeysSync());
    };
    const onDropdownOpenChange = (nextOpen: boolean, info: DropdownOpenInfo) => {
      if (info.source === 'trigger') {
        if (nextOpen && propFilteredKeys.value !== undefined) {
          setFilteredKeysSync(wrapStringListType(propFilteredKeys.value));
        }
        if (!nextOpen && !column.value.filterDropdown && props.filterOnClose) {
          onConfirm();
        } else {
          triggerOpen(nextOpen, info);
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
    const onCheckAll = (_event: Event, checked: boolean) => {
      if (checked) {
        const allFilterKeys = flattenKeys(column.value.filters as ColumnFilterItem[]).map(String);
        setFilteredKeysSync(allFilterKeys);
      } else {
        setFilteredKeysSync([]);
      }
    };
    const getTreeData = (filters?: ColumnFilterItem[]): DataNode[] =>
      (filters ?? []).map((filter, index) => {
        const key = String(filter.value);
        const item: DataNode = {
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
      filterMultiple?: boolean;
      normalizedSearchValue: string;
    }): ItemType[] =>
      options.filters.map((filter) => {
        const key = String(filter.value);
        if (filter.children) {
          return {
            key,
            label: filter.text,
            children: renderFilterItems({
              filters: filter.children,
              filteredKeys: options.filteredKeys,
              filterMultiple: options.filterMultiple,
              normalizedSearchValue: options.normalizedSearchValue,
            }),
          };
        }
        const control = options.filterMultiple
          ? h(Checkbox, { checked: options.filteredKeys.includes(key) })
          : h(Radio, { checked: options.filteredKeys.includes(key) });
        const item = {
          key,
          label: h('span', null, [control, h('span', null, [filter.text])]),
        };
        if (options.normalizedSearchValue) {
          if (typeof props.filterSearch === 'function') {
            return props.filterSearch(options.normalizedSearchValue, filter) ? item : null;
          }
          return searchValueMatched(options.normalizedSearchValue, filter.text) ? item : null;
        }
        return item;
      });

    return () => {
      let dropdownContent: VNodeChild;
      if (typeof column.value.filterDropdown === 'function') {
        dropdownContent = column.value.filterDropdown({
          prefixCls: `${props.dropdownPrefixCls}-custom`,
          setSelectedKeys: (selectedKeys) => onSelectKeys({ selectedKeys }),
          selectedKeys: getFilteredKeysSync(),
          confirm: doFilter,
          clearFilters: onReset,
          filters: column.value.filters,
          visible: mergedVisible.value,
          close: () => triggerOpen(false, { source: 'menu' }),
        });
      } else if (column.value.filterDropdown !== undefined) {
        dropdownContent = column.value.filterDropdown;
      } else {
        const selectedKeys = getFilteredKeysSync() ?? [];
        const empty = h(
          Empty,
          { style: { margin: 0, padding: '16px 0' } },
          { description: () => props.locale.filterEmptyText },
        );
        const filters = column.value.filters ?? [];
        let filterComponent: VNodeChild;
        if (filters.length === 0) {
          filterComponent = empty;
        } else if (props.filterMode === 'tree') {
          const treeData = getTreeData(filters);
          const flatCount = flattenKeys(filters).length;
          filterComponent = h('div', { class: `${props.tablePrefixCls}-filter-dropdown-tree` }, [
            props.filterSearch
              ? h(FilterSearch, {
                  value: searchValue.value,
                  onChange: (value: string) => {
                    searchValue.value = value;
                  },
                  placeholder: props.locale.filterSearchPlaceholder,
                })
              : null,
            props.filterMultiple
              ? h(
                  Checkbox,
                  {
                    checked: selectedKeys.length === flatCount,
                    indeterminate: selectedKeys.length > 0 && selectedKeys.length < flatCount,
                    class: `${props.tablePrefixCls}-filter-dropdown-checkall`,
                    onChange: onCheckAll,
                  },
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
              checkedKeys: selectedKeys.map(String),
              selectedKeys: selectedKeys.map(String),
              showIcon: false,
              treeData,
              autoExpandParent: true,
              defaultExpandAll: true,
              filterTreeNode: normalizedSearchValue.value
                ? (node: EventDataNode) => {
                    const find = (filters: ColumnFilterItem[]): ColumnFilterItem | undefined => {
                      for (const filter of filters) {
                        if (String(filter.value) === String(node.key)) return filter;
                        const child = filter.children && find(filter.children);
                        if (child) return child;
                      }
                      return undefined;
                    };
                    const filter = find(filters);
                    return filter
                      ? typeof props.filterSearch === 'function'
                        ? props.filterSearch(searchValue.value, filter)
                        : searchValueMatched(normalizedSearchValue.value, filter.text)
                      : false;
                  }
                : undefined,
            }),
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
            props.filterSearch
              ? h(FilterSearch, {
                  value: searchValue.value,
                  onChange: (value: string) => {
                    searchValue.value = value;
                  },
                  placeholder: props.locale.filterSearchPlaceholder,
                })
              : null,
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
                  selectedKeys: selectedKeys.map(String),
                  getPopupContainer: props.getPopupContainer,
                  items,
                }),
          ];
        }
        const getResetDisabled = () => {
          if (column.value.filterResetToDefaultFilteredValue) {
            return isEqual((column.value.defaultFilteredValue ?? []).map(String), selectedKeys);
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
      // 🚨 必须挂 `apollo-table-css-var`：
      //    `.apollo-table-filter-dropdown` 的背景 / 阴影 / 圆角全部依赖
      //    `--apollo-table-filter-dropdown-bg`（声明在 `.apollo-table, .apollo-table-css-var` 上）。
      //    弹层通过 Teleport 落到 body 后，祖先链上**找不到** `.apollo-table` ⇒ 变量继承失败
      //    ⇒ 计算样式退回 `transparent`（用户报「过滤菜单没加背景色」，Issue 2026-10-20-01）。
      //    把 `apollo-table-css-var` 放到 FilterWrapper 自己的 className 上 ⇒ CSS 变量在
      //    **同一元素**声明、同元素被 `background-color: var(...)` 消费，cascade 闭合。
      dropdownContent = h(
        FilterWrapper,
        {
          className: clsx(`${props.prefixCls}-dropdown`, `${tablePrefix()}-css-var`),
          style: tableStyle.value,
        },
        { default: () => dropdownInner },
      );

      // 触发器
      let filterIcon: VNodeChild;
      if (typeof column.value.filterIcon === 'function') {
        filterIcon = column.value.filterIcon(filtered.value);
      } else if (column.value.filterIcon !== undefined) {
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
        [filterIcon],
      );

      return h('div', { class: `${props.prefixCls}-column` }, [
        h('span', { class: `${props.tablePrefixCls}-column-title` }, [slots.default?.()]),
        h(
          Dropdown,
          {
            trigger: ['click'],
            placement: 'bottomRight',
            getPopupContainer: props.getPopupContainer,
            ...filterDropdownProps.value,
            rootClassName: clsx(props.rootClassName, filterDropdownProps.value.rootClassName),
            open: mergedVisible.value,
            onOpenChange: onDropdownOpenChange,
            menu: { items: [] },
          },
          {
            default: () => [triggerNode],
            popupRender: () => dropdownContent,
          },
        ),
      ]);
    };
  },
  {
    name: 'TableFilterDropdown',
    emits: [],
    props: [
      'tablePrefixCls',
      'prefixCls',
      'dropdownPrefixCls',
      'column',
      'columnKey',
      'filterState',
      'filterOnClose',
      'filterMultiple',
      'filterMode',
      'filterSearch',
      'triggerFilter',
      'locale',
      'getPopupContainer',
      'rootClassName',
    ],
  },
);
const FilterDropdown: typeof NativeFilterDropdown = Object.assign(NativeFilterDropdown, {
  props: {
    tablePrefixCls: { type: String, required: true },
    prefixCls: { type: String, required: true },
    dropdownPrefixCls: { type: String, required: true },
    column: { type: Object, required: true },
    columnKey: { type: [String, Number], required: true },
    filterState: { type: Object, default: undefined },
    filterOnClose: { type: Boolean, default: true },
    filterMultiple: { type: Boolean, default: true },
    filterMode: { type: String, default: 'menu' },
    filterSearch: { type: null, default: false },
    triggerFilter: {
      type: Function,
      required: true,
    },
    locale: { type: Object, required: true },
    getPopupContainer: { type: Function, default: undefined },
    rootClassName: { type: String, default: undefined },
  },
});

// ============================== useFilter ==============================

function getMergedColumns<RecordType>(
  rawMergedColumns: ColumnsType<RecordType>,
): ColumnsType<RecordType> {
  return rawMergedColumns.flatMap((column) => {
    if (column.children) {
      return [column, ...getMergedColumns(column.children)];
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
  /** ⚠️ 收 `MaybeRefOrGetter`：运行时替换容器要生效（Issue #17.3），传普通值 = setup 快照。 */
  getPopupContainer?: MaybeRefOrGetter<GetPopupContainer | undefined>;
  locale: MaybeRefOrGetter<TableLocale>;
  rootClassName?: string;
}

export function useFilter<RecordType extends object>(
  params: UseFilterParams<RecordType>,
): {
  transformColumns: (columns: ColumnsType<RecordType>) => ColumnsType<RecordType>;
  filterStates: ComputedRef<TableFilterState<RecordType>[]>;
  filters: ComputedRef<Record<string, FilterValue | null>>;
} {
  const {
    baseColumns,
    onFilterChange,
    getPopupContainer,
    locale: tableLocale,
    rootClassName,
  } = params;
  const mergedColumns = computed(() =>
    getMergedColumns(baseColumns.value ?? params.mergedColumns.value ?? []),
  );
  const [filterStates, setFilterStates] = useControlledValue<TableFilterState<RecordType>[]>({
    defaultValue: () => collectFilterStates(mergedColumns.value, true),
    getValue: () => {
      const states = collectFilterStates(mergedColumns.value, false);
      return states.some((state) => state.filteredKeys !== undefined) ? states : undefined;
    },
  });

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
        getColumnKey(column, getColumnPos(index)),
      );
      return filterStates.value.flatMap((item) => {
        const keyIndex = keyList.indexOf(item.key);
        const column = mergedColumns.value[keyIndex];
        return column ? [{ ...item, column, forceFiltered: column.filtered }] : [];
      });
    }
    return collectedStates;
  });

  const filters = computed(() => generateFilterInfo(mergedFilterStates.value));

  const triggerFilter = (filterState: TableFilterState<RecordType>) => {
    const newFilterStates = mergedFilterStates.value.filter(({ key }) => key !== filterState.key);
    newFilterStates.push(filterState);
    setFilterStates(newFilterStates);
    onFilterChange(generateFilterInfo(newFilterStates), newFilterStates);
  };

  const transformColumns = (innerColumns: ColumnsType<RecordType>): ColumnsType<RecordType> =>
    injectFilter(
      params.prefixCls,
      params.dropdownPrefixCls,
      innerColumns,
      mergedFilterStates.value,
      toValue(tableLocale),
      triggerFilter,
      toValue(getPopupContainer),
      undefined,
      rootClassName,
    );

  return { transformColumns, filterStates: computed(() => mergedFilterStates.value), filters };
}
