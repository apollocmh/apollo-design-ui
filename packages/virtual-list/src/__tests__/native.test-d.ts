import { expectTypeOf } from 'vitest';
import { type CSSProperties, h, type VNodeChild } from 'vue';
import type {
  ExtraRenderInfo,
  FillerEmits,
  FillerProps,
  FillerSlots,
  ItemKey,
  ScrollInfo,
  ScrollTo,
  VirtualListEmits,
  VirtualListExposed,
  VirtualListItemKey,
  VirtualListItemSlotProps,
  VirtualListProps,
  VirtualListSlots,
} from '../index';
import { Filler, VirtualList } from '../index';

const symbol = Symbol('id');
interface Row {
  id: number;
  title: string;
  metadata: { value: number };
  optional?: string;
  0: string;
  [symbol]: number;
}
const data: Row[] = [];
const props: VirtualListProps<Row> = {
  data,
  itemKey: 'id',
  height: 100,
  itemHeight: 20,
  innerProps: {
    class: 'native-inner',
    'aria-label': 'Rows',
    style: ['color: red', { margin: undefined }],
  },
  onScroll: (event) => expectTypeOf(event).toEqualTypeOf<Event>(),
  onVirtualScroll: (info) => expectTypeOf(info).toEqualTypeOf<ScrollInfo>(),
  onVisibleChange: (visible, full) => {
    expectTypeOf(visible).toEqualTypeOf<Row[]>();
    expectTypeOf(full).toEqualTypeOf<Row[]>();
  },
};
const slots: VirtualListSlots<Row> = {
  default: ({ item, index, style, offsetX }) => {
    expectTypeOf(item).toEqualTypeOf<Row>();
    expectTypeOf(style).toEqualTypeOf<CSSProperties>();
    return h('div', { style }, `${item.title}:${index}:${offsetX}`);
  },
  extra: (info) => {
    expectTypeOf(info).toEqualTypeOf<ExtraRenderInfo>();
    return [h('b'), 0, null];
  },
};
h(VirtualList<Row>, props, slots);
h(VirtualList<Row>, { data, itemKey: symbol });
h(VirtualList<Row>, { data, itemKey: 0 });
h(VirtualList<number>, { data: [1, 2], itemKey: (item) => item });
h(VirtualList<boolean>, { data: [true, false], itemKey: (item) => (item ? 'true' : 'false') });
expectTypeOf<VirtualListItemKey<Row>>().toEqualTypeOf<
  'id' | 'title' | 0 | typeof symbol | ((item: Row) => ItemKey)
>();
expectTypeOf<VirtualListItemKey<number>>().toEqualTypeOf<(item: number) => ItemKey>();
expectTypeOf<VirtualListEmits<Row>['scroll']>().toEqualTypeOf<[event: Event]>();
expectTypeOf<VirtualListEmits<Row>['virtualScroll']>().toEqualTypeOf<[info: ScrollInfo]>();
expectTypeOf<VirtualListEmits<Row>['visibleChange']>().toEqualTypeOf<
  [visibleList: Row[], fullList: Row[]]
>();
expectTypeOf<
  ReturnType<NonNullable<VirtualListSlots<Row>['default']>>
>().toEqualTypeOf<VNodeChild>();
expectTypeOf<FillerEmits['innerResize']>().toEqualTypeOf<[]>();
const fillerSlots: FillerSlots = { default: () => [0, h('div'), null], extra: () => null };
h(
  Filler,
  {
    innerProps: { style: { color: undefined }, role: 'presentation' },
    onInnerResize: () => {},
  } satisfies FillerProps,
  fillerSlots,
);

type ActualProps = Parameters<typeof VirtualList<Row>>[0];
type ActualSlots = NonNullable<Parameters<typeof VirtualList<Row>>[1]>['slots'];
type ActualExposed = Parameters<NonNullable<Parameters<typeof VirtualList<Row>>[2]>>[0];
expectTypeOf<ActualProps['data']>().toEqualTypeOf<Row[] | undefined>();
expectTypeOf<Parameters<NonNullable<ActualSlots['default']>>[0]>().toEqualTypeOf<
  VirtualListItemSlotProps<Row>
>();
expectTypeOf<ActualExposed['scrollTo']>().toEqualTypeOf<ScrollTo>();
expectTypeOf<ActualExposed['getScrollInfo']>().returns.toEqualTypeOf<ScrollInfo>();
expectTypeOf<ActualExposed['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
expectTypeOf<ActualExposed['containerElement']>().toEqualTypeOf<HTMLElement | null>();
expectTypeOf<InstanceType<typeof Filler>['getInnerHeight']>().returns.toEqualTypeOf<number>();
const negative = (exposed: VirtualListExposed) => {
  // @ts-expect-error Object-valued fields cannot be stable item keys.
  h(VirtualList<Row>, { data, itemKey: 'metadata' });
  // @ts-expect-error A key algorithm receives the actual item type.
  h(VirtualList<Row>, { data, itemKey: (item: number) => item });
  // @ts-expect-error Optional fields may return undefined.
  const optional: VirtualListProps<Row> = { data, itemKey: 'optional' };
  // @ts-expect-error A stable key is required even for an empty list.
  const missing: VirtualListProps<Row> = { data };
  h(VirtualList<Row>, {
    data,
    itemKey: 'id',
    // @ts-expect-error Inert scrollbar switches were removed; native CSS controls visibility.
    showScrollBar: false,
  } satisfies VirtualListProps<Row>);
  // @ts-expect-error nativeElement is a live getter, not a writable DOM field.
  exposed.nativeElement = document.createElement('div');
  // @ts-expect-error containerElement is also a live readonly getter.
  exposed.containerElement = null;
  // @ts-expect-error Diagnostic item diff state is not a public component responsibility.
  exposed.lastDiff;
  return [optional, missing];
};
void negative;
