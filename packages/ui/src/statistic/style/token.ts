/**
 * Statistic 的 Component Token（2 个）。
 *
 * 契约来源：antd 6.6.4 的 `es/statistic/style/index.js` 的 prepareComponentToken。
 * 两个 token 都是**别名派生**（fontSize / fontSizeHeading3），落 `var(--apollo-*)`
 * —— 随主题自适应，不需要 seed 常量。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 标题字号（= fontSize）。 */
  titleFontSize?: number;
  /** 数值字号（= fontSizeHeading3）。 */
  contentFontSize?: number;
}

/** 与 antd 的 `prepareComponentToken` 逐字对应（默认值以 CSS 变量声明落地）。 */
export const prepareComponentToken = (token?: AliasToken): Partial<ComponentToken> => ({
  titleFontSize: token?.fontSize ?? 14,
  contentFontSize: token?.fontSizeHeading3 ?? 30,
});
