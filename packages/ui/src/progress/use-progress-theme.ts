import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareProgressComponentToken } from './style/token';

const aliases = [
  'fontFamily',
  'fontSize',
  'fontSizeSM',
  'lineHeight',
  'colorText',
  'colorTextDescription',
  'colorWhite',
  'colorBgContainer',
  'colorError',
  'colorSuccess',
  'marginXS',
  'marginXXS',
  'paddingXXS',
  'motionDurationSlow',
  'motionEaseOutQuint',
  'motionEaseInOutCirc',
] as const;

/** Current scoped variables consumed by Progress's static stylesheet. */
export function useProgressTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const styles: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) styles[name] = value;
    }
    const custom = theme.config.value.components?.Progress ?? {};
    for (const [name, fallback] of Object.entries(
      prepareProgressComponentToken(theme.token.value),
    )) {
      const candidate = custom[name];
      let value: string | number = fallback;
      if (typeof fallback === 'number') {
        if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
          value = candidate;
        }
      } else if (typeof candidate === 'string' && candidate.trim().length > 0) {
        value = candidate;
      }
      if (value !== undefined) {
        styles[token2CSSVar(name, prefix())] = typeof value === 'number' ? `${value}px` : value;
      }
    }
    return styles;
  });
}
