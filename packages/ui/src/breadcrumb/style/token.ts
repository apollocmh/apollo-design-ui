/** Seven Apollo Breadcrumb tokens; ordinary text uses the readable secondary colour. */

import type { AliasToken } from '@apollo-design/theme';

/** Breadcrumb 的七个 Component Token。 */
export interface ComponentToken {
  /** @desc 面包屑项文字颜色 */
  itemColor: string;
  /** @desc 图标大小 */
  iconFontSize: number;
  /** @desc 链接文字颜色 */
  linkColor: string;
  /** @desc 链接文字悬浮颜色 */
  linkHoverColor: string;
  /** @desc 最后一项文字颜色 */
  lastItemColor: string;
  /** @desc 分隔符外间距 */
  separatorMargin: number;
  /** @desc 分隔符颜色 */
  separatorColor: string;
}

/** Current alias defaults; Provider component overrides are resolved at the owned root. */
export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  itemColor: token.colorTextSecondary,
  lastItemColor: token.colorText,
  iconFontSize: token.fontSize,
  linkColor: token.colorTextSecondary,
  linkHoverColor: token.colorText,
  separatorColor: token.colorTextDescription,
  separatorMargin: token.marginXS,
});
