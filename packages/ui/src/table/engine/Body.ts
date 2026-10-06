/**
 * rc `Body/{index,BodyRow,ExpandedRow,MeasureRow,MeasureCell}.js`（~450 行）—— Vue 移植。
 *
 * BodyRow 是 T0.2 PoC 硬规则的落点：**行级 provide**（`rowContextKey`）——
 * 用 `reactive({ get hovering() {...} })` 的 getter 对象：Cell 读 `rowCtx.hovering`
 * 时才求值，响应式依赖落在读的组件上 ⇒ 一次 hover 只重渲命中的行（PoC 5/500）。
 */

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
} from 'vue';
import type { ColumnsType, ColumnType, ExpandableConfig } from '../interface';
import Cell from './Cell';
import { type RowContextValue, rowContextKey, useTableContext } from './context';
import { type FlattenRecord, flattenRecords } from './hooks/use-table';
import { computedExpandedClassName } from './utils/expandUtil';
import type { CellFixedInfo } from './utils/fixUtil';
import { getColumnsKey } from './utils/valueUtil';

// ═══════════════════════════ getCellProps（导出供测试） ═══════════════════════════

export interface CellPropsResult {
  key: string | number;
  fixedInfo: CellFixedInfo | undefined;
  appendCellNode: unknown;
  additionalCellProps: Record<string, unknown>;
  originRowSpan: number | undefined;
}

/** rc `Body/BodyRow.js` 的 `getCellProps` —— 逐字移植（测试直接对拍）。 */
export function getCellProps(
  rowInfo: {
    record: Record<string, unknown> | undefined;
    prefixCls: string;
    columnsKey: (string | number)[];
    fixedInfoList: CellFixedInfo[];
    expandIconColumnIndex: number;
    nestExpandable: boolean;
    indentSize: number;
    expandIcon: ExpandableConfig['expandIcon'];
    expanded: boolean;
    hasNestChildren: boolean;
    onTriggerExpand: (record: Record<string, unknown>, event?: Event) => void;
    expandable: boolean;
    expandedKeys: Set<string | number>;
  },
  column: ColumnType,
  colIndex: number,
  indent: number,
  index: number,
  rowKeys: (string | number)[] = [],
  expandedRowOffset = 0,
): CellPropsResult {
  const {
    record,
    prefixCls,
    columnsKey,
    fixedInfoList,
    expandIconColumnIndex,
    nestExpandable,
    indentSize,
    expandIcon,
    expanded,
    hasNestChildren,
    onTriggerExpand,
    expandable,
    expandedKeys,
  } = rowInfo;
  const key = columnsKey[colIndex] ?? '';
  const fixedInfo = fixedInfoList?.[colIndex];

  // ============= nest 展开列的缩进 + 图标 =============
  let appendCellNode: unknown;
  if (colIndex === (expandIconColumnIndex || 0) && nestExpandable) {
    appendCellNode = [
      h('span', {
        style: { paddingLeft: `${indentSize * indent}px` },
        class: `${prefixCls}-row-indent indent-level-${indent}`,
      }),
      expandIcon?.({
        prefixCls,
        expanded,
        expandable: hasNestChildren,
        record: record as never,
        onExpand: onTriggerExpand as never,
      }),
    ];
  }

  const additionalCellProps: Record<string, unknown> = {
    ...(column.onCell?.(record as never, index) as Record<string, unknown>),
  };
  let originRowSpan: number | undefined;

  // 展开行 + rowSpan 联动（expandedRowOffset 场景）
  if (expandedRowOffset) {
    const { rowSpan = 1 } = additionalCellProps as { rowSpan?: number };
    if (expandable && rowSpan && colIndex < expandedRowOffset) {
      originRowSpan = rowSpan;
      let currentRowSpan = rowSpan;
      for (let i = index; i < index + rowSpan; i += 1) {
        const rowKey = rowKeys[i];
        if (rowKey !== undefined && expandedKeys?.has(rowKey)) {
          currentRowSpan += 1;
        }
      }
      additionalCellProps.rowSpan = currentRowSpan;
    }
  }

  return { key, fixedInfo, appendCellNode, additionalCellProps, originRowSpan };
}

// ═══════════════════════════ ExpandedRow ═══════════════════════════

const ExpandedRow = defineComponent({
  name: 'TableExpandedRow',
  props: {
    prefixCls: { type: String, required: true },
    component: { type: String, default: 'tr' },
    cellComponent: { type: String, default: 'td' },
    expanded: { type: Boolean, default: false },
    colSpan: { type: Number, required: true },
    isEmpty: { type: Boolean, default: false },
    stickyOffset: { type: Number, default: 0 },
  },
  setup(props, { attrs, slots }) {
    const ctx = useTableContext();
    const contentNode = computed(() => {
      let node: unknown = slots.default?.();
      const wrapIt = props.isEmpty ? ctx.horizonScroll && ctx.componentWidth : ctx.fixColumn;
      if (wrapIt) {
        node = h(
          'div',
          {
            style: {
              width: `${ctx.componentWidth - props.stickyOffset - (ctx.fixHeader && !props.isEmpty ? ctx.scrollbarSize : 0)}px`,
              position: 'sticky',
              left: `${props.stickyOffset}px`,
              overflow: 'hidden',
            },
            class: `${props.prefixCls}-expanded-row-fixed`,
          },
          node as never,
        );
      }
      return node;
    });
    return () =>
      h(
        props.component,
        {
          class: (attrs as { class?: unknown }).class,
          style: { display: props.expanded ? undefined : 'none' },
        },
        [
          h(
            Cell,
            {
              component: props.cellComponent,
              prefixCls: props.prefixCls,
              colSpan: props.colSpan,
            },
            { default: () => contentNode.value },
          ),
        ],
      );
  },
});

// ═══════════════════════════ BodyRow ═══════════════════════════

const BodyRow = defineComponent({
  name: 'TableBodyRow',
  props: {
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    record: { type: Object as PropType<Record<string, unknown>>, required: true },
    index: { type: Number, required: true },
    renderIndex: { type: Number, required: true },
    rowKey: { type: [String, Number] as PropType<string | number>, required: true },
    rowKeys: { type: Array as PropType<(string | number)[]>, required: true },
    indent: { type: Number, default: 0 },
    rowComponent: { type: String, default: 'tr' },
    cellComponent: { type: String, default: 'td' },
    scopeCellComponent: { type: String, default: 'th' },
    expandedRowInfo: {
      type: Object as PropType<{ offset: number; colSpan: number; sticky: number }>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const ctx = useTableContext();
    const { record, index, renderIndex, rowKey, rowKeys, indent } = props;

    // ======================= 行级信息（useRowInfo） =======================
    // ⚠️ ctx（provide 对象）的 getter 已解包 .value —— 这里不能再 .value（undefined）
    const nestExpandable = computed(() => ctx.expandableType === 'nest');
    const rowSupportExpand = computed(
      () =>
        ctx.expandableType === 'row' &&
        (!ctx.rowExpandable || (ctx.rowExpandable as (r: never) => boolean)(record as never)),
    );
    const mergedExpandable = computed(() => rowSupportExpand.value || nestExpandable.value);
    const expanded = computed(() => Boolean(ctx.expandedKeys?.has(rowKey)));
    const hasNestChildren = computed(() =>
      Boolean((record as Record<string, unknown>)?.[ctx.childrenColumnName]),
    );

    // ========================= onRow =========================
    const rowProps = computed<Record<string, unknown>>(() => {
      const base = (ctx.onRow?.(record as never, index) as Record<string, unknown>) ?? {};
      const computeRowClassName =
        typeof ctx.rowClassName === 'string'
          ? ctx.rowClassName
          : typeof ctx.rowClassName === 'function'
            ? (ctx.rowClassName as (r: never, i: number, ind: number) => string)(
                record as never,
                index,
                indent,
              )
            : undefined;
      const onClick = (event: MouseEvent) => {
        if (ctx.expandRowByClick && mergedExpandable.value) {
          ctx.onTriggerExpand(record as never, event);
        }
        (base.onClick as ((e: MouseEvent) => void) | undefined)?.(event);
      };
      return {
        ...base,
        class: [computeRowClassName, base.className as string | undefined],
        onClick,
      };
    });

    const columnsKey = computed(() => getColumnsKey(ctx.flattenColumns as never));
    const expandedClsName = computedExpandedClassName(
      ctx.expandedRowClassName as never,
      record as never,
      index,
      indent,
    );

    // hover 联动的 rowSpan 基准（rowSpan>1 的单元格取其 originRowSpan；
    // 常规单行单元格 = 1。基础场景 rc 用 mergedHoverRowSpan = legacy ?? origin ?? rowSpan，
    // 这里 Cell 侧已实现三段回退；行级只按单行判定（与 rc useHoverState(index, rowSpan) 同判，
    // rowSpan 在多行场景由 Cell 以 props 传入修正）。
    // ==================== 行级 provide（T0.2 硬规则） ====================
    const rowCtx = reactive({
      get record() {
        return record;
      },
      get renderIndex() {
        return renderIndex;
      },
      get index() {
        return index;
      },
      get indent() {
        return indent;
      },
      get rowKey() {
        return rowKey;
      },
      get rowKeys() {
        return rowKeys;
      },
      get columnsKey() {
        return columnsKey.value;
      },
      get expanded() {
        return expanded.value;
      },
      get hasNestChildren() {
        return hasNestChildren.value;
      },
      get nestExpandable() {
        return nestExpandable.value;
      },
      get rowSupportExpand() {
        return rowSupportExpand.value;
      },
      get expandable() {
        return mergedExpandable.value;
      },
      get rowProps() {
        return rowProps.value;
      },
      get expandedRowInfo() {
        return props.expandedRowInfo;
      },
      get expandIconColumnIndex() {
        return ctx.expandIconColumnIndex;
      },
      get indentSize() {
        return ctx.indentSize;
      },
      get expandIcon() {
        return ctx.expandIcon;
      },
      get fixedInfoList() {
        return ctx.fixedInfoList;
      },
      get expandedKeys() {
        return ctx.expandedKeys;
      },
      get onTriggerExpand() {
        return ctx.onTriggerExpand;
      },
      get prefixCls() {
        return ctx.prefixCls;
      },
      get hovering() {
        // inHoverRange（rc useHoverState）：本行 span=1 的判定；
        // 多行 rowSpan 场景 Cell 会以 mergedHoverRowSpan 修正 —— 由 Cell 传入
        // mergedHoverRowSpan 计算，这里给不出 ⇒ 用扩展字段承载。
        const start = ctx.hoverStartRow;
        const end = ctx.hoverEndRow;
        return index <= end && index >= start;
      },
      get hoveringBySpan() {
        return (rowSpan: number) => {
          const start = ctx.hoverStartRow;
          const end = ctx.hoverEndRow;
          const cellEndRow = index + (rowSpan || 1) - 1;
          return index <= end && cellEndRow >= start;
        };
      },
    } as unknown as RowContextValue);
    provide(rowContextKey, rowCtx);

    // ======================== Base row ========================
    const baseRowNode = () => {
      const bodyCls =
        (ctx.classNames as never as { body?: Record<string, string> } | undefined)?.body ?? {};
      const bodyStyles =
        (ctx.styles as never as { body?: Record<string, Record<string, unknown>> } | undefined)
          ?.body ?? {};
      return h(
        props.rowComponent,
        {
          ...(rowProps.value ?? {}),
          'data-row-key': rowKey,
          class: [
            (attrs as { class?: unknown }).class,
            `${ctx.prefixCls}-row`,
            `${ctx.prefixCls}-row-level-${indent}`,
            ...(((rowProps.value?.class as unknown[]) ?? []) as unknown[]),
            bodyCls.row,
            { [expandedClsName as string]: indent >= 1 },
          ],
          style: {
            ...props.style,
            ...((rowProps.value?.style as Record<string, unknown>) ?? {}),
            ...(bodyStyles.row ?? {}),
          },
        },
        (ctx.flattenColumns as ColumnType[]).map((column, colIndex) => {
          const { render, dataIndex, className: columnClassName } = column;
          const { key, fixedInfo, appendCellNode, additionalCellProps, originRowSpan } =
            getCellProps(
              {
                record,
                prefixCls: ctx.prefixCls,
                columnsKey: columnsKey.value,
                fixedInfoList: ctx.fixedInfoList as CellFixedInfo[],
                expandIconColumnIndex: ctx.expandIconColumnIndex,
                nestExpandable: nestExpandable.value,
                indentSize: ctx.indentSize,
                expandIcon: ctx.expandIcon,
                expanded: expanded.value,
                hasNestChildren: hasNestChildren.value,
                onTriggerExpand: ctx.onTriggerExpand as never,
                expandable: mergedExpandable.value,
                expandedKeys: ctx.expandedKeys as Set<string | number>,
              },
              column,
              colIndex,
              indent,
              index,
              rowKeys,
              props.expandedRowInfo?.offset ?? 0,
            );
          return h(Cell, {
            class: [columnClassName, bodyCls.cell],
            style: bodyStyles.cell,
            ellipsis: column.ellipsis,
            align: column.align,
            scope: column.rowScope,
            component: column.rowScope ? props.scopeCellComponent : props.cellComponent,
            prefixCls: ctx.prefixCls,
            key: String(key),
            record,
            index,
            renderIndex,
            dataIndex,
            render: render as never,
            shouldCellUpdate: column.shouldCellUpdate,
            ...((fixedInfo ?? {}) as Record<string, unknown>),
            appendNode: appendCellNode,
            additionalProps: additionalCellProps,
            originRowSpan,
          });
        }),
      );
    };

    // ======================== Expand row ========================
    const expandedRef = ref(false);
    expandedRef.value = expandedRef.value || expanded.value;
    const expandRowNode = computed(() => {
      if (
        rowSupportExpand.value &&
        (ctx.forceRender || expandedRef.value || expanded.value) &&
        ctx.expandedRowRender
      ) {
        const expandContent = (
          ctx.expandedRowRender as unknown as (
            r: never,
            i: number,
            ind: number,
            exp: boolean,
          ) => unknown
        )(record as never, index, indent + 1, expanded.value);
        const _bodyCls =
          (ctx.classNames as never as { body?: Record<string, string> } | undefined)?.body ?? {};
        return h(
          ExpandedRow,
          {
            expanded: expanded.value,
            class: [
              `${ctx.prefixCls}-expanded-row`,
              `${ctx.prefixCls}-expanded-row-level-${indent + 1}`,
              expandedClsName,
            ].filter(Boolean),
            prefixCls: ctx.prefixCls,
            component: props.rowComponent,
            cellComponent: props.cellComponent,
            colSpan: props.expandedRowInfo
              ? props.expandedRowInfo.colSpan
              : ctx.flattenColumns.length,
            isEmpty: false,
            stickyOffset: props.expandedRowInfo?.sticky ?? 0,
          },
          { default: () => expandContent },
        );
      }
      return null;
    });

    return () => [baseRowNode(), expandRowNode.value];
  },
});

// ═══════════════════════════ MeasureCell ═══════════════════════════

const MeasureCell = defineComponent({
  name: 'TableMeasureCell',
  props: {
    columnKey: {
      type: [String, Number] as PropType<string | number>,
      required: true,
    },
    onColumnResize: {
      type: Function as PropType<(k: string | number, w: number) => void>,
      required: true,
    },
    title: { type: null, default: undefined },
  },
  setup(props) {
    const cellRef = ref<HTMLElement | null>(null);
    onMounted(() => {
      if (cellRef.value) {
        props.onColumnResize(props.columnKey, cellRef.value.offsetWidth);
      }
    });
    return () =>
      h(
        'td',
        {
          ref: cellRef,
          'data-measure-key': String(props.columnKey),
          style: {
            paddingTop: 0,
            paddingBottom: 0,
            borderTop: 0,
            borderBottom: 0,
            height: 0,
          },
        },
        [
          h(
            'div',
            { style: { height: 0, overflow: 'hidden', fontWeight: 'bold' } },
            props.title || '\u00a0',
          ),
        ],
      );
  },
});

// ═══════════════════════════ MeasureRow ═══════════════════════════

const MeasureRow = defineComponent({
  name: 'TableMeasureRow',
  props: {
    prefixCls: { type: String, required: true },
    columnsKey: { type: Array as PropType<(string | number)[]>, required: true },
    onColumnResize: {
      type: Function as PropType<(k: string | number, w: number) => void>,
      required: true,
    },
    columns: { type: Array as PropType<ColumnsType>, required: true },
  },
  setup(props) {
    const ctx = useTableContext();
    const rowRef = ref<HTMLElement | null>(null);
    // ResizeObserver 兜底重测（rc 用 ResizeObserver.Collection 的批量回调）
    let observer: ResizeObserver | undefined;
    const remeasure = () => {
      if (rowRef.value && rowRef.value.offsetParent !== null) {
        props.columnsKey.forEach((columnKey) => {
          const cell = rowRef.value?.querySelector<HTMLElement>(
            `[data-measure-key="${String(columnKey)}"]`,
          );
          if (cell) props.onColumnResize(columnKey, cell.offsetWidth);
        });
      }
    };
    onMounted(() => {
      if (typeof ResizeObserver !== 'undefined' && rowRef.value) {
        observer = new ResizeObserver(remeasure);
        observer.observe(rowRef.value);
      }
    });
    onBeforeUnmount(() => observer?.disconnect());
    return () => {
      const measureRow = h(
        'tr',
        {
          'aria-hidden': 'true',
          class: `${props.prefixCls}-measure-row`,
          style: { height: 0 },
          ref: rowRef,
        },
        props.columnsKey.map((columnKey) => {
          const column = props.columns.find((col) => col.key === columnKey);
          return h(MeasureCell, {
            key: String(columnKey),
            columnKey,
            onColumnResize: props.onColumnResize,
            title: column?.title as never,
          });
        }),
      );
      return typeof ctx.measureRowRender === 'function'
        ? (ctx.measureRowRender as (n: unknown) => unknown)(measureRow)
        : measureRow;
    };
  },
});

// ═══════════════════════════ Body ═══════════════════════════

const Body = defineComponent({
  name: 'TableBody',
  props: {
    data: { type: Array as PropType<Record<string, unknown>[]>, required: true },
    measureColumnWidth: { type: Boolean, default: false },
  },
  setup(props) {
    const ctx = useTableContext();

    const flattenData = computed<FlattenRecord<Record<string, unknown>>[]>(() =>
      flattenRecords(props.data, ctx.childrenColumnName, ctx.expandedKeys, ctx.getRowKey as never),
    );
    const rowKeys = computed(() => flattenData.value.map((item) => item.rowKey));

    const expandedRowInfo = computed(() => {
      const expandedRowOffset = ctx.expandedRowOffset ?? 0;
      const expandedColSpan = ctx.flattenColumns.length - expandedRowOffset;
      let expandedStickyStart = 0;
      for (let i = 0; i < expandedRowOffset; i += 1) {
        expandedStickyStart += ctx.colWidths[i] || 0;
      }
      return { offset: expandedRowOffset, colSpan: expandedColSpan, sticky: expandedStickyStart };
    });

    const columnsKey = computed(() => getColumnsKey(ctx.flattenColumns as never));

    return () => {
      const bodyCls =
        (ctx.classNames as never as { body?: Record<string, string> } | undefined)?.body ?? {};
      const bodyStyles =
        (ctx.styles as never as { body?: Record<string, Record<string, unknown>> } | undefined)
          ?.body ?? {};
      const rows = props.data.length
        ? flattenData.value.map((item, idx) =>
            h(BodyRow, {
              key: String(item.rowKey),
              classNames: bodyCls,
              styles: bodyStyles,
              rowKey: item.rowKey,
              rowKeys: rowKeys.value,
              record: item.record as Record<string, unknown>,
              index: idx,
              renderIndex: item.index,
              indent: item.indent,
              expandedRowInfo: expandedRowInfo.value,
            }),
          )
        : h(
            ExpandedRow,
            {
              expanded: true,
              class: `${ctx.prefixCls}-placeholder`,
              prefixCls: ctx.prefixCls,
              component: 'tr',
              cellComponent: 'td',
              colSpan: ctx.flattenColumns.length,
              isEmpty: true,
            },
            { default: () => ctx.emptyNode },
          );
      return h(
        'tbody',
        {
          style: bodyStyles.wrapper,
          class: [`${ctx.prefixCls}-tbody`, bodyCls.wrapper],
        },
        [
          props.measureColumnWidth &&
            h(MeasureRow, {
              prefixCls: ctx.prefixCls,
              columnsKey: columnsKey.value,
              onColumnResize: ctx.onColumnResize,
              columns: ctx.flattenColumns as ColumnsType,
            }),
          ...(Array.isArray(rows) ? rows : [rows]),
        ],
      );
    };
  },
});

export default Body;
