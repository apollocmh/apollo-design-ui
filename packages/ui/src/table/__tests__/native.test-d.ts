import { expectTypeOf, test } from 'vitest';
import { h, type VNodeChild } from 'vue';
import {
  TableSummaryCell as RootSummaryCell,
  TableSummaryRow as RootSummaryRow,
} from '../../index';
import { Summary, Table, TableSummaryCell, TableSummaryRow } from '../index';
import type {
  ColumnsType,
  TableProps,
  TableRef,
  TableScrollConfig,
  TableSlots,
} from '../interface';

test('preserves native generic rows, slots, summary, expose and invalid inputs', () => {
  interface User {
    id: string;
    name: string;
    age: number;
  }
  const users: User[] = [{ id: 'a', name: 'Alpha', age: 10 }];
  const columns: ColumnsType<User> = [
    {
      key: 'name',
      dataIndex: 'name',
      title: ({ sortColumns }) => sortColumns?.length ?? 'Name',
      render: (_value, record, index) => h('span', `${record.name}:${index}`),
      onCell: (record) => ({ 'data-user-id': record.id }),
      sorter: (a, b) => a.age - b.age,
    },
  ];
  const props: TableProps<User> = {
    dataSource: users,
    columns,
    rowKey: 'id',
    onRow: (record) => ({ 'data-user-id': record.id }),
    onChange: (_pagination, _filters, sorter, extra) => {
      const row: User | undefined = extra.currentDataSource[0];
      void [row, sorter];
    },
    styles: {
      root: { color: undefined, '--table-tone': '#123' },
      body: { cell: { marginInlineStart: 3 } },
    },
  };
  const slots: TableSlots<User> = {
    bodyCell: ({ record, originNode }) => [h('span', record.name), originNode],
    headerCell: ({ title }) => title,
    expandedRow: ({ record, index, expanded }) => h('p', `${record.name}:${index}:${expanded}`),
    summary: ({ data }) =>
      h(Summary, null, () =>
        h(Summary.Row, null, () => h(Summary.Cell, { index: 0 }, () => data.length)),
      ),
  };
  h(Table<User>, props, slots);
  h(Table.Summary, { fixed: 'top' }, () =>
    h(Table.Summary.Row, {}, () => h(Table.Summary.Cell, { index: 0 }, () => 0)),
  );
  expectTypeOf(Table.Summary).toEqualTypeOf<typeof Summary>();
  expectTypeOf(TableSummaryRow).toEqualTypeOf<typeof Summary.Row>();
  expectTypeOf(TableSummaryCell).toEqualTypeOf<typeof Summary.Cell>();
  expectTypeOf(RootSummaryRow).toEqualTypeOf<typeof TableSummaryRow>();
  expectTypeOf(RootSummaryCell).toEqualTypeOf<typeof TableSummaryCell>();
  h(TableSummaryRow, null, () => h(TableSummaryCell, { index: 0, colSpan: 2 }, () => 'Total'));
  type Props = Parameters<typeof Table<User>>[0];
  type Slots = NonNullable<Parameters<typeof Table<User>>[1]>['slots'];
  type Exposed = Parameters<NonNullable<Parameters<typeof Table<User>>[2]>>[0];
  expectTypeOf<Exposed['nativeElement']>().returns.toEqualTypeOf<HTMLElement | null>();
  expectTypeOf<Parameters<NonNullable<Slots['bodyCell']>>[0]['record']>().not.toBeAny();
  expectTypeOf<Props['dataSource']>().toEqualTypeOf<User[] | undefined>();
  expectTypeOf<
    Parameters<NonNullable<Props['onChange']>>[3]['currentDataSource'][number]
  >().not.toBeAny();
  expectTypeOf<
    Parameters<NonNullable<Props['onChange']>>[3]['currentDataSource'][number]
  >().toEqualTypeOf<User>();
  expectTypeOf<NonNullable<Props['onScroll']>>().parameters.toEqualTypeOf<[event: Event]>();
  expectTypeOf<Parameters<NonNullable<Slots['bodyCell']>>[0]['record']>().toEqualTypeOf<User>();
  expectTypeOf<ReturnType<NonNullable<TableSlots<User>['bodyCell']>>>().toEqualTypeOf<VNodeChild>();
  expectTypeOf<TableRef['nativeElement']>().returns.toEqualTypeOf<HTMLElement | null>();
  const negative = () => {
    // @ts-expect-error The actual native generic constructor keeps User.id as string.
    h(Table<User>, { dataSource: [{ id: 1, name: 'Wrong', age: 10 }] });
    const bad: ColumnsType<User> = [
      {
        render: (_value, record) => {
          // @ts-expect-error A renderer receives User, without a fabricated index signature.
          return record.missing;
        },
      },
    ];
    const old: TableProps<User> = {
      // @ts-expect-error Table-level content uses the native #title slot.
      title: () => h('p'),
    };
    const nested: TableProps<User> = {
      expandable: {
        // @ts-expect-error Nested full-table content does not retain a renderer compatibility route.
        expandedRowRender: () => h('p'),
      },
    };
    const wrongField: NonNullable<Slots['bodyCell']> = ({ record }) => {
      // @ts-expect-error A real public SFC slot receives User, without InternalSlots any.
      return record.missing;
    };
    // @ts-expect-error User.id is a string in the actual component's slot parameter.
    const wrongRecord: NonNullable<Slots['bodyCell']> = ({ record }: { record: { id: number } }) =>
      h('span', record.id);
    return [bad, old, nested, wrongField, wrongRecord];
  };
  void negative;
});

test('keeps scroll lengths and onCell spans on the actual generic constructor', () => {
  interface Row {
    id: number;
    age: number;
  }
  type Props = Parameters<typeof Table<Row>>[0];
  const props: Props = {
    dataSource: [{ id: 1, age: 32 }],
    rowKey: 'id',
    columns: [
      {
        dataIndex: 'age',
        onCell: (record, index) => ({
          colSpan: index === 1 ? 2 : 1,
          rowSpan: record.id === 1 ? 2 : 0,
          'data-age': record.age,
        }),
      },
    ],
  };
  for (const y of [0, 240, '25vh']) h(Table<Row>, { ...props, scroll: { y } });
  expectTypeOf<NonNullable<Props['scroll']>['y']>().toEqualTypeOf<number | string | undefined>();
  expectTypeOf<TableScrollConfig['y']>().toEqualTypeOf<number | string | undefined>();
  // Columns keep unknown metadata; that does not define a second cell service.
  type Column = NonNullable<Props['columns']>[number];
  expectTypeOf<Column['customCell']>().toBeUnknown();
  const negative = () => {
    const height: Props = {
      scroll: {
        // @ts-expect-error The real constructor accepts a CSS length or number, not a boolean.
        y: true,
      },
    };
    const metadata: Column = {
      dataIndex: 'age',
      customCell: () => ({ rowSpan: 2 }),
    };
    // @ts-expect-error Unknown column metadata is not a callable public cell service.
    metadata.customCell();
    return [height, metadata];
  };
  void negative;
});
