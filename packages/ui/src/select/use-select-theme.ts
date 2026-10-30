import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadius',
  'borderRadiusLg',
  'borderRadiusSm',
  'borderRadiusXs',
  'boxShadowSecondary',
  'colorBgContainer',
  'colorBgContainerDisabled',
  'colorBgElevated',
  'colorBorder',
  'colorBorderDisabled',
  'colorError',
  'colorErrorAffix',
  'colorErrorBg',
  'colorErrorBgHover',
  'colorErrorBorderHover',
  'colorErrorOutline',
  'colorFillQuaternary',
  'colorFillSecondary',
  'colorFillTertiary',
  'colorIcon',
  'colorIconHover',
  'colorPrimary',
  'colorSplit',
  'colorText',
  'colorTextDescription',
  'colorTextDisabled',
  'colorTextPlaceholder',
  'colorTextQuaternary',
  'colorWarning',
  'colorWarningAffix',
  'colorWarningBg',
  'colorWarningBgHover',
  'colorWarningHover',
  'colorWarningOutline',
  'controlHeight',
  'controlHeightLg',
  'controlHeightSm',
  'controlItemBgActiveHover',
  'controlOutlineWidth',
  'controlPaddingHorizontal',
  'fontFamily',
  'fontHeight',
  'fontHeightLg',
  'fontSize',
  'fontSizeIcon',
  'fontSizeLg',
  'fontSizeSm',
  'lineHeight',
  'lineHeightLg',
  'lineType',
  'lineWidth',
  'marginXs',
  'motionDurationMid',
  'motionDurationSlow',
  'motionEaseInOut',
  'motionEaseInQuint',
  'motionEaseOutQuint',
  'paddingSm',
  'paddingXs',
  'paddingXxs',
  'colorPrimaryHover',
  'controlOutline',
  'controlItemBgActive',
  'controlItemBgHover',
] as const;
const lengths = new Set([
  'lineWidthFocus',
  'INTERNAL_FIXED_ITEM_MARGIN',
  'optionFontSize',
  'optionHeight',
  'singleItemHeightLG',
  'multipleItemHeight',
  'multipleItemHeightSM',
  'multipleItemHeightLG',
  'showArrowPaddingInlineEnd',
  'selectAffixPadding',
  'inputPaddingHorizontalBase',
  'selectHeight',
]);

/** Current theme variables accompany both the selector and its teleported popup. */
export function useSelectTheme() {
  const theme = useTheme();
  const componentToken = computed(() => {
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Select;
    const values: Record<string, string | number> = { ...defaults };
    for (const [name, fallback] of Object.entries(defaults)) {
      const value = custom?.[name];
      if (typeof value === 'string' && value.trim() !== '') values[name] = value;
      else if (typeof value === 'number' && Number.isFinite(value))
        values[name] = lengths.has(name) ? `${value}px` : value;
      else values[name] = fallback;
    }
    return values;
  });
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const name of aliases) {
      const variable = token2CSSVar(name);
      const value = variables[variable];
      if (value !== undefined) result[variable] = value;
    }
    for (const [name, value] of Object.entries(componentToken.value)) {
      // Root size rules own these internal derived variables.
      if (name === 'selectHeight' || name === 'inputPaddingHorizontalBase') continue;
      result[token2CSSVar(name, 'apollo-select')] = String(value);
    }
    return result;
  });
  const optionHeight = computed(() => {
    const value = componentToken.value.optionHeight;
    return typeof value === 'number'
      ? value
      : Number.parseFloat(value ?? '') || theme.token.value.controlHeight;
  });
  const zIndexPopup = computed(() => Number(componentToken.value.zIndexPopup));
  return { style, optionHeight, zIndexPopup };
}
