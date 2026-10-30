import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadius',
  'borderRadiusLG',
  'borderRadiusSM',
  'colorBgContainer',
  'colorBgContainerDisabled',
  'colorBorder',
  'colorBorderDisabled',
  'colorError',
  'colorErrorAffix',
  'colorErrorBg',
  'colorErrorBgHover',
  'colorErrorBorderHover',
  'colorErrorOutline',
  'colorErrorText',
  'colorFillAlter',
  'colorFillSecondary',
  'colorFillTertiary',
  'colorIcon',
  'colorPrimary',
  'colorPrimaryHover',
  'colorText',
  'colorTextDisabled',
  'colorTextPlaceholder',
  'colorWarning',
  'colorWarningAffix',
  'colorWarningBg',
  'colorWarningBgHover',
  'colorWarningBorderHover',
  'colorWarningOutline',
  'colorWarningText',
  'controlOutline',
  'controlOutlineWidth',
  'fontFamily',
  'lineHeight',
  'lineHeightLG',
  'lineType',
  'lineWidth',
  'lineWidthFocus',
  'motionDurationMid',
] as const;

const lengths = [
  'paddingBlock',
  'paddingBlockSM',
  'paddingBlockLG',
  'paddingInline',
  'paddingInlineSM',
  'paddingInlineLG',
  'inputFontSize',
  'inputFontSizeLG',
  'inputFontSizeSM',
  'inputAffixPadding',
  'controlWidth',
  'handleWidth',
  'handleFontSize',
] as const;

const colors = [
  'handleActiveBg',
  'handleBg',
  'filledHandleBg',
  'handleHoverColor',
  'handleBorderColor',
] as const;

function lengthValue(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return `${value}px`;
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

/** Current source values for the static InputNumber stylesheet, scoped to its root. */
export function useInputNumberTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const style: Record<string, string> = {};
    const variables = transformToken(theme.token.value).vars;
    for (const alias of aliases) {
      const key = token2CSSVar(alias);
      const value = variables[key];
      if (value !== undefined) style[key] = value;
    }

    const custom = theme.config.value.components?.InputNumber ?? {};
    const visibleCandidate: unknown = custom.handleVisible;
    const visible =
      typeof visibleCandidate === 'boolean' || visibleCandidate === 'auto'
        ? visibleCandidate
        : 'auto';
    const defaults = prepareComponentToken(theme.token.value, visible);
    const componentVar = (name: string) => token2CSSVar(name, prefix());
    for (const key of lengths) {
      style[componentVar(key)] = lengthValue(custom[key], defaults[key]);
    }
    for (const key of colors) {
      const value = custom[key];
      style[componentVar(key)] =
        typeof value === 'string' && value.trim() !== '' ? value : defaults[key];
    }

    const width = `var(${componentVar('handleWidth')})`;
    const opacity = custom.handleOpacity;
    style[componentVar('handleVisible')] = String(visible);
    style[componentVar('handleOpacity')] =
      typeof opacity === 'number' && Number.isFinite(opacity) && opacity >= 0 && opacity <= 1
        ? String(opacity)
        : String(defaults.handleOpacity);
    style[componentVar('handleVisibleWidth')] = lengthValue(
      custom.handleVisibleWidth,
      visible === true ? width : '0px',
    );
    style[componentVar('handleHoverWidth')] = visible === false ? '0px' : width;
    style[componentVar('handleHoverOpacity')] = visible === false ? '0' : '1';
    return style;
  });
}
