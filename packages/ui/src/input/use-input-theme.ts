import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { inputAliasTokens } from './style/alias-tokens';
import type { ComponentToken } from './style/token';

const fields = [
  'lineWidthFocus',
  'paddingBlock',
  'paddingBlockSM',
  'paddingBlockLG',
  'paddingInline',
  'paddingInlineSM',
  'paddingInlineLG',
  'addonBg',
  'activeBorderColor',
  'hoverBorderColor',
  'activeShadow',
  'errorActiveShadow',
  'warningActiveShadow',
  'hoverBg',
  'activeBg',
  'inputFontSize',
  'inputFontSizeLG',
  'inputFontSizeSM',
  'inputAffixPadding',
] as const satisfies readonly (keyof ComponentToken)[];
const lengths = new Set<keyof ComponentToken>([
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
  'inputAffixPadding',
]);

/** Current theme data only; CSS owns defaults so caller CSS variables still work. */
export function useInputTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string> | undefined>(() => {
    if (theme.sourceActive?.value === false) return undefined;
    const token = theme.token.value;
    const aliases = transformToken(token).vars;
    const style: Record<string, string> = {};
    for (const name of inputAliasTokens) {
      const key = token2CSSVar(name);
      const value = aliases[key];
      if (value !== undefined) style[key] = value;
    }
    const custom = theme.config.value.components?.Input ?? {};
    for (const name of fields) {
      const value = custom[name];
      const validString = typeof value === 'string' && Boolean(value.trim());
      const validLength =
        lengths.has(name) && typeof value === 'number' && Number.isFinite(value) && value >= 0;
      if (validString || validLength) {
        style[token2CSSVar(name, prefix())] = typeof value === 'number' ? `${value}px` : value;
      }
    }
    if (custom.lineWidthFocus === undefined && token.lineWidthFocus === 0) {
      style[token2CSSVar('lineWidthFocus', prefix())] = '0px';
    }
    return style;
  });
}
