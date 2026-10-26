import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

export function useStatisticTheme(getPrefix: () => string) {
  const theme = useTheme();
  const styles = computed<Record<string, string>>(() => {
    if (!Object.keys(theme.config.value).length) return {};
    const base = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Statistic;
    const length = (value: unknown, fallback: number) =>
      `${typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback}px`;
    return {
      ...transformToken(theme.token.value).vars,
      [`--${getPrefix()}-title-font-size`]: length(custom?.titleFontSize, base.titleFontSize),
      [`--${getPrefix()}-content-font-size`]: length(custom?.contentFontSize, base.contentFontSize),
    };
  });
  return { styles };
}
