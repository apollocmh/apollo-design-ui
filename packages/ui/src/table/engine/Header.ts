/** Grouped header geometry and native header row/cell composition. */
import { type CSSProperties, computed, defineComponent, h, type VNodeChild } from 'vue';
import type {
  ColumnsType,
  ColumnType,
  TableProps,
  TableSemanticClassNames,
  TableSemanticStyles,
} from '../interface';
import { renderColumnTitle } from '../util';
import Cell from './Cell';
import { useTableContext } from './context';
import { renderElement } from './element';
import { getCellFixedInfo, type StickyOffsets } from './utils/fixUtil';
import { getColumnsKey } from './utils/valueUtil';

interface HeaderCellInfo<RecordType> {
  key: string | number | undefined;
  class: unknown;
  style?: CSSProperties;
  children: VNodeChild;
  column: ColumnType<RecordType>;
  colStart: number;
  colEnd: number;
  colSpan: number;
  rowSpan?: number;
  hasSubColumns?: boolean;
}

function parseHeaderRows<RecordType>(
  rootColumns: ColumnsType<RecordType>,
  classNames: NonNullable<TableSemanticClassNames['header']>,
  styles: NonNullable<TableSemanticStyles['header']>,
): HeaderCellInfo<RecordType>[][] {
  const rows: HeaderCellInfo<RecordType>[][] = [];
  function fillRowCells(
    columns: ColumnsType<RecordType>,
    colIndex: number,
    rowIndex = 0,
  ): number[] {
    while (rows.length <= rowIndex) rows.push([]);
    let currentColIndex = colIndex;
    return columns.map((column) => {
      const cell: HeaderCellInfo<RecordType> = {
        key: column.key,
        class: [column.className, classNames.cell],
        style: styles.cell,
        children: renderColumnTitle(column.title, {}),
        column,
        colStart: currentColIndex,
        colEnd: currentColIndex,
        colSpan: 1,
      };
      let colSpan = 1;
      if (column.children?.length) {
        colSpan = fillRowCells(column.children, currentColIndex, rowIndex + 1).reduce(
          (total, count) => total + count,
          0,
        );
        cell.hasSubColumns = true;
      }
      if (column.colSpan !== undefined) colSpan = column.colSpan;
      if (column.rowSpan !== undefined) cell.rowSpan = column.rowSpan;
      cell.colSpan = colSpan;
      cell.colEnd = cell.colStart + colSpan - 1;
      rows[rowIndex]?.push(cell);
      currentColIndex += colSpan;
      return colSpan;
    });
  }
  fillRowCells(rootColumns, 0);
  rows.forEach((row, index) => {
    row.forEach((cell) => {
      if (cell.rowSpan === undefined && !cell.hasSubColumns) cell.rowSpan = rows.length - index;
    });
  });
  return rows;
}

interface HeaderRowProps<RecordType> {
  cells: HeaderCellInfo<RecordType>[];
  stickyOffsets: StickyOffsets;
  flattenColumns: ColumnsType<RecordType>;
  onHeaderRow?: TableProps<RecordType>['onHeaderRow'];
  index: number;
  classNames?: TableSemanticClassNames['header'];
  styles?: TableSemanticStyles['header'];
}
const HeaderRow = defineComponent(
  <RecordType extends object>(props: HeaderRowProps<RecordType>) => {
    const ctx = useTableContext<RecordType>();
    return () => {
      const { cells, stickyOffsets, flattenColumns, classNames, styles } = props;
      const rowProps = props.onHeaderRow?.(
        cells.map((cell) => cell.column),
        props.index,
      );
      const columnsKey = getColumnsKey(cells.map((cell) => cell.column));
      return renderElement(
        ctx.getComponent(['header', 'row'], 'tr'),
        {
          ...rowProps,
          class: [rowProps?.class, rowProps?.className, classNames?.row],
          style: [rowProps?.style, styles?.row],
        },
        cells.map((cell, cellIndex) =>
          h(Cell<RecordType>, {
            children: cell.children,
            class: cell.class,
            style: cell.style,
            colSpan: cell.colSpan,
            rowSpan: cell.rowSpan,
            scope: cell.column.title ? (cell.colSpan > 1 ? 'colgroup' : 'col') : null,
            ellipsis: cell.column.ellipsis,
            align: cell.column.align,
            component: ctx.getComponent(['header', 'cell'], 'th'),
            prefixCls: ctx.prefixCls,
            key: columnsKey[cellIndex],
            ...getCellFixedInfo(cell.colStart, cell.colEnd, flattenColumns, stickyOffsets),
            additionalProps: cell.column.onHeaderCell?.(cell.column),
            rowType: 'header',
          }),
        ),
      );
    };
  },
  {
    name: 'TableHeaderRow',
    props: [
      'cells',
      'stickyOffsets',
      'flattenColumns',
      'onHeaderRow',
      'index',
      'classNames',
      'styles',
    ],
  },
);

interface HeaderProps<RecordType> {
  stickyOffsets: StickyOffsets;
  columns: ColumnsType<RecordType>;
  flattenColumns: ColumnsType<RecordType>;
  onHeaderRow?: TableProps<RecordType>['onHeaderRow'];
}
const Header = defineComponent(
  <RecordType extends object>(props: HeaderProps<RecordType>) => {
    const ctx = useTableContext<RecordType>();
    const rows = computed(() =>
      parseHeaderRows(props.columns, ctx.classNames?.header ?? {}, ctx.styles?.header ?? {}),
    );
    return () =>
      renderElement(
        ctx.getComponent(['header', 'wrapper'], 'thead'),
        {
          class: [`${ctx.prefixCls}-thead`, ctx.classNames?.header?.wrapper],
          style: ctx.styles?.header?.wrapper,
        },
        rows.value.map((row, index) =>
          h(HeaderRow<RecordType>, {
            classNames: ctx.classNames?.header,
            styles: ctx.styles?.header,
            key: index,
            flattenColumns: props.flattenColumns,
            cells: row,
            stickyOffsets: props.stickyOffsets,
            onHeaderRow: props.onHeaderRow,
            index,
          }),
        ),
      );
  },
  { name: 'TableHeader', props: ['stickyOffsets', 'columns', 'flattenColumns', 'onHeaderRow'] },
);

export default Header;
