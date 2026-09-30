/**
 * React 侧（antd 6.6.4）的 DatePicker 视觉用例。与 `vue/date-picker.js` 逐条对应。
 *
 * 🚨 **浮层进截图区域的做法与 Vue 侧完全对称**（手写 holder + `getPopupContainer`）——
 * 理由、以及为什么**不**用 `DatePicker._InternalPanelDoNotUseOrYouWillBeFired`，
 * 见 `vue/date-picker.js` 的文件头。
 *
 * ⚠️ 这里用的是 **`ref` 回调**而不是 `useRef`：用例是**普通函数**（不是组件），
 * 调不了 hook。
 */

import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import {
  DATE_PICKER_BOX_STYLE,
  DATE_PICKER_DATETIME_FORMAT,
  DATE_PICKER_MULTIPLE,
  DATE_PICKER_PANEL_ANCHOR,
  DATE_PICKER_VALUE,
  DATE_PICKER_VARIANT_LABEL_STYLE,
  DATE_PICKER_VARIANT_ROW_STYLE,
  DATE_PICKER_VARIANTS,
  DATE_PICKER_VARIANTS_STYLE,
} from '../shared.mjs';

/** `getPopupContainer` 的落点（见文件头）。 */
let holderEl = null;

const box = (children, minHeight) => (
  <div
    ref={(el) => {
      holderEl = el;
    }}
    style={{ ...DATE_PICKER_BOX_STYLE, minHeight: `${minHeight}px` }}
  >
    {children}
  </div>
);

const picker = (props, minHeight) =>
  box(<DatePicker {...props} open getPopupContainer={() => holderEl} />, minHeight);

/** 面板锚定（`defaultPickerValue`）—— 否则空值面板显示的是「今天」，截图会 flaky。 */
const ANCHOR = dayjs(DATE_PICKER_PANEL_ANCHOR);

export default {
  basic: () => picker({ defaultPickerValue: ANCHOR }, 420),

  value: () => picker({ defaultValue: dayjs(DATE_PICKER_VALUE), defaultPickerValue: ANCHOR }, 420),

  datetime: () =>
    picker(
      {
        defaultValue: dayjs(DATE_PICKER_VALUE),
        defaultPickerValue: ANCHOR,
        showTime: true,
        format: DATE_PICKER_DATETIME_FORMAT,
      },
      560,
    ),

  month: () => picker({ picker: 'month', defaultPickerValue: ANCHOR }, 380),

  year: () => picker({ picker: 'year', defaultPickerValue: ANCHOR }, 380),

  multiple: () =>
    picker(
      {
        multiple: true,
        defaultValue: DATE_PICKER_MULTIPLE.map((value) => dayjs(value)),
        defaultPickerValue: ANCHOR,
      },
      480,
    ),

  /** 一排触发器（**不开浮层**）：变体 / 尺寸 / 状态 / 禁用 / 前后缀。 */
  variants: () =>
    box(
      <div style={DATE_PICKER_VARIANTS_STYLE}>
        {DATE_PICKER_VARIANTS.map(({ label, props }) => (
          <div key={label} style={DATE_PICKER_VARIANT_ROW_STYLE}>
            <span style={DATE_PICKER_VARIANT_LABEL_STYLE}>{label}</span>
            <DatePicker {...props} defaultValue={dayjs(DATE_PICKER_VALUE)} />
          </div>
        ))}
      </div>,
      560,
    ),
};
