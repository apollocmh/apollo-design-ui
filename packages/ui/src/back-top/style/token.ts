/**
 * BackTop 的 Component Token（1 个）。
 *
 * 契约来源：antd 6.6.4 的 `es/back-top/style/index.js` 的 prepareComponentToken。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 弹层层叠序（= zIndexBase + 10）。 */
  zIndexPopup?: number;
}

/** 与 antd 的 `prepareComponentToken` 逐字对应（默认值以 CSS 变量声明落地）。 */
export const prepareBackTopComponentToken = (token?: AliasToken): Partial<ComponentToken> => ({
  zIndexPopup: (token?.zIndexBase ?? 0) + 10,
});
