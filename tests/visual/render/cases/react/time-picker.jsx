/**
 * React 侧（antd 6.6.4）的 TimePicker 视觉用例。与 `vue/time-picker.js` 逐条对应。
 *
 * 🚨 **浮层进截图区域的做法与 Vue 侧完全对称**（手写 holder + `getPopupContainer`）——
 * 理由见 `vue/time-picker.js` 的文件头（与 `date-picker` 同判：时间轴的核心视觉面
 * **就是面板**，只拍触发器等于没测）。
 *
 * ⚠️ 这里用的是 **`ref` 回调**而不是 `useRef`：用例是**普通函数**（不是组件），调不了 hook。
 *
 * ⚠️ **不写 `use12Hours` / `minuteStep` 变体** —— 本仓这两条顶层时间 props 静默失效
 * （`README.md` §5 第 5 条 / PITFALLS 317）⇒ 写进来会得到一个**两侧都不生效**的空转变体。
 */

import { TimePicker } from 'antd';
import dayjs from 'dayjs';
import {
  DATE_PICKER_BOX_STYLE,
  DATE_PICKER_VARIANT_LABEL_STYLE,
  DATE_PICKER_VARIANT_ROW_STYLE,
  DATE_PICKER_VARIANTS_STYLE,
  TIME_PICKER_FORMAT,
  TIME_PICKER_RANGE,
  TIME_PICKER_VALUE,
  TIME_PICKER_VARIANTS,
} from '../shared.mjs';

/**
 * 🚨 `RangePicker` **不是 antd 的顶层导出** —— 必须走静态成员 `TimePicker.RangePicker`。
 */
const { RangePicker } = TimePicker;

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
  box(<TimePicker {...props} open getPopupContainer={() => holderEl} />, minHeight);

const rangePicker = (props, minHeight) =>
  box(<RangePicker {...props} open getPopupContainer={() => holderEl} />, minHeight);

const VALUE = dayjs(TIME_PICKER_VALUE, TIME_PICKER_FORMAT);
const RANGE = TIME_PICKER_RANGE.map((t) => dayjs(t, TIME_PICKER_FORMAT));

export default {
  /** 单值有值（**受控 `value`**）—— 面板的选中态 + 滚动位置由它决定。 */
  value: () => picker({ value: VALUE, format: TIME_PICKER_FORMAT }, 380),

  /** 两列（`format: 'HH:mm'`）—— 与 `value` 的三列形成**可测差异**。 */
  'no-seconds': () => picker({ value: VALUE, format: 'HH:mm' }, 380),

  /** 页脚（`renderExtraFooter`）—— 上游 `addon` 的替代品。 */
  footer: () =>
    picker(
      {
        value: VALUE,
        format: TIME_PICKER_FORMAT,
        renderExtraFooter: () => <button type="button">OK</button>,
      },
      420,
    ),

  /** 范围有值：两个输入框 + 分隔符 + **两个独立的时间面板**。 */
  range: () => rangePicker({ defaultValue: RANGE, format: TIME_PICKER_FORMAT }, 380),

  /** 变体 / 尺寸 / 状态 / 禁用 / 前后缀（**不开浮层**）。 */
  variants: () => (
    <div style={DATE_PICKER_BOX_STYLE}>
      <div style={DATE_PICKER_VARIANTS_STYLE}>
        {TIME_PICKER_VARIANTS.map(({ label, props }) => (
          <div key={label} style={DATE_PICKER_VARIANT_ROW_STYLE}>
            <span style={DATE_PICKER_VARIANT_LABEL_STYLE}>{label}</span>
            <TimePicker {...props} defaultValue={VALUE} format={TIME_PICKER_FORMAT} />
          </div>
        ))}
      </div>
    </div>
  ),
};
