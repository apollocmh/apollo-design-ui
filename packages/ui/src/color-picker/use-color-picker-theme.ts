import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { providePopoverInjection } from '../popover/Popover';
import { prepareComponentToken } from '../popover/style/token';

// ColorPicker declares no public component tokens. Scope the aliases its CSS consumes.
const aliases = [
  'borderRadius',
  'borderRadiusLG',
  'borderRadiusSM',
  'borderRadiusXS',
  'colorBgContainerDisabled',
  'colorBgElevated',
  'colorBorder',
  'colorError',
  'colorErrorHover',
  'colorErrorOutline',
  'colorFill',
  'colorFillSecondary',
  'colorPrimary',
  'colorPrimaryActive',
  'colorPrimaryHover',
  'colorSplit',
  'colorText',
  'colorTextDisabled',
  'colorTextPlaceholder',
  'colorTextQuaternary',
  'colorWarning',
  'colorWarningHover',
  'colorWarningOutline',
  'colorWhite',
  'controlHeight',
  'controlHeightLG',
  'controlHeightSM',
  'controlHeightXS',
  'controlOutline',
  'controlOutlineWidth',
  'fontFamily',
  'fontHeightSM',
  'fontSize',
  'fontSizeIcon',
  'fontSizeLG',
  'fontSizeSM',
  'lineHeightSM',
  'lineType',
  'lineWidth',
  'lineWidthBold',
  'marginSM',
  'marginXS',
  'marginXXS',
  'motionDurationFast',
  'motionDurationMid',
  'motionEaseInBack',
  'motionEaseOutBack',
  'paddingXS',
  'paddingXXS',
  'red6',
] as const;

export function useColorPickerTheme() {
  const theme = useTheme();
  providePopoverInjection(() => prepareComponentToken(theme.token.value).zIndexPopup);
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) result[name] = value;
    }
    return result;
  });
  return { style };
}
