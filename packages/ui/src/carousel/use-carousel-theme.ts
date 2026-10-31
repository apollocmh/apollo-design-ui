import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'colorText',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'motionDurationSlow',
  'colorBgContainer',
  'marginXXS',
] as const;
export function useCarouselTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const output: Record<string, string> = {};
    const all = transformToken(theme.token.value).vars;
    for (const alias of aliases) {
      const name = token2CSSVar(alias),
        value = all[name];
      if (value !== undefined) output[name] = value;
    }
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Carousel;
    for (const [key, fallback] of Object.entries(defaults)) {
      if (key === 'dotActiveWidth') continue;
      const requested = custom?.[key];
      const value =
        typeof requested === 'string' && requested.trim()
          ? requested
          : typeof requested === 'number' && Number.isFinite(requested) && requested >= 0
            ? requested
            : fallback;
      output[token2CSSVar(key, prefix())] = typeof value === 'number' ? `${value}px` : value;
    }
    const canonical = custom?.dotActiveWidth;
    output[token2CSSVar('dotActiveWidth', prefix())] =
      typeof canonical === 'string' && canonical.trim()
        ? canonical
        : typeof canonical === 'number' && Number.isFinite(canonical) && canonical >= 0
          ? `${canonical}px`
          : `var(${token2CSSVar('dotWidthActive', prefix())})`;
    return output;
  });
}
