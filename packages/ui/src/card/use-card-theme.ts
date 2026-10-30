import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadiusLG',
  'boxShadowCard',
  'boxShadowTertiary',
  'colorBgContainer',
  'colorBorderSecondary',
  'colorFillAlter',
  'colorIcon',
  'colorPrimary',
  'colorText',
  'colorTextDescription',
  'colorTextHeading',
  'fontFamily',
  'fontHeight',
  'fontSize',
  'fontSizeLG',
  'fontWeightStrong',
  'lineHeight',
  'lineType',
  'lineWidth',
  'marginXS',
  'marginXXS',
  'motionDurationMid',
  'padding',
  'paddingLG',
] as const;
const flexibleLengths = new Set([
  'headerFontSize',
  'headerFontSizeSM',
  'headerHeight',
  'headerHeightSM',
]);

/** Current variables for the existing Card stylesheet; no runtime CSS is generated. */
export function useCardTheme(prefix: () => string) {
  const theme = useTheme();
  const aliasStyles = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const name of aliases) {
      const variable = token2CSSVar(name);
      const value = variables[variable];
      if (value !== undefined) result[variable] = value;
    }
    return result;
  });
  const styles = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const result = { ...aliasStyles.value };
    const custom = theme.config.value.components?.Card;
    for (const [name, fallback] of Object.entries(prepareComponentToken(theme.token.value))) {
      const candidate = custom?.[name];
      const validString = typeof candidate === 'string' && candidate.trim().length > 0;
      const value =
        typeof fallback === 'number'
          ? typeof candidate === 'number' && Number.isFinite(candidate)
            ? candidate
            : flexibleLengths.has(name) && validString
              ? candidate
              : fallback
          : validString
            ? candidate
            : fallback;
      result[token2CSSVar(name, prefix())] = typeof value === 'number' ? `${value}px` : value;
    }
    return result;
  });
  return { styles, aliasStyles };
}
