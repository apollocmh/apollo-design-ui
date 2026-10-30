/**
 * rc `Table.js`（692 行）+ `FixedHolder/index.js`（~200 行）+ `stickyScrollBar.js`
 * —— Vue 移植（引擎主组件）。
 *
 * 结构：provide(tableContextKey) → title/Panel → container →
 * （fixHeader ? FixedHolder(header) + body + FixedHolder(summary) : 单表）→ footer。
 */

import { devUseWarning, getElement, isHTMLElement, useResizeObserver } from '@apollo-design/utils';
import {
  Comment,
  type ComponentPublicInstance,
  type CSSProperties,
  computed,
  defineComponent,
  Fragment,
  h,
  isVNode,
  onBeforeUnmount,
  onMounted,
  type PropType,
  provide,
  ref,
  type SetupContext,
  type SlotsType,
  type VNodeChild,
  watch,
} from 'vue';
import type {
  ColumnsType,
  ColumnType,
  GetRowKey,
  TableComponent,
  TableProps,
  TableScrollToConfig,
  TableSemanticClassNames,
  TableSemanticStyles,
  TableSlots,
} from '../interface';
import Body from './Body';
import ColGroup from './ColGroup';
import { INTERNAL_HOOKS } from './constant';
import { type TableContextValue, tableContextKey, useTableContext } from './context';
import { renderElement } from './element';
import Footer, { Panel, Summary } from './Footer';
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
import type { EngineExpandableConfig } from './interface';
import { getColumnsKey, validNumberValue } from './utils/valueUtil';
import BodyGrid from './VirtualTable/BodyGrid';

/** Native slot forwarding adds transparent Fragments around the Summary node. */
function summaryFixed(content: VNodeChild): boolean | 'top' | 'bottom' {
  const nodes: VNodeChild[] = [];
  const collect = (node: VNodeChild): void => {
    if (Array.isArray(node)) {
      node.forEach(collect);
      return;
    }
    if (isVNode(node) && node.type === Fragment && Array.isArray(node.children)) {
      node.children.forEach(collect);
      return;
    }
    if (node == null || typeof node === 'boolean' || (isVNode(node) && node.type === Comment))
      return;
    nodes.push(node);
  };
  collect(content);
  const node = nodes.length === 1 ? nodes[0] : undefined;
  const fixed: unknown = isVNode(node) && node.type === Summary ? node.props?.fixed : false;
  return fixed === true || fixed === 'top' || fixed === 'bottom' ? fixed : false;
}

export const DEFAULT_PREFIX = 'rc-table';

// ═══════════════════════════ FixedHolder ═══════════════════════════

interface FixedHolderProps<RecordType> {
  style?: CSSProperties;
  noData?: boolean;
  columns: ColumnsType<RecordType>;
  flattenColumns: ColumnsType<RecordType>;
  colWidths: (number | undefined)[];
  columCount: number;
  stickyOffsets: { start: number[]; end: number[]; widths: number[] };
  fixHeader?: boolean;
  stickyTopOffset?: number;
  stickyBottomOffset?: number;
  stickyClassName?: string;
  className?: unknown;
  scrollX?: TableProps<RecordType>['scroll'] extends infer _Scroll ? number | string | true : never;
  tableLayout?: 'auto' | 'fixed';
  maxContentScroll?: boolean;
  colGroup?: VNodeChild;
}
const NativeFixedHolder = defineComponent(
  <RecordType extends object>(
    props: FixedHolderProps<RecordType>,
    {
      slots,
    }: SetupContext<
      [],
      SlotsType<{
        default?: (scope: {
          stickyOffsets: import('./utils/fixUtil').StickyOffsets;
          columns: ColumnsType<RecordType>;
          flattenColumns: ColumnsType<RecordType>;
        }) => VNodeChild;
      }>
    >,
  ) => {
    const ctx = useTableContext<RecordType>();
    const scrollRef = ref<HTMLElement | null>(null);

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
        const currentTarget = scrollRef.value;
        if (!currentTarget) return;
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
      const TableComponent = ctx.getComponent(
        ['header', 'table'],
        ctx.getComponent(['table'], 'table'),
      );
      const lastColumn = props.flattenColumns[props.flattenColumns.length - 1];
      const scrollbarColumn: ColumnType<RecordType> = {
        fixed: lastColumn?.fixed,
        scrollbar: true,
        onHeaderCell: () => ({ class: `${ctx.prefixCls}-cell-scrollbar` }),
      };
      const columnsWithScrollbar = combinationScrollBarSize.value
        ? [...props.columns, scrollbarColumn]
        : props.columns;
      const flattenColumnsWithScrollbar = combinationScrollBarSize.value
        ? [...props.flattenColumns, scrollbarColumn]
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
          renderElement(
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
  {
    name: 'TableFixedHolder',
    emits: [],
    props: [
      'style',
      'noData',
      'columns',
      'flattenColumns',
      'colWidths',
      'columCount',
      'stickyOffsets',
      'fixHeader',
      'stickyTopOffset',
      'stickyBottomOffset',
      'stickyClassName',
      'className',
      'scrollX',
      'tableLayout',
      'maxContentScroll',
      'colGroup',
    ],
  },
);
const FixedHolder: typeof NativeFixedHolder = Object.assign(NativeFixedHolder, {
  props: {
    style: { type: Object, default: undefined },
    noData: { type: Boolean, default: false },
    columns: { type: Array, required: true },
    flattenColumns: { type: Array, required: true },
    colWidths: { type: Array, required: true },
    columCount: { type: Number, required: true },
    stickyOffsets: {
      type: Object,
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
});

// ═══════════════════════════ StickyScrollBar ═══════════════════════════

const StickyScrollBar = defineComponent({
  name: 'TableStickyScrollBar',
  props: {
    offsetScroll: { type: Number, default: 0 },
    container: {
      type: null as unknown as PropType<Window | HTMLElement | null>,
      default: undefined,
    },
  },
  setup(props) {
    const ctx = useTableContext();
    const barRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const barWidth = ref(0);
    const scrollLeft = ref(0);
    const barTranslation = ref('');
    const barTranslationPrefix = computed(() => (ctx.direction === 'rtl' ? 'calc(100% + ' : '-'));
    watch(
      [() => props.container, () => ctx.scrollBodyRef.value],
      ([target, body], _previous, onCleanup) => {
        if (!target || !body) {
          visible.value = false;
          return;
        }
        const update = () => {
          const { scrollWidth, clientWidth } = body;
          visible.value = scrollWidth > clientWidth && body.offsetWidth > 0;
          barWidth.value = scrollWidth ? (clientWidth / scrollWidth) * 100 : 0;
          scrollLeft.value = body.scrollLeft;
          barTranslation.value = `calc(${barTranslationPrefix.value}${(scrollLeft.value / Math.max(scrollWidth, 1)) * 100}%)`;
        };
        update();
        target.addEventListener('scroll', update, true);
        target.addEventListener('resize', update);
        onCleanup(() => {
          target.removeEventListener('scroll', update, true);
          target.removeEventListener('resize', update);
        });
      },
      { immediate: true, flush: 'post' },
    );
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

export interface EngineTableProps<RecordType extends object>
  extends Pick<
    TableProps<RecordType>,
    | 'rowClassName'
    | 'scroll'
    | 'tableLayout'
    | 'direction'
    | 'caption'
    | 'id'
    | 'showHeader'
    | 'components'
    | 'onRow'
    | 'onHeaderRow'
    | 'sticky'
    | 'rowHoverable'
  > {
  prefixCls: string;
  className?: unknown;
  style?: CSSProperties;
  classNames?: TableSemanticClassNames;
  styles?: TableSemanticStyles;
  data?: RecordType[];
  columns?: ColumnsType<RecordType>;
  rowKey?: string | GetRowKey<RecordType>;
  emptyText?: VNodeChild;
  measureRowRender?: (node: VNodeChild) => VNodeChild;
  internalHooks?: string;
  transformColumns?: (columns: ColumnsType<RecordType>) => ColumnsType<RecordType>;
  internalRefs?: { body: { current: HTMLElement | null } };
  tailor?: boolean;
  getContainerWidth?: (element: HTMLElement, width: number) => number;
  expandable?: EngineExpandableConfig<RecordType>;
  indentSize?: number;
  expandIconColumnIndex?: number;
  virtual?: boolean;
  listItemHeight?: number;
}
type EngineSlots<RecordType extends object> = Pick<
  TableSlots<RecordType>,
  'title' | 'footer' | 'summary' | 'caption' | 'bodyCell'
>;

const NativeTable = defineComponent(
  <RecordType extends object>(
    props: EngineTableProps<RecordType>,
    {
      expose,
      slots,
      emit,
    }: SetupContext<{ scroll: (event: Event) => void }, SlotsType<EngineSlots<RecordType>>>,
  ) => {
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
    const getRowKey = computed<GetRowKey<RecordType>>(() => {
      if (typeof props.rowKey === 'function') {
        return props.rowKey;
      }
      const keyName = props.rowKey ?? 'key';
      return (record) => Reflect.get(record, keyName) as string | number;
    });

    // ==================== Customize ====================
    const getComponent = (path: string[], defaultComponent: TableComponent): TableComponent => {
      const components = props.components;
      if (path[0] === 'table') return components?.table ?? defaultComponent;
      const group = path[0] === 'header' ? components?.header : components?.body;
      if (!group || typeof group === 'function') return defaultComponent;
      if (path[1] === 'row') return group.row ?? defaultComponent;
      if (path[1] === 'cell') return group.cell ?? defaultComponent;
      if (path[1] === 'wrapper') return group.wrapper ?? defaultComponent;
      if (path[1] === 'table' && 'table' in group) return group.table ?? defaultComponent;
      return defaultComponent;
    };
    const customizeScrollBody = computed(() =>
      typeof props.components?.body === 'function' ? props.components.body : undefined,
    );

    const isVirtualBody = computed(() => props.virtual && !customizeScrollBody.value);

    // ====================== Hover ======================
    const { startRow, endRow, onHover } = useHover();

    // ====================== Expand ======================
    const propsRef = computed(() => ({ expandable: props.expandable }));
    const {
      expandableConfig,
      expandableType,
      mergedExpandedKeys,
      mergedExpandIcon,
      mergedChildrenColumnName,
      onTriggerExpand,
    } = useExpand(propsRef, mergedData, getRowKey);

    // ====================== Column ======================
    const scrollX = computed(() => mergedScroll.value?.x);
    const componentWidth = ref(0);
    const colsWidths = ref(new Map<string | number, number>());
    const useInternalHooksRef = useInternalHooks;
    const columnsParams = computed(() => ({
      prefixCls: props.prefixCls,
      columns: props.columns,
      expandable:
        Boolean(expandableConfig.value.expandedRowRender) &&
        expandableConfig.value.showExpandColumn !== false,
      columnTitle: expandableConfig.value.columnTitle,
      expandedKeys: mergedExpandedKeys.value,
      getRowKey: getRowKey.value,
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
      childrenColumnName: mergedChildrenColumnName.value,
      internalHooks: props.internalHooks,
      scrollWidth:
        useInternalHooksRef.value && props.tailor && typeof scrollX.value === 'number'
          ? scrollX.value
          : null,
      clientWidth: componentWidth.value,
    }));
    const { mergedColumns, filledColumns, realScrollWidth } = useColumns(
      columnsParams,
      useInternalHooksRef.value
        ? (columns: ColumnsType<RecordType>) => props.transformColumns?.(columns) ?? columns
        : null,
    );
    const mergedScrollX = computed(() => realScrollWidth.value ?? scrollX.value);

    // ====================== Refs ======================
    const fullTableRef = ref<HTMLElement | null>(null);
    const scrollHeaderRef = ref<HTMLElement | null>(null);
    const scrollBodyRef = ref<HTMLElement | null>(null);
    const scrollBodyContainerRef = ref<HTMLElement | null>(null);
    const scrollSummaryRef = ref<HTMLElement | null>(null);
    /** virtual 时 body 由 `BodyGrid` 渲染 —— 它的 imperative handle 承载 `scrollTo`。 */
    const bodyGridRef = ref<import('./VirtualTable/BodyGrid').BodyGridExposed | null>(null);
    const currentScrollBody = computed(() =>
      isVirtualBody.value ? (bodyGridRef.value?.nativeElement ?? null) : scrollBodyRef.value,
    );
    expose({
      nativeElement: () => fullTableRef.value,
      scrollTo: (config: TableScrollToConfig) => {
        // virtual：交给 BodyGrid → VirtualList 的 scrollTo（支持 index/key/align/offset）
        if (isVirtualBody.value) {
          bodyGridRef.value?.scrollTo?.(config);
          return;
        }
        const body = currentScrollBody.value;
        if (!body) return;
        if (validNumberValue(config.top)) {
          body.scrollTo({ top: config.top });
        } else {
          const record = mergedData.value[config.index ?? 0];
          const mergedKey =
            config.key ?? (record ? getRowKey.value(record, config.index ?? 0) : undefined);
          if (mergedKey === undefined) return;
          const target = [...body.querySelectorAll<HTMLElement>('[data-row-key]')].find(
            (row) => row.getAttribute('data-row-key') === String(mergedKey),
          );
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
    const colsKeys = computed(() => getColumnsKey(filledColumns.value));
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
    const stickyInfo = useSticky(
      () => props.sticky,
      () => props.prefixCls,
      () => fullTableRef.value?.ownerDocument.defaultView ?? null,
    );

    // Scroll styles
    const scrollYStyle = computed<CSSProperties>(() => {
      if (fixHeader.value) {
        return {
          overflowY: hasData.value ? 'scroll' : 'auto',
          maxHeight:
            typeof mergedScroll.value?.y === 'number'
              ? `${mergedScroll.value.y}px`
              : mergedScroll.value?.y,
        };
      }
      if (horizonScroll.value) return { overflowY: 'hidden' };
      return {};
    });
    const scrollXStyle = computed<CSSProperties>(() =>
      horizonScroll.value ? { overflowX: 'auto' } : {},
    );
    const scrollTableStyle = computed<CSSProperties>(() => {
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

    const scrollRetries = new Set<ReturnType<typeof setTimeout>>();
    onBeforeUnmount(() => {
      for (const retry of scrollRetries) clearTimeout(retry);
      scrollRetries.clear();
    });
    const forceScroll = (sLeft: number, el: HTMLElement | null) => {
      if (!el) return;
      if (el.scrollLeft !== sLeft) {
        el.scrollLeft = sLeft;
        const retry = setTimeout(() => {
          scrollRetries.delete(retry);
          if (el.isConnected && el.scrollLeft !== sLeft) el.scrollLeft = sLeft;
        }, 0);
        scrollRetries.add(retry);
      }
    };

    const onInternalScroll = (e: { currentTarget?: HTMLElement; scrollLeft: number }) => {
      const mergedScrollLeft =
        typeof e.scrollLeft === 'number' ? e.scrollLeft : (e.currentTarget?.scrollLeft ?? 0);
      const compareTarget = e.currentTarget ?? scrollHeaderRef.value;
      if (!scrollLock.getState() || scrollLock.getState() === compareTarget) {
        scrollLock.setState(compareTarget);
        forceScroll(mergedScrollLeft, scrollHeaderRef.value);
        forceScroll(mergedScrollLeft, currentScrollBody.value);
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
      emit('scroll', e);
    };
    const triggerOnScroll = () => {
      // 🚨 virtual 时 body 是 `BodyGrid`（滚动容器在它内部）—— `scrollBodyRef`
      //    不会被赋值 ⇒ 若只认它，横向阴影会**恒为 false**（rc 是把 ref 传进
      //    customizeScrollBody 的）。这里按 rc 的语义取「真正的滚动容器」
      //    （dom-probe 全变体扫描 table/virtual 抓出：少了 `-fix-end-shadow-show`）。
      const bodyEl = currentScrollBody.value;
      if (horizonScroll.value && bodyEl) {
        onInternalScroll({ currentTarget: bodyEl, scrollLeft: bodyEl.scrollLeft });
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

    useResizeObserver({
      target: fullTableRef,
      disabled: () => !horizonScroll.value && !stickyInfo.value.isSticky,
      onResize: (info) => onFullTableResize(info.offsetWidth),
    });

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
    });

    watch(
      () => (props.virtual ? (bodyGridRef.value?.nativeElement ?? null) : scrollBodyRef.value),
      (body) => {
        if (props.internalRefs) props.internalRefs.body.current = body;
      },
      { flush: 'post', immediate: true },
    );
    onBeforeUnmount(() => {
      if (props.internalRefs) props.internalRefs.body.current = null;
    });

    // ====================== Render helpers ======================
    const mergedTableLayout = computed<'auto' | 'fixed'>(() => {
      if (props.tableLayout) return props.tableLayout;
      if (fixColumn.value) {
        return mergedScrollX.value === 'max-content' ? 'auto' : 'fixed';
      }
      if (
        fixHeader.value ||
        stickyInfo.value.isSticky ||
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
      return props.emptyText ?? 'No Data';
    });

    const fixedInfoList = useFixedInfo(filledColumns, stickyOffsets);

    // 滚动条尺寸（rc getTargetScrollBarSize：fixHeader 时表头垫宽）
    const scrollbarSize = ref(0);
    onMounted(() => {
      const el = currentScrollBody.value;
      if (!el) return;
      const document = el.ownerDocument;
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll;';
      document.body.appendChild(probe);
      const width = probe.offsetWidth - probe.clientWidth;
      document.body.removeChild(probe);
      scrollbarSize.value = width || 0;
    });

    // ====================== Context ======================
    const ctxValue: TableContextValue<RecordType> = {
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
        return stickyInfo.value.isSticky;
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
        return expandableConfig.value.expandRowByClick ?? false;
      },
      get expandedRowRender() {
        return expandableConfig.value.expandedRowRender;
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
        return mergedChildrenColumnName.value;
      },
      get rowHoverable() {
        return props.rowHoverable ?? true;
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
      onInternalScroll,
      // 供 FixedHolder/StickyScrollBar 消费
      get scrollHeaderRef() {
        return scrollHeaderRef;
      },
      get scrollBodyRef() {
        return currentScrollBody;
      },
      get scrollSummaryRef() {
        return scrollSummaryRef;
      },
    };
    provide(tableContextKey, ctxValue);

    // ====================== Render ======================
    const bodyColGroup = () =>
      h(ColGroup, {
        colWidths: (filledColumns.value as { width?: number | string }[]).map(({ width }) => width),
        columns: filledColumns.value,
      });
    const captionElement = () =>
      slots.caption || props.caption != null
        ? h('caption', { class: `${props.prefixCls}-caption` }, [
            slots.caption ? slots.caption({ data: mergedData.value }) : props.caption,
          ])
        : null;

    const bodyTable = () =>
      h(Body<RecordType>, {
        data: mergedData.value,
        measureColumnWidth: fixHeader.value || horizonScroll.value || stickyInfo.value.isSticky,
        bodyCell: slots.bodyCell,
      });

    const renderHeader = (
      headerStickyOffsets: { start: number[]; end: number[]; widths: number[] },
      columns: ColumnsType<RecordType>,
      flattenColumns: ColumnsType<RecordType>,
    ) =>
      h(Header<RecordType>, {
        stickyOffsets: headerStickyOffsets,
        columns,
        flattenColumns,
        onHeaderRow: headerProps.value.onHeaderRow,
      });

    return () => {
      const classNames = props.classNames;
      const styles = props.styles;

      const summaryContent = slots.summary?.({ data: mergedData.value });
      const summaryNode =
        Array.isArray(summaryContent) && summaryContent.length === 1
          ? summaryContent[0]
          : summaryContent;
      const fixFooter =
        fixHeader.value || stickyInfo.value.isSticky ? summaryFixed(summaryContent) : false;
      let groupTableNode: VNodeChild;
      if (fixHeader.value || stickyInfo.value.isSticky || customizeScrollBody.value) {
        // >>>>>> Fixed Header
        // virtual：body 换成 BodyGrid（rc `customizeScrollBody` 通道的等价物）
        const bodyContent = customizeScrollBody.value
          ? customizeScrollBody.value(mergedData.value, {
              scrollbarSize: scrollbarSize.value,
              ref: (instance) => {
                const root: unknown = instance && '$el' in instance ? instance.$el : instance;
                const element = getElement(root);
                scrollBodyRef.value = isHTMLElement(element) ? element : null;
              },
              onScroll: onBodyScroll,
            })
          : props.virtual
            ? h(BodyGrid<RecordType>, {
                ref: bodyGridRef,
                data: mergedData.value,
                height: typeof mergedScroll.value?.y === 'number' ? mergedScroll.value.y : 500,
                scrollWidth: typeof mergedScrollX.value === 'number' ? mergedScrollX.value : 1,
                listItemHeight: props.listItemHeight,
                onInternalScroll,
                onScroll: onBodyScroll,
                bodyCell: slots.bodyCell,
              })
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
                    getComponent(['table'], 'table'),
                    {
                      style: { ...scrollTableStyle.value, tableLayout: mergedTableLayout.value },
                    },
                    [
                      captionElement(),
                      bodyColGroup(),
                      bodyTable(),
                      !fixFooter && slots.summary
                        ? h(
                            Footer,
                            {
                              stickyOffsets: stickyOffsets.value,
                              flattenColumns: filledColumns.value,
                            },
                            { default: () => summaryNode },
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
          columns: mergedColumns.value,
          flattenColumns: filledColumns.value,
          direction: props.direction,
          stickyClassName: stickyInfo.value.stickyClassName,
          scrollX: mergedScrollX.value,
          tableLayout: mergedTableLayout.value,
          colGroup: bodyColGroup(),
        };
        groupTableNode = [
          (props.showHeader !== false || fixFooter === 'top') &&
            h(
              FixedHolder<RecordType>,
              {
                ...fixedHolderProps,
                stickyTopOffset: stickyInfo.value.offsetHeader,
                class: `${props.prefixCls}-header`,
                key: 'header',
                ref: (instance: Element | ComponentPublicInstance | null) => {
                  const element = getElement(instance);
                  scrollHeaderRef.value = isHTMLElement(element) ? element : null;
                },
              },
              {
                default: (slotProps: {
                  stickyOffsets: import('./utils/fixUtil').StickyOffsets;
                  columns: ColumnsType<RecordType>;
                  flattenColumns: ColumnsType<RecordType>;
                }) => [
                  props.showHeader !== false
                    ? renderHeader(
                        slotProps.stickyOffsets,
                        slotProps.columns,
                        slotProps.flattenColumns,
                      )
                    : null,
                  fixFooter === 'top'
                    ? h(
                        Footer,
                        {
                          stickyOffsets: slotProps.stickyOffsets,
                          flattenColumns: slotProps.flattenColumns,
                        },
                        { default: () => summaryNode },
                      )
                    : null,
                ],
              },
            ),
          bodyContent,
          fixFooter && fixFooter !== 'top'
            ? h(
                FixedHolder<RecordType>,
                {
                  ...fixedHolderProps,
                  stickyBottomOffset: stickyInfo.value.offsetSummary,
                  class: `${props.prefixCls}-summary`,
                  key: 'summary',
                  ref: (instance: Element | ComponentPublicInstance | null) => {
                    const element = getElement(instance);
                    scrollSummaryRef.value = isHTMLElement(element) ? element : null;
                  },
                },
                {
                  default: (slotProps: {
                    stickyOffsets: import('./utils/fixUtil').StickyOffsets;
                    columns: ColumnsType<RecordType>;
                    flattenColumns: ColumnsType<RecordType>;
                  }) =>
                    h(
                      Footer,
                      {
                        stickyOffsets: slotProps.stickyOffsets,
                        flattenColumns: slotProps.flattenColumns,
                      },
                      { default: () => summaryNode },
                    ),
                },
              )
            : null,
          stickyInfo.value.isSticky && currentScrollBody.value
            ? h(StickyScrollBar, {
                offsetScroll: stickyInfo.value.offsetScroll,
                container: stickyInfo.value.container,
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
              ...(styles?.content ?? {}),
            },
            class: [`${props.prefixCls}-content`, classNames?.content ?? undefined],
            onScroll: onBodyScroll,
            ref: scrollBodyRef,
          },
          [
            renderElement(
              getComponent(['table'], 'table'),
              {
                style: { ...scrollTableStyle.value, tableLayout: mergedTableLayout.value },
              },
              [
                captionElement(),
                bodyColGroup(),
                props.showHeader !== false
                  ? renderHeader(stickyOffsets.value, mergedColumns.value, filledColumns.value)
                  : null,
                bodyTable(),
                slots.summary
                  ? h(
                      Footer,
                      {
                        stickyOffsets: stickyOffsets.value,
                        flattenColumns: filledColumns.value,
                      },
                      { default: () => summaryNode },
                    )
                  : null,
              ],
            ),
          ],
        );
      }

      const tableStyle: CSSProperties = { ...props.style };
      if (stickyInfo.value.isSticky) {
        tableStyle['--columns-count'] = filledColumns.value.length;
      }

      const titleNode = slots.title
        ? h(
            Panel,
            { class: [`${props.prefixCls}-title`, classNames?.title], style: styles?.title },
            { default: () => slots.title?.({ data: mergedData.value }) },
          )
        : null;
      const footerNode = slots.footer
        ? h(
            Panel,
            { class: [`${props.prefixCls}-footer`, classNames?.footer], style: styles?.footer },
            { default: () => slots.footer?.({ data: mergedData.value }) },
          )
        : null;

      const fullTable = h(
        'div',
        {
          class: [
            // ⚠️ **不要再手动放 `attrs.class`** —— 本组件没关 `inheritAttrs`，Vue 会
            //    自动把调用方的 class 合并到根元素；手动再放一遍 ⇒ 状态类
            //    （`-bordered` / `-small` / `-empty`，来自 Table.ts 的 tableClass）
            //    **出现两次**（dom-probe 全变体扫描抓出；像素不受影响，L6 抓不到）。
            props.prefixCls,
            {
              [`${props.prefixCls}-rtl`]: props.direction === 'rtl',
              [`${props.prefixCls}-fix-start-shadow`]: horizonScroll.value,
              [`${props.prefixCls}-fix-end-shadow`]: horizonScroll.value,
              [`${props.prefixCls}-fix-start-shadow-show`]:
                horizonScroll.value && shadowStart.value,
              [`${props.prefixCls}-fix-end-shadow-show`]: horizonScroll.value && shadowEnd.value,
              // 🚨 rc 逐字（Table.js:586）：判的是**原始 prop** `tableLayout`，
              //    不是内部合并后的 `mergedTableLayout` —— antd 侧根本不传这个 prop
              //    ⇒ 有横向滚动也**不**挂 `-layout-fixed`（我们此前多挂，扫描抓出）。
              [`${props.prefixCls}-layout-fixed`]: props.tableLayout === 'fixed',
              // rc `VirtualTable/index.js:71`：`clsx(className, `${prefixCls}-virtual`)`
              [`${props.prefixCls}-virtual`]: props.virtual,
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
        },
        [
          titleNode,
          h(
            'div',
            {
              ref: scrollBodyContainerRef,
              class: [`${props.prefixCls}-container`, classNames?.section ?? undefined],
              style: styles?.section,
            },
            [groupTableNode],
          ),
          footerNode,
        ],
      );
      return fullTable;
    };
  },
  {
    name: 'RcTable',
    emits: { scroll: (_event: Event) => true },
    props: [
      'prefixCls',
      'className',
      'rowClassName',
      'style',
      'classNames',
      'styles',
      'data',
      'columns',
      'rowKey',
      'scroll',
      'tableLayout',
      'direction',
      'caption',
      'id',
      'showHeader',
      'components',
      'emptyText',
      'onRow',
      'onHeaderRow',
      'measureRowRender',
      'internalHooks',
      'transformColumns',
      'internalRefs',
      'tailor',
      'getContainerWidth',
      'sticky',
      'rowHoverable',
      'expandable',
      'indentSize',
      'expandIconColumnIndex',
      'virtual',
      'listItemHeight',
    ],
  },
);
const Table: typeof NativeTable = Object.assign(NativeTable, {
  props: {
    prefixCls: { type: String, default: DEFAULT_PREFIX },
    className: { type: null, default: undefined },
    rowClassName: { type: null, default: undefined },
    style: { type: Object, default: undefined },
    classNames: { type: Object, default: undefined },
    styles: { type: Object, default: undefined },
    data: { type: Array, default: undefined },
    columns: { type: Array, default: undefined },
    rowKey: { type: [String, Function], default: 'key' },
    scroll: {
      type: Object,
      default: undefined,
    },
    tableLayout: { type: String, default: undefined },
    direction: { type: String, default: undefined },
    caption: { type: null, default: undefined },
    id: { type: String, default: undefined },
    showHeader: { type: Boolean, default: undefined },
    components: { type: Object, default: undefined },
    emptyText: { type: null, default: undefined },
    onRow: { type: Function, default: undefined },
    onHeaderRow: { type: Function, default: undefined },
    measureRowRender: { type: Function, default: undefined },
    internalHooks: { type: String, default: undefined },
    transformColumns: { type: Function, default: undefined },
    internalRefs: { type: Object, default: undefined },
    tailor: { type: Boolean, default: false },
    getContainerWidth: { type: Function, default: undefined },
    sticky: {
      type: [Boolean, Object],
      default: undefined,
    },
    rowHoverable: { type: Boolean, default: true },
    expandable: { type: Object, default: undefined },
    indentSize: { type: Number, default: undefined },
    expandIconColumnIndex: { type: Number, default: undefined },
    virtual: { type: Boolean, default: false },
    listItemHeight: { type: Number, default: undefined },
  },
});

export default Table;
