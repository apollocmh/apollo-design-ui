/**
 * Vue 侧（@apollo-design/ui）的 TimePicker 视觉用例。与 `react/time-picker.jsx` 逐条对应。
 *
 * ── 🚨 浮层怎么进截图区域（与 `date-picker` 同判）──────────────────────────────
 *
 * 截图目标是 `#stage`，而 rc-trigger 系的浮层默认 **portal 到 `document.body`**
 * ⇒ 不在 `#stage` 里 ⇒ **拍不到**。TimePicker 的核心视觉面**就是时间面板**
 * （三列 + 选中态 + 滚动位置），不能只拍触发器。
 * 解法与 `date-picker` 完全相同：两侧都传 **`getPopupContainer`** 指向用例自己的盒子
 * （`position: relative`）⇒ 浮层落进 `#stage`，与触发器一起被拍下来。
 *
 * ⚠️ **不用** `_InternalPanelDoNotUseOrYouWillBeFired`：本仓**未落地** `PurePanel`
 * （`README.md` §5 第 1 条）—— 而且它的 holder 用实测高度撑高，两侧撑不出同一高度
 * ⇒ `#stage` 尺寸不等 ⇒ pixelmatch 直接判尺寸不匹配。
 *
 * ── 两条与其它组件同源的约定 ────────────────────────────────────────────────
 *
 * 1. **字体钉具体值**（`DATE_PICKER_BOX_STYLE`，与 date-picker 共用）。
 * 2. **时间一律用固定字面量**（`shared.mjs` 的 `TIME_PICKER_*`）—— 用 `dayjs()` 会 flaky。
 *
 * ── 🚨 三条本组件特有的判据 ────────────────────────────────────────────────
 *
 * 1. **`defaultOpenValue` 是必须的** —— 时间面板的选中格与滚动位置全靠它；
 *    不给的话三列滚到 `00:00:00` 且一格不选中（核心视觉面一格没测）。
 * 2. **不写 `use12Hours` / `minuteStep` 变体** —— 本仓这两条顶层时间 props 静默失效
 *    （README §5 第 5 条 / PITFALLS 317）⇒ 必然是**空转变体**。
 *    改用 `format: 'HH:mm'`（两列）作「列数变化」的可测差异。
 * 3. **范围版的两个面板** —— 与 date-picker 的双面板不同，这里是**两个独立的时间面板**
 *    （各自三列），间距与对齐是独立的一段布局。
 */

import { TimePicker, TimeRangePicker } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { h } from 'vue';
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

/** `getPopupContainer` 的落点（见文件头）。 */
let holderEl = null;

/** 用例盒子：`position: relative` 来自 `DATE_PICKER_BOX_STYLE`（浮层的包含块）。 */
const box = (children, minHeight) =>
  h(
    'div',
    {
      ref: (el) => {
        holderEl = el;
      },
      style: { ...DATE_PICKER_BOX_STYLE, minHeight: `${minHeight}px` },
    },
    [children],
  );

/** 触发元素 + **内联的**浮层（`open` 受控静态帧 + `getPopupContainer`）。 */
const picker = (props, minHeight) =>
  box(h(TimePicker, { ...props, open: true, getPopupContainer: () => holderEl }), minHeight);

const rangePicker = (props, minHeight) =>
  box(h(TimeRangePicker, { ...props, open: true, getPopupContainer: () => holderEl }), minHeight);

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
        renderExtraFooter: () => h('button', { type: 'button' }, 'OK'),
      },
      420,
    ),

  /** 范围有值：两个输入框 + 分隔符 + **两个独立的时间面板**。 */
  range: () => rangePicker({ defaultValue: RANGE, format: TIME_PICKER_FORMAT }, 380),

  /** 变体 / 尺寸 / 状态 / 禁用 / 前后缀（**不开浮层**）。 */
  variants: () =>
    h('div', { style: DATE_PICKER_BOX_STYLE }, [
      h(
        'div',
        { style: DATE_PICKER_VARIANTS_STYLE },
        TIME_PICKER_VARIANTS.map(({ label, props }) =>
          h('div', { key: label, style: DATE_PICKER_VARIANT_ROW_STYLE }, [
            h('span', { style: DATE_PICKER_VARIANT_LABEL_STYLE }, label),
            h(TimePicker, { ...props, defaultValue: VALUE, format: TIME_PICKER_FORMAT }),
          ]),
        ),
      ),
    ]),
};
