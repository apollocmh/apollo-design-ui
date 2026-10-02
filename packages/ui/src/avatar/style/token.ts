/**
 * Avatar 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/avatar/style/index.js`：
 *
 * ```js
 * export interface ComponentToken {
 *   containerSize: number;        // 头像尺寸
 *   containerSizeLG: number;      // 大号头像尺寸
 *   containerSizeSM: number;      // 小号头像尺寸
 *   textFontSize: number;         // 头像文字大小
 *   textFontSizeLG: number;
 *   textFontSizeSM: number;
 *   iconFontSize: number;         // 头像图标大小
 *   iconFontSizeLG: number | string;
 *   iconFontSizeSM: number;
 *   groupSpace: number;           // 头像组间距
 *   groupOverlapping: number;     // 头像组重叠宽度
 *   groupBorderColor: string;     // 头像组边框颜色
 * }
 * export const prepareComponentToken = (token) => ({
 *   containerSize: token.controlHeight,
 *   containerSizeLG: token.controlHeightLG,
 *   containerSizeSM: token.controlHeightSM,
 *   textFontSize: token.fontSize,
 *   textFontSizeLG: token.fontSize,
 *   textFontSizeSM: token.fontSize,
 *   iconFontSize: Math.round((token.fontSizeLG + token.fontSizeXL) / 2),
 *   iconFontSizeLG: token.fontSizeHeading3,
 *   iconFontSizeSM: token.fontSize,
 *   groupSpace: token.marginXXS,
 *   groupOverlapping: -token.marginXS,
 *   groupBorderColor: token.colorBorderBg,
 * });
 * ```
 *
 * **12 个 Component Token**（registry 数据一致）。产物交叉验证
 * （`theme: { cssVar: true }` 的 `--ant-avatar-*` 声明块，见 `style/index.ts` 文件头）
 * 逐条对上：`32px` / `40px` / `24px` / `14px` / `14px` / `14px` / `18px` / `24px`
 * / `14px` / `4px` / `-8px` / `#ffffff`。
 *
 * ── 一个**刻意不落地**的上游键（分析 §3）────────────────────────────────────
 *
 * `AvatarToken` 里除了两个派生键之外还声明了 `avatarBgColor`，但
 * `mergeToken` 里**从没给它赋过值** ⇒ 运行时恒 `undefined` 的死键。
 * 本仓**不引入**（否则要么类型报错、要么引入一个永远为 `undefined` 的死键）。
 *
 * ── 2 个 `mergeToken` 派生（用户**不可**覆盖）─────────────────────────────────
 *
 * 上游 `mergeToken<AvatarToken>(token, { avatarBg, avatarColor })`。它们不进
 * `ComponentToken`，所以本文件**没有**对应字段 —— 由 `style/index.ts` 直接消费
 * 对应的**全局** token：
 *
 * | 派生 | 来源 | 落点 |
 * |---|---|---|
 * | `avatarBg` | `colorTextPlaceholder` | `var(--apollo-color-text-placeholder)` |
 * | `avatarColor` | `colorTextLightSolid` | `var(--apollo-color-text-light-solid)` |
 *
 * （产物里它们就长这样：`background:var(--ant-color-text-placeholder)`、
 * `color:var(--ant-color-text-light-solid)`。）
 */

import type { AliasToken } from '@apollo-design/theme';

/** Avatar 的 Component Token。与上游逐字对齐（12 个）。 */
export interface ComponentToken {
  /** @desc 头像尺寸 */
  containerSize: number;
  /** @desc 大号头像尺寸 */
  containerSizeLG: number;
  /** @desc 小号头像尺寸 */
  containerSizeSM: number;
  /** @desc 头像文字大小 */
  textFontSize: number;
  /** @desc 大号头像文字大小 */
  textFontSizeLG: number;
  /** @desc 小号头像文字大小 */
  textFontSizeSM: number;
  /** @desc 头像图标大小 */
  iconFontSize: number;
  /** @desc 大号头像图标大小 */
  iconFontSizeLG: number | string;
  /** @desc 小号头像图标大小 */
  iconFontSizeSM: number;
  /** @desc 头像组间距 */
  groupSpace: number;
  /** @desc 头像组重叠宽度 */
  groupOverlapping: number;
  /** @desc 头像组边框颜色 */
  groupBorderColor: string;
}

/**
 * 与上游的 `prepareComponentToken` 逐字对应。
 *
 * ⚠️ 键的**顺序**与上游一致（`containerSize` → `containerSizeLG` → `containerSizeSM`
 * → `textFontSize` → `textFontSizeLG` → `textFontSizeSM` → `iconFontSize`
 * → `iconFontSizeLG` → `iconFontSizeSM` → `groupSpace` → `groupOverlapping`
 * → `groupBorderColor`）—— 与产物的 css-var 声明块顺序**逐条一致**，G3 的用例逐键断言。
 *
 * ⚠️ `iconFontSize` 是 **`Math.round`** 后的值：`Math.round((fontSizeLG + fontSizeXL) / 2)`
 *    = `Math.round((16 + 20) / 2)` = 18。`Math.round` 不能省（换主题后可能是 .5）。
 */
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
  containerSize: token.controlHeight,
  containerSizeLG: token.controlHeightLG,
  containerSizeSM: token.controlHeightSM,
  textFontSize: token.fontSize,
  textFontSizeLG: token.fontSize,
  textFontSizeSM: token.fontSize,
  iconFontSize: Math.round((token.fontSizeLG + token.fontSizeXL) / 2),
  iconFontSizeLG: token.fontSizeHeading3,
  iconFontSizeSM: token.fontSize,
  groupSpace: token.marginXXS,
  groupOverlapping: -token.marginXS,
  groupBorderColor: token.colorBorderBg,
});
