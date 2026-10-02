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

// TODO(G2): export type { CalendarProps, CalendarRef, ... } from './interface';
// TODO(G4): export { genCalendarStyle } from './style';
// TODO(G4): export type { ComponentToken as CalendarComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareCalendarComponentToken } from './style/token';
