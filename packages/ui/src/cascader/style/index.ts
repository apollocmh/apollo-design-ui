/**
 * Cascader 的样式生成（genBaseStyle + columns）。
 *
 * 契约来源：antd 6.6.4 `es/cascader/style/index.js` + `es/cascader/style/columns.js`。
 *
 * ── 与 antd 产物的有意差异 ──────────────────────────────────────────────────
 * 1. 无 hash / `-css-var` 包裹类（D5）；Token 落 var() 派生。
 * 2. `resetFont: false`（上游逐字）—— 不含 fontFamily 重置；字号由
 *    `.apollo-cascader-dropdown` 继承 select 体系的 reset（本仓 select 的 dropdown
 *    已有 resetComponent 段，Cascader 复用其类名）。
 * 3. checkbox 视觉：antd 用 `getCheckboxStyle(prefixCls-checkbox)` 整套移植；
 *    本仓 Cascader 的 checkbox 只在多选出现，写**精简对齐版**（方框 + 选中 +
 *    indeterminate + disabled），像素级对齐由 L6 钉。
 * 4. genCompactItemStyle（Space Compact）暂不移植 —— 本仓 space/Compact 尚未与
 *    select 联动（analysis §5 S5 记录）。
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

  // ⚠️ 外壳全套样式：antd 的 Cascader 用 `useSelectStyle(cascaderPrefixCls)`
  //    按 cascader 前缀生成 select 全套规则（外壳边框/高度/背景/input）。
  const selectShell = genSelectStyle('apollo', p);

  return [
    selectShell,
    // =================== Control 宽度 + Token 声明 ===================
    `${root}{`,
    ...genTokenDecls(p),
    `  width:${cv(p, 'control-width')};`,
    `}`,
    // =================== Popup（dropdown 与 select-dropdown 同节点）===================
    // antd：`&${antCls}-select-dropdown{padding:0}`
    `${dropdown}.${p}-select-dropdown{`,
    `  padding:0;`,
    `}`,
    // =================== Columns（⚠️ 顶层块，与 antd getColumnsStyle 同构）===================
    // antd 的 getColumnsStyle 返回 `[${componentCls}]: {...}` —— 顶层选择器，
    // **不是** dropdown 的后代（列会渲染在 dropdown 容器之外）。
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
    // =================== RTL ===================
    `${dropdown}-rtl{`,
    `  direction:rtl;`,
    `}`,
  ].join('\n');
}
