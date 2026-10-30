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

import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  mergeProps,
  provide,
  ref,
  type SetupContext,
  type StyleValue,
  watch,
} from 'vue';
import { getChildren } from '../../data';
import type { TableSlots } from '../../interface';
import Cell from '../Cell';
import { type RowContextValue, rowContextKey, useTableContext } from '../context';
import { renderElement } from '../element';
import type { FlattenRecord } from '../hooks/use-table';
import { computedExpandedClassName } from '../utils/expandUtil';
import { getColumnsKey } from '../utils/valueUtil';
import VirtualCell from './VirtualCell';

interface BodyLineProps<RecordType extends object> {
  data: FlattenRecord<RecordType>;
  bodyCell?: TableSlots<RecordType>['bodyCell'];
  rowKey: string | number;
  index: number;
  columnsOffset: number[];
  rowKeys: (string | number)[];
  style?: StyleValue;
  className?: unknown;
  extra?: boolean;
  getHeight?: (rowSpan: number) => number | undefined;
}
const NativeBodyLine = defineComponent(
  <RecordType extends object>(props: BodyLineProps<RecordType>, { attrs }: SetupContext<[]>) => {
    const ctx = useTableContext<RecordType>();
    // ======================= 行级信息（与 BodyRow 同构） =======================
    const nestExpandable = computed(() => ctx.expandableType === 'nest');
    const rowSupportExpand = computed(
      () =>
        ctx.expandableType === 'row' &&
        (!ctx.rowExpandable || ctx.rowExpandable(props.data.record)),
    );
    const mergedExpandable = computed(
      () => rowSupportExpand.value || (nestExpandable.value && hasNestChildren.value),
    );
    const expanded = computed(() => Boolean(ctx.expandedKeys?.has(props.rowKey)));
    const hasNestChildren = computed(() =>
      Boolean(getChildren(props.data.record, ctx.childrenColumnName)?.length),
    );
    const rowProps = computed<Record<string, unknown>>(() => {
      const base = ctx.onRow?.(props.data.record, props.index) ?? {};
      const computeRowClassName =
        typeof ctx.rowClassName === 'string'
          ? ctx.rowClassName
          : typeof ctx.rowClassName === 'function'
            ? ctx.rowClassName(props.data.record, props.index, props.data.indent)
            : undefined;
      const onClick = (event: MouseEvent) => {
        if (!event.defaultPrevented && ctx.expandRowByClick && mergedExpandable.value) {
          ctx.onTriggerExpand(props.data.record, event);
        }
      };
      return mergeProps(base, { onClick }, { class: [computeRowClassName, base.className] });
    });
    const columnsKey = computed(() => getColumnsKey(ctx.flattenColumns));
    const expandedClsName = computed(() =>
      computedExpandedClassName(
        ctx.expandedRowClassName,
        props.data.record,
        props.index,
        props.data.indent,
      ),
    );
    // ==================== 行级 provide（T0.2 硬规则） ====================
    const rowCtx: RowContextValue<RecordType> = {
      get record() {
        return props.data.record;
      },
      get renderIndex() {
        return props.data.index;
      },
      get index() {
        return props.index;
      },
      get indent() {
        return props.data.indent;
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
    const rowComponent = computed(() => ctx.getComponent(['body', 'row'], 'div'));
    const cellComponent = computed(() => ctx.getComponent(['body', 'cell'], 'div'));
    const bodyCls = computed(() => ctx.classNames?.body ?? {});
    const bodyStyles = computed(() => ctx.styles?.body ?? {});
    // ======================== 展开行 ========================
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
        props.extra ||
        !rowSupportExpand.value ||
        !(ctx.forceRender || expandedRef.value || expanded.value) ||
        !ctx.expandedRowRender
      ) {
        return null;
      }
      const expandContent = ctx.expandedRowRender(
        props.data.record,
        props.index,
        props.data.indent + 1,
        expanded.value,
      );
      const rowCellCls = `${ctx.prefixCls}-expanded-row-cell`;
      const additionalProps: Record<string, unknown> = ctx.fixColumn
        ? { style: { '--virtual-width': `${ctx.componentWidth}px` } }
        : {};
      return renderElement(
        rowComponent.value,
        {
          class: [
            `${ctx.prefixCls}-expanded-row`,
            `${ctx.prefixCls}-expanded-row-level-${props.data.indent + 1}`,
            expandedClsName.value,
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
    };
    // ======================== Render ========================
    return () => {
      const scrollX = ctx.scrollX;
      const rowStyle: CSSProperties = {
        // ⚠️ Vue 不做 px 补全 ⇒ 数值必须自己拼单位（否则宽度整条声明被丢弃）
        width: scrollX === true ? 'auto' : typeof scrollX === 'number' ? `${scrollX}px` : scrollX,
      };
      if (props.extra) {
        rowStyle.position = 'absolute';
        rowStyle.pointerEvents = 'none';
      }
      const rowNode = renderElement(
        rowComponent.value,
        {
          ...attrs,
          ...rowProps.value,
          'data-row-key': props.rowKey,
          class: [
            attrs.class,
            props.className,
            `${ctx.prefixCls}-row`,
            rowProps.value.class,
            bodyCls.value.row,
            {
              [expandedClsName.value ?? '']: props.data.indent >= 1,
              [`${ctx.prefixCls}-row-extra`]: props.extra,
            },
          ],
          style: [attrs.style, props.style, rowStyle, rowProps.value.style, bodyStyles.value.row],
        },
        ctx.flattenColumns.map((column, colIndex) =>
          h(VirtualCell<RecordType>, {
            key: String(colIndex),
            className: bodyCls.value.cell,
            style: bodyStyles.value.cell,
            component: cellComponent.value,
            column,
            bodyCell: props.bodyCell,
            colIndex,
            indent: props.data.indent,
            index: props.index,
            renderIndex: props.data.index,
            record: props.data.record,
            inverse: props.extra,
            getHeight: props.getHeight,
            columnsOffset: props.columnsOffset,
          }),
        ),
      );
      // 展开行存在时外层包一层 div（上游 `:118-122`）—— 否则展开内容会被 flex 行挤扁
      if (rowSupportExpand.value) {
        return h('div', null, [rowNode, expandRowNode()]);
      }
      return rowNode;
    };
  },
  {
    name: 'TableVirtualBodyLine',
    inheritAttrs: false,
    emits: [],
    props: [
      'data',
      'bodyCell',
      'rowKey',
      'index',
      'columnsOffset',
      'rowKeys',
      'style',
      'className',
      'extra',
      'getHeight',
    ],
  },
);
const BodyLine: typeof NativeBodyLine = Object.assign(NativeBodyLine, {
  props: {
    data: { type: Object, required: true },
    bodyCell: { type: Function, default: undefined },
    rowKey: { type: [String, Number], required: true },
    index: { type: Number, required: true },
    columnsOffset: { type: Array, required: true },
    /** 展平后的全部 rowKey（`expandedRowOffset` 场景 getCellProps 要用）。 */
    rowKeys: { type: Array, default: () => [] },
    style: { type: Object, default: undefined },
    className: { type: null, default: undefined },
    /** rowSpan 补行（`BodyGrid.extraRender` 产出的那些行）。 */
    extra: { type: Boolean, default: false },
    getHeight: {
      type: Function,
      default: undefined,
    },
  },
});
export default BodyLine;
