/**
 * Segmented 的样式生成（genSegmentedStyle）。
 *
 * 契约来源：antd 6.6.4 的 `es/segmented/style/index.js`（产物实测，
 * genSegmentedStyle + prepareComponentToken）。
 *
 * ── 与 antd 产物的有意差异（与 radio/style 同判）────────────────────────────
 *
 * 1. 无 hash / `-css-var` 包裹类（D5）。Token 落 **var() 别名派生**，随主题自适应。
 * 2. antd 的 `labelHeight = controlHeight − trackPadding×2` 在 cssVar 产物里是
 *    `calc(var(--apollo-control-height) - var(--apollo-segmented-track-padding) * 2)`。
 *    这里变量名换成组件级 cv() 别名（与 radio 的 unitless 特判不同，segmented
 *    的全部量都是长度，无 unitless 陷阱）。
 * 3. genFocusStyle → `:focus-visible` 手写（本仓已有判据，radio 同式）。
 * 4. `motionDurationMid` / `motionDurationSlow` / `motionEaseInOut` 是全局
 *    motion token —— 用 v() 引用（`--apollo-motion-duration-mid` 等）。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const cv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-segmented-${name})`;

/**
 * Component Token 声明块（`prepareComponentToken` 的 **8** 个字段）。
 * 全部 var() 派生，无 unitless 特判。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  return [
    `  --${p}-segmented-item-color:${v('colorTextLabel')};`,
    `  --${p}-segmented-item-hover-color:${v('colorText')};`,
    `  --${p}-segmented-item-hover-bg:${v('colorFillSecondary')};`,
    `  --${p}-segmented-item-active-bg:${v('colorFill')};`,
    `  --${p}-segmented-item-selected-bg:${v('colorBgElevated')};`,
    `  --${p}-segmented-item-selected-color:${v('colorText')};`,
    `  --${p}-segmented-track-padding:${v('lineWidthBold')};`,
    `  --${p}-segmented-track-bg:${v('colorBgLayout')};`,
  ];
}

/** resetComponent —— 完整 reset（checklist #14；antd 含 fontSize，漏了会继承 16px 导致逐字偏移）。 */
function resetComponent(lineHeight: string): string[] {
  return [
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${lineHeight};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
  ];
}

/**
 * 生成 Segmented 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genSegmentedStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const root = `.${p}-segmented`;
  const group = `${root}-group`;
  const item = `${root}-item`;
  const thumb = `${root}-thumb`;

  // labelHeight = controlHeight − trackPadding×2（SM/LG 同式）
  const labelHeight = `calc(${v('controlHeight')} - ${cv(p, 'track-padding')} * 2)`;
  const labelHeightLG = `calc(${v('controlHeightLG')} - ${cv(p, 'track-padding')} * 2)`;
  const labelHeightSM = `calc(${v('controlHeightSM')} - ${cv(p, 'track-padding')} * 2)`;
  // segmentedPaddingHorizontal = controlPaddingHorizontal − lineWidth
  const padH = `calc(${v('controlPaddingHorizontal')} - ${v('lineWidth')})`;
  const padHSM = `calc(${v('controlPaddingHorizontalSM')} - ${v('lineWidth')})`;

  return [
    // ---- 根 ----
    `${root}{`,
    // Component Token 声明（antd 的 `.css-var-root` 块等价物）
    ...genTokenDecls(p),
    ...resetComponent(v('lineHeight')),
    `  display:inline-block;`,
    `  padding:${cv(p, 'track-padding')};`,
    `  color:${cv(p, 'item-color')};`,
    `  background:${cv(p, 'track-bg')};`,
    `  border-radius:${v('borderRadius')};`,
    `  transition:all ${v('motionDurationMid')};`,
    // genFocusStyle（genFocusOutline：lineWidthFocus / colorPrimaryBorder / offset 1）
    `}`,
    `${root}:focus-visible{`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1px;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,
    // ---- group ----
    `${group}{`,
    `  position:relative;`,
    `  display:flex;`,
    `  align-items:stretch;`,
    `  justify-items:flex-start;`,
    `  flex-direction:row;`,
    `  width:100%;`,
    `}`,
    // ---- RTL ----
    `${root}-rtl{`,
    `  direction:rtl;`,
    `}`,
    // ---- vertical ----
    `${root}-vertical ${group}{`,
    `  flex-direction:column;`,
    `}`,
    `${root}-vertical ${thumb}{`,
    `  width:100%;`,
    `  height:0;`,
    `  padding:0 ${v('paddingXXS')};`,
    `}`,
    // ---- block ----
    `${root}-block{`,
    `  display:flex;`,
    `}`,
    `${root}-block ${item}{`,
    `  flex:1;`,
    `  min-width:0;`,
    `}`,
    // ---- item ----
    `${item}{`,
    `  position:relative;`,
    `  text-align:center;`,
    `  cursor:pointer;`,
    `  transition:color ${v('motionDurationMid')};`,
    `  border-radius:${v('borderRadiusSM')};`,
    // Fix Safari render bug（上游 issue 45250，逐字保留）
    `  transform:translateZ(0);`,
    `}`,
    `${item}-selected{`,
    `  background:${cv(p, 'item-selected-bg')};`,
    `  box-shadow:${v('boxShadowTertiary')};`,
    `  color:${cv(p, 'item-selected-color')};`,
    `}`,
    `${item}-selected-text{`,
    `  color:${cv(p, 'item-selected-color')};`,
    `  transition:color ${v('motionDurationMid')};`,
    `}`,
    `${item}-focused{`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1px;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,
    `${item}::after{`,
    `  content:"";`,
    `  position:absolute;`,
    `  z-index:-1;`,
    `  width:100%;`,
    `  height:100%;`,
    `  top:0;`,
    `  inset-inline-start:0;`,
    `  border-radius:inherit;`,
    `  opacity:0;`,
    // 不可点击 / 不可悬浮（上游 issue 40888）
    `  pointer-events:none;`,
    `  transition:opacity ${v('motionDurationMid')},background-color ${v('motionDurationMid')};`,
    `}`,
    // 非 selected / disabled 的 hover / active 反馈（hover 伪类链逐字保留）
    `${item}:not(${item}-selected):not(${item}-selected-text):not(${item}-disabled):hover,${item}:not(${item}-selected):not(${item}-selected-text):not(${item}-disabled):active{`,
    `  color:${cv(p, 'item-hover-color')};`,
    `}`,
    `${item}:not(${item}-selected):not(${item}-selected-text):not(${item}-disabled):hover::after{`,
    `  opacity:1;`,
    `  background-color:${cv(p, 'item-hover-bg')};`,
    `}`,
    `${item}:not(${item}-selected):not(${item}-selected-text):not(${item}-disabled):active::after{`,
    `  opacity:1;`,
    `  background-color:${cv(p, 'item-active-bg')};`,
    `}`,
    `${item}-label{`,
    `  min-height:${labelHeight};`,
    `  line-height:${labelHeight};`,
    `  padding:0 ${padH};`,
    `  overflow:hidden;`,
    `  white-space:nowrap;`,
    `  text-overflow:ellipsis;`,
    `}`,
    // icon 语法糖：icon 与后续 label 的间距（= marginSM / 2）
    `${item}-icon + *{`,
    `  margin-inline-start:calc(${v('marginSM')} / 2);`,
    `}`,
    // 裸 <svg> 对齐（第三方图标库；Tailwind Preflight 兼容，逐字保留上游注释判据）
    `${item}-icon > svg{`,
    `  display:inline-block;`,
    `  vertical-align:middle;`,
    `  margin-block-end:0.2em;`,
    `}`,
    `${item}-input{`,
    `  position:absolute;`,
    `  inset-block-start:0;`,
    `  inset-inline-start:0;`,
    `  width:0;`,
    `  height:0;`,
    `  opacity:0;`,
    `  pointer-events:none;`,
    `}`,
    // ---- thumb ----
    `${thumb}{`,
    `  background:${cv(p, 'item-selected-bg')};`,
    `  box-shadow:${v('boxShadowTertiary')};`,
    `  position:absolute;`,
    `  inset-block-start:0;`,
    `  inset-inline-start:0;`,
    `  width:0;`,
    `  height:100%;`,
    `  padding:${v('paddingXXS')} 0;`,
    `  border-radius:${v('borderRadiusSM')};`,
    `}`,
    // thumb 存在期间，非选中项的 ::after 底色透明（避免重叠反馈）
    `${thumb} ~ ${item}:not(${item}-selected):not(${item}-disabled)::after{`,
    `  background-color:transparent;`,
    `}`,
    // ---- lg ----
    `${root}-lg{`,
    `  border-radius:${v('borderRadiusLG')};`,
    `}`,
    `${root}-lg ${item}-label{`,
    `  min-height:${labelHeightLG};`,
    `  line-height:${labelHeightLG};`,
    `  padding:0 ${padH};`,
    `  font-size:${v('fontSizeLG')};`,
    `}`,
    `${root}-lg ${item},${root}-lg ${thumb}{`,
    `  border-radius:${v('borderRadius')};`,
    `}`,
    // ---- sm ----
    `${root}-sm{`,
    `  border-radius:${v('borderRadiusSM')};`,
    `}`,
    `${root}-sm ${item}-label{`,
    `  min-height:${labelHeightSM};`,
    `  line-height:${labelHeightSM};`,
    `  padding:0 ${padHSM};`,
    `}`,
    `${root}-sm ${item},${root}-sm ${thumb}{`,
    `  border-radius:${v('borderRadiusXS')};`,
    `}`,
    // ---- disabled（两个作用域：整组 / 单项）----
    `${root}-disabled ${item},${root}-disabled ${item}:hover,${root}-disabled ${item}:focus,${item}-disabled,${item}-disabled:hover{`,
    `  color:${v('colorTextDisabled')};`,
    `  cursor:not-allowed;`,
    `}`,
    // ---- thumb motion（appear-active 过渡）----
    `${thumb}-motion-appear-active{`,
    `  will-change:transform,width;`,
    `  transition:transform ${v('motionDurationSlow')} ${v('motionEaseInOut')},width ${v('motionDurationSlow')} ${v('motionEaseInOut')};`,
    `}`,
    // ---- shape: round ----
    `${root}-shape-round{`,
    `  border-radius:9999px;`,
    `}`,
    `${root}-shape-round ${item},${root}-shape-round ${thumb}{`,
    `  border-radius:9999px;`,
    `}`,
  ].join('\n');
}
