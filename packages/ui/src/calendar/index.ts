/**
 * Calendar 的公共导出。
 *
 * 与 antd 的 es/calendar/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import CalendarComponent from './Calendar.vue';

/** Calendar 组件。注册名 `ACalendar`（COMPONENT-RULES.md 规则 R2）。 */
export const Calendar = withInstall(CalendarComponent);

export default Calendar;

export type {
  CalendarCellRender,
  CalendarCellRenderInfo,
  CalendarDate,
  CalendarEmits,
  CalendarExpose,
  CalendarFullCellRender,
  CalendarHeaderRender,
  CalendarHeaderRenderConfig,
  CalendarMode,
  CalendarProps,
  CalendarSemanticClassNames,
  CalendarSemanticStyles,
  CalendarSemanticValue,
  CalendarSlots,
  SelectInfo,
} from './interface';

export { genCalendarStyle, genCalendarTokenDecls } from './style';
export type { ComponentToken as CalendarComponentToken } from './style/token';
export {
  CALENDAR_DERIVED,
  prepareComponentToken as prepareCalendarComponentToken,
} from './style/token';
