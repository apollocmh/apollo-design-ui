import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

// Only aliases consumed by this component's static CSS belong on its live root.
const aliases = [
  'borderRadius',
  'borderRadiusLG',
  'borderRadiusSM',
  'borderRadiusXS',
  'boxShadowTertiary',
  'colorPrimaryBorder',
  'colorText',
  'colorTextDisabled',
  'controlHeight',
  'controlHeightLG',
  'controlHeightSM',
  'controlPaddingHorizontal',
  'controlPaddingHorizontalSM',
  'fontFamily',
  'fontSize',
  'fontSizeLG',
  'lineHeight',
  'lineWidth',
  'lineWidthFocus',
  'marginSM',
  'motionDurationMid',
  'motionDurationSlow',
  'motionEaseInOut',
  'paddingXXS',
] as const;

export function useSegmentedTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const result: Record<string, string> = {};
    const variables = transformToken(theme.token.value).vars;
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) result[name] = value;
    }
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Segmented;
    for (const [key, fallback] of Object.entries(defaults)) {
      const supplied = custom?.[key];
      const value =
        typeof supplied === 'string' && supplied.trim()
          ? supplied
          : key === 'trackPadding' &&
              typeof supplied === 'number' &&
              Number.isFinite(supplied) &&
              supplied >= 0
            ? supplied
            : fallback;
      result[token2CSSVar(key, prefix())] = typeof value === 'number' ? `${value}px` : value;
    }
    return result;
  });
}
