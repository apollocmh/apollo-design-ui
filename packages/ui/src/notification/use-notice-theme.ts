import { ZINDEX_KEY } from '@apollo-design/portal';
import { token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { computed, provide } from 'vue';
import { prepareComponentToken as prepareMessageToken } from '../message/style/token';
import { prepareComponentToken as prepareNotificationToken } from './style/token';

const aliases = [
  'borderRadiusLG',
  'borderRadiusSM',
  'boxShadow',
  'boxShadowTertiary',
  'colorBgElevated',
  'colorBgTextActive',
  'colorBgTextHover',
  'colorError',
  'colorIcon',
  'colorIconHover',
  'colorInfo',
  'colorPrimaryBorder',
  'colorSuccess',
  'colorText',
  'colorTextHeading',
  'colorWarning',
  'controlHeightLG',
  'fontFamily',
  'fontSize',
  'fontSizeLG',
  'lineHeight',
  'lineHeightLG',
  'lineWidthFocus',
  'margin',
  'marginLG',
  'marginSM',
  'marginXS',
  'marginXXL',
  'motionDurationFast',
  'motionDurationMid',
  'motionDurationSlow',
  'motionEaseInOut',
  'paddingContentHorizontalLG',
  'paddingLG',
  'paddingMD',
] as const;
function aliasStyle(token: Parameters<typeof transformToken>[0]) {
  const variables = transformToken(token).vars;
  const result: Record<string, string> = {};
  for (const alias of aliases) {
    const key = token2CSSVar(alias);
    const value = variables[key];
    if (value !== undefined) result[key] = value;
  }
  return result;
}

export function useMessageTheme() {
  const theme = useTheme();
  const token = computed(() => {
    const defaults = prepareMessageToken(theme.token.value);
    const custom = theme.config.value.components?.Message;
    return {
      zIndexPopup:
        typeof custom?.zIndexPopup === 'number' ? custom.zIndexPopup : defaults.zIndexPopup,
      contentBg: typeof custom?.contentBg === 'string' ? custom.contentBg : defaults.contentBg,
      contentPadding:
        typeof custom?.contentPadding === 'string'
          ? custom.contentPadding
          : defaults.contentPadding,
    };
  });
  const style = computed(() =>
    theme.sourceActive?.value === false
      ? {}
      : {
          ...aliasStyle(theme.token.value),
          '--apollo-message-z-index-popup': String(token.value.zIndexPopup),
          '--apollo-message-content-bg': token.value.contentBg,
          '--apollo-message-content-padding': token.value.contentPadding,
        },
  );
  return { token, style };
}

export function useNotificationTheme() {
  const theme = useTheme();
  const token = computed(() => {
    const defaults = prepareNotificationToken(theme.token.value);
    const custom = theme.config.value.components?.Notification;
    const width = custom?.width;
    return {
      zIndexPopup:
        typeof custom?.zIndexPopup === 'number' ? custom.zIndexPopup : defaults.zIndexPopup,
      width: typeof width === 'number' || typeof width === 'string' ? width : defaults.width,
      progressBg: typeof custom?.progressBg === 'string' ? custom.progressBg : defaults.progressBg,
      colorSuccessBg:
        typeof custom?.colorSuccessBg === 'string' ? custom.colorSuccessBg : undefined,
      colorErrorBg: typeof custom?.colorErrorBg === 'string' ? custom.colorErrorBg : undefined,
      colorInfoBg: typeof custom?.colorInfoBg === 'string' ? custom.colorInfoBg : undefined,
      colorWarningBg:
        typeof custom?.colorWarningBg === 'string' ? custom.colorWarningBg : undefined,
    };
  });
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const result = aliasStyle(theme.token.value);
    for (const [key, value] of Object.entries(token.value)) {
      if (value !== undefined)
        result[token2CSSVar(key, 'apollo-notification')] =
          typeof value === 'number' && key === 'width' ? `${value}px` : String(value);
    }
    return result;
  });
  return { token, style };
}

/** Match the existing numeric overlay context; arbitrary CSS expressions remain CSS. */
export function provideNoticeZIndex(
  defaultValue: () => number,
  override: () => import('vue').CSSProperties['zIndex'],
) {
  const value = computed(() => {
    const explicit = override();
    if (explicit === undefined) return defaultValue();
    if (typeof explicit === 'number') return Number.isFinite(explicit) ? explicit : defaultValue();
    if (typeof explicit === 'string' && explicit.trim() !== '') {
      const numeric = Number(explicit);
      return Number.isFinite(numeric) ? numeric : defaultValue();
    }
    return defaultValue();
  });
  provide(ZINDEX_KEY, value);
}
