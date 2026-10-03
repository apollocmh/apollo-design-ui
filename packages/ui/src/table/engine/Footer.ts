/**
 * rc `Panel/index.js`（12 行）+ `Footer/{index,Summary,Row,Cell}.js`（~130 行）—— Vue 移植。
 *
 * ⚠️ 事实复核（docs/analysis/table.md §1）：**`Summary.Cell` 没有 `fixed` 字段**
 * （rc `Footer/Cell.d.ts` 以 `.d.ts` 为准）。
 */

import { computed, defineComponent, h, inject, type PropType, provide } from 'vue';
import type { ColumnsType } from '../interface';
import Cell from './Cell';
import { summaryContextKey, tableContextKey } from './context';
import { getCellFixedInfo } from './utils/fixUtil';

// ============================== Panel ==============================

export const Panel = defineComponent({
  name: 'TablePanel',
  props: {
    className: { type: null, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
  setup(props, { slots }) {
    return () => h('div', { class: props.className, style: props.style }, slots.default?.());
  },
});

// ============================== Summary components ==============================
export const SummaryRow = defineComponent({
  name: 'TableSummaryRow',
  inheritAttrs: true,
  setup(_, { attrs, slots }) {
    return () => h('tr', attrs, slots.default?.());
  },
});

export const SummaryCell = defineComponent({
  name: 'TableSummaryCell',
  props: {
    index: { type: Number, required: true },
    colSpan: { type: Number, default: 1 },
    rowSpan: { type: Number, default: undefined },
    align: { type: String, default: undefined },
    className: { type: null, default: undefined },
  },
  setup(props, { slots }) {
    const ctx = inject(tableContextKey)!;
    const summaryCtx = inject(summaryContextKey, null);
    const merged = computed(() => {
      const lastIndex = props.index + props.colSpan - 1;
      const mergedColSpan =
        summaryCtx && lastIndex + 1 === summaryCtx.scrollColumnIndex
          ? props.colSpan + 1
          : props.colSpan;
      const fixedInfo = summaryCtx
        ? getCellFixedInfo(
            props.index,
            props.index + mergedColSpan - 1,
            summaryCtx.flattenColumns as never,
            summaryCtx.stickyOffsets as never,
          )
        : undefined;
      return { mergedColSpan, fixedInfo };
    });
    return () =>
      h(Cell, {
        class: props.className,
        index: props.index,
        component: 'td',
        prefixCls: ctx.prefixCls,
        record: null,
        dataIndex: null,
        align: props.align,
        colSpan: merged.value.mergedColSpan,
        rowSpan: props.rowSpan,
        render: () => slots.default?.(),
        ...((merged.value.fixedInfo ?? {}) as unknown as Record<string, unknown>),
      } as never);
  },
});

/** 语法糖：`<Summary>` 原样渲染 children（rc 同判：不支持 HOC）。 */
export const Summary = defineComponent({
  name: 'TableSummary',
  setup(_, { slots }) {
    return () => slots.default?.();
  },
}) as never as { Row: typeof SummaryRow; Cell: typeof SummaryCell };

Summary.Row = SummaryRow;
Summary.Cell = SummaryCell;

// ============================== Footer（tfoot） ==============================

const Footer = defineComponent({
  name: 'TableFooter',
  props: {
    stickyOffsets: {
      type: Object as PropType<{ start: number[]; end: number[]; widths: number[] }>,
      required: true,
    },
    flattenColumns: { type: Array as unknown as PropType<ColumnsType>, required: true },
  },
  setup(props, { slots }) {
    const ctx = inject(tableContextKey)!;
    const summaryContext = computed(() => {
      const flattenColumns = props.flattenColumns as never as { scrollbar?: boolean }[];
      const lastColumnIndex = flattenColumns.length - 1;
      const scrollColumn = flattenColumns[lastColumnIndex];
      return {
        stickyOffsets: props.stickyOffsets,
        flattenColumns: props.flattenColumns,
        scrollColumnIndex: scrollColumn?.scrollbar ? lastColumnIndex : null,
      };
    });
    provide(summaryContextKey, summaryContext.value as never);
    return () => h('tfoot', { class: `${ctx.prefixCls}-summary` }, slots.default?.());
  },
});

export default Footer;
