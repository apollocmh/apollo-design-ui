/**
 * Listy 的样式生成（genListyStyle）。
 *
 * 契约来源：antd 6.6.4 `es/listy/style/index.js` 的 `genListyStyle`（单段）+
 * `resetComponent`。全部挂在 `.{prefixCls}` 命名空间上。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）；2 个 Component Token 声明直接落在
 *    `.{prefix}-listy` 上，且都是**纯别名引用**（radio D46 同判 ⇒ `var()` 形态）。
 * 2. `-scrollbar` 段照搬（`zIndex/cursor/hover`）—— 上游由 rc-virtual-list 的
 *    自绘 ScrollBar 节点消费；本仓 foundation 是原生滚动 ⇒ 无节点命中，规则保留
 *    以对齐产物选择器集合（无害死规则，登记 COMPATIBILITY）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const sv = (rootPrefixCls: string, name: string): string => `var(--${rootPrefixCls}-listy-${name})`;

/** Component Token 声明块（2 个字段；纯别名引用 ⇒ var() 形态）。 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  return [
    `  --${p}-listy-item-padding-block:${v('paddingSM')};`,
    `  --${p}-listy-item-padding-inline:${v('padding')};`,
  ];
}

export function genListyStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-listy`;
  return [
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
    // genListyStyle
    `  position:relative;`,
    `}`,
    // ---- Item ----
    `${cls}-item{`,
    `  padding:${sv(p, 'item-padding-block')} ${sv(p, 'item-padding-inline')};`,
    `  border-bottom:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};`,
    `  transition:background-color ${v('motionDurationMid')} ${v('motionEaseInOut')};`,
    `}`,
    `${cls}-item:hover{`,
    `  background-color:${v('controlItemBgHover')};`,
    `}`,
    // ---- Group header ----
    `${cls}-group-header{`,
    `  box-sizing:border-box;`,
    `  padding:${v('paddingXS')} ${sv(p, 'item-padding-inline')};`,
    `  color:${v('colorTextDescription')};`,
    `  font-weight:${v('fontWeightStrong')};`,
    `  background-color:${v('colorBgContainer')};`,
    `  background-image:linear-gradient(${v('colorFillAlter')}, ${v('colorFillAlter')});`,
    `}`,
    `${cls}-group-header-sticky{`,
    `  position:sticky;`,
    `  top:0;`,
    `  inset-inline:0;`,
    `  z-index:1;`,
    `}`,
    `${cls}-group-header-fixed{`,
    `  position:absolute;`,
    `  top:0;`,
    `  inset-inline:0;`,
    `  transform:translateY(0);`,
    `  pointer-events:auto;`,
    `}`,
    `${cls}-group-header-holder{`,
    `  position:absolute;`,
    `  inset:0;`,
    `  overflow:hidden;`,
    `  pointer-events:none;`,
    `}`,
    // ---- Group section ----
    `${cls}-group-section{`,
    `  position:relative;`,
    `}`,
    // ---- Scrollbar（上游自绘滚动条消费；本仓原生滚动 ⇒ 死规则，见文件头差异 2） ----
    `${cls}-scrollbar{`,
    `  z-index:1;`,
    `  cursor:pointer;`,
    `}`,
    `${cls}-scrollbar:hover{`,
    `  background-color:${v('colorFillQuaternary')};`,
    `}`,
    // ---- RTL ----
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
  ].join('\n');
}

/** antd 的 `itemHeight = fontHeight + (itemPaddingBlock ?? paddingSM) * 2`（虚拟估算行高）。 */
export function itemHeightOf(token?: { fontHeight: number; paddingSM: number }): number {
  const t = token ?? getDesignToken();
  return t.fontHeight + t.paddingSM * 2;
}
