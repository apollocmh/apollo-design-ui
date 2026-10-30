import { describe, expectTypeOf, it } from 'vitest';
import type {
  TimePickerEmits,
  TimePickerProps,
  TimePickerSlots,
  TimeRangePickerEmits,
  TimeRangePickerProps,
  TimeRangePickerSlots,
} from '../interface';
import type TimePicker from '../TimePicker.vue';
import type TimeRangePicker from '../TimeRangePicker.vue';

describe('TimePicker current native declarations', () => {
  it('has only the actual value, open and browsing models', () => {
    expectTypeOf<TimePickerProps>().not.toHaveProperty('mode');
    expectTypeOf<TimePickerProps>().not.toHaveProperty('defaultMode');
    expectTypeOf<TimeRangePickerProps>().not.toHaveProperty('mode');
    expectTypeOf<TimeRangePickerProps>().not.toHaveProperty('defaultMode');
    expectTypeOf<TimePickerEmits>().not.toHaveProperty('update:mode');
    expectTypeOf<TimeRangePickerEmits>().not.toHaveProperty('update:mode');
    expectTypeOf<InstanceType<typeof TimePicker>['$props']>().not.toHaveProperty('onUpdate:mode');
    expectTypeOf<InstanceType<typeof TimeRangePicker>['$props']>().not.toHaveProperty('mode');
  });
  it('describes the actual supported slots and nullable handles', () => {
    expectTypeOf<keyof TimePickerSlots>().toEqualTypeOf<
      | 'panelRender'
      | 'extraFooter'
      | 'cellRender'
      | 'prefix'
      | 'suffixIcon'
      | 'clearIcon'
      | 'presetRender'
    >();
    expectTypeOf<keyof TimeRangePickerSlots>().toEqualTypeOf<keyof TimePickerSlots | 'separator'>();
    expectTypeOf<
      InstanceType<typeof TimePicker>['nativeElement']
    >().toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<
      InstanceType<typeof TimeRangePicker>['endInput']
    >().toEqualTypeOf<HTMLInputElement | null>();
    const negative = () => {
      // @ts-expect-error A fixed time axis cannot become a calendar mode switcher.
      const mode: TimePickerProps = { mode: 'month' };
      // @ts-expect-error Date navigation controls are not rendered by a time input.
      const calendar: TimeRangePickerProps = { showWeek: true };
      void mode;
      void calendar;
    };
    expectTypeOf(negative).toBeFunction();
  });
});
