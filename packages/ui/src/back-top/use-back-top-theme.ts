import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareBackTopComponentToken } from './style/token';

const aliases = [
  'colorText',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'controlHeightLG',
  'colorTextLightSolid',
  'colorTextDescription',
  'motionDurationMid',
  'fontSizeHeading3',
  'lineWidthFocus',
  'colorPrimaryBorder',
] as const;

/** Project the current source theme onto the actual BackTop root. */
export function useBackTopTheme(prefix: () => string) {
  const theme = useTheme();
  const styles = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const alias of aliases) {
      const key = token2CSSVar(alias);
      const value = variables[key];
      if (value !== undefined) result[key] = value;
    }
    const custom = theme.config.value.components?.BackTop?.zIndexPopup;
    const value =
      (typeof custom === 'number' && Number.isFinite(custom)) ||
      (typeof custom === 'string' && custom.trim().length > 0)
        ? custom
        : prepareBackTopComponentToken(theme.token.value).zIndexPopup;
    if (value !== undefined) result[token2CSSVar('zIndexPopup', prefix())] = String(value);
    return result;
  });
  return { styles, motion: computed(() => theme.token.value.motion !== false) };
}
