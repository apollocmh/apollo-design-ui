/**
 * Timeline 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/timeline/style/index.js`：
 *
 * ```js
 * export interface ComponentToken {
 *   tailColor?: string;              // 轨迹颜色
 *   tailWidth?: number | string;     // 轨迹宽度
 *   dotBorderWidth?: number | string;// 节点边框宽度
 *   dotSize?: number | string;       // 节点大小
 *   dotBg?: string;                  // 节点背景色
 *   itemPaddingBottom?: number;      // 时间项下间距
 * }
 * export const prepareComponentToken = (token) => ({
 *   tailColor: token.colorSplit,
 *   tailWidth: token.lineWidthBold,
 *   dotBorderWidth: token.lineWidthBold,
 *   dotBg: undefined,
 *   dotSize: undefined,
 *   itemPaddingBottom: token.padding * 1.25,
 * });
 * ```
 *
 * **6 个 Component Token**（registry 数据一致），但产物 css-var 块只有 **4 条**声明：
 *
 * ```
 * --ant-timeline-tail-color:rgba(5,5,5,0.06);
 * --ant-timeline-tail-width:2px;
 * --ant-timeline-dot-border-width:2px;
 * --ant-timeline-item-padding-bottom:20px;
 * ```
 *
 * ── 🚨 `dotBg` / `dotSize` 是**刻意不声明**的（本组件最需要理解的一处）────────────
 *
 * 上游把它们的默认值写成 **`undefined`** ⇒ cssinjs 的 cssVar 模式**跳过**这两个声明，
 * 于是产物里只出现 4 条。而规则里**确实引用**了它们：
 *
 * ```css
 * .ant-timeline .ant-timeline-item{
 *   --ant-cmp-steps-icon-dot-size-custom:var(--ant-timeline-dot-size);       ① 引用
 *   --ant-cmp-steps-icon-size:var(--ant-cmp-steps-icon-dot-size-custom,
 *                                var(--ant-cmp-steps-icon-dot-size-origin));  ② 回退链
 * }
 * ```
 *
 * 设计意图是：**未声明 ⇒ `-custom` 无效 ⇒ 回退到 Steps 的 `-origin`**；
 * 用户一旦覆盖（`style="--apollo-timeline-dot-size: 12px"`）就切到自定义值。
 *
 * ⚠️ 本仓照做（只声明 4 条）。代价是 **B7** 会报「引用了未声明的变量」
 * ⇒ 已把这两个变量登记进 `tests/build/run.mjs` 的
 * `UPSTREAM_UNDECLARED_TOKEN_VARS`（含自证条件，见该文件）。
 *
 * ── 3 个 `mergeToken` 派生（用户**不可**覆盖）─────────────────────────────────
 *
 * 上游 `mergeToken<TimelineToken>(token, { itemHeadSize: 10,
 * customHeadPaddingVertical: token.paddingXXS, paddingInlineEnd: 2 })`。
 * 它们不进 `ComponentToken` ⇒ 本文件**没有**对应字段，由 `style/index.ts` 内联消费。
 */

import type { AliasToken } from '@apollo-design/theme';

/** Timeline 的 Component Token。与上游 `ComponentToken` 逐字段对齐。 */
export interface ComponentToken {
  /** 轨迹颜色。 */
  tailColor?: string;
  /** 轨迹宽度。 */
  tailWidth?: number | string;
  /** 节点边框宽度。 */
  dotBorderWidth?: number | string;
  /** 节点大小。⚠️ 上游默认 **`undefined`**（刻意不声明，见文件头）。 */
  dotSize?: number | string;
  /** 节点背景色。⚠️ 上游默认 **`undefined`**（刻意不声明，见文件头）。 */
  dotBg?: string;
  /** 时间项下间距。 */
  itemPaddingBottom?: number;
}

/**
 * 与上游 `prepareComponentToken` **逐条对齐**（规则 R7）。
 *
 * ⚠️ `dotBg` / `dotSize` **显式返回 `undefined`** —— 这是**判据**，不是遗漏：
 * 它们必须不出现在 css-var 声明块里，否则 `var(custom, origin)` 的回退链会失效
 * （`-custom` 变成有效值，直接盖掉 Steps 的 origin）。
 */
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
  tailColor: token.colorSplit,
  tailWidth: token.lineWidthBold,
  dotBorderWidth: token.lineWidthBold,
  dotBg: undefined,
  dotSize: undefined,
  itemPaddingBottom: token.padding * 1.25,
});
