import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const color = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;
const dimension = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

/** Each owning root follows the current source theme, including standalone shapes. */
export function useSkeletonTheme(getPrefix: () => string) {
  const theme = useTheme();
  const styles = computed<Record<string, string>>(() => {
    if (!Object.keys(theme.config.value).length) return {};
    const custom = theme.config.value.components?.Skeleton ?? {};
    const base = prepareComponentToken(theme.token.value);
    const from = color(custom.gradientFromColor) ?? color(custom.color) ?? base.gradientFromColor;
    const to =
      color(custom.gradientToColor) ?? color(custom.colorGradientEnd) ?? base.gradientToColor;
    const titleHeight =
      typeof custom.titleHeight === 'string' && custom.titleHeight.trim()
        ? custom.titleHeight
        : `${dimension(custom.titleHeight, theme.token.value.controlHeight / 2)}px`;
    const prefix = getPrefix();
    return {
      ...transformToken(theme.token.value).vars,
      [`--${prefix}-color`]: from,
      [`--${prefix}-color-gradient-end`]: to,
      [`--${prefix}-gradient-from-color`]: from,
      [`--${prefix}-gradient-to-color`]: to,
      [`--${prefix}-title-height`]: titleHeight,
      [`--${prefix}-block-radius`]: `${dimension(custom.blockRadius, base.blockRadius)}px`,
      [`--${prefix}-paragraph-margin-top`]: `${dimension(custom.paragraphMarginTop, base.paragraphMarginTop)}px`,
      [`--${prefix}-paragraph-li-height`]: `${dimension(custom.paragraphLiHeight, base.paragraphLiHeight)}px`,
      ...(theme.token.value.motion === false
        ? { [`--${prefix}-animation-play-state`]: 'paused' }
        : {}),
    };
  });
  return { styles };
}
