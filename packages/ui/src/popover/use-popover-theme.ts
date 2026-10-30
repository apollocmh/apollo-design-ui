import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadiusLG',
  'borderRadiusXS',
  'colorBgElevated',
  'colorText',
  'colorTextHeading',
  'dropShadowPopover',
  'fontFamily',
  'fontSize',
  'fontWeightStrong',
  'lineHeight',
  'motionDurationMid',
  'motionEaseInOutCirc',
  'motionEaseOutCirc',
  'sizePopupArrow',
  'blue6',
  'purple6',
  'cyan6',
  'green6',
  'magenta6',
  'pink6',
  'red6',
  'orange6',
  'yellow6',
  'volcano6',
  'geekblue6',
  'lime6',
  'gold6',
] as const;

/** Keep the popup and static panel on their own current Popover theme. */
export function usePopoverTheme() {
  const theme = useTheme();
  const componentToken = computed(() => {
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Popover;
    const length = (name: 'titleMinWidth' | 'innerPadding' | 'titleMarginBottom') => {
      const value = custom?.[name];
      return typeof value === 'number' && Number.isFinite(value) && value >= 0
        ? value
        : defaults[name];
    };
    const zIndex = custom?.zIndexPopup;
    return {
      ...defaults,
      titleMinWidth: length('titleMinWidth'),
      innerPadding: length('innerPadding'),
      titleMarginBottom: length('titleMarginBottom'),
      zIndexPopup:
        typeof zIndex === 'number' && Number.isFinite(zIndex) ? zIndex : defaults.zIndexPopup,
    };
  });
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const style: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) style[name] = value;
    }
    for (const [name, value] of Object.entries(componentToken.value)) {
      style[token2CSSVar(name, 'apollo-popover')] =
        typeof value === 'number' && name !== 'zIndexPopup' ? `${value}px` : String(value);
    }
    return style;
  });
  return { theme, componentToken, style };
}
