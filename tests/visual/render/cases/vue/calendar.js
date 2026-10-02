/**
 * Vue 侧（@apollo-design/ui）的 Calendar 视觉用例。与 `react/calendar.jsx` 逐条对应。
 *
 * ⚠️ 本文件**不需要 `getPopupContainer`** —— Calendar 没有浮层
 * （面板是内联的 `<CalendarHeader/> + <PickerPanel hideHeader/>`）。
 *
 * ⚠️ 三条与 React 侧逐字相同的约定（理由见 `react/calendar.jsx` 的文件头）：
 * ① `CALENDAR_VALUE` 落在**过去**（否则 `-date-today` 会让基线随运行日漂移）；
 * ② **字体在用例内钉住**；③ 容器宽度不固定（`-full` 是 `width: 100%`）。
 *
 * ⚠️ 所有 vnode **在用例函数内新建**（vnode 是一次性的 —— 复用同一个实例会撞
 * 「VNode is already mounted」）。`dayjs` 对象不是 vnode，可以复用。
 */

import { Calendar, ConfigProvider } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { h } from 'vue';
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

const box = (children) => h('div', { style: CALENDAR_BOX_STYLE }, [children]);

export default {
  /** 默认：全屏月历（`-full`）+ 面板 `width: 100%`。 */
  basic: () => box(h(Calendar, { value: V })),

  /** `fullscreen={false}` ⇒ `-mini`：圆角、内容高度、控件降为 `small`。 */
  mini: () => box(h(Calendar, { value: V, fullscreen: false })),

  /** `mode="year"` ⇒ 面板退化成月网格；header 多一个 `-month-select`。 */
  year: () => box(h(Calendar, { value: V, mode: 'year' })),

  /** `showWeek` ⇒ 多一列周号 + body 的 padding 变宽。 */
  week: () => box(h(Calendar, { value: V, showWeek: true })),

  /** `validRange` ⇒ 越界格子禁用（端点**不**禁用）。 */
  disabled: () =>
    box(h(Calendar, { value: V, validRange: CALENDAR_VALID_RANGE.map((d) => dayjs(d)) })),

  /** `cellRender` ⇒ 只换格子**内容**。 */
  cell: () =>
    box(h(Calendar, { value: V, cellRender: () => h('span', { style: CALENDAR_CELL_STYLE }) })),

  /** `fullCellRender` ⇒ 换**整个**格子。 */
  full: () =>
    box(
      h(Calendar, {
        value: V,
        fullCellRender: (date) =>
          h('div', { style: CALENDAR_FULL_CELL_STYLE }, String(date.date())),
      }),
    ),

  /** `headerRender` ⇒ 整块 header 换掉。 */
  header: () =>
    box(
      h(Calendar, {
        value: V,
        headerRender: ({ value }) =>
          h(
            'div',
            { style: CALENDAR_CUSTOM_HEADER_STYLE },
            `Custom header — ${value.format('YYYY-MM')}`,
          ),
      }),
    ),

  /** 6 个语义槽（**可见样式**，否则与 `basic` 逐字节相同 ⇒ 空转）。 */
  semantic: () => box(h(Calendar, { value: V, styles: CALENDAR_SEMANTIC_STYLES })),

  /** RTL：根上多 `-rtl` 类，样式里真的有 `direction: rtl`。 */
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, { default: () => box(h(Calendar, { value: V })) }),
};
