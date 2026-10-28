import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

function length(value: unknown, fallback: number | string | undefined): string | undefined {
  const current =
    (typeof value === 'number' && Number.isFinite(value) && value >= 0) ||
    (typeof value === 'string' && value.trim().length > 0)
      ? value
      : fallback;
  return typeof current === 'number' ? `${current}px` : current;
}

function color(value: unknown, fallback: string | undefined): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

/** Current scoped tokens; unset optional dot values keep the static fallback. */
export function useTimelineTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (!Object.keys(theme.config.value).length) return {};
    const base = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Timeline ?? {};
    const style: Record<string, string> = { ...transformToken(theme.token.value).vars };
    const tokens = {
      tailColor: color(custom.tailColor, base.tailColor),
      tailWidth: length(custom.tailWidth, base.tailWidth),
      dotBorderWidth: length(custom.dotBorderWidth, base.dotBorderWidth),
      dotSize: length(custom.dotSize, base.dotSize),
      dotBg: color(custom.dotBg, base.dotBg),
      itemPaddingBottom: length(
        typeof custom.itemPaddingBottom === 'number' ? custom.itemPaddingBottom : undefined,
        base.itemPaddingBottom,
      ),
    };
    for (const [name, value] of Object.entries(tokens)) {
      if (value !== undefined) style[token2CSSVar(name, prefix())] = value;
    }
    return style;
  });
}
