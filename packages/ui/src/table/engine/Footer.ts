/**
 * rc `Panel/index.js`（12 行）+ `Footer/{index,Summary,Row,Cell}.js`（~130 行）—— Vue 移植。
 *
 * ⚠️ 事实复核（docs/analysis/table.md §1）：**`Summary.Cell` 没有 `fixed` 字段**
 * （rc `Footer/Cell.d.ts` 以 `.d.ts` 为准）。
 */

import {
  computed,
  defineComponent,
  h,
  inject,
  type PropType,
  provide,
  type SetupContext,
  type SlotsType,
  type StyleValue,
  type VNodeChild,
} from 'vue';
import type { ColumnType } from '../interface';
import Cell from './Cell';
import type { SummaryContextValue } from './context';
import { summaryContextKey, useTableContext } from './context';
import { getCellFixedInfo } from './utils/fixUtil';

// ============================== Panel ==============================

export const Panel = defineComponent(
  (
    props: { className?: unknown; style?: StyleValue },
    { slots }: SetupContext<[], SlotsType<{ default?: () => VNodeChild }>>,
  ) =>
    () =>
      h('div', { class: props.className, style: props.style }, [slots.default?.()]),
  { name: 'TablePanel', props: ['className', 'style'], emits: [] },
);

// ============================== Summary components ==============================
export const SummaryRow = defineComponent({
  name: 'TableSummaryRow',
  inheritAttrs: false,
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
    align: { type: String as PropType<ColumnType['align']>, default: undefined },
  },
  setup(props, { slots }) {
    const ctx = useTableContext();
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
            summaryCtx.flattenColumns,
            summaryCtx.stickyOffsets,
          )
        : undefined;
      return { mergedColSpan, fixedInfo };
    });
    return () =>
      h(
        Cell,
        {
          // ⚠️ 调用方原生 class 不在这里加 —— SummaryCell 没关 inheritAttrs，
          //    Vue 会自动落到 Cell（Cell 自己读 attrs.class）。
          index: props.index,
          component: 'td',
          prefixCls: ctx.prefixCls,
          record: null,
          align: props.align,
          colSpan: merged.value.mergedColSpan,
          rowSpan: props.rowSpan,
          ...merged.value.fixedInfo,
        },
        { default: () => slots.default?.() },
      );
  },
});

/** 语法糖：`<Summary>` 原样渲染 children（rc 同判：不支持 HOC）。 */
const SummaryComponent = defineComponent({
  name: 'TableSummary',
  inheritAttrs: false,
  props: {
    fixed: { type: [Boolean, String] as PropType<boolean | 'top' | 'bottom'>, default: undefined },
  },
  setup(_, { slots }) {
    return () => slots.default?.();
  },
});
export const Summary = Object.assign(SummaryComponent, { Row: SummaryRow, Cell: SummaryCell });

// ============================== Footer（tfoot） ==============================

const Footer = defineComponent({
  name: 'TableFooter',
  props: {
    stickyOffsets: {
      type: Object as PropType<{ start: number[]; end: number[]; widths: number[] }>,
      required: true,
    },
    flattenColumns: {
      type: Array as PropType<SummaryContextValue['flattenColumns']>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const ctx = useTableContext();
    const summaryContext = computed(() => {
      const flattenColumns = props.flattenColumns;
      const lastColumnIndex = flattenColumns.length - 1;
      const scrollColumn = flattenColumns[lastColumnIndex];
      return {
        stickyOffsets: props.stickyOffsets,
        flattenColumns: props.flattenColumns,
        scrollColumnIndex: scrollColumn?.scrollbar ? lastColumnIndex : null,
      };
    });
    provide(summaryContextKey, {
      get stickyOffsets() {
        return summaryContext.value.stickyOffsets;
      },
      get flattenColumns() {
        return summaryContext.value.flattenColumns;
      },
      get scrollColumnIndex() {
        return summaryContext.value.scrollColumnIndex;
      },
    });
    return () => h('tfoot', { class: `${ctx.prefixCls}-summary` }, slots.default?.());
  },
});

export default Footer;
