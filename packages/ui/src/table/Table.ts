/**
 * antd `table/InternalTable.js`（496 行）—— Vue 移植（组件主入口）。
 *
 * 管线顺序与 antd 一致（顺序即语义）：
 *   columns → responsive 过滤（本仓先不接 breakpoint，P2 后续）→ sorter → filter →
 *   columnTitle → pagination → selection → expandable 归并 → 引擎 Table。
 */

import { isFunction, isNumber } from '@apollo-design/utils';
import { type ComputedRef, computed, defineComponent, h, type PropType, type Ref, ref } from 'vue';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { defaultRenderEmpty } from '../config-provider/default-render-empty';
import { useSize } from '../config-provider/size-context';
import { clsx } from '../notification/engine/util';
import Pagination from '../pagination/Pagination.vue';
import Spin from '../spin/Spin.vue';
import renderExpandIcon from './ExpandIcon';
import { EXPAND_COLUMN, INTERNAL_HOOKS } from './engine/constant';
import Footer, { Summary } from './engine/Footer';
import EngineTable from './engine/Table';
import { getFilterData, useFilter } from './hooks/use-filter';
import { SELECTION_COLUMN, useSelection } from './hooks/use-selection';
import { getSortData, useSorter } from './hooks/use-sorter';
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
  ExpandableConfig,
  FilterValue,
  SorterResult,
  TableKey,
  TableLocale,
  TablePaginationConfig,
  TableProps,
  TableRowSelection,
} from './interface';
import { getPaginationSize, normalizePlacement } from './util';

const EMPTY_LIST: Record<string, unknown>[] = [];

/** antd `locale/en_US.ts` 的 `Table` 段（本仓无 locale 体系，默认 en_US）。 */
export const DEFAULT_TABLE_LOCALE: TableLocale = {
  filterTitle: 'Filter menu',
  filterConfirm: 'OK',
  filterReset: 'Reset',
  filterEmptyText: 'No filters',
  filterCheckAll: 'Select all items',
  filterSearchPlaceholder: 'Search in filters',
  emptyText: 'No data',
  selectAll: 'Select current page',
  selectInvert: 'Invert current page',
  selectNone: 'Clear all data',
  selectionAll: 'Select all data',
  sortTitle: 'Sort',
  expand: 'Expand row',
  collapse: 'Collapse row',
  triggerDesc: 'Click to sort descending',
  triggerAsc: 'Click to sort ascending',
  cancelSort: 'Click to cancel sorting',
};

const Table = defineComponent({
  name: 'ATable',
  props: {
    prefixCls: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string>>, default: undefined },
    classNames: { type: Object as PropType<TableProps['classNames']>, default: undefined },
    styles: { type: Object as PropType<TableProps['styles']>, default: undefined },
    size: { type: String as PropType<TableProps['size']>, default: undefined },
    bordered: { type: Boolean, default: undefined },
    dropdownPrefixCls: { type: String, default: undefined },
    dataSource: { type: Array as PropType<Record<string, unknown>[]>, default: undefined },
    column: { type: Object as PropType<TableProps['column']>, default: undefined },
    columns: { type: Array as PropType<ColumnsType>, default: undefined },
    pagination: {
      type: [Boolean, Object] as PropType<false | TablePaginationConfig>,
      default: undefined,
    },
    rowSelection: { type: Object as PropType<TableRowSelection>, default: undefined },
    rowKey: { type: [String, Function] as PropType<TableProps['rowKey']>, default: undefined },
    rowClassName: { type: null, default: undefined },
    childrenColumnName: { type: String, default: undefined },
    onChange: { type: Function as PropType<TableProps['onChange']>, default: undefined },
    getPopupContainer: { type: Function, default: undefined },
    loading: {
      type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>,
      default: undefined,
    },
    expandIcon: { type: Function, default: undefined },
    expandable: { type: Object as PropType<ExpandableConfig>, default: undefined },
    expandedRowRender: { type: Function, default: undefined },
    expandIconColumnIndex: { type: Number, default: undefined },
    indentSize: { type: Number, default: undefined },
    scroll: { type: Object as PropType<TableProps['scroll']>, default: undefined },
    sortDirections: { type: Array as PropType<TableProps['sortDirections']>, default: undefined },
    locale: { type: Object as PropType<TableLocale>, default: undefined },
    showSorterTooltip: {
      type: [Boolean, Object] as PropType<TableProps['showSorterTooltip']>,
      default: () => ({ target: 'full-header' }),
    },
    virtual: { type: Boolean, default: false },
    title: { type: null, default: undefined },
    footer: { type: null, default: undefined },
    summary: { type: Function, default: undefined },
    caption: { type: null, default: undefined },
    id: { type: String, default: undefined },
    showHeader: { type: Boolean, default: undefined },
    components: { type: Object, default: undefined },
    onRow: { type: Function, default: undefined },
    onHeaderRow: { type: Function, default: undefined },
    emptyText: { type: null, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    sticky: { type: [Boolean, Object], default: undefined },
    rowHoverable: { type: Boolean, default: true },
    tableLayout: { type: String as PropType<TableProps['tableLayout']>, default: undefined },
    onScroll: { type: Function, default: undefined },
    rowExpandable: { type: Function, default: undefined },
  },
  setup(props, { attrs, expose }) {
    const {
      getPrefixCls,
      direction: contextDirection,
      table: tableConfig,
      renderEmpty: contextRenderEmpty,
    } = useComponentConfig('table') as {
      getPrefixCls: (suffix: string, custom?: string) => string;
      direction?: 'ltr' | 'rtl';
      renderEmpty?: (name: string) => unknown;
      table?: {
        rowKey?: string;
        scroll?: TableProps['scroll'];
        expandable?: { expandIcon?: unknown };
      };
    };
    const directionCtx = useDirection();
    const direction = computed<'ltr' | 'rtl' | undefined>(
      () => props.direction ?? contextDirection ?? directionCtx.value,
    );
    const mergedSize = useSize<string | undefined>((ctx) =>
      props.size === 'middle' ? 'medium' : (props.size ?? ctx),
    );
    const rootPrefix = getPrefixCls('table', props.prefixCls);
    const prefixCls = rootPrefix;
    const dropdownPrefixCls = getPrefixCls('dropdown', props.dropdownPrefixCls);
    const hashId = '';

    // ============ 语义槽（schema 第四参：pagination/header/body 嵌套组） ============
    const mergedClassNames = computed<Record<string, unknown>>(() => ({
      root: props.classNames?.root,
      section: props.classNames?.section,
      content: props.classNames?.content,
      title: props.classNames?.title,
      footer: props.classNames?.footer,
      // 嵌套组：字符串展平为 { _default: 'root' | 'wrapper' }（antd schema 语义）
      pagination: props.classNames?.pagination,
      header:
        typeof props.classNames?.header === 'string'
          ? { wrapper: props.classNames.header }
          : props.classNames?.header,
      body:
        typeof props.classNames?.body === 'string'
          ? { wrapper: props.classNames.body }
          : props.classNames?.body,
    }));

    const tableLocale = computed<TableLocale>(() => ({
      ...DEFAULT_TABLE_LOCALE,
      ...props.locale,
    }));

    const rawData = computed<Record<string, unknown>[]>(() => props.dataSource ?? EMPTY_LIST);

    // ============================ RowKey ============================
    const rowKey = computed(() => props.rowKey || tableConfig?.rowKey || 'key');
    const getRowKey = computed(() => {
      if (isFunction(rowKey.value)) {
        return rowKey.value as (record: never, index?: number) => TableKey;
      }
      const keyName = rowKey.value as string;
      return (record: Record<string, unknown>) => record?.[keyName] as TableKey;
    });
    const childrenColumnName = computed(() => props.childrenColumnName ?? 'children');

    const baseColumns = useFilledColumns(
      computed(() => props.columns ?? []) as never,
      ref(props.column) as never,
    ) as ComputedRef<ColumnsType>;

    // ========================== Expandable（提前：selection 依赖 expandType） ==========================
    const mergedExpandable = computed<ExpandableConfig>(
      () =>
        ({
          childrenColumnName: props.childrenColumnName,
          expandIconColumnIndex: props.expandIconColumnIndex,
          rowExpandable: props.rowExpandable,
          ...props.expandable,
          expandedRowRender: props.expandable?.expandedRowRender ?? props.expandedRowRender,
        }) as unknown as ExpandableConfig,
    );
    const expandType = computed<'nest' | 'row' | null>(() => {
      if (rawData.value.some((item) => item?.[childrenColumnName.value])) {
        return 'nest';
      }
      if (mergedExpandable.value.expandedRowRender) {
        return 'row';
      }
      return null;
    });

    // ============================ LazyKVMap ============================
    const getRecordByKey = useLazyKVMap(
      rawData,
      childrenColumnName,
      getRowKey as unknown as Ref<(r: Record<string, unknown>, i?: number) => TableKey>,
    );

    // ============================ Events =============================
    const changeEventInfo: Record<string, unknown> = {};
    const internalRef = { body: { current: null as unknown } };

    const triggerOnChange = (info: Record<string, unknown>, action: string, reset = false) => {
      const changeInfo = { ...changeEventInfo, ...info };
      if (reset) {
        (changeEventInfo.resetPagination as (() => void) | undefined)?.();
        const paginationInfo = changeInfo.pagination as TablePaginationConfig | undefined;
        if (paginationInfo?.current) {
          paginationInfo.current = 1;
        }
        if (props.pagination && typeof props.pagination === 'object') {
          (props.pagination as { onChange?: (c: number, ps?: number) => void }).onChange?.(
            1,
            (changeInfo.pagination as TablePaginationConfig | undefined)?.pageSize,
          );
        }
      }
      if (
        props.scroll &&
        props.scroll.scrollToFirstRowOnChange !== false &&
        internalRef.body.current
      ) {
        (internalRef.body.current as HTMLElement).scrollTo?.({ top: 0 });
      }
      props.onChange?.(
        changeInfo.pagination as TablePaginationConfig,
        changeInfo.filters as Record<string, FilterValue | null>,
        changeInfo.sorter as SorterResult,
        {
          currentDataSource: getFilterData(
            getSortData(
              rawData.value,
              changeEventInfo.sorterStates as never,
              childrenColumnName.value,
            ),
            changeEventInfo.filterStates as never,
            childrenColumnName.value,
          ),
          action: action as never,
        },
      );
    };

    // ============================ Sorter =============================
    const onSorterChange = (sorter: SorterResult | SorterResult[], sorterStates: never[]) => {
      triggerOnChange({ sorter, sorterStates }, 'sort', false);
    };
    const sorterResult = useSorter<Record<string, unknown>>({
      prefixCls,
      mergedColumns: computed(() => (props.columns ?? []) as never),
      baseColumns: computed(() => baseColumns.value as never),
      onSorterChange: onSorterChange as never,
      sortDirections: props.sortDirections ?? ['ascend', 'descend'],
      tableLocale: tableLocale.value,
      showSorterTooltip: props.showSorterTooltip as never,
    });
    const sortedData = computed(() =>
      getSortData(rawData.value, sorterResult.sortStates.value as never, childrenColumnName.value),
    );
    // ⚠️ antd InternalTable.js:297-298 在每次 render 把最新 states 回填进累计对象 ——
    //    本仓 setup 只跑一次，必须用 getter 实时取（否则 filter/sorter 动作时
    //    changeInfo 里是 undefined，currentDataSource 未经过滤/排序）。
    Object.defineProperties(changeEventInfo, {
      sorter: {
        get: () => sorterResult.getSorters(),
        enumerable: true,
        configurable: true,
      },
      sorterStates: {
        get: () => sorterResult.sortStates.value,
        enumerable: true,
        configurable: true,
      },
    });

    // ============================ Filter =============================
    const onFilterChange = (filters: Record<string, FilterValue | null>, filterStates: never[]) => {
      triggerOnChange({ filters, filterStates }, 'filter', true);
    };
    const filterResult = useFilter<Record<string, unknown>>({
      prefixCls,
      dropdownPrefixCls,
      mergedColumns: computed(() => (props.columns ?? []) as never),
      baseColumns: computed(() => baseColumns.value as never),
      onFilterChange: onFilterChange as never,
      getPopupContainer: props.getPopupContainer as
        | ((node: HTMLElement) => HTMLElement)
        | undefined,
      locale: tableLocale.value,
      rootClassName: props.rootClassName,
    });
    const mergedData = computed(() =>
      getFilterData(
        sortedData.value,
        filterResult.filterStates.value as never,
        childrenColumnName.value,
      ),
    );
    Object.defineProperties(changeEventInfo, {
      filters: {
        get: () => filterResult.filters.value,
        enumerable: true,
        configurable: true,
      },
      filterStates: {
        get: () => filterResult.filterStates.value,
        enumerable: true,
        configurable: true,
      },
    });

    // ============================ Column ============================
    const columnTitleProps = useColumnTitleProps<Record<string, unknown>>(
      sorterResult.sorterTitleProps as never,
      filterResult.filters as never,
    );
    const transformTitleColumns = useTitleColumns<Record<string, unknown>>(
      columnTitleProps as never,
    );

    // ========================== Pagination ==========================
    const onPaginationChange = (current: number, pageSize: number) => {
      triggerOnChange(
        {
          pagination: {
            ...(changeEventInfo.pagination as TablePaginationConfig),
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
      computed(() => props.pagination ?? ({} as false | TablePaginationConfig)) as never,
    );
    changeEventInfo.pagination =
      props.pagination === false
        ? {}
        : getPaginationParam(mergedPagination.value as never, props.pagination ?? {});
    changeEventInfo.resetPagination = resetPagination;

    // ============================= Data =============================
    const pageData = computed<Record<string, unknown>[]>(() => {
      if (props.pagination === false || !mergedPagination.value.pageSize) {
        return mergedData.value;
      }
      const current = (mergedPagination.value.current as number) ?? 1;
      const total = mergedPagination.value.total as number | undefined;
      const pageSize = (mergedPagination.value.pageSize as number) ?? DEFAULT_PAGE_SIZE;
      if (mergedData.value.length < (total ?? 0)) {
        if (mergedData.value.length > pageSize) {
          return mergedData.value.slice((current - 1) * pageSize, current * pageSize);
        }
        return mergedData.value;
      }
      return mergedData.value.slice((current - 1) * pageSize, current * pageSize);
    });

    // ========================== Selections ==========================
    const selectionResult = useSelection<Record<string, unknown>>(
      {
        prefixCls,
        data: mergedData,
        pageData,
        getRecordByKey: getRecordByKey as never,
        getRowKey: getRowKey as never,
        expandType: expandType as never,
        childrenColumnName,
        locale: tableLocale.value as never,
        getPopupContainer: props.getPopupContainer as
          | ((node: HTMLElement) => HTMLElement)
          | undefined,
        classNames: mergedClassNames.value as never,
      },
      computed(() => props.rowSelection) as never,
    );

    const internalRowClassName = (record: Record<string, unknown>, index: number, indent: number) =>
      clsx(
        {
          [`${prefixCls}-row-selected`]: selectionResult.derivedSelectedKeySet.value.has(
            (getRowKey.value as (r: Record<string, unknown>, i?: number) => TableKey)(
              record,
              index,
            ),
          ),
        },
        isFunction(props.rowClassName)
          ? (props.rowClassName as (r: never, i: number, ind: number) => string)(
              record as never,
              index,
              indent,
            )
          : props.rowClassName,
      );

    // ============================ Render ============================
    const transformColumns = (innerColumns: ColumnsType) => {
      const out = transformTitleColumns(
        selectionResult.transformColumns(
          filterResult.transformColumns(
            sorterResult.transformColumns(innerColumns as never),
          ) as never,
        ) as never,
      ) as ColumnsType;
      return out;
    };

    // 分页节点
    const topPaginationNode = computed(() => {
      if (props.pagination !== false && mergedPagination.value.total) {
        const paginationSize = getPaginationSize(
          mergedPagination.value.size as never,
          mergedSize.value as never,
        );
        const { placement, position } = mergedPagination.value as TablePaginationConfig;
        const mergedPlacement = placement ?? position;
        const renderPagination = (p: string = 'end') =>
          h(Pagination, {
            ...mergedPagination.value,
            className: clsx(
              `${prefixCls}-pagination`,
              `${prefixCls}-pagination-${p}`,
              (mergedPagination.value as unknown as { className?: string }).className,
            ),
            size: paginationSize,
          } as never);
        if (Array.isArray(mergedPlacement)) {
          const topPos = mergedPlacement.find((p) => p.includes('top'));
          const bottomPos = mergedPlacement.find((p) => p.includes('bottom'));
          const isDisable = mergedPlacement.every((p) => `${p}` === 'none');
          let node: unknown = null;
          if (!topPos && !bottomPos && !isDisable) {
            node = renderPagination();
          }
          if (topPos) {
            node = renderPagination(normalizePlacement(topPos as never));
          }
          return node;
        }
        // 默认 bottom（在 body 之后渲染）
        return null;
      }
      return null;
    });
    const bottomPaginationNode = computed(() => {
      if (props.pagination !== false && mergedPagination.value.total) {
        const paginationSize = getPaginationSize(
          mergedPagination.value.size as never,
          mergedSize.value as never,
        );
        const { placement, position } = mergedPagination.value as TablePaginationConfig;
        const mergedPlacement = placement ?? position;
        const renderPagination = (p: string = 'end') =>
          h(Pagination, {
            ...mergedPagination.value,
            className: clsx(
              `${prefixCls}-pagination`,
              `${prefixCls}-pagination-${p}`,
              (mergedPagination.value as unknown as { className?: string }).className,
            ),
            size: paginationSize,
          } as never);
        if (Array.isArray(mergedPlacement)) {
          const topPos = mergedPlacement.find((p) => p.includes('top'));
          const bottomPos = mergedPlacement.find((p) => p.includes('bottom'));
          const isDisable = mergedPlacement.every((p) => `${p}` === 'none');
          if (!topPos && !bottomPos && !isDisable) {
            return renderPagination();
          }
          if (bottomPos) {
            return renderPagination(normalizePlacement(bottomPos as never));
          }
          return null;
        }
        return renderPagination();
      }
      return null;
    });

    // >>>>>>>>> Spinning
    const spinProps = useSpinProps(computed(() => props.loading));

    // ========== empty ==========
    const mergedEmptyNode = computed(() => {
      if (spinProps.value.spinning && rawData.value === EMPTY_LIST) {
        return null;
      }
      if (typeof props.locale?.emptyText !== 'undefined') {
        return props.locale.emptyText;
      }
      if (typeof props.emptyText !== 'undefined') {
        return props.emptyText;
      }
      // ⚠️ antd InternalTable.js:423：兜底是 `renderEmpty?.('Table')`（ConfigProvider
      //    的 renderEmpty 通道）——不是 locale 的 'No data' 字符串（那是 emptyText
      //    prop 的值，上面分支已处理）。此前漏接 ⇒ 空表格只渲染文字、缺 Empty
      //    简单插图（L6 差 112px）。
      return contextRenderEmpty?.('Table') ?? defaultRenderEmpty('Table');
    });

    const getContainerWidth = useContainerWidth(prefixCls);

    const tableClass = computed(() =>
      clsx(
        {
          [`${prefixCls}-medium`]: mergedSize.value === 'medium',
          [`${prefixCls}-small`]: mergedSize.value === 'small',
          [`${prefixCls}-bordered`]: props.bordered,
          [`${prefixCls}-empty`]: rawData.value.length === 0,
          [`${prefixCls}-no-header`]: !props.title && props.showHeader === false,
        },
        hashId,
      ),
    );

    const wrappercls = computed(() =>
      clsx(
        `${prefixCls}-wrapper`,
        {
          [`${prefixCls}-wrapper-rtl`]: direction.value === 'rtl',
        },
        (attrs as { class?: unknown }).class,
        props.rootClassName,
        mergedClassNames.value.root as string,
        hashId,
      ),
    );

    const mergedStyle = computed(() => ({
      ...(props.styles?.root ?? {}),
      ...props.style,
    }));

    expose({
      nativeElement: () => null,
      scrollTo: (config: {
        index?: number;
        top?: number;
        key?: TableKey;
        offset?: number;
        align?: ScrollLogicalPosition;
      }) => {
        void config;
      },
    });

    return () => {
      // antd 层把展开图标工厂塞进 expandable
      const finalExpandable: ExpandableConfig = {
        ...mergedExpandable.value,
        __PARENT_RENDER_ICON__: mergedExpandable.value.expandIcon,
        expandIcon:
          mergedExpandable.value.expandIcon ??
          props.expandIcon ??
          (renderExpandIcon(tableLocale.value) as never),
      } as unknown as ExpandableConfig;
      if (expandType.value === 'nest' && finalExpandable.expandIconColumnIndex === undefined) {
        finalExpandable.expandIconColumnIndex = props.rowSelection ? 1 : 0;
      } else if ((finalExpandable.expandIconColumnIndex ?? 0) > 0 && props.rowSelection) {
        finalExpandable.expandIconColumnIndex = (finalExpandable.expandIconColumnIndex ?? 0) - 1;
      }
      if (!isNumber(finalExpandable.indentSize)) {
        finalExpandable.indentSize = isNumber(props.indentSize) ? props.indentSize : 15;
      }

      return h(
        'div',
        {
          class: wrappercls.value,
          style: mergedStyle.value,
        },
        [
          h(Spin, { spinning: false, ...spinProps.value } as never, {
            default: () => [
              topPaginationNode.value,
              h(EngineTable, {
                prefixCls,
                class: tableClass.value,
                columns: (props.columns ?? []) as never,
                data: pageData.value as never,
                rowKey: getRowKey.value as never,
                rowClassName: internalRowClassName as never,
                emptyText: mergedEmptyNode.value,
                expandable: finalExpandable as never,
                indentSize: finalExpandable.indentSize,
                scroll: props.scroll,
                tableLayout: props.tableLayout,
                direction: direction.value,
                sticky: props.sticky,
                rowHoverable: props.rowHoverable,
                showHeader: props.showHeader,
                title: props.title,
                footer: props.footer,
                summary: props.summary
                  ? (data: never[]) => (props.summary as (d: never[]) => unknown)(data)
                  : undefined,
                caption: props.caption,
                id: props.id,
                components: props.components,
                onRow: props.onRow,
                onHeaderRow: props.onHeaderRow,
                onScroll: props.onScroll,
                internalHooks: INTERNAL_HOOKS,
                internalRefs: internalRef,
                transformColumns: transformColumns as never,
                getContainerWidth,
                internalOnlyExpandColumnWidth: undefined,
                style: undefined,
                internalStyle: undefined,
              } as never),
              bottomPaginationNode.value,
            ],
          }),
        ],
      );
    };
  },
});

export default Table;
export { EXPAND_COLUMN, Footer, SELECTION_COLUMN, Summary };
