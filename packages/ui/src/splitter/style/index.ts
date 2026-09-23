/**
 * Splitter 的样式生成（genSplitterStyle）。
 *
 * 契约来源：antd 6.6.4 `es/splitter/style/index.js` 的 `genSplitterStyle`（330 行，
 * 单段嵌套 → 扁平化）+ `resetComponent`。全部挂在 `.{prefixCls}` 命名空间上。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）；4 个 Component Token 是**常量默认值**
 *    （alias 上不存在 ⇒ 恒取默认），构建期解析值声明在 `.{p}-splitter` 上。
 * 2. `--bar-preview-offset`（genCssVar(root,'splitter')）⇒ 本仓
 *    `--{root}-splitter-bar-preview-offset`（组件作用域 CSS 变量，B7/grid 先例），
 *    预览元素内联覆盖。
 * 3. antd 的 `left:{_skip_check_:true}`（cssinjs 的 RTL 跳过标记）⇒ 直接写
 *    `inset-inline-start` / `inset-inline-end`。
 * 4. `centerStyle`（absolute 50%/50% translate）逐处内联（dragger/::before/::after/
 *    collapse-bar/dragger-icon）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { type ComponentToken, prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const sv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-splitter-${name})`;

let tokenCache: ComponentToken | null = null;

function splitterTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken());
  }
  return tokenCache;
}

/** Component Token 声明块（4 个字段，构建期解析值）。 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = splitterTokenValues();
  return [
    `  --${p}-splitter-split-bar-size:${t.splitBarSize}px;`,
    `  --${p}-splitter-split-trigger-size:${t.splitTriggerSize}px;`,
    `  --${p}-splitter-resize-spinner-size:${t.resizeSpinnerSize}px;`,
    `  --${p}-splitter-split-bar-draggable-size:${t.splitBarDraggableSize}px;`,
    // 组件作用域 CSS 变量（antd genCssVar(root,'splitter') 的 bar-preview-offset）
    `  --${p}-splitter-bar-preview-offset:0px;`,
  ];
}

/** antd 的 `centerStyle`（absolute 居中）。 */
const CENTER = [
  '  position:absolute;',
  '  top:50%;',
  '  inset-inline-start:50%;',
  '  transform:translate(-50%,-50%);',
].join('\n');

/** `:focus-visible` 焦点环（genFocusOutline 等价：outline 2px offset -2px，主色）。 */
const FOCUS_OUTLINE = [
  '  outline:2px solid var(--apollo-color-primary);',
  '  outline-offset:-2px;',
  '  transition:outline-color 0s;',
].join('\n');

export function genSplitterStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-splitter`;
  const barCls = `${cls}-bar`;
  const maskCls = `${cls}-mask`;
  const panelCls = `${cls}-panel`;
  const t = splitterTokenValues();
  const halfTriggerSize = `${t.splitTriggerSize / 2}px`;

  const previewBase = [
    '  position:absolute;',
    '  background:var(--apollo-color-primary);',
    '  opacity:0.2;',
    '  pointer-events:none;',
    '  transition:none;',
    '  z-index:1;',
    '  display:none;',
  ].join('\n');

  return [
    // ---- 根 ----
    `${cls}{`,
    ...genTokenDecls(p),
    // resetComponent 全套
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    // genSplitterStyle
    `  display:flex;`,
    `  width:100%;`,
    `  height:100%;`,
    `  align-items:stretch;`,
    `}`,
    // ---- bar（用 `>` 避免与混合布局冲突） ----
    `${cls} > ${barCls}{`,
    `  flex:none;`,
    `  position:relative;`,
    `  user-select:none;`,
    `}`,
    // ---- Dragger ----
    `${barCls}-dragger{`,
    CENTER,
    `  z-index:1;`,
    `}`,
    `${barCls}-dragger::before{`,
    `  content:"";`,
    `  background:${v('control-item-bg-hover')};`,
    CENTER,
    `}`,
    `${barCls}-dragger::after{`,
    `  content:"";`,
    `  background:${v('color-fill')};`,
    CENTER,
    `}`,
    `${barCls}-dragger:hover:not(${barCls}-dragger-active)::before{`,
    `  background:${v('control-item-bg-active')};`,
    `}`,
    `${barCls}-dragger-active{`,
    `  z-index:2;`,
    `}`,
    `${barCls}-dragger-active::before{`,
    `  background:${v('control-item-bg-active-hover')};`,
    `}`,
    `${barCls}-dragger-active${barCls}-dragger-customize ${barCls}-dragger-icon{`,
    `  color:${v('color-primary')};`,
    `}`,
    // Disabled：不用 pointer-events:none（仍要触发折叠）
    `${barCls}-dragger-disabled${barCls}-dragger{`,
    `  z-index:0;`,
    `}`,
    `${barCls}-dragger-disabled${barCls}-dragger,`,
    `${barCls}-dragger-disabled${barCls}-dragger:hover,`,
    `${barCls}-dragger-disabled${barCls}-dragger-active{`,
    `  cursor:default;`,
    `}`,
    `${barCls}-dragger-disabled${barCls}-dragger::before,`,
    `${barCls}-dragger-disabled${barCls}-dragger:hover::before,`,
    `${barCls}-dragger-disabled${barCls}-dragger-active::before{`,
    `  background:${v('control-item-bg-hover')};`,
    `}`,
    `${barCls}-dragger-disabled${barCls}-dragger::after{`,
    `  display:none;`,
    `}`,
    `${barCls}-dragger-disabled${barCls}-dragger ${barCls}-dragger-icon{`,
    `  display:none;`,
    `}`,
    // customize dragger icon
    `${barCls}-dragger-customize{`,
    `}`,
    `${barCls}-dragger-customize ${barCls}-dragger-icon{`,
    CENTER,
    `  display:flex;`,
    `  align-items:center;`,
    `  color:${v('color-fill')};`,
    `}`,
    `${barCls}-dragger-customize::after{`,
    `  display:none;`,
    `}`,
    // ---- Collapse bar ----
    `${barCls}-collapse-bar{`,
    CENTER,
    `  z-index:${v('z-index-popup-base')};`,
    `  background:${v('control-item-bg-hover')};`,
    `  font-size:${v('font-size-sm')};`,
    `  border-radius:${v('border-radius-xs')};`,
    `  color:${v('color-text')};`,
    `  cursor:pointer;`,
    `  opacity:0;`,
    `  display:flex;`,
    `  align-items:center;`,
    `  justify-content:center;`,
    `}`,
    `${barCls}-collapse-bar:focus-visible{`,
    FOCUS_OUTLINE,
    `}`,
    `${barCls}-collapse-bar:hover:not(${barCls}-collapse-bar-customize){`,
    `  background:${v('control-item-bg-active')};`,
    `}`,
    `${barCls}-collapse-bar:active:not(${barCls}-collapse-bar-customize){`,
    `  background:${v('control-item-bg-active-hover')};`,
    `}`,
    `${barCls}-collapse-bar ${barCls}-collapse-icon{`,
    `  display:flex;`,
    `  align-items:center;`,
    `}`,
    `${barCls}-collapse-bar-customize{`,
    `  background:transparent;`,
    `}`,
    `${barCls}:hover ${barCls}-collapse-bar-hover-only,`,
    `${barCls}:active ${barCls}-collapse-bar-hover-only,`,
    `${barCls}:focus-within ${barCls}-collapse-bar-hover-only{`,
    `  opacity:1;`,
    `}`,
    `${barCls}-collapse-bar-hover-only{`,
    `}`,
    `@media(hover:none){`,
    `  ${barCls}-collapse-bar-hover-only{`,
    `    opacity:1;`,
    `  }`,
    `}`,
    `${barCls}-collapse-bar-always-hidden{`,
    `  display:none;`,
    `}`,
    `${barCls}-collapse-bar-always-visible{`,
    `  opacity:1;`,
    `}`,
    // ---- Mask ----
    `${maskCls}{`,
    `  position:fixed;`,
    `  z-index:${v('z-index-popup-base')};`,
    `  inset:0;`,
    `}`,
    `${maskCls}-horizontal{`,
    `  cursor:col-resize;`,
    `}`,
    `${maskCls}-vertical{`,
    `  cursor:row-resize;`,
    `}`,
    // ---- Layout: horizontal ----
    `${cls}-horizontal{`,
    `  flex-direction:row;`,
    `}`,
    `${cls}-horizontal > ${barCls}{`,
    `  width:0;`,
    `}`,
    `${cls}-horizontal > ${barCls} ${barCls}-preview{`,
    `  height:100%;`,
    `  width:${sv(p, 'split-bar-size')};`,
    previewBase,
    `}`,
    `${cls}-horizontal > ${barCls} ${barCls}-preview-active{`,
    `  display:block;`,
    `  transform:translate3d(${sv(p, 'bar-preview-offset')},0,0);`,
    `}`,
    `${cls}-horizontal > ${barCls} ${barCls}-dragger{`,
    `  cursor:col-resize;`,
    `  height:100%;`,
    `  width:${sv(p, 'split-trigger-size')};`,
    `}`,
    `${cls}-horizontal > ${barCls} ${barCls}-dragger::before{`,
    `  height:100%;`,
    `  width:${sv(p, 'split-bar-size')};`,
    `}`,
    `${cls}-horizontal > ${barCls} ${barCls}-dragger::after{`,
    `  height:${sv(p, 'split-bar-draggable-size')};`,
    `  width:${sv(p, 'split-bar-size')};`,
    `}`,
    `${cls}-horizontal > ${barCls} ${barCls}-collapse-bar{`,
    `  width:${v('font-size-sm')};`,
    `  height:${v('control-height-sm')};`,
    `}`,
    `${cls}-horizontal > ${barCls} ${barCls}-collapse-bar-start{`,
    `  inset-inline-start:auto;`,
    `  inset-inline-end:${halfTriggerSize};`,
    `  transform:translateY(-50%);`,
    `}`,
    `${cls}-horizontal > ${barCls} ${barCls}-collapse-bar-end{`,
    `  inset-inline-start:${halfTriggerSize};`,
    `  inset-inline-end:auto;`,
    `  transform:translateY(-50%);`,
    `}`,
    // ---- Layout: vertical ----
    `${cls}-vertical{`,
    `  flex-direction:column;`,
    `}`,
    `${cls}-vertical > ${barCls}{`,
    `  height:0;`,
    `}`,
    `${cls}-vertical > ${barCls} ${barCls}-preview{`,
    `  height:${sv(p, 'split-bar-size')};`,
    `  width:100%;`,
    previewBase,
    `}`,
    `${cls}-vertical > ${barCls} ${barCls}-preview-active{`,
    `  display:block;`,
    `  transform:translate3d(0,${sv(p, 'bar-preview-offset')},0);`,
    `}`,
    `${cls}-vertical > ${barCls} ${barCls}-dragger{`,
    `  cursor:row-resize;`,
    `  width:100%;`,
    `  height:${sv(p, 'split-trigger-size')};`,
    `}`,
    `${cls}-vertical > ${barCls} ${barCls}-dragger::before{`,
    `  width:100%;`,
    `  height:${sv(p, 'split-bar-size')};`,
    `}`,
    `${cls}-vertical > ${barCls} ${barCls}-dragger::after{`,
    `  width:${sv(p, 'split-bar-draggable-size')};`,
    `  height:${sv(p, 'split-bar-size')};`,
    `}`,
    `${cls}-vertical > ${barCls} ${barCls}-collapse-bar{`,
    `  height:${v('font-size-sm')};`,
    `  width:${v('control-height-sm')};`,
    `}`,
    `${cls}-vertical > ${barCls} ${barCls}-collapse-bar-start{`,
    `  top:auto;`,
    `  bottom:${halfTriggerSize};`,
    `  transform:translateX(-50%);`,
    `}`,
    `${cls}-vertical > ${barCls} ${barCls}-collapse-bar-end{`,
    `  top:${halfTriggerSize};`,
    `  bottom:auto;`,
    `  transform:translateX(-50%);`,
    `}`,
    // ---- Panels ----
    `${panelCls}{`,
    `  overflow:auto;`,
    `  scrollbar-width:thin;`,
    `  box-sizing:border-box;`,
    `}`,
    `${panelCls}-hidden{`,
    `  overflow:hidden;`,
    `}`,
    `${panelCls}:has(${cls}:only-child){`,
    `  overflow:hidden;`,
    `}`,
    `${panelCls}-transition{`,
    `  transition:flex-basis ${v('motion-duration-slow')} ${v('motion-ease-in-out')};`,
    `}`,
    `@media (prefers-reduced-motion: reduce){`,
    `  ${panelCls}-transition{`,
    `    transition:none;`,
    `  }`,
    `}`,
  ].join('\n');
}
