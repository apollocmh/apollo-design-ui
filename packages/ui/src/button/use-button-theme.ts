import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';
import { type ComputedRef, computed } from 'vue';
import { buttonAliasTokens } from './style/alias-tokens';
import { prepareComponentToken } from './style/token';

const lengthTokens = new Set([
  'iconGap',
  'paddingInline',
  'paddingInlineLG',
  'paddingInlineSM',
  'paddingBlock',
  'paddingBlockLG',
  'paddingBlockSM',
  'onlyIconSize',
  'onlyIconSizeLG',
  'onlyIconSizeSM',
  'contentFontSize',
  'contentFontSizeLG',
  'contentFontSizeSM',
]);
const automaticForegrounds = new Set([
  'primaryColor',
  'dangerColor',
  'solidTextColor',
  'defaultHoverColor',
  'defaultActiveColor',
]);

interface PreparedSource {
  aliases: Record<string, string>;
  fields: [string, string][];
  scheme?: string;
  paused: boolean;
}
const sources = new WeakMap<ReturnType<typeof useTheme>, ComputedRef<PreparedSource | undefined>>();

/** Share pure derivation within a Provider; each root retains its own namespace and native overrides. */
export function useButtonTheme(prefix: () => string) {
  const theme = useTheme();
  let source = sources.get(theme);
  if (!source) {
    source = computed(() => {
      if (theme.sourceActive?.value === false) return undefined;
      const custom = theme.config.value.components?.Button ?? {};
      const token = theme.token.value;
      const base = prepareComponentToken({
        ...token,
        ...(typeof custom.contentFontSize === 'number'
          ? { contentFontSize: custom.contentFontSize }
          : {}),
        ...(typeof custom.contentFontSizeLG === 'number'
          ? { contentFontSizeLG: custom.contentFontSizeLG }
          : {}),
        ...(typeof custom.contentFontSizeSM === 'number'
          ? { contentFontSizeSM: custom.contentFontSizeSM }
          : {}),
      });
      const aliases: Record<string, string> = {};
      const variables = transformToken(token).vars;
      for (const name of buttonAliasTokens) {
        const key = token2CSSVar(name);
        const value = variables[key];
        if (value !== undefined) aliases[key] = value;
      }
      const fields: [string, string][] = [];
      for (const [name, fallback] of Object.entries(base)) {
        const input =
          name === 'defaultBorderColorDisabled'
            ? (custom[name] ?? custom.borderColorDisabled)
            : custom[name];
        const valid =
          (typeof input === 'string' && Boolean(input.trim())) ||
          (typeof input === 'number' && Number.isFinite(input) && input >= 0);
        if (automaticForegrounds.has(name) && !valid) continue;
        const value = valid ? input : fallback;
        fields.push([
          name,
          typeof value === 'number' && lengthTokens.has(name) ? `${value}px` : String(value),
        ]);
      }
      let scheme: string | undefined;
      if (/^(#|rgb|hsl)/.test(token.colorBgContainer)) {
        const color = new Color(token.colorBgContainer);
        scheme = color.r * 0.299 + color.g * 0.587 + color.b * 0.114 < 128 ? 'dark' : 'light';
      }
      return { aliases, fields, scheme, paused: theme.config.value.token?.motion === false };
    });
    sources.set(theme, source);
  }
  const prepared = source;
  return computed<Record<string, string>>(() => {
    const current = prepared.value;
    if (!current) return {};
    const style = { ...current.aliases };
    for (const [name, value] of current.fields) style[token2CSSVar(name, prefix())] = value;
    if (current.scheme) style[`--${prefix()}-color-scheme`] = current.scheme;
    if (current.paused) style[`--${prefix()}-motion`] = 'paused';
    return style;
  });
}
