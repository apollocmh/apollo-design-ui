import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadius',
  'borderRadiusXS',
  'colorBgSpotlight',
  'colorText',
  'colorTextLightSolid',
  'controlHeight',
  'dropShadowPopover',
  'fontFamily',
  'fontSize',
  'lineHeight',
  'motionDurationFast',
  'motionDurationMid',
  'motionDurationSlow',
  'motionEaseInOutCirc',
  'motionEaseOutCirc',
  'paddingSM',
  'paddingXS',
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

/** Current Tooltip values for the static stylesheet, shared by popup and PurePanel. */
export function useTooltipTheme(enabled: () => boolean = () => true) {
  const theme = useTheme();
  const componentToken = computed(() => {
    const defaults = prepareComponentToken(theme.token.value);
    const custom = enabled() ? theme.config.value.components?.Tooltip : undefined;
    return {
      ...defaults,
      maxWidth:
        typeof custom?.maxWidth === 'number' &&
        Number.isFinite(custom.maxWidth) &&
        custom.maxWidth >= 0
          ? custom.maxWidth
          : defaults.maxWidth,
      zIndexPopup:
        typeof custom?.zIndexPopup === 'number' && Number.isFinite(custom.zIndexPopup)
          ? custom.zIndexPopup
          : defaults.zIndexPopup,
    };
  });

  const style = computed<Record<string, string>>(() => {
    if (!enabled() || theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const style: Record<string, string> = {};
    for (const alias of aliases) {
      const name = token2CSSVar(alias);
      const value = variables[name];
      if (value !== undefined) style[name] = value;
    }
    for (const [name, value] of Object.entries(componentToken.value)) {
      style[token2CSSVar(name, 'apollo-tooltip')] =
        typeof value === 'number' && name !== 'zIndexPopup' ? `${value}px` : String(value);
    }
    return style;
  });

  return { theme, componentToken, style };
}
