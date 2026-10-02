/**
 * List 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/list/style/index.js`：
 *
 * ```js
 * export interface ComponentToken {
 *   contentWidth: number | string;        // 内容宽度
 *   itemPaddingLG: string;                // 大号列表项内间距
 *   itemPaddingSM: string;                // 小号列表项内间距
 *   itemPadding: string;                  // 列表项内间距
 *   headerBg: string;                     // 头部区域背景色
 *   footerBg: string;                     // 底部区域背景色
 *   emptyTextPadding: CSSProperties['padding'];
 *   metaMarginBottom: CSSProperties['marginBottom'];
 *   avatarMarginRight: CSSProperties['marginRight'];
 *   titleMarginBottom: CSSProperties['marginBottom'];
 *   descriptionFontSize: number;
 * }
 * export const prepareComponentToken = (token) => ({
 *   contentWidth: 220,
 *   itemPadding: `${unit(token.paddingContentVertical)} 0`,
 *   itemPaddingSM: `${unit(token.paddingContentVerticalSM)} ${unit(token.paddingContentHorizontal)}`,
 *   itemPaddingLG: `${unit(token.paddingContentVerticalLG)} ${unit(token.paddingContentHorizontalLG)}`,
 *   headerBg: 'transparent',
 *   footerBg: 'transparent',
 *   emptyTextPadding: token.padding,
 *   metaMarginBottom: token.padding,
 *   avatarMarginRight: token.padding,
 *   titleMarginBottom: token.paddingSM,
 *   descriptionFontSize: token.fontSize,
 * });
 * ```
 *
 * **11 个 Component Token**（registry 数据一致）。产物交叉验证
 * （`theme: { cssVar: true }` 的 `--ant-list-*` 声明块，见 `style/index.ts` 文件头）
 * 逐条对上：`220px` / `12px 0` / `8px 16px` / `16px 24px` / `transparent` /
 * `transparent` / `16px` / `16px` / `16px` / `12px` / `14px`。
 *
 * ── 2 个 `mergeToken` 派生（用户**不可**覆盖）─────────────────────────────────
 *
 * 上游 `mergeToken<ListToken>(token, { listBorderedCls, minHeight })`。它们不进
 * `ComponentToken`，所以本文件**没有**对应字段：
 *
 * | 派生 | 来源 | 落点 |
 * |---|---|---|
 * | `listBorderedCls` | `` `${componentCls}-bordered` `` | **类名字符串**，`style/index.ts` 自己拼 |
 * | `minHeight` | `controlHeightLG`（= 40） | `-loading .{p}-spin-nested-loading` 的 `min-height` |
 *
 * ── 两个**必须保留 `calc()`** 的派生量（产物实测）────────────────────────────
 *
 * 1. `innerCornerBorderRadius` = `borderRadiusLG - lineWidth`
 *    ⇒ 产物是 `calc(var(--ant-border-radius-lg) - var(--ant-line-width))`，
 *    **不是** `7px`。预计算会让 L6 分叉（antd 的 cssinjs `token.calc` 产出的就是 calc 表达式）。
 * 2. `-item-action-split` 的 `height` = `fontHeight - marginXXS * 2`
 *    ⇒ 产物是 `calc(var(--ant-font-height) - var(--ant-margin-xxs) * 2)`。
 *
 * ⚠️ 本仓 `AliasToken` 的字段名与上游一致（`paddingContentVertical` 等），
 *    已核对 `packages/theme/src/types.ts:342-347`。
 */

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
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
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
