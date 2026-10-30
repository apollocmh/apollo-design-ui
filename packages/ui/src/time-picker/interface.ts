/**
 * TimePicker public Vue contracts. Both entries have a fixed time axis; value,
 * open and pickerValue use the accepted-model contracts of the shared picker.
 * Dynamic content is supplied through named slots and notifications use emits.
 */
import type {
  DatePickerDate,
  DatePickerEmits,
  DatePickerExpose,
  DatePickerProps,
  DatePickerSemanticClassNames,
  DatePickerSemanticStyles,
  DatePickerSemanticValue,
  DatePickerSlots,
  PickerCommonProps,
  RangePickerEmits,
  RangePickerExpose,
  RangePickerProps,
} from '../date-picker/interface';

export type TimePickerValue = DatePickerDate | null;
export type TimePickerSemanticClassNames = DatePickerSemanticClassNames;
export type TimePickerSemanticStyles = DatePickerSemanticStyles;
export type TimePickerSemanticValue<T, Props = PickerCommonProps> = DatePickerSemanticValue<
  T,
  Props
>;
export type {
  PickerPopupSemanticClassNames as TimePickerPopupSemanticClassNames,
  PickerPopupSemanticStyles as TimePickerPopupSemanticStyles,
} from '../date-picker/interface';

/** No calendar mode switching, multiple selection or date navigation controls. */
export interface TimePickerProps
  extends Omit<
    DatePickerProps,
    | 'picker'
    | 'showTime'
    | 'mode'
    | 'multiple'
    | 'maxTagCount'
    | 'removeIcon'
    | 'showWeek'
    | 'prevIcon'
    | 'nextIcon'
    | 'superPrevIcon'
    | 'superNextIcon'
    | 'value'
    | 'defaultValue'
    | 'classNames'
    | 'styles'
  > {
  value?: TimePickerValue;
  defaultValue?: TimePickerValue;
  /** The time axis only supports single selection. */
  multiple?: false;
  classNames?: TimePickerSemanticValue<TimePickerSemanticClassNames>;
  styles?: TimePickerSemanticValue<TimePickerSemanticStyles>;
}

export interface TimeRangePickerProps
  extends Omit<
    RangePickerProps,
    | 'picker'
    | 'showTime'
    | 'mode'
    | 'showWeek'
    | 'prevIcon'
    | 'nextIcon'
    | 'superPrevIcon'
    | 'superNextIcon'
    | 'classNames'
    | 'styles'
  > {
  classNames?: TimePickerSemanticValue<TimePickerSemanticClassNames>;
  styles?: TimePickerSemanticValue<TimePickerSemanticStyles>;
}

/** The fixed time axis has no mode model; browsing notifications remain available. */
export type TimePickerEmits = Omit<DatePickerEmits, 'update:mode'>;
export type TimeRangePickerEmits = Omit<RangePickerEmits, 'update:mode'>;
/** Single time inputs have no tag list or range separator. */
export type TimePickerSlots = Omit<DatePickerSlots, 'tagRender' | 'separator'>;
export type TimeRangePickerSlots = Omit<DatePickerSlots, 'tagRender'>;
export type TimePickerExpose = DatePickerExpose;
export type TimeRangePickerExpose = RangePickerExpose;
export type { TimePickerLocale } from '@apollo-design/locale';
export type {
  CellRenderInfo as TimePickerCellRenderInfo,
  NoUndefinedRangeValue as TimeNoUndefinedRangeValue,
  RangeValue as TimeRangeValue,
  RangeValueDate as TimeRangeValueDate,
  ValueDate as TimePickerValueDate,
} from '../date-picker/interface';
