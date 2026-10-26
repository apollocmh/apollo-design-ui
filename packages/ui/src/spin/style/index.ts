/** Static Spin styles. Default dot geometry retains the existing licensed artwork. */
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
  const variable = (name: string) => `--${prefixCls}-spin-${name}`;
  const cv = (name: string) => `var(${variable(name)})`;

  // 三个 dot 尺寸（Component Token，表达式形态 —— 见 style/token.ts 文件头）。
  // -sm / -lg 各自展开一份，代替 antd 的「组件级 CSS 变量 + 尺寸类覆盖」。
  const CONTROL_LG = v('controlHeightLG');
  const CONTROL = v('controlHeight');
  const MARGIN_XXS = v('marginXXS');
  const dotSize = cv('dot-holder-size');
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
    `  ${variable('content-height')}:400px;`,
    `  ${variable('dot-size')}:calc(${CONTROL_LG} / 2);`,
    `  ${variable('dot-size-sm')}:calc(${CONTROL_LG} * 0.35);`,
    `  ${variable('dot-size-lg')}:${CONTROL};`,
    `  ${variable('dot-holder-size')}:${cv('dot-size')};`,
    `  ${variable('animation-play-state')}:running;`,
    `  display:inline-flex;`,
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
    `${cls}-nested{display:grid;grid-template-columns:minmax(0,1fr);}`,
    `${cls}-sm{${variable('dot-holder-size')}:${cv('dot-size-sm')};}`,
    `${cls}-lg{${variable('dot-holder-size')}:${cv('dot-size-lg')};}`,
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    '',
    // ---- Section ------------------------------------------------------------
    // One stable section owns loading content in every mode.
    `${cls} >${section}{`,
    `  display:flex;`,
    `  align-items:center;`,
    `  flex-direction:column;`,
    `  gap:${v('paddingSM')};`,
    `  color:${v('colorPrimary')};`,
    `}`,
    `${cls}-nested >${section}{`,
    `  position:relative;`,
    `  grid-area:1/1;`,
    `  top:0;`,
    `  left:0;`,
    `  width:100%;`,
    `  height:100%;`,
    `  max-height:${cv('content-height')};`,
    `  justify-content:center;`,
    `  z-index:1;`,
    `}`,
    `${cls} ${description}{`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:1;`,
    `}`,
    '',
    // ---- Container ----------------------------------------------------------
    `${cls} >${container}{`,
    `  grid-area:1/1;`,
    `  min-width:0;`,
    `  position:relative;`,
    `  transition:opacity ${v('motionDurationSlow')};`,
    `}`,
    `${cls} >${container}::after{`,
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
    `${cls}-spinning >${container}{`,
    `  clear:both;`,
    `  opacity:0.5;`,
    `  user-select:none;`,
    `  pointer-events:none;`,
    `}`,
    `${cls}-spinning >${container}::after{`,
    `  opacity:0.4;`,
    `  pointer-events:auto;`,
    `}`,
    '',
    // ---- Fullscreen ---------------------------------------------------------
    `${cls}-fullscreen >${section}{`,
    `  position:fixed;`,
    `  inset:0;`,
    `  width:100%;`,
    `  height:100%;`,
    `  max-height:none;`,
    `  display:flex;`,
    `  flex-direction:column;`,
    `  align-items:center;`,
    `  justify-content:center;`,
    `  gap:${v('marginXXS')};`,
    `  transform:none;`,
    `  background-color:${v('colorBgMask')};`,
    `  z-index:${v('zIndexPopupBase')};`,
    `  opacity:0;`,
    `  pointer-events:none;`,
    `  transition:all ${v('motionDurationMid')};`,
    `}`,
    `${cls}-fullscreen${cls}-spinning >${section}{`,
    `  opacity:1;`,
    `  pointer-events:auto;`,
    `}`,
    `${cls}-fullscreen >${section}{`,
    `  color:${v('colorWhite')};`,
    `}`,
    `${cls}-fullscreen >${section} ${description}{`,
    `  color:${v('colorTextLightSolid')};`,
    `  background-color:${v('colorBgSpotlight')};`,
    `  padding:${v('paddingXXS')} ${v('paddingXS')};`,
    `  border-radius:${v('borderRadiusSM')};`,
    `}`,
    '',
    // ---- genIndicatorStyle --------------------------------------------------
    `${cls} >${section} >${cls}-indicator{`,
    `  position:relative;`,
    `  display:inline-flex;`,
    `  align-items:center;`,
    `  justify-content:center;`,
    `  font-size:${dotSize};`,
    `  line-height:1;`,
    `}`,
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
    `  animation-play-state:${cv('animation-play-state')};`,
    `}`,
    `${cls} ${dot}-item{`,
    `  position:absolute;`,
    `  display:block;`,
    `  width:${itemSize(dotSize)};`,
    `  height:${itemSize(dotSize)};`,
    `  background:currentColor;`,
    `  border-radius:${v('borderRadiusCircle')};`,
    `  transform:scale(0.75);`,
    `  transform-origin:50% 50%;`,
    `  opacity:0.3;`,
    `  animation-name:${moveName};`,
    `  animation-duration:1s;`,
    `  animation-iteration-count:infinite;`,
    `  animation-timing-function:linear;`,
    `  animation-direction:alternate;`,
    `  animation-play-state:${cv('animation-play-state')};`,
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
    `@media(prefers-reduced-motion:reduce){`,
    `  ${cls}{${variable('animation-play-state')}:paused;}`,
    `  ${cls} >${section},${cls} >${container},${cls} >${container}::after,`,
    `  ${cls} >${section} >${cls}-indicator >${dot}-holder,`,
    `  ${cls} >${section} >${cls}-indicator >${dot}-progress ${dot}-circle{transition:none;}`,
    `}`,
    '',
  ].join('\n');
}
