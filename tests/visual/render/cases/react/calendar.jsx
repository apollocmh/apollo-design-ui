/**
 * React 侧（antd 6.6.4）的 Calendar 视觉用例。与 `vue/calendar.js` 逐条对应。
 *
 * ── 与其它组件的关键差异 ─────────────────────────────────────────────────────
 *
 * Calendar **没有浮层**（面板是**内联**的 `<CalendarHeader/> + <PickerPanel hideHeader/>`）
 * ⇒ 不需要 `getPopupContainer`，也不需要像 date-picker 那样「把浮层搬进截图区域」。
 * 整块日历（header + 面板）就是视觉面。
 *
 * ── 三条必须钉住的东西 ───────────────────────────────────────────────────────
 *
 * 1. 🚨 **`value` 必须落在「过去」**（`CALENDAR_VALUE = '2025-06-15'`）——
 *    `-date-today` 由 `getNow()` 决定，只要「今天」落在当前渲染的**月份网格**
 *    （含上/下月补位格）或**年模式的那一年**里，就会有一格随运行日漂移。
 *    理由与实测见 `../shared.mjs` 的 `CALENDAR_VALUE`。
 * 2. **字体在用例内钉住**（`CALENDAR_BOX_STYLE`）：日历里全是文字。
 * 3. **容器宽度不固定**：`-full` 的日历是 `width: 100%`，三个视口下宽度不同正是要测的面。
 *
 * ── 每个变体命中的「非显然」样式面 ───────────────────────────────────────────
 *
 * | 变体 | 命中的规则 |
 * |---|---|
 * | `basic` | `.{p}-calendar-full .{p}-panel` 的 `display:block / width:100% / text-align:end` + `-body` 的 `padding: paddingXS 0` + 表头 `th` 的行高 |
 * | `mini` | `.{p}-calendar-mini` 的 `borderRadius` + `-content` 的 `height: miniContentHeight` + `th` 的 `lineHeight: controlHeightSM*0.75` |
 * | `year` | `mode="year"` ⇒ 面板退化成**月网格**（`panelMode='month'`）+ header 多一个 `-month-select` |
 * | `week` | `showWeek` ⇒ 多一列周号 + `-date-panel-show-week` 的 body padding |
 * | `disabled` | `validRange` ⇒ 越界格子的 `colorTextDisabled`（**且不含端点**） |
 * | `cell` | `cellRender` ⇒ 只换 `-date-content` 里的内容 |
 * | `full` | `fullCellRender` ⇒ **整格**换掉（`-date-value` 不再产出） |
 * | `header` | `headerRender` ⇒ 整块 header 换掉（两个下拉与模式切换都消失） |
 * | `semantic` | 6 个语义槽的 `styles`（`root`/`header` 归自己，其余 4 个转交面板） |
 * | `rtl` | `.{p}-calendar-rtl { direction: rtl }` |
 */

import { Calendar, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import {
  CALENDAR_BOX_STYLE,
  CALENDAR_CELL_STYLE,
  CALENDAR_CUSTOM_HEADER_STYLE,
  CALENDAR_FULL_CELL_STYLE,
  CALENDAR_SEMANTIC_STYLES,
  CALENDAR_VALID_RANGE,
  CALENDAR_VALUE,
} from '../shared.mjs';

/** 固定字面量（**不用 `dayjs()`** —— 会让截图随运行日变化）。 */
const V = dayjs(CALENDAR_VALUE);

const box = (children) => <div style={CALENDAR_BOX_STYLE}>{children}</div>;

export default {
  /** 默认：全屏月历（`-full`）+ 面板 `width: 100%`。 */
  basic: () => box(<Calendar value={V} />),

  /** `fullscreen={false}` ⇒ `-mini`：圆角、内容高度、控件降为 `small`。 */
  mini: () => box(<Calendar value={V} fullscreen={false} />),

  /** `mode="year"` ⇒ 面板退化成月网格；header 多一个 `-month-select`。 */
  year: () => box(<Calendar value={V} mode="year" />),

  /** `showWeek` ⇒ 多一列周号 + body 的 padding 变宽。 */
  week: () => box(<Calendar value={V} showWeek />),

  /** `validRange` ⇒ 越界格子禁用（端点**不**禁用）。 */
  disabled: () =>
    box(<Calendar value={V} validRange={CALENDAR_VALID_RANGE.map((d) => dayjs(d))} />),

  /** `cellRender` ⇒ 只换格子**内容**。 */
  cell: () => box(<Calendar value={V} cellRender={() => <span style={CALENDAR_CELL_STYLE} />} />),

  /** `fullCellRender` ⇒ 换**整个**格子。 */
  full: () =>
    box(
      <Calendar
        value={V}
        fullCellRender={(date) => <div style={CALENDAR_FULL_CELL_STYLE}>{date.date()}</div>}
      />,
    ),

  /** `headerRender` ⇒ 整块 header 换掉。 */
  header: () =>
    box(
      <Calendar
        value={V}
        headerRender={({ value }) => (
          <div style={CALENDAR_CUSTOM_HEADER_STYLE}>Custom header — {value.format('YYYY-MM')}</div>
        )}
      />,
    ),

  /** 6 个语义槽（**可见样式**，否则与 `basic` 逐字节相同 ⇒ 空转）。 */
  semantic: () => box(<Calendar value={V} styles={CALENDAR_SEMANTIC_STYLES} />),

  /** RTL：根上多 `-rtl` 类，样式里真的有 `direction: rtl`。 */
  rtl: () => <ConfigProvider direction="rtl">{box(<Calendar value={V} />)}</ConfigProvider>,
};
