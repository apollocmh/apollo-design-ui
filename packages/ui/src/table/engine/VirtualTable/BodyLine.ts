/**
 * rc `VirtualTable/BodyLine.js`（128 行）—— Vue 移植。
 *
 * 一行 = `display:flex` 的 **div**（不是 `<tr>`），宽度 `scrollX`，
 * 单元格由 `VirtualCell` 给 flex 宽度。
 *
 * ⚠️ **行级 `provide`（`rowContextKey`）与 `Body.ts` 的 `BodyRow` 同构** ——
 * 因为 `Cell` 依赖它取 `hovering` / `columnsKey` / `fixedInfoList` 等
 * （T0.2 PoC 硬规则，`docs/analysis/table.md` §4.3.1）。
 * **两处必须同步**：改 `BodyRow` 的 rowContext 字段时，这里要一起改。
 *
 * ⚠️ `extra`（rowSpan 补行）时行是 `position:absolute; pointerEvents:none`。
 */

import { computed, defineComponent, h, inject, type PropType, provide, reactive, ref } from 'vue';
import type { ColumnType } from '../../interface';
import Cell from '../Cell';
import { type RowContextValue, rowContextKey, tableContextKey } from '../context';
import type { FlattenRecord } from '../hooks/use-table';
import { computedExpandedClassName } from '../utils/expandUtil';
import { getColumnsKey } from '../utils/valueUtil';
import VirtualCell from './VirtualCell';

export default defineComponent({
  name: 'TableVirtualBodyLine',
  props: {
    data: { type: Object as PropType<FlattenRecord<Record<string, unknown>>>, required: true },
    rowKey: { type: [String, Number] as PropType<string | number>, required: true },
    index: { type: Number, required: true },
    columnsOffset: { type: Array as PropType<number[]>, required: true },
    /** 展平后的全部 rowKey（`expandedRowOffset` 场景 getCellProps 要用）。 */
    rowKeys: { type: Array as PropType<(string | number)[]>, default: () => [] },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    className: { type: null, default: undefined },
    /** rowSpan 补行（`BodyGrid.extraRender` 产出的那些行）。 */
    extra: { type: Boolean, default: false },
    getHeight: {
      type: Function as PropType<((rowSpan: number) => number | undefined) | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    const ctx = inject(tableContextKey)!;
    const { record, indent, index: renderIndex } = props.data;
    const { index, rowKey } = props;

    // ======================= 行级信息（与 BodyRow 同构） =======================
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
        return undefined;
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

    // ======================== 行组件 / 单元格组件 ========================
    // ⚠️ 本仓 virtual-list 的 `component` 只收 String；`components.body.row` 若传组件，
    //    这里回退到 'div'（上游允许组件，登记 COMPATIBILITY）。
    const rowComponent = computed(() => {
      const c = ctx.getComponent(['body', 'row'], 'div');
      return typeof c === 'string' ? c : 'div';
    });
    const cellComponent = computed(() => {
      const c = ctx.getComponent(['body', 'cell'], 'div');
      return typeof c === 'string' ? c : 'div';
    });

    const bodyCls = computed(
      () => (ctx.classNames as never as { body?: Record<string, string> } | undefined)?.body ?? {},
    );
    const bodyStyles = computed(
      () =>
        (ctx.styles as never as { body?: Record<string, Record<string, unknown>> } | undefined)
          ?.body ?? {},
    );

    // ======================== 展开行 ========================
    const expandedRef = ref(false);
    expandedRef.value = expandedRef.value || expanded.value;
    const expandRowNode = computed(() => {
      if (
        props.extra ||
        !rowSupportExpand.value ||
        !(ctx.forceRender || expandedRef.value || expanded.value) ||
        !ctx.expandedRowRender
      ) {
        return null;
      }
      const expandContent = (
        ctx.expandedRowRender as unknown as (
          r: never,
          i: number,
          ind: number,
          exp: boolean,
        ) => unknown
      )(record as never, index, indent + 1, expanded.value);
      const rowCellCls = `${ctx.prefixCls}-expanded-row-cell`;
      const additionalProps: Record<string, unknown> = ctx.fixColumn
        ? { style: { '--virtual-width': `${ctx.componentWidth}px` } }
        : {};
      return h(
        rowComponent.value,
        {
          class: [
            `${ctx.prefixCls}-expanded-row`,
            `${ctx.prefixCls}-expanded-row-level-${indent + 1}`,
            expandedClsName,
          ].filter(Boolean),
          style: { display: expanded.value ? undefined : 'none' },
        },
        [
          h(
            Cell,
            {
              component: cellComponent.value,
              prefixCls: ctx.prefixCls,
              class: [rowCellCls, { [`${rowCellCls}-fixed`]: ctx.fixColumn }],
              additionalProps,
            },
            { default: () => expandContent },
          ),
        ],
      );
    });

    // ======================== Render ========================
    return () => {
      const scrollX = ctx.scrollX;
      const rowStyle: Record<string, unknown> = {
        ...(props.style ?? {}),
        // ⚠️ Vue 不做 px 补全 ⇒ 数值必须自己拼单位（否则宽度整条声明被丢弃）
        width: typeof scrollX === 'number' ? `${scrollX}px` : scrollX,
      };
      if (props.extra) {
        rowStyle.position = 'absolute';
        rowStyle.pointerEvents = 'none';
      }

      const rowNode = h(
        rowComponent.value,
        {
          ...(rowProps.value ?? {}),
          'data-row-key': rowKey,
          class: [
            props.className,
            `${ctx.prefixCls}-row`,
            ...(((rowProps.value?.class as unknown[]) ?? []) as unknown[]),
            bodyCls.value.row,
            {
              [expandedClsName as string]: indent >= 1,
              [`${ctx.prefixCls}-row-extra`]: props.extra,
            },
          ],
          style: {
            ...rowStyle,
            ...((rowProps.value?.style as Record<string, unknown>) ?? {}),
            ...(bodyStyles.value.row ?? {}),
          },
        },
        (ctx.flattenColumns as ColumnType[]).map((column, colIndex) =>
          h(VirtualCell, {
            key: String(colIndex),
            className: bodyCls.value.cell,
            style: bodyStyles.value.cell,
            component: cellComponent.value,
            column,
            colIndex,
            indent,
            index,
            renderIndex,
            record,
            inverse: props.extra,
            getHeight: props.getHeight,
            columnsOffset: props.columnsOffset,
          } as never),
        ),
      );

      // 展开行存在时外层包一层 div（上游 `:118-122`）—— 否则展开内容会被 flex 行挤扁
      if (rowSupportExpand.value) {
        return h('div', null, [rowNode, expandRowNode.value]);
      }
      return rowNode;
    };
  },
});
