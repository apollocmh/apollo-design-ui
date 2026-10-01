/**
 * Breadcrumb 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/breadcrumb/style/index.js`：
 *
 * ```js
 * export interface ComponentToken {
 *   itemColor: string;        // 面包屑项文字颜色
 *   iconFontSize: number;     // 图标大小
 *   linkColor: string;        // 链接文字颜色
 *   linkHoverColor: string;   // 链接文字悬浮颜色
 *   lastItemColor: string;    // 最后一项文字颜色
 *   separatorMargin: number;  // 分隔符外间距
 *   separatorColor: string;   // 分隔符颜色
 * }
 * export const prepareComponentToken = (token) => ({
 *   itemColor: token.colorTextDescription,
 *   lastItemColor: token.colorText,
 *   iconFontSize: token.fontSize,
 *   linkColor: token.colorTextDescription,
 *   linkHoverColor: token.colorText,
 *   separatorColor: token.colorTextDescription,
 *   separatorMargin: token.marginXS,
 * });
 * ```
 *
 * **7 个 Component Token**（registry 数据一致），**全部是别名派生**
 * ⇒ 落 `var(--apollo-*)`，随主题自适应、B7 可校验。
 *
 * ── 与 anchor 的对比（token 数都小，但形状不同）────────────────────────────
 *
 * | | anchor | breadcrumb |
 * |---|---|---|
 * | Component Token | 2 | **7** |
 * | `mergeToken` 派生 | 4（`holderOffsetBlock` 等） | **0**（上游是 `mergeToken(token, {})`，空） |
 *
 * ⇒ 本文件**没有**派生值要写；`style/index.ts` 直接消费这 7 个 token。
 */

import type { AliasToken } from '@apollo-design/theme';

/** Breadcrumb 的 Component Token。与上游逐字对齐（7 个，都是别名派生）。 */
export interface ComponentToken {
  /** @desc 面包屑项文字颜色 */
  itemColor: string;
  /** @desc 图标大小 */
  iconFontSize: number;
  /** @desc 链接文字颜色 */
  linkColor: string;
  /** @desc 链接文字悬浮颜色 */
  linkHoverColor: string;
  /** @desc 最后一项文字颜色 */
  lastItemColor: string;
  /** @desc 分隔符外间距 */
  separatorMargin: number;
  /** @desc 分隔符颜色 */
  separatorColor: string;
}

/**
 * 与上游的 `prepareComponentToken` 逐字对应。
 *
 * ⚠️ 键的**顺序**与上游一致（`itemColor` → `lastItemColor` → `iconFontSize` → `linkColor`
 * → `linkHoverColor` → `separatorColor` → `separatorMargin`）—— 顺序错了不影响运行，
 * 但会让「与产物逐键对拍」的清单难读（G3 的用例会逐键断言）。
 */
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
  itemColor: token.colorTextDescription,
  lastItemColor: token.colorText,
  iconFontSize: token.fontSize,
  linkColor: token.colorTextDescription,
  linkHoverColor: token.colorText,
  separatorColor: token.colorTextDescription,
  separatorMargin: token.marginXS,
});
