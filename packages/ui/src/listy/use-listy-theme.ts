import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'colorText',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'lineWidth',
  'lineType',
  'colorSplit',
  'motionDurationMid',
  'motionEaseInOut',
  'controlItemBgHover',
  'paddingXS',
  'colorTextDescription',
  'fontWeightStrong',
  'colorBgContainer',
  'colorFillAlter',
];

export function useListyTheme(prefix: () => string) {
  const theme = useTheme();
  const tokens = computed(() => ({
    ...prepareComponentToken(theme.token.value),
    ...theme.config.value.components?.Listy,
  }));
  const styles = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const values = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const name of aliases) {
      const key = token2CSSVar(name);
      const value = values[key];
      if (value !== undefined) result[key] = value;
    }
    for (const [name, value] of Object.entries(tokens.value)) {
      result[token2CSSVar(name, prefix())] = typeof value === 'number' ? `${value}px` : value;
    }
    return result;
  });
  const itemHeight = computed(() => {
    const padding = tokens.value.itemPaddingBlock;
    const pixels =
      typeof padding === 'number'
        ? padding
        : /^\d+(?:\.\d+)?px$/.test(padding)
          ? Number.parseFloat(padding)
          : theme.token.value.paddingSM;
    return theme.token.value.fontHeight + pixels * 2;
  });
  return { styles, itemHeight };
}
