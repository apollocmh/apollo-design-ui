import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { type ComponentToken, prepareComponentToken } from './style/token';

const aliases = [
  'colorPrimary',
  'colorPrimaryBorder',
  'colorPrimaryHover',
  'colorText',
  'colorTextLightSolid',
  'colorTextQuaternary',
  'colorTextTertiary',
  'fontFamily',
  'fontSize',
  'fontSizeIcon',
  'fontSizeSM',
  'lineWidthFocus',
  'marginXXS',
  'motionDurationMid',
  'opacityLoading',
] as const;

const lengths = [
  'trackHeight',
  'trackHeightSM',
  'trackMinWidth',
  'trackMinWidthSM',
  'trackPadding',
  'handleSize',
  'handleSizeSM',
  'innerMinMargin',
  'innerMaxMargin',
  'innerMinMarginSM',
  'innerMaxMarginSM',
] as const satisfies readonly (keyof ComponentToken)[];

const strings = ['handleBg', 'handleShadow'] as const;

/** Current source values consumed by Switch's static CSS, scoped to its actual root. */
export function useSwitchTheme(prefix: () => string) {
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
    const custom = theme.config.value.components?.Switch ?? {};
    for (const name of lengths) {
      const candidate = custom[name];
      const fallback = defaults[name];
      let value: number | string = fallback;
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        value = candidate;
      } else if (typeof candidate === 'string' && candidate.trim() !== '') {
        value = candidate;
      }
      style[token2CSSVar(name, prefix())] = typeof value === 'number' ? `${value}px` : value;
    }
    for (const name of strings) {
      const value = custom[name];
      style[token2CSSVar(name, prefix())] =
        typeof value === 'string' && value.trim() !== '' ? value : defaults[name];
    }
    return style;
  });
}
