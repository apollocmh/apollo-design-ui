/** List component tokens consumed by static CSS and the current Vue theme. */

import type { AliasToken } from '@apollo-design/theme';

/** List 的 Component Token。与上游 `ComponentToken` 逐字段对齐。 */
export interface ComponentToken {
  /** 内容宽度。 */
  contentWidth: number | string;
  /** 大号列表项内间距。 */
  itemPaddingLG: string;
  /** 小号列表项内间距。 */
  itemPaddingSM: string;
  /** 列表项内间距。 */
  itemPadding: string;
  /** 头部区域背景色。 */
  headerBg: string;
  /** 底部区域背景色。 */
  footerBg: string;
  /** 空文本内边距。 */
  emptyTextPadding: string | number;
  /** Meta 下间距。 */
  metaMarginBottom: string | number;
  /** 头像右间距。 */
  avatarMarginRight: string | number;
  /** 标题下间距。 */
  titleMarginBottom: string | number;
  /** 描述文字大小。 */
  descriptionFontSize: number;
}

/** 数字带 `px`、字符串原样 —— 与 cssinjs 的 `unit()` 同义。 */
const unit = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : String(value);

/**
 * 与上游 `prepareComponentToken` **逐条对齐**（规则 R7）。
 *
 * ⚠️ `itemPadding*` 是**两个值拼成的字符串**（`"<vertical> <horizontal>"`），
 *    不是单个数值 —— 上游就是这么写的，`unit()` 逐段调用。
 */
export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  contentWidth: 220,
  itemPadding: `${unit(token.paddingContentVertical)} 0`,
  itemPaddingSM: `${unit(token.paddingContentVerticalSM)} ${unit(token.paddingContentHorizontal)}`,
  itemPaddingLG: `${unit(token.paddingContentVerticalLG)} ${unit(
    token.paddingContentHorizontalLG,
  )}`,
  headerBg: 'transparent',
  footerBg: 'transparent',
  emptyTextPadding: token.padding,
  metaMarginBottom: token.padding,
  avatarMarginRight: token.padding,
  titleMarginBottom: token.paddingSM,
  descriptionFontSize: token.fontSize,
});
