/** Alert's four component tokens derive defaults from the current Alias tokens. */

import { type AliasToken, getDesignToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 圆角（= borderRadiusLG）。 */
  borderRadius?: number | string;
  /** 带描述时图标的字号（= fontSizeHeading3）。 */
  withDescriptionIconSize?: number | string;
  /** 无描述时的内边距（= `${paddingContentVerticalSM}px 12px`）。 */
  defaultPadding?: string;
  /** 带描述时的内边距（= `${paddingMD}px ${paddingContentHorizontalLG}px`）。 */
  withDescriptionPadding?: string;
}

/** Keep generated defaults and the current source-theme projection consistent. */
export const prepareComponentToken = (
  token: AliasToken = getDesignToken(),
): Required<ComponentToken> => ({
  borderRadius: token.borderRadiusLG,
  withDescriptionIconSize: token.fontSizeHeading3,
  defaultPadding: `${token.paddingContentVerticalSM}px 12px`,
  withDescriptionPadding: `${token.paddingMD}px ${token.paddingContentHorizontalLG}px`,
});
