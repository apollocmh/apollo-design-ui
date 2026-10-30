import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const lengths = new Set(['yearControlWidth', 'monthControlWidth', 'miniContentHeight']);
const owned = new Set(['fullBg', 'fullPanelBg', 'itemActiveBg', ...lengths]);

/** Six public Calendar overrides share the existing static panel declarations. */
export function useCalendarTheme(getRootPrefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = { ...transformToken(theme.token.value).vars };
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Calendar;
    for (const [name, fallback] of Object.entries(defaults)) {
      const next = owned.has(name) ? custom?.[name] : undefined;
      const value =
        typeof next === 'string' && next.trim() !== ''
          ? next
          : lengths.has(name) && typeof next === 'number' && Number.isFinite(next)
            ? next
            : fallback;
      const key = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      variables[`--${getRootPrefix()}-calendar-${key}`] =
        typeof value === 'number' ? `${value}px` : value;
    }
    return variables;
  });
}
