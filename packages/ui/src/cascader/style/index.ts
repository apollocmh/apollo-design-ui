/**
 * Cascader 的样式生成（genBaseStyle + columns + panel）。
 *
 * 契约来源：antd 6.6.4 `es/cascader/style/index.js` + `style/columns.js` + `style/panel.js`。
 *
 * ── 与 antd 产物的有意差异 ──────────────────────────────────────────────────
 * 1. 无 hash / `-css-var` 包裹类（D5）；Token 落 var() 派生。
 * 2. `resetFont: false`（上游逐字）—— Cascader **自己的**样式钩子不加 fontFamily 重置；
 *    外壳的 font-family 来自 `useSelectStyle(cascaderPrefixCls)`（差异 #6）。
 * 3. checkbox 视觉：antd 用 `getCheckboxStyle(prefixCls-checkbox)` 整套移植；
 *    本仓 Cascader 的 checkbox 只在多选出现，写**精简对齐版**（方框 + 选中 +
 *    indeterminate + disabled），像素级对齐由 L6 钉。
 * 4. genCompactItemStyle（Space Compact）暂不移植 —— 本仓 space/Compact 尚未与
 *    select 联动（analysis §5 S5 记录）。
 * 5. **列规则是顶层块**（antd 把它分别嵌进 `-dropdown` 与 `-panel` 各一份）。
 *    antd 的两份内容完全相同、只是作用域不同；顶层块是两者的超集，且列只可能在
 *    这两个容器里出现 ⇒ 行为等价。好处是 `-panel` 块不必再复制一遍列规则。
 * 6. 外壳样式 = `genSelectStyle(..., '<prefix>-cascader')`（antd `useSelectStyle`
 *    同构）—— 见下方 🚨 注释，第二个参数必须是完整 cascader 前缀。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { genSelectStyle } from '../../select/style';

const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 变量名。 */
const cv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-cascader-${name})`;

/** Component Token 声明块（8 个字段）。 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  return [
    `  --${rootPrefixCls}-cascader-control-width:184px;`,
    `  --${rootPrefixCls}-cascader-control-item-width:111px;`,
    `  --${rootPrefixCls}-cascader-dropdown-height:180px;`,
    `  --${rootPrefixCls}-cascader-option-selected-bg:${v('controlItemBgActive')};`,
    `  --${rootPrefixCls}-cascader-option-selected-font-weight:${v('fontWeightStrong')};`,
    // ⚠️ optionPadding 是**派生实值**：itemPaddingVertical =
    //    round((controlHeight 32 - fontSize 14 × lineHeight 1.5714…) / 2) = 5，
    //    paddingSM = 12 ⇒ '5px 12px'。与 radio 的 preset 阴影同判（构建期求解写死）。
    `  --${rootPrefixCls}-cascader-option-padding:5px 12px;`,
    `  --${rootPrefixCls}-cascader-menu-padding:${v('paddingXXS')};`,
    `  --${rootPrefixCls}-cascader-option-selected-color:${v('colorText')};`,
  ];
}

export function genCascaderStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const root = `.${p}-cascader`;
  const dropdown = `${root}-dropdown`;
  const item = `${root}-menu-item`;
  const checkbox = `${root}-checkbox`;

  // 外壳全套样式：Cascader 的触发外壳复用 select 全套规则（边框/高度/背景/input/
  // dropdown）。⚠️ antd 是 `useSelectStyle(getPrefixCls('select'))` —— 传 **select 前缀**，
  // DOM 上 Cascader 根同时挂 `ant-select` + `ant-cascader`，外壳元素是 `ant-select-*`。
  // 本仓没有「一个组件挂两个前缀」的机制（BaseSelect 的类名全由传入 prefixCls 派生），
  // 故按 `${p}-cascader` 重生成一份 —— 声明相同、只是选择器名不同，渲染等价。
  // 🚨 第二个参数必须是**完整的 cascader 前缀**（`${p}-cascader`），不是 p 本身：
  // 传 p（= rootPrefixCls = 'apollo'）会命中 genSelectStyle 里 `prefixCls === target`
  // 的同一性短路 ⇒ rename 退化成恒等 ⇒ 产物是一份**重复的 `.apollo-select-*`**，
  // 而 `.apollo-cascader-*` 外壳一条规则都没有（页面级「无样式」的根因，
  // L6 浏览器 computed style 排查抓出）。
  const selectShell = genSelectStyle('apollo', `${p}-cascader`);

  return [
    selectShell,
    // =================== Token 声明（⚠️ 必须覆盖全部根形态）===================
    // PITFALLS 171 / D69 家族（input 三根 / image 两根 / message 两根同判）：
    // Cascader 有**三个**根形态，后两个都不在 `.apollo-cascader` 子树内 ——
    //   · `.apollo-cascader`        触发器根
    //   · `.apollo-cascader-dropdown` 浮层根（经 Portal 挂到 body，popupClassName 里
    //     只有 `-dropdown` / `-dropdown-rtl`，**没有** `-css-var` 类）
    //   · `.apollo-cascader-panel`  面板根（`CascaderPanel` 的根，也没有 `.apollo-cascader`）
    // 漏挂的后果是**静默**的：`var(--apollo-cascader-*)` 取不到值 ⇒ 该声明在
    // computed-value 期失效、退回初始值（L6 实测 panel 的列 `min-width` 从 111px
    // 缩成 43.56px、`height` 180→auto、`padding` 4px/5px 12px→0）。
    // antd 靠 `cssVarCls`（进 popupClassName 与 Panel 的 className）覆盖，本仓无该机制。
    `${root},${dropdown},${root}-panel{`,
    ...genTokenDecls(p),
    `}`,
    // =================== Control 宽度 ===================
    `${root}{`,
    `  width:${cv(p, 'control-width')};`,
    `}`,
    // =================== Popup（浮层与 select-dropdown 同节点）===================
    // antd：`&${antCls}-select-dropdown{padding:0}` —— 浮层根**同时**挂
    // `ant-select-dropdown` 与 `ant-cascader-dropdown`，靠那个复合选择器清零 padding。
    // ⚠️ 本仓浮层根只有 `{p}-cascader-dropdown`（差异 D112：没有 `-select-dropdown`
    //    那半个类名）⇒ 必须让同一条规则落到 cascader 前缀自己身上，否则浮层会保留
    //    select 壳的 `padding: var(--apollo-padding-xxs)`(4px)：
    //    实测浮层 341×188 vs antd 333×180（宽高各 +8px = 2×4px），
    //    内部所有项的 x/y 各偏 +4px（44→48）。两条都写，保留 antd 那条的字面同构。
    `${dropdown},${dropdown}.${p}-select-dropdown{`,
    `  padding:0;`,
    `}`,
    // =================== Columns（本仓取顶层块，见文件头差异 #5）===================
    // antd 的 getColumnsStyle 返回 `{[componentCls]: {...}}`，被**分别**嵌进
    // `-dropdown` 与 `-panel` 两个块各一份（⇒ `.ant-cascader-dropdown .ant-cascader-menu`
    // 与 `.ant-cascader-panel .ant-cascader-menu`）。本仓只保留一份顶层块：
    // 列只可能出现在这两个容器里，顶层块是它们的超集。
    `${checkbox}{`,
    `  top:0;`,
    `  margin-inline-end:${v('paddingXS')};`,
    `  pointer-events:unset;`,
    `  box-sizing:border-box;`,
    `  width:16px;`,
    `  height:16px;`,
    `  display:inline-block;`,
    `  position:relative;`,
    `  border:${v('lineWidth')} ${v('lineType')} ${v('colorBorder')};`,
    `  border-radius:${v('borderRadiusSM')};`,
    `  background:${v('colorBgContainer')};`,
    `  transition:all ${v('motionDurationMid')};`,
    `}`,
    `${checkbox}-checked{`,
    `  background-color:${v('colorPrimary')};`,
    `  border-color:${v('colorPrimary')};`,
    `}`,
    `${checkbox}-indeterminate{`,
    `  background-color:${v('colorPrimary')};`,
    `  border-color:${v('colorPrimary')};`,
    `}`,
    `${checkbox}-disabled{`,
    `  border-color:${v('colorBorder')};`,
    `  background-color:${v('colorBgContainerDisabled')};`,
    `}`,
    `${root}-menus{`,
    `  display:flex;`,
    `  flex-wrap:nowrap;`,
    `  align-items:flex-start;`,
    `}`,
    `${root}-menus${root}-menu-empty ${root}-menu{`,
    `  width:100%;`,
    `  height:auto;`,
    `}`,
    `${root}-menus${root}-menu-empty ${root}-menu ${item}{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${root}-menu{`,
    `  flex-grow:1;`,
    `  flex-shrink:0;`,
    `  min-width:${cv(p, 'control-item-width')};`,
    `  height:${cv(p, 'dropdown-height')};`,
    `  margin:0;`,
    `  padding:${cv(p, 'menu-padding')};`,
    `  overflow:auto;`,
    `  vertical-align:top;`,
    `  list-style:none;`,
    `}`,
    `${root}-menu:not(:last-child){`,
    `  border-inline-end:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};`,
    `}`,
    `${item}{`,
    `  display:flex;`,
    `  max-width:400px;`,
    `  flex-wrap:nowrap;`,
    `  align-items:center;`,
    `  padding:${cv(p, 'option-padding')};`,
    `  line-height:${v('lineHeight')};`,
    `  cursor:pointer;`,
    `  transition:all ${v('motionDurationMid')};`,
    `  border-radius:${v('borderRadiusSM')};`,
    `}`,
    `${item}:hover{`,
    `  background:${v('controlItemBgHover')};`,
    `}`,
    `${item}-disabled{`,
    `  color:${v('colorTextDisabled')};`,
    `  cursor:not-allowed;`,
    `}`,
    `${item}-disabled:hover{`,
    `  background:transparent;`,
    `}`,
    `${item}-disabled ${item}-expand-icon,${item}-disabled ${item}-loading-icon{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${item}-active:not(${item}-disabled),${item}-active:not(${item}-disabled):hover{`,
    `  color:${cv(p, 'option-selected-color')};`,
    `  font-weight:${cv(p, 'option-selected-font-weight')};`,
    `  background-color:${cv(p, 'option-selected-bg')};`,
    `}`,
    `${item}-content{`,
    `  flex:auto;`,
    `  min-width:0;`,
    `  overflow:hidden;`,
    `  text-overflow:ellipsis;`,
    `  white-space:nowrap;`,
    `}`,
    `${item}-expand ${item}-expand-icon,${item}-loading-icon{`,
    `  margin-inline-start:${v('paddingXXS')};`,
    `  color:${v('colorIcon')};`,
    `  font-size:${v('fontSizeIcon')};`,
    `  display:flex;`,
    `  align-items:center;`,
    `}`,
    `${item}-keyword{`,
    `  color:${v('colorHighlight')};`,
    `}`,
    // =================== Panel（antd `style/panel.js`）===================
    // `Cascader.Panel`（rc Panel：**只有列**，无 select 外壳）的独立样式钩子。
    // 列规则在本文件是顶层块（有意差异 #5），所以这里只补 panel 自己的盒子，
    // 外加对列的覆盖：menus 拉伸 / menu 高度 auto（否则会套用 dropdownHeight=180）。
    `${root}-panel{`,
    `  display:inline-flex;`,
    `  border:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};`,
    `  border-radius:${v('borderRadiusLG')};`,
    `  overflow-x:auto;`,
    `  max-width:100%;`,
    `}`,
    `${root}-panel ${root}-menus{`,
    `  align-items:stretch;`,
    `}`,
    `${root}-panel ${root}-menu{`,
    `  height:auto;`,
    `}`,
    `${root}-panel-empty{`,
    `  padding:${v('paddingXXS')};`,
    `}`,
    // =================== RTL ===================
    // ⚠️ 只对 dropdown 生成 rtl；antd 的 `style/panel.js` **没有** `-panel-rtl` 规则
    //（rc Panel 会渲染这个类，但上游没给它样式）—— 1:1 同构，不自行发明。
    `${dropdown}-rtl{`,
    `  direction:rtl;`,
    `}`,
  ].join('\n');
}
