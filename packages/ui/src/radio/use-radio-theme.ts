import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

/** Alias variables actually consumed by the static Radio/Group/Button stylesheet. */
const aliases = [
  'borderRadius',
  'borderRadiusLG',
  'borderRadiusSM',
  'fontFamily',
  'fontSize',
  'fontSizeLG',
  'lineHeight',
  'lineType',
  'lineWidth',
  'lineWidthFocus',
  'colorText',
  'colorTextDisabled',
  'colorTextLightSolid',
  'colorWhite',
  'colorPrimary',
  'colorPrimaryHover',
  'colorPrimaryActive',
  'colorPrimaryBorder',
  'colorBgContainer',
  'colorBgContainerDisabled',
  'colorBorder',
  'controlItemBgActiveDisabled',
  'controlHeight',
  'controlHeightSM',
  'controlHeightLG',
  'padding',
  'paddingXS',
  'marginXS',
  'motionDurationMid',
  'motionDurationSlow',
  'motionEaseInOutCirc',
];

/** Scope current theme values to each actual root; native style remains the final override. */
export function useRadioTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const result: Record<string, string> = {};
    const variables = transformToken(theme.token.value).vars;
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) result[name] = value;
    }
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Radio;
    for (const [name, fallback] of Object.entries(defaults)) {
      const next = custom?.[name];
      const value =
        typeof fallback === 'number'
          ? typeof next === 'number' && Number.isFinite(next)
            ? next
            : fallback
          : typeof next === 'string' && next.trim() !== ''
            ? next
            : fallback;
      result[token2CSSVar(name, prefix())] =
        typeof value === 'number'
          ? name === 'radioSize' || name === 'dotSize'
            ? String(value)
            : `${value}px`
          : value;
    }
    return result;
  });
}
