/**
 * Popconfirm 的 Component Token（antd prepareComponentToken **1 个字段**）。
 *
 * 契约来源：antd 6.6.4 的 `es/popconfirm/style/index.js`。
 *
 *   zIndexPopup = zIndexPopupBase + 60
 *
 * 与 popover / tooltip / modal 同判：z-index 是**结构性量**，其余视觉量
 * （colorWarning / marginXS / fontWeightStrong …）直接走 alias token，不是
 * Component Token。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 浮层 z-index（= zIndexPopupBase + 60）。 */
  zIndexPopup: number;
}

export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  zIndexPopup: token.zIndexPopupBase + 60,
});

export default prepareComponentToken;
