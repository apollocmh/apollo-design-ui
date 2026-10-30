/** Calendar's Vue public models, scoped content and semantic presentation. */
import type { PickerLocale } from '@apollo-design/locale';
import type { PanelCellRenderInfo } from '@apollo-design/picker';
import type { Dayjs } from 'dayjs';
import type { CSSProperties, VNodeChild } from 'vue';

export type CalendarDate = Dayjs;
/** Month shows dates; year shows a grid of months. */
export type CalendarMode = 'year' | 'month';

export interface SelectInfo {
  source: 'year' | 'month' | 'date' | 'customize';
}

/** Header commands request the same changes as the built-in controls. */
export interface CalendarHeaderRenderConfig {
  value: CalendarDate;
  type: CalendarMode;
  onChange: (date: CalendarDate) => void;
  onTypeChange: (type: CalendarMode) => void;
}

export type CalendarCellRenderInfo = PanelCellRenderInfo;
export interface CalendarCellSlotProps {
  current: CalendarDate;
  info: CalendarCellRenderInfo;
}

/** Root/header belong to Calendar; the other targets also reach PickerPanel. */
export interface CalendarSemanticClassNames {
  root?: string;
  header?: string;
  body?: string;
  content?: string;
  item?: string;
  itemContent?: string;
}
export interface CalendarSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  body?: CSSProperties;
  content?: CSSProperties;
  item?: CSSProperties;
  itemContent?: CSSProperties;
}
export type CalendarSemanticValue<T, Props> = T | ((info: { props: Props }) => T | undefined);

export interface CalendarProps {
  value?: CalendarDate;
  /** Initialization only; absent value/defaultValue starts at today. */
  defaultValue?: CalendarDate;
  mode?: CalendarMode;
  /** Inclusive bounds, combined with disabledDate by OR. */
  validRange?: [CalendarDate, CalendarDate];
  disabledDate?: (date: CalendarDate) => boolean;
  showWeek?: boolean;
  fullscreen?: boolean;
  /** Defaults to the current root prefix plus 'picker'. */
  prefixCls?: string;
  classNames?: CalendarSemanticValue<CalendarSemanticClassNames, CalendarProps>;
  styles?: CalendarSemanticValue<CalendarSemanticStyles, CalendarProps>;
  /** Deeply merged with the current Calendar locale slice. */
  locale?: PickerLocale;
}

/** Value update -> crossing panelChange -> change -> select; same day only selects. */
export interface CalendarEmits {
  change: (date: CalendarDate) => void;
  'update:value': (date: CalendarDate) => void;
  panelChange: (date: CalendarDate, mode: CalendarMode) => void;
  'update:mode': (mode: CalendarMode) => void;
  select: (date: CalendarDate, info: SelectInfo) => void;
}

export type CalendarSlots = {
  headerRender?: (scope: CalendarHeaderRenderConfig) => VNodeChild;
  cellRender?: (scope: CalendarCellSlotProps) => VNodeChild;
  fullCellRender?: (scope: CalendarCellSlotProps) => VNodeChild;
};
export interface CalendarExpose {
  readonly nativeElement: HTMLDivElement | null;
}
export type { PanelCellRenderInfo as CalendarPanelCellRenderInfo };
