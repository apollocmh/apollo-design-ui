import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';
import { type ComputedRef, computed } from 'vue';
import { tagAliasVariables } from '../style/alias-tokens';
import { prepareTagComponentToken } from '../style/token';

interface Source {
  aliases: Record<string, string>;
  fields: [string, string][];
  scheme?: string;
}
const sources = new WeakMap<ReturnType<typeof useTheme>, ComputedRef<Source | undefined>>();
/** Share source derivation; roots retain their own namespace and native style priority. */
export function useTagTheme(prefix: () => string) {
  const theme = useTheme();
  let cached = sources.get(theme);
  if (!cached) {
    cached = computed(() => {
      if (!Object.keys(theme.config.value).length) return undefined;
      const aliases: Record<string, string> = {},
        variables = transformToken(theme.token.value).vars;
      for (const key of tagAliasVariables)
        if (variables[key] !== undefined) aliases[key] = variables[key];
      const base = prepareTagComponentToken(theme.token.value),
        custom = theme.config.value.components?.Tag ?? {};
      const fields: [string, string][] = [];
      for (const [name, fallback] of Object.entries(base)) {
        const value = custom[name];
        const valid = typeof value === 'string' && value.trim().length > 0;
        if (name === 'solidTextColor' && !valid) continue;
        fields.push([name, valid ? value : fallback]);
      }
      let scheme: string | undefined;
      if (/^(#|rgb|hsl)/.test(theme.token.value.colorBgContainer)) {
        const c = new Color(theme.token.value.colorBgContainer);
        scheme = c.r * 0.299 + c.g * 0.587 + c.b * 0.114 < 128 ? 'dark' : 'light';
      }
      return { aliases, fields, scheme };
    });
    sources.set(theme, cached);
  }
  const source = cached;
  return computed<Record<string, string>>(() => {
    const data = source.value;
    if (!data) return {};
    const style = { ...data.aliases };
    for (const [name, value] of data.fields) style[token2CSSVar(name, prefix())] = value;
    if (data.scheme) style[`--${prefix()}-color-scheme`] = data.scheme;
    return style;
  });
}
