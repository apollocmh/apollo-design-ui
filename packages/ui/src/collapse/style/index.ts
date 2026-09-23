/**
 * Collapse 的样式生成（genCollapseStyle）。
 *
 * 契约来源：antd 6.6.4 `es/collapse/style/index.js`（五段：genBaseStyle /
 * genBorderlessStyle / genGhostStyle / genArrowStyle / genCollapseMotion）+
 * `prepareComponentToken`（10 个字段）。逐行对拍，扁平化。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）；10 个 Component Token 声明落在
 *    `.{p}-collapse` 上。padding 组合串与固定 16px 是**构建期解析值**（D50 同判）；
 *    纯别名引用（headerBg/contentBg/borderlessContentBg）走 `var()`（D46 同判）。
 * 2. `collapsePanelBorderRadius = borderRadiusLG`（mergeToken 派生）⇒ 构建期解析值。
 * 3. genCollapseMotion 的 motionName：antd 挂在 `${antCls}-motion-collapse`，
 *    本仓是 `.{rootPrefixCls}-motion-collapse`（motion 包 preset 的命名同源）。
 * 4. genFocusStyle ⇒ `:focus-visible` 焦点环（splitter 同款内联）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

const sv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-collapse-${name})`;

const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

/** 构建期算好的 10 个 token 值（prepareComponentToken 对拍）。 */
export interface ComponentToken {
  headerPadding: string;
  headerPaddingSM: string;
  headerPaddingLG: string;
  headerBg: string;
  contentPadding: string;
  contentPaddingSM: string;
  contentPaddingLG: string;
  contentBg: string;
  borderlessContentPadding: string;
  borderlessContentBg: string;
  /** mergeToken 派生：collapsePanelBorderRadius = borderRadiusLG。 */
  collapsePanelBorderRadius: string;
}

export function prepareComponentToken(token: {
  padding: number;
  paddingSM: number;
  paddingXS: number;
  paddingLG: number;
  paddingXXS: number;
  colorFillAlter: string;
  colorBgContainer: string;
  borderRadiusLG: number;
}): ComponentToken {
  return {
    headerPadding: `${px(token.paddingSM)} ${px(token.padding)}`,
    headerPaddingSM: `${px(token.paddingXS)} ${px(token.paddingSM)} ${px(token.paddingXS)} ${px(token.paddingXS)}`,
    headerPaddingLG: `${px(token.padding)} ${px(token.paddingLG)} ${px(token.padding)} ${px(token.padding)}`,
    headerBg: token.colorFillAlter,
    contentPadding: `${px(token.padding)} 16px`,
    contentPaddingSM: px(token.paddingSM),
    contentPaddingLG: px(token.paddingLG),
    contentBg: token.colorBgContainer,
    borderlessContentPadding: `${px(token.paddingXXS)} 16px ${px(token.padding)}`,
    borderlessContentBg: 'transparent',
    collapsePanelBorderRadius: px(token.borderRadiusLG),
  };
}

let tokenCache: ComponentToken | null = null;

function collapseTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken() as never);
  }
  return tokenCache;
}

/** Component Token 声明块（别名引用 ⇒ var()；padding 组合 ⇒ 构建期解析值）。 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = collapseTokenValues();
  return [
    `  --${p}-collapse-header-bg:${v('colorFillAlter')};`,
    `  --${p}-collapse-content-bg:${v('colorBgContainer')};`,
    `  --${p}-collapse-header-padding:${t.headerPadding};`,
    `  --${p}-collapse-header-padding-sm:${t.headerPaddingSM};`,
    `  --${p}-collapse-header-padding-lg:${t.headerPaddingLG};`,
    `  --${p}-collapse-content-padding:${t.contentPadding};`,
    `  --${p}-collapse-content-padding-sm:${t.contentPaddingSM};`,
    `  --${p}-collapse-content-padding-lg:${t.contentPaddingLG};`,
    `  --${p}-collapse-borderless-content-padding:${t.borderlessContentPadding};`,
    `  --${p}-collapse-panel-border-radius:${t.collapsePanelBorderRadius};`,
  ];
}

/** `:focus-visible` 焦点环（genFocusOutline 等价）。 */
const FOCUS_OUTLINE = [
  '  outline:2px solid var(--apollo-color-primary);',
  '  outline-offset:-2px;',
  '  transition:outline-color 0s;',
].join('\n');

export function genCollapseStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-collapse`;
  const borderBase = `${v('lineWidth')} ${v('lineType')} ${v('colorBorder')}`;
  const motionCls = `.${p}-motion-collapse`;

  return [
    // ---- genBaseStyle ----
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
    `  background-color:${sv(p, 'header-bg')};`,
    `  border:${borderBase};`,
    `  border-radius:var(--${p}-collapse-panel-border-radius);`,
    `}`,
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    `${cls} > ${cls}-item{`,
    `  border-bottom:${borderBase};`,
    `}`,
    `${cls} > ${cls}-item:first-child,`,
    `${cls} > ${cls}-item:first-child > ${cls}-header{`,
    `  border-radius:var(--${p}-collapse-panel-border-radius) var(--${p}-collapse-panel-border-radius) 0 0;`,
    `}`,
    `${cls} > ${cls}-item:last-child,`,
    `${cls} > ${cls}-item:last-child > ${cls}-header{`,
    `  border-radius:0 0 ${sv(p, 'panel-border-radius')} ${sv(p, 'panel-border-radius')};`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-header{`,
    `  position:relative;`,
    `  display:flex;`,
    `  flex-wrap:nowrap;`,
    `  align-items:flex-start;`,
    `  padding:${sv(p, 'header-padding')};`,
    `  color:${v('colorTextHeading')};`,
    `  line-height:${v('lineHeight')};`,
    `  cursor:pointer;`,
    `  transition:all ${v('motionDurationMid')}, visibility 0s;`,
    `}`,
    // antd 的 genFocusStyle：&:focus-visible 嵌套 ⇒ 独立选择器
    `${cls} > ${cls}-item > ${cls}-header:focus-visible{`,
    FOCUS_OUTLINE,
    `}`,
    `${cls} > ${cls}-item > ${cls}-header > ${cls}-title{`,
    `  flex:auto;`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-header > ${cls}-expand-icon{`,
    `  height:${v('fontHeight')};`,
    `  display:flex;`,
    `  align-items:center;`,
    `  margin-inline-end:${v('marginSM')};`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-header ${cls}-arrow{`,
    `  font-size:${v('fontSizeIcon')};`,
    `  transition:transform ${v('motionDurationMid')};`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-header > ${cls}-arrow svg{`,
    `  transition:transform ${v('motionDurationMid')};`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-header > ${cls}-title{`,
    `  margin-inline-end:auto;`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-header > ${cls}-title > svg{`,
    `  display:inline-block;`,
    `  vertical-align:middle;`,
    `  margin-block-end:0.2em;`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-collapsible-header{`,
    `  cursor:default;`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-collapsible-header > ${cls}-title{`,
    `  flex:none;`,
    `  cursor:pointer;`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-collapsible-header > ${cls}-expand-icon{`,
    `  cursor:pointer;`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-collapsible-icon{`,
    `  cursor:unset;`,
    `}`,
    `${cls} > ${cls}-item > ${cls}-collapsible-icon > ${cls}-expand-icon{`,
    `  cursor:pointer;`,
    `}`,
    `${cls}-panel{`,
    `  color:${v('colorText')};`,
    `  background-color:${sv(p, 'content-bg')};`,
    `  border-top:${borderBase};`,
    `}`,
    `${cls}-panel > ${cls}-body{`,
    `  padding:${sv(p, 'content-padding')};`,
    `}`,
    `${cls}-panel-hidden{`,
    `  display:none;`,
    `}`,
    `${cls}-small > ${cls}-item > ${cls}-header{`,
    `  padding:${sv(p, 'header-padding-sm')};`,
    `}`,
    `${cls}-small > ${cls}-item > ${cls}-header > ${cls}-expand-icon{`,
    `  margin-inline-start:calc(${v('paddingSM')} - ${v('paddingXS')});`,
    `}`,
    `${cls}-small > ${cls}-item > ${cls}-panel > ${cls}-body{`,
    `  padding:${sv(p, 'content-padding-sm')};`,
    `}`,
    `${cls}-large > ${cls}-item{`,
    `  font-size:${v('fontSizeLG')};`,
    `  line-height:${v('lineHeightLG')};`,
    `}`,
    `${cls}-large > ${cls}-item > ${cls}-header{`,
    `  padding:${sv(p, 'header-padding-lg')};`,
    `}`,
    `${cls}-large > ${cls}-item > ${cls}-header > ${cls}-expand-icon{`,
    `  height:${v('fontHeightLG')};`,
    `  margin-inline-start:calc(${v('paddingLG')} - ${v('padding')});`,
    `}`,
    `${cls}-large > ${cls}-item > ${cls}-panel > ${cls}-body{`,
    `  padding:${sv(p, 'content-padding-lg')};`,
    `}`,
    `${cls}-item:last-child{`,
    `  border-bottom:0;`,
    `}`,
    `${cls}-item:last-child > ${cls}-panel{`,
    `  border-radius:0 0 ${sv(p, 'panel-border-radius')} ${sv(p, 'panel-border-radius')};`,
    `}`,
    `${cls} ${cls}-item-disabled > ${cls}-header{`,
    `  color:${v('colorTextDisabled')};`,
    `  cursor:not-allowed;`,
    `}`,
    `${cls} ${cls}-item-disabled > ${cls}-header > .arrow{`,
    `  color:${v('colorTextDisabled')};`,
    `  cursor:not-allowed;`,
    `}`,
    // ---- Icon Placement end ----
    `${cls}-icon-placement-end > ${cls}-item > ${cls}-header > ${cls}-expand-icon{`,
    `  order:1;`,
    `  margin-inline-end:0;`,
    `  margin-inline-start:${v('marginSM')};`,
    `}`,
    // ---- genBorderlessStyle ----
    `${cls}-borderless{`,
    `  background-color:${sv(p, 'header-bg')};`,
    `  border:0;`,
    `}`,
    `${cls}-borderless > ${cls}-item{`,
    `  border-bottom:${v('lineWidth')} ${v('lineType')} ${v('colorBorder')};`,
    `}`,
    `${cls}-borderless > ${cls}-item:last-child,`,
    `${cls}-borderless > ${cls}-item:last-child ${cls}-header{`,
    `  border-radius:0;`,
    `}`,
    `${cls}-borderless > ${cls}-item:last-child{`,
    `  border-bottom:0;`,
    `}`,
    `${cls}-borderless > ${cls}-item > ${cls}-panel{`,
    `  background-color:transparent;`,
    `  border-top:0;`,
    `}`,
    `${cls}-borderless > ${cls}-item > ${cls}-panel > ${cls}-body{`,
    `  padding:${sv(p, 'borderless-content-padding')};`,
    `}`,
    // ---- genGhostStyle ----
    `${cls}-ghost{`,
    `  background-color:transparent;`,
    `  border:0;`,
    `}`,
    `${cls}-ghost > ${cls}-item{`,
    `  border-bottom:0;`,
    `}`,
    `${cls}-ghost > ${cls}-item > ${cls}-panel{`,
    `  background-color:transparent;`,
    `  border:0;`,
    `}`,
    `${cls}-ghost > ${cls}-item > ${cls}-panel > ${cls}-body{`,
    `  padding-block:${v('paddingSM')};`,
    `}`,
    // ---- genArrowStyle（rtl 箭头镜像） ----
    `${cls}-rtl > ${cls}-item > ${cls}-header ${cls}-arrow{`,
    `  transform:rotate(180deg);`,
    `}`,
    // ---- genCollapseMotion（motionName 挂根前缀） ----
    `${cls} ${motionCls}-legacy{`,
    `  overflow:hidden;`,
    `}`,
    `${cls} ${motionCls}-legacy-active{`,
    `  transition:height ${v('motionDurationMid')} ${v('motionEaseInOut')} !important, opacity ${v('motionDurationMid')} ${v('motionEaseInOut')} !important;`,
    `}`,
    `${cls} ${motionCls}{`,
    `  overflow:hidden;`,
    `  transition:height ${v('motionDurationMid')} ${v('motionEaseInOut')} !important, opacity ${v('motionDurationMid')} ${v('motionEaseInOut')} !important;`,
    `}`,
  ].join('\n');
}
