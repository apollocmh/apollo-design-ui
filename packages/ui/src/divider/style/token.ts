/**
 * Divider 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/divider/style/index.js` 的 `ComponentToken` 接口与
 * `prepareComponentToken`。**名称、数量、默认值计算方式逐条对齐**（规则 R7）——
 * 这是「用户能无缝迁移自定义主题」的前提。
 *
 * ── 三个 token 与它们的落地形态 ────────────────────────────────────────────────
 *
 * | token | antd 默认值 | 我们的落地 |
 * |---|---|---|
 * | `textPaddingInline` | `'1em'`（字面量） | `TEXT_PADDING_INLINE` 常量，内联进 CSS |
 * | `orientationMargin` | `0.05`（字面量，0～1） | `ORIENTATION_MARGIN` 常量，内联进 `calc()` |
 * | `verticalMarginInline` | `token.marginXS`（别名派生） | `var(--apollo-margin-xs)` |
 *
 * ── 为什么两个字面量是「内联」而不是 CSS 变量 ──────────────────────────────────
 *
 * antd 在 `theme.cssVar` 模式下会把它们声明成组件级 CSS 变量：
 *
 * ```css
 * .css-var-_R_0_.apollo-divider{
 *   --apollo-divider-text-padding-inline:1em;
 *   --apollo-divider-orientation-margin:0.05;
 *   --apollo-divider-vertical-margin-inline:8px;
 * }
 * ```
 *
 * （实测：用 `@ant-design/cssinjs` 的 `extractStyle` 提取 antd 6.6.4 的真实产物。）
 *
 * 我们的零运行时管线目前**没有**「Component Token → CSS 变量」这一段：
 * `packages/theme` 只把**别名 token** 落成 `tokens.css` 的 `:root` 块。
 * 而 `tests/build/run.mjs` 的 B7 要求 ui 的 CSS 里每个 `var(--apollo-*)` 都必须在
 * theme 的 `tokens.css` 里有声明 —— 组件文件内的局部声明它看不到。
 *
 * 所以：**别名派生的** token 走 `var(--apollo-margin-xs)`（B7 可校验、且随主题自适应）；
 * **字面量的** token 由本模块给出唯一真源，由 `style/index.ts` 内联消费。
 * 「字面量出现在 CSS 里」不等于 H9 的硬编码 —— 它的来源是本文件这个 Token 定义，
 * 而且与 antd 的 `prepareComponentToken` 逐字相同。
 *
 * ⚠️ 已知缺口（登记在 `README.md` §7）：没有 ConfigProvider 时，用户**无法**通过
 *    `theme.components.Divider` 覆盖这两个字面量 token。落点是
 *    「Component Token → CSS 变量」那段管线 + ConfigProvider 组件本身。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（那是 L6 的逐像素比对）。
 *   - 没证明这三个 token 与 antd 的**运行时**取值一致：字面量是静态可比的，
 *     而 `verticalMarginInline` 依赖 theme 的 `marginXS` —— 由 B7 保证变量存在、
 *     由 L6 保证视觉一致。
 */

import type { AliasToken } from '@apollo-design/theme';
import type { CSSProperties } from 'vue';

/** 文本横向内间距。antd 的默认值是字面量 `'1em'`，不是别名 token。 */
export const TEXT_PADDING_INLINE: NonNullable<ComponentToken['textPaddingInline']> = '1em';

/**
 * 文本与边缘距离，取值 0～1。
 *
 * antd 的默认值是字面量 `0.05`。它在 CSS 里被用作 `calc(${orientationMargin} * 100%)`
 * 的比例系数，因此**不能**带单位。
 */
export const ORIENTATION_MARGIN = 0.05;

/**
 * Divider 的 Component Token。与 antd 的 `ComponentToken` 接口逐字段对齐。
 *
 * 注释里的 `@desc` / `@descEN` 与 antd 同构 —— 文档表格由它们生成。
 */
export interface ComponentToken {
  /**
   * @desc 文本横向内间距
   * @descEN Horizontal padding of text
   */
  textPaddingInline: CSSProperties['paddingInline'];
  /**
   * @desc 文本与边缘距离，取值 0 ～ 1
   * @descEN Distance between text and edge, which should be a number between 0 and 1.
   */
  orientationMargin?: number;
  /**
   * @desc 纵向分割线的横向外间距
   * @descEN Horizontal margin of vertical Divider
   */
  verticalMarginInline: CSSProperties['marginInline'];
}

/**
 * 由别名 token 派生 Divider 的 Component Token 默认值。
 *
 * 与 antd 的 `prepareComponentToken` **逐条对应**：
 *
 * ```ts
 * export const prepareComponentToken = (token) => ({
 *   textPaddingInline: '1em',
 *   orientationMargin: 0.05,
 *   verticalMarginInline: token.marginXS,
 * });
 * ```
 *
 * ⚠️ 它**不是**死代码：`registry/tokens.json` 的 `divider` 清单、文档的 Design Token 表、
 *    以及将来「Component Token → CSS 变量」管线的入口都以它为准。
 *    `style/index.ts` 消费的是同一组默认值（字面量走常量、别名走 `var()`）。
 */
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
  textPaddingInline: TEXT_PADDING_INLINE,
  orientationMargin: ORIENTATION_MARGIN,
  verticalMarginInline: token.marginXS,
});
