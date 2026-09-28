/**
 * Select 的静态样式（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `components/select/style`（React SSR + `extractStyle`
 * 真实产物逐条机械转换，提取脚本 `tests/visual/debug/extract-select.mjs`）。
 *
 * 与 antd 产物的转换规则：
 *   1. 去掉 `:where(.css-dev-only-…)` hash 前缀（静态移植无 hashId）。
 *   2. `.ant-*` → `.apollo-*`；`--ant-*` → `--apollo-*`；`.anticon` → `.apollo-icon`（D15）。
 *   3. 组件变量声明块：antd 挂在 `.css-var-…ant-select-css-var`（死选择器，体以
 *      `--ant-select-*` 开头）；本仓按 D69 同判落在根形态 `.apollo-select` 上。
 *      ⚠️ 两个易混块：① `.ant-select-css-var{font-family…}` 是 genCommonStyle 的
 *      **常规规则**，必须保留；② 根块 `.ant-select` 里内联着内部派生变量 + 实体规则
 *      （inline-flex / border / height），是规则不是 DECLS（第一版整块当 DECLS
 *      丢掉了盒子样式）。
 *   4. 动画名稳定化：`…-antSlideUpIn` → `apollo-slide-up-in`（keyframes 内联；
 *      Move 系与 `.anticon-spin` 无引用 —— 均删，dropdown 同判）。
 *      裸 `.ant-slide-up-*` motion 基线段单独成 MOTION_BASE。
 *   5. at-rule（`@media`）按**块体**判据保留（modal 期教训）。
 */

/** 组件变量声明（对拍 antd 的 `.css-var-…ant-select-css-var` 块，原序字面量）。 */
export function genSelectTokenDecls(): string {
  return DECLS;
}

const DECLS = `--apollo-select-line-width-focus:1px;--apollo-select-internal_fixed_item_margin:2px;--apollo-select-z-index-popup:1050;--apollo-select-option-selected-color:rgba(0,0,0,0.88);--apollo-select-option-selected-font-weight:600;--apollo-select-option-selected-bg:#e6f4ff;--apollo-select-option-active-bg:rgba(0,0,0,0.04);--apollo-select-option-padding:5px 12px;--apollo-select-option-font-size:14px;--apollo-select-option-line-height:1.5714285714285714;--apollo-select-option-height:32px;--apollo-select-selector-bg:#ffffff;--apollo-select-clear-bg:#ffffff;--apollo-select-single-item-height-lg:40px;--apollo-select-multiple-item-bg:rgba(0,0,0,0.06);--apollo-select-multiple-item-border-color:transparent;--apollo-select-multiple-item-height:24px;--apollo-select-multiple-item-height-sm:16px;--apollo-select-multiple-item-height-lg:32px;--apollo-select-multiple-selector-bg-disabled:rgba(0,0,0,0.04);--apollo-select-multiple-item-color-disabled:rgba(0,0,0,0.25);--apollo-select-multiple-item-border-color-disabled:transparent;--apollo-select-show-arrow-padding-inline-end:18px;--apollo-select-hover-border-color:#4096ff;--apollo-select-active-border-color:#1677ff;--apollo-select-active-outline-color:rgba(5,145,255,0.1);--apollo-select-select-affix-padding:4px;`;

/** antd motion 的 @keyframes（稳定命名，体逐字取自产物）。 */
const KEYFRAMES = `
@keyframes apollo-slide-up-in{0%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}100%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}}
@keyframes apollo-slide-down-in{0%{transform:scaleY(0.8);transform-origin:100% 100%;opacity:0;}100%{transform:scaleY(1);transform-origin:100% 100%;opacity:1;}}
@keyframes apollo-slide-up-out{0%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}100%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}}
@keyframes apollo-slide-down-out{0%{transform:scaleY(1);transform-origin:100% 100%;opacity:1;}100%{transform:scaleY(0.8);transform-origin:100% 100%;opacity:0;}}`;

/** antd `_util/motion` 的共享基线段（裸 slide-up/down 规则，原序）。 */
const MOTION_BASE = `
.apollo-slide-up-enter,.apollo-slide-up-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-up-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-up-enter.apollo-slide-up-enter-active,.apollo-slide-up-appear.apollo-slide-up-appear-active{animation-name:apollo-slide-up-in;animation-play-state:running;}
.apollo-slide-up-leave.apollo-slide-up-leave-active{animation-name:apollo-slide-up-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-up-enter,.apollo-slide-up-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-up-enter-prepare,.apollo-slide-up-appear-prepare{transform:scale(1);}
.apollo-slide-up-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}
.apollo-slide-down-enter,.apollo-slide-down-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-down-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-down-enter.apollo-slide-down-enter-active,.apollo-slide-down-appear.apollo-slide-down-appear-active{animation-name:apollo-slide-down-in;animation-play-state:running;}
.apollo-slide-down-leave.apollo-slide-down-leave-active{animation-name:apollo-slide-down-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-down-enter,.apollo-slide-down-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-down-enter-prepare,.apollo-slide-down-appear-prepare{transform:scale(1);}
.apollo-slide-down-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}`;

/** antd 产物机械转换段（原序）。 */
const RULES = `
a{color:var(--apollo-color-link);text-decoration:var(--apollo-link-decoration);background-color:transparent;outline:none;cursor:pointer;transition:color var(--apollo-motion-duration-slow);-webkit-text-decoration-skip:objects;}
a:hover{color:var(--apollo-color-link-hover);}
a:active{color:var(--apollo-color-link-active);}
a:active,a:hover{text-decoration:var(--apollo-link-hover-decoration);outline:0;}
a:focus{text-decoration:var(--apollo-link-focus-decoration);outline:0;}
a:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
a[disabled]{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
a{color:var(--apollo-color-link);text-decoration:var(--apollo-link-decoration);background-color:transparent;outline:none;cursor:pointer;transition:color var(--apollo-motion-duration-slow);-webkit-text-decoration-skip:objects;}
a:hover{color:var(--apollo-color-link-hover);}
a:active{color:var(--apollo-color-link-active);}
a:active, a:hover{text-decoration:var(--apollo-link-hover-decoration);outline:0;}
a:focus{text-decoration:var(--apollo-link-focus-decoration);outline:0;}
a:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
a[disabled]{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-icon{display:inline-flex;align-items:center;color:inherit;font-style:normal;line-height:0;text-align:center;text-transform:none;vertical-align:-0.125em;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
.apollo-icon >*{line-height:1;}
.apollo-icon svg{display:inline-block;vertical-align:inherit;}
.apollo-icon::before{display:none;}
.apollo-icon[tabindex]{cursor:pointer;}
.apollo-icon .apollo-icon-icon{display:block;}
.apollo-select-css-var{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}
.apollo-select-css-var::before,.apollo-select-css-var::after{box-sizing:border-box;}
.apollo-select-css-var [class^="apollo-select"],.apollo-select-css-var [class*=" apollo-select"]{box-sizing:border-box;}
.apollo-select-css-var [class^="apollo-select"]::before,.apollo-select-css-var [class*=" apollo-select"]::before,.apollo-select-css-var [class^="apollo-select"]::after,.apollo-select-css-var [class*=" apollo-select"]::after{box-sizing:border-box;}
.apollo-select.apollo-select-in-form-item{width:100%;}
.apollo-select{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);}
.apollo-select .apollo-select-selection-item{flex:1;font-weight:normal;position:relative;user-select:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.apollo-select .apollo-select-selection-item >.apollo-typography{display:inline;}
.apollo-select .apollo-select-prefix{flex:none;margin-inline-end:var(--apollo-select-select-affix-padding);}
.apollo-select .apollo-select-clear{position:absolute;top:50%;inset-inline-start:auto;inset-inline-end:calc(var(--apollo-padding-sm) - var(--apollo-line-width));z-index:1;display:inline-block;width:var(--apollo-font-size-icon);height:var(--apollo-font-size-icon);margin-top:calc(var(--apollo-font-size-icon) * -1 / 2);padding:0;background:transparent;color:var(--apollo-color-text-quaternary);font-size:var(--apollo-font-size-icon);font-family:inherit;font-style:normal;line-height:1;text-align:center;text-transform:none;appearance:none;border:0;cursor:pointer;opacity:0;transition:color var(--apollo-motion-duration-mid) ease,opacity var(--apollo-motion-duration-mid) ease;text-rendering:auto;transform:translateZ(0);}
.apollo-select .apollo-select-clear:before{display:block;}
.apollo-select .apollo-select-clear:hover{color:var(--apollo-color-icon);}
@media(hover:none){.apollo-select .apollo-select-clear{opacity:1;}.apollo-select .apollo-select-suffix:not(:last-child){opacity:0;pointer-events:none;}.apollo-select.apollo-select-allow-clear:not(.apollo-select-show-arrow):not(.apollo-select-customize) .apollo-select-content{margin-inline-end:var(--apollo-select-show-arrow-padding-inline-end);}}
.apollo-select:hover .apollo-select-clear{opacity:1;}
.apollo-select:hover .apollo-select-suffix:not(:last-child){opacity:0;pointer-events:none;}
.apollo-select:hover.apollo-select-allow-clear:not(.apollo-select-show-arrow):not(.apollo-select-customize) .apollo-select-content{margin-inline-end:var(--apollo-select-show-arrow-padding-inline-end);}
.apollo-select-status-error.apollo-select-has-feedback .apollo-select-clear,.apollo-select-status-warning.apollo-select-has-feedback .apollo-select-clear,.apollo-select-status-success.apollo-select-has-feedback .apollo-select-clear,.apollo-select-status-validating.apollo-select-has-feedback .apollo-select-clear{inset-inline-end:calc(calc(var(--apollo-padding-sm) - var(--apollo-line-width)) + var(--apollo-font-size) + var(--apollo-padding-xs));}
.apollo-select-dropdown{box-sizing:border-box;margin:0;padding:var(--apollo-padding-xxs);color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:absolute;top:-9999px;z-index:var(--apollo-select-z-index-popup);overflow:hidden;font-variant:initial;background-color:var(--apollo-color-bg-elevated);border-radius:var(--apollo-border-radius-lg);outline:none;box-shadow:var(--apollo-box-shadow-secondary);}
.apollo-select-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-select-dropdown-placement-bottomLeft,.apollo-select-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-select-dropdown-placement-bottomLeft{animation-name:apollo-slide-up-in;}
.apollo-select-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-select-dropdown-placement-topLeft,.apollo-select-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-select-dropdown-placement-topLeft,.apollo-select-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-select-dropdown-placement-topRight,.apollo-select-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-select-dropdown-placement-topRight{animation-name:apollo-slide-down-in;}
.apollo-select-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-select-dropdown-placement-bottomLeft{animation-name:apollo-slide-up-out;}
.apollo-select-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-select-dropdown-placement-topLeft,.apollo-select-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-select-dropdown-placement-topRight{animation-name:apollo-slide-down-out;}
.apollo-select-dropdown-hidden{display:none;}
.apollo-select-dropdown .apollo-select-dropdown-list-scrollbar{cursor:pointer;}
.apollo-select-dropdown .apollo-select-dropdown-list-scrollbar:hover{background-color:var(--apollo-color-fill-quaternary);}
.apollo-select-dropdown .apollo-select-item{position:relative;display:block;min-height:var(--apollo-select-option-height);padding:var(--apollo-select-option-padding);color:var(--apollo-color-text);font-weight:normal;font-size:var(--apollo-select-option-font-size);line-height:var(--apollo-select-option-line-height);box-sizing:border-box;cursor:pointer;transition:background-color var(--apollo-motion-duration-slow) ease;border-radius:var(--apollo-border-radius-sm);}
.apollo-select-dropdown .apollo-select-item-group{color:var(--apollo-color-text-description);font-size:var(--apollo-font-size-sm);cursor:default;}
.apollo-select-dropdown .apollo-select-item-option{display:flex;}
.apollo-select-dropdown .apollo-select-item-option-content{flex:auto;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.apollo-select-dropdown .apollo-select-item-option-state{flex:none;display:flex;align-items:center;}
.apollo-select-dropdown .apollo-select-item-option-selected:not(.apollo-select-item-option-disabled){color:var(--apollo-select-option-selected-color);font-weight:var(--apollo-select-option-selected-font-weight);background-color:var(--apollo-select-option-selected-bg);}
.apollo-select-dropdown .apollo-select-item-option-selected:not(.apollo-select-item-option-disabled) .apollo-select-item-option-state{color:var(--apollo-color-primary);}
.apollo-select-dropdown .apollo-select-item-option-active:not(.apollo-select-item-option-disabled){background-color:var(--apollo-select-option-active-bg);}
.apollo-select-dropdown .apollo-select-item-option-selected.apollo-select-item-option-active:not(.apollo-select-item-option-disabled){background-color:var(--apollo-control-item-bg-active-hover);}
.apollo-select-dropdown .apollo-select-item-option-disabled{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-select-dropdown .apollo-select-item-option-disabled.apollo-select-item-option-selected{background-color:var(--apollo-color-bg-container-disabled);}
.apollo-select-dropdown .apollo-select-item-option-grouped{padding-inline-start:calc(var(--apollo-control-padding-horizontal) * 2);}
.apollo-select-dropdown .apollo-select-item-empty{position:relative;display:block;min-height:var(--apollo-select-option-height);padding:var(--apollo-select-option-padding);color:var(--apollo-color-text-disabled);font-weight:normal;font-size:var(--apollo-select-option-font-size);line-height:var(--apollo-select-option-line-height);box-sizing:border-box;}
.apollo-select-dropdown .apollo-select-item-option-selected:has(+ .apollo-select-item-option-selected){border-end-start-radius:0;border-end-end-radius:0;}
.apollo-select-dropdown .apollo-select-item-option-selected:has(+ .apollo-select-item-option-selected)+.apollo-select-item-option-selected{border-start-start-radius:0;border-start-end-radius:0;}
.apollo-select-dropdown-rtl{direction:rtl;}
.apollo-slide-up-enter,.apollo-slide-up-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-up-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-up-enter.apollo-slide-up-enter-active,.apollo-slide-up-appear.apollo-slide-up-appear-active{animation-name:apollo-slide-up-in;animation-play-state:running;}
.apollo-slide-up-leave.apollo-slide-up-leave-active{animation-name:apollo-slide-up-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-up-enter,.apollo-slide-up-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-up-enter-prepare,.apollo-slide-up-appear-prepare{transform:scale(1);}
.apollo-slide-up-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}
.apollo-slide-down-enter,.apollo-slide-down-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-down-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-down-enter.apollo-slide-down-enter-active,.apollo-slide-down-appear.apollo-slide-down-appear-active{animation-name:apollo-slide-down-in;animation-play-state:running;}
.apollo-slide-down-leave.apollo-slide-down-leave-active{animation-name:apollo-slide-down-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-down-enter,.apollo-slide-down-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-down-enter-prepare,.apollo-slide-down-appear-prepare{transform:scale(1);}
.apollo-slide-down-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}
.apollo-select-rtl{direction:rtl;}
.apollo-select-compact-item:not(.apollo-select-compact-last-item){margin-inline-end:calc(var(--apollo-line-width) * -1);}
.apollo-select-compact-item:not(.apollo-select-status-success){z-index:2;}
.apollo-select-compact-item:active{z-index:3;}
.apollo-select-compact-item:hover,.apollo-select-compact-item:hover.apollo-select-focused{z-index:4;}
.apollo-select-compact-item.apollo-select-focused{z-index:3;}
.apollo-select-compact-item[disabled]{z-index:0;}
.apollo-select-compact-item:not(.apollo-select-compact-first-item):not(.apollo-select-compact-last-item){border-radius:0;}
.apollo-select-compact-item:not(.apollo-select-compact-last-item).apollo-select-compact-first-item,.apollo-select-compact-item:not(.apollo-select-compact-last-item).apollo-select-compact-first-item.apollo-select-sm,.apollo-select-compact-item:not(.apollo-select-compact-last-item).apollo-select-compact-first-item.apollo-select-lg{border-start-end-radius:0;border-end-end-radius:0;}
.apollo-select-compact-item:not(.apollo-select-compact-first-item).apollo-select-compact-last-item,.apollo-select-compact-item:not(.apollo-select-compact-first-item).apollo-select-compact-last-item.apollo-select-sm,.apollo-select-compact-item:not(.apollo-select-compact-first-item).apollo-select-compact-last-item.apollo-select-lg{border-start-start-radius:0;border-end-start-radius:0;}
.apollo-select{--apollo-select-border-radius:var(--apollo-border-radius);--apollo-select-border-color:#000;--apollo-select-border-size:var(--apollo-line-width);--apollo-select-background-color:var(--apollo-color-bg-container);--apollo-select-font-size:var(--apollo-font-size);--apollo-select-line-height:var(--apollo-line-height);--apollo-select-font-height:var(--apollo-font-height);--apollo-select-color:var(--apollo-color-text);--apollo-select-affix-color:var(--apollo-color-text);--apollo-select-height:var(--apollo-control-height);--apollo-select-padding-horizontal:calc(var(--apollo-padding-sm) - var(--apollo-line-width));--apollo-select-padding-vertical:calc((var(--apollo-select-height) - var(--apollo-select-font-height)) / 2 - var(--apollo-select-border-size));box-sizing:border-box;margin:0;padding:0;color:var(--apollo-select-color);font-size:var(--apollo-select-font-size);line-height:var(--apollo-select-line-height);list-style:none;font-family:var(--apollo-font-family);display:inline-flex;flex-wrap:nowrap;position:relative;transition:all var(--apollo-motion-duration-slow);align-items:flex-start;outline:0;cursor:pointer;border-radius:var(--apollo-select-border-radius);border-width:var(--apollo-select-border-size);border-style:var(--apollo-line-type);border-color:var(--apollo-select-border-color);background:var(--apollo-select-background-color);padding-inline:var(--apollo-select-padding-horizontal);padding-block:var(--apollo-select-padding-vertical);}
.apollo-select .apollo-select-prefix{color:var(--apollo-select-affix-color);flex:none;line-height:1;}
.apollo-select .apollo-select-placeholder{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--apollo-color-text-placeholder);pointer-events:none;z-index:1;}
.apollo-select .apollo-select-content{flex:auto;min-width:0;position:relative;display:flex;margin-inline-end:max(calc(var(--apollo-select-show-arrow-padding-inline-end) - var(--apollo-font-size-icon)),0px);}
.apollo-select .apollo-select-content:before{content:"\\a0";width:0;overflow:hidden;}
.apollo-select .apollo-select-content-value{visibility:inherit;}
.apollo-select .apollo-select-content input[readonly]{cursor:inherit;caret-color:transparent;}
.apollo-select .apollo-select-suffix{flex:none;color:var(--apollo-color-text-quaternary);font-size:var(--apollo-font-size-icon);line-height:1;transition:opacity var(--apollo-motion-duration-mid) ease,color var(--apollo-motion-duration-mid) ease;}
.apollo-select .apollo-select-suffix >:not(:last-child){margin-inline-end:var(--apollo-margin-xs);}
.apollo-select .apollo-select-prefix,.apollo-select .apollo-select-suffix{align-self:center;}
.apollo-select .apollo-select-prefix .apollo-icon,.apollo-select .apollo-select-suffix .apollo-icon{vertical-align:top;}
.apollo-select-disabled{background:var(--apollo-color-bg-container-disabled);--apollo-select-color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-select-disabled input{cursor:not-allowed;}
.apollo-select-sm{--apollo-select-height:var(--apollo-control-height-sm);--apollo-select-padding-horizontal:calc(var(--apollo-padding-xs) - var(--apollo-line-width));--apollo-select-border-radius:var(--apollo-border-radius-sm);}
.apollo-select-sm .apollo-select-clear{inset-inline-end:var(--apollo-select-padding-horizontal);}
.apollo-select-lg{--apollo-select-height:var(--apollo-control-height-lg);--apollo-select-font-size:var(--apollo-font-size-lg);--apollo-select-line-height:var(--apollo-line-height-lg);--apollo-select-font-height:var(--apollo-font-height-lg);--apollo-select-border-radius:var(--apollo-border-radius-lg);}
.apollo-select:not(.apollo-select-customize) .apollo-select-input{outline:none;background:transparent;appearance:none;border:0;margin:0;padding:0;color:var(--apollo-select-color);font-family:inherit;font-size:inherit;}
.apollo-select:not(.apollo-select-customize) .apollo-select-input::-webkit-search-cancel-button{display:none;appearance:none;}
.apollo-select-single:not(.apollo-select-customize) .apollo-select-input{position:absolute;inset:0;line-height:inherit;}
.apollo-select-single:not(.apollo-select-customize) .apollo-select-content{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;align-self:center;}
.apollo-select-single:not(.apollo-select-customize) .apollo-select-content-has-value{display:block;}
.apollo-select-single:not(.apollo-select-customize) .apollo-select-content-has-value:before{display:none;}
.apollo-select-single:not(.apollo-select-customize) .apollo-select-content-has-search-value{color:transparent;}
.apollo-select-single:not(.apollo-select-customize) .apollo-select-content-has-search-value >*:not(.apollo-select-input){opacity:0;}
.apollo-select-single:not(.apollo-select-customize) .apollo-select-content-value{transition:all var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out);z-index:1;opacity:1;}
.apollo-select-single:not(.apollo-select-customize).apollo-select-open .apollo-select-content-has-value{opacity:0.25;}
.apollo-select-single:not(.apollo-select-customize).apollo-select-open .apollo-select-content-has-search-value{opacity:1;transition:opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out);color:transparent;}
.apollo-select-single:not(.apollo-select-customize).apollo-select-open .apollo-select-content-has-search-value >*:not(.apollo-select-input){opacity:0;}
.apollo-select-show-search:not(.apollo-select-customize-input):not(.apollo-select-disabled){cursor:text;}
.apollo-select-multiple{--apollo-select-multi-item-background:var(--apollo-select-multiple-item-bg);--apollo-select-multi-item-border-color:transparent;--apollo-select-multi-item-border-radius:var(--apollo-border-radius-sm);--apollo-select-multi-item-height:var(--apollo-select-multiple-item-height);--apollo-select-multi-padding-base:calc((var(--apollo-select-height) - var(--apollo-select-multi-item-height)) / 2);--apollo-select-multi-padding-vertical:calc(var(--apollo-select-multi-padding-base) - var(--apollo-select-internal_fixed_item_margin) - var(--apollo-line-width));--apollo-select-multi-item-padding-horizontal:calc(calc(var(--apollo-padding-sm) - var(--apollo-line-width)) - var(--apollo-select-multi-padding-vertical) - var(--apollo-line-width) * 2);padding-block:var(--apollo-select-multi-padding-vertical);padding-inline-start:calc(var(--apollo-select-multi-padding-base) - var(--apollo-line-width));}
.apollo-select-multiple .apollo-select-prefix{margin-inline-start:var(--apollo-select-multi-item-padding-horizontal);}
.apollo-select-multiple .apollo-select-prefix+.apollo-select-content .apollo-select-placeholder{inset-inline-start:0;}
.apollo-select-multiple .apollo-select-prefix+.apollo-select-content .apollo-select-content-item.apollo-select-content-item-suffix{margin-inline-start:0;}
.apollo-select-multiple .apollo-select-placeholder{position:absolute;line-height:var(--apollo-select-line-height);inset-inline-start:var(--apollo-select-multi-item-padding-horizontal);width:calc(100% - var(--apollo-select-multi-item-padding-horizontal));top:50%;transform:translateY(-50%);}
.apollo-select-multiple .apollo-select-content{flex-wrap:wrap;align-items:center;line-height:1;}
.apollo-select-multiple .apollo-select-content-item-prefix{height:var(--apollo-select-font-size);}
.apollo-select-multiple .apollo-select-content-item{line-height:1;max-width:calc(100% - 4px);}
.apollo-select-multiple .apollo-select-content .apollo-select-content-item-prefix+.apollo-select-content-item-suffix,.apollo-select-multiple .apollo-select-content .apollo-select-content-item-suffix:first-child{margin-inline-start:var(--apollo-select-multi-item-padding-horizontal);}
.apollo-select-multiple .apollo-select-content .apollo-select-selection-item{line-height:calc(var(--apollo-select-multi-item-height) - var(--apollo-line-width) * 2);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-select-multi-item-border-color);display:flex;margin-block:var(--apollo-select-internal_fixed_item_margin);margin-inline-end:calc(var(--apollo-select-internal_fixed_item_margin) * 2);background:var(--apollo-select-multi-item-background);border-radius:var(--apollo-select-multi-item-border-radius);padding-inline-start:var(--apollo-padding-xs);padding-inline-end:var(--apollo-padding-xxs);transition:height var(--apollo-motion-duration-slow),line-height var(--apollo-motion-duration-slow),padding var(--apollo-motion-duration-slow);}
.apollo-select-multiple .apollo-select-content .apollo-select-selection-item-content{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-inline-end:var(--apollo-padding-xxs);}
.apollo-select-multiple .apollo-select-content .apollo-select-selection-item-remove{display:inline-flex;align-items:center;color:var(--apollo-color-icon);font-style:normal;line-height:inherit;text-align:center;text-transform:none;vertical-align:-0.125em;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-weight:bold;font-size:10px;cursor:pointer;}
.apollo-select-multiple .apollo-select-content .apollo-select-selection-item-remove >*{line-height:1;}
.apollo-select-multiple .apollo-select-content .apollo-select-selection-item-remove svg{display:inline-block;vertical-align:inherit;}
.apollo-select-multiple .apollo-select-content .apollo-select-selection-item-remove >.apollo-icon{vertical-align:-0.2em;}
.apollo-select-multiple .apollo-select-content .apollo-select-selection-item-remove:hover{color:var(--apollo-color-icon-hover);}
.apollo-select-multiple .apollo-select-content .apollo-select-input{line-height:calc(var(--apollo-select-internal_fixed_item_margin) * 2 + var(--apollo-select-multi-item-height));width:calc(var(--select-input-width, 0) * 1px);min-width:4px;max-width:100%;transition:line-height var(--apollo-motion-duration-slow);}
.apollo-select-multiple.apollo-select-sm{--apollo-select-multi-item-height:var(--apollo-select-multiple-item-height-sm);--apollo-select-multi-item-border-radius:var(--apollo-border-radius-xs);}
.apollo-select-multiple.apollo-select-lg{--apollo-select-multi-item-height:var(--apollo-select-multiple-item-height-lg);--apollo-select-multi-item-border-radius:var(--apollo-border-radius);}
.apollo-select-multiple.apollo-select-filled{--apollo-select-multi-item-border-color:var(--apollo-color-split);--apollo-select-multi-item-background:var(--apollo-color-bg-container);}
.apollo-select-multiple.apollo-select-filled.apollo-select-disabled{--apollo-select-multi-item-border-color:transparent;}
.apollo-select.apollo-select-outlined{--apollo-select-border-color:var(--apollo-color-border);--apollo-select-background-color:var(--apollo-select-selector-bg);}
.apollo-select.apollo-select-outlined:not(.apollo-select-disabled):hover{--apollo-select-border-color:var(--apollo-select-hover-border-color);--apollo-select-background-color:var(--apollo-select-selector-bg);}
.apollo-select.apollo-select-outlined:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:var(--apollo-select-active-border-color);--apollo-select-background-color:var(--apollo-select-selector-bg);box-shadow:0 0 0 var(--apollo-control-outline-width) var(--apollo-select-active-outline-color);}
.apollo-select.apollo-select-outlined.apollo-select-disabled{--apollo-select-border-color:var(--apollo-color-border-disabled);}
.apollo-select.apollo-select-outlined.apollo-select-status-error{--apollo-select-border-color:var(--apollo-color-error);--apollo-select-background-color:var(--apollo-select-selector-bg);--apollo-select-affix-color:var(--apollo-color-error-affix);}
.apollo-select.apollo-select-outlined.apollo-select-status-error:not(.apollo-select-disabled):hover{--apollo-select-border-color:var(--apollo-color-error-border-hover);--apollo-select-background-color:var(--apollo-select-selector-bg);}
.apollo-select.apollo-select-outlined.apollo-select-status-error:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:var(--apollo-color-error);--apollo-select-background-color:var(--apollo-select-selector-bg);box-shadow:0 0 0 var(--apollo-control-outline-width) var(--apollo-color-error-outline);}
.apollo-select.apollo-select-outlined.apollo-select-status-error.apollo-select-disabled{--apollo-select-border-color:var(--apollo-color-border-disabled);}
.apollo-select.apollo-select-outlined.apollo-select-status-warning{--apollo-select-border-color:var(--apollo-color-warning);--apollo-select-background-color:var(--apollo-select-selector-bg);--apollo-select-affix-color:var(--apollo-color-warning-affix);}
.apollo-select.apollo-select-outlined.apollo-select-status-warning:not(.apollo-select-disabled):hover{--apollo-select-border-color:var(--apollo-color-warning-hover);--apollo-select-background-color:var(--apollo-select-selector-bg);}
.apollo-select.apollo-select-outlined.apollo-select-status-warning:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:var(--apollo-color-warning);--apollo-select-background-color:var(--apollo-select-selector-bg);box-shadow:0 0 0 var(--apollo-control-outline-width) var(--apollo-color-warning-outline);}
.apollo-select.apollo-select-outlined.apollo-select-status-warning.apollo-select-disabled{--apollo-select-border-color:var(--apollo-color-border-disabled);}
.apollo-select.apollo-select-filled{--apollo-select-border-color:transparent;--apollo-select-background-color:var(--apollo-color-fill-tertiary);}
.apollo-select.apollo-select-filled:not(.apollo-select-disabled):hover{--apollo-select-border-color:transparent;--apollo-select-background-color:var(--apollo-color-fill-secondary);}
.apollo-select.apollo-select-filled:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:var(--apollo-select-active-border-color);--apollo-select-background-color:var(--apollo-color-bg-container);box-shadow:0 0 0 var(--apollo-control-outline-width) transparent;}
.apollo-select.apollo-select-filled.apollo-select-disabled{--apollo-select-border-color:var(--apollo-color-border-disabled);--apollo-select-background-color:var(--apollo-color-fill-tertiary);}
.apollo-select.apollo-select-filled.apollo-select-status-error{--apollo-select-border-color:transparent;--apollo-select-background-color:var(--apollo-color-error-bg);}
.apollo-select.apollo-select-filled.apollo-select-status-error:not(.apollo-select-disabled):hover{--apollo-select-border-color:transparent;--apollo-select-background-color:var(--apollo-color-error-bg-hover);}
.apollo-select.apollo-select-filled.apollo-select-status-error:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:var(--apollo-color-error);--apollo-select-background-color:var(--apollo-color-bg-container);box-shadow:0 0 0 var(--apollo-control-outline-width) transparent;}
.apollo-select.apollo-select-filled.apollo-select-status-error.apollo-select-disabled{--apollo-select-border-color:var(--apollo-color-border-disabled);--apollo-select-background-color:var(--apollo-color-error-bg);}
.apollo-select.apollo-select-filled.apollo-select-status-warning{--apollo-select-border-color:transparent;--apollo-select-background-color:var(--apollo-color-warning-bg);}
.apollo-select.apollo-select-filled.apollo-select-status-warning:not(.apollo-select-disabled):hover{--apollo-select-border-color:transparent;--apollo-select-background-color:var(--apollo-color-warning-bg-hover);}
.apollo-select.apollo-select-filled.apollo-select-status-warning:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:var(--apollo-color-warning);--apollo-select-background-color:var(--apollo-color-bg-container);box-shadow:0 0 0 var(--apollo-control-outline-width) transparent;}
.apollo-select.apollo-select-filled.apollo-select-status-warning.apollo-select-disabled{--apollo-select-border-color:var(--apollo-color-border-disabled);--apollo-select-background-color:var(--apollo-color-warning-bg);}
.apollo-select.apollo-select-borderless{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;}
.apollo-select.apollo-select-borderless:not(.apollo-select-disabled):hover{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;}
.apollo-select.apollo-select-borderless:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;box-shadow:0 0 0 var(--apollo-control-outline-width) transparent;}
.apollo-select.apollo-select-borderless.apollo-select-disabled{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;}
.apollo-select.apollo-select-borderless.apollo-select-status-error{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;}
.apollo-select.apollo-select-borderless.apollo-select-status-error:not(.apollo-select-disabled):hover{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;}
.apollo-select.apollo-select-borderless.apollo-select-status-error:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;box-shadow:0 0 0 var(--apollo-control-outline-width) transparent;}
.apollo-select.apollo-select-borderless.apollo-select-status-error.apollo-select-disabled{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;}
.apollo-select.apollo-select-borderless.apollo-select-status-warning{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;}
.apollo-select.apollo-select-borderless.apollo-select-status-warning:not(.apollo-select-disabled):hover{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;}
.apollo-select.apollo-select-borderless.apollo-select-status-warning:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;box-shadow:0 0 0 var(--apollo-control-outline-width) transparent;}
.apollo-select.apollo-select-borderless.apollo-select-status-warning.apollo-select-disabled{--apollo-select-border-color:transparent;--apollo-select-background-color:transparent;}
.apollo-select.apollo-select-borderless:not(.apollo-select-disabled):has(input:focus-visible),.apollo-select.apollo-select-borderless:not(.apollo-select-disabled):has(textarea:focus-visible){outline:var(--apollo-select-line-width-focus) var(--apollo-line-type) var(--apollo-select-active-border-color);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}
.apollo-select.apollo-select-borderless.apollo-select-status-error:not(.apollo-select-disabled):has(input:focus-visible),.apollo-select.apollo-select-borderless.apollo-select-status-error:not(.apollo-select-disabled):has(textarea:focus-visible){outline:var(--apollo-select-line-width-focus) var(--apollo-line-type) var(--apollo-color-error);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}
.apollo-select.apollo-select-borderless.apollo-select-status-warning:not(.apollo-select-disabled):has(input:focus-visible),.apollo-select.apollo-select-borderless.apollo-select-status-warning:not(.apollo-select-disabled):has(textarea:focus-visible){outline:var(--apollo-select-line-width-focus) var(--apollo-line-type) var(--apollo-color-warning);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}
.apollo-select.apollo-select-underlined{--apollo-select-border-color:var(--apollo-color-border);--apollo-select-background-color:var(--apollo-select-selector-bg);border-radius:0;border-top-color:transparent;border-inline-color:transparent;}
.apollo-select.apollo-select-underlined:not(.apollo-select-disabled):hover{--apollo-select-border-color:var(--apollo-select-hover-border-color);--apollo-select-background-color:var(--apollo-select-selector-bg);}
.apollo-select.apollo-select-underlined:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:var(--apollo-select-active-border-color);--apollo-select-background-color:var(--apollo-select-selector-bg);box-shadow:0 0 0 var(--apollo-control-outline-width) transparent;}
.apollo-select.apollo-select-underlined.apollo-select-disabled{--apollo-select-border-color:var(--apollo-color-border);}
.apollo-select.apollo-select-underlined.apollo-select-status-error{--apollo-select-border-color:var(--apollo-color-error);--apollo-select-background-color:var(--apollo-select-selector-bg);}
.apollo-select.apollo-select-underlined.apollo-select-status-error:not(.apollo-select-disabled):hover{--apollo-select-border-color:var(--apollo-color-error-border-hover);--apollo-select-background-color:var(--apollo-select-selector-bg);}
.apollo-select.apollo-select-underlined.apollo-select-status-error:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:var(--apollo-color-error);--apollo-select-background-color:var(--apollo-select-selector-bg);box-shadow:0 0 0 var(--apollo-control-outline-width) transparent;}
.apollo-select.apollo-select-underlined.apollo-select-status-error.apollo-select-disabled{--apollo-select-border-color:var(--apollo-color-error);}
.apollo-select.apollo-select-underlined.apollo-select-status-warning{--apollo-select-border-color:var(--apollo-color-warning);--apollo-select-background-color:var(--apollo-select-selector-bg);}
.apollo-select.apollo-select-underlined.apollo-select-status-warning:not(.apollo-select-disabled):hover{--apollo-select-border-color:var(--apollo-color-warning-hover);--apollo-select-background-color:var(--apollo-select-selector-bg);}
.apollo-select.apollo-select-underlined.apollo-select-status-warning:not(.apollo-select-disabled).apollo-select-focused{--apollo-select-border-color:var(--apollo-color-warning);--apollo-select-background-color:var(--apollo-select-selector-bg);box-shadow:0 0 0 var(--apollo-control-outline-width) transparent;}
.apollo-select.apollo-select-underlined.apollo-select-status-warning.apollo-select-disabled{--apollo-select-border-color:var(--apollo-color-warning);}
.apollo-select.apollo-select-customize{border:0;padding:0;font-size:inherit;line-height:inherit;}
.apollo-select.apollo-select-customize .apollo-select-placeholder{display:none;}
.apollo-select.apollo-select-customize .apollo-select-content{margin:0;padding:0;}
.apollo-select.apollo-select-customize .apollo-select-content-value{display:none;}
.apollo-select.apollo-select-customize.apollo-select-filled .apollo-select-content .apollo-input-filled{background:transparent;}
.apollo-select.apollo-select-customize.apollo-select-disabled .apollo-select-content >input[disabled],.apollo-select.apollo-select-customize.apollo-select-disabled .apollo-select-content >textarea[disabled],.apollo-select.apollo-select-customize.apollo-select-disabled .apollo-select-content >.apollo-select-input,.apollo-select.apollo-select-customize.apollo-select-disabled .apollo-select-content >.apollo-input-affix-wrapper-disabled,.apollo-select.apollo-select-customize.apollo-select-disabled .apollo-select-content >.apollo-input-search{background:transparent;}
.apollo-select.apollo-select-customize.apollo-select-disabled .apollo-select-content input[disabled],.apollo-select.apollo-select-customize.apollo-select-disabled .apollo-select-content textarea[disabled]{background:transparent;}
.apollo-icon{display:inline-flex;align-items:center;color:inherit;font-style:normal;line-height:0;text-align:center;text-transform:none;vertical-align:-0.125em;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
.apollo-icon >*{line-height:1;}
.apollo-icon svg{display:inline-block;vertical-align:inherit;}
.apollo-icon::before{display:none;}
.apollo-icon[tabindex]{cursor:pointer;}
.apollo-icon .apollo-icon-icon{display:block;}
`;

/** 生成单个前缀下的完整样式。 */
export function genSelectStyle(prefixCls: string = 'apollo', targetPrefixCls?: string): string {
  // targetPrefixCls：**完整目标前缀**（如 'apollo-cascader'）——Cascader 复用 select
  // 全套外壳样式时，antd 的做法就是 `useSelectStyle(cascaderPrefixCls)`（按传入前缀
  // 生成全套规则）。不传则沿用旧的 `-select` 后缀模式（向后兼容）。
  const target = targetPrefixCls ?? `${prefixCls}-select`;
  const rename = (cssText: string): string =>
    prefixCls === target ? cssText : cssText.split('.apollo-select').join(`.${target}`);
  // ⚠️ 下拉是 Portal 的（不在 .apollo-select 子树内），antd 靠 popupClassName 里的
  //    `css-var` 类让浮层也拿到组件变量 —— DECLS 必须同时落在根形态与 css-var 类上。
  const decls =
    prefixCls === target
      ? `.apollo-select,.apollo-select-css-var{${DECLS}}`
      : `.${target},.${target}-css-var{${DECLS}}`;
  return `${KEYFRAMES}
${MOTION_BASE}
${decls}
${rename(RULES)}`;
}
