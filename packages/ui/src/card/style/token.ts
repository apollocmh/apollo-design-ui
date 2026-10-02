/**
 * Card 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/card/style/index.js`：
 *
 * ```js
 * export interface ComponentToken {
 *   headerBg: string;              // 卡片头部背景色
 *   headerFontSize: number|string; // 卡片头部文字大小
 *   headerFontSizeSM: number|string;
 *   headerHeight: number|string;
 *   headerHeightSM: number|string;
 *   bodyPaddingSM: number;
 *   headerPaddingSM: number;
 *   bodyPadding: number;
 *   headerPadding: number;
 *   actionsBg: string;
 *   actionsLiMargin: string;
 *   tabsMarginBottom: number;
 *   extraColor: string;
 * }
 * export const prepareComponentToken = (token) => ({
 *   headerBg: 'transparent',
 *   headerFontSize: token.fontSizeLG,
 *   headerFontSizeSM: token.fontSize,
 *   headerHeight: token.fontSizeLG * token.lineHeightLG + token.padding * 2,
 *   headerHeightSM: token.fontSize * token.lineHeight + token.paddingXS * 2,
 *   actionsBg: token.colorBgContainer,
 *   actionsLiMargin: `${token.paddingSM}px 0`,
 *   tabsMarginBottom: -token.padding - token.lineWidth,
 *   extraColor: token.colorText,
 *   bodyPaddingSM: 12, // Fixed padding.
 *   headerPaddingSM: 12,
 *   bodyPadding: token.bodyPadding ?? token.paddingLG,
 *   headerPadding: token.headerPadding ?? token.paddingLG,
 * });
 * ```
 *
 * **13 个 Component Token**（registry 数据一致）。产物交叉验证（`theme: { cssVar: true }`
 * 的 `--ant-card-*` 声明块，见 `style/index.ts` 文件头）逐条对上：
 * `transparent` / `16px` / `14px` / `56px` / `38px` / `#ffffff` / `12px 0` / `-17px`
 * / `rgba(0,0,0,0.88)` / `12px` / `12px` / `24px` / `24px`。
 *
 * ── 两处**刻意不落地**的上游键（分析 §3，G3 用产物交叉验证）──────────────────
 *
 * `bodyPadding: token.bodyPadding ?? token.paddingLG` 与
 * `headerPadding: token.headerPadding ?? token.paddingLG` 里的 `token.bodyPadding` /
 * `token.headerPadding` **不是标准 `AliasToken`** —— 它们来自 antd v4 的全局 token
 * （迁移遗留）。产物交叉验证：两者都等于 `24px`（= `paddingLG`），
 * 说明运行时那两个键**恒为 `undefined`**。
 *
 * ⇒ 本仓**不引入**这两个键（否则要么类型报错、要么引入两个永远为 `undefined` 的死键），
 * 直接写 `token.paddingLG`。差异登记在 `README.md` §2 / §4。
 *
 * ── 4 个 `mergeToken` 派生（用户**不可**覆盖）─────────────────────────────────
 *
 * 上游 `mergeToken<CardToken>(token, { cardShadow, cardHeadPadding, cardPaddingBase,
 * cardActionsIconSize })`。它们不进 `ComponentToken`，所以本文件**没有**对应字段 ——
 * 由 `style/index.ts` 直接消费对应的**全局** token：
 *
 * | 派生 | 来源 | 落点 |
 * |---|---|---|
 * | `cardShadow` | `boxShadowCard` | `var(--apollo-box-shadow-card)` |
 * | `cardHeadPadding` | `padding` | `var(--apollo-padding)` |
 * | `cardPaddingBase` | `paddingLG` | `var(--apollo-padding-lg)` |
 * | `cardActionsIconSize` | `fontSize` | `var(--apollo-font-size)` |
 *
 * （产物里它们就长这样：`box-shadow:var(--ant-box-shadow-card)`、
 * `padding-top:var(--ant-padding)`、`padding:var(--ant-padding-lg)`、
 * `min-width:calc(var(--ant-font-size) * 2)`。）
 */

import type { AliasToken } from '@apollo-design/theme';

/** Card 的 Component Token。与上游逐字对齐（13 个）。 */
export interface ComponentToken {
  /** @desc 卡片头部背景色 */
  headerBg: string;
  /** @desc 卡片头部文字大小 */
  headerFontSize: number | string;
  /** @desc 小号卡片头部文字大小 */
  headerFontSizeSM: number | string;
  /** @desc 卡片头部高度 */
  headerHeight: number | string;
  /** @desc 小号卡片头部高度 */
  headerHeightSM: number | string;
  /** @desc 小号卡片内边距 */
  bodyPaddingSM: number;
  /** @desc 小号卡片头部内边距 */
  headerPaddingSM: number;
  /** @desc 卡片内边距 */
  bodyPadding: number;
  /** @desc 卡片头部内边距 */
  headerPadding: number;
  /** @desc 操作区背景色 */
  actionsBg: string;
  /** @desc 操作区每一项的外间距 */
  actionsLiMargin: string;
  /** @desc 内置标签页组件下间距 */
  tabsMarginBottom: number;
  /** @desc 额外区文字颜色 */
  extraColor: string;
}

/**
 * 与上游的 `prepareComponentToken` 逐字对应。
 *
 * ⚠️ 键的**顺序**与上游一致（`headerBg` → `headerFontSize` → `headerFontSizeSM`
 * → `headerHeight` → `headerHeightSM` → `actionsBg` → `actionsLiMargin`
 * → `tabsMarginBottom` → `extraColor` → `bodyPaddingSM` → `headerPaddingSM`
 * → `bodyPadding` → `headerPadding`）—— 与产物的 css-var 声明块顺序**逐条一致**，
 * G3 的用例会逐键断言。
 *
 * ⚠️ `bodyPadding` / `headerPadding` 用的是 `token.paddingLG`（上游的
 *    `token.bodyPadding ?? token.paddingLG`，见文件头）。
 */
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
  headerBg: 'transparent',
  headerFontSize: token.fontSizeLG,
  headerFontSizeSM: token.fontSize,
  headerHeight: token.fontSizeLG * token.lineHeightLG + token.padding * 2,
  headerHeightSM: token.fontSize * token.lineHeight + token.paddingXS * 2,
  actionsBg: token.colorBgContainer,
  actionsLiMargin: `${token.paddingSM}px 0`,
  tabsMarginBottom: -token.padding - token.lineWidth,
  extraColor: token.colorText,
  bodyPaddingSM: 12,
  headerPaddingSM: 12,
  bodyPadding: token.paddingLG,
  headerPadding: token.paddingLG,
});
