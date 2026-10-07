/**
 * Dropdown 的静态样式（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 components/dropdown/style（React SSR + extractStyle
 * 产物逐条机械转换，提取脚本 tests/visual/debug/extract-dropdown.mjs ——
 * 括号配平提取；103 条规则，原序）。
 *
 * 与 antd 产物的转换规则：
 *   1. 去掉 :where(.css-dev-only-…) hash 前缀（静态移植无 hashId）。
 *   2. .ant-* → .apollo-*；--ant-* → --apollo-*；.anticon → .apollo-icon（D15）。
 *   3. 动画名 → apollo-dropdown-* 稳定命名（keyframes 在 KEYFRAMES 段内联；
 *      slide-up 与 menu 产物的同名规则等价，重复无冲突）。
 *   4. 组件变量声明块：antd 挂在 .ant-dropdown-css-var（死选择器）；本仓按
 *      D69 同判，落在唯一的根形态 .apollo-dropdown 上（genDropdownTokenDecls
 *      返回该块原序字面量）。
 *   5. loadingCircle（icons 基线职责）与 Move 系（无引用）keyframes 已删除。
 */

/** 组件变量声明（对拍 antd 的 .ant-dropdown-css-var 块，原序字面量）。 */
export function genDropdownTokenDecls(): string {
  return DECLS;
}

/** antd motion 的 @keyframes（稳定命名，原序）。 */
const DECLS = `--apollo-dropdown-z-index-popup:1050;--apollo-dropdown-padding-block:5px;--apollo-dropdown-arrow-offset-horizontal:12px;--apollo-dropdown-arrow-offset-vertical:8px;--apollo-dropdown-arrow-shadow-width:8.970562748477143px;--apollo-dropdown-arrow-path:path('M 0 8 A 4 4 0 0 0 2.82842712474619 6.82842712474619 L 6.585786437626905 3.0710678118654755 A 2 2 0 0 1 9.414213562373096 3.0710678118654755 L 13.17157287525381 6.82842712474619 A 4 4 0 0 0 16 8 Z');--apollo-dropdown-arrow-polygon:polygon(1.6568542494923806px 100%, 50% 1.6568542494923806px, 14.34314575050762px 100%, 1.6568542494923806px 100%);`;

const KEYFRAMES = `
@keyframes apollo-dropdown-slide-up-in{0%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}100%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}}
@keyframes apollo-dropdown-slide-down-in{0%{transform:scaleY(0.8);transform-origin:100% 100%;opacity:0;}100%{transform:scaleY(1);transform-origin:100% 100%;opacity:1;}}
@keyframes apollo-dropdown-slide-up-out{0%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}100%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}}
@keyframes apollo-dropdown-slide-down-out{0%{transform:scaleY(1);transform-origin:100% 100%;opacity:1;}100%{transform:scaleY(0.8);transform-origin:100% 100%;opacity:0;}}
@keyframes apollo-dropdown-slide-left-in{0%{transform:scaleX(0.8);transform-origin:0% 0%;opacity:0;}100%{transform:scaleX(1);transform-origin:0% 0%;opacity:1;}}
@keyframes apollo-dropdown-slide-right-in{0%{transform:scaleX(0.8);transform-origin:100% 0%;opacity:0;}100%{transform:scaleX(1);transform-origin:100% 0%;opacity:1;}}
@keyframes apollo-dropdown-slide-left-out{0%{transform:scaleX(1);transform-origin:0% 0%;opacity:1;}100%{transform:scaleX(0.8);transform-origin:0% 0%;opacity:0;}}
@keyframes apollo-dropdown-slide-right-out{0%{transform:scaleX(1);transform-origin:100% 0%;opacity:1;}100%{transform:scaleX(0.8);transform-origin:100% 0%;opacity:0;}}
@keyframes apollo-dropdown-zoom-big-in{0%{transform:scale(0.8);opacity:0;}100%{transform:scale(1);opacity:1;}}
@keyframes apollo-dropdown-zoom-big-out{0%{transform:scale(1);}100%{transform:scale(0.8);opacity:0;}}`;

/** antd 产物机械转换段（103 条，原序）。 */
const RULES = `
.apollo-dropdown{position:absolute;top:-9999px;left:-9999px;z-index:var(--apollo-dropdown-z-index-popup);display:block;}
.apollo-dropdown::before{position:absolute;inset-block:calc(var(--apollo-size-popup-arrow) / 2 - calc(var(--apollo-size-popup-arrow) / 2 + var(--apollo-margin-xxs)));z-index:-9999;opacity:0.0001;content:"";}
.apollo-dropdown-menu-vertical{max-height:calc(100vh - calc(var(--apollo-control-height-lg) * 2.5));overflow-y:auto;}
.apollo-dropdown-trigger.apollo-btn>.apollo-icon-down,.apollo-dropdown-trigger.apollo-btn>.apollo-btn-icon>.apollo-icon-down{font-size:var(--apollo-font-size-icon);}
.apollo-dropdown .apollo-dropdown-wrap{position:relative;}
.apollo-dropdown .apollo-dropdown-wrap .apollo-btn>.apollo-icon-down{font-size:var(--apollo-font-size-icon);}
.apollo-dropdown .apollo-dropdown-wrap .apollo-icon-down::before{transition:transform var(--apollo-motion-duration-mid);}
.apollo-dropdown .apollo-dropdown-wrap-open .apollo-icon-down::before{transform:rotate(180deg);}
.apollo-dropdown-hidden,.apollo-dropdown-menu-hidden,.apollo-dropdown-menu-submenu-hidden{display:none;}
.apollo-dropdown.apollo-slide-down-enter.apollo-slide-down-enter-active.apollo-dropdown-placement-bottomLeft,.apollo-dropdown.apollo-slide-down-appear.apollo-slide-down-appear-active.apollo-dropdown-placement-bottomLeft,.apollo-dropdown.apollo-slide-down-enter.apollo-slide-down-enter-active.apollo-dropdown-placement-bottom,.apollo-dropdown.apollo-slide-down-appear.apollo-slide-down-appear-active.apollo-dropdown-placement-bottom,.apollo-dropdown.apollo-slide-down-enter.apollo-slide-down-enter-active.apollo-dropdown-placement-bottomRight,.apollo-dropdown.apollo-slide-down-appear.apollo-slide-down-appear-active.apollo-dropdown-placement-bottomRight{animation-name:apollo-dropdown-slide-up-in;}
.apollo-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-dropdown-placement-topLeft,.apollo-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-dropdown-placement-topLeft,.apollo-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-dropdown-placement-top,.apollo-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-dropdown-placement-top,.apollo-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-dropdown-placement-topRight,.apollo-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-dropdown-placement-topRight{animation-name:apollo-dropdown-slide-down-in;}
.apollo-dropdown.apollo-slide-down-leave.apollo-slide-down-leave-active.apollo-dropdown-placement-bottomLeft,.apollo-dropdown.apollo-slide-down-leave.apollo-slide-down-leave-active.apollo-dropdown-placement-bottom,.apollo-dropdown.apollo-slide-down-leave.apollo-slide-down-leave-active.apollo-dropdown-placement-bottomRight{animation-name:apollo-dropdown-slide-up-out;}
.apollo-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-dropdown-placement-topLeft,.apollo-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-dropdown-placement-top,.apollo-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-dropdown-placement-topRight{animation-name:apollo-dropdown-slide-down-out;}
.apollo-dropdown.apollo-slide-right-enter.apollo-slide-right-enter-active.apollo-dropdown-placement-right,.apollo-dropdown.apollo-slide-right-appear.apollo-slide-right-appear-active.apollo-dropdown-placement-right,.apollo-dropdown.apollo-slide-right-enter.apollo-slide-right-enter-active.apollo-dropdown-placement-rightTop,.apollo-dropdown.apollo-slide-right-appear.apollo-slide-right-appear-active.apollo-dropdown-placement-rightTop,.apollo-dropdown.apollo-slide-right-enter.apollo-slide-right-enter-active.apollo-dropdown-placement-rightBottom,.apollo-dropdown.apollo-slide-right-appear.apollo-slide-right-appear-active.apollo-dropdown-placement-rightBottom{animation-name:apollo-dropdown-slide-left-in;}
.apollo-dropdown.apollo-slide-left-enter.apollo-slide-left-enter-active.apollo-dropdown-placement-left,.apollo-dropdown.apollo-slide-left-appear.apollo-slide-left-appear-active.apollo-dropdown-placement-left,.apollo-dropdown.apollo-slide-left-enter.apollo-slide-left-enter-active.apollo-dropdown-placement-leftTop,.apollo-dropdown.apollo-slide-left-appear.apollo-slide-left-appear-active.apollo-dropdown-placement-leftTop,.apollo-dropdown.apollo-slide-left-enter.apollo-slide-left-enter-active.apollo-dropdown-placement-leftBottom,.apollo-dropdown.apollo-slide-left-appear.apollo-slide-left-appear-active.apollo-dropdown-placement-leftBottom{animation-name:apollo-dropdown-slide-right-in;}
.apollo-dropdown.apollo-slide-right-leave.apollo-slide-right-leave-active.apollo-dropdown-placement-right,.apollo-dropdown.apollo-slide-right-leave.apollo-slide-right-leave-active.apollo-dropdown-placement-rightTop,.apollo-dropdown.apollo-slide-right-leave.apollo-slide-right-leave-active.apollo-dropdown-placement-rightBottom{animation-name:apollo-dropdown-slide-left-out;}
.apollo-dropdown.apollo-slide-left-leave.apollo-slide-left-leave-active.apollo-dropdown-placement-left,.apollo-dropdown.apollo-slide-left-leave.apollo-slide-left-leave-active.apollo-dropdown-placement-leftTop,.apollo-dropdown.apollo-slide-left-leave.apollo-slide-left-leave-active.apollo-dropdown-placement-leftBottom{animation-name:apollo-dropdown-slide-right-out;}
.apollo-dropdown .apollo-dropdown-arrow{position:absolute;z-index:1;display:block;pointer-events:none;width:var(--apollo-size-popup-arrow);height:var(--apollo-size-popup-arrow);overflow:hidden;}
.apollo-dropdown .apollo-dropdown-arrow::before{position:absolute;bottom:0;inset-inline-start:0;width:var(--apollo-size-popup-arrow);height:calc(var(--apollo-size-popup-arrow) / 2);background:var(--apollo-color-bg-elevated);clip-path:var(--apollo-dropdown-arrow-polygon);clip-path:var(--apollo-dropdown-arrow-path);content:"";}
.apollo-dropdown .apollo-dropdown-arrow::after{content:"";position:absolute;width:var(--apollo-dropdown-arrow-shadow-width);height:var(--apollo-dropdown-arrow-shadow-width);bottom:0;inset-inline:0;margin:auto;border-radius:0 0 var(--apollo-border-radius-xs) 0;transform:translateY(50%) rotate(-135deg);z-index:0;background:transparent;box-shadow:var(--apollo-box-shadow-popover-arrow);}
.apollo-dropdown .apollo-dropdown-arrow:before{background:var(--apollo-color-bg-elevated);}
.apollo-dropdown-placement-top>.apollo-dropdown-arrow,.apollo-dropdown-placement-topLeft>.apollo-dropdown-arrow,.apollo-dropdown-placement-topRight>.apollo-dropdown-arrow{bottom:0;transform:translateY(100%) rotate(180deg);}
.apollo-dropdown-placement-top>.apollo-dropdown-arrow{left:50%;transform:translateX(-50%) translateY(100%) rotate(180deg);}
.apollo-dropdown-placement-topLeft{--apollo-tooltip-arrow-offset-x:var(--apollo-dropdown-arrow-offset-horizontal);}
.apollo-dropdown-placement-topLeft >.apollo-dropdown-arrow{left:var(--apollo-dropdown-arrow-offset-horizontal);}
.apollo-dropdown-placement-topRight{--apollo-tooltip-arrow-offset-x:calc(100% - var(--apollo-dropdown-arrow-offset-horizontal));}
.apollo-dropdown-placement-topRight >.apollo-dropdown-arrow{right:var(--apollo-dropdown-arrow-offset-horizontal);}
.apollo-dropdown-placement-bottom>.apollo-dropdown-arrow,.apollo-dropdown-placement-bottomLeft>.apollo-dropdown-arrow,.apollo-dropdown-placement-bottomRight>.apollo-dropdown-arrow{top:0;transform:translateY(-100%);}
.apollo-dropdown-placement-bottom>.apollo-dropdown-arrow{left:50%;transform:translateX(-50%) translateY(-100%);}
.apollo-dropdown-placement-bottomLeft{--apollo-tooltip-arrow-offset-x:var(--apollo-dropdown-arrow-offset-horizontal);}
.apollo-dropdown-placement-bottomLeft >.apollo-dropdown-arrow{left:var(--apollo-dropdown-arrow-offset-horizontal);}
.apollo-dropdown-placement-bottomRight{--apollo-tooltip-arrow-offset-x:calc(100% - var(--apollo-dropdown-arrow-offset-horizontal));}
.apollo-dropdown-placement-bottomRight >.apollo-dropdown-arrow{right:var(--apollo-dropdown-arrow-offset-horizontal);}
.apollo-dropdown-placement-left>.apollo-dropdown-arrow,.apollo-dropdown-placement-leftTop>.apollo-dropdown-arrow,.apollo-dropdown-placement-leftBottom>.apollo-dropdown-arrow{right:0;transform:translateX(100%) rotate(90deg);}
.apollo-dropdown-placement-left>.apollo-dropdown-arrow{top:50%;transform:translateY(-50%) translateX(100%) rotate(90deg);}
.apollo-dropdown-placement-leftTop>.apollo-dropdown-arrow{top:var(--apollo-dropdown-arrow-offset-vertical);}
.apollo-dropdown-placement-leftBottom>.apollo-dropdown-arrow{bottom:var(--apollo-dropdown-arrow-offset-vertical);}
.apollo-dropdown-placement-right>.apollo-dropdown-arrow,.apollo-dropdown-placement-rightTop>.apollo-dropdown-arrow,.apollo-dropdown-placement-rightBottom>.apollo-dropdown-arrow{left:0;transform:translateX(-100%) rotate(-90deg);}
.apollo-dropdown-placement-right>.apollo-dropdown-arrow{top:50%;transform:translateY(-50%) translateX(-100%) rotate(-90deg);}
.apollo-dropdown-placement-rightTop>.apollo-dropdown-arrow{top:var(--apollo-dropdown-arrow-offset-vertical);}
.apollo-dropdown-placement-rightBottom>.apollo-dropdown-arrow{bottom:var(--apollo-dropdown-arrow-offset-vertical);}
.apollo-dropdown .apollo-dropdown-menu{position:relative;margin:0;}
.apollo-dropdown-menu-submenu-popup{position:absolute;z-index:var(--apollo-dropdown-z-index-popup);background:transparent;box-shadow:none;transform-origin:0 0;}
.apollo-dropdown-menu-submenu-popup ul,.apollo-dropdown-menu-submenu-popup li{list-style:none;margin:0;}
.apollo-dropdown,.apollo-dropdown-menu-submenu{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);}
.apollo-dropdown .apollo-dropdown-menu,.apollo-dropdown-menu-submenu .apollo-dropdown-menu{padding:var(--apollo-padding-xxs);list-style-type:none;background-color:var(--apollo-color-bg-elevated);background-clip:padding-box;border-radius:var(--apollo-border-radius-lg);outline:none;box-shadow:var(--apollo-box-shadow-secondary);}
.apollo-dropdown .apollo-dropdown-menu:focus-visible,.apollo-dropdown-menu-submenu .apollo-dropdown-menu:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-dropdown .apollo-dropdown-menu:empty,.apollo-dropdown-menu-submenu .apollo-dropdown-menu:empty{padding:0;box-shadow:none;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-group-title,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-group-title{padding:var(--apollo-dropdown-padding-block) var(--apollo-control-padding-horizontal);color:var(--apollo-color-text-description);transition:all var(--apollo-motion-duration-mid);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item{position:relative;display:flex;align-items:center;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-icon,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-icon{min-width:var(--apollo-font-size);margin-inline-end:var(--apollo-margin-xs);font-size:var(--apollo-font-size-sm);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-title-content,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-title-content{flex:auto;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-title-content-with-extra,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-title-content-with-extra{display:inline-flex;align-items:center;width:100%;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-title-content >a,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-title-content >a,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-title-content >.apollo-dropdown-menu-item-label>a,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-title-content >.apollo-dropdown-menu-item-label>a{color:inherit;transition:all var(--apollo-motion-duration-mid);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-title-content >a:hover,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-title-content >a:hover,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-title-content >.apollo-dropdown-menu-item-label>a:hover,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-title-content >.apollo-dropdown-menu-item-label>a:hover{color:inherit;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-title-content >a::after,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-title-content >a::after,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-title-content >.apollo-dropdown-menu-item-label>a::after,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-title-content >.apollo-dropdown-menu-item-label>a::after{position:absolute;inset:0;content:"";}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-title-content .apollo-dropdown-menu-item-extra,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-title-content .apollo-dropdown-menu-item-extra{padding-inline-start:var(--apollo-padding);margin-inline-start:auto;font-size:var(--apollo-font-size-sm);color:var(--apollo-color-text-description);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title{display:flex;margin:0;padding:var(--apollo-dropdown-padding-block) var(--apollo-control-padding-horizontal);color:var(--apollo-color-text);font-weight:normal;font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);cursor:pointer;transition:all var(--apollo-motion-duration-mid);border-radius:var(--apollo-border-radius-sm);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item:hover,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item:hover,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title:hover,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title:hover,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-active,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-active,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-active,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-active{background-color:var(--apollo-control-item-bg-hover);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item:focus-visible,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item:focus-visible,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title:focus-visible,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-selected,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-selected,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-selected,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-selected{color:var(--apollo-color-primary);background-color:var(--apollo-control-item-bg-active);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-selected:hover,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-selected:hover,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-selected:hover,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-selected:hover,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-selected-active,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-selected-active,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-selected-active,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-selected-active{background-color:var(--apollo-control-item-bg-active-hover);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-disabled,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-disabled,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-disabled,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-disabled{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-disabled:hover,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-disabled:hover,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-disabled:hover,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-disabled:hover{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-elevated);cursor:not-allowed;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-disabled a,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-disabled a,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-disabled a,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-disabled a{pointer-events:none;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-divider,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-divider,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-divider,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title-divider{height:1px;margin:var(--apollo-margin-xxs) 0;overflow:hidden;line-height:0;background-color:var(--apollo-color-split);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item .apollo-dropdown-menu-submenu-expand-icon,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item .apollo-dropdown-menu-submenu-expand-icon,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title .apollo-dropdown-menu-submenu-expand-icon,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title .apollo-dropdown-menu-submenu-expand-icon{position:absolute;inset-inline-end:var(--apollo-padding-xs);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item .apollo-dropdown-menu-submenu-expand-icon .apollo-dropdown-menu-submenu-arrow-icon,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item .apollo-dropdown-menu-submenu-expand-icon .apollo-dropdown-menu-submenu-arrow-icon,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title .apollo-dropdown-menu-submenu-expand-icon .apollo-dropdown-menu-submenu-arrow-icon,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title .apollo-dropdown-menu-submenu-expand-icon .apollo-dropdown-menu-submenu-arrow-icon{margin-inline-end:0!important;color:var(--apollo-color-icon);font-size:var(--apollo-font-size-icon);font-style:normal;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item-group-list,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item-group-list{margin:0 var(--apollo-margin-xs);padding:0;list-style:none;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-title{padding-inline-end:calc(var(--apollo-control-padding-horizontal) + var(--apollo-font-size-sm));}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-vertical,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-vertical{position:relative;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu.apollo-dropdown-menu-submenu-disabled .apollo-dropdown-menu-submenu-title,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu.apollo-dropdown-menu-submenu-disabled .apollo-dropdown-menu-submenu-title,.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu.apollo-dropdown-menu-submenu-disabled .apollo-dropdown-menu-submenu-title .apollo-dropdown-menu-submenu-arrow-icon,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu.apollo-dropdown-menu-submenu-disabled .apollo-dropdown-menu-submenu-title .apollo-dropdown-menu-submenu-arrow-icon{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-elevated);cursor:not-allowed;}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-submenu-selected .apollo-dropdown-menu-submenu-title,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-submenu-selected .apollo-dropdown-menu-submenu-title{color:var(--apollo-color-primary);}
.apollo-slide-up-enter,.apollo-slide-up-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-up-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-up-enter.apollo-slide-up-enter-active,.apollo-slide-up-appear.apollo-slide-up-appear-active{animation-name:apollo-dropdown-slide-up-in;animation-play-state:running;}
.apollo-slide-up-leave.apollo-slide-up-leave-active{animation-name:apollo-dropdown-slide-up-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-up-enter,.apollo-slide-up-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-up-enter-prepare,.apollo-slide-up-appear-prepare{transform:scale(1);}
.apollo-slide-up-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}
.apollo-slide-down-enter,.apollo-slide-down-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-down-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-down-enter.apollo-slide-down-enter-active,.apollo-slide-down-appear.apollo-slide-down-appear-active{animation-name:apollo-dropdown-slide-down-in;animation-play-state:running;}
.apollo-slide-down-leave.apollo-slide-down-leave-active{animation-name:apollo-dropdown-slide-down-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-down-enter,.apollo-slide-down-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-down-enter-prepare,.apollo-slide-down-appear-prepare{transform:scale(1);}
.apollo-slide-down-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}
.apollo-slide-left-enter,.apollo-slide-left-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-left-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-left-enter.apollo-slide-left-enter-active,.apollo-slide-left-appear.apollo-slide-left-appear-active{animation-name:apollo-dropdown-slide-left-in;animation-play-state:running;}
.apollo-slide-left-leave.apollo-slide-left-leave-active{animation-name:apollo-dropdown-slide-left-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-left-enter,.apollo-slide-left-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-left-enter-prepare,.apollo-slide-left-appear-prepare{transform:scale(1);}
.apollo-slide-left-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}
.apollo-slide-right-enter,.apollo-slide-right-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-right-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-right-enter.apollo-slide-right-enter-active,.apollo-slide-right-appear.apollo-slide-right-appear-active{animation-name:apollo-dropdown-slide-right-in;animation-play-state:running;}
.apollo-slide-right-leave.apollo-slide-right-leave-active{animation-name:apollo-dropdown-slide-right-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-right-enter,.apollo-slide-right-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-right-enter-prepare,.apollo-slide-right-appear-prepare{transform:scale(1);}
.apollo-slide-right-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item.apollo-dropdown-menu-item-danger:not(.apollo-dropdown-menu-item-disabled),.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item.apollo-dropdown-menu-item-danger:not(.apollo-dropdown-menu-item-disabled){color:var(--apollo-color-error);}
.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item.apollo-dropdown-menu-item-danger:not(.apollo-dropdown-menu-item-disabled):hover,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item.apollo-dropdown-menu-item-danger:not(.apollo-dropdown-menu-item-disabled):hover{color:var(--apollo-color-text-light-solid);background-color:var(--apollo-color-error);}
`;
/** 生成单个前缀下的完整样式（upload 同一约定：ant 前缀在出口替换类名段）。 */
export function genDropdownStyle(prefixCls: string = 'apollo'): string {
  const rename = (cssText: string): string =>
    prefixCls === 'apollo'
      ? cssText
      : cssText.split('.apollo-dropdown').join(`.${prefixCls}-dropdown`);
  const decls =
    prefixCls === 'apollo' ? `.apollo-dropdown{${DECLS}}` : `.${prefixCls}-dropdown{${DECLS}}`;
  return `${KEYFRAMES}
${decls}
${rename(RULES)}`;
}
