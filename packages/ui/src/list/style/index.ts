/**
 * Static List styles. Component variables are declared once on each List root;
 * data containers inherit the current Provider/native overrides. Conditional
 * item styles use the nearest Vue List context, so nested Lists stay independent.
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { type ComponentToken, prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

let tokenCache: ComponentToken | null = null;

function listTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken());
  }
  return tokenCache;
}

/** 数字带 `px`、字符串原样 —— 与 cssinjs 的 `unit()` 同义。 */
const unit = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : String(value);

/**
 * Component Token 的声明块（**11** 个字段，构建期解析值）。
 *
 * ⚠️ 顺序与产物的 css-var 块一致（`content-width` → `item-padding` → `item-padding-sm` →
 * `item-padding-lg` → `header-bg` → `footer-bg` → `empty-text-padding` →
 * `meta-margin-bottom` → `avatar-margin-right` → `title-margin-bottom` →
 * `description-font-size`）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = listTokenValues();
  return [
    `  --${p}-list-content-width:${unit(t.contentWidth)};`,
    `  --${p}-list-item-padding:${t.itemPadding};`,
    `  --${p}-list-item-padding-sm:${t.itemPaddingSM};`,
    `  --${p}-list-item-padding-lg:${t.itemPaddingLG};`,
    `  --${p}-list-header-bg:${t.headerBg};`,
    `  --${p}-list-footer-bg:${t.footerBg};`,
    `  --${p}-list-empty-text-padding:${unit(t.emptyTextPadding)};`,
    `  --${p}-list-meta-margin-bottom:${unit(t.metaMarginBottom)};`,
    `  --${p}-list-avatar-margin-right:${unit(t.avatarMarginRight)};`,
    `  --${p}-list-title-margin-bottom:${unit(t.titleMarginBottom)};`,
    `  --${p}-list-description-font-size:${unit(t.descriptionFontSize)};`,
  ];
}

export function genListStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-list`;
  const item = `${cls}-item`;
  const meta = `${item}-meta`;
  const action = `${item}-action`;
  const tv = (name: string): string => `var(--${p}-list-${name})`;
  return [
    `${cls}{`,
    ...genTokenDecls(p),
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  position:relative;`,
    `  --rc-virtual-list-scrollbar-bg:${v('colorSplit')};`,
    `}`,
    `${cls}>${cls}-header{background:${tv('header-bg')};grid-area:header;}`,
    `${cls}>${cls}-footer{background:${tv('footer-bg')};grid-area:footer;}`,
    `${cls}>${cls}-header,${cls}>${cls}-footer{padding-block:${v('paddingSM')};}`,
    `${cls}>${cls}-pagination{margin-block-start:${v('marginLG')};}`,
    `${cls}>${cls}-pagination-top{grid-area:top;}`,
    `${cls}>${cls}-pagination-bottom{grid-area:bottom;}`,
    `${cls}>${cls}-pagination .${p}-pagination-options{text-align:start;}`,
    `${cls}>${cls}-spin{grid-area:content;min-width:0;}`,
    `${cls}-loading>${cls}-spin{min-height:${v('controlHeightLG')};}`,
    `${cls}>${cls}-load-more{grid-area:bottom;}`,
    `${cls}>${cls}-extra{grid-area:extra;min-width:0;}`,
    `${cls}-with-extra{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:${v('marginLG')};grid-template-areas:"top extra" "header extra" "content extra" "footer extra" "bottom extra";}`,
    `${cls}-items{margin:0;padding:0;list-style:none;}`,
    `${item}{display:flex;align-items:center;justify-content:space-between;padding:${tv('item-padding')};color:${v('colorText')};}`,
    `${item}>${item}-main{display:contents;}`,
    `${item}>${item}-extra{margin-inline-start:${v('marginLG')};}`,
    `${meta}{display:flex;flex:1;align-items:flex-start;max-width:100%;}`,
    `${meta}>${meta}-avatar{margin-inline-end:${tv('avatar-margin-right')};}`,
    `${meta}>${meta}-content{flex:1 0;width:0;color:${v('colorText')};}`,
    `${meta}>${meta}-content>${meta}-title{margin:0 0 ${v('marginXXS')} 0;color:${v('colorText')};font-size:${v('fontSize')};line-height:${v('lineHeight')};}`,
    `${meta}>${meta}-content>${meta}-title>a{color:${v('colorText')};transition:all ${v('motionDurationSlow')};}`,
    `${meta}>${meta}-content>${meta}-title>a:hover{color:${v('colorPrimary')};}`,
    `${meta}>${meta}-content>${meta}-description{color:${v('colorTextSecondary')};font-size:${tv('description-font-size')};line-height:${v('lineHeight')};}`,
    `${item}>${item}-main>${action}{flex:0 0 auto;margin-inline-start:${v('marginXXL')};padding:0;font-size:0;list-style:none;}`,
    `${action}>li{position:relative;display:inline-block;padding:0 ${v('paddingXS')};color:${v('colorTextSecondary')};font-size:${v('fontSize')};line-height:${v('lineHeight')};text-align:center;}`,
    `${action}>li:first-child{padding-inline-start:0;}`,
    `${action}>li>${action}-split{position:absolute;inset-block-start:50%;inset-inline-end:0;width:${v('lineWidth')};height:calc(${v('fontHeight')} - ${v('marginXXS')} * 2);transform:translateY(-50%);background-color:${v('colorSplit')};}`,
    `${cls}-empty-text{padding:${tv('empty-text-padding')};color:${v('colorTextSecondary')};font-size:${v('fontSize')};text-align:center;}`,
    `${cls}-empty-text>.${p}-empty .${p}-empty-description{color:${v('colorTextSecondary')};}`,
    `${item}-no-flex{display:block;}`,
    `${item}-vertical{align-items:initial;}`,
    `${item}-vertical>${item}-main{display:block;flex:1;min-width:0;}`,
    `${meta}-vertical{margin-block-end:${tv('meta-margin-bottom')};}`,
    `${meta}-vertical>${meta}-content>${meta}-title{margin-block-start:0;margin-block-end:${tv('title-margin-bottom')};font-size:${v('fontSizeLG')};line-height:${v('lineHeightLG')};}`,
    `${item}-vertical>${item}-main>${action}{margin-block-start:${v('padding')};margin-inline-start:auto;}`,
    `${item}-vertical>${item}-main>${action}>li{padding:0 ${v('padding')};}`,
    `${item}-vertical>${item}-main>${action}>li:first-child{padding-inline-start:0;}`,
    `${item}-split{border-block-end:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};}`,
    `${item}-split:last-child{border-block-end:none;}`,
    `${cls}-items-with-after>${item}-split:last-child{border-block-end:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};}`,
    `${cls}-split>${cls}-header{border-block-end:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};}`,
    `${cls}-split${cls}-empty>${cls}-footer{border-top:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};}`,
    `${item}-lg{padding:${tv('item-padding-lg')};}`,
    `${item}-sm{padding:${tv('item-padding-sm')};}`,
    `${item}-no-flex:not(${item}-vertical)>${item}-main>${action}{float:inline-end;}`,
    `${cls}-bordered{--${p}-list-item-padding:${v('paddingContentVertical')} ${v('paddingLG')};border:${v('lineWidth')} ${v('lineType')} ${v('colorBorder')};border-radius:${v('borderRadiusLG')};}`,
    `${cls}-bordered>${cls}-header{border-radius:calc(${v('borderRadiusLG')} - ${v('lineWidth')}) calc(${v('borderRadiusLG')} - ${v('lineWidth')}) 0 0;}`,
    `${cls}-bordered>${cls}-footer{border-radius:0 0 calc(${v('borderRadiusLG')} - ${v('lineWidth')}) calc(${v('borderRadiusLG')} - ${v('lineWidth')});}`,
    `${cls}-bordered>${cls}-header,${cls}-bordered>${cls}-footer{padding-inline:${v('paddingLG')};}`,
    `${cls}-bordered>${cls}-pagination{margin:${v('margin')} ${v('marginLG')};}`,
    `${item}-bordered${item}-sm,${cls}-bordered${cls}-sm>${cls}-header,${cls}-bordered${cls}-sm>${cls}-footer{padding:${tv('item-padding-sm')};}`,
    `${item}-bordered${item}-lg,${cls}-bordered${cls}-lg>${cls}-header,${cls}-bordered${cls}-lg>${cls}-footer{padding:${tv('item-padding-lg')};}`,
    `${item}-grid{display:block;max-width:100%;margin-block-end:${v('margin')};padding-block:0;border-block-end:none;}`,
    // Media queries cannot consume CSS variables; these are the standard breakpoints.
    `@media screen and (max-width:768px){`,
    `${item}>${item}-main>${action}{margin-inline-start:${v('marginLG')};}`,
    `}`,
    `@media screen and (max-width:576px){`,
    `${item}{flex-wrap:wrap;}`,
    `${item}>${item}-main>${action}{margin-inline-start:${v('marginSM')};}`,
    `${item}-vertical{flex-wrap:wrap-reverse;}`,
    `${item}-vertical>${item}-main{min-width:min(100%,${tv('content-width')});}`,
    `${item}-vertical>${item}-extra{margin:auto auto ${v('margin')};}`,
    `${cls}-with-extra{grid-template-columns:minmax(0,1fr);grid-template-areas:"top" "header" "content" "footer" "bottom" "extra";}`,
    `}`,
  ].join('\n');
}
