import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { prepareComponentToken, tokenEntries } from './style/token';

const aliases = [
  'padding',
  'paddingSM',
  'paddingXS',
  'paddingLG',
  'paddingXXS',
  'borderRadiusLG',
  'colorFillAlter',
  'colorBgContainer',
  'lineWidth',
  'lineType',
  'colorBorder',
  'colorText',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'colorTextHeading',
  'fontHeight',
  'marginSM',
  'fontSizeIcon',
  'fontSizeLG',
  'lineHeightLG',
  'fontHeightLG',
  'colorTextDisabled',
  'colorPrimary',
  'motionDurationMid',
  'motionEaseInOut',
] as const;
export function useCollapseTheme(prefix: () => string) {
  const theme = useTheme();
  const reduced = ref(false);
  let media: MediaQueryList | undefined;
  const onPreference = (event: MediaQueryListEvent) => {
    reduced.value = event.matches;
  };
  onMounted(() => {
    if (typeof window.matchMedia !== 'function') return;
    media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.value = media.matches;
    media.addEventListener('change', onPreference);
  });
  onBeforeUnmount(() => media?.removeEventListener('change', onPreference));
  const styles = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const variables = transformToken(theme.token.value).vars;
    const result: Record<string, string> = {};
    for (const name of aliases) {
      const key = token2CSSVar(name);
      const value = variables[key];
      if (value !== undefined) result[key] = value;
    }
    const defaults = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Collapse ?? {};
    for (const [name, suffix] of tokenEntries) {
      const value = custom[name];
      const valid =
        name !== 'collapsePanelBorderRadius' &&
        typeof value === 'string' &&
        value.trim().length > 0;
      result[`--${prefix()}-${suffix}`] = valid ? value : defaults[name];
    }
    return result;
  });
  return {
    styles,
    supportMotion: computed(() => theme.token.value.motion !== false && !reduced.value),
  };
}
