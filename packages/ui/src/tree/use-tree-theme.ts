import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'borderRadius',
  'borderRadiusSM',
  'colorBgContainer',
  'colorBgContainerDisabled',
  'colorBgTextHover',
  'colorBorder',
  'colorFillQuaternary',
  'colorPrimary',
  'colorPrimaryBorder',
  'colorPrimaryHover',
  'colorSplit',
  'colorText',
  'colorTextDisabled',
  'colorTextQuaternary',
  'colorWhite',
  'controlInteractiveSize',
  'controlItemBgActive',
  'controlItemBgActiveDisabled',
  'controlItemBgHover',
  'controlHeightSM',
  'colorTextLightSolid',
  'fontFamily',
  'fontSize',
  'fontSizeLG',
  'fontWeightStrong',
  'lineHeight',
  'lineType',
  'lineWidth',
  'lineWidthBold',
  'lineWidthFocus',
  'marginXS',
  'motionDurationFast',
  'motionDurationMid',
  'motionDurationSlow',
  'motionEaseInBack',
  'motionEaseInOut',
  'motionEaseOutBack',
  'paddingXS',
] as const;
const dimensions = ['titleHeight', 'switcherSize', 'indentSize'] as const;
const colors = [
  'nodeHoverBg',
  'nodeHoverColor',
  'nodeSelectedBg',
  'nodeSelectedColor',
  'directoryNodeSelectedColor',
  'directoryNodeSelectedBg',
] as const;

export function useTreeTheme() {
  const theme = useTheme();
  const componentToken = computed(() => {
    const result = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Tree;
    for (const name of dimensions) {
      const value = custom?.[name];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) result[name] = value;
    }
    for (const name of colors) {
      const value = custom?.[name];
      if (typeof value === 'string') result[name] = value;
    }
    return result;
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
    for (const name of dimensions)
      result[token2CSSVar(name, 'apollo-tree')] = `${componentToken.value[name]}px`;
    for (const name of colors)
      result[token2CSSVar(name, 'apollo-tree')] = componentToken.value[name];
    return result;
  });
  const itemHeight = computed(
    () => theme.token.value.paddingXS / 2 + componentToken.value.titleHeight,
  );
  return { style, itemHeight };
}
