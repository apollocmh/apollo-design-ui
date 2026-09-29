/**
 * Form 的 Component Token（antd `es/form/style/index.js` 的 `prepareComponentToken`）。
 *
 * 契约来源：antd 6.6.4 `prepareComponentToken` **逐字对拍**
 * （`node -e "…es/form/style/index.js…"`，取值列表见 `docs/analysis/form.md` §7）。
 * 构建期派生实值写死（cascader 的 optionPadding 同判）。
 *
 * ⚠️ **11 个字段**，不是 10 个：`inlineItemMarginBottom` 容易被漏
 * （它只在 `-inline` 布局规则里被消费）。漏掉时 `genFormStyle` 里那条
 * `margin-inline-end`/`margin-bottom` 会退化成继承值 —— 静态 CSS 看不出错，
 * 只有 L6 的 inline 用例能发现（PITFALLS 170 同族）。
 */

import { getDesignToken } from '@apollo-design/theme';

export interface ComponentToken {
  labelRequiredMarkColor: string;
  labelColor: string;
  labelFontSize: number;
  labelHeight: number;
  verticalLabelHeight: number | 'auto';
  labelColonMarginInlineStart: number;
  labelColonMarginInlineEnd: number;
  itemMarginBottom: number;
  verticalLabelPadding: string;
  verticalLabelMargin: number;
  inlineItemMarginBottom: number;
}

/** antd prepareComponentToken 逐字（light 主题判定值）。 */
export function prepareComponentToken(): ComponentToken {
  const t = getDesignToken() as {
    colorError: string;
    colorTextHeading: string;
    fontSize: number;
    controlHeight: number;
    marginXXS: number;
    marginXS: number;
    marginLG: number;
    paddingXS: number;
  };
  return {
    labelRequiredMarkColor: t.colorError, // #ff4d4f
    labelColor: t.colorTextHeading, // rgba(0,0,0,0.88)
    labelFontSize: t.fontSize, // 14
    labelHeight: t.controlHeight, // 32
    verticalLabelHeight: 'auto', // labelHeight ?? 'auto'（无 override 时 auto）
    labelColonMarginInlineStart: t.marginXXS / 2, // 4/2 = 2
    labelColonMarginInlineEnd: t.marginXS, // 8
    itemMarginBottom: t.marginLG, // 24
    verticalLabelPadding: `0 0 ${t.paddingXS}px`, // 0 0 8px
    verticalLabelMargin: 0,
    inlineItemMarginBottom: 0,
  };
}
