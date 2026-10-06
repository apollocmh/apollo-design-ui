/**
 * rc `Header/{Header,HeaderRow}.js`（~160 行）—— Vue 移植。
 * `parseHeaderRows` 是分组表头的行/列展开算法（逐字）。
 */

import { computed, defineComponent, h, type PropType } from 'vue';
import type { ColumnsType, ColumnType } from '../interface';
import Cell from './Cell';
import { useTableContext } from './context';
import { getCellFixedInfo } from './utils/fixUtil';
import { getColumnsKey } from './utils/valueUtil';

interface HeaderCellInfo {
  key: string | number | undefined;
  class: unknown;
  style: Record<string, unknown> | undefined;
  children: unknown;
  column: ColumnType;
  colStart: number;
  colEnd: number;
  colSpan: number;
  rowSpan?: number;
  hasSubColumns?: boolean;
}

function parseHeaderRows(
  rootColumns: ColumnsType,
  classNames: Record<string, string>,
  styles: Record<string, Record<string, unknown>>,
): HeaderCellInfo[][] {
  const rows: HeaderCellInfo[][] = [];
  function fillRowCells(columns: ColumnsType, colIndex: number, rowIndex = 0): number[] {
    while (rows.length <= rowIndex) rows.push([]);
    let currentColIndex = colIndex;
    const colSpans = columns.filter(Boolean).map((rawColumn) => {
      const column = rawColumn as ColumnType;
      const cell: HeaderCellInfo = {
        key: column.key,
        class: [column.className, classNames.cell],
        style: styles.cell,
        children: column.title,
        column,
        colStart: currentColIndex,
        colEnd: currentColIndex,
        colSpan: 1,
      };
      let colSpan = 1;
      const subColumns = (column as { children?: ColumnsType }).children;
      if (subColumns && subColumns.length > 0) {
        colSpan = fillRowCells(subColumns, currentColIndex, rowIndex + 1).reduce(
          (total, count) => total + count,
          0,
        );
        cell.hasSubColumns = true;
      }
      if ('colSpan' in column && (column as { colSpan?: number }).colSpan !== undefined) {
        colSpan = (column as { colSpan?: number }).colSpan as number;
      }
      if ('rowSpan' in column) {
        (cell as { rowSpan?: number }).rowSpan = (column as { rowSpan?: number }).rowSpan as number;
      }
      cell.colSpan = colSpan;
      cell.colEnd = cell.colStart + colSpan - 1;
      rows[rowIndex]?.push(cell);
      currentColIndex += colSpan;
      return colSpan;
    });
    return colSpans;
  }

  fillRowCells(rootColumns, 0);

  const rowCount = rows.length;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    rows[rowIndex]?.forEach((cell) => {
      if (!('rowSpan' in cell) && !cell.hasSubColumns) {
        (cell as { rowSpan?: number }).rowSpan = rowCount - rowIndex;
      }
    });
  }
  return rows;
}

const HeaderRow = defineComponent({
  name: 'TableHeaderRow',
  props: {
    cells: { type: Array as PropType<HeaderCellInfo[]>, required: true },
    stickyOffsets: { type: Object as PropType<{ start: number[]; end: number[] }>, required: true },
    flattenColumns: { type: Array as PropType<ColumnsType>, required: true },
    onHeaderRow: { type: Function, default: undefined },
    index: { type: Number, required: true },
    classNames: { type: Object as PropType<Record<string, string>>, default: undefined },
    styles: {
      type: Object as PropType<Record<string, Record<string, unknown>>>,
      default: undefined,
    },
  },
  setup(props) {
    const ctx = useTableContext();
    return () => {
      const { cells, stickyOffsets, flattenColumns, classNames, styles } = props;
      let rowProps: Record<string, unknown> | undefined;
      if (props.onHeaderRow) {
        rowProps = props.onHeaderRow(
          cells.map((cell) => cell.column),
          props.index,
        ) as Record<string, unknown>;
      }
      const columnsKey = getColumnsKey(cells.map((cell) => cell.column));
      return h(
        'tr',
        {
          ...rowProps,
          class: classNames?.row,
          style: styles?.row,
        },
        cells.map((cell, cellIndex) => {
          const { column, colStart, colEnd, colSpan } = cell;
          const fixedInfo = getCellFixedInfo(
            colStart,
            colEnd,
            flattenColumns as never,
            stickyOffsets as never,
          );
          const additionalProps = (column?.onHeaderCell?.(column) as Record<string, unknown>) || {};
          return h(Cell, {
            children: cell.children,
            class: cell.class,
            style: cell.style,
            colSpan: cell.colSpan,
            rowSpan: (cell as { rowSpan?: number }).rowSpan,
            scope: column.title ? (colSpan > 1 ? 'colgroup' : 'col') : null,
            ellipsis: column.ellipsis,
            align: column.align,
            component: 'th',
            prefixCls: ctx.prefixCls,
            key: String(columnsKey[cellIndex]),
            ...((fixedInfo ?? {}) as unknown as Record<string, unknown>),
            additionalProps,
            rowType: 'header',
          } as never);
        }),
      );
    };
  },
});

const Header = defineComponent({
  name: 'TableHeader',
  props: {
    stickyOffsets: {
      type: Object as PropType<{ start: number[]; end: number[]; widths: number[] }>,
      required: true,
    },
    columns: { type: Array as PropType<ColumnsType>, required: true },
    flattenColumns: { type: Array as PropType<ColumnsType>, required: true },
    onHeaderRow: { type: Function, default: undefined },
  },
  setup(props) {
    const ctx = useTableContext();
    const rows = computed(() => {
      const headerCls =
        (ctx.classNames as never as { header?: Record<string, string> } | undefined)?.header ?? {};
      const headerStyles =
        (ctx.styles as never as { header?: Record<string, Record<string, unknown>> } | undefined)
          ?.header ?? {};
      return parseHeaderRows(props.columns as ColumnsType, headerCls, headerStyles);
    });
    return () => {
      const headerCls =
        (ctx.classNames as never as { header?: Record<string, string> } | undefined)?.header ?? {};
      const headerStyles =
        (ctx.styles as never as { header?: Record<string, Record<string, unknown>> } | undefined)
          ?.header ?? {};
      return h(
        'thead',
        {
          class: [`${ctx.prefixCls}-thead`, headerCls.wrapper],
          style: headerStyles.wrapper,
        },
        rows.value.map((row: HeaderCellInfo[], rowIndex: number) =>
          h(HeaderRow, {
            classNames: headerCls,
            styles: headerStyles,
            key: rowIndex,
            flattenColumns: props.flattenColumns,
            cells: row,
            stickyOffsets: props.stickyOffsets,
            onHeaderRow: props.onHeaderRow,
            index: rowIndex,
          }),
        ),
      );
    };
  },
});

export default Header;
