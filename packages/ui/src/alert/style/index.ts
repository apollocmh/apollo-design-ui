/**
 * Alert 的样式生成（genBaseStyle + genTypeStyle + genActionStyle 三单合一）。
 *
 * 契约来源：antd 6.6.4 的 `es/alert/style/index.js`，取值逐条对齐 cssinjs
 * extractStyle 产物（cssVar 模式，全 var() 化）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash/css-var 包裹类（D5）；4 个 Component Token 变量声明在根类（badge 范式）。
 * 2. resetComponent 的 box-sizing 等已由 BASE_CSS 覆盖，不重复产出（spin 范式）。
 * 3. genFocusStyle ⇒ `:focus-visible` 焦点环（button/typography 同款）。
 * 4. `-close-text` 的过渡与 hover 独立成块（antd 的 `&-close-text` 复合选择器展开）。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** 焦点环（antd 的 genFocusStyle ⇒ genFocusOutline + transition）。 */
const focusStyle = (): string =>
  `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};\n` +
  `  outline-offset:1px;\n` +
  `  transition:outline-offset 0s,outline 0s;`;

/**
 * 生成 Alert 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genAlertStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-alert`;

  return [
    // ---- 根（Component Token 声明 + resetComponent + genBaseStyle）----
    `${cls}{`,
    `  --${rootPrefixCls}-alert-border-radius:${v('borderRadiusLG')};`,
    `  --${rootPrefixCls}-alert-with-description-icon-size:${v('fontSizeHeading3')};`,
    `  --${rootPrefixCls}-alert-default-padding:8px 12px;`,
    `  --${rootPrefixCls}-alert-with-description-padding:20px 24px;`,
    `  margin:0;`,
    `  padding:var(--${rootPrefixCls}-alert-default-padding);`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  position:relative;`,
    `  display:flex;`,
    `  align-items:center;`,
    `  word-wrap:break-word;`,
    `  border-radius:var(--${rootPrefixCls}-alert-border-radius);`,
    `  border-width:${v('lineWidth')};`,
    `  border-style:${v('lineType')};`,
    `}`,

    // ---- 四 type 的边框色（genBaseStyle）----
    `${cls}${cls}-success{`,
    `  border-color:${v('colorSuccessBorder')};`,
    `}`,
    `${cls}${cls}-info{`,
    `  border-color:${v('colorInfoBorder')};`,
    `}`,
    `${cls}${cls}-warning{`,
    `  border-color:${v('colorWarningBorder')};`,
    `}`,
    `${cls}${cls}-error{`,
    `  border-color:${v('colorErrorBorder')};`,
    `}`,
    `${cls}${cls}-filled{`,
    `  border-color:transparent;`,
    `}`,
    `${cls}${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,

    // ---- section / icon / description / title ----
    `${cls} ${cls}-section{`,
    `  flex:1;`,
    `  min-width:0;`,
    `}`,
    `${cls} ${cls}-icon{`,
    `  margin-inline-end:${v('marginXS')};`,
    `  line-height:0;`,
    `}`,
    `${cls}-description{`,
    `  display:none;`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `}`,
    `${cls}-title{`,
    `  color:${v('colorTextHeading')};`,
    `}`,

    // ---- motion（leave 收起动画）----
    `${cls}${cls}-motion-leave{`,
    `  overflow:hidden;`,
    `  opacity:1;`,
    `  transition:max-height ${v('motionDurationSlow')} ${v('motionEaseInOutCirc')},` +
      `opacity ${v('motionDurationSlow')} ${v('motionEaseInOutCirc')},` +
      `padding-top ${v('motionDurationSlow')} ${v('motionEaseInOutCirc')},` +
      `padding-bottom ${v('motionDurationSlow')} ${v('motionEaseInOutCirc')},` +
      `margin-bottom ${v('motionDurationSlow')} ${v('motionEaseInOutCirc')};`,
    `}`,
    `${cls}${cls}-motion-leave-active{`,
    `  max-height:0;`,
    `  margin-bottom:0!important;`,
    `  padding-top:0;`,
    `  padding-bottom:0;`,
    `  opacity:0;`,
    `}`,

    // ---- with-description ----
    `${cls}${cls}-with-description{`,
    `  align-items:flex-start;`,
    `  padding:var(--${rootPrefixCls}-alert-with-description-padding);`,
    `}`,
    `${cls}${cls}-with-description ${cls}-icon{`,
    `  margin-inline-end:${v('marginSM')};`,
    `  font-size:var(--${rootPrefixCls}-alert-with-description-icon-size);`,
    `  line-height:0;`,
    `}`,
    `${cls}${cls}-with-description ${cls}-title{`,
    `  display:block;`,
    `  margin-bottom:${v('marginXS')};`,
    `  color:${v('colorTextHeading')};`,
    `  font-size:${v('fontSizeLG')};`,
    `}`,
    `${cls}${cls}-with-description ${cls}-description{`,
    `  display:block;`,
    `  color:${v('colorText')};`,
    `}`,

    // ---- banner ----
    `${cls}${cls}-banner{`,
    `  margin-bottom:0;`,
    `  border:0!important;`,
    `  border-radius:0;`,
    `}`,

    // ---- 四 type 的背景与图标色（genTypeStyle）----
    `${cls}${cls}-success{`,
    `  background:${v('colorSuccessBg')};`,
    `}`,
    `${cls}${cls}-success ${cls}-icon{`,
    `  color:${v('colorSuccess')};`,
    `}`,
    `${cls}${cls}-info{`,
    `  background:${v('colorInfoBg')};`,
    `}`,
    `${cls}${cls}-info ${cls}-icon{`,
    `  color:${v('colorInfo')};`,
    `}`,
    `${cls}${cls}-warning{`,
    `  background:${v('colorWarningBg')};`,
    `}`,
    `${cls}${cls}-warning ${cls}-icon{`,
    `  color:${v('colorWarning')};`,
    `}`,
    `${cls}${cls}-error{`,
    `  background:${v('colorErrorBg')};`,
    `}`,
    `${cls}${cls}-error ${cls}-icon{`,
    `  color:${v('colorError')};`,
    `}`,
    `${cls}${cls}-error ${cls}-description>pre{`,
    `  margin:0;`,
    `  padding:0;`,
    `}`,

    // ---- actions / close-icon / close-text（genActionStyle）----
    `${cls} ${cls}-actions{`,
    `  margin-inline-start:${v('marginXS')};`,
    `}`,
    `${cls} ${cls}-close-icon{`,
    `  margin-inline-start:${v('marginXS')};`,
    `  padding:0;`,
    `  overflow:hidden;`,
    `  font-size:${v('fontSizeIcon')};`,
    `  line-height:${v('fontSizeIcon')};`,
    `  background-color:transparent;`,
    `  border:none;`,
    `  cursor:pointer;`,
    `}`,
    `${cls} ${cls}-close-icon:focus-visible{`,
    focusStyle(),
    `}`,
    `${cls} ${cls}-close-icon .${rootPrefixCls}-icon-close{`,
    `  color:${v('colorIcon')};`,
    `  transition:color ${v('motionDurationMid')};`,
    `}`,
    `${cls} ${cls}-close-icon .${rootPrefixCls}-icon-close:hover{`,
    `  color:${v('colorIconHover')};`,
    `}`,
    `${cls}-close-text{`,
    `  color:${v('colorIcon')};`,
    `  transition:color ${v('motionDurationMid')};`,
    `}`,
    `${cls}-close-text:hover{`,
    `  color:${v('colorIconHover')};`,
    `}`,
  ].join('\n');
}
