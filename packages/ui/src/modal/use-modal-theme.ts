import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadiusLG',
  'borderRadiusSM',
  'boxShadow',
  'colorBgMask',
  'colorBgTextActive',
  'colorBgTextHover',
  'colorError',
  'colorIcon',
  'colorIconHover',
  'colorInfo',
  'colorPrimaryBorder',
  'colorSuccess',
  'colorText',
  'colorTextHeading',
  'colorWarning',
  'controlHeight',
  'fontFamily',
  'fontHeight',
  'fontSize',
  'fontSizeHeading5',
  'fontSizeLG',
  'fontWeightStrong',
  'lineHeight',
  'lineHeightHeading5',
  'lineWidthFocus',
  'margin',
  'marginSM',
  'marginXS',
  'motionDurationMid',
  'motionDurationSlow',
  'motionEaseInOutCirc',
  'motionEaseOutCirc',
  'padding',
  'zIndexPopupBase',
] as const;

export function useModalTheme() {
  const theme = useTheme();
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const alias of aliases) {
      const key = token2CSSVar(alias);
      const value = variables[key];
      if (value !== undefined) result[key] = value;
    }
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Modal;
    const tokens = {
      ...defaults,
      headerBg: custom?.headerBg ?? defaults.headerBg,
      footerBg: custom?.footerBg ?? defaults.footerBg,
      titleLineHeight: custom?.titleLineHeight ?? defaults.titleLineHeight,
      titleFontSize: custom?.titleFontSize ?? defaults.titleFontSize,
      titleColor: custom?.titleColor ?? defaults.titleColor,
      contentBg: custom?.contentBg ?? defaults.contentBg,
    };
    for (const [key, value] of Object.entries(tokens)) {
      if (key === 'mask') continue;
      result[token2CSSVar(key, 'apollo-modal')] =
        typeof value === 'number' && key !== 'titleLineHeight' ? `${value}px` : String(value);
    }
    return result;
  });
  return { style, token: theme.token };
}
