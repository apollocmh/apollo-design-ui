import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { type ComputedRef, computed } from 'vue';
import { PRESET_COLORS } from '../_internal/preset-color';
import { prepareComponentToken } from './style/token';

const aliases = [
  'colorText',
  'fontSize',
  'fontFamily',
  'colorTextLightSolid',
  'colorError',
  'lineWidth',
  'colorBorderBg',
  'motionDurationMid',
  'colorErrorHover',
  'colorSuccess',
  'colorInfoTextHover',
  'colorInfo',
  'colorTextPlaceholder',
  'colorWarning',
  'marginXS',
  'motionDurationSlow',
  'motionEaseOutBack',
  'motionEaseOut',
  'paddingXS',
  'colorPrimary',
  'fontHeight',
  'borderRadiusSM',
  ...PRESET_COLORS.map((color) => `${color}-6`),
];
interface Source {
  aliases: Record<string, string>;
  fields: [string, string][];
}
const sources = new WeakMap<ReturnType<typeof useTheme>, ComputedRef<Source | undefined>>();

/** Current theme source is shared; each Badge root keeps its own variable namespace. */
export function useBadgeTheme(prefix: () => string, componentTokens = true) {
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
      const custom = theme.config.value.components?.Badge ?? {};
      const fields: [string, string][] = [];
      for (const [key, fallback] of Object.entries(prepareComponentToken(theme.token.value))) {
        const candidate = custom[key];
        const unitless = key === 'indicatorZIndex' || key === 'textFontWeight';
        const validNumber =
          typeof candidate === 'number' &&
          Number.isFinite(candidate) &&
          (key === 'indicatorZIndex' || candidate >= 0);
        const validString =
          unitless && typeof candidate === 'string' && candidate.trim().length > 0;
        const resolved = validNumber || validString ? candidate : fallback;
        fields.push([
          key,
          typeof resolved === 'number' && !unitless ? `${resolved}px` : String(resolved),
        ]);
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
    if (componentTokens)
      for (const [key, value] of data.fields) style[token2CSSVar(key, prefix())] = value;
    return style;
  });
}
