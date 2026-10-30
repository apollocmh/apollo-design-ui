import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const aliases = [
  'colorText',
  'colorTextHeading',
  'colorWarning',
  'fontSize',
  'fontWeightStrong',
  'marginXS',
  'marginXXS',
] as const;

/** The popup and static panel consume the current Popconfirm owner theme. */
export function usePopconfirmTheme() {
  const theme = useTheme();
  const componentToken = computed(() => {
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Popconfirm?.zIndexPopup;
    return {
      zIndexPopup:
        typeof custom === 'number' && Number.isFinite(custom) ? custom : defaults.zIndexPopup,
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
    style[token2CSSVar('zIndexPopup', 'apollo-popconfirm')] = String(
      componentToken.value.zIndexPopup,
    );
    return style;
  });
  return { componentToken, style };
}
