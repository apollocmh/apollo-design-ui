import { expectTypeOf } from 'vitest';
import { h, type VNodeChild } from 'vue';
import { Summary, Table } from '../index';
import type { ColumnsType, TableProps, TableRef, TableSlots } from '../interface';

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
