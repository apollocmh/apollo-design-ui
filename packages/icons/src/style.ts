/**
 * 图标基础样式。
 *
 * 契约来源：`@ant-design/icons` 的 `renderUtils.iconStyles`（一段硬编码 `.anticon` 的模板字符串）
 * 与 `useInsertStyles`（把它 `replace(/anticon/g, prefixCls)` 后用 cssinjs 注入）。
 *
 * ── 为什么这里是「复制 CSS 文本」而不是「照抄注入逻辑」 ──────────────────────────
 * antd 在**运行时**把这段 CSS 注入 `<head>`（`useInsertStyles` → `updateCSS`）。
 * 本项目是零运行时（`COMPATIBILITY.md` D7，已裁决 B），样式由构建期产出静态 CSS。
 * 于是本包只负责**给出样式文本**，注入交给 `ui` 的静态样式层与 `theme` 的变量表。
 * 这产生一条必须登记的差异：不引入 `@ant-design/cssinjs`，也不在图标组件挂载时插 `<style>`。
 * （D15）
 *
 * ── 为什么用「整串文本 + 全局替换」而不是 CSSObject ──────────────────────────────
 * antd 在本包里的做法就是字符串全局替换。改成结构化对象再序列化，会引入
 * 「我们的序列化顺序是否与 antd 一致」这个新的可比对面 —— 而它没有任何收益：
 * 这段 CSS 没有 Token 变量，是纯常量。保持字符串，差异面最小。
 *
 * 注意 antd 还有另一份**语义重复但不同源**的 `genIconStyle(iconPrefixCls)`
 * （`antd/components/style/index.tsx`，走 ConfigProvider 的 `useResetIconStyle`）。
 * 两者的规则集相同，但 `genIconStyle` 少了 `-webkit-animation` / `-webkit-transform` 前缀。
 * 我们取**本包这一份**，因为我们要替代的是 `@ant-design/icons`，
 * 而它的注入产物才是图标的实际视觉契约。
 */

import { DEFAULT_ICON_PREFIX_CLS } from './context';

/**
 * 图标基础样式模板。`.anticon` 是占位前缀，由 {@link getIconStyle} 整体替换。
 *
 * ⚠️ 与 antd 的 `iconStyles` 逐字一致，**包括**：
 *   - `vertical-align: -0.125em`：让 SVG 图标像文字一样参与基线对齐（关键，不能省）
 *   - `line-height: 0` + `.anticon > * { line-height: 1 }`：抵消父级行高对图标的影响
 *   - `-webkit-` 前缀：antd 手写在模板里，不是 autoprefixer 产物
 * 这些值看起来像"魔法数字"，但它们**不是 Token** —— antd 也没有把它们做成 Token。
 * 它们描述的是「一个内联 SVG 如何伪装成字形」，与主题无关，因此不走 Token 系统（不违反 H9）。
 */
export const ICON_STYLE_TEMPLATE = `
.anticon {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.anticon > * {
  line-height: 1;
}

.anticon svg {
  display: inline-block;
  vertical-align: inherit;
}

.anticon::before {
  display: none;
}

.anticon .anticon-icon {
  display: block;
}

.anticon[tabindex] {
  cursor: pointer;
}

.anticon-spin {
  -webkit-animation: loadingCircle 1s infinite linear;
  animation: loadingCircle 1s infinite linear;
}

@-webkit-keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
`;

/**
 * 产出某个图标前缀下的完整基础样式。
 *
 * 与 `useInsertStyles` 的替换规则一致：**全局** `anticon` → `prefixCls`。
 * 全局（而不是只替换 `.anticon` 选择器）是必要的 ——
 * `.anticon-icon` / `.anticon-spin` / `.anticon[tabindex]` 都要跟着改。
 *
 * @param iconPrefixCls 图标类名前缀。默认 {@link DEFAULT_ICON_PREFIX_CLS}。
 *   antd 的对应值是 `'anticon'`；两者都在 `IconProvider` 之外独立于 `prefixCls`
 *   （改 `prefixCls` 不会连带改它，见 `COMPATIBILITY.md` D6 / D14）。
 *
 * @example
 * ```ts
 * // 交给 ui 的静态样式层，或直接写进 CSS 产物
 * const css = getIconStyle();            // .apollo-icon { ... }
 * const css2 = getIconStyle('anticon');  // 与 antd 逐字一致
 * ```
 */
export function getIconStyle(iconPrefixCls: string = DEFAULT_ICON_PREFIX_CLS): string {
  return ICON_STYLE_TEMPLATE.replace(/anticon/g, iconPrefixCls);
}
