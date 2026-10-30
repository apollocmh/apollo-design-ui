import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadius',
  'borderRadiusLG',
  'borderRadiusSM',
  'boxShadowSecondary',
  'colorBgContainer',
  'colorBgContainerDisabled',
  'colorBgElevated',
  'colorBorder',
  'colorBorderDisabled',
  'colorError',
  'colorErrorAffix',
  'colorErrorBg',
  'colorErrorBgHover',
  'colorErrorBorderHover',
  'colorErrorText',
  'colorFillSecondary',
  'colorFillTertiary',
  'colorIcon',
  'colorPrimaryBorder',
  'colorText',
  'colorTextDisabled',
  'colorTextPlaceholder',
  'colorTextQuaternary',
  'colorWarning',
  'colorWarningAffix',
  'colorWarningBg',
  'colorWarningBgHover',
  'colorWarningBorderHover',
  'colorWarningText',
  'controlHeight',
  'controlHeightLG',
  'controlHeightSM',
  'controlItemBgHover',
  'controlPaddingHorizontal',
  'fontFamily',
  'fontSize',
  'fontSizeIcon',
  'fontWeightStrong',
  'lineHeight',
  'lineHeightLG',
  'lineType',
  'lineWidth',
  'marginXS',
  'motionDurationMid',
  'motionDurationSlow',
  'paddingXXS',
  'colorPrimary',
  'colorPrimaryHover',
  'controlOutline',
  'colorErrorOutline',
  'colorWarningOutline',
] as const;

const lengths = new Set([
  'lineWidthFocus',
  'paddingBlock',
  'paddingBlockSM',
  'paddingBlockLG',
  'paddingInline',
  'paddingInlineSM',
  'paddingInlineLG',
  'inputFontSize',
  'inputFontSizeLG',
  'inputFontSizeSM',
  'dropdownHeight',
  'controlItemWidth',
  'itemPaddingVertical',
]);

/** Variables consumed by the static CSS on both the editor root and teleported popup. */
export function useMentionsTheme(prefix: () => string) {
  const theme = useTheme();
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const styles: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) styles[name] = value;
    }
    const custom = theme.config.value.components?.Mentions ?? {};
    const defaults = prepareComponentToken(theme.token.value);
    for (const [name, fallback] of Object.entries(defaults)) {
      const candidate = custom[name];
      let value: string | number = fallback;
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        value = candidate;
      } else if (
        typeof candidate === 'number' &&
        Number.isFinite(candidate) &&
        ((lengths.has(name) && candidate >= 0) || name === 'zIndexPopup')
      ) {
        value = candidate;
      }
      styles[token2CSSVar(name, prefix())] =
        typeof value === 'number' && name !== 'zIndexPopup' ? `${value}px` : String(value);
    }
    return styles;
  });
  return { theme, style };
}
