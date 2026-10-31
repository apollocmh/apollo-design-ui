import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

/** Alias variables actually consumed by the static Slider stylesheet. */
const aliases = [
  '--apollo-border-radius-xs',
  '--apollo-color-bg-elevated',
  '--apollo-color-fill-content-hover',
  '--apollo-color-primary-border-hover',
  '--apollo-color-text',
  '--apollo-color-text-description',
  '--apollo-control-height',
  '--apollo-control-height-lg',
  '--apollo-font-family',
  '--apollo-font-size',
  '--apollo-line-height',
  '--apollo-motion-duration-mid',
  '--apollo-motion-duration-slow',
];
export function useSliderTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const result: Record<string, string> = {};
    const variables = transformToken(theme.token.value).vars;
    for (const alias of aliases) {
      const value = variables[alias];
      if (value !== undefined) result[alias] = value;
    }
    const custom = theme.config.value.components?.Slider;
    for (const [name, fallback] of Object.entries(prepareComponentToken(theme.token.value))) {
      const next = custom?.[name];
      const value =
        typeof fallback === 'number'
          ? typeof next === 'number' && Number.isFinite(next)
            ? next
            : fallback
          : typeof next === 'string' && next.trim() !== ''
            ? next
            : fallback;
      result[token2CSSVar(name, prefix())] = typeof value === 'number' ? `${value}px` : value;
    }
    return result;
  });
}
