/**
 * Descriptions 的样式生成（genDescriptionsStyle）。
 *
 * 契约来源：antd 6.6.4 的 `es/descriptions/style/index.js`（`genDescriptionStyles` +
 * `genBorderedStyle` + `prepareComponentToken`；`textEllipsis` 是 antd 共享样式
 * `{overflow:hidden; white-space:nowrap; text-overflow:ellipsis}`，就地内联）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）；10 个 Component Token 声明直接落在
 *    `.{prefix}-descriptions` 上（radio 的 D46 同判：别名派生走 `var(--apollo-*)`
 *    随主题自适应；`titleMarginBottom` 的乘法派生走构建期 JS 解析值防亚像素）。
 * 2. `resetComponent` 全套落在根上（genStyleHooks 自动带）。
 * 3. cssinjs 的嵌套 `&` 已手工展开为扁平选择器 —— 展开规则：`&` 指代整个父链；
 *    `[cmp-row]` 无组合符 = 后代；`> th` = 直接子级。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { type ComponentToken, prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const sv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-descriptions-${name})`;

let tokenCache: ComponentToken | null = null;

function descriptionsTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken());
  }
  return tokenCache;
}

const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

/** 10 个 Component Token 声明（radio D46 同判：别名派生走 var()，乘法派生走解析值）。 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const t = descriptionsTokenValues();
  return [
    `  --${rootPrefixCls}-descriptions-label-bg:${v('colorFillAlter')};`,
    `  --${rootPrefixCls}-descriptions-label-color:${v('colorTextTertiary')};`,
    `  --${rootPrefixCls}-descriptions-title-color:${v('colorText')};`,
    `  --${rootPrefixCls}-descriptions-title-margin-bottom:${px(t.titleMarginBottom)};`,
    `  --${rootPrefixCls}-descriptions-item-padding-bottom:${v('padding')};`,
    `  --${rootPrefixCls}-descriptions-item-padding-end:${v('padding')};`,
    `  --${rootPrefixCls}-descriptions-colon-margin-right:${v('marginXS')};`,
    `  --${rootPrefixCls}-descriptions-colon-margin-left:calc(${v('marginXXS')} / 2);`,
    `  --${rootPrefixCls}-descriptions-content-color:${v('colorText')};`,
    `  --${rootPrefixCls}-descriptions-extra-color:${v('colorText')};`,
  ];
}

/**
 * bordered 段 —— antd 的 `genBorderedStyle`（`&{cmp}-bordered` = 交集选择器
 * `.{p}-descriptions.{p}-descriptions-bordered`；medium/small 嵌在 bordered 里，
 * `&{cmp}-medium` = `.{p}-descriptions-bordered.{p}-descriptions-medium`）。
 */
function genBorderedStyle(p: string): string[] {
  const D = `.${p}-descriptions`;
  const B = `${D}${D}-bordered`;
  const lineWidth = v('lineWidth');
  const lineType = v('lineType');
  const colorSplit = v('colorSplit');

  return [
    // &{cmp}-bordered > {cmp}-view
    `${B} > ${D}-view{`,
    `  border:${lineWidth} ${lineType} ${colorSplit};`,
    `}`,
    `${B} > ${D}-view > table{`,
    `  table-layout:auto;`,
    `}`,
    `${B} > ${D}-view ${D}-row{`,
    `  border-bottom:${lineWidth} ${lineType} ${colorSplit};`,
    `}`,
    `${B} > ${D}-view ${D}-row:first-child > th:first-child,${B} > ${D}-view ${D}-row:first-child > td:first-child{`,
    `  border-start-start-radius:${v('borderRadiusLG')};`,
    `}`,
    `${B} > ${D}-view ${D}-row:last-child{`,
    `  border-bottom:none;`,
    `}`,
    `${B} > ${D}-view ${D}-row:last-child > th:first-child,${B} > ${D}-view ${D}-row:last-child > td:first-child{`,
    `  border-end-start-radius:${v('borderRadiusLG')};`,
    `}`,
    `${B} > ${D}-view ${D}-row > ${D}-item-label,${B} > ${D}-view ${D}-row > ${D}-item-content{`,
    `  padding:${v('padding')} ${v('paddingLG')};`,
    `  border-inline-end:${lineWidth} ${lineType} ${colorSplit};`,
    `}`,
    `${B} > ${D}-view ${D}-row > ${D}-item-label:last-child,${B} > ${D}-view ${D}-row > ${D}-item-content:last-child{`,
    `  border-inline-end:none;`,
    `}`,
    `${B} > ${D}-view ${D}-row > ${D}-item-label{`,
    // ⚠️ 判据修正：antd 实际渲染产物是 `var(--ant-color-text-secondary)`（实测 0.65），
    //    不是缓存 es 源码里的 `token.labelColor`（0.45）—— 产物优先于源码（§5 优先级）。
    `  color:${v('colorTextSecondary')};`,
    `  background-color:${sv(p, 'label-bg')};`,
    `}`,
    `${B} > ${D}-view ${D}-row > ${D}-item-label::after{`,
    `  display:none;`,
    `}`,
    // &{cmp}-medium / &{cmp}-small（嵌在 bordered 内）
    `${B}${D}-medium ${D}-row > ${D}-item-label,${B}${D}-medium ${D}-row > ${D}-item-content{`,
    `  padding:${v('paddingSM')} ${v('paddingLG')};`,
    `}`,
    `${B}${D}-small ${D}-row > ${D}-item-label,${B}${D}-small ${D}-row > ${D}-item-content{`,
    `  padding:${v('paddingXS')} ${v('padding')};`,
    `}`,
  ];
}

/** 主段 —— antd 的 `genDescriptionStyles`。 */
function genDescriptionStyle(p: string): string[] {
  const D = `.${p}-descriptions`;

  return [
    `${D}{`,
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
    `}`,
    // &-rtl
    `${D}-rtl{`,
    `  direction:rtl;`,
    `}`,
    // genBorderedStyle
    ...genBorderedStyle(p),
    // {cmp}-header
    `${D} ${D}-header{`,
    `  display:flex;`,
    `  align-items:center;`,
    `  margin-bottom:${sv(p, 'title-margin-bottom')};`,
    `}`,
    // {cmp}-title（textEllipsis 内联）
    `${D} ${D}-title{`,
    `  overflow:hidden;`,
    `  white-space:nowrap;`,
    `  text-overflow:ellipsis;`,
    `  flex:auto;`,
    `  color:${sv(p, 'title-color')};`,
    `  font-weight:${v('fontWeightStrong')};`,
    `  font-size:${v('fontSizeLG')};`,
    `  line-height:${v('lineHeightLG')};`,
    `}`,
    // {cmp}-extra
    `${D} ${D}-extra{`,
    `  margin-inline-start:auto;`,
    `  color:${sv(p, 'extra-color')};`,
    `  font-size:${v('fontSize')};`,
    `}`,
    // {cmp}-view
    `${D} ${D}-view{`,
    `  width:100%;`,
    `  border-radius:${v('borderRadiusLG')};`,
    `}`,
    `${D} ${D}-view table{`,
    `  min-width:100%;`,
    `  table-layout:fixed;`,
    `  border-collapse:collapse;`,
    `}`,
    // {cmp}-row
    `${D} ${D}-row > th,${D} ${D}-row > td{`,
    `  padding-bottom:${sv(p, 'item-padding-bottom')};`,
    `  padding-inline-end:${sv(p, 'item-padding-end')};`,
    `}`,
    `${D} ${D}-row > th:last-child,${D} ${D}-row > td:last-child{`,
    `  padding-inline-end:0;`,
    `}`,
    `${D} ${D}-row:last-child{`,
    `  border-bottom:none;`,
    `}`,
    `${D} ${D}-row:last-child > th,${D} ${D}-row:last-child > td{`,
    `  padding-bottom:0;`,
    `}`,
    // {cmp}-item-label
    `${D} ${D}-item-label{`,
    `  color:${sv(p, 'label-color')};`,
    `  font-weight:normal;`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  text-align:start;`,
    `}`,
    `${D} ${D}-item-label::after{`,
    `  content:":";`,
    `  position:relative;`,
    `  top:-0.5px;`, // antd：`top: -0.5`（magic for position）
    `  margin-inline:${sv(p, 'colon-margin-left')} ${sv(p, 'colon-margin-right')};`,
    `}`,
    `${D} ${D}-item-label${D}-item-no-colon::after{`,
    `  content:"";`,
    `}`,
    // {cmp}-item-no-label
    `${D} ${D}-item-no-label::after{`,
    `  margin:0;`,
    `  content:"";`,
    `}`,
    // {cmp}-item-content
    `${D} ${D}-item-content{`,
    `  display:table-cell;`,
    `  flex:1;`,
    `  color:${sv(p, 'content-color')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  word-break:break-word;`,
    `  overflow-wrap:break-word;`,
    `}`,
    // {cmp}-item（+ container）
    `${D} ${D}-item{`,
    `  padding-bottom:0;`,
    `  vertical-align:top;`,
    `}`,
    `${D} ${D}-item-container{`,
    `  display:flex;`,
    `}`,
    `${D} ${D}-item-container ${D}-item-label{`,
    `  display:inline-flex;`,
    `  align-items:baseline;`,
    `}`,
    `${D} ${D}-item-container ${D}-item-content{`,
    `  display:inline-flex;`,
    `  align-items:baseline;`,
    `  min-width:1em;`,
    `}`,
    // &-medium / &-small（非 bordered 的纵向 padding）
    `${D}-medium ${D}-row > th,${D}-medium ${D}-row > td{`,
    `  padding-bottom:${v('paddingSM')};`,
    `}`,
    `${D}-small ${D}-row > th,${D}-small ${D}-row > td{`,
    `  padding-bottom:${v('paddingXS')};`,
    `}`,
  ];
}

/**
 * 生成 Descriptions 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genDescriptionsStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  return [...genDescriptionStyle(p)].join('\n');
}
