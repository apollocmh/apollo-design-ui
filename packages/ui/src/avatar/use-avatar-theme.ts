import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { type ComputedRef, computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'colorText',
  'colorTextPlaceholder',
  'lineHeight',
  'fontFamily',
  'lineWidth',
  'lineType',
  'borderRadius',
  'borderRadiusLG',
  'borderRadiusSM',
  'colorPrimary',
  'controlOutlineWidth',
] as const;
interface Source {
  aliases: Record<string, string>;
  fields: [string, string][];
}
const sources = new WeakMap<ReturnType<typeof useTheme>, ComputedRef<Source | undefined>>();
/** Share current-source derivation across the avatars of a group. */
export function useAvatarTheme(prefix: () => string) {
  const theme = useTheme();
  let source = sources.get(theme);
  if (!source) {
    source = computed(() => {
      if (theme.sourceActive?.value === false) return undefined;
      const variables = transformToken(theme.token.value).vars;
      const selected: Record<string, string> = {};
      for (const key of aliases) {
        const name = token2CSSVar(key);
        if (variables[name] !== undefined) selected[name] = variables[name];
      }
      const custom = theme.config.value.components?.Avatar ?? {};
      const fields: [string, string][] = [];
      for (const [key, fallback] of Object.entries(prepareComponentToken(theme.token.value))) {
        const value = custom[key];
        const validNumber =
          typeof value === 'number' &&
          Number.isFinite(value) &&
          (key === 'groupOverlapping' || value >= 0);
        const validString =
          (key === 'groupBorderColor' || key === 'iconFontSizeLG') &&
          typeof value === 'string' &&
          value.trim().length > 0;
        const resolved = validNumber || validString ? value : fallback;
        fields.push([key, typeof resolved === 'number' ? `${resolved}px` : resolved]);
      }
      return { aliases: selected, fields };
    });
    sources.set(theme, source);
  }
  const current = source;
  return computed<Record<string, string>>(() => {
    const data = current.value;
    if (!data) return {};
    const style = { ...data.aliases };
    for (const [key, value] of data.fields) style[token2CSSVar(key, prefix())] = value;
    return style;
  });
}
