import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'colorText',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'controlItemBgHover',
  'colorFill',
  'controlItemBgActive',
  'controlItemBgActiveHover',
  'colorPrimary',
  'zIndexPopupBase',
  'fontSizeSM',
  'borderRadiusXS',
  'controlHeightSM',
  'motionDurationSlow',
  'motionEaseInOut',
] as const;

/** Variables consumed by the existing static Splitter stylesheet. */
export function useSplitterTheme(prefix: () => string) {
  const theme = useTheme();
  return computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const result: Record<string, string> = {};
    const vars = transformToken(theme.token.value).vars;
    for (const alias of aliases) {
      const key = token2CSSVar(alias);
      const value = vars[key];
      if (value !== undefined) result[key] = value;
    }
    const custom = theme.config.value.components?.Splitter;
    const defaults = prepareComponentToken(theme.token.value);
    const length = (name: keyof typeof defaults): number => {
      const candidate = custom?.[name];
      return typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0
        ? candidate
        : name === 'splitBarDraggableSize'
          ? length('resizeSpinnerSize')
          : defaults[name];
    };
    for (const name of [
      'splitBarSize',
      'splitTriggerSize',
      'resizeSpinnerSize',
      'splitBarDraggableSize',
    ] as const) {
      result[token2CSSVar(name, prefix())] = `${length(name)}px`;
    }
    return result;
  });
}
