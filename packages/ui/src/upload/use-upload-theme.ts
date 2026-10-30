import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadiusLG',
  'borderRadiusSM',
  'colorBgMask',
  'colorBorder',
  'colorError',
  'colorFillAlter',
  'colorIcon',
  'colorPrimary',
  'colorPrimaryBorder',
  'colorPrimaryHover',
  'colorText',
  'colorTextDescription',
  'colorTextDisabled',
  'colorTextHeading',
  'colorTextLightSolid',
  'controlItemBgHover',
  'fontFamily',
  'fontSize',
  'fontSizeHeading2',
  'fontSizeHeading3',
  'fontSizeLG',
  'lineHeight',
  'lineType',
  'lineWidth',
  'lineWidthFocus',
  'margin',
  'marginXL',
  'marginXS',
  'marginXXS',
  'motionDurationMid',
  'motionDurationSlow',
  'motionEaseInOut',
  'motionEaseInOutCirc',
  'padding',
  'paddingSM',
  'paddingXS',
] as const;

export function useUploadTheme(prefix: () => string) {
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
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Upload;
    const color = custom?.actionsColor;
    const size = custom?.pictureCardSize;
    style[token2CSSVar('actionsColor', prefix())] =
      typeof color === 'string' ? color : defaults.actionsColor;
    style[token2CSSVar('pictureCardSize', prefix())] =
      typeof size === 'number' && Number.isFinite(size) && size >= 0
        ? `${size}px`
        : typeof size === 'string' && size.trim()
          ? size
          : defaults.pictureCardSize;
    return style;
  });
}
