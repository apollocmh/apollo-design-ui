/**
 * rc `VirtualTable/VirtualCell.js`（121 行）—— Vue 移植。
 *
 * 虚拟行的单元格**不是 `<td>`**，而是 `display:flex` 行里的 `div`：宽度靠
 * `flex: 0 0 {w}px; width: {w}px` 显式给（用列宽**前缀和**算跨列宽），
 * `colSpan > 1` 用 `margin-right` 补偿 —— 与上游逐字一致。
 *
 * ⚠️ `rowSpan` / `colSpan` 在 div 布局下无效 ⇒ 必须**重置为 1**（上游 `:93-97`）。
 * 跨行由 `BodyGrid` 的 `extraRender`（补行）承担，见 `BodyGrid.ts`。
 * ⚠️ Vue 的 `setStyle` 不做 px 补全（React 会）⇒ 所有数值宽度**必须自己拼单位**。
 */

import { computed, defineComponent, h, normalizeStyle, type StyleValue } from 'vue';
import type { ColumnType, TableComponent, TableSlots } from '../../interface';
import { getCellProps } from '../Body';
import Cell from '../Cell';
import { useRowContext, useTableContext } from '../context';

/** rc `VirtualCell.getColumnWidth`：列宽**前缀和**求跨 `colSpan` 宽（`colSpan=0` 当 1）。 */
export function getColumnWidth(colIndex: number, colSpan: number, columnsOffset: number[]): number {
  const mergedColSpan = colSpan || 1;
  return (columnsOffset[colIndex + mergedColSpan] as number) - (columnsOffset[colIndex] || 0);
}

interface VirtualCellProps<RecordType extends object> {
  column: ColumnType<RecordType>;
  colIndex: number;
  bodyCell?: TableSlots<RecordType>['bodyCell'];
  indent: number;
  index: number;
  renderIndex: number;
  record: RecordType;
  component?: TableComponent;
  columnsOffset: number[];
  inverse?: boolean;
  getHeight?: (rowSpan: number) => number | undefined;
  style?: StyleValue;
  className?: unknown;
}
const NativeVirtualCell = defineComponent(
  <RecordType extends object>(props: VirtualCellProps<RecordType>) => {
    const ctx = useTableContext<RecordType>();
    const rowCtx = useRowContext<RecordType>();

    // ===================== getCellProps（与 BodyRow 同源） =====================
    const cellProps = computed(() =>
      getCellProps(
        {
          record: props.record,
          prefixCls: ctx.prefixCls,
          columnsKey: rowCtx.columnsKey,
          fixedInfoList: rowCtx.fixedInfoList,
          expandIconColumnIndex: rowCtx.expandIconColumnIndex,
          nestExpandable: rowCtx.nestExpandable,
          indentSize: rowCtx.indentSize,
          expandIcon: rowCtx.expandIcon,
          expanded: rowCtx.expanded,
          hasNestChildren: rowCtx.hasNestChildren,
          onTriggerExpand: rowCtx.onTriggerExpand,
          expandable: rowCtx.expandable,
          expandedKeys: rowCtx.expandedKeys,
        },
        props.column,
        props.colIndex,
        props.indent,
        props.index,
        rowCtx.rowKeys,
        rowCtx.expandedRowInfo?.offset ?? 0,
      ),
    );

    const additional = computed(() => cellProps.value.additionalCellProps);
    const colSpan = computed(() => (additional.value.colSpan as number) ?? 1);
    const rowSpan = computed(() => (additional.value.rowSpan as number) ?? 1);

    // ===================== 宽度（前缀和） =====================
    const concatColWidth = computed(() =>
      getColumnWidth(props.colIndex - 1, colSpan.value, props.columnsOffset),
    );
    const marginOffset = computed(() =>
      colSpan.value > 1 ? ((props.column.width as number) ?? 0) - concatColWidth.value : 0,
    );

    // ===================== 隐藏 / 补行高度 =====================
    const needHide = computed(() =>
      props.inverse
        ? rowSpan.value <= 1
        : colSpan.value === 0 || rowSpan.value === 0 || rowSpan.value > 1,
    );

    const mergedStyle = computed(() => {
      const style: Record<string, unknown> = {
        flex: `0 0 ${concatColWidth.value}px`,
        width: `${concatColWidth.value}px`,
        marginRight: `${marginOffset.value}px`,
        pointerEvents: 'auto',
      };
      if (needHide.value) {
        style.visibility = 'hidden';
      } else if (props.inverse) {
        const height = props.getHeight?.(rowSpan.value);
        if (height !== undefined) style.height = `${height}px`;
      }
      return normalizeStyle([additional.value.style, props.style, style]);
    });

    // 虚拟布局下 span 无 table 语义 ⇒ 必须重置
    const cellSpan = computed<Record<string, number>>(() => {
      const span: Record<string, number> = {};
      if (rowSpan.value === 0 || colSpan.value === 0) {
        span.rowSpan = 1;
        span.colSpan = 1;
      }
      return span;
    });

    return () =>
      h(Cell<RecordType>, {
        class: [props.column.className, props.className],
        ellipsis: props.column.ellipsis,
        align: props.column.align,
        scope: props.column.rowScope,
        component: props.component,
        prefixCls: ctx.prefixCls,
        key: String(cellProps.value.key),
        record: props.record,
        column: props.column,
        bodyCell: needHide.value ? undefined : props.bodyCell,
        index: props.index,
        renderIndex: props.renderIndex,
        dataIndex: props.column.dataIndex,
        render: needHide.value ? () => null : props.column.render,
        shouldCellUpdate: props.column.shouldCellUpdate,
        ...cellProps.value.fixedInfo,
        appendNode: cellProps.value.appendCellNode,
        originRowSpan: cellProps.value.originRowSpan,
        additionalProps: {
          ...additional.value,
          style: mergedStyle.value,
          ...cellSpan.value,
        },
      });
  },
  {
    name: 'TableVirtualCell',
    emits: [],
    props: [
      'column',
      'colIndex',
      'bodyCell',
      'indent',
      'index',
      'renderIndex',
      'record',
      'component',
      'columnsOffset',
      'inverse',
      'getHeight',
      'style',
      'className',
    ],
  },
);
const VirtualCell: typeof NativeVirtualCell = Object.assign(NativeVirtualCell, {
  props: {
    column: { type: Object, required: true },
    colIndex: { type: Number, required: true },
    bodyCell: { type: Function, default: undefined },
    indent: { type: Number, required: true },
    index: { type: Number, required: true },
    renderIndex: { type: Number, required: true },
    record: { type: Object, required: true },
    component: { type: String, default: 'div' },
    columnsOffset: { type: Array, required: true },
    /** `extra`（补行）时为 true —— 隐藏条件与高度来源都与普通行相反。 */
    inverse: { type: Boolean, default: false },
    getHeight: {
      type: Function,
      default: undefined,
    },
    style: { type: Object, default: undefined },
    className: { type: null, default: undefined },
  },
});
export default VirtualCell;
