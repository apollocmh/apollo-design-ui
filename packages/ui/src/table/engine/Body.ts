import type { EngineExpandableConfig } from './interface';
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
  mergeProps,
  onBeforeUnmount,
  onMounted,
  type PropType,
  provide,
  ref,
  type SetupContext,
  type StyleValue,
  type VNodeChild,
  watch,
} from 'vue';
import { getChildren } from '../data';
import type { ColumnType, TableComponent, TableSlots } from '../interface';
import Cell from './Cell';
import { type RowContextValue, rowContextKey, useTableContext } from './context';
import { renderElement } from './element';
import { type FlattenRecord, flattenRecords } from './hooks/use-table';
import { computedExpandedClassName } from './utils/expandUtil';
import type { CellFixedInfo } from './utils/fixUtil';
import { getColumnsKey } from './utils/valueUtil';

// ═══════════════════════════ getCellProps（导出供测试） ═══════════════════════════

export interface CellPropsResult {
  key: string | number;
  fixedInfo: CellFixedInfo | undefined;
  appendCellNode: VNodeChild;
  additionalCellProps: Record<string, unknown>;
  originRowSpan: number | undefined;
}

/** rc `Body/BodyRow.js` 的 `getCellProps` —— 逐字移植（测试直接对拍）。 */
export function getCellProps<RecordType extends object>(
  rowInfo: {
    record: RecordType;
    prefixCls: string;
    columnsKey: (string | number)[];
    fixedInfoList: CellFixedInfo[];
    expandIconColumnIndex: number;
    nestExpandable: boolean;
    indentSize: number;
    expandIcon: EngineExpandableConfig<RecordType>['expandIcon'];
    expanded: boolean;
    hasNestChildren: boolean;
    onTriggerExpand: (record: RecordType, event?: Event) => void;
    expandable: boolean;
    expandedKeys: Set<string | number>;
  },
  column: ColumnType<RecordType>,
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
  let appendCellNode: VNodeChild;
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
        record,
        onExpand: onTriggerExpand,
      }),
    ];
  }

  const additionalCellProps: Record<string, unknown> = {
    ...column.onCell?.(record, index),
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
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    component: { type: [String, Object, Function] as PropType<TableComponent>, default: 'tr' },
    cellComponent: { type: [String, Object, Function] as PropType<TableComponent>, default: 'td' },
    expanded: { type: Boolean, default: false },
    colSpan: { type: Number, required: true },
    isEmpty: { type: Boolean, default: false },
    stickyOffset: { type: Number, default: 0 },
  },
  setup(props, { attrs, slots }) {
    const ctx = useTableContext();
    const contentNode = () => {
      let node: VNodeChild = slots.default?.();
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
          [node],
        );
      }
      return node;
    };
    return () =>
      renderElement(
        props.component,
        {
          ...attrs,
          style: [attrs.style, { display: props.expanded ? undefined : 'none' }],
        },
        [
          h(
            Cell,
            {
              component: props.cellComponent,
              prefixCls: props.prefixCls,
              colSpan: props.colSpan,
            },
            { default: () => contentNode() },
          ),
        ],
      );
  },
});

// ═══════════════════════════ BodyRow ═══════════════════════════

// ═══════════════════════════ BodyRow ═══════════════════════════
interface BodyRowProps<RecordType extends object> {
  style?: StyleValue;
  record: RecordType;
  bodyCell?: TableSlots<RecordType>['bodyCell'];
  index: number;
  renderIndex: number;
  rowKey: string | number;
  rowKeys: (string | number)[];
  indent: number;
  expandedRowInfo?: { offset: number; colSpan: number; sticky: number };
}
const NativeBodyRow = defineComponent(
  <RecordType extends object>(props: BodyRowProps<RecordType>, { attrs }: SetupContext<[]>) => {
    const ctx = useTableContext<RecordType>();
    // ======================= 行级信息（useRowInfo） =======================
    // ⚠️ ctx（provide 对象）的 getter 已解包 .value —— 这里不能再 .value（undefined）
    const nestExpandable = computed(() => ctx.expandableType === 'nest');
    const rowSupportExpand = computed(
      () => ctx.expandableType === 'row' && (!ctx.rowExpandable || ctx.rowExpandable(props.record)),
    );
    const mergedExpandable = computed(
      () => rowSupportExpand.value || (nestExpandable.value && hasNestChildren.value),
    );
    const expanded = computed(() => Boolean(ctx.expandedKeys?.has(props.rowKey)));
    const hasNestChildren = computed(() =>
      Boolean(getChildren(props.record, ctx.childrenColumnName)?.length),
    );
    // ========================= onRow =========================
    const rowProps = computed<Record<string, unknown>>(() => {
      const base = ctx.onRow?.(props.record, props.index) ?? {};
      const computeRowClassName =
        typeof ctx.rowClassName === 'string'
          ? ctx.rowClassName
          : typeof ctx.rowClassName === 'function'
            ? ctx.rowClassName(props.record, props.index, props.indent)
            : undefined;
      const onClick = (event: MouseEvent) => {
        if (!event.defaultPrevented && ctx.expandRowByClick && mergedExpandable.value) {
          ctx.onTriggerExpand(props.record, event);
        }
      };
      return mergeProps(base, { onClick }, { class: [computeRowClassName, base.className] });
    });
    const columnsKey = computed(() => getColumnsKey(ctx.flattenColumns));
    const expandedClsName = computed(() =>
      computedExpandedClassName(ctx.expandedRowClassName, props.record, props.index, props.indent),
    );
    // hover 联动的 rowSpan 基准（rowSpan>1 的单元格取其 originRowSpan；
    // 常规单行单元格 = 1。基础场景 rc 用 mergedHoverRowSpan = legacy ?? origin ?? rowSpan，
    // 这里 Cell 侧已实现三段回退；行级只按单行判定（与 rc useHoverState(index, rowSpan) 同判，
    // rowSpan 在多行场景由 Cell 以 props 传入修正）。
    // ==================== 行级 provide（T0.2 硬规则） ====================
    const rowCtx: RowContextValue<RecordType> = {
      get record() {
        return props.record;
      },
      get renderIndex() {
        return props.renderIndex;
      },
      get index() {
        return props.index;
      },
      get indent() {
        return props.indent;
      },
      get rowKey() {
        return props.rowKey;
      },
      get rowKeys() {
        return props.rowKeys;
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
        return props.index <= end && props.index >= start;
      },
      get hoveringBySpan() {
        return (rowSpan: number) => {
          const start = ctx.hoverStartRow;
          const end = ctx.hoverEndRow;
          const cellEndRow = props.index + (rowSpan || 1) - 1;
          return props.index <= end && cellEndRow >= start;
        };
      },
    };
    provide(rowContextKey, rowCtx);
    // ======================== Base row ========================
    const baseRowNode = () => {
      const bodyCls = ctx.classNames?.body ?? {};
      const bodyStyles = ctx.styles?.body ?? {};
      return renderElement(
        ctx.getComponent(['body', 'row'], 'tr'),
        {
          ...attrs,
          ...rowProps.value,
          'data-row-key': props.rowKey,
          class: [
            attrs.class,
            `${ctx.prefixCls}-row`,
            `${ctx.prefixCls}-row-level-${props.indent}`,
            rowProps.value.class,
            bodyCls.row,
            { [expandedClsName.value ?? '']: props.indent >= 1 },
          ],
          style: [props.style, rowProps.value.style, bodyStyles.row],
        },
        ctx.flattenColumns.map((column, colIndex) => {
          const { render, dataIndex, className: columnClassName } = column;
          const { key, fixedInfo, appendCellNode, additionalCellProps, originRowSpan } =
            getCellProps(
              {
                record: props.record,
                prefixCls: ctx.prefixCls,
                columnsKey: columnsKey.value,
                fixedInfoList: ctx.fixedInfoList,
                expandIconColumnIndex: ctx.expandIconColumnIndex,
                nestExpandable: nestExpandable.value,
                indentSize: ctx.indentSize,
                expandIcon: ctx.expandIcon,
                expanded: expanded.value,
                hasNestChildren: hasNestChildren.value,
                onTriggerExpand: ctx.onTriggerExpand,
                expandable: mergedExpandable.value,
                expandedKeys: ctx.expandedKeys,
              },
              column,
              colIndex,
              props.indent,
              props.index,
              props.rowKeys,
              props.expandedRowInfo?.offset ?? 0,
            );
          return h(Cell<RecordType>, {
            class: [columnClassName, bodyCls.cell],
            style: bodyStyles.cell,
            ellipsis: column.ellipsis,
            align: column.align,
            scope: column.rowScope,
            component: ctx.getComponent(['body', 'cell'], column.rowScope ? 'th' : 'td'),
            prefixCls: ctx.prefixCls,
            key: String(key),
            record: props.record,
            column,
            bodyCell: props.bodyCell,
            index: props.index,
            renderIndex: props.renderIndex,
            dataIndex,
            render,
            shouldCellUpdate: column.shouldCellUpdate,
            ...fixedInfo,
            appendNode: appendCellNode,
            additionalProps: additionalCellProps,
            originRowSpan,
          });
        }),
      );
    };
    // ======================== Expand row ========================
    const expandedRef = ref(expanded.value);
    watch(
      expanded,
      (value) => {
        if (value) expandedRef.value = true;
      },
      { flush: 'sync' },
    );
    const expandRowNode = () => {
      if (
        rowSupportExpand.value &&
        (ctx.forceRender || expandedRef.value || expanded.value) &&
        ctx.expandedRowRender
      ) {
        const expandContent = ctx.expandedRowRender(
          props.record,
          props.index,
          props.indent + 1,
          expanded.value,
        );
        return h(
          ExpandedRow,
          {
            expanded: expanded.value,
            class: [
              `${ctx.prefixCls}-expanded-row`,
              `${ctx.prefixCls}-expanded-row-level-${props.indent + 1}`,
              expandedClsName.value,
            ].filter(Boolean),
            prefixCls: ctx.prefixCls,
            component: ctx.getComponent(['body', 'row'], 'tr'),
            cellComponent: ctx.getComponent(['body', 'cell'], 'td'),
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
    };
    return () => [baseRowNode(), expandRowNode()];
  },
  {
    name: 'TableBodyRow',
    inheritAttrs: false,
    emits: [],
    props: [
      'style',
      'record',
      'bodyCell',
      'index',
      'renderIndex',
      'rowKey',
      'rowKeys',
      'indent',
      'expandedRowInfo',
    ],
  },
);
const BodyRow: typeof NativeBodyRow = Object.assign(NativeBodyRow, {
  props: {
    style: { type: Object, default: undefined },
    record: { type: Object, required: true },
    bodyCell: { type: Function, default: undefined },
    index: { type: Number, required: true },
    renderIndex: { type: Number, required: true },
    rowKey: { type: [String, Number], required: true },
    rowKeys: { type: Array, required: true },
    indent: { type: Number, default: 0 },
    expandedRowInfo: {
      type: Object,
      default: undefined,
    },
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
          style: {
            paddingTop: 0,
            paddingBottom: 0,
            borderTop: 0,
            borderBottom: 0,
            height: 0,
          },
        },
        [h('div', { style: { height: 0, overflow: 'hidden', fontWeight: 'bold' } }, '\u00a0')],
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
  },
  setup(props) {
    const ctx = useTableContext();
    const rowRef = ref<HTMLElement | null>(null);
    // ResizeObserver 兜底重测（rc 用 ResizeObserver.Collection 的批量回调）
    let observer: ResizeObserver | undefined;
    const remeasure = () => {
      if (rowRef.value && rowRef.value.offsetParent !== null) {
        // ⚠️ **按索引取单元格**，不要给 td 加 `data-measure-key` 之类的定位属性：
        //    rc 是靠 `ResizeObserver.Collection` 的 `data`（不落 DOM）定位的，
        //    我们多一个属性 ⇒ DOM 契约对不上（dom-probe 全变体扫描 table
        //    fixed-summary 抓出）。测量行的列顺序与 columnsKey 一一对应。
        const cells = rowRef.value.children;
        props.columnsKey.forEach((columnKey, index) => {
          const cell = cells[index] as HTMLElement | undefined;
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
          return h(MeasureCell, {
            key: String(columnKey),
            columnKey,
            onColumnResize: props.onColumnResize,
          });
        }),
      );
      return typeof ctx.measureRowRender === 'function'
        ? ctx.measureRowRender(measureRow)
        : measureRow;
    };
  },
});

// ═══════════════════════════ Body ═══════════════════════════

interface BodyProps<RecordType extends object> {
  data: RecordType[];
  bodyCell?: TableSlots<RecordType>['bodyCell'];
  measureColumnWidth?: boolean;
}
const NativeBody = defineComponent(
  <RecordType extends object>(props: BodyProps<RecordType>) => {
    const ctx = useTableContext<RecordType>();

    const flattenData = computed<FlattenRecord<RecordType>[]>(() =>
      flattenRecords(props.data, ctx.childrenColumnName, ctx.expandedKeys, ctx.getRowKey),
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

    const columnsKey = computed(() => getColumnsKey(ctx.flattenColumns));

    return () => {
      const bodyCls = ctx.classNames?.body ?? {};
      const bodyStyles = ctx.styles?.body ?? {};
      const rows = props.data.length
        ? flattenData.value.map((item, idx) =>
            h(BodyRow<RecordType>, {
              key: String(item.rowKey),
              rowKey: item.rowKey,
              rowKeys: rowKeys.value,
              record: item.record,
              bodyCell: props.bodyCell,
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
      return renderElement(
        ctx.getComponent(['body', 'wrapper'], 'tbody'),
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
            }),
          ...(Array.isArray(rows) ? rows : [rows]),
        ],
      );
    };
  },
  { name: 'TableBody', emits: [], props: ['data', 'bodyCell', 'measureColumnWidth'] },
);
const Body: typeof NativeBody = Object.assign(NativeBody, {
  props: {
    data: { type: Array, required: true },
    bodyCell: { type: Function, default: undefined },
    measureColumnWidth: { type: Boolean, default: false },
  },
});

export default Body;
