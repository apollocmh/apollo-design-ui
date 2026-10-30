import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

const numeric = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const text = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value : fallback;

/** One current projection feeds the popup CSS, positioning and numeric context. */
export function useDropdownTheme() {
  const theme = useTheme();
  const componentToken = computed(() => {
    const base = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Dropdown ?? {};
    return {
      zIndexPopup: numeric(custom.zIndexPopup, base.zIndexPopup),
      paddingBlock: numeric(custom.paddingBlock, base.paddingBlock),
      arrowOffsetHorizontal: numeric(custom.arrowOffsetHorizontal, base.arrowOffsetHorizontal),
      arrowOffsetVertical: numeric(custom.arrowOffsetVertical, base.arrowOffsetVertical),
      arrowShadowWidth: numeric(custom.arrowShadowWidth, base.arrowShadowWidth),
      arrowPath: text(custom.arrowPath, base.arrowPath),
      arrowPolygon: text(custom.arrowPolygon, base.arrowPolygon),
    };
  });
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const token = componentToken.value;
    return {
      ...transformToken(theme.token.value).vars,
      '--apollo-dropdown-z-index-popup': String(token.zIndexPopup),
      '--apollo-dropdown-padding-block': `${token.paddingBlock}px`,
      '--apollo-dropdown-arrow-offset-horizontal': `${token.arrowOffsetHorizontal}px`,
      '--apollo-dropdown-arrow-offset-vertical': `${token.arrowOffsetVertical}px`,
      '--apollo-dropdown-arrow-shadow-width': `${token.arrowShadowWidth}px`,
      '--apollo-dropdown-arrow-path': token.arrowPath,
      '--apollo-dropdown-arrow-polygon': token.arrowPolygon,
    };
  });
  return { theme, componentToken, style };
}
