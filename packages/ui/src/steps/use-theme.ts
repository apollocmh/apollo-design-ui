import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareStepsComponentToken } from './style/token';

const aliases = [
  'borderRadius',
  'borderRadiusSM',
  'colorBgContainer',
  'colorError',
  'colorErrorBg',
  'colorErrorBgFilledHover',
  'colorErrorHover',
  'colorFillTertiary',
  'colorPrimary',
  'colorPrimaryBg',
  'colorPrimaryBgHover',
  'colorPrimaryBorder',
  'colorPrimaryHover',
  'colorSplit',
  'colorText',
  'colorTextDescription',
  'colorTextDisabled',
  'colorTextLabel',
  'colorTextLightSolid',
  'colorTextQuaternary',
  'colorTextSecondary',
  'controlHeight',
  'controlItemBgHover',
  'fontFamily',
  'fontHeight',
  'fontHeightLG',
  'fontSize',
  'fontSizeIcon',
  'fontSizeLG',
  'fontSizeSM',
  'lineHeight',
  'lineHeightLG',
  'lineHeightSM',
  'lineType',
  'lineWidth',
  'lineWidthBold',
  'lineWidthFocus',
  'margin',
  'marginSM',
  'marginXS',
  'marginXXS',
  'motionDurationMid',
  'motionDurationSlow',
  'paddingSM',
  'paddingXS',
  'paddingXXS',
] as const;

/** Current scoped theme variables for the existing static Steps stylesheet. */
export function useStepsTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const vars = transformToken(theme.token.value).vars;
    const style: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      if (vars[name] !== undefined) style[name] = vars[name];
    }
    const custom = theme.config.value.components?.Steps ?? {};
    for (const [name, fallback] of Object.entries(prepareStepsComponentToken(theme.token.value))) {
      const candidate = custom[name];
      const stringValue =
        name === 'navArrowColor' || name === 'navContentMaxWidth' || name === 'iconSizeSM';
      const valid =
        (name !== 'navArrowColor' &&
          typeof candidate === 'number' &&
          Number.isFinite(candidate) &&
          candidate >= 0) ||
        (stringValue && typeof candidate === 'string' && candidate.trim().length > 0);
      const value = valid ? candidate : fallback;
      if (value !== undefined) {
        style[token2CSSVar(name, prefix())] = typeof value === 'number' ? `${value}px` : value;
      }
    }
    return style;
  });
}
