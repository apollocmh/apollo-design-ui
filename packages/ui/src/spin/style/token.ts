/**
 * Spin 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `components/spin/style/index.ts` 的 `ComponentToken` 接口与
 * `prepareComponentToken`。**名称、数量、默认值计算方式逐条对齐**（规则 R7）——
 * 这是「用户能无缝迁移自定义主题」的前提。
 *
 * ── 四个 token 与它们的落地形态 ────────────────────────────────────────────────
 *
 * | token | antd 默认值 | 我们的落地 |
 * |---|---|---|
 * | `contentHeight` | `400`（字面量） | `CONTENT_HEIGHT` 常量（⚠️ antd 6.6.4 **没有**任何规则用它） |
 * | `dotSize` | `controlHeightLG / 2` | `calc(var(--apollo-control-height-lg) / 2)` |
 * | `dotSizeSM` | `controlHeightLG * 0.35` | `calc(var(--apollo-control-height-lg) * 0.35)` |
 * | `dotSizeLG` | `controlHeight` | `var(--apollo-control-height)` |
 *
 * ── 为什么不能用组件级 CSS 变量 ────────────────────────────────────────────────
 *
 * antd 在 `theme.cssVar` 模式下会把它们声明成组件级 CSS 变量：
 *
 * ```css
 * .css-var-root.apollo-spin{
 *   --ant-spin-content-height:400px;
 *   --ant-spin-dot-size:20px;
 *   --ant-spin-dot-size-sm:14px;
 *   --ant-spin-dot-size-lg:32px;
 * }
 * .apollo-spin{ --ant-spin-dot-holder-size:var(--ant-spin-dot-size); }
 * .apollo-spin-sm{ --ant-spin-dot-holder-size:var(--ant-spin-dot-size-sm); }
 * .apollo-spin-lg{ --ant-spin-dot-holder-size:var(--ant-spin-dot-size-lg); }
 * ```
 *
 * （实测：用 `@ant-design/cssinjs` 的 `extractStyle` 提取 antd 6.6.4 的真实产物。）
 *
 * 我们的零运行时管线目前**没有**「Component Token → CSS 变量」这一段：
 * `packages/theme` 只把**别名 token** 落成 `tokens.css` 的 `:root` 块。
 * 而 `tests/build/run.mjs` 的 B7 要求 ui 的 CSS 里每个 `var(--apollo-*)` 都必须在
 * theme 的 `tokens.css` 里有声明 —— **组件文件内的局部声明它看不到**，
 * 写 `--apollo-spin-dot-holder-size` 会让 B7 直接红。
 *
 * 所以：三个 dot 尺寸**不落地成变量**，而是把 `calc(...)` 表达式在每一处使用点展开，
 * 由 `-sm` / `-lg` 两个尺寸类各自再展开一份（见 `style/index.ts` 的 `DOT` 常量）。
 * 代价是 CSS 里 `calc` 重复出现，换来的是「B7 可校验 + 随主题自适应」。
 *
 * ⚠️ 已知缺口（登记在 `README.md` §7）：没有 ConfigProvider 时，用户**无法**通过
 *    `theme.components.Spin` 覆盖这四个 token。落点是
 *    「Component Token → CSS 变量」那段管线 + ConfigProvider 组件本身。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（那是 L6 的逐像素比对）。
 *   - 没证明这四个 token 与 antd 的**运行时**取值一致：它们都是 `prepareComponentToken`
 *     的纯算术，静态可比；而「落到 CSS 后对不对」由 B7（变量存在）与 L6（像素）保证。
 */

import type { AliasToken } from '@apollo-design/theme';

/**
 * 内容区域高度。antd 的默认值是字面量 `400`。
 *
 * ⚠️ 上游观察：**antd 6.6.4 的 CSS 里没有任何规则引用它**（`--ant-spin-content-height`
 * 被声明但从未被 `var()` 消费 —— 由 `extractStyle` 提取的真实产物确认）。
 * 旧版本里它用于嵌套模式的内容区最小高度，重构后那段规则被移除了，token 留了下来。
 * 我们**照样声明它**（规则 R7：名称与数量必须与 antd 一致），但不产 CSS。
 */
export const CONTENT_HEIGHT = 400;

/**
 * Spin 的 Component Token。与 antd 的 `ComponentToken` 接口逐字段对齐。
 *
 * 注释里的 `@desc` / `@descEN` 与 antd 同构 —— 文档表格由它们生成。
 */
export interface ComponentToken {
  /**
   * @desc 内容区域高度
   * @descEN Height of content area
   */
  contentHeight: number | string;
  /**
   * @desc 加载图标尺寸
   * @descEN Loading icon size
   */
  dotSize: number;
  /**
   * @desc 小号加载图标尺寸
   * @descEN Small loading icon size
   */
  dotSizeSM: number;
  /**
   * @desc 大号加载图标尺寸
   * @descEN Large loading icon size
   */
  dotSizeLG: number;
}

/**
 * 由别名 token 派生 Spin 的 Component Token 默认值。
 *
 * 与 antd 的 `prepareComponentToken` **逐条对应**：
 *
 * ```ts
 * export const prepareComponentToken = (token) => {
 *   const { controlHeightLG, controlHeight } = token;
 *   return {
 *     contentHeight: 400,
 *     dotSize: controlHeightLG / 2,
 *     dotSizeSM: controlHeightLG * 0.35,
 *     dotSizeLG: controlHeight,
 *   };
 * };
 * ```
 *
 * ⚠️ 它**不是**死代码：`registry/tokens.json` 的 `spin` 清单、文档的 Design Token 表、
 *    以及将来「Component Token → CSS 变量」管线的入口都以它为准。
 *    `style/index.ts` 消费的是同一组计算式（表达式形态，见文件头）。
 */
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
  contentHeight: CONTENT_HEIGHT,
  dotSize: token.controlHeightLG / 2,
  dotSizeSM: token.controlHeightLG * 0.35,
  dotSizeLG: token.controlHeight,
});
