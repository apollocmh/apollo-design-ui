/**
 * Alert 的 Component Token（4 个）。
 *
 * 契约来源：antd 6.6.4 的 `es/alert/style/index.js` 的 prepareComponentToken。
 * - borderRadius / withDescriptionIconSize 是**别名派生**（borderRadiusLG /
 *   fontSizeHeading3）→ 落 var(--apollo-*)，随主题自适应；
 * - defaultPadding / withDescriptionPadding 是**字符串拼装**（数字 alias +
 *   固定 12）→ antd cssVar 产物同为实串（'8px 12px' / '20px 24px'），以 seed
 *   常量落地（tag 的 defaultBg 范式）。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 圆角（= borderRadiusLG）。 */
  borderRadius?: number | string;
  /** 带描述时图标的字号（= fontSizeHeading3）。 */
  withDescriptionIconSize?: number | string;
  /** 无描述时的内边距（= `${paddingContentVerticalSM}px 12px`，12 为 antd 固定值）。 */
  defaultPadding?: string;
  /** 带描述时的内边距（= `${paddingMD}px ${paddingContentHorizontalLG}px`）。 */
  withDescriptionPadding?: string;
}

/** 与 antd 的 `prepareComponentToken` 逐字对应（默认值以 CSS 变量声明落地）。 */
export const prepareComponentToken = (token?: AliasToken): Partial<ComponentToken> => ({
  borderRadius: token?.borderRadiusLG ?? 8,
  withDescriptionIconSize: token?.fontSizeHeading3 ?? 30,
  defaultPadding: `${token?.paddingContentVerticalSM ?? 8}px 12px`,
  withDescriptionPadding: `${token?.paddingMD ?? 20}px ${token?.paddingContentHorizontalLG ?? 24}px`,
});
