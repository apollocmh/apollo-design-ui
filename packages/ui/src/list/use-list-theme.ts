import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { type ComponentToken, prepareComponentToken } from './style/token';

const text = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value : fallback;
const length = (value: unknown, fallback: string | number): string | number =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && value.trim())
    ? value
    : fallback;
const unit = (value: string | number): string => (typeof value === 'number' ? `${value}px` : value);

/** Static styles consume variables from the current source Vue theme. */
export function useListTheme(getPrefixCls: () => string, isBordered: () => boolean | undefined) {
  const theme = useTheme();
  const token = computed<ComponentToken>(() => {
    const base = prepareComponentToken(theme.token.value);
    const custom = theme.config.value.components?.List ?? {};
    const itemPadding = isBordered()
      ? `${unit(theme.token.value.paddingContentVertical)} ${unit(theme.token.value.paddingLG)}`
      : base.itemPadding;
    return {
      contentWidth: length(custom.contentWidth, base.contentWidth),
      itemPadding: text(custom.itemPadding, itemPadding),
      itemPaddingSM: text(custom.itemPaddingSM, base.itemPaddingSM),
      itemPaddingLG: text(custom.itemPaddingLG, base.itemPaddingLG),
      headerBg: text(custom.headerBg, base.headerBg),
      footerBg: text(custom.footerBg, base.footerBg),
      emptyTextPadding: length(custom.emptyTextPadding, base.emptyTextPadding),
      metaMarginBottom: length(custom.metaMarginBottom, base.metaMarginBottom),
      avatarMarginRight: length(custom.avatarMarginRight, base.avatarMarginRight),
      titleMarginBottom: length(custom.titleMarginBottom, base.titleMarginBottom),
      descriptionFontSize:
        typeof custom.descriptionFontSize === 'number' &&
        Number.isFinite(custom.descriptionFontSize)
          ? custom.descriptionFontSize
          : base.descriptionFontSize,
    };
  });
  const styles = computed<Record<string, string>>(() => {
    if (!Object.keys(theme.config.value).length) return {};
    const p = getPrefixCls();
    const t = token.value;
    return {
      ...transformToken(theme.token.value).vars,
      [`--${p}-content-width`]: unit(t.contentWidth),
      [`--${p}-item-padding`]: t.itemPadding,
      [`--${p}-item-padding-sm`]: t.itemPaddingSM,
      [`--${p}-item-padding-lg`]: t.itemPaddingLG,
      [`--${p}-header-bg`]: t.headerBg,
      [`--${p}-footer-bg`]: t.footerBg,
      [`--${p}-empty-text-padding`]: unit(t.emptyTextPadding),
      [`--${p}-meta-margin-bottom`]: unit(t.metaMarginBottom),
      [`--${p}-avatar-margin-right`]: unit(t.avatarMarginRight),
      [`--${p}-title-margin-bottom`]: unit(t.titleMarginBottom),
      [`--${p}-description-font-size`]: unit(t.descriptionFontSize),
    };
  });
  return { styles };
}
