import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { type ComputedRef, computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'paddingXXS',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'lineWidthBold',
  'lineWidth',
  'lineType',
  'colorSplit',
  'colorText',
  'colorPrimary',
  'motionDurationSlow',
] as const;

export function useAnchorTheme(prefixCls: ComputedRef<string>) {
  const theme = useTheme();
  const aliasStyle = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const vars = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const name of aliases) {
      const variable = token2CSSVar(name);
      if (vars[variable] !== undefined) result[variable] = vars[variable];
    }
    return result;
  });
  const componentStyle = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const base = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Anchor;
    const numeric = (name: keyof typeof base) => {
      const value = custom?.[name];
      return typeof value === 'number' && Number.isFinite(value) ? value : base[name];
    };
    return {
      [token2CSSVar('linkPaddingBlock', prefixCls.value)]: `${numeric('linkPaddingBlock')}px`,
      [token2CSSVar('linkPaddingInlineStart', prefixCls.value)]:
        `${numeric('linkPaddingInlineStart')}px`,
    };
  });
  return { aliasStyle, componentStyle };
}
