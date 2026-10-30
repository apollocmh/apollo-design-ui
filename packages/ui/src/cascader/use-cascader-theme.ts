import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken as prepareSelectToken } from '../select/style/token';
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
  'colorHighlight',
  'fontWeightStrong',
] as const;

const lengths = new Set(['controlWidth', 'controlItemWidth', 'dropdownHeight', 'menuPadding']);

/** Cascader owns its tokens; embedded Select CSS only borrows current alias-derived defaults. */
export function useCascaderTheme() {
  const theme = useTheme();
  const selectToken = computed(() => prepareSelectToken(theme.token.value));
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const name of aliases) {
      const variable = token2CSSVar(name);
      const value = variables[variable];
      if (value !== undefined) result[variable] = value;
    }
    for (const [name, value] of Object.entries(selectToken.value)) {
      if (name !== 'selectHeight' && name !== 'inputPaddingHorizontalBase')
        result[token2CSSVar(name, 'apollo-select')] = String(value);
    }
    const custom = theme.config.value.components?.Cascader;
    for (const [name, fallback] of Object.entries(prepareComponentToken(theme.token.value))) {
      const candidate = custom?.[name];
      const value =
        (typeof candidate === 'number' && Number.isFinite(candidate)) ||
        (typeof candidate === 'string' && candidate.trim())
          ? candidate
          : fallback;
      result[token2CSSVar(name, 'apollo-cascader')] =
        typeof value === 'number' && lengths.has(name) ? `${value}px` : String(value);
    }
    return result;
  });
  return { style, zIndexPopup: computed(() => selectToken.value.zIndexPopup) };
}
