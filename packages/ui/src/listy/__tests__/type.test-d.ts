import { describe, expectTypeOf, it } from 'vitest';
import { type CSSProperties, h, ref, type VNodeChild } from 'vue';
import { Listy } from '../index';
import type {
  ListyClassNames,
  ListyEmits,
  ListyGroup,
  ListyGroupHeaderSlotProps,
  ListyItemSlotProps,
  ListyProps,
  ListyRef,
  ListyRowKey,
  ListyScrollToConfig,
  ListySemanticName,
  ListySlots,
  ListyStyles,
} from '../interface';

const identifier = Symbol('identifier');
interface Row {
  id: number;
  label: string;
  group: 'a' | 'b';
  payload: { value: number };
  optional?: string;
  0: number;
  [identifier]: string;
}
const rows: Row[] = [];

describe('Listy native public types', () => {
  it('accepts only real key fields, numeric and symbol fields, and typed key algorithms', () => {
    expectTypeOf<ListyRowKey<Row>>().toEqualTypeOf<
      'id' | 'label' | 'group' | 0 | typeof identifier | ((item: Row) => string | number)
    >();
    expectTypeOf<ListyProps<number>['rowKey']>().toEqualTypeOf<
      (value: number) => string | number
    >();
    const field: ListyProps<Row> = { items: rows, rowKey: 'id' };
    const numeric: ListyProps<Row> = { items: rows, rowKey: 0 };
    const symbol: ListyProps<Row> = { items: rows, rowKey: identifier };
    const primitive: ListyProps<number> = { items: [1, 2], rowKey: (value) => value };
    void [field, numeric, symbol, primitive];
    // @ts-expect-error An object-valued field is not a stable list key.
    const objectField: ListyProps<Row> = { rowKey: 'payload' };
    // @ts-expect-error An optional field may resolve to undefined.
    const optionalField: ListyProps<Row> = { rowKey: 'optional' };
    // @ts-expect-error Missing rowKey cannot preserve item identity.
    const missing: ListyProps<Row> = { items: rows };
    void [objectField, optionalField, missing];
  });

  it('uses object scoped slots and keeps group.key as a typed data algorithm', () => {
    expectTypeOf<ListyGroup<Row, 'a' | 'b'>['key']>().toEqualTypeOf<(item: Row) => 'a' | 'b'>();
    expectTypeOf<NonNullable<ListySlots<Row>['default']>>().toEqualTypeOf<
      (scope: ListyItemSlotProps<Row>) => VNodeChild
    >();
    expectTypeOf<ListyGroupHeaderSlotProps<Row, 'a' | 'b'>>().toEqualTypeOf<{
      groupKey: 'a' | 'b';
      items: Row[];
      sticky: boolean;
      fixed: boolean;
    }>();
    const group: ListyGroup<Row> = {
      key: (item) => item.group,
      // @ts-expect-error Shared group templates use #groupHeader.
      title: () => 'legacy',
    };
    const props: ListyProps<Row> = {
      rowKey: 'id',
      // @ts-expect-error Item templates use the default scoped slot.
      itemRender: (item: Row) => item.label,
    };
    void [group, props];
  });

  it('owns native Event notifications and CSSProperties on all semantic names', () => {
    expectTypeOf<ListyEmits['scroll']>().toEqualTypeOf<[event: Event]>();
    expectTypeOf<ListyProps['onScroll']>().toEqualTypeOf<((event: Event) => void) | undefined>();
    expectTypeOf<ListySemanticName>().toEqualTypeOf<'root' | 'item' | 'groupHeader'>();
    expectTypeOf<ListyClassNames['item']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ListyStyles['root']>().toEqualTypeOf<CSSProperties | undefined>();
    const styles: ListyStyles = { root: { color: undefined, '--custom': 'value' } };
    void styles;
  });

  it('preserves the scrollTo union, typed group keys, and the actual exposed method', () => {
    expectTypeOf<ListyScrollToConfig>().toEqualTypeOf<
      | number
      | null
      | { key: string | number; align?: 'top' | 'bottom' | 'auto'; offset?: number }
      | { left?: number; top?: number }
      | { groupKey: string | number; align?: 'top' | 'bottom' | 'auto'; offset?: number }
    >();
    expectTypeOf<ListyRef<'a' | 'b'>['scrollTo']>().toEqualTypeOf<
      (config?: ListyScrollToConfig<'a' | 'b'>) => void
    >();
    const exposed = ref<ListyRef<'a' | 'b'> | null>(null);
    exposed.value?.scrollTo({ groupKey: 'a', align: 'top' });
    // @ts-expect-error Group key follows the actual group algorithm's return type.
    exposed.value?.scrollTo({ groupKey: 'missing' });
  });

  it('types actual generic h constructors without changing the data shape', () => {
    h(
      Listy<Row, 'a' | 'b'>,
      {
        items: rows,
        rowKey: 'id',
        group: { key: (item) => item.group },
        onScroll: (event) => expectTypeOf(event).toEqualTypeOf<Event>(),
      },
      { default: ({ item, index }: ListyItemSlotProps<Row>) => [item.label, index] },
    );
    h(Listy<number>, { items: [1, 2], rowKey: (value) => value });
    h(Listy<Row>, { items: rows, rowKey: identifier });
    h(Listy<Row>, { items: rows, rowKey: 0 });
    // @ts-expect-error Actual h component rejects object-valued key fields.
    h(Listy<Row>, { items: rows, rowKey: 'payload' });
    // @ts-expect-error Actual h component rejects a key function for the wrong data.
    h(Listy<Row>, { items: rows, rowKey: (value: number) => value });
    h(Listy<Row>, {
      items: rows,
      rowKey: 'id',
      // @ts-expect-error ListyProps omits itemRender; Vue h and SFC constructors also accept arbitrary native attrs.
      itemRender: (item: Row) => item.label,
    } satisfies ListyProps<Row>);
  });
});
