/**
 * Vue 侧（@apollo-design/ui）的 DatePicker 视觉用例。与 `react/date-picker.jsx` 逐条对应。
 *
 * ── 🚨 浮层怎么进截图区域（本组件与其它组件**最大的不同**）────────────────────
 *
 * 截图目标是 `#stage`，而 rc-trigger 系的浮层默认 **portal 到 `document.body`**
 * ⇒ 不在 `#stage` 里 ⇒ **拍不到**。其它组件（dropdown / select / tooltip）的做法是
 * 「只拍触发器 + 用 `open` 钉住受控静态帧」，面板内容根本进不了像素比对。
 *
 * date-picker 的核心视觉面**就是面板**，不能这么办。解法：给两侧都传
 * **`getPopupContainer`** 指向用例自己的盒子（`position: relative`）
 * ⇒ 浮层落进 `#stage`，与触发器一起被拍下来。
 *
 * ⚠️ 为什么**不**用上游的 `DatePicker._InternalPanelDoNotUseOrYouWillBeFired`
 * （antd 的 `genPurePanel`）：它的 holder 用 **`paddingBottom: <实测浮层高>`** 撑高
 * （`_util/PurePanel.js:78-82`），而 Vue 侧没有对应物、撑不出同一个高度
 * ⇒ 两侧 `#stage` 尺寸不等 ⇒ pixelmatch 直接判尺寸不匹配。
 * 这里**两侧都手写同一个 holder**，输入完全对称（与 `cascader` 的「面板绝对定位」
 * 同一思路：把「浮层进画面」这件事在用例层解决，而不是靠组件的不公开出口）。
 *
 * ── 其它两条与其它组件同源的约定 ────────────────────────────────────────────
 *
 * 1. **字体钉具体值**（`DATE_PICKER_BOX_STYLE`）—— 面板是 `resetFont: false`，靠继承。
 * 2. **日期一律用固定字面量**（`shared.mjs` 的 `DATE_PICKER_*`）——
 *    用 `dayjs()` 会让截图随运行日变化。
 */

import { DatePicker, RangePicker } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { h } from 'vue';
import {
  DATE_PICKER_BOX_STYLE,
  DATE_PICKER_DATETIME_FORMAT,
  DATE_PICKER_MULTIPLE,
  DATE_PICKER_PANEL_ANCHOR,
  DATE_PICKER_RANGE,
  DATE_PICKER_VALUE,
  DATE_PICKER_VARIANT_LABEL_STYLE,
  DATE_PICKER_VARIANT_ROW_STYLE,
  DATE_PICKER_VARIANTS,
  DATE_PICKER_VARIANTS_STYLE,
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
  box(
    h(DatePicker, {
      ...props,
      open: true,
      getPopupContainer: () => holderEl,
    }),
    minHeight,
  );

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
      h(
        'div',
        { style: DATE_PICKER_VARIANTS_STYLE },
        DATE_PICKER_VARIANTS.map(({ label, props }) =>
          h('div', { style: DATE_PICKER_VARIANT_ROW_STYLE }, [
            h('span', { style: DATE_PICKER_VARIANT_LABEL_STYLE }, [label]),
            h(DatePicker, { ...props, defaultValue: dayjs(DATE_PICKER_VALUE) }),
          ]),
        ),
      ),
      560,
    ),

  // ---------------------------------------------------------------- 范围（S5）
  /** 范围：两个输入框 + 分隔符 + **并排两个面板**（`-range-wrapper` / `-range-arrow`）。 */
  range: () =>
    box(
      h(RangePicker, {
        open: true,
        defaultPickerValue: ANCHOR,
        getPopupContainer: () => holderEl,
      }),
      520,
    ),

  /** 范围有值：两端字段文本 + 两个面板各自的「选中 / 区间内 / 端点」格子态。 */
  'range-value': () =>
    box(
      h(RangePicker, {
        open: true,
        defaultValue: DATE_PICKER_RANGE.map((value) => dayjs(value)),
        defaultPickerValue: ANCHOR,
        getPopupContainer: () => holderEl,
      }),
      520,
    ),
};
