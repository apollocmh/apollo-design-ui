import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { type ComponentToken, prepareComponentToken, prepareInputToken } from './style/token';

/** Global variables read by Pagination's existing static rules and input derivation. */
const aliases = [
  'borderRadius',
  'borderRadiusLG',
  'borderRadiusSM',
  'colorBgContainer',
  'colorBgContainerDisabled',
  'colorBgTextActive',
  'colorBgTextHover',
  'colorBorder',
  'colorBorderDisabled',
  'colorFillSecondary',
  'colorFillTertiary',
  'colorPrimary',
  'colorPrimaryBorder',
  'colorPrimaryHover',
  'colorText',
  'colorTextDisabled',
  'colorTextPlaceholder',
  'controlHeightLG',
  'controlOutline',
  'controlOutlineWidth',
  'fontFamily',
  'fontSize',
  'fontSizeSM',
  'fontWeightStrong',
  'lineHeight',
  'lineHeightLG',
  'lineType',
  'lineWidth',
  'margin',
  'marginSM',
  'marginXS',
  'marginXXS',
  'motionDurationMid',
  'sizeLG',
] as const;

/** These private fields are derived for Pagination inputs; Select owns its own variables. */
const inputTokens = [
  'activeBg',
  'activeBorderColor',
  'activeShadow',
  'hoverBg',
  'hoverBorderColor',
  'inputFontSize',
  'inputFontSizeLG',
  'inputFontSizeSM',
  'lineWidthFocus',
  'paddingBlock',
  'paddingBlockLG',
  'paddingBlockSM',
  'paddingInline',
  'paddingInlineLG',
  'paddingInlineSM',
] as const;

const dimensions = new Set(['itemSize', 'itemSizeSM', 'itemSizeLG', 'miniOptionsSizeChangerTop']);
const componentTokens = [
  'itemBg',
  'itemSize',
  'itemSizeSM',
  'itemSizeLG',
  'itemActiveBg',
  'itemActiveColor',
  'itemActiveColorHover',
  'itemLinkBg',
  'itemActiveBgDisabled',
  'itemActiveColorDisabled',
  'itemInputBg',
  'miniOptionsSizeChangerTop',
] as const satisfies readonly (keyof ComponentToken)[];

/** Project the current source theme onto the native root without taking CSS-only ownership. */
export function usePaginationTheme(prefix: () => string) {
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

    const custom = theme.config.value.components?.Pagination ?? {};
    const defaults = prepareComponentToken(token);
    for (const name of componentTokens) {
      const candidate = custom[name];
      const value =
        typeof candidate === 'string' && candidate.trim().length > 0
          ? candidate
          : dimensions.has(name) &&
              typeof candidate === 'number' &&
              Number.isFinite(candidate) &&
              (name === 'miniOptionsSizeChangerTop' || candidate >= 0)
            ? `${candidate}px`
            : defaults[name];
      style[token2CSSVar(name, prefix())] = value;
    }

    const input = prepareInputToken(token);
    for (const name of inputTokens) style[token2CSSVar(name, prefix())] = input[name];
    return style;
  });
}
