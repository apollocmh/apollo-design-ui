import { describe, expectTypeOf, it } from 'vitest';
import type { EmitsToProps, VNodeChild } from 'vue';
import type TimePicker from '../../time-picker/TimePicker.vue';
import type TimeRangePicker from '../../time-picker/TimeRangePicker.vue';
import type DatePicker from '../DatePicker.vue';
import type {
  DatePickerDate,
  DatePickerEmits,
  DatePickerPanelMode,
  DatePickerProps,
  DatePickerSlots,
  RangePickerEmits,
} from '../interface';
import type RangePicker from '../RangePicker.vue';

// These assertions use the actual SFC constructors as well as reusable public interfaces.
describe('DatePicker Vue public contracts', () => {
  it('owns native notifications and all four models', () => {
    expectTypeOf<DatePickerEmits['keydown']>().toEqualTypeOf<(event: KeyboardEvent) => void>();
    expectTypeOf<RangePickerEmits['update:mode']>().toEqualTypeOf<
      (mode: [DatePickerPanelMode, DatePickerPanelMode]) => void
    >();
    expectTypeOf<InstanceType<typeof DatePicker>['$props']['onKeydown']>().toEqualTypeOf<
      EmitsToProps<{ keydown: DatePickerEmits['keydown'] }>['onKeydown']
    >();
    expectTypeOf<InstanceType<typeof RangePicker>['$props']['onUpdate:mode']>().toEqualTypeOf<
      EmitsToProps<{ 'update:mode': RangePickerEmits['update:mode'] }>['onUpdate:mode']
    >();
    expectTypeOf<InstanceType<typeof TimePicker>['$props']['onSelect']>().toEqualTypeOf<
      EmitsToProps<{ select: DatePickerEmits['select'] }>['onSelect']
    >();
  });
  it('provides actual scoped slots and nullable DOM handles', () => {
    expectTypeOf<NonNullable<DatePickerSlots['cellRender']>>().toEqualTypeOf<
      (scope: {
        current: DatePickerDate | number | 'am' | 'pm';
        info: import('../interface').CellRenderInfo;
      }) => VNodeChild
    >();
    expectTypeOf<
      Parameters<NonNullable<InstanceType<typeof DatePicker>['$slots']['cellRender']>>[0]['current']
    >().toEqualTypeOf<DatePickerDate | number | 'am' | 'pm'>();
    expectTypeOf<
      InstanceType<typeof DatePicker>['nativeElement']
    >().toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<
      InstanceType<typeof RangePicker>['startInput']
    >().toEqualTypeOf<HTMLInputElement | null>();
    expectTypeOf<
      InstanceType<typeof TimeRangePicker>['endInput']
    >().toEqualTypeOf<HTMLInputElement | null>();
  });
  it('rejects the removed rendering and callback prop shapes', () => {
    expectTypeOf<
      'cellRender' extends keyof DatePickerProps ? true : false
    >().toEqualTypeOf<false>();
    expectTypeOf<'onSelect' extends keyof DatePickerProps ? true : false>().toEqualTypeOf<false>();
    const reject = () => {
      // @ts-expect-error Dynamic cell content is the cellRender slot.
      const render: DatePickerProps = { cellRender: () => null };
      const listener: InstanceType<typeof DatePicker>['$props'] = {
        // @ts-expect-error Native keydown takes one event and uses event.preventDefault().
        onKeydown: (_event: KeyboardEvent, _preventDefault: () => void) => {},
      };
      void render;
      void listener;
    };
    expectTypeOf(reject).toBeFunction();
  });
});
