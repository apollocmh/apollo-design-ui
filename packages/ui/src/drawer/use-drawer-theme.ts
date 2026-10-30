import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { type ComponentToken, prepareComponentToken } from './style/token';

const aliases = [
  'borderRadiusSM',
  'boxShadowDrawerDown',
  'boxShadowDrawerLeft',
  'boxShadowDrawerRight',
  'boxShadowDrawerUp',
  'colorBgElevated',
  'colorBgMask',
  'colorBgTextActive',
  'colorBgTextHover',
  'colorIcon',
  'colorIconHover',
  'colorPrimary',
  'colorPrimaryBorder',
  'colorSplit',
  'colorText',
  'fontFamily',
  'fontSize',
  'fontSizeLG',
  'fontWeightStrong',
  'lineHeightLG',
  'lineType',
  'lineWidth',
  'lineWidthFocus',
  'marginXS',
  'motionDurationMid',
  'motionDurationSlow',
  'padding',
  'paddingLG',
  'paddingXS',
] as const;

export function useDrawerTheme() {
  const theme = useTheme();
  const componentToken = computed(() => {
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Drawer;
    const tokens: ComponentToken = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof ComponentToken)[]) {
      const value = custom?.[key];
      if (typeof value === 'number' && Number.isFinite(value)) tokens[key] = value;
    }
    return tokens;
  });
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const style: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) style[name] = value;
    }
    for (const [key, value] of Object.entries(componentToken.value)) {
      style[token2CSSVar(key, 'apollo-drawer')] = `${value}${key === 'zIndexPopup' ? '' : 'px'}`;
    }
    return style;
  });
  return { componentToken, style };
}
