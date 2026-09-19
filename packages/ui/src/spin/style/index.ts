/**
 * Spin 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `components/spin/style/index.ts`（`genSpinStyle` +
 * `genIndicatorStyle` + `genSizeStyle`）。选择器结构、属性、取值来源**逐条对齐**。
 *
 * ── 选择器结构是从 antd 的**真实产物**提取的，不是推演的 ─────────────────────────
 *
 * 用 `@ant-design/cssinjs` 的 `extractStyle` 渲染 antd 6.6.4 的 Spin（basic / sm / lg /
 * percent / nested / fullscreen 六个形态）并提取 CSS，去掉 CSS-in-JS 的
 * `:where(.css-dev-only-...)` hash 包裹层后即下面这份。
 *
 * 提取时发现的一条**上游事实**（不是笔误）：`--ant-spin-content-height` 被声明了，
 * 但**没有任何规则引用它** —— `contentHeight` 在 6.6.4 是个不会被消费的 token。
 * 我们不产它的 CSS（没有规则可产），但 token 本身照常声明（见 `style/token.ts`）。
 *
 * ── 与 antd 产物的两处**有意**差异 ──────────────────────────────────────────────
 *
 * 1. 没有 CSS-in-JS 的 `:where(.css-dev-only-...)` hash 包裹（差异 D5），
 *    keyframes 名字也不带 hash —— 改用前缀派生（`apollo-spin-*` / `ant-spin-*`），
 *    否则同一份 CSS 里 `apollo` 与 `ant` 两套规则会互相覆盖同名 keyframes。
 * 2. 三个 dot 尺寸不落地成组件级 CSS 变量，而是把 `calc()` 在使用点展开
 *    （`-sm` / `-lg` 各展开一份）。原因见 `style/token.ts` 文件头：B7 只认
 *    theme 的 `tokens.css` 里声明过的 `--apollo-*`。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 的逐像素比对负责）。
 *   - 没证明变量名存在。`var(--apollo-*)` 写错不会报错、只会静默失效 ——
 *     由 `tests/build/run.mjs` 的 B7 校验。
 *   - 没证明动画的**观感**一致：keyframes 的定义与 antd 逐字相同，但
 *     L6 在 `prefers-reduced-motion` + `animation: none` 下截图，动画本身不在比对面里。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Spin 的静态 CSS。
 *
 * @param prefixCls 类名前缀（`apollo` 或 `ant`）
 */
export function genSpinStyle(prefixCls: string): string {
  // ⚠️ 带 `-spin` 后缀：`getPrefixCls('spin')` 在**不传** customizePrefixCls 时
  // 返回 `${defaultPrefixCls}-spin`（即 `apollo-spin`）。传了 customizePrefixCls
  // 时它**直接返回**该值（不加后缀）—— 那种情况的 CSS 请用 `genComponentCss('spin', 自定义值)`。
  const cls = `.${prefixCls}-spin`;
  const dot = `${cls}-dot`;
  const section = `${cls}-section`;
  const container = `${cls}-container`;
  const description = `${cls}-description`;
  const rotateName = `${prefixCls}-spin-rotate`;
  const moveName = `${prefixCls}-spin-move`;

  // 三个 dot 尺寸（Component Token，表达式形态 —— 见 style/token.ts 文件头）。
  // -sm / -lg 各自展开一份，代替 antd 的「组件级 CSS 变量 + 尺寸类覆盖」。
  const CONTROL_LG = v('controlHeightLG');
  const CONTROL = v('controlHeight');
  const MARGIN_XXS = v('marginXXS');
  const dotSize = `calc(${CONTROL_LG} / 2)`;
  const dotSizeSM = `calc(${CONTROL_LG} * 0.35)`;
  const dotSizeLG = CONTROL;
  /** antd：`calc((dot-holder-size - marginXXS / 2) / 2)`。 */
  const itemSize = (holder: string): string => `calc((${holder} - ${MARGIN_XXS} / 2) / 2)`;

  return [
    // ---- keyframes（antd 的 `antRotate` / `antSpinMove`）----------------------
    `@keyframes ${rotateName}{to{transform:rotate(405deg)}}`,
    `@keyframes ${moveName}{to{opacity:1}}`,
    '',
    // ---- genSpinStyle · 根 ---------------------------------------------------
    // resetComponent(token) 的展开（antd `components/style/index.tsx`）：
    // box-sizing / margin / padding / color / font-size / line-height / list-style / font-family
    // ⚠️ 不含 antd `genCommonStyle` 的 `*::before{box-sizing}` 与
    //    `[class^="apollo-spin"]{box-sizing}` 两条 —— 它们被 `packages/ui/src/style/index.ts`
    //    的 `BASE_CSS`（`*{box-sizing:border-box}`）覆盖，产出它们只是重复体积。
    `${cls}{`,
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  position:relative;`,
    `}`,
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    '',
    // ---- Section ------------------------------------------------------------
    // ⚠️ `&${sectionCls}` 是**复合**（非嵌套时根元素自己带 -section），
    //    `> ${sectionCls}` 是**子代**（嵌套模式的浮动层）。两条语义不同，不能合并。
    `${cls}${section},${cls} >${section}{`,
    `  display:flex;`,
    `  align-items:center;`,
    `  flex-direction:column;`,
    `  gap:${v('paddingSM')};`,
    `  color:${v('colorPrimary')};`,
    `}`,
    `${cls}${section}{`,
    `  display:inline-flex;`,
    `}`,
    `${cls} >${section}{`,
    `  position:absolute;`,
    `  top:50%;`,
    `  left:50%;`,
    `  transform:translate(-50%, -50%);`,
    `  z-index:1;`,
    `}`,
    `${cls} ${description}{`,
    `  font-size:${v('fontSize')};`,
    `  line-height:1;`,
    `}`,
    '',
    // ---- Container ----------------------------------------------------------
    `${cls} ${container}{`,
    `  position:relative;`,
    `  transition:opacity ${v('motionDurationSlow')};`,
    `}`,
    `${cls} ${container}::after{`,
    `  position:absolute;`,
    `  top:0;`,
    `  inset-inline-end:0;`,
    `  bottom:0;`,
    `  inset-inline-start:0;`,
    `  z-index:10;`,
    `  width:100%;`,
    `  height:100%;`,
    `  background:${v('colorBgContainer')};`,
    `  opacity:0;`,
    `  transition:all ${v('motionDurationSlow')};`,
    `  content:"";`,
    `  pointer-events:none;`,
    `}`,
    '',
    // ---- Spinning -----------------------------------------------------------
    `${cls}-spinning ${description}{`,
    `  text-shadow:0 0px 5px ${v('colorBgContainer')};`,
    `}`,
    `${cls}-spinning ${container}{`,
    `  clear:both;`,
    `  opacity:0.5;`,
    `  user-select:none;`,
    `  pointer-events:none;`,
    `}`,
    `${cls}-spinning ${container}::after{`,
    `  opacity:0.4;`,
    `  pointer-events:auto;`,
    `}`,
    '',
    // ---- Fullscreen ---------------------------------------------------------
    `${cls}-fullscreen{`,
    `  position:fixed;`,
    `  inset:0;`,
    `  background-color:${v('colorBgMask')};`,
    `  z-index:${v('zIndexPopupBase')};`,
    `  opacity:0;`,
    `  pointer-events:none;`,
    `  transition:all ${v('motionDurationMid')};`,
    `}`,
    `${cls}-fullscreen${cls}-spinning{`,
    `  opacity:1;`,
    `  pointer-events:auto;`,
    `}`,
    `${cls}-fullscreen >${section}{`,
    `  color:${v('colorWhite')};`,
    `}`,
    `${cls}-fullscreen >${section} ${description}{`,
    `  color:${v('colorTextLightSolid')};`,
    `}`,
    '',
    // ---- genIndicatorStyle --------------------------------------------------
    `${cls} ${dot}{`,
    `  position:relative;`,
    `  display:inline-block;`,
    `  font-size:${dotSize};`,
    `  width:1em;`,
    `  height:1em;`,
    `}`,
    `${cls} ${dot}-holder{`,
    `  width:1em;`,
    `  height:1em;`,
    `  font-size:${dotSize};`,
    `  display:inline-block;`,
    `  transition:transform ${v('motionDurationSlow')} ease,opacity ${v('motionDurationSlow')} ease;`,
    `  transform-origin:50% 50%;`,
    `  line-height:1;`,
    `}`,
    `${cls} ${dot}-holder-hidden{`,
    `  transform:scale(0.3);`,
    `  opacity:0;`,
    `}`,
    `${cls} ${dot}-spin{`,
    `  transform:rotate(45deg);`,
    `  animation-name:${rotateName};`,
    `  animation-duration:1.2s;`,
    `  animation-iteration-count:infinite;`,
    `  animation-timing-function:linear;`,
    `}`,
    `${cls} ${dot}-item{`,
    `  position:absolute;`,
    `  display:block;`,
    `  width:${itemSize(dotSize)};`,
    `  height:${itemSize(dotSize)};`,
    `  background:currentColor;`,
    `  border-radius:100%;`,
    `  transform:scale(0.75);`,
    `  transform-origin:50% 50%;`,
    `  opacity:0.3;`,
    `  animation-name:${moveName};`,
    `  animation-duration:1s;`,
    `  animation-iteration-count:infinite;`,
    `  animation-timing-function:linear;`,
    `  animation-direction:alternate;`,
    `}`,
    `${cls} ${dot}-item:nth-child(1){top:0;inset-inline-start:0;animation-delay:0s}`,
    `${cls} ${dot}-item:nth-child(2){top:0;inset-inline-end:0;animation-delay:0.4s}`,
    `${cls} ${dot}-item:nth-child(3){inset-inline-end:0;bottom:0;animation-delay:0.8s}`,
    `${cls} ${dot}-item:nth-child(4){bottom:0;inset-inline-start:0;animation-delay:1.2s}`,
    `${cls} ${dot}-progress{`,
    `  position:absolute;`,
    `  left:50%;`,
    `  top:0;`,
    `  transform:translateX(-50%);`,
    `}`,
    `${cls} ${dot}-circle{`,
    `  stroke-linecap:round;`,
    `  transition:stroke-dashoffset ${v('motionDurationSlow')} ease,stroke-dasharray ${v('motionDurationSlow')} ease,stroke ${v('motionDurationSlow')} ease,stroke-width ${v('motionDurationSlow')} ease,opacity ${v('motionDurationSlow')} ease;`,
    `  fill-opacity:0;`,
    `  stroke:currentcolor;`,
    `}`,
    `${cls} ${dot}-circle-bg{`,
    `  stroke:${v('colorFillSecondary')};`,
    `}`,
    '',
    // ---- genSizeStyle -------------------------------------------------------
    // ⚠️ 尺寸类在**根元素**上，dot 在后代 —— 选择器是后代而不是复合，
    //    与 antd 的「变量覆盖」等价（antd 靠变量继承，我们靠选择器特异性 + 顺序）。
    `${cls}-sm ${dot}-holder,${cls}-sm ${dot}{`,
    `  font-size:${dotSizeSM};`,
    `}`,
    `${cls}-sm ${dot}-item{`,
    `  width:${itemSize(dotSizeSM)};`,
    `  height:${itemSize(dotSizeSM)};`,
    `}`,
    `${cls}-lg ${dot}-holder,${cls}-lg ${dot}{`,
    `  font-size:${dotSizeLG};`,
    `}`,
    `${cls}-lg ${dot}-item{`,
    `  width:${itemSize(dotSizeLG)};`,
    `  height:${itemSize(dotSizeLG)};`,
    `}`,
    '',
  ].join('\n');
}
