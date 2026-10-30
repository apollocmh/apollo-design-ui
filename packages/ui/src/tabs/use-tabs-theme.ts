import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadius',
  'borderRadiusLG',
  'boxShadowSecondary',
  'boxShadowTabsOverflowBottom',
  'boxShadowTabsOverflowLeft',
  'boxShadowTabsOverflowRight',
  'boxShadowTabsOverflowTop',
  'colorBgContainer',
  'colorBorder',
  'colorBorderSecondary',
  'colorIcon',
  'colorPrimaryBorder',
  'colorText',
  'colorTextDisabled',
  'colorTextHeading',
  'controlHeight',
  'controlHeightLG',
  'controlItemBgHover',
  'fontFamily',
  'fontSize',
  'fontSizeSM',
  'lineHeight',
  'lineHeightLG',
  'lineType',
  'lineWidth',
  'lineWidthBold',
  'lineWidthFocus',
  'margin',
  'marginSM',
  'marginXS',
  'marginXXS',
  'motionDurationSlow',
  'motionEaseInOut',
  'paddingLG',
  'paddingSM',
  'paddingXXS',
] as const;

/** Variables for the existing stylesheet, shared by the root and teleported overflow. */
export function useTabsTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const style: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) style[name] = value;
    }
    const custom = theme.config.value.components?.Tabs ?? {};
    const numberValue = (name: string): number | undefined => {
      const value = custom[name];
      const signed =
        name === 'zIndexPopup' || name === 'horizontalItemGutter' || name === 'cardGutter';
      return typeof value === 'number' && Number.isFinite(value) && (signed || value >= 0)
        ? value
        : undefined;
    };
    const defaults = prepareComponentToken({
      ...theme.token.value,
      cardHeight: numberValue('cardHeight'),
      cardHeightSM: numberValue('cardHeightSM'),
      cardHeightLG: numberValue('cardHeightLG'),
    });
    for (const [name, fallback] of Object.entries(defaults)) {
      const candidate = custom[name];
      const value =
        typeof fallback === 'number'
          ? (numberValue(name) ?? fallback)
          : typeof candidate === 'string' && candidate.trim().length > 0
            ? candidate
            : fallback;
      style[token2CSSVar(name, prefix())] =
        typeof value === 'number' ? (name === 'zIndexPopup' ? String(value) : `${value}px`) : value;
    }
    return style;
  });
}
