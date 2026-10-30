import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'colorBorder',
  'colorError',
  'colorPrimary',
  'colorSuccess',
  'colorText',
  'colorTextDescription',
  'colorWarning',
  'controlHeightLg',
  'controlHeightSm',
  'fontFamily',
  'fontSize',
  'fontSizeLg',
  'lineHeight',
  'lineType',
  'lineWidth',
  'margin',
  'marginLG',
  'marginXXS',
  'paddingSM',
  'motionDurationFast',
  'motionDurationMid',
  'motionEaseInOut',
  'motionEaseOut',
  'motionEaseOutBack',
] as const;
const lengths = new Set([
  'labelFontSize',
  'labelHeight',
  'verticalLabelHeight',
  'labelColonMarginInlineStart',
  'labelColonMarginInlineEnd',
  'itemMarginBottom',
  'verticalLabelMargin',
  'inlineItemMarginBottom',
]);

export function useFormTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const name of aliases) {
      const variable = token2CSSVar(name);
      const value = variables[variable];
      if (value !== undefined) result[variable] = value;
    }
    const overrides = theme.config.value.components?.Form;
    for (const [name, fallback] of Object.entries(prepareComponentToken(theme.token.value))) {
      const candidate = overrides?.[name];
      const value =
        (typeof candidate === 'number' && Number.isFinite(candidate)) ||
        (typeof candidate === 'string' && candidate.trim())
          ? candidate
          : fallback;
      result[token2CSSVar(name, prefix())] =
        typeof value === 'number' && lengths.has(name) ? `${value}px` : String(value);
    }
    return result;
  });
}
