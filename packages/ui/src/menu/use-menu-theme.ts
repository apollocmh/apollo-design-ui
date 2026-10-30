import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from './style/token';

/** Project the ten existing public Menu tokens; static CSS remains the default source. */
export function useMenuTheme() {
  const theme = useTheme();
  const componentToken = computed(() => {
    const base = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.Menu;
    const numeric = (key: keyof typeof base, fallback = base[key]) => {
      const value = custom?.[key];
      return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    };
    const radiusItem = numeric('radiusItem');
    const radiusSubMenuItem = numeric('radiusSubMenuItem');
    return {
      dropdownWidth: numeric('dropdownWidth'),
      zIndexPopup: numeric('zIndexPopup'),
      radiusItem,
      itemBorderRadius: numeric('itemBorderRadius', radiusItem),
      radiusSubMenuItem,
      subMenuItemBorderRadius: numeric('subMenuItemBorderRadius', radiusSubMenuItem),
      activeBarWidth: numeric('activeBarWidth'),
      activeBarHeight: numeric('activeBarHeight'),
      activeBarBorderWidth: numeric('activeBarBorderWidth'),
      itemMarginInline: numeric('itemMarginInline'),
    };
  });
  const style = computed<Record<string, string>>(() => {
    if (theme.sourceActive?.value === false) return {};
    const token = componentToken.value;
    return {
      ...transformToken(theme.token.value).vars,
      '--apollo-menu-dropdown-width': `${token.dropdownWidth}px`,
      '--apollo-menu-z-index-popup': String(token.zIndexPopup),
      '--apollo-menu-radius-item': `${token.radiusItem}px`,
      '--apollo-menu-item-border-radius': `${token.itemBorderRadius}px`,
      '--apollo-menu-radius-sub-menu-item': `${token.radiusSubMenuItem}px`,
      '--apollo-menu-sub-menu-item-border-radius': `${token.subMenuItemBorderRadius}px`,
      '--apollo-menu-active-bar-width': `${token.activeBarWidth}px`,
      '--apollo-menu-active-bar-height': `${token.activeBarHeight}px`,
      '--apollo-menu-active-bar-border-width': `${token.activeBarBorderWidth}px`,
      '--apollo-menu-item-margin-inline': `${token.itemMarginInline}px`,
      '--apollo-menu-item-width': `calc(100% - ${token.itemMarginInline * 2}px)`,
    };
  });
  return { theme, componentToken, style };
}
