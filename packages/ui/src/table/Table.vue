<script setup lang="ts" generic="RecordType extends object = Record<string, unknown>">
/**
 * antd `table/InternalTable.js`（496 行）—— Vue 移植（组件主入口）。
 *
 * 管线顺序与 antd 一致（顺序即语义）：
 *   columns → 当前 responsive 过滤→ sorter → filter →
 *   columnTitle → pagination → selection → expandable 归并 → 引擎 Table。
 */

import { useLocale } from '@apollo-design/locale';
import { useToken } from '@apollo-design/theme';
import { isFunction, isNumber } from '@apollo-design/utils';
import {
  computed,
  h,
  mergeProps,
  normalizeStyle,
  onMounted,
  ref,
  shallowRef,
  toRaw,
  toRef,
  useAttrs,
  type VNodeChild,
  watch,
} from 'vue';
import { clsx } from '../_internal/clsx';
import { NodeRenderer } from '../_internal/node-renderer';
import { type Screens, useResponsiveObserver } from '../_internal/responsive-observer';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import { defaultRenderEmpty } from '../config-provider/default-render-empty';
import { useSize } from '../config-provider/size-context';
import Pagination from '../pagination/Pagination.vue';
import Spin from '../spin/Spin.vue';
import { getChildren } from './data';
import renderExpandIcon from './ExpandIcon';
import { EXPAND_COLUMN, INTERNAL_HOOKS } from './engine/constant';
import type { EngineExpandableConfig } from './engine/interface';
import EngineTable from './engine/Table';
import HeaderCellContent from './HeaderCellContent';
import { getFilterData, type TableFilterState, useFilter } from './hooks/use-filter';
import { SELECTION_COLUMN, useSelection } from './hooks/use-selection';
import { getSortData, type SortState, useSorter } from './hooks/use-sorter';
import {
  DEFAULT_PAGE_SIZE,
  getPaginationParam,
  useColumnTitleProps,
  useContainerWidth,
  useFilledColumns,
  useLazyKVMap,
  usePagination,
  useSpinProps,
  useTitleColumns,
} from './hooks/use-table-data';
import type {
  ColumnsType,
  ColumnTitleProps,
  FilterValue,
  SorterResult,
  TableAction,
  TableBodyCellSlotProps,
  TableEmits,
  TableKey,
  TableLocale,
  TablePaginationConfig,
  TableProps,
  TableRef,
  TableSlots,
} from './interface';
import { DEFAULT_TABLE_LOCALE } from './locale';
import SlotContent from './SlotContent';
import { useTableTheme } from './use-table-theme';
import { getPaginationSize, normalizePlacement } from './util';

defineOptions({ name: 'ATable', inheritAttrs: false });
const props = withDefaults(defineProps<Omit<TableProps<RecordType>, 'onChange' | 'onScroll'>>(), {
  virtual: false,
  rowHoverable: true,
  showHeader: true,
  pagination: undefined,
  caption: undefined,
  showSorterTooltip: () => ({ target: 'full-header' }),
});
const slots = defineSlots<TableSlots<RecordType>>();
const emit = defineEmits<TableEmits<RecordType>>();
const attrs = useAttrs();
const EMPTY_LIST: never[] = [];
const Engine = EngineTable<RecordType>;

const tableConfig = useComponentConfig<
  ComponentStyleConfig &
    Pick<TableProps, 'classNames' | 'styles'> & {
      rowKey?: string;
      scroll?: TableProps['scroll'];
      expandable?: Pick<
        NonNullable<TableProps<RecordType>['expandable']>,
        'indentSize' | 'expandRowByClick' | 'childrenColumnName'
      >;
    }
>('table');
const directionCtx = useDirection();
const direction = computed<'ltr' | 'rtl' | undefined>(() => props.direction ?? directionCtx.value);
const mergedSize = useSize<import('../config-provider/size-context').SizeType | undefined>((ctx) =>
  props.size === 'middle' ? 'medium' : (props.size ?? ctx),
);
const prefixCls = computed(() => tableConfig.getPrefixCls('table', props.prefixCls));
const sourceStyle = useTableTheme(() => prefixCls.value);
const tableVariables = computed(() => {
  const style = { ...sourceStyle.value };
  const native = normalizeStyle([attrs.style]);
  for (const source of [
    mergedStyles.value.root,
    native && typeof native === 'object' ? native : undefined,
  ])
    for (const [key, value] of Object.entries(source ?? {}))
      if (key.startsWith('--') && (typeof value === 'string' || typeof value === 'number'))
        style[key] = String(value);
  return style;
});

const dropdownPrefixCls = computed(() =>
  tableConfig.getPrefixCls('dropdown', props.dropdownPrefixCls),
);
const hashId = '';

// ============ 语义槽（schema 第四参：pagination/header/body 嵌套组） ============
const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  TableProps<RecordType>,
  NonNullable<TableProps['classNames']>,
  NonNullable<TableProps['styles']>
>(
  [() => tableConfig.classNames, () => props.classNames],
  [
    () => tableConfig.styles,
    () => (tableConfig.style ? { root: tableConfig.style } : undefined),
    () => props.styles,
  ],
  () => props,
  {
    pagination: { _default: 'root' },
    header: { _default: 'wrapper' },
    body: { _default: 'wrapper' },
  },
);
const mergedScroll = computed(() => props.scroll ?? tableConfig.scroll);
const getPopupContainer = computed(() => props.getPopupContainer ?? tableConfig.getPopupContainer);

const [contextLocale] = useLocale('Table');
const tableLocale = computed<TableLocale>(() => ({
  ...DEFAULT_TABLE_LOCALE,
  ...contextLocale.value,
  ...props.locale,
}));

const rawData = computed<RecordType[]>(() => props.dataSource ?? EMPTY_LIST);

// ============================ RowKey ============================
const rowKey = computed(() => props.rowKey ?? tableConfig.rowKey ?? 'key');
const getRowKey = computed(() => {
  const source = rowKey.value;
  if (typeof source === 'function') return source;
  return (record: RecordType) => Reflect.get(record, source) as TableKey;
});
const childrenColumnName = computed(
  () =>
    props.expandable?.childrenColumnName ??
    props.childrenColumnName ??
    tableConfig.expandable?.childrenColumnName ??
    'children',
);

// ⚠️ `column` 必须是 computed —— `ref(props.column)` 是 setup 期快照，父组件换
//    公共列配置（align/ellipsis/width…）时这个 ref 不会变（Issue #17.2）。
const baseColumns = useFilledColumns(
  computed(() => props.columns ?? []),
  computed(() => props.column),
);
const responsive = useResponsiveObserver();
const screens = shallowRef<Screens | null>(null);
const needsResponsive = computed(() => {
  const hasResponsive = (columns: ColumnsType<RecordType>): boolean =>
    columns.some(
      (column) => column.responsive || (column.children && hasResponsive(column.children)),
    );
  return hasResponsive(baseColumns.value);
});
onMounted(() => {
  watch(
    needsResponsive,
    (needed, _previous, onCleanup) => {
      if (needed)
        onCleanup(
          responsive.subscribe((current) => {
            screens.value = current;
          }),
        );
    },
    { immediate: true, flush: 'sync' },
  );
});
const mergedColumns = computed(() => {
  const filter = (columns: ColumnsType<RecordType>): ColumnsType<RecordType> =>
    columns
      .filter(
        (column) =>
          !column.responsive ||
          !screens.value ||
          column.responsive.some((point) => screens.value?.[point]),
      )
      .map((column) =>
        column.children ? { ...column, children: filter(column.children) } : column,
      );
  return filter(baseColumns.value);
});

// ========================== Expandable（提前：selection 依赖 expandType） ==========================
const mergedExpandable = computed(() => ({
  ...tableConfig.expandable,
  childrenColumnName: childrenColumnName.value,
  expandIconColumnIndex: props.expandIconColumnIndex,
  rowExpandable: props.rowExpandable,
  ...props.expandable,
}));
const expandType = toRef((): 'nest' | 'row' | null => {
  if (rawData.value.some((item) => getChildren(item, childrenColumnName.value)?.length)) {
    return 'nest';
  }
  if (slots.expandedRow) {
    return 'row';
  }
  return null;
});

// ============================ LazyKVMap ============================
const getRecordByKey = useLazyKVMap(rawData, childrenColumnName, getRowKey);

// ============================ Events =============================
interface ChangeInfo {
  pagination?: TablePaginationConfig;
  filters?: Record<string, FilterValue | null>;
  sorter?: SorterResult<RecordType> | SorterResult<RecordType>[];
  sorterStates?: SortState<RecordType>[];
  filterStates?: TableFilterState<RecordType>[];
}
const internalRef: { body: { current: HTMLElement | null } } = { body: { current: null } };
const triggerOnChange = (info: ChangeInfo, action: TableAction, reset = false) => {
  const pagination: TablePaginationConfig =
    props.pagination === false
      ? {}
      : {
          ...getPaginationParam(mergedPagination.value, props.pagination ?? {}),
          ...info.pagination,
        };
  if (reset) {
    resetPagination();
    if (props.pagination !== false) {
      pagination.current = 1;
      props.pagination?.onChange?.(1, pagination.pageSize ?? DEFAULT_PAGE_SIZE);
    }
  }
  if (
    mergedScroll.value?.scrollToFirstRowOnChange !== false &&
    mergedScroll.value &&
    internalRef.body.current
  )
    internalRef.body.current.scrollTo?.({ top: 0 });
  emit(
    'change',
    pagination,
    info.filters ?? filterResult.filters.value,
    info.sorter ?? sorterResult.getSorters(),
    {
      currentDataSource: getFilterData(
        getSortData(
          rawData.value,
          info.sorterStates ?? sorterResult.sortStates.value,
          childrenColumnName.value,
        ),
        info.filterStates ?? filterResult.filterStates.value,
        childrenColumnName.value,
      ),
      action,
    },
  );
};

// ============================ Sorter =============================
const onSorterChange = (
  sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  sorterStates: SortState<RecordType>[],
) => {
  triggerOnChange({ sorter, sorterStates }, 'sort', false);
};
const sorterResult = useSorter<RecordType>({
  get prefixCls() {
    return prefixCls.value;
  },
  mergedColumns,
  baseColumns,
  onSorterChange,
  // ⚠️ 三项配置都可能是运行时变更的 ⇒ 传 computed，由 hook 侧 toValue 取最新值
  // （传普通值 = setup 期快照 ⇒ 动态 sortDirections / tooltip 不生效，Issue #17.3）。
  sortDirections: computed(() => props.sortDirections),
  tableLocale: computed(() => tableLocale.value),
  showSorterTooltip: computed(() => props.showSorterTooltip),
});
const sortedData = computed(() =>
  getSortData(rawData.value, sorterResult.sortStates.value, childrenColumnName.value),
);
// ⚠️ antd InternalTable.js:297-298 在每次 render 把最新 states 回填进累计对象 ——
//    本仓 setup 只跑一次，必须用 getter 实时取（否则 filter/sorter 动作时
//    changeInfo 里是 undefined，currentDataSource 未经过滤/排序）。

// ============================ Filter =============================
const onFilterChange = (
  filters: Record<string, FilterValue | null>,
  filterStates: TableFilterState<RecordType>[],
) => {
  triggerOnChange({ filters, filterStates }, 'filter', true);
};
const filterResult = useFilter<RecordType>({
  get prefixCls() {
    return prefixCls.value;
  },
  get dropdownPrefixCls() {
    return dropdownPrefixCls.value;
  },
  mergedColumns,
  baseColumns,
  onFilterChange,
  getPopupContainer,
  locale: computed(() => tableLocale.value),
});
// ============================ Virtual ============================
// antd `InternalTable.tsx:722-742`：`listItemHeight` 由 token 与 size 算出，
// 帮助虚拟滚动正确估算行高（不传则用 rc 默认 24，与真实行高差一倍）。
const themeToken = useToken();
const listItemHeight = computed(() => {
  const token = themeToken.value;
  const fontHeight = Math.floor(token.fontSize * token.lineHeight);
  switch (mergedSize.value) {
    case 'medium':
      return token.paddingSM * 2 + fontHeight + token.lineWidth;
    case 'small':
      return token.paddingXS * 2 + fontHeight + token.lineWidth;
    default:
      return token.padding * 2 + fontHeight + token.lineWidth;
  }
});
/** 引擎实例（virtual 时承载 `scrollTo` / `nativeElement`）。 */
const engineRef = ref<TableRef | null>(null);
const mergedData = computed(() =>
  getFilterData(sortedData.value, filterResult.filterStates.value, childrenColumnName.value),
);

// ============================ Column ============================
const columnTitleProps = useColumnTitleProps<RecordType>(
  sorterResult.sorterTitleProps,
  filterResult.filters,
);
const transformTitleColumns = useTitleColumns<RecordType>(columnTitleProps);

// ========================== Pagination ==========================
const onPaginationChange = (current: number, pageSize: number) => {
  triggerOnChange(
    {
      pagination: {
        ...getPaginationParam(mergedPagination.value, props.pagination || {}),
        current,
        pageSize,
      },
    },
    'paginate',
  );
};
const { mergedPagination, resetPagination } = usePagination(
  computed(() => mergedData.value.length),
  onPaginationChange,
  computed(() => props.pagination ?? {}),
);
// ⚠️ antd `InternalTable.js:433` 在**每次 render** 回填 pagination（mergedPagination 会随翻页
//    变化，props.pagination 也可动态改）⇒ 与 sorter/filters 同判：必须是 getter，赋值一次会
//    让「翻到第 2 页后再排序/过滤」的 onChange.pagination 停留在初始页（Issue #17.1）。

// ============================= Data =============================
const pageData = computed<RecordType[]>(() => {
  if (props.pagination === false || !mergedPagination.value.pageSize) {
    return mergedData.value;
  }
  const current = mergedPagination.value.current ?? 1;
  const total = mergedPagination.value.total;
  const pageSize = mergedPagination.value.pageSize ?? DEFAULT_PAGE_SIZE;
  if (mergedData.value.length < (total ?? 0)) {
    if (mergedData.value.length > pageSize) {
      return mergedData.value.slice((current - 1) * pageSize, current * pageSize);
    }
    return mergedData.value;
  }
  return mergedData.value.slice((current - 1) * pageSize, current * pageSize);
});

// ========================== Selections ==========================
const selectionResult = useSelection<RecordType>(
  {
    get prefixCls() {
      return prefixCls.value;
    },
    data: mergedData,
    pageData,
    getRecordByKey,
    getRowKey,
    expandType,
    childrenColumnName,
    get locale() {
      return tableLocale.value;
    },
    get getPopupContainer() {
      return getPopupContainer.value;
    },
    get classNames() {
      return mergedClassNames.value;
    },
  },
  computed(() => props.rowSelection),
);

const internalRowClassName = (record: RecordType, index: number, indent: number) =>
  clsx(
    {
      [`${prefixCls.value}-row-selected`]: selectionResult.derivedSelectedKeySet.value.has(
        getRowKey.value(record, index),
      ),
    },
    isFunction(props.rowClassName) ? props.rowClassName(record, index, indent) : props.rowClassName,
  );

// ============================ Render ============================
const transformColumns = (innerColumns: ColumnsType<RecordType>) => {
  const out = transformTitleColumns(
    selectionResult.transformColumns(
      filterResult.transformColumns(sorterResult.transformColumns(innerColumns)),
    ),
  );
  return out;
};

// Both placements use the same native pagination slots and current semantic configuration.
function paginationNode(position: 'top' | 'bottom'): VNodeChild {
  if (props.pagination === false || !mergedPagination.value.total) return null;
  const {
    placement,
    position: legacyPosition,
    class: paginationNativeClass,
    style: paginationNativeStyle,
    ...config
  } = mergedPagination.value;
  const placements = placement ?? legacyPosition;
  const target = placements?.find((value) => value.startsWith(position));
  if (placements?.length ? !target : position === 'top') return null;
  const align = target ? normalizePlacement(target) : 'end';
  const semanticClass = mergedClassNames.value.pagination;
  const paginationClass =
    typeof semanticClass === 'string' ? { root: semanticClass } : semanticClass;
  const semanticStyle = mergedStyles.value.pagination;
  const paginationStyle =
    semanticStyle && 'root' in semanticStyle ? semanticStyle.root : semanticStyle;
  return h(
    Pagination,
    {
      ...config,
      class: clsx(
        `${prefixCls.value}-pagination`,
        `${prefixCls.value}-pagination-${align}`,
        paginationNativeClass,
        paginationClass?.root,
      ),
      style: [paginationStyle, paginationNativeStyle],
      classNames: (info) => {
        const original =
          typeof config.classNames === 'function' ? config.classNames(info) : config.classNames;
        return { ...original, item: clsx(paginationClass?.item, original?.item) };
      },
      size: getPaginationSize(config.size, mergedSize.value),
    },
    {
      ...(slots.paginationItemRender ? { itemRender: slots.paginationItemRender } : {}),
      ...(slots.paginationTotal ? { total: slots.paginationTotal } : {}),
      ...(slots.paginationSizeChanger ? { sizeChanger: slots.paginationSizeChanger } : {}),
    },
  );
}

// >>>>>>>>> Spinning
const spinProps = useSpinProps(computed(() => props.loading));

// ========== empty ==========
const mergedEmptyNode = () => {
  if (spinProps.value.spinning && rawData.value === EMPTY_LIST) {
    return null;
  }
  if (slots.emptyText)
    return h(SlotContent, {
      renderContent: () => slots.emptyText?.({ data: pageData.value, locale: tableLocale.value }),
    });
  if (typeof props.locale?.emptyText !== 'undefined') {
    return props.locale.emptyText;
  }
  // ⚠️ antd InternalTable.js:423：兜底是 `renderEmpty?.('Table')`（ConfigProvider
  //    的 renderEmpty 通道）——不是 locale 的 'No data' 字符串（那是 emptyText
  //    prop 的值，上面分支已处理）。此前漏接 ⇒ 空表格只渲染文字、缺 Empty
  //    简单插图（L6 差 112px）。
  return tableConfig.renderEmpty ? tableConfig.renderEmpty('Table') : defaultRenderEmpty('Table');
};

const getContainerWidth = useContainerWidth(prefixCls);

const tableClass = () =>
  clsx(
    {
      [`${prefixCls.value}-medium`]: mergedSize.value === 'medium',
      [`${prefixCls.value}-small`]: mergedSize.value === 'small',
      [`${prefixCls.value}-bordered`]: props.bordered,
      [`${prefixCls.value}-empty`]: rawData.value.length === 0,
      [`${prefixCls.value}-no-header`]: !slots.title && props.showHeader === false,
    },
    hashId,
  );

const wrappercls = computed(() =>
  clsx(
    `${prefixCls.value}-wrapper`,
    {
      [`${prefixCls.value}-wrapper-rtl`]: direction.value === 'rtl',
    },
    tableConfig.className,
    mergedClassNames.value.root,
    hashId,
  ),
);

const mergedStyle = computed(() => ({
  ...(mergedStyles.value.root ?? {}),
}));

defineExpose({
  nativeElement: () => engineRef.value?.nativeElement?.() ?? null,
  scrollTo: (config: {
    index?: number;
    top?: number;
    key?: TableKey;
    offset?: number;
    align?: ScrollLogicalPosition;
  }) => {
    engineRef.value?.scrollTo?.(config);
  },
});

const renderColumns = (columns: ColumnsType<RecordType>): ColumnsType<RecordType> => {
  const headerCell = slots.headerCell;
  return columns.map((column) =>
    toRaw(column) === SELECTION_COLUMN || toRaw(column) === EXPAND_COLUMN
      ? column
      : {
          ...column,
          ...(headerCell
            ? {
                title: (titleProps: ColumnTitleProps<RecordType>) =>
                  h(HeaderCellContent<RecordType>, {
                    column,
                    titleProps,
                    renderContent: headerCell,
                  }),
              }
            : {}),
          ...(column.children ? { children: renderColumns(column.children) } : {}),
        },
  );
};
function getExpandable(): EngineExpandableConfig<RecordType> {
  const finalExpandable: EngineExpandableConfig<RecordType> = {
    ...mergedExpandable.value,
    expandedRowRender: slots.expandedRow
      ? (record: RecordType, index: number, indent: number, expanded: boolean) =>
          slots.expandedRow?.({ record, index, indent, expanded })
      : undefined,
    expandIcon: slots.expandIcon ?? renderExpandIcon<RecordType>(tableLocale.value),
  };
  if (expandType.value === 'nest' && finalExpandable.expandIconColumnIndex === undefined) {
    finalExpandable.expandIconColumnIndex = props.rowSelection ? 1 : 0;
  } else if ((finalExpandable.expandIconColumnIndex ?? 0) > 0 && props.rowSelection) {
    finalExpandable.expandIconColumnIndex = (finalExpandable.expandIconColumnIndex ?? 0) - 1;
  }
  if (!isNumber(finalExpandable.indentSize)) {
    finalExpandable.indentSize = isNumber(props.indentSize) ? props.indentSize : 15;
  }
  return finalExpandable;
}
</script>

<template>
  <div v-bind="mergeProps({class:wrappercls,style:mergedStyle},attrs)">
    <Spin v-bind="spinProps">
      <NodeRenderer :node="paginationNode('top')" />
      <Engine ref="engineRef"
        :prefix-cls="prefixCls" :class="tableClass()" :columns="renderColumns(mergedColumns)"
        :data="pageData" :row-key="getRowKey" :row-class-name="internalRowClassName"
        :class-names="mergedClassNames" :styles="mergedStyles" :empty-text="mergedEmptyNode()"
        :expandable="getExpandable()" :scroll="mergedScroll" :table-layout="props.tableLayout"
        :direction="direction" :sticky="props.sticky" :row-hoverable="props.rowHoverable"
        :show-header="props.showHeader" :caption="props.caption" :id="props.id" :components="props.components"
        :on-row="props.onRow" :on-header-row="props.onHeaderRow"
        :internal-hooks="INTERNAL_HOOKS" :internal-refs="internalRef" :transform-columns="transformColumns"
        :get-container-width="getContainerWidth" :style="tableVariables"
        :virtual="props.virtual" :list-item-height="props.virtual ? listItemHeight : undefined" :tailor="props.virtual"
        @scroll="emit('scroll', $event)">
        <template v-if="slots.title" #title><slot name="title" :data="pageData" /></template>
        <template v-if="slots.footer" #footer><slot name="footer" :data="pageData" /></template>
        <template v-if="slots.summary" #summary><slot name="summary" :data="pageData" /></template>
        <template v-if="slots.caption" #caption><slot name="caption" :data="pageData" /></template>
        <template v-if="slots.bodyCell" #bodyCell="scope: TableBodyCellSlotProps<RecordType>"><slot name="bodyCell" v-bind="scope" /></template>
      </Engine>
      <NodeRenderer :node="paginationNode('bottom')" />
    </Spin>
  </div>
</template>
