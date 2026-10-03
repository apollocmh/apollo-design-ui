/**
 * Table 的样式生成。
 *
 * 契约来源：antd 6.6.4 `es/table/style/*.js`（真实产物用
 * `tests/visual/debug/extract-table-css.mjs` SSR 提取：**200 条规则 / 194 唯一选择器 /
 * 37 条组件 token**，T0.3 实测 —— registry 的 31 是字面键数，少了 5 个派生值 + 1 个
 * 算式值）。
 *
 * ── 移植规则（与 date-picker/style 同族） ──────────────────────────────────────
 * 1. `--{p}-table-*` 组件 token 落成**根类 + `-css-var` 类**上的局部声明块
 *    （⚠️ PITFALLS 342：过滤下拉 `.{p}-table-filter-dropdown` 走 Portal，
 *    不在 `.{p}-table` 子树里 ⇒ 只有根块的话 var 全部静默回退）。
 * 2. 组件 token 的**值**在模块加载期用 `getDesignToken()` + `onBackground` 算出并
 *    内联（D7 家族：不随运行时暗色主题自适应 —— 与 button 的 13 个阴影色同判）。
 *    两个非纯别名的 token：
 *    - `expandIconMarginTop`：算式 `(fontSize*lineHeight - lineWidth*3)/2 -
 *      ceil((fontSizeSM*1.4 - lineWidth*3)/2)`；
 *    - `headerIconColor`：`colorIcon` 的 alpha × `opacityLoading`（`Color.setAlpha`）。
 * 3. 全局别名 token 用 `v()` 引用 `--apollo-*`（B7 可校验）。
 * 4. 规则主体从真实产物机械搬运：`:where(.css-hash)` 前缀去除、`ant-table` →
 *    `{p}-table`、其余 `ant-*` → `apollo-*`（dropdown/tree/menu/descriptions 等
 *    子组件类名，本仓这些组件恒用 apollo 前缀）、`.anticon` → `.apollo-icon`。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 * - 没证明**视觉**正确（L6 的逐像素比对负责）。
 * - 没证明变量名存在（B7 负责）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';
import { onBackground } from '../../_internal/color-composite';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

// ============================ 37 条组件 token（构建期内联） ============================

const T = getDesignToken();

const FILL_ALTER_SOLID = onBackground(T.colorFillAlter, T.colorBgContainer).toHexString();
const FILL_SECONDARY_SOLID = onBackground(T.colorFillSecondary, T.colorBgContainer).toHexString();
const FILL_CONTENT_SOLID = onBackground(T.colorFillContent, T.colorBgContainer).toHexString();

const COLOR_ICON = new Color(T.colorIcon);
const COLOR_ICON_HOVER = new Color(T.colorIconHover);
const HEADER_ICON_COLOR = COLOR_ICON.setAlpha(COLOR_ICON.a * T.opacityLoading).toHexString();
const HEADER_ICON_HOVER_COLOR = COLOR_ICON_HOVER.setAlpha(
  COLOR_ICON_HOVER.a * T.opacityLoading,
).toHexString();

const HALF_INNER = T.controlInteractiveSize / 2 - T.lineWidth;
const EXPAND_ICON_SIZE = HALF_INNER * 2 + T.lineWidth * 3;
const EXPAND_ICON_SCALE = T.controlInteractiveSize / EXPAND_ICON_SIZE;
const EXPAND_ICON_MARGIN_TOP =
  (T.fontSize * T.lineHeight - T.lineWidth * 3) / 2 -
  Math.ceil((T.fontSizeSM * 1.4 - T.lineWidth * 3) / 2);

/** antd `es/table/style/index.js` 的 prepareComponentToken 映射（37 键逐字）。 */
export function genTableTokenDecls(p: string): string[] {
  const P = p;
  return [
    `--${P}-table-header-bg:${FILL_ALTER_SOLID}`,
    `--${P}-table-header-color:${v('colorTextHeading')}`,
    `--${P}-table-header-sort-active-bg:${FILL_SECONDARY_SOLID}`,
    `--${P}-table-header-sort-hover-bg:${FILL_CONTENT_SOLID}`,
    `--${P}-table-body-sort-bg:${FILL_ALTER_SOLID}`,
    `--${P}-table-row-hover-bg:${FILL_ALTER_SOLID}`,
    `--${P}-table-row-selected-bg:${v('controlItemBgActive')}`,
    `--${P}-table-row-selected-hover-bg:${v('controlItemBgActiveHover')}`,
    `--${P}-table-row-expanded-bg:${T.colorFillAlter}`,
    `--${P}-table-cell-padding-block:${v('padding')}`,
    `--${P}-table-cell-padding-inline:${v('padding')}`,
    `--${P}-table-cell-padding-block-md:${v('paddingSM')}`,
    `--${P}-table-cell-padding-inline-md:${v('paddingXS')}`,
    `--${P}-table-cell-padding-block-sm:${v('paddingXS')}`,
    `--${P}-table-cell-padding-inline-sm:${v('paddingXS')}`,
    `--${P}-table-border-color:${v('colorBorderSecondary')}`,
    `--${P}-table-header-border-radius:${v('borderRadiusLG')}`,
    `--${P}-table-footer-bg:${FILL_ALTER_SOLID}`,
    `--${P}-table-footer-color:${v('colorTextHeading')}`,
    `--${P}-table-cell-font-size:${v('fontSize')}`,
    `--${P}-table-cell-font-size-md:${v('fontSize')}`,
    `--${P}-table-cell-font-size-sm:${v('fontSize')}`,
    `--${P}-table-header-split-color:${v('colorBorderSecondary')}`,
    `--${P}-table-fixed-header-sort-active-bg:${FILL_SECONDARY_SOLID}`,
    `--${P}-table-header-filter-hover-bg:${T.colorFillContent}`,
    `--${P}-table-filter-dropdown-menu-bg:${v('colorBgContainer')}`,
    `--${P}-table-filter-dropdown-bg:${v('colorBgContainer')}`,
    `--${P}-table-expand-icon-bg:${v('colorBgContainer')}`,
    `--${P}-table-selection-column-width:${v('controlHeight')}`,
    `--${P}-table-sticky-scroll-bar-bg:${v('colorTextPlaceholder')}`,
    `--${P}-table-sticky-scroll-bar-border-radius:100px`,
    `--${P}-table-expand-icon-margin-top:${EXPAND_ICON_MARGIN_TOP}px`,
    `--${P}-table-header-icon-color:${HEADER_ICON_COLOR}`,
    `--${P}-table-header-icon-hover-color:${HEADER_ICON_HOVER_COLOR}`,
    `--${P}-table-expand-icon-half-inner:${HALF_INNER}px`,
    `--${P}-table-expand-icon-size:${EXPAND_ICON_SIZE}px`,
    `--${P}-table-expand-icon-scale:${EXPAND_ICON_SCALE}`,
    // ── 派生 token（antd 规则侧的固定几何值，升级为声明以过 E10；值与产物逐字）──
    `--${P}-table-cell-fix-start-shadow:inset 10px 0 8px -8px ${v('colorSplit')}`,
    `--${P}-table-cell-fix-end-shadow:inset -10px 0 8px -8px ${v('colorSplit')}`,
    `--${P}-table-filter-dropdown-menu-radius:unset`,
  ];
}

/**
 * 生成 Table 的静态 CSS。
 *
 * @param p 类名前缀基（`apollo`；组件类 = `${p}-table`）
 */
export function genTableStyle(p: string): string {
  const decls = genTableTokenDecls(p).join(';');
  const declBlock = `.${p}-table,.${p}-table-css-var{${decls}}\n\n`;
  const rules = [
    `.${p}-table-wrapper{clear:both;max-width:100%;--apollo-virtual-list-scrollbar-bg:${v('colorSplit')};}`,
    `.${p}-table-wrapper::before{display:table;content:"";}`,
    `.${p}-table-wrapper::after{display:table;clear:both;content:"";}`,
    `.${p}-table-wrapper .${p}-table{box-sizing:border-box;margin:0;padding:0;color:${v('colorText')};font-size:var(--${p}-table-cell-font-size);line-height:${v('lineHeight')};list-style:none;font-family:${v('fontFamily')};background:${v('colorBgContainer')};border-radius:var(--${p}-table-header-border-radius) var(--${p}-table-header-border-radius) 0 0;scrollbar-color:var(--${p}-table-sticky-scroll-bar-bg) ${v('colorSplit')};}`,
    `.${p}-table-wrapper table{width:100%;text-align:start;border-radius:var(--${p}-table-header-border-radius) var(--${p}-table-header-border-radius) 0 0;border-collapse:separate;border-spacing:0;}`,
    `.${p}-table-wrapper .${p}-table-cell,.${p}-table-wrapper .${p}-table-thead>tr>th,.${p}-table-wrapper .${p}-table-tbody>tr>th,.${p}-table-wrapper .${p}-table-tbody>tr>td,.${p}-table-wrapper tfoot>tr>th,.${p}-table-wrapper tfoot>tr>td{position:relative;padding:var(--${p}-table-cell-padding-block) var(--${p}-table-cell-padding-inline);overflow-wrap:break-word;}`,
    `.${p}-table-wrapper .${p}-table-title{padding:var(--${p}-table-cell-padding-block) var(--${p}-table-cell-padding-inline);}`,
    `.${p}-table-wrapper .${p}-table-thead >tr>th,.${p}-table-wrapper .${p}-table-thead >tr>td{position:relative;color:var(--${p}-table-header-color);font-weight:${v('fontWeightStrong')};text-align:start;background:var(--${p}-table-header-bg);border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);transition:background-color ${v('motionDurationMid')} ease;}`,
    `.${p}-table-wrapper .${p}-table-thead >tr>th[colspan]:not([colspan='1']),.${p}-table-wrapper .${p}-table-thead >tr>td[colspan]:not([colspan='1']){text-align:center;}`,
    `.${p}-table-wrapper .${p}-table-thead >tr>th:not(:last-child):not(.${p}-table-selection-column):not(.${p}-table-row-expand-icon-cell):not([colspan])::before,.${p}-table-wrapper .${p}-table-thead >tr>td:not(:last-child):not(.${p}-table-selection-column):not(.${p}-table-row-expand-icon-cell):not([colspan])::before{position:absolute;top:50%;inset-inline-end:0;width:1px;height:1.6em;background-color:var(--${p}-table-header-split-color);transform:translateY(-50%);transition:background-color ${v('motionDurationMid')};content:"";}`,
    `.${p}-table-wrapper .${p}-table-thead >tr:not(:last-child)>th[colspan]{border-bottom:0;}`,
    `.${p}-table-wrapper .${p}-table-tbody >tr >th,.${p}-table-wrapper .${p}-table-tbody >tr >td{border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);transition:background-color ${v('motionDurationMid')},border-color ${v('motionDurationMid')};}`,
    `.${p}-table-wrapper .${p}-table-tbody >tr >th >.${p}-table-wrapper:only-child .${p}-table,.${p}-table-wrapper .${p}-table-tbody >tr >td >.${p}-table-wrapper:only-child .${p}-table,.${p}-table-wrapper .${p}-table-tbody >tr >th >.${p}-table-expanded-row-fixed>.${p}-table-wrapper:only-child .${p}-table,.${p}-table-wrapper .${p}-table-tbody >tr >td >.${p}-table-expanded-row-fixed>.${p}-table-wrapper:only-child .${p}-table{margin-block:calc(var(--${p}-table-cell-padding-block) * -1);margin-inline:calc(calc(${v('controlInteractiveSize')} + ${v('padding')} * 2) - var(--${p}-table-cell-padding-inline)) calc(var(--${p}-table-cell-padding-inline) * -1);}`,
    `.${p}-table-wrapper .${p}-table-tbody >tr >th >.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td,.${p}-table-wrapper .${p}-table-tbody >tr >td >.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td,.${p}-table-wrapper .${p}-table-tbody >tr >th >.${p}-table-expanded-row-fixed>.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td,.${p}-table-wrapper .${p}-table-tbody >tr >td >.${p}-table-expanded-row-fixed>.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td{border-bottom-width:0;}`,
    `.${p}-table-wrapper .${p}-table-tbody >tr >th >.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td:first-child,.${p}-table-wrapper .${p}-table-tbody >tr >td >.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td:first-child,.${p}-table-wrapper .${p}-table-tbody >tr >th >.${p}-table-expanded-row-fixed>.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td:first-child,.${p}-table-wrapper .${p}-table-tbody >tr >td >.${p}-table-expanded-row-fixed>.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td:first-child,.${p}-table-wrapper .${p}-table-tbody >tr >th >.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td:last-child,.${p}-table-wrapper .${p}-table-tbody >tr >td >.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td:last-child,.${p}-table-wrapper .${p}-table-tbody >tr >th >.${p}-table-expanded-row-fixed>.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td:last-child,.${p}-table-wrapper .${p}-table-tbody >tr >td >.${p}-table-expanded-row-fixed>.${p}-table-wrapper:only-child .${p}-table .${p}-table-tbody>tr:last-child>td:last-child{border-radius:0;}`,
    `.${p}-table-wrapper .${p}-table-tbody >tr >th{position:relative;color:var(--${p}-table-header-color);font-weight:${v('fontWeightStrong')};text-align:start;background:var(--${p}-table-header-bg);border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);transition:background-color ${v('motionDurationMid')} ease;}`,
    `.${p}-table-wrapper .${p}-table-tbody >tr>.${p}-table-measure-cell{padding-block:0!important;border-block:0!important;}`,
    `.${p}-table-wrapper .${p}-table-tbody >tr>.${p}-table-measure-cell .${p}-table-measure-cell-content{height:0;overflow:hidden;pointer-events:none;}`,
    `.${p}-table-wrapper .${p}-table-footer{padding:var(--${p}-table-cell-padding-block) var(--${p}-table-cell-padding-inline);color:var(--${p}-table-footer-color);background:var(--${p}-table-footer-bg);}`,
    `.${p}-table-wrapper .${p}-table-pagination.apollo-pagination{margin:${v('margin')} 0;}`,
    `.${p}-table-wrapper .${p}-table-pagination{display:flex;flex-wrap:wrap;row-gap:${v('paddingXs')};}`,
    `.${p}-table-wrapper .${p}-table-pagination >*{flex:none;}`,
    `.${p}-table-wrapper .${p}-table-pagination-start{justify-content:flex-start;}`,
    `.${p}-table-wrapper .${p}-table-pagination-center{justify-content:center;}`,
    `.${p}-table-wrapper .${p}-table-pagination-end{justify-content:flex-end;}`,
    `.${p}-table-wrapper .${p}-table-summary{position:relative;z-index:2;background:${v('colorBgContainer')};}`,
    `.${p}-table-wrapper .${p}-table-summary >tr >th,.${p}-table-wrapper .${p}-table-summary >tr >td{border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper div.${p}-table-summary{box-shadow:0 calc(${v('lineWidth')} * -1) 0 var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table-thead th.${p}-table-column-has-sorters{outline:none;cursor:pointer;transition:all ${v('motionDurationSlow')},left 0s;}`,
    `.${p}-table-wrapper .${p}-table-thead th.${p}-table-column-has-sorters:hover{background:var(--${p}-table-header-sort-hover-bg);}`,
    `.${p}-table-wrapper .${p}-table-thead th.${p}-table-column-has-sorters:hover::before{background-color:transparent!important;}`,
    `.${p}-table-wrapper .${p}-table-thead th.${p}-table-column-has-sorters:focus-visible{color:${v('colorPrimary')};}`,
    `.${p}-table-wrapper .${p}-table-thead th.${p}-table-column-has-sorters.${p}-table-cell-fix-left:hover,.${p}-table-wrapper .${p}-table-thead th.${p}-table-column-has-sorters.${p}-table-cell-fix-right:hover{background:var(--${p}-table-fixed-header-sort-active-bg);}`,
    `.${p}-table-wrapper .${p}-table-thead th.${p}-table-column-sort{background:var(--${p}-table-header-sort-active-bg);}`,
    `.${p}-table-wrapper .${p}-table-thead th.${p}-table-column-sort::before{background-color:transparent!important;}`,
    `.${p}-table-wrapper td.${p}-table-column-sort{background:var(--${p}-table-body-sort-bg);}`,
    `.${p}-table-wrapper .${p}-table-column-title{position:relative;z-index:1;flex:1;min-width:0;}`,
    `.${p}-table-wrapper .${p}-table-column-sorters{display:flex;flex:auto;align-items:center;justify-content:space-between;}`,
    `.${p}-table-wrapper .${p}-table-column-sorters::after{position:absolute;inset:0;width:100%;height:100%;content:"";}`,
    `.${p}-table-wrapper .${p}-table-column-sorters-tooltip-target-sorter::after{content:none;}`,
    `.${p}-table-wrapper .${p}-table-column-sorter{margin-inline-start:${v('marginXxs')};color:var(--${p}-table-header-icon-color);font-size:0;transition:color ${v('motionDurationSlow')};}`,
    `.${p}-table-wrapper .${p}-table-column-sorter-inner{display:inline-flex;flex-direction:column;align-items:center;}`,
    `.${p}-table-wrapper .${p}-table-column-sorter-up,.${p}-table-wrapper .${p}-table-column-sorter-down{font-size:${v('fontSizeIcon')};}`,
    `.${p}-table-wrapper .${p}-table-column-sorter-up.active,.${p}-table-wrapper .${p}-table-column-sorter-down.active{color:${v('colorPrimary')};}`,
    `.${p}-table-wrapper .${p}-table-column-sorter .${p}-table-column-sorter-up+.${p}-table-column-sorter-down{margin-top:-0.3em;}`,
    `.${p}-table-wrapper .${p}-table-column-sorters:hover .${p}-table-column-sorter{color:var(--${p}-table-header-icon-hover-color);}`,
    `.${p}-table-wrapper .${p}-table-filter-column{display:flex;justify-content:space-between;}`,
    `.${p}-table-wrapper .${p}-table-filter-trigger{position:relative;display:flex;align-items:center;margin-block:calc(${v('paddingXxs')} * -1);margin-inline:${v('paddingXxs')} calc(var(--${p}-table-cell-padding-inline) / 2 * -1);padding:0 ${v('paddingXxs')};color:var(--${p}-table-header-icon-color);font-size:${v('fontSizeSm')};border-radius:${v('borderRadius')};cursor:pointer;transition:all ${v('motionDurationSlow')};}`,
    `.${p}-table-wrapper .${p}-table-filter-trigger:hover{color:${v('colorIcon')};background:var(--${p}-table-header-filter-hover-bg);}`,
    `.${p}-table-wrapper .${p}-table-filter-trigger.active{color:${v('colorPrimary')};}`,
    `.apollo-dropdown .${p}-table-filter-dropdown{box-sizing:border-box;margin:0;padding:0;color:${v('colorText')};font-size:${v('fontSize')};line-height:${v('lineHeight')};list-style:none;font-family:${v('fontFamily')};min-width:120px;background-color:var(--${p}-table-filter-dropdown-bg);border-radius:${v('borderRadius')};box-shadow:${v('boxShadowSecondary')};overflow:hidden;}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .apollo-dropdown-menu{max-height:264px;overflow-x:hidden;border:0;box-shadow:none;border-radius:var(--${p}-table-filter-dropdown-menu-radius);background-color:var(--${p}-table-filter-dropdown-menu-bg);}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .apollo-dropdown-menu:empty::after{display:block;padding:${v('paddingXs')} 0;color:${v('colorTextDisabled')};font-size:${v('fontSizeSm')};text-align:center;content:"Not Found";}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-tree{padding-block:${v('paddingXs')} 0;padding-inline:${v('paddingXs')};}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-tree .apollo-tree{padding:0;}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-tree .apollo-tree-treenode .apollo-tree-node-content-wrapper:hover{background-color:${v('controlItemBgHover')};}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-tree .apollo-tree-treenode-checkbox-checked .apollo-tree-node-content-wrapper,.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-tree .apollo-tree-treenode-checkbox-checked .apollo-tree-node-content-wrapper:hover{background-color:${v('controlItemBgActive')};}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-search{padding:${v('paddingXs')};border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-search-input input{min-width:140px;}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-search-input .apollo-icon{color:${v('colorTextDisabled')};}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-checkall{width:100%;margin-bottom:${v('paddingXxs')};margin-inline-start:${v('paddingXxs')};}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .${p}-table-filter-dropdown-btns{display:flex;justify-content:space-between;padding:calc(${v('paddingXs')} - ${v('lineWidth')}) ${v('paddingXs')};overflow:hidden;border-top:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.apollo-dropdown .${p}-table-filter-dropdown .apollo-checkbox-wrapper+span,.${p}-table-filter-dropdown-submenu .apollo-checkbox-wrapper+span{padding-inline-start:${v('paddingXs')};color:${v('colorText')};}`,
    `.apollo-dropdown .${p}-table-filter-dropdown >ul,.${p}-table-filter-dropdown-submenu >ul{max-height:calc(100vh - 130px);overflow-x:hidden;overflow-y:auto;}`,
    `.${p}-table-wrapper{--${p}-table-nested-border-top:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-title{border:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);border-bottom:0;}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container{border-inline-start:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);border-top:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container:first-child{border-top:var(--${p}-table-nested-border-top, ${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color));}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header.${p}-table-sticky-holder{margin-top:calc(${v('lineWidth')} * -1);border-top:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >thead>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >thead>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >thead>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >thead>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >thead>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >thead>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >thead>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >thead>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tbody>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tbody>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tbody>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tbody>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tbody>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tbody>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tbody>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tbody>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tfoot>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tfoot>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tfoot>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tfoot>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tfoot>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tfoot>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tfoot>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tfoot>tr>td{border-inline-end:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >thead >tr:not(:last-child)>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >thead >tr:not(:last-child)>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >thead >tr:not(:last-child)>th,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >thead >tr:not(:last-child)>th{border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >thead >tr>th::before,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >thead >tr>th::before,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >thead >tr>th::before,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >thead >tr>th::before{background-color:transparent!important;}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >thead>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >thead>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >thead>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >thead>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tbody>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tbody>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tbody>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tbody>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tfoot>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tfoot>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tfoot>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tfoot>tr >.${p}-table-cell-fix-right-first:not(.${p}-table-cell-fix-right-last)::after{border-inline-end:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tbody>tr>th >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tbody>tr>th >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tbody>tr>th >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tbody>tr>th >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tbody>tr>td >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tbody>tr>td >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tbody>tr>td >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tbody>tr>td >.${p}-table-expanded-row-fixed{margin:calc(var(--${p}-table-cell-padding-block) * -1) calc((var(--${p}-table-cell-padding-inline) + ${v('lineWidth')}) * -1);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tbody>tr>th >.${p}-table-expanded-row-fixed::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tbody>tr>th >.${p}-table-expanded-row-fixed::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tbody>tr>th >.${p}-table-expanded-row-fixed::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tbody>tr>th >.${p}-table-expanded-row-fixed::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-content >table >tbody>tr>td >.${p}-table-expanded-row-fixed::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-header >table >tbody>tr>td >.${p}-table-expanded-row-fixed::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-body >table >tbody>tr>td >.${p}-table-expanded-row-fixed::after,.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-container >.${p}-table-summary >table >tbody>tr>td >.${p}-table-expanded-row-fixed::after{position:absolute;top:0;inset-inline-end:${v('lineWidth')};bottom:0;border-inline-end:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);content:"";}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-scroll-horizontal >.${p}-table-container>.${p}-table-body >table>tbody >tr.${p}-table-expanded-row >th,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-scroll-horizontal >.${p}-table-container>.${p}-table-body >table>tbody >tr.${p}-table-placeholder >th,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-scroll-horizontal >.${p}-table-container>.${p}-table-body >table>tbody >tr.${p}-table-expanded-row >td,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-scroll-horizontal >.${p}-table-container>.${p}-table-body >table>tbody >tr.${p}-table-placeholder >td{border-inline-end:0;}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-medium >.${p}-table-container >.${p}-table-content >table>tbody>tr>th >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-medium >.${p}-table-container >.${p}-table-body >table>tbody>tr>th >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-medium >.${p}-table-container >.${p}-table-content >table>tbody>tr>td >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-medium >.${p}-table-container >.${p}-table-body >table>tbody>tr>td >.${p}-table-expanded-row-fixed{margin:calc(var(--${p}-table-cell-padding-block-md) * -1) calc((var(--${p}-table-cell-padding-inline-md) + ${v('lineWidth')}) * -1);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-small >.${p}-table-container >.${p}-table-content >table>tbody>tr>th >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-small >.${p}-table-container >.${p}-table-body >table>tbody>tr>th >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-small >.${p}-table-container >.${p}-table-content >table>tbody>tr>td >.${p}-table-expanded-row-fixed,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-small >.${p}-table-container >.${p}-table-body >table>tbody>tr>td >.${p}-table-expanded-row-fixed{margin:calc(var(--${p}-table-cell-padding-block-sm) * -1) calc((var(--${p}-table-cell-padding-inline-sm) + ${v('lineWidth')}) * -1);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered >.${p}-table-footer{border:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);border-top:0;}`,
    `.${p}-table-wrapper .${p}-table-cell >.${p}-table-wrapper:only-child,.${p}-table-wrapper .${p}-table-cell >.${p}-table-expanded-row-fixed>.${p}-table-wrapper:only-child{--${p}-table-nested-border-top:0;}`,
    `.${p}-table-wrapper .${p}-table-cell-scrollbar:not([rowspan]){box-shadow:0 ${v('lineWidth')} 0 ${v('lineWidth')} var(--${p}-table-header-bg);}`,
    `.${p}-table-wrapper .${p}-table-bordered .${p}-table-cell-scrollbar{border-inline-end:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table .${p}-table-title,.${p}-table-wrapper .${p}-table .${p}-table-header{border-radius:var(--${p}-table-header-border-radius) var(--${p}-table-header-border-radius) 0 0;}`,
    `.${p}-table-wrapper .${p}-table .${p}-table-title+.${p}-table-container{border-start-start-radius:0;border-start-end-radius:0;}`,
    `.${p}-table-wrapper .${p}-table .${p}-table-title+.${p}-table-container .${p}-table-header,.${p}-table-wrapper .${p}-table .${p}-table-title+.${p}-table-container table{border-radius:0;}`,
    `.${p}-table-wrapper .${p}-table .${p}-table-title+.${p}-table-container table>thead>tr:first-child th:first-child,.${p}-table-wrapper .${p}-table .${p}-table-title+.${p}-table-container table>thead>tr:first-child th:last-child,.${p}-table-wrapper .${p}-table .${p}-table-title+.${p}-table-container table>thead>tr:first-child td:first-child,.${p}-table-wrapper .${p}-table .${p}-table-title+.${p}-table-container table>thead>tr:first-child td:last-child{border-radius:0;}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-no-header >.${p}-table-container >.${p}-table-content >table>tbody>tr:first-child >*:first-child,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-no-header >.${p}-table-container >.${p}-table-body >table>tbody>tr:first-child >*:first-child{border-start-start-radius:var(--${p}-table-header-border-radius);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-no-header >.${p}-table-container >.${p}-table-content >table>tbody>tr:first-child >*:last-child,.${p}-table-wrapper .${p}-table.${p}-table-bordered.${p}-table-no-header >.${p}-table-container >.${p}-table-body >table>tbody>tr:first-child >*:last-child{border-start-end-radius:var(--${p}-table-header-border-radius);}`,
    `.${p}-table-wrapper .${p}-table-container{border-start-start-radius:var(--${p}-table-header-border-radius);border-start-end-radius:var(--${p}-table-header-border-radius);}`,
    `.${p}-table-wrapper .${p}-table-container::before{border-start-start-radius:var(--${p}-table-header-border-radius);}`,
    `.${p}-table-wrapper .${p}-table-container::after{border-start-end-radius:var(--${p}-table-header-border-radius);}`,
    `.${p}-table-wrapper .${p}-table-container >.${p}-table-content{border-start-start-radius:var(--${p}-table-header-border-radius);border-start-end-radius:var(--${p}-table-header-border-radius);}`,
    `.${p}-table-wrapper .${p}-table-container table>thead>tr:first-child >*:first-child{border-start-start-radius:var(--${p}-table-header-border-radius);}`,
    `.${p}-table-wrapper .${p}-table-container table>thead>tr:first-child >*:last-child{border-start-end-radius:var(--${p}-table-header-border-radius);}`,
    `.${p}-table-wrapper .${p}-table-footer{border-radius:0 0 var(--${p}-table-header-border-radius) var(--${p}-table-header-border-radius);}`,
    `.${p}-table-wrapper .${p}-table-expand-icon-col{width:calc(${v('controlInteractiveSize')} + ${v('padding')} * 2);}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon-cell{text-align:center;}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon-cell .${p}-table-row-expand-icon{display:inline-flex;float:none;vertical-align:sub;}`,
    `.${p}-table-wrapper .${p}-table-row-indent{height:1px;float:left;}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon{color:inherit;text-decoration:${v('linkDecoration')};outline:none;cursor:pointer;transition:all ${v('motionDurationSlow')};border:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);padding:0;background:var(--${p}-table-expand-icon-bg);user-select:none;position:relative;float:left;width:var(--${p}-table-expand-icon-size);height:var(--${p}-table-expand-icon-size);line-height:var(--${p}-table-expand-icon-size);border-radius:${v('borderRadius')};transform:scale(var(--${p}-table-expand-icon-scale));}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon:focus-visible{outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};outline-offset:1px;transition:outline-offset 0s,outline 0s;}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon:hover{color:${v('colorLinkHover')};text-decoration:${v('linkHoverDecoration')};}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon:focus{color:${v('colorLinkHover')};text-decoration:${v('linkFocusDecoration')};}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon:active{color:${v('colorLinkActive')};text-decoration:${v('linkHoverDecoration')};}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon:focus,.${p}-table-wrapper .${p}-table-row-expand-icon:hover,.${p}-table-wrapper .${p}-table-row-expand-icon:active{border-color:currentcolor;}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon::before,.${p}-table-wrapper .${p}-table-row-expand-icon::after{position:absolute;background:currentcolor;transition:transform ${v('motionDurationSlow')} ease-out;content:"";}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon::before{top:var(--${p}-table-expand-icon-half-inner);inset-inline-end:calc(${v('paddingXxs')} - ${v('lineWidth')});inset-inline-start:calc(${v('paddingXxs')} - ${v('lineWidth')});height:${v('lineWidth')};}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon::after{top:calc(${v('paddingXxs')} - ${v('lineWidth')});bottom:calc(${v('paddingXxs')} - ${v('lineWidth')});inset-inline-start:var(--${p}-table-expand-icon-half-inner);width:${v('lineWidth')};transform:rotate(90deg);}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon-collapsed::before{transform:rotate(-180deg);}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon-collapsed::after{transform:rotate(0deg);}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon-spaced{background:transparent;border:0;visibility:hidden;}`,
    `.${p}-table-wrapper .${p}-table-row-expand-icon-spaced::before,.${p}-table-wrapper .${p}-table-row-expand-icon-spaced::after{display:none;content:none;}`,
    `.${p}-table-wrapper .${p}-table-row-indent+.${p}-table-row-expand-icon{margin-top:var(--${p}-table-expand-icon-margin-top);margin-inline-end:${v('paddingXs')};}`,
    `.${p}-table-wrapper tr.${p}-table-expanded-row >th,.${p}-table-wrapper tr.${p}-table-expanded-row:hover >th,.${p}-table-wrapper tr.${p}-table-expanded-row >td,.${p}-table-wrapper tr.${p}-table-expanded-row:hover >td{background:var(--${p}-table-row-expanded-bg);}`,
    `.${p}-table-wrapper tr.${p}-table-expanded-row .apollo-descriptions-view{display:flex;}`,
    `.${p}-table-wrapper tr.${p}-table-expanded-row .apollo-descriptions-view table{flex:auto;width:100%;}`,
    `.${p}-table-wrapper .${p}-table-expanded-row-fixed{position:relative;margin:calc(var(--${p}-table-cell-padding-block) * -1) calc(var(--${p}-table-cell-padding-inline) * -1);padding:var(--${p}-table-cell-padding-block) var(--${p}-table-cell-padding-inline);}`,
    `.${p}-table-wrapper .${p}-table-summary{position:relative;z-index:2;background:${v('colorBgContainer')};}`,
    `.${p}-table-wrapper .${p}-table-summary >tr >th,.${p}-table-wrapper .${p}-table-summary >tr >td{border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper div.${p}-table-summary{box-shadow:0 calc(${v('lineWidth')} * -1) 0 var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table-tbody>tr.${p}-table-placeholder{text-align:center;color:${v('colorTextDisabled')};}`,
    `.${p}-table-wrapper .${p}-table-tbody>tr.${p}-table-placeholder:hover>th,.${p}-table-wrapper .${p}-table-tbody>tr.${p}-table-placeholder:hover>td{background:${v('colorBgContainer')};}`,
    `.${p}-table-wrapper .${p}-table-selection-col{width:var(--${p}-table-selection-column-width);}`,
    `.${p}-table-wrapper .${p}-table-selection-col.${p}-table-selection-col-with-dropdown{width:calc(var(--${p}-table-selection-column-width) + ${v('fontSizeIcon')} + ${v('padding')} / 4);}`,
    `.${p}-table-wrapper .${p}-table-bordered .${p}-table-selection-col{width:calc(var(--${p}-table-selection-column-width) + ${v('paddingXs')} * 2);}`,
    `.${p}-table-wrapper .${p}-table-bordered .${p}-table-selection-col.${p}-table-selection-col-with-dropdown{width:calc(var(--${p}-table-selection-column-width) + ${v('fontSizeIcon')} + ${v('padding')} / 4 + ${v('paddingXs')} * 2);}`,
    `.${p}-table-wrapper table tr th.${p}-table-selection-column,.${p}-table-wrapper table tr td.${p}-table-selection-column,.${p}-table-wrapper .${p}-table-selection-column{padding-inline-end:${v('paddingXs')};padding-inline-start:${v('paddingXs')};text-align:center;}`,
    `.${p}-table-wrapper table tr th.${p}-table-selection-column .apollo-radio-wrapper,.${p}-table-wrapper table tr td.${p}-table-selection-column .apollo-radio-wrapper,.${p}-table-wrapper .${p}-table-selection-column .apollo-radio-wrapper{margin-inline-end:0;}`,
    `.${p}-table-wrapper table tr th.${p}-table-selection-column.${p}-table-cell-fix-left{z-index:calc(2 + 1);}`,
    `.${p}-table-wrapper table tr th.${p}-table-selection-column::after{background-color:transparent!important;}`,
    `.${p}-table-wrapper .${p}-table-selection{position:relative;display:inline-flex;flex-direction:column;}`,
    `.${p}-table-wrapper .${p}-table-selection-extra{position:absolute;top:0;z-index:1;cursor:pointer;transition:all ${v('motionDurationSlow')};margin-inline-start:100%;padding-inline-start:calc(var(--${p}-table-cell-padding-inline) / 4);}`,
    `.${p}-table-wrapper .${p}-table-selection-extra .apollo-icon{color:var(--${p}-table-header-icon-color);font-size:${v('fontSizeIcon')};vertical-align:baseline;}`,
    `.${p}-table-wrapper .${p}-table-selection-extra .apollo-icon:hover{color:var(--${p}-table-header-icon-hover-color);}`,
    `.${p}-table-wrapper .${p}-table-tbody .${p}-table-row.${p}-table-row-selected >.${p}-table-cell{background:var(--${p}-table-row-selected-bg);}`,
    `.${p}-table-wrapper .${p}-table-tbody .${p}-table-row.${p}-table-row-selected >.${p}-table-cell-row-hover{background:var(--${p}-table-row-selected-hover-bg);}`,
    `.${p}-table-wrapper .${p}-table-tbody .${p}-table-row >.${p}-table-cell-row-hover{background:var(--${p}-table-row-hover-bg);}`,
    `.${p}-table-wrapper .${p}-table-cell.${p}-table-cell-fix{position:sticky;}`,
    `.${p}-table-wrapper .${p}-table-cell-fix{z-index:calc(var(--z-offset-reverse) + 2);background:${v('colorBgContainer')};}`,
    `.${p}-table-wrapper .${p}-table-cell-fix:after{position:absolute;top:0;bottom:calc(${v('lineWidth')} * -1);width:30px;transition:box-shadow ${v('motionDurationSlow')};content:"";pointer-events:none;}`,
    `.${p}-table-wrapper .${p}-table-cell-fix-start:after{inset-inline-start:100%;}`,
    `.${p}-table-wrapper .${p}-table-cell-fix-end:after{inset-inline-end:100%;}`,
    `.${p}-table-wrapper .${p}-table-cell-fix-start-shadow-show:after{box-shadow:var(--${p}-table-cell-fix-start-shadow);}`,
    `.${p}-table-wrapper .${p}-table-cell-fix-end-shadow-show:after{box-shadow:var(--${p}-table-cell-fix-end-shadow);}`,
    `.${p}-table-wrapper .${p}-table-container{position:relative;}`,
    `.${p}-table-wrapper .${p}-table-container:before,.${p}-table-wrapper .${p}-table-container:after{position:absolute;top:0;bottom:calc(${v('lineWidth')} * -1);width:30px;transition:box-shadow ${v('motionDurationSlow')};content:"";pointer-events:none;z-index:calc(var(--columns-count) * 2 + 2 + 1);}`,
    `.${p}-table-wrapper .${p}-table-container:before{inset-inline-start:0;}`,
    `.${p}-table-wrapper .${p}-table-container:after{inset-inline-end:0;}`,
    `.${p}-table-wrapper .${p}-table-has-fix-start .${p}-table-container:before{display:none;}`,
    `.${p}-table-wrapper .${p}-table-has-fix-end .${p}-table-container:after{display:none;}`,
    `.${p}-table-wrapper .${p}-table-fix-start-shadow-show .${p}-table-container:before{box-shadow:var(--${p}-table-cell-fix-start-shadow);}`,
    `.${p}-table-wrapper .${p}-table-fix-end-shadow-show .${p}-table-container:after{box-shadow:var(--${p}-table-cell-fix-end-shadow);}`,
    `.${p}-table-wrapper .${p}-table-sticky-holder{position:sticky;z-index:calc(var(--columns-count) * 2 + 2 + 1);background:${v('colorBgContainer')};}`,
    `.${p}-table-wrapper .${p}-table-sticky-scroll{position:sticky;bottom:0;height:8px!important;z-index:calc(var(--columns-count) * 2 + 2 + 1);display:flex;align-items:center;background:${v('colorSplit')};border-top:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);opacity:${v('opacityLoading')};}`,
    `.${p}-table-wrapper .${p}-table-sticky-scroll:hover{transform-origin:center bottom;}`,
    `.${p}-table-wrapper .${p}-table-sticky-scroll-bar{height:8px;background-color:var(--${p}-table-sticky-scroll-bar-bg);border-radius:var(--${p}-table-sticky-scroll-bar-border-radius);transition:all ${v('motionDurationSlow')},transform 0s;position:absolute;bottom:0;}`,
    `.${p}-table-wrapper .${p}-table-sticky-scroll-bar:hover,.${p}-table-wrapper .${p}-table-sticky-scroll-bar-active{background-color:${v('colorTextHeading')};}`,
    `.${p}-table-wrapper .${p}-table-cell-ellipsis{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;word-break:keep-all;}`,
    `.${p}-table-wrapper .${p}-table-cell-ellipsis.${p}-table-cell-fix-start-shadow,.${p}-table-wrapper .${p}-table-cell-ellipsis.${p}-table-cell-fix-end-shadow{overflow:visible;}`,
    `.${p}-table-wrapper .${p}-table-cell-ellipsis.${p}-table-cell-fix-start-shadow .${p}-table-cell-content,.${p}-table-wrapper .${p}-table-cell-ellipsis.${p}-table-cell-fix-end-shadow .${p}-table-cell-content{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:block;}`,
    `.${p}-table-wrapper .${p}-table-cell-ellipsis .${p}-table-column-title{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;word-break:keep-all;}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-medium{font-size:var(--${p}-table-cell-font-size-md);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-title,.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-footer,.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-cell,.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-thead>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-tbody>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-tbody>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-medium tfoot>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-medium tfoot>tr>td{padding:var(--${p}-table-cell-padding-block-md) var(--${p}-table-cell-padding-inline-md);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-filter-trigger{margin-inline-end:calc(var(--${p}-table-cell-padding-inline-md) / 2 * -1);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-expanded-row-fixed{margin:calc(var(--${p}-table-cell-padding-block-md) * -1) calc(var(--${p}-table-cell-padding-inline-md) * -1);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-tbody .${p}-table-wrapper:only-child .${p}-table{margin-block:calc(var(--${p}-table-cell-padding-block-md) * -1);margin-inline:calc(calc(${v('controlInteractiveSize')} + ${v('padding')} * 2) - var(--${p}-table-cell-padding-inline-md)) calc(var(--${p}-table-cell-padding-inline-md) * -1);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-medium .${p}-table-selection-extra{padding-inline-start:calc(var(--${p}-table-cell-padding-inline-md) / 4);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-small{font-size:var(--${p}-table-cell-font-size-sm);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-title,.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-footer,.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-cell,.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-thead>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-tbody>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-tbody>tr>td,.${p}-table-wrapper .${p}-table.${p}-table-small tfoot>tr>th,.${p}-table-wrapper .${p}-table.${p}-table-small tfoot>tr>td{padding:var(--${p}-table-cell-padding-block-sm) var(--${p}-table-cell-padding-inline-sm);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-filter-trigger{margin-inline-end:calc(var(--${p}-table-cell-padding-inline-sm) / 2 * -1);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-expanded-row-fixed{margin:calc(var(--${p}-table-cell-padding-block-sm) * -1) calc(var(--${p}-table-cell-padding-inline-sm) * -1);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-tbody .${p}-table-wrapper:only-child .${p}-table{margin-block:calc(var(--${p}-table-cell-padding-block-sm) * -1);margin-inline:calc(calc(${v('controlInteractiveSize')} + ${v('padding')} * 2) - var(--${p}-table-cell-padding-inline-sm)) calc(var(--${p}-table-cell-padding-inline-sm) * -1);}`,
    `.${p}-table-wrapper .${p}-table.${p}-table-small .${p}-table-selection-extra{padding-inline-start:calc(var(--${p}-table-cell-padding-inline-sm) / 4);}`,
    `.${p}-table-wrapper-rtl{direction:rtl;}`,
    `.${p}-table-wrapper-rtl table{direction:rtl;}`,
    `.${p}-table-wrapper-rtl .${p}-table-row-expand-icon{float:right;}`,
    `.${p}-table-wrapper-rtl .${p}-table-row-expand-icon::after{transform:rotate(-90deg);}`,
    `.${p}-table-wrapper-rtl .${p}-table-row-expand-icon-collapsed::before{transform:rotate(180deg);}`,
    `.${p}-table-wrapper-rtl .${p}-table-row-expand-icon-collapsed::after{transform:rotate(0deg);}`,
    `.${p}-table-wrapper-rtl .${p}-table-cell-fix-start-shadow-show:after{box-shadow:var(--${p}-table-cell-fix-end-shadow);}`,
    `.${p}-table-wrapper-rtl .${p}-table-cell-fix-end-shadow-show:after{box-shadow:var(--${p}-table-cell-fix-start-shadow);}`,
    `.${p}-table-wrapper-rtl .${p}-table-container .${p}-table-row-indent{float:right;}`,
    `.${p}-table-wrapper-rtl .${p}-table-fix-start-shadow-show .${p}-table-container:before{box-shadow:var(--${p}-table-cell-fix-end-shadow);}`,
    `.${p}-table-wrapper-rtl .${p}-table-fix-end-shadow-show .${p}-table-container:after{box-shadow:var(--${p}-table-cell-fix-start-shadow);}`,
    `.${p}-table-wrapper .${p}-table-tbody-virtual .${p}-table-tbody-virtual-scrollbar{cursor:pointer;}`,
    `.${p}-table-wrapper .${p}-table-tbody-virtual .${p}-table-tbody-virtual-scrollbar:hover{background-color:${v('colorFillQuaternary')};}`,
    `.${p}-table-wrapper .${p}-table-tbody-virtual .${p}-table-tbody-virtual-holder-inner>.${p}-table-row,.${p}-table-wrapper .${p}-table-tbody-virtual .${p}-table-tbody-virtual-holder-inner>div:not(.${p}-table-row)>.${p}-table-row{display:flex;box-sizing:border-box;width:100%;}`,
    `.${p}-table-wrapper .${p}-table-tbody-virtual .${p}-table-tbody-virtual-holder-inner>.${p}-table-row >.${p}-table-cell,.${p}-table-wrapper .${p}-table-tbody-virtual .${p}-table-tbody-virtual-holder-inner>div:not(.${p}-table-row)>.${p}-table-row >.${p}-table-cell{align-content:center;}`,
    `.${p}-table-wrapper .${p}-table-tbody-virtual .${p}-table-cell{border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);transition:background-color ${v('motionDurationMid')};}`,
    `.${p}-table-wrapper .${p}-table-tbody-virtual .${p}-table-expanded-row .${p}-table-expanded-row-cell.${p}-table-expanded-row-cell-fixed{position:sticky;inset-inline-start:0;overflow:hidden;width:calc(var(--virtual-width) - ${v('lineWidth')});border-inline-end:none;}`,
    `.${p}-table-wrapper .${p}-table-bordered .${p}-table-tbody-virtual:after{content:"";inset-inline:0;bottom:0;border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);position:absolute;}`,
    `.${p}-table-wrapper .${p}-table-bordered .${p}-table-tbody-virtual .${p}-table-cell{border-inline-end:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table-bordered .${p}-table-tbody-virtual .${p}-table-cell.${p}-table-cell-fix-right-first:before{content:"";position:absolute;inset-block:0;inset-inline-start:calc(${v('lineWidth')} * -1);border-inline-start:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
    `.${p}-table-wrapper .${p}-table-bordered.${p}-table-virtual .${p}-table-placeholder .${p}-table-cell{border-inline-end:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);border-bottom:${v('lineWidth')} ${v('lineType')} var(--${p}-table-border-color);}`,
  ];

  return declBlock + rules.join('\n');
}
