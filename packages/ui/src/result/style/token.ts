/**
 * Result 的 Component Token（4 个）。
 *
 * 契约来源：antd 6.6.4 的 `es/result/style/index.js` 的 prepareComponentToken，
 * 名称与默认值计算方式逐条对齐（规则 R7）。
 *
 * 落地形态与 badge 一致（B7）：4 个 token 以 CSS 变量声明在 `.apollo-result`
 * 上，规则侧全部 `var()` 消费 —— 名称/默认值在 build 期钉住，运行时可覆盖。
 */

import type { AliasToken } from '@apollo-design/theme';

/** iconFontSize 的上游算式：`isNumber(fontSizeHeading3) ? n*3 : calc(n * 3)`。
 *  CSS 变量形态下等价于 `calc(var(--apollo-font-size-heading-3) * 3)`（随主题缩放）。 */

export interface ComponentToken {
  /** 标题字号（= fontSizeHeading3）。 */
  titleFontSize?: number | string;
  /** 副标题字号（= fontSize）。 */
  subtitleFontSize?: number | string;
  /** 图标字号（= fontSizeHeading3 × 3）。 */
  iconFontSize?: number | string;
  /** 操作区外边距（= `${paddingLG}px 0 0 0`）。 */
  extraMargin?: string;
}

/**
 * 与 antd 的 `prepareComponentToken` 逐字对应（名称/派生算式同式；默认值以
 * CSS 变量声明落地，见 style/index.ts 的 tokenDecls —— 运行时由别名 token 驱动）。
 */
export const prepareResultComponentToken = (token?: AliasToken): Partial<ComponentToken> => {
  const { fontSizeHeading3 = 24, fontSize = 14, paddingLG = 24 } = token ?? {};
  return {
    titleFontSize: fontSizeHeading3,
    subtitleFontSize: fontSize,
    iconFontSize:
      typeof fontSizeHeading3 === 'number' ? fontSizeHeading3 * 3 : `calc(${fontSizeHeading3} * 3)`,
    extraMargin: `${paddingLG}px 0 0 0`,
  };
};
