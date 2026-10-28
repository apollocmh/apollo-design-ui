import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const colors = ['labelBg', 'labelColor', 'titleColor', 'contentColor', 'extraColor'] as const;
const lengths = [
  'titleMarginBottom',
  'itemPaddingBottom',
  'itemPaddingEnd',
  'colonMarginRight',
  'colonMarginLeft',
] as const;
export function useDescriptionsTheme(getPrefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const token = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Descriptions;
    const vars: Record<string, string> = { ...transformToken(theme.token.value).vars };
    const name = (key: string) =>
      `--${getPrefix()}-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
    for (const key of colors) {
      const value = custom?.[key];
      if (typeof value === 'string') vars[name(key)] = value;
    }
    for (const key of lengths) {
      const value = custom?.[key];
      if (value === undefined) continue;
      vars[name(key)] =
        typeof value === 'number' && Number.isFinite(value) && value >= 0
          ? `${value}px`
          : typeof value === 'string'
            ? value
            : `${token[key]}px`;
    }
    return vars;
  });
}
