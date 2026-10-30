import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadiusLG',
  'colorBgContainer',
  'colorBgContainerDisabled',
  'colorBorder',
  'colorError',
  'colorLinkActive',
  'colorLinkHover',
  'colorPrimaryBorder',
  'colorSplit',
  'colorText',
  'colorTextDisabled',
  'colorTextSecondary',
  'colorWarning',
  'controlHeightLG',
  'controlItemBgActive',
  'controlItemBgActiveHover',
  'controlItemBgHover',
  'fontFamily',
  'fontSize',
  'fontSizeIcon',
  'lineHeight',
  'lineType',
  'lineWidth',
  'lineWidthFocus',
  'linkDecoration',
  'linkFocusDecoration',
  'linkHoverDecoration',
  'marginXS',
  'marginXXS',
  'motionDurationSlow',
  'paddingSM',
  'paddingXS',
] as const;

/** Current values for the existing static stylesheet; native and semantic styles stay last. */
export function useTransferTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const style: Record<string, string> = {};
    const variables = transformToken(theme.token.value).vars;
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) style[name] = value;
    }
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Transfer;
    for (const [name, fallback] of Object.entries(defaults)) {
      const value = custom?.[name];
      style[token2CSSVar(name, prefix())] =
        typeof value === 'number' && Number.isFinite(value) && value >= 0
          ? `${value}px`
          : typeof value === 'string' && value.trim() !== ''
            ? value
            : String(fallback);
    }
    return style;
  });
}
