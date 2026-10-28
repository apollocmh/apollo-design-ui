import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';
import { type ComputedRef, computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadius',
  'borderRadiusLG',
  'colorBgContainer',
  'colorErrorText',
  'colorErrorTextActive',
  'colorErrorTextHover',
  'colorFillAlter',
  'colorIcon',
  'colorLink',
  'colorLinkActive',
  'colorLinkHover',
  'colorPrimary',
  'colorPrimaryBorder',
  'colorPrimaryHover',
  'colorSplit',
  'colorSuccess',
  'colorSuccessText',
  'colorText',
  'colorTextDescription',
  'colorTextSecondary',
  'colorTextDisabled',
  'colorTextHeading',
  'colorWarningText',
  'controlOutline',
  'controlOutlineWidth',
  'fontFamily',
  'fontFamilyCode',
  'fontSize',
  'fontSizeHeading1',
  'fontSizeHeading2',
  'fontSizeHeading3',
  'fontSizeHeading4',
  'fontSizeHeading5',
  'fontWeightStrong',
  'lineHeight',
  'lineHeightHeading1',
  'lineHeightHeading2',
  'lineHeightHeading3',
  'lineHeightHeading4',
  'lineHeightHeading5',
  'lineType',
  'lineWidth',
  'lineWidthFocus',
  'linkDecoration',
  'linkFocusDecoration',
  'linkHoverDecoration',
  'marginXS',
  'marginXXS',
  'motionDurationMid',
  'motionDurationSlow',
  'padding',
  'paddingSM',
] as const;
interface Source {
  aliases: Record<string, string>;
  fields: [string, string][];
  scheme: 'light' | 'dark';
}
const sources = new WeakMap<ReturnType<typeof useTheme>, ComputedRef<Source | undefined>>();
/** Current source shared by the five native typography entries. */
export function useTypographyTheme(prefix: () => string) {
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
      const custom = theme.config.value.components?.Typography ?? {};
      const fields: [string, string][] = [];
      for (const [key, fallback] of Object.entries(prepareComponentToken())) {
        const candidate = custom[key];
        const value =
          (typeof candidate === 'number' && Number.isFinite(candidate)) ||
          (typeof candidate === 'string' && candidate.trim().length)
            ? candidate
            : fallback;
        fields.push([key, typeof value === 'number' ? `${value}px` : String(value)]);
      }
      const background = new Color(theme.token.value.colorBgContainer);
      const scheme =
        background.r * 0.299 + background.g * 0.587 + background.b * 0.114 < 128 ? 'dark' : 'light';
      for (const key of ['linkDecoration', 'linkHoverDecoration', 'linkFocusDecoration'] as const) {
        const configured = theme.config.value.token?.[key];
        fields.push([
          key,
          typeof configured === 'string' && configured.trim() ? configured : 'underline',
        ]);
      }
      return { aliases: selected, fields, scheme };
    });
    sources.set(theme, source);
  }
  const current = source;
  return computed<Record<string, string>>(() => {
    const data = current.value;
    if (!data) return {};
    const style = { ...data.aliases, [`--${prefix()}-color-scheme`]: data.scheme };
    for (const [key, value] of data.fields) style[token2CSSVar(key, prefix())] = value;
    return style;
  });
}
