import type { PanelCellRenderInfo } from '@apollo-design/picker';
import dayjs from 'dayjs';
import { describe, expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Calendar } from '../index';
import type {
  CalendarCellRenderInfo,
  CalendarCellSlotProps,
  CalendarDate,
  CalendarEmits,
  CalendarExpose,
  CalendarHeaderRenderConfig,
  CalendarMode,
  CalendarProps,
  CalendarSemanticClassNames,
  CalendarSemanticStyles,
  CalendarSemanticValue,
  CalendarSlots,
  SelectInfo,
} from '../interface';

type PublicProps = InstanceType<typeof Calendar>['$props'];

describe('Calendar native public contracts', () => {
  it('keeps single Dayjs values, modes and inclusive range tuples', () => {
    expectTypeOf<CalendarProps['value']>().toEqualTypeOf<CalendarDate | undefined>();
    expectTypeOf<CalendarProps['mode']>().toEqualTypeOf<CalendarMode | undefined>();
    expectTypeOf<CalendarProps['validRange']>().toEqualTypeOf<
      [CalendarDate, CalendarDate] | undefined
    >();
    expectTypeOf<PublicProps['value']>().toEqualTypeOf<CalendarDate | undefined>();
    expectTypeOf<PublicProps['mode']>().toEqualTypeOf<CalendarMode | undefined>();
    expectTypeOf<PublicProps['validRange']>().toEqualTypeOf<
      [CalendarDate, CalendarDate] | undefined
    >();
    expectTypeOf<SelectInfo['source']>().toEqualTypeOf<'year' | 'month' | 'date' | 'customize'>();
  });
  it('uses actual scoped slots, with a full Vue child return and real header commands', () => {
    expectTypeOf<CalendarCellRenderInfo>().toEqualTypeOf<PanelCellRenderInfo>();
    expectTypeOf<CalendarCellSlotProps['current']>().toEqualTypeOf<CalendarDate>();
    expectTypeOf<keyof CalendarSlots>().toEqualTypeOf<
      'headerRender' | 'cellRender' | 'fullCellRender'
    >();
    expectTypeOf<keyof CalendarHeaderRenderConfig>().toEqualTypeOf<
      'value' | 'type' | 'onChange' | 'onTypeChange'
    >();
    const slots = {
      headerRender: ({ value, onChange, onTypeChange }) => [
        h('button', { onClick: () => onChange(value.add(1, 'month')) }),
        h('button', { onClick: () => onTypeChange('year') }),
        0,
      ],
      cellRender: ({ current, info }) => (current.date() === 1 ? h('span', info.type) : 0),
      fullCellRender: () => null,
    } satisfies CalendarSlots;
    const vnode = h(
      Calendar,
      {
        value: dayjs('2026-09-15'),
        validRange: [dayjs('2026-09-01'), dayjs('2026-09-30')],
        mode: 'month',
        'onUpdate:value': (date) => date.format('YYYY-MM-DD'),
        'onUpdate:mode': (mode) => mode === 'month',
        onSelect: (date, info) => `${date.date()}-${info.source}`,
      },
      slots,
    );
    expectTypeOf(vnode).toHaveProperty('el');
    const actualRef = (instance: InstanceType<typeof Calendar>): CalendarExpose => instance;
    expectTypeOf(actualRef).returns.toEqualTypeOf<CalendarExpose>();
  });
  it('preserves semantic targets and allows a function to contribute no override', () => {
    expectTypeOf<keyof CalendarSemanticClassNames>().toEqualTypeOf<
      'root' | 'header' | 'body' | 'content' | 'item' | 'itemContent'
    >();
    expectTypeOf<keyof CalendarSemanticStyles>().toEqualTypeOf<keyof CalendarSemanticClassNames>();
    const semantic: CalendarSemanticValue<CalendarSemanticStyles, CalendarProps> = ({ props }) =>
      props.fullscreen ? { root: { color: 'red' } } : undefined;
    expectTypeOf(semantic).toBeFunction();
    expectTypeOf<CalendarExpose['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });
  it('retains typed models and owned notification payloads', () => {
    expectTypeOf<CalendarEmits['change']>().toEqualTypeOf<(date: CalendarDate) => void>();
    expectTypeOf<CalendarEmits['update:value']>().toEqualTypeOf<CalendarEmits['change']>();
    expectTypeOf<CalendarEmits['panelChange']>().toEqualTypeOf<
      (date: CalendarDate, mode: CalendarMode) => void
    >();
    expectTypeOf<CalendarEmits['update:mode']>().toEqualTypeOf<(mode: CalendarMode) => void>();
    expectTypeOf<CalendarEmits['select']>().toEqualTypeOf<
      (date: CalendarDate, info: SelectInfo) => void
    >();
  });
  it('rejects invalid models and removed content props on the actual constructor', () => {
    const invalid = () => {
      // @ts-expect-error Calendar only has two modes.
      const badMode: PublicProps = { mode: 'week' };
      // @ts-expect-error Calendar values are single dates, not arrays.
      const badValue: PublicProps = { value: [dayjs()] };
      // @ts-expect-error Inclusive bounds must be a tuple of two dates.
      const badRange: PublicProps = { validRange: [dayjs()] };
      // @ts-expect-error Content is a slot, not a prop.
      const oldHeader: PublicProps = { headerRender: () => null };
      // @ts-expect-error Content is a slot, not a prop.
      const oldCell: PublicProps = { cellRender: () => null };
      // @ts-expect-error Old fallback content props were removed.
      const oldFallback: PublicProps = { dateCellRender: () => null };
      // @ts-expect-error Class semantic values are strings.
      const badClass: CalendarProps = { classNames: { root: 1 } };
      // @ts-expect-error Selection source is a concrete business union.
      const badSource: SelectInfo = { source: 'panel' };
      // @ts-expect-error Calendar only exposes its current root.
      const badRef: CalendarExpose = { nativeElement: null, focus: () => {} };
      // @ts-expect-error Header command only accepts actual Calendar modes.
      const badSlot: CalendarSlots = { headerRender: (scope) => scope.onTypeChange('date') };
      void [
        badMode,
        badValue,
        badRange,
        oldHeader,
        oldCell,
        oldFallback,
        badClass,
        badSource,
        badRef,
        badSlot,
      ];
    };
    expectTypeOf(invalid).toBeFunction();
  });
});
