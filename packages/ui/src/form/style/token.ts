/**
 * Form 的 Component Token（antd `es/form/style/index.js:458` 的 **10 个字段**）。
 *
 * 契约来源：antd 6.6.4 `prepareComponentToken` 逐字对拍
 * （docs/analysis/form.md §7）。取值推导见各字段注释（构建期派生实值写死，
 * 与 cascader 的 optionPadding 同判）。
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
  };
}
