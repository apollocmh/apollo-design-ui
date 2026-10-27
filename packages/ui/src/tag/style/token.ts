import { type AliasToken, getDesignToken } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';
import { onBackground } from '../../_internal/color-composite';

export interface ComponentToken {
  defaultBg?: string;
  defaultColor?: string;
  solidTextColor?: string;
}
export function prepareTagComponentToken(
  token: AliasToken = getDesignToken(),
): Required<ComponentToken> {
  let background = token.colorFillTertiary;
  if (!background.includes('var(') && !token.colorBgContainer.includes('var(')) {
    background = onBackground(background, token.colorBgContainer).toHexString();
  }
  let solid = '#fff';
  if (/^(#|rgb|hsl)/.test(token.colorBgSolid)) {
    const color = new Color(token.colorBgSolid);
    if (color.r * 0.299 + color.g * 0.587 + color.b * 0.114 >= 128) solid = '#000';
  }
  return { defaultBg: background, defaultColor: token.colorText, solidTextColor: solid };
}
