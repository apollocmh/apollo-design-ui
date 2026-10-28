import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style';

/** Project current source tokens without changing the neutral QR image colors. */
export function useQRCodeTheme(getPrefix: () => string) {
  const theme = useTheme();
  const styles = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const token = theme.config.value.components?.QRCode?.QRCodeCoverBackgroundColor;
    return {
      ...transformToken(theme.token.value).vars,
      [`--${getPrefix()}-cover-background-color`]:
        typeof token === 'string' && token.trim()
          ? token
          : prepareComponentToken(theme.token.value).QRCodeCoverBackgroundColor,
    };
  });
  return { styles };
}
