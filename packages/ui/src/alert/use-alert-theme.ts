import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadiusLG',
  'fontSizeHeading3',
  'paddingContentVerticalSM',
  'paddingMD',
  'paddingContentHorizontalLG',
  'colorText',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'lineWidth',
  'lineType',
  'colorSuccessBorder',
  'colorInfoBorder',
  'colorWarningBorder',
  'colorErrorBorder',
  'marginXS',
  'marginSM',
  'colorTextHeading',
  'fontSizeLG',
  'colorSuccessBg',
  'colorInfoBg',
  'colorWarningBg',
  'colorErrorBg',
  'colorSuccess',
  'colorInfo',
  'colorWarning',
  'colorError',
  'fontSizeIcon',
  'lineWidthFocus',
  'colorPrimaryBorder',
  'colorIcon',
  'colorIconHover',
  'motionDurationSlow',
  'motionDurationMid',
  'motionEaseInOutCirc',
] as const;

/** Project the nearest current source theme into the owning Alert's variables. */
export function useAlertTheme(prefix: () => string) {
  const theme = useTheme();
  const styles = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const alias of aliases) {
      const key = token2CSSVar(alias);
      const value = variables[key];
      if (value !== undefined) result[key] = value;
    }
    const custom = theme.config.value.components?.Alert ?? {};
    for (const [key, fallback] of Object.entries(prepareComponentToken(theme.token.value))) {
      const value = custom[key];
      const dimension = key === 'borderRadius' || key === 'withDescriptionIconSize';
      const valid =
        (typeof value === 'string' && value.trim().length > 0) ||
        (dimension && typeof value === 'number' && Number.isFinite(value) && value >= 0);
      const resolved = valid ? value : fallback;
      result[token2CSSVar(key, prefix())] =
        typeof resolved === 'number' ? `${resolved}px` : resolved;
    }
    return result;
  });
  return { styles, motion: computed(() => theme.token.value.motion !== false) };
}
