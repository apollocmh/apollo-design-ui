/** Calendar's date/mode controls; the parent owns accepted Calendar state. */
import type { PickerLangLocale } from '@apollo-design/locale';
import dayjs from 'dayjs';
import {
  type ComponentObjectPropsOptions,
  computed,
  defineComponent,
  h,
  type PropType,
  provide,
  ref,
} from 'vue';
import { dayjsConfig as config } from '../../date-picker/hooks/dayjs-config';
import { formItemInputContextKey, useFormItemInputContext } from '../../form/context';
import { RadioButton, RadioGroup } from '../../radio';
import type { RadioValue } from '../../radio/interface';
import { Select } from '../../select';
import type { CalendarDate, CalendarMode } from '../interface';

/** @internal Nameable tuple metadata; deliberately excluded from every public index. */
export type CalendarValidRangeMetadata = Pick<
  Exclude<
    ComponentObjectPropsOptions<{ value: [CalendarDate, CalendarDate] }>['value'],
    PropType<[CalendarDate, CalendarDate]> | null | undefined
  >,
  'type' | 'default' | 'validator'
>;

export const calendarValidRangeProp: CalendarValidRangeMetadata = {
  type: null,
  default: undefined,
  validator: (value: unknown) =>
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((item: unknown) => dayjs.isDayjs(item)),
};

export const CalendarHeader = defineComponent({
  name: 'ACalendarHeader',
  props: {
    prefixCls: { type: String, required: true },
    value: { type: Object as PropType<CalendarDate>, required: true },
    validRange: calendarValidRangeProp,
    locale: { type: Object as PropType<PickerLangLocale>, required: true },
    mode: { type: String as PropType<CalendarMode>, required: true },
    fullscreen: { type: Boolean, default: true },
  },
  emits: {
    change: (_date: CalendarDate, _source: 'year' | 'month') => true,
    modeChange: (_mode: CalendarMode) => true,
  },
  setup(props, { emit }) {
    const divRef = ref<HTMLDivElement | null>(null);
    const formItemInputContext = useFormItemInputContext();
    provide(
      formItemInputContextKey,
      computed(() => ({ ...formItemInputContext.value, isFormItemInput: false })),
    );

    const selectYear = (year: number) => {
      let next = config.setYear(props.value, year);
      if (props.validRange) {
        const [start, end] = props.validRange;
        const month = config.getMonth(next);
        if (year === config.getYear(end) && month > config.getMonth(end))
          next = config.setMonth(next, config.getMonth(end));
        if (year === config.getYear(start) && month < config.getMonth(start))
          next = config.setMonth(next, config.getMonth(start));
      }
      emit('change', next, 'year');
    };
    const modeSwitch = () =>
      h(
        RadioGroup,
        {
          value: props.mode,
          class: `${props.prefixCls}-mode-switch`,
          ...(props.fullscreen ? {} : { size: 'small' as const }),
          'onUpdate:value': (value: RadioValue) => {
            if (value === 'month' || value === 'year') emit('modeChange', value);
          },
        },
        () => [
          h(RadioButton, { value: 'month' }, () => props.locale.month),
          h(RadioButton, { value: 'year' }, () => props.locale.year),
        ],
      );

    return () => {
      const year = config.getYear(props.value);
      const month = config.getMonth(props.value);
      const firstYear = props.validRange ? config.getYear(props.validRange[0]) : year - 10;
      const lastYear = props.validRange ? config.getYear(props.validRange[1]) : year + 9;
      const suffix = props.locale.year === '年' ? '年' : '';
      const years = Array.from({ length: lastYear - firstYear + 1 }, (_, offset) => ({
        value: firstYear + offset,
        label: `${firstYear + offset}${suffix}`,
      }));
      const range = props.validRange;
      const firstMonth = range && config.getYear(range[0]) === year ? config.getMonth(range[0]) : 0;
      const lastMonth = range && config.getYear(range[1]) === year ? config.getMonth(range[1]) : 11;
      const labels =
        props.locale.shortMonths ?? config.locale.getShortMonths?.(props.locale.locale) ?? [];
      const months = Array.from({ length: lastMonth - firstMonth + 1 }, (_, offset) => ({
        value: firstMonth + offset,
        label: labels[firstMonth + offset] ?? '',
      }));
      const shared = {
        getPopupContainer: (trigger: HTMLElement) => divRef.value ?? trigger,
        ...(props.fullscreen ? {} : { size: 'small' as const }),
      };
      return h('div', { ref: divRef, class: `${props.prefixCls}-header` }, [
        h(Select, {
          ...shared,
          class: `${props.prefixCls}-year-select`,
          'aria-label': props.locale.year,
          value: year,
          options: years,
          'onUpdate:value': (value) => {
            if (typeof value === 'number') selectYear(value);
          },
        }),
        props.mode === 'month'
          ? h(Select, {
              ...shared,
              class: `${props.prefixCls}-month-select`,
              'aria-label': props.locale.month,
              value: month,
              options: months,
              'onUpdate:value': (value) => {
                if (typeof value === 'number')
                  emit('change', config.setMonth(props.value, value), 'month');
              },
            })
          : null,
        modeSwitch(),
      ]);
    };
  },
});
export default CalendarHeader;
