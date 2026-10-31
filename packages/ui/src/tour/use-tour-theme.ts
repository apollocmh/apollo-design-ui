import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { type ComponentToken, prepareComponentToken } from './style/token';

const aliases = [
  'fontFamily',
  'fontSize',
  'lineHeight',
  'colorText',
  'borderRadiusLG',
  'boxShadowTertiary',
  'padding',
  'paddingXS',
  'colorIcon',
  'colorIconHover',
  'colorBgTextHover',
  'colorBgTextActive',
  'borderRadiusSM',
  'motionDurationMid',
  'motionDurationSlow',
  'lineWidthFocus',
  'colorPrimaryBorder',
  'colorFill',
  'colorPrimary',
  'colorTextLightSolid',
  'borderRadius',
  'borderRadiusXS',
  'colorBgElevated',
  'colorWhite',
  'marginXS',
  'sizePopupArrow',
  'boxShadowPopoverArrow',
] as const;
export function useTourTheme() {
  const theme = useTheme();
  const componentToken = computed(() => {
    const base = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Tour;
    const numeric = (key: keyof ComponentToken, fallback: number) => {
      const value = custom?.[key];
      return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    };
    const text = (key: keyof ComponentToken, fallback: string) => {
      const value = custom?.[key];
      return typeof value === 'string' ? value : fallback;
    };
    return {
      zIndexPopup: numeric('zIndexPopup', base.zIndexPopup),
      closeBtnSize: numeric('closeBtnSize', base.closeBtnSize),
      primaryPrevBtnBg: text('primaryPrevBtnBg', base.primaryPrevBtnBg),
      primaryNextBtnHoverBg: text('primaryNextBtnHoverBg', base.primaryNextBtnHoverBg),
      arrowOffsetHorizontal: numeric('arrowOffsetHorizontal', base.arrowOffsetHorizontal),
      arrowOffsetVertical: numeric('arrowOffsetVertical', base.arrowOffsetVertical),
      arrowShadowWidth: numeric('arrowShadowWidth', base.arrowShadowWidth),
      arrowPath: text('arrowPath', base.arrowPath),
      arrowPolygon: text('arrowPolygon', base.arrowPolygon),
    };
  });
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const vars = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      if (vars[name] !== undefined) result[name] = vars[name];
    }
    for (const [name, value] of Object.entries(componentToken.value))
      result[token2CSSVar(name, 'apollo-tour')] =
        typeof value === 'number' && name !== 'zIndexPopup' ? `${value}px` : String(value);
    return result;
  });
  return { theme, componentToken, style };
}
