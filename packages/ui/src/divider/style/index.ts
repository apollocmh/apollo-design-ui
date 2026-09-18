/**
 * Divider 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/divider/style/index.js`（`genSharedDividerStyle` +
 * `genSizeDividerStyle`）。选择器结构、属性、取值来源**逐条对齐**。
 *
 * ── 选择器结构是从 antd 的**真实产物**提取的，不是推演的 ─────────────────────────
 *
 * 用 `@ant-design/cssinjs` 的 `extractStyle` 渲染 antd 6.6.4 的 Divider 并提取 CSS，
 * 得到的就是下面这份（去掉 CSS-in-JS 的 hash 包裹层后）：
 *
 * ```css
 * .apollo-divider{...border-block-start:1px solid ...}
 * .apollo-divider .apollo-divider-rail{...}                 ← 后代，不是顶级
 * .apollo-divider-vertical{...}                             ← & 复合
 * .apollo-divider-horizontal.apollo-divider-with-text .apollo-divider-rail-start,...
 * .apollo-divider-dashed .apollo-divider-rail{...}          ← 后代
 * ```
 *
 * ⚠️ 这里最容易写错的是**嵌套层级**：`.apollo-divider-dashed .apollo-divider-rail`
 *    必须是**后代**选择器。若图省事写成顶级的 `.apollo-divider-rail{...dashed...}`，
 *    虚线的 rail 样式会作用到**所有** divider 上（顶级选择器无法区分 dashed）。
 *    这是 cssinjs 的嵌套语义（`&` 是复合、普通键是后代），不是风格问题。
 *
 * ── 与 antd 产物的两处**有意**差异 ──────────────────────────────────────────────
 *
 * 1. 没有 CSS-in-JS 的 `:where(.css-dev-only-...)` hash 包裹（差异 D5）。
 * 2. `verticalMarginInline` 输出 `var(--apollo-margin-xs)`，而 antd 在 cssVar 模式下
 *    输出解析后的 `8px`。这是零运行时的必然结果（D7 家族）：变量随主题自适应，
 *    而 antd 的组件 token 是运行时算出的定值。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 的逐像素比对负责）。
 *   - 没证明变量名存在。`var(--apollo-*)` 写错不会报错、只会静默失效 ——
 *     由 `tests/build/run.mjs` 的 B7 校验。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { ORIENTATION_MARGIN, TEXT_PADDING_INLINE } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Divider 的静态 CSS。
 *
 * @param prefixCls 类名前缀（`apollo` 或 `ant`）
 */
export function genDividerStyle(prefixCls: string): string {
  // ⚠️ 带 `-divider` 后缀：`getPrefixCls('divider')` 在**不传** customizePrefixCls 时
  // 返回 `${defaultPrefixCls}-divider`（即 `apollo-divider`）。传了 customizePrefixCls
  // 时它**直接返回**该值（不加后缀）—— 那种情况的 CSS 请用 `genComponentCss('divider', 自定义值)`。
  const cls = `.${prefixCls}-divider`;
  const rail = `${cls}-rail`;
  const innerText = `${cls}-inner-text`;
  const horizontalWithText = `${cls}-horizontal${cls}-with-text`;

  // 组件级 token 的取值来源（见 style/token.ts）：
  //   - 字面量走常量（唯一真源在 token.ts，与 antd 的 prepareComponentToken 逐字相同）
  //   - 别名派生的走 var(--apollo-*)，随主题自适应
  const textPaddingInline = TEXT_PADDING_INLINE;
  const orientationMargin = ORIENTATION_MARGIN;
  const verticalMarginInline = v('marginXS');

  const line = v('lineWidth');
  const split = v('colorSplit');

  return [
    // ---- genSharedDividerStyle -------------------------------------------
    // resetComponent(token) 的展开（antd `components/style/index.tsx`）：
    // box-sizing / margin / padding / color / font-size / line-height / list-style / font-family
    `${cls}{`,
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  border-block-start:${line} solid ${split};`,
    `}`,
    // 无 children 时根元素同时带 `-rail` 类名，这条为它提供同一条上边框。
    `${cls} ${rail}{`,
    `  border-block-start:${line} solid ${split};`,
    `}`,
    '',
    // ---- vertical --------------------------------------------------------
    `${cls}-vertical{`,
    `  position:relative;`,
    `  top:-0.06em;`,
    `  display:inline-block;`,
    `  height:0.9em;`,
    `  margin-inline:${verticalMarginInline};`,
    `  margin-block:0;`,
    `  vertical-align:middle;`,
    `  border-top:0;`,
    `  border-inline-start:${line} solid ${split};`,
    `}`,
    '',
    // ---- horizontal ------------------------------------------------------
    `${cls}-horizontal{`,
    `  display:flex;`,
    `  clear:both;`,
    `  width:100%;`,
    // Fix https://github.com/ant-design/ant-design/issues/10914
    `  min-width:100%;`,
    `  margin:${v('marginLG')} 0;`,
    `}`,
    `${horizontalWithText}{`,
    `  display:flex;`,
    `  align-items:center;`,
    `  margin:${v('margin')} 0;`,
    `  color:${v('colorTextHeading')};`,
    `  font-weight:500;`,
    `  font-size:${v('fontSizeLG')};`,
    `  white-space:nowrap;`,
    `  text-align:center;`,
    `  border-block-start:0 ${split};`,
    `}`,
    `${horizontalWithText} ${rail}-start,${horizontalWithText} ${rail}-end{`,
    `  width:50%;`,
    // Chrome not accept `inherit` in `border-top`
    `  border-block-start-color:inherit;`,
    `  border-block-end:0;`,
    `  content:'';`,
    `}`,
    `${cls}-horizontal${cls}-with-text-start ${rail}-start{`,
    `  width:calc(${orientationMargin} * 100%);`,
    `}`,
    `${cls}-horizontal${cls}-with-text-start ${rail}-end{`,
    `  width:calc(100% - ${orientationMargin} * 100%);`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end ${rail}-start{`,
    `  width:calc(100% - ${orientationMargin} * 100%);`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end ${rail}-end{`,
    `  width:calc(${orientationMargin} * 100%);`,
    `}`,
    `${cls} ${innerText}{`,
    `  display:inline-block;`,
    `  padding-block:0;`,
    `  padding-inline:${textPaddingInline};`,
    `}`,
    '',
    // ---- dashed ----------------------------------------------------------
    `${cls}-dashed{`,
    `  background:none;`,
    `  border-color:${split};`,
    `  border-style:dashed;`,
    `  border-width:${line} 0 0;`,
    `}`,
    `${cls}-dashed ${rail}{`,
    `  border-block-start:${line} dashed ${split};`,
    `}`,
    `${horizontalWithText}${cls}-dashed ${rail}-start,${horizontalWithText}${cls}-dashed ${rail}-end{`,
    `  border-style:dashed none none;`,
    `}`,
    `${cls}-vertical${cls}-dashed{`,
    `  border-inline-start-width:${line};`,
    `  border-inline-end:0;`,
    `  border-block-start:0;`,
    `  border-block-end:0;`,
    `}`,
    '',
    // ---- dotted ----------------------------------------------------------
    `${cls}-dotted{`,
    `  background:none;`,
    `  border-color:${split};`,
    `  border-style:dotted;`,
    `  border-width:${line} 0 0;`,
    `}`,
    `${cls}-dotted ${rail}{`,
    `  border-block-start:${line} dotted ${split};`,
    `}`,
    // antd 用 `&::before, &::after`（伪元素）而不是 rail 子元素 —— 逐字保留，
    // 这是上游的写法差异（dashed 用 rail、dotted 用伪元素），不是笔误。
    `${horizontalWithText}${cls}-dotted::before,${horizontalWithText}${cls}-dotted::after{`,
    `  border-style:dotted none none;`,
    `}`,
    `${cls}-vertical${cls}-dotted{`,
    `  border-inline-start-width:${line};`,
    `  border-inline-end:0;`,
    `  border-block-start:0;`,
    `  border-block-end:0;`,
    `}`,
    '',
    // ---- plain -----------------------------------------------------------
    `${cls}-plain${cls}-with-text{`,
    `  color:${v('colorText')};`,
    `  font-weight:normal;`,
    `  font-size:${v('fontSize')};`,
    `}`,
    '',
    // ---- orientationMargin 的「去默认边距」变体 ----------------------------
    // 传了 orientationMargin 且位置为 start / end 时，最近的那条 rail 宽度归零，
    // 改由 inner-text 的 padding 顶开（padding 值 = sizePaddingEdgeHorizontal = 0）。
    `${cls}-horizontal${cls}-with-text-start${cls}-no-default-orientation-margin-start ${rail}-start{`,
    `  width:0;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-start${cls}-no-default-orientation-margin-start ${rail}-end{`,
    `  width:100%;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-start${cls}-no-default-orientation-margin-start ${innerText}{`,
    `  padding-inline-start:0;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end${cls}-no-default-orientation-margin-end ${rail}-start{`,
    `  width:100%;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end${cls}-no-default-orientation-margin-end ${rail}-end{`,
    `  width:0;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end${cls}-no-default-orientation-margin-end ${innerText}{`,
    `  padding-inline-end:0;`,
    `}`,
    '',
    // ---- genSizeDividerStyle ---------------------------------------------
    // ⚠️ 选择器是 `.apollo-divider-horizontal.apollo-divider-sm`（`&${componentCls}` 复合），
    // 不是后代 —— 逐字来自 antd 的 `genSizeDividerStyle`。
    `${cls}-horizontal${cls}-sm{`,
    `  margin-block:${v('marginXS')};`,
    `}`,
    `${cls}-horizontal${cls}-md{`,
    `  margin-block:${v('margin')};`,
    `}`,
    '',
  ].join('\n');
}
