/**
 * rc `Table.js`（692 行）+ `FixedHolder/index.js`（~200 行）+ `stickyScrollBar.js`
 * —— Vue 移植（引擎主组件）。
 *
 * 结构：provide(tableContextKey) → title/Panel → container →
 * （fixHeader ? FixedHolder(header) + body + FixedHolder(summary) : 单表）→ footer。
 */

import { devUseWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  provide,
  reactive,
  ref,
  watch,
} from 'vue';
import type { ColumnsType, ExpandableConfig, GetRowKey, TableComponents } from '../interface';
import Body from './Body';
import ColGroup from './ColGroup';
import { INTERNAL_HOOKS } from './constant';
import { type TableContextValue, tableContextKey, useTableContext } from './context';
import Footer, { Panel } from './Footer';
import Header from './Header';
import { useColumns } from './hooks/use-columns';
import { useExpand } from './hooks/use-expand';
import {
  useFixedInfo,
  useHover,
  useSticky,
  useStickyOffsets,
  useTimeoutLock,
} from './hooks/use-table';
import { getColumnsKey, validNumberValue } from './utils/valueUtil';
import BodyGrid from './VirtualTable/BodyGrid';

export const DEFAULT_PREFIX = 'rc-table';

// ═══════════════════════════ FixedHolder ═══════════════════════════

const FixedHolder = defineComponent({
  name: 'TableFixedHolder',
  props: {
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    noData: { type: Boolean, default: false },
    columns: { type: Array as PropType<ColumnsType>, required: true },
    flattenColumns: { type: Array as PropType<ColumnsType>, required: true },
    colWidths: { type: Array as PropType<(number | undefined)[]>, required: true },
    columCount: { type: Number, required: true },
    stickyOffsets: {
      type: Object as PropType<{ start: number[]; end: number[]; widths: number[] }>,
      required: true,
    },
    fixHeader: { type: Boolean, default: false },
    stickyTopOffset: { type: Number, default: 0 },
    stickyBottomOffset: { type: Number, default: 0 },
    stickyClassName: { type: String, default: '' },
    className: { type: null, default: undefined },
    scrollX: { type: null, default: undefined },
    tableLayout: { type: String, default: 'fixed' },
    maxContentScroll: { type: Boolean, default: false },
    colGroup: { type: null, default: undefined },
  },
  setup(props, { slots, expose }) {
    const ctx = useTableContext();
    const scrollRef = ref<HTMLElement | null>(null);
    expose({ scrollRef });

    const combinationScrollBarSize = computed(() =>
      ctx.isSticky && !props.fixHeader ? 0 : ctx.scrollbarSize,
    );
    const mergedColumnWidth = computed(() => {
      const clone: number[] = [];
      for (let i = 0; i < props.columCount; i += 1) {
        const val = props.colWidths[i];
        if (val !== undefined) {
          clone[i] = val;
        } else {
          return null;
        }
      }
      return clone;
    });
    const isColGroupEmpty = computed(() => {
      const noWidth = !mergedColumnWidth.value?.length || mergedColumnWidth.value.every((w) => !w);
      return props.noData || noWidth;
    });
    const headerStickyOffsets = computed(() => {
      const { start, end } = props.stickyOffsets;
      return {
        start,
        end: [...end.map((width) => width + combinationScrollBarSize.value), 0],
        widths: props.stickyOffsets.widths,
      };
    });

    // wheel → 横向滚动（rc 同判：只处理 deltaX）
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX) {
        const currentTarget = e.currentTarget as HTMLElement;
        const { scrollLeft, scrollWidth, clientWidth } = currentTarget;
        const maxScrollWidth = scrollWidth - clientWidth;
        let nextScroll = scrollLeft + e.deltaX;
        if (ctx.direction === 'rtl') {
          nextScroll = Math.max(-maxScrollWidth, nextScroll);
          nextScroll = Math.min(0, nextScroll);
        } else {
          nextScroll = Math.min(maxScrollWidth, nextScroll);
          nextScroll = Math.max(0, nextScroll);
        }
        ctx.onInternalScroll({ currentTarget, scrollLeft: nextScroll });
        e.preventDefault();
      }
    };
    onMounted(() => scrollRef.value?.addEventListener('wheel', onWheel, { passive: false }));
    onBeforeUnmount(() => scrollRef.value?.removeEventListener('wheel', onWheel));

    return () => {
      const TableComponent = (ctx.getComponent(['header', 'table'], 'table') ?? 'table') as string;
      const lastColumn = props.flattenColumns[props.flattenColumns.length - 1] as
        | { fixed?: unknown }
        | undefined;
      const scrollbarColumn = {
        fixed: lastColumn ? lastColumn.fixed : null,
        scrollbar: true,
        onHeaderCell: () => ({ className: `${ctx.prefixCls}-cell-scrollbar` }),
      };
      const columnsWithScrollbar = combinationScrollBarSize.value
        ? [...props.columns, scrollbarColumn as never]
        : props.columns;
      const flattenColumnsWithScrollbar = combinationScrollBarSize.value
        ? [...props.flattenColumns, scrollbarColumn as never]
        : props.flattenColumns;
      return h(
        'div',
        {
          style: {
            overflow: 'hidden',
            ...(ctx.isSticky
              ? { top: `${props.stickyTopOffset}px`, bottom: `${props.stickyBottomOffset}px` }
              : {}),
            ...props.style,
          },
          ref: scrollRef,
          class: [props.className, props.stickyClassName || undefined],
        },
        [
          h(
            TableComponent,
            {
              style: {
                tableLayout: props.tableLayout,
                minWidth: '100%',
                // ⚠️ Vue 的 setStyle 不做 px 补全（React 会）⇒ 数值必须自己拼单位，
                //    否则整条 width 声明被静默丢弃 ⇒ 表头宽退回 auto，`table-layout: fixed`
                //    下「无 width 的列」宽度为 0、标题换行 ⇒ 表头被撑高（virtual 变体实测 209px）。
                width:
                  props.scrollX === true
                    ? 'auto'
                    : typeof props.scrollX === 'number'
                      ? `${props.scrollX}px`
                      : (props.scrollX as string | undefined),
              },
            },
            [
              isColGroupEmpty.value
                ? props.colGroup
                : h(ColGroup, {
                    colWidths: [...(mergedColumnWidth.value ?? []), combinationScrollBarSize.value],
                    columCount: props.columCount + 1,
                    columns: flattenColumnsWithScrollbar,
                  }),
              slots.default?.({
                stickyOffsets: headerStickyOffsets.value,
                columns: columnsWithScrollbar,
                flattenColumns: flattenColumnsWithScrollbar,
              }),
            ],
          ),
        ],
      );
    };
  },
});

// ═══════════════════════════ StickyScrollBar ═══════════════════════════

const StickyScrollBar = defineComponent({
  name: 'TableStickyScrollBar',
  props: {
    offsetScroll: { type: Number, default: 0 },
    container: { type: null, default: undefined },
  },
  setup(props) {
    const ctx = useTableContext();
    const barRef = ref<HTMLElement | null>(null);
    const _bodyRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const barWidth = ref(0);
    const scrollLeft = ref(0);
    const barTranslationPrefix = computed(() => (ctx.direction === 'rtl' ? 'calc(100% + ' : '-'));
    let removeHandlers: (() => void) | undefined;
    onMounted(() => {
      const container = props.container as Window | HTMLElement | null | undefined;
      const target = (container && 'addEventListener' in container ? container : window) as Window;
      const update = () => {
        const body = ctx.scrollBodyRef?.value as HTMLElement | null | undefined;
        if (!body) return;
        const scrollWidth = body.scrollWidth;
        const clientWidth = body.clientWidth;
        const maxWidth = scrollWidth - clientWidth;
        visible.value = maxWidth > 0 && body.offsetWidth > 0;
        barWidth.value = (clientWidth / scrollWidth) * 100;
        // 与 rc 同构：bar 位移 = scrollLeft / scrollWidth * 100%
        barTranslation.value = `calc(${barTranslationPrefix.value}${(scrollLeft.value / Math.max(scrollWidth, 1)) * 100}%)`;
      };
      const onScroll = () => {
        const body = ctx.scrollBodyRef?.value as HTMLElement | null | undefined;
        if (body) scrollLeft.value = body.scrollLeft;
        update();
      };
      update();
      target.addEventListener('scroll', onScroll, true);
      target.addEventListener('resize', update);
      removeHandlers = () => {
        target.removeEventListener('scroll', onScroll, true);
        target.removeEventListener('resize', update);
      };
    });
    onBeforeUnmount(() => removeHandlers?.());
    const barTranslation = ref('');
    return () =>
      visible.value
        ? h(
            'div',
            {
              class: [
                `${ctx.prefixCls}-sticky-scroll`,
                { [`${ctx.prefixCls}-sticky-scroll-bar-active`]: false },
              ],
              style: {
                position: 'sticky',
                bottom: `${props.offsetScroll}px`,
                zIndex: (ctx.columnsCount ?? 0) * 2 + 2 + 1,
              },
              ref: barRef,
            },
            [
              h('div', {
                class: `${ctx.prefixCls}-sticky-scroll-bar`,
                style: {
                  width: `${barWidth.value}%`,
                  transform: `translate(${barTranslation.value}, 0)`,
                },
              }),
            ],
          )
        : null;
  },
});

// ═══════════════════════════ Table（引擎） ═══════════════════════════

export interface EngineTableProps {
  prefixCls?: string;
  className?: unknown;
  rowClassName?: string | ((record: never, index: number, indent: number) => string);
  style?: Record<string, unknown>;
  classNames?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  data?: Record<string, unknown>[];
  rowKey?: string | GetRowKey<never>;
  scroll?: { x?: number | true | string; y?: number | string };
  tableLayout?: 'auto' | 'fixed';
  direction?: 'ltr' | 'rtl';
  title?: ((data: never[]) => unknown) | unknown;
  footer?: ((data: never[]) => unknown) | unknown;
  summary?: (data: never[]) => unknown;
  caption?: unknown;
  id?: string;
  showHeader?: boolean;
  components?: TableComponents;
  emptyText?: unknown | (() => unknown);
  onRow?: (record: never, index?: number) => Record<string, unknown>;
  onHeaderRow?: (columns: ColumnsType, index?: number) => Record<string, unknown>;
  measureRowRender?: (node: unknown) => unknown;
  onScroll?: (e: Event) => void;
  internalHooks?: string;
  transformColumns?: (columns: ColumnsType) => ColumnsType;
  internalRefs?: { body?: { current: unknown } };
  tailor?: boolean;
  getContainerWidth?: (element: HTMLElement, width: number) => number;
  sticky?: boolean | Record<string, unknown>;
  rowHoverable?: boolean;
  expandable?: ExpandableConfig;
  indentSize?: number;
  expandIconColumnIndex?: number;
  expandedRowRender?: ExpandableConfig['expandedRowRender'];
  expandIcon?: ExpandableConfig['expandIcon'];
  childrenColumnName?: string;
}

const Table = defineComponent({
  name: 'RcTable',
  props: {
    prefixCls: { type: String, default: DEFAULT_PREFIX },
    className: { type: null, default: undefined },
    rowClassName: { type: null, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    classNames: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    styles: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    data: { type: Array as PropType<Record<string, unknown>[]>, default: undefined },
    columns: { type: Array as PropType<ColumnsType>, default: undefined },
    rowKey: { type: [String, Function] as PropType<string | GetRowKey<never>>, default: 'key' },
    scroll: {
      type: Object as PropType<{ x?: number | true | string; y?: number | string }>,
      default: undefined,
    },
    tableLayout: { type: String as PropType<'auto' | 'fixed'>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    title: { type: null, default: undefined },
    footer: { type: null, default: undefined },
    summary: { type: Function as PropType<(data: never[]) => unknown>, default: undefined },
    caption: { type: null, default: undefined },
    id: { type: String, default: undefined },
    showHeader: { type: Boolean, default: undefined },
    components: { type: Object as PropType<TableComponents>, default: undefined },
    emptyText: { type: null, default: undefined },
    onRow: { type: Function as PropType<EngineTableProps['onRow']>, default: undefined },
    onHeaderRow: { type: Function, default: undefined },
    measureRowRender: { type: Function, default: undefined },
    onScroll: { type: Function, default: undefined },
    internalHooks: { type: String, default: undefined },
    transformColumns: { type: Function, default: undefined },
    internalRefs: { type: Object as PropType<{ body?: { current: unknown } }>, default: undefined },
    tailor: { type: Boolean, default: false },
    getContainerWidth: { type: Function, default: undefined },
    sticky: {
      type: [Boolean, Object] as PropType<boolean | Record<string, unknown>>,
      default: undefined,
    },
    rowHoverable: { type: Boolean, default: true },
    expandable: { type: Object as PropType<ExpandableConfig>, default: undefined },
    indentSize: { type: Number, default: undefined },
    expandIconColumnIndex: { type: Number, default: undefined },
    expandedRowRender: { type: Function, default: undefined },
    expandIcon: { type: Function, default: undefined },
    childrenColumnName: { type: String, default: undefined },
    virtual: { type: Boolean, default: false },
    listItemHeight: { type: Number, default: undefined },
  },
  setup(props, { attrs, expose }) {
    const mergedData = computed(() => props.data ?? []);
    const hasData = computed(() => mergedData.value.length > 0);

    // ==================== Virtual Scroll ====================
    // rc `VirtualTable/index.js`：virtual 时 `scroll.x` / `scroll.y` 必须是 number，
    // 否则兜底（x→1 / y→500）并 dev warning。放在引擎内做，避免上层漏传。
    const mergedScroll = computed(() => {
      const scroll = props.scroll;
      if (!props.virtual) return scroll;
      let x: unknown = scroll?.x;
      let y: unknown = scroll?.y;
      if (typeof x !== 'number') {
        if (x) {
          devUseWarning('Table')(false, '`scroll.x` in virtual table must be number.');
        }
        x = 1;
      }
      if (typeof y !== 'number') {
        devUseWarning('Table')(false, '`scroll.y` in virtual table must be number.');
        y = 500;
      }
      return { ...scroll, x, y } as { x?: number | true | string; y?: number | string };
    });
    const useInternalHooks = computed(() => props.internalHooks === INTERNAL_HOOKS);

    // ==================== getRowKey ====================
    const getRowKey = computed<GetRowKey<never>>(() => {
      if (typeof props.rowKey === 'function') {
        return props.rowKey as GetRowKey<never>;
      }
      const keyName = (props.rowKey ?? 'key') as string;
      return (record) => (record as Record<string, unknown>)?.[keyName] as string | number;
    });

    // ==================== Customize ====================
    const getComponent = (path: string[], defaultComponent: unknown): unknown => {
      let current: unknown = props.components;
      for (const key of path) {
        if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[key];
        } else {
          return defaultComponent;
        }
      }
      return current ?? defaultComponent;
    };
    const _customizeScrollBody = computed(() => getComponent(['body'], undefined));

    // ====================== Hover ======================
    const { startRow, endRow, onHover } = useHover();

    // ====================== Expand ======================
    const propsRef = computed(() => props as unknown as Record<string, unknown>);
    const {
      expandableConfig,
      expandableType,
      mergedExpandedKeys,
      mergedExpandIcon,
      mergedChildrenColumnName,
      onTriggerExpand,
    } = useExpand(propsRef, mergedData as never, getRowKey.value as never);

    // ====================== Column ======================
    const scrollX = computed(() => mergedScroll.value?.x);
    const componentWidth = ref(0);
    const colsWidths = ref(new Map<string | number, number>());
    const useInternalHooksRef = useInternalHooks;
    const columnsParams = computed(() => ({
      prefixCls: props.prefixCls,
      columns: (props as unknown as { columns?: ColumnsType }).columns,
      expandable: Boolean(expandableConfig.value.expandedRowRender),
      columnTitle: expandableConfig.value.columnTitle,
      expandedKeys: mergedExpandedKeys.value,
      getRowKey: getRowKey.value as never,
      onTriggerExpand,
      expandIcon: mergedExpandIcon.value,
      rowExpandable: expandableConfig.value.rowExpandable,
      expandIconColumnIndex:
        expandableConfig.value.expandIconColumnIndex ?? props.expandIconColumnIndex,
      expandedRowOffset: expandableConfig.value.expandedRowOffset ?? 0,
      direction: props.direction,
      expandRowByClick: expandableConfig.value.expandRowByClick,
      columnWidth: expandableConfig.value.columnWidth,
      fixed: expandableConfig.value.fixed,
      data: mergedData.value,
      childrenColumnName: mergedChildrenColumnName,
      internalHooks: props.internalHooks,
      __PARENT_RENDER_ICON__: (expandableConfig as { expandIcon?: unknown }).expandIcon,
      scrollWidth:
        useInternalHooksRef.value && props.tailor && typeof scrollX.value === 'number'
          ? scrollX.value
          : null,
      clientWidth: componentWidth.value,
    }));
    const { mergedColumns, filledColumns, realScrollWidth } = useColumns(
      columnsParams,
      (useInternalHooksRef.value ? props.transformColumns : null) as never,
    );
    const mergedScrollX = computed(() => realScrollWidth.value ?? scrollX.value);

    // ====================== Refs ======================
    const fullTableRef = ref<HTMLElement | null>(null);
    const scrollHeaderRef = ref<HTMLElement | null>(null);
    const scrollBodyRef = ref<HTMLElement | null>(null);
    const scrollBodyContainerRef = ref<HTMLElement | null>(null);
    const scrollSummaryRef = ref<HTMLElement | null>(null);
    /** virtual 时 body 由 `BodyGrid` 渲染 —— 它的 imperative handle 承载 `scrollTo`。 */
    const bodyGridRef = ref<{
      scrollTo?: (config: unknown) => void;
      nativeElement?: HTMLElement | null;
    } | null>(null);
    expose({
      nativeElement: () => fullTableRef.value,
      scrollTo: (config: {
        index?: number;
        top?: number;
        key?: string | number;
        offset?: number;
        align?: ScrollLogicalPosition;
      }) => {
        // virtual：交给 BodyGrid → VirtualList 的 scrollTo（支持 index/key/align/offset）
        if (props.virtual) {
          bodyGridRef.value?.scrollTo?.(config);
          return;
        }
        const body = scrollBodyRef.value as HTMLElement | null;
        if (!body) return;
        if (validNumberValue(config.top)) {
          body.scrollTo({ top: config.top });
        } else {
          const mergedKey =
            config.key ?? getRowKey.value(mergedData.value[config.index ?? 0] as never);
          const target = body.querySelector(`[data-row-key="${String(mergedKey)}"]`);
          target?.scrollIntoView({ block: config.align ?? 'nearest' });
          if (config.offset) {
            body.scrollTo({ top: body.scrollTop + config.offset });
          }
        }
      },
      // 供 FixedHolder/StickyScrollBar 注入回环
      scrollHeaderRef,
      scrollBodyRef,
      scrollSummaryRef,
    });

    // ====================== Scroll ======================
    const shadowStart = ref(false);
    const shadowEnd = ref(false);
    const colsKeys = computed(() => getColumnsKey(filledColumns.value as never));
    const pureColWidths = computed(() => colsKeys.value.map((k) => colsWidths.value.get(k)));
    const colWidths = computed(() => pureColWidths.value);
    const stickyOffsets = useStickyOffsets(colWidths, filledColumns);
    const fixHeader = computed(() => Boolean(mergedScroll.value?.y));
    const horizonScroll = computed(() => {
      return Boolean(mergedScroll.value?.x) || Boolean(expandableConfig.value.fixed);
    });
    const fixColumn = computed(
      () =>
        horizonScroll.value &&
        (filledColumns.value as { fixed?: unknown }[]).some(({ fixed }) => fixed),
    );
    const stickyInfo = useSticky(props.sticky as never, props.prefixCls);

    // Footer
    const summaryNode = computed(() => props.summary?.(mergedData.value as never));
    const fixFooter = computed(() => {
      if (!(fixHeader.value || stickyInfo.isSticky)) return false;
      if (!summaryNode.value) return false;
      const fixedProp = (summaryNode.value as { props?: { fixed?: unknown } })?.props?.fixed;
      return fixedProp ?? false;
    });

    // Scroll styles
    const scrollYStyle = computed<Record<string, unknown>>(() => {
      if (fixHeader.value) {
        return { overflowY: hasData.value ? 'scroll' : 'auto', maxHeight: mergedScroll.value?.y };
      }
      if (horizonScroll.value) return { overflowY: 'hidden' };
      return {};
    });
    const scrollXStyle = computed<Record<string, unknown>>(() =>
      horizonScroll.value ? { overflowX: 'auto' } : {},
    );
    const scrollTableStyle = computed<Record<string, unknown>>(() => {
      if (!horizonScroll.value) return {};
      // ⚠️ React 的 style 数字自动加 px；Vue **不加** ⇒ `width: 1200`（无单位）被
      //    cssstyle 判无效丢弃 ⇒ 表格总宽失效、列宽全空（L6 size-mismatch 的根因）。
      const w = mergedScrollX.value;
      return {
        width: w === true ? 'auto' : typeof w === 'number' ? `${w}px` : w,
        minWidth: '100%',
      };
    });

    const onColumnResize = (columnKey: string | number, width: number) => {
      if (colsWidths.value.get(columnKey) !== width) {
        const newWidths = new Map(colsWidths.value);
        newWidths.set(columnKey, width);
        colsWidths.value = newWidths;
      }
    };
    const scrollLock = useTimeoutLock(null);
    onBeforeUnmount(() => scrollLock.cleanup());
    const scrollInfo = ref<[number, number]>([0, 0]);

    const forceScroll = (sLeft: number, target: unknown) => {
      if (!target) return;
      if (typeof target === 'function') {
        (target as (n: number) => void)(sLeft);
        return;
      }
      const el = target as HTMLElement;
      if (el.scrollLeft !== sLeft) {
        el.scrollLeft = sLeft;
        setTimeout(() => {
          if (el.scrollLeft !== sLeft) el.scrollLeft = sLeft;
        }, 0);
      }
    };

    const onInternalScroll = (e: { currentTarget?: HTMLElement; scrollLeft: number }) => {
      const mergedScrollLeft =
        typeof e.scrollLeft === 'number' ? e.scrollLeft : (e.currentTarget?.scrollLeft ?? 0);
      const compareTarget = e.currentTarget ?? ({} as HTMLElement);
      if (!scrollLock.getState() || scrollLock.getState() === compareTarget) {
        scrollLock.setState(compareTarget);
        forceScroll(mergedScrollLeft, scrollHeaderRef.value);
        forceScroll(mergedScrollLeft, scrollBodyRef.value);
        forceScroll(mergedScrollLeft, scrollSummaryRef.value);
      }
      const measureTarget = e.currentTarget ?? scrollHeaderRef.value;
      if (measureTarget) {
        const scrollWidth =
          useInternalHooksRef.value && props.tailor && typeof mergedScrollX.value === 'number'
            ? mergedScrollX.value
            : measureTarget.scrollWidth;
        const clientWidth = measureTarget.clientWidth;
        const absScrollStart = Math.abs(mergedScrollLeft);
        const next: [number, number] = [absScrollStart, scrollWidth - clientWidth];
        if (next[0] !== scrollInfo.value[0] || next[1] !== scrollInfo.value[1]) {
          scrollInfo.value = next;
        }
        if (scrollWidth === clientWidth) {
          shadowStart.value = false;
          shadowEnd.value = false;
          return;
        }
        shadowStart.value = absScrollStart > 0;
        shadowEnd.value = absScrollStart < scrollWidth - clientWidth - 1;
      }
    };
    const onBodyScroll = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      onInternalScroll({ currentTarget: target, scrollLeft: target.scrollLeft });
      props.onScroll?.(e);
    };
    const triggerOnScroll = () => {
      if (horizonScroll.value && scrollBodyRef.value) {
        onInternalScroll({
          currentTarget: scrollBodyRef.value as HTMLElement,
          scrollLeft: (scrollBodyRef.value as HTMLElement).scrollLeft,
        });
      } else {
        shadowStart.value = false;
        shadowEnd.value = false;
      }
    };
    const onFullTableResize = (offsetWidth?: number) => {
      let mergedWidth = offsetWidth ?? fullTableRef.value?.offsetWidth ?? 0;
      if (useInternalHooksRef.value && props.getContainerWidth && fullTableRef.value) {
        mergedWidth = props.getContainerWidth(fullTableRef.value, mergedWidth) || mergedWidth;
      }
      if (mergedWidth !== componentWidth.value) {
        triggerOnScroll();
        componentWidth.value = mergedWidth;
      }
    };

    watch(horizonScroll, () => {
      if (horizonScroll.value) onFullTableResize();
    });
    watch(
      [() => props.data, () => filledColumns.value.length],
      () => {
        triggerOnScroll();
      },
      { flush: 'post' },
    );
    onMounted(() => {
      if (horizonScroll.value) onFullTableResize();
      if (props.internalRefs) {
        (props.internalRefs as { body?: { current: unknown } }).body = {
          current: scrollBodyRef.value,
        };
      }
    });

    // ====================== Render helpers ======================
    const mergedTableLayout = computed<'auto' | 'fixed'>(() => {
      if (props.tableLayout) return props.tableLayout;
      if (fixColumn.value) {
        return mergedScrollX.value === 'max-content' ? 'auto' : 'fixed';
      }
      if (
        fixHeader.value ||
        stickyInfo.isSticky ||
        (filledColumns.value as { ellipsis?: unknown }[]).some(({ ellipsis }) => ellipsis)
      ) {
        return 'fixed';
      }
      return 'auto';
    });

    const headerProps = computed(() => ({
      colWidths: colWidths.value,
      columCount: filledColumns.value.length,
      stickyOffsets: stickyOffsets.value,
      onHeaderRow: props.onHeaderRow,
      fixHeader: fixHeader.value,
      scroll: mergedScroll.value,
    }));

    const emptyNode = computed(() => {
      if (hasData.value) return null;
      if (typeof props.emptyText === 'function') return (props.emptyText as () => unknown)();
      return props.emptyText ?? 'No Data';
    });

    const fixedInfoList = useFixedInfo(filledColumns, stickyOffsets);

    // 滚动条尺寸（rc getTargetScrollBarSize：fixHeader 时表头垫宽）
    const scrollbarSize = ref(0);
    onMounted(() => {
      const el = scrollBodyRef.value as HTMLElement | null;
      if (!el) return;
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll;';
      document.body.appendChild(probe);
      const width = probe.offsetWidth - probe.clientWidth;
      document.body.removeChild(probe);
      scrollbarSize.value = width || 0;
    });

    // ====================== Context ======================
    const ctxValue = reactive({
      // Scroll
      get scrollX() {
        return mergedScrollX.value;
      },
      get scrollInfo() {
        return scrollInfo.value;
      },
      get classNames() {
        return props.classNames;
      },
      get styles() {
        return props.styles;
      },
      get prefixCls() {
        return props.prefixCls;
      },
      getComponent,
      get scrollbarSize() {
        return scrollbarSize.value;
      },
      get direction() {
        return props.direction;
      },
      get fixedInfoList() {
        return fixedInfoList.value;
      },
      get isSticky() {
        return stickyInfo.isSticky;
      },
      get componentWidth() {
        return componentWidth.value;
      },
      get fixHeader() {
        return fixHeader.value;
      },
      get fixColumn() {
        return fixColumn.value;
      },
      get horizonScroll() {
        return horizonScroll.value;
      },
      get scroll() {
        return mergedScroll.value;
      },
      // Body
      get tableLayout() {
        return mergedTableLayout.value;
      },
      get rowClassName() {
        return props.rowClassName;
      },
      get expandedRowClassName() {
        return expandableConfig.value.expandedRowClassName;
      },
      get expandIcon() {
        return mergedExpandIcon.value;
      },
      get expandableType() {
        return expandableType.value;
      },
      get expandRowByClick() {
        return expandableConfig.value.expandRowByClick;
      },
      get expandedRowRender() {
        return expandableConfig.value.expandedRowRender ?? props.expandedRowRender;
      },
      get forceRender() {
        return expandableConfig.value.forceRender ?? false;
      },
      get expandedRowOffset() {
        return expandableConfig.value.expandedRowOffset ?? 0;
      },
      onTriggerExpand,
      get expandIconColumnIndex() {
        return expandableConfig.value.expandIconColumnIndex ?? props.expandIconColumnIndex ?? 0;
      },
      get indentSize() {
        return props.indentSize ?? expandableConfig.value.indentSize ?? 15;
      },
      get allColumnsFixedLeft() {
        return (filledColumns.value as { fixed?: unknown }[]).every((col) => col.fixed === 'start');
      },
      get emptyNode() {
        return emptyNode.value;
      },
      // Column
      get columns() {
        return mergedColumns.value;
      },
      get flattenColumns() {
        return filledColumns.value;
      },
      onColumnResize,
      get colWidths() {
        return colWidths.value;
      },
      // Row
      get hoverStartRow() {
        return startRow.value;
      },
      get hoverEndRow() {
        return endRow.value;
      },
      onHover,
      get rowExpandable() {
        return expandableConfig.value.rowExpandable;
      },
      get onRow() {
        return props.onRow;
      },
      get getRowKey() {
        return getRowKey.value;
      },
      get expandedKeys() {
        return mergedExpandedKeys.value;
      },
      get childrenColumnName() {
        return mergedChildrenColumnName;
      },
      get rowHoverable() {
        return props.rowHoverable;
      },
      get measureRowRender() {
        return props.measureRowRender;
      },
      // Sticky
      get stickyOffsets() {
        return stickyOffsets.value;
      },
      get columnsCount() {
        return filledColumns.value.length;
      },
      get stickyInfo() {
        return stickyInfo;
      },
      onInternalScroll,
      // 供 FixedHolder/StickyScrollBar 消费
      get scrollHeaderRef() {
        return scrollHeaderRef;
      },
      get scrollBodyRef() {
        return scrollBodyRef;
      },
      get scrollSummaryRef() {
        return scrollSummaryRef;
      },
    }) as unknown as TableContextValue;
    provide(tableContextKey, ctxValue);

    // ====================== Render ======================
    const bodyColGroup = () =>
      h(ColGroup, {
        colWidths: (filledColumns.value as { width?: number | string }[]).map(({ width }) => width),
        columns: filledColumns.value as ColumnsType,
      });
    const captionElement = computed(() =>
      props.caption !== null && props.caption !== undefined
        ? h('caption', { class: `${props.prefixCls}-caption` }, props.caption as never)
        : null,
    );

    const bodyTable = () =>
      h(Body, {
        data: mergedData.value,
        measureColumnWidth: fixHeader.value || horizonScroll.value || stickyInfo.isSticky,
      });

    const renderHeader = (
      headerStickyOffsets: { start: number[]; end: number[]; widths: number[] },
      columns: ColumnsType,
      flattenColumns: ColumnsType,
    ) =>
      h(Header, {
        stickyOffsets: headerStickyOffsets,
        columns,
        flattenColumns,
        onHeaderRow: headerProps.value.onHeaderRow,
      } as never);

    return () => {
      const classNames = props.classNames as Record<string, unknown> | undefined;
      const styles = props.styles as Record<string, unknown> | undefined;

      let groupTableNode: unknown;
      if (fixHeader.value || stickyInfo.isSticky) {
        // >>>>>> Fixed Header
        // virtual：body 换成 BodyGrid（rc `customizeScrollBody` 通道的等价物）
        const bodyContent = props.virtual
          ? h(BodyGrid, {
              ref: bodyGridRef,
              data: mergedData.value,
              height: (mergedScroll.value?.y as number) ?? 500,
              scrollWidth: typeof mergedScrollX.value === 'number' ? mergedScrollX.value : 1,
              listItemHeight: props.listItemHeight,
              onScroll: onInternalScroll,
            } as never)
          : h(
              'div',
              {
                style: { ...scrollXStyle.value, ...scrollYStyle.value },
                onScroll: onBodyScroll,
                ref: scrollBodyRef,
                class: `${props.prefixCls}-body`,
              },
              [
                h(
                  'table',
                  {
                    style: { ...scrollTableStyle.value, tableLayout: mergedTableLayout.value },
                  },
                  [
                    captionElement.value,
                    bodyColGroup(),
                    bodyTable(),
                    !fixFooter.value && summaryNode.value
                      ? h(
                          Footer,
                          {
                            stickyOffsets: stickyOffsets.value,
                            flattenColumns: filledColumns.value as never,
                          },
                          { default: () => summaryNode.value },
                        )
                      : null,
                  ],
                ),
              ],
            );
        const fixedHolderProps = {
          noData: !mergedData.value.length,
          maxContentScroll: horizonScroll.value && mergedScrollX.value === 'max-content',
          ...headerProps.value,
          columns: mergedColumns.value as ColumnsType,
          flattenColumns: filledColumns.value as ColumnsType,
          direction: props.direction,
          stickyClassName: stickyInfo.stickyClassName,
          scrollX: mergedScrollX.value,
          tableLayout: mergedTableLayout.value,
          colGroup: bodyColGroup(),
        };
        groupTableNode = [
          props.showHeader !== false &&
            h(
              FixedHolder,
              {
                ...fixedHolderProps,
                stickyTopOffset: stickyInfo.offsetHeader,
                class: `${props.prefixCls}-header`,
                key: 'header',
                ref: (inst: unknown) => {
                  const exposed = inst as { scrollRef?: HTMLElement | null } | null;
                  scrollHeaderRef.value = exposed?.scrollRef ?? (inst as HTMLElement) ?? null;
                },
              },
              {
                default: (slotProps: {
                  stickyOffsets: never;
                  columns: ColumnsType;
                  flattenColumns: ColumnsType;
                }) =>
                  renderHeader(
                    slotProps.stickyOffsets,
                    slotProps.columns,
                    slotProps.flattenColumns,
                  ),
              },
            ),
          bodyContent,
          fixFooter.value && fixFooter.value !== 'top'
            ? h(
                FixedHolder,
                {
                  ...fixedHolderProps,
                  stickyBottomOffset: stickyInfo.offsetSummary,
                  class: `${props.prefixCls}-summary`,
                  key: 'summary',
                  ref: (inst: unknown) => {
                    const exposed = inst as { scrollRef?: HTMLElement | null } | null;
                    scrollSummaryRef.value = exposed?.scrollRef ?? (inst as HTMLElement) ?? null;
                  },
                },
                {
                  default: (slotProps: {
                    stickyOffsets: never;
                    columns: ColumnsType;
                    flattenColumns: ColumnsType;
                  }) =>
                    h(
                      Footer,
                      {
                        stickyOffsets: slotProps.stickyOffsets,
                        flattenColumns: slotProps.flattenColumns as never,
                      },
                      { default: () => summaryNode.value },
                    ),
                },
              )
            : null,
          stickyInfo.isSticky && scrollBodyRef.value
            ? h(StickyScrollBar, {
                offsetScroll: stickyInfo.offsetScroll,
                container: stickyInfo.container,
              })
            : null,
        ];
      } else {
        // >>>>>> Unique table
        groupTableNode = h(
          'div',
          {
            style: {
              ...scrollXStyle.value,
              ...scrollYStyle.value,
              ...((styles?.content as Record<string, unknown>) ?? {}),
            },
            class: [`${props.prefixCls}-content`, (classNames?.content as string) ?? undefined],
            onScroll: onBodyScroll,
            ref: scrollBodyRef,
          },
          [
            h(
              'table',
              {
                style: { ...scrollTableStyle.value, tableLayout: mergedTableLayout.value },
              },
              [
                captionElement.value,
                bodyColGroup(),
                props.showHeader !== false
                  ? renderHeader(
                      stickyOffsets.value as never,
                      mergedColumns.value as ColumnsType,
                      filledColumns.value as ColumnsType,
                    )
                  : null,
                bodyTable(),
                summaryNode.value
                  ? h(
                      Footer,
                      {
                        stickyOffsets: stickyOffsets.value,
                        flattenColumns: filledColumns.value as never,
                      },
                      { default: () => summaryNode.value },
                    )
                  : null,
              ],
            ),
          ],
        );
      }

      const tableStyle: Record<string, unknown> = { ...props.style };
      if (stickyInfo.isSticky) {
        tableStyle['--columns-count'] = filledColumns.value.length;
      }

      const titleNode = props.title
        ? h(
            Panel,
            {
              class: [`${props.prefixCls}-title`, (classNames?.title as string) ?? undefined],
              style: styles?.title,
            } as never,
            {
              default: () =>
                typeof props.title === 'function'
                  ? (props.title as (d: never[]) => unknown)(mergedData.value as never)
                  : props.title,
            },
          )
        : null;
      const footerNode = props.footer
        ? h(
            Panel,
            {
              class: [`${props.prefixCls}-footer`, (classNames?.footer as string) ?? undefined],
              style: styles?.footer,
            } as never,
            {
              default: () =>
                typeof props.footer === 'function'
                  ? (props.footer as (d: never[]) => unknown)(mergedData.value as never)
                  : props.footer,
            },
          )
        : null;

      const fullTable = h(
        'div',
        {
          class: [
            props.prefixCls,
            (attrs as { class?: unknown }).class,
            {
              [`${props.prefixCls}-rtl`]: props.direction === 'rtl',
              [`${props.prefixCls}-fix-start-shadow`]: horizonScroll.value,
              [`${props.prefixCls}-fix-end-shadow`]: horizonScroll.value,
              [`${props.prefixCls}-fix-start-shadow-show`]:
                horizonScroll.value && shadowStart.value,
              [`${props.prefixCls}-fix-end-shadow-show`]: horizonScroll.value && shadowEnd.value,
              [`${props.prefixCls}-layout-fixed`]: mergedTableLayout.value === 'fixed',
              [`${props.prefixCls}-fixed-header`]: fixHeader.value,
              [`${props.prefixCls}-fixed-column`]: fixColumn.value,
              [`${props.prefixCls}-scroll-horizontal`]: horizonScroll.value,
              [`${props.prefixCls}-has-fix-start`]: (
                filledColumns.value[0] as { fixed?: unknown } | undefined
              )?.fixed,
              [`${props.prefixCls}-has-fix-end`]:
                (
                  filledColumns.value[filledColumns.value.length - 1] as
                    | { fixed?: unknown }
                    | undefined
                )?.fixed === 'end',
            },
          ],
          style: tableStyle,
          id: props.id,
          ref: fullTableRef,
        } as never,
        [
          titleNode,
          h(
            'div',
            {
              ref: scrollBodyContainerRef,
              class: [`${props.prefixCls}-container`, (classNames?.section as string) ?? undefined],
              style: styles?.section,
            } as never,
            groupTableNode as never,
          ),
          footerNode,
        ],
      );
      return fullTable;
    };
  },
});

export default Table;
