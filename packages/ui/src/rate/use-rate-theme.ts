import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { type ComponentToken, prepareComponentToken } from './style/token';

const aliases = ['fontFamily', 'fontSize', 'lineWidth', 'marginXS', 'motionDurationMid'] as const;
const componentTokens = [
  'starColor',
  'starSize',
  'starSizeSM',
  'starSizeLG',
  'starHoverScale',
  'starBg',
] as const satisfies readonly (keyof ComponentToken)[];

/** Current source values consumed by Rate's static stylesheet, scoped to its root. */
export function useRateTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const token = theme.token.value;
    const variables = transformToken(token).vars;
    const style: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) style[name] = value;
    }

    const defaults = prepareComponentToken(token);
    const custom = theme.config.value.components?.Rate ?? {};
    for (const name of componentTokens) {
      const fallback = defaults[name];
      const candidate = custom[name];
      let value: string | number = fallback;
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        value = candidate;
      } else if (
        typeof fallback === 'number' &&
        typeof candidate === 'number' &&
        Number.isFinite(candidate) &&
        candidate >= 0
      ) {
        value = candidate;
      }
      style[token2CSSVar(name, prefix())] = typeof value === 'number' ? `${value}px` : value;
    }
    return style;
  });
}
