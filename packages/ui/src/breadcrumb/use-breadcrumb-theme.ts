import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { type ComputedRef, computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'fontSize',
  'lineHeight',
  'fontFamily',
  'motionDurationMid',
  'paddingXXS',
  'borderRadiusSM',
  'fontHeight',
  'marginXXS',
  'colorBgTextHover',
  'lineWidthFocus',
  'colorPrimaryBorder',
  'fontSizeIcon',
] as const;
interface ThemeSource {
  aliases: Record<string, string>;
  fields: [string, string][];
}
const sources = new WeakMap<ReturnType<typeof useTheme>, ComputedRef<ThemeSource | undefined>>();

/** Derive the current provider once; each navigation owns its variable namespace and priority. */
export function useBreadcrumbTheme(prefix: () => string) {
  const theme = useTheme();
  let source = sources.get(theme);
  if (!source) {
    source = computed(() => {
      if (!Object.keys(theme.config.value).length) return undefined;
      const variables = transformToken(theme.token.value).vars;
      const selected: Record<string, string> = {};
      for (const key of aliases) {
        const name = token2CSSVar(key);
        if (variables[name] !== undefined) selected[name] = variables[name];
      }
      const custom = theme.config.value.components?.Breadcrumb ?? {};
      const fields: [string, string][] = [];
      for (const [key, fallback] of Object.entries(prepareComponentToken(theme.token.value))) {
        const candidate = custom[key];
        const size = key === 'iconFontSize' || key === 'separatorMargin';
        const valid = size
          ? typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0
          : typeof candidate === 'string' && candidate.trim().length > 0;
        const value = valid ? candidate : fallback;
        fields.push([key, typeof value === 'number' ? `${value}px` : String(value)]);
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
