import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { type ComponentToken, prepareComponentToken } from './style/token';

const dimension = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
const unit = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

/** Project the current source theme onto the owning Spin root. */
export function useSpinTheme(getPrefixCls: () => string) {
  const theme = useTheme();
  const token = computed<ComponentToken>(() => {
    const base = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Spin ?? {};
    return {
      contentHeight:
        typeof custom.contentHeight === 'string' && custom.contentHeight.trim()
          ? custom.contentHeight
          : dimension(custom.contentHeight, Number(base.contentHeight)),
      dotSize: dimension(custom.dotSize, base.dotSize),
      dotSizeSM: dimension(custom.dotSizeSM, base.dotSizeSM),
      dotSizeLG: dimension(custom.dotSizeLG, base.dotSizeLG),
    };
  });
  const styles = computed<Record<string, string>>(() => {
    if (!Object.keys(theme.config.value).length) return {};
    const p = getPrefixCls();
    return {
      ...transformToken(theme.token.value).vars,
      [`--${p}-content-height`]: unit(token.value.contentHeight),
      [`--${p}-dot-size`]: unit(token.value.dotSize),
      [`--${p}-dot-size-sm`]: unit(token.value.dotSizeSM),
      [`--${p}-dot-size-lg`]: unit(token.value.dotSizeLG),
      ...(theme.token.value.motion === false ? { [`--${p}-animation-play-state`]: 'paused' } : {}),
    };
  });
  return { styles };
}
