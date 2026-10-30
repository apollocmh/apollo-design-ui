import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';

const aliases = [
  'lineWidthBold',
  'colorPrimary',
  'colorBorderSecondary',
  'colorBgContainer',
  'colorBgContainerDisabled',
  'colorPrimaryHover',
  'colorPrimaryActive',
  'controlHeightLG',
  'paddingXXS',
  'fontFamily',
  'fontSize',
  'zIndexPopupBase',
  'marginLG',
  'marginXXL',
  'boxShadowSecondary',
  'fontSizeIcon',
  'fontSizeSM',
  'borderRadius',
  'controlHeight',
  'padding',
  'colorText',
  'lineHeight',
  'borderRadiusLG',
  'motionDurationSlow',
] as const;

/** FloatButton has no component tokens; project the aliases its static CSS consumes. */
export function useFloatButtonTheme() {
  const theme = useTheme();
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const style: Record<string, string> = {};
    for (const name of aliases) {
      const key = token2CSSVar(name);
      const value = variables[key];
      if (value !== undefined) style[key] = value;
    }
    return style;
  });
  const motion = computed(() => theme.config.value.token?.motion !== false);
  return { theme, style, motion };
}
