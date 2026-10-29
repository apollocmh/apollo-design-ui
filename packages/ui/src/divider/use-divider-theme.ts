import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { type ComputedRef, computed } from 'vue';
import { ORIENTATION_MARGIN, prepareComponentToken, TEXT_PADDING_INLINE } from './style/token';

const aliases = [
  'colorSplit',
  'colorText',
  'colorTextHeading',
  'fontFamily',
  'fontSize',
  'fontSizeLG',
  'lineHeight',
  'lineWidth',
  'margin',
  'marginLG',
  'marginXS',
] as const;

interface DividerThemeSource {
  aliases: Record<string, string>;
  textPaddingInline: string;
  orientationMargin: string;
  verticalMarginInline: string;
}

function length(value: unknown, fallback: string | number, nonNegative: boolean): string {
  const current =
    (typeof value === 'number' && Number.isFinite(value) && (!nonNegative || value >= 0)) ||
    (typeof value === 'string' && value.trim().length > 0)
      ? value
      : fallback;
  return typeof current === 'number' ? `${current}px` : current;
}

const sources = new WeakMap<
  ReturnType<typeof useTheme>,
  ComputedRef<DividerThemeSource | undefined>
>();

/** Read each active source once; every Divider owns its namespace and native style priority. */
export function useDividerTheme(prefix: () => string) {
  const theme = useTheme();
  let source = sources.get(theme);
  if (!source) {
    source = computed(() => {
      if (theme.sourceActive?.value === false) return undefined;
      const token = theme.token.value;
      const variables = transformToken(token).vars;
      const selected: Record<string, string> = {};
      for (const key of aliases) {
        const name = token2CSSVar(key);
        if (variables[name] !== undefined) selected[name] = variables[name];
      }
      const base = prepareComponentToken(token);
      const custom = theme.config.value.components?.Divider ?? {};
      const margin = custom.orientationMargin;
      return {
        aliases: selected,
        textPaddingInline: length(
          custom.textPaddingInline,
          base.textPaddingInline ?? TEXT_PADDING_INLINE,
          true,
        ),
        orientationMargin: String(
          typeof margin === 'number' && Number.isFinite(margin) && margin >= 0 && margin <= 1
            ? margin
            : (base.orientationMargin ?? ORIENTATION_MARGIN),
        ),
        verticalMarginInline: length(
          custom.verticalMarginInline,
          base.verticalMarginInline ?? token.marginXS,
          false,
        ),
      };
    });
    sources.set(theme, source);
  }
  const current = source;
  return computed<Record<string, string>>(() => {
    const value = current.value;
    if (!value) return {};
    return {
      ...value.aliases,
      [token2CSSVar('textPaddingInline', prefix())]: value.textPaddingInline,
      [token2CSSVar('orientationMargin', prefix())]: value.orientationMargin,
      [token2CSSVar('verticalMarginInline', prefix())]: value.verticalMarginInline,
    };
  });
}
