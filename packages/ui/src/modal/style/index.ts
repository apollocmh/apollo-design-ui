/**
 * modal 的静态样式（G4 产物）。
 *
 * 来源：antd 6.6.4 的 cssinjs 产物（`extractStyle`，提取脚本
 * `tests/visual/debug/extract-modal.mjs` —— React SSR + 括号配平提取，**机械转换**）：
 *   `:where(.css-dev-only-do-not-override-*)` / `.css-var-_R_x_` 前缀剥离 →
 *   `.ant-*` 改 `.apollo-*`（含 `.anticon` → `.apollo-icon`，D15）、
 *   `--ant-*` 改 `--apollo-*` → 动效 keyframes 换稳定名。
 * **不做人肉转写**。
 *
 * 覆盖面（提取时的渲染组合）：
 *   1. `_InternalPanelDoNotUseOrYouWillBeFired`（PurePanel）普通面板 + 5 种 confirm 形态
 *      ⇒ `-pure-panel` / `-container` / `-header` / `-title` / `-body` / `-footer` /
 *        `-close` / `-confirm-*`
 *   2. 内联打开的 `<Modal open getContainer={false} centered loading width={对象}>`
 *      + `direction: 'rtl'`（逼出 `-wrap-rtl`）
 *      ⇒ `-root` / `-wrap` / `-mask` / `-mask-blur` / `-centered` /
 *        `-body-skeleton` / 响应式 `--{p}-{bp}-width` / zoom + fade 动效
 *
 * ⚠️ 三处必须逐字保留的上游事实：
 *   1. **变量声明块的宿主是 `.{p}-modal`（面板）而不是 `.{p}-modal-root`** ——
 *      PurePanel 渲染的是 `{p}-pure-panel {p}-modal`，**没有 root**；
 *      挂在面板上才能覆盖全部根形态（PITFALLS 171 / D69 同判）；
 *   2. `.{p}-modal .{p}-modal-hidden` 是上游的**死规则**（rc-dialog 的 Mask 用的是
 *      `{p}-mask-hidden` 且 `removeOnLeave` 默认 true ⇒ 离场后直接卸载）——
 *      照抄保留，不改写（差异 D5：不复制 hash 包裹层，但保留规则本身）；
 *   3. 响应式宽度规则把 `--{p}-{bp}-width` 串成阶梯（`sm = xs`、`md = sm` …）且
 *      `width: var(--{p}-xs-width)`；这些变量**只在用户传 width 对象时**由组件内联写入，
 *      没有内联值 ⇒ 该声明无效、宽度落回前一条的 `auto`（上游行为）。
 *
 * 声明块挂在 `.apollo-modal` 上；`genModalStyle(prefixCls)` 在出口替换**类名段**
 * （CSS 变量名与 keyframes 名**不随前缀变**，与 drawer / dropdown 同约定）。
 */

/** 组件变量声明（对拍 antd 的 `.ant-modal-css-var` 块，原序字面量；18 键）。 */
export function genModalTokenDecls(): string {
  return DECLS;
}

/** 组件变量声明块。 */
const DECLS = `--apollo-modal-footer-bg:transparent;--apollo-modal-header-bg:transparent;--apollo-modal-title-line-height:1.5;--apollo-modal-title-font-size:16px;--apollo-modal-content-bg:#ffffff;--apollo-modal-title-color:rgba(0,0,0,0.88);--apollo-modal-content-padding:20px 24px;--apollo-modal-header-padding:0px;--apollo-modal-header-border-bottom:none;--apollo-modal-header-margin-bottom:8px;--apollo-modal-body-padding:0px;--apollo-modal-footer-padding:0px;--apollo-modal-footer-border-top:none;--apollo-modal-footer-border-radius:0px;--apollo-modal-footer-margin-top:12px;--apollo-modal-confirm-body-padding:0px;--apollo-modal-confirm-icon-margin-inline-end:12px;--apollo-modal-confirm-btns-margin-top:12px;`;

/** antd motion 的 @keyframes（稳定命名，原序；loadingCircle 属 Skeleton，已删）。 */
const KEYFRAMES = `@keyframes apollo-modal-fade-in{0%{opacity:0;}100%{opacity:1;}}
@keyframes apollo-modal-fade-out{0%{opacity:1;}100%{opacity:0;}}
@keyframes apollo-modal-zoom-in{0%{transform:scale(0.2);opacity:0;}100%{transform:scale(1);opacity:1;}}
@keyframes apollo-modal-zoom-out{0%{transform:scale(1);}100%{transform:scale(0.2);opacity:0;}}`;

/** antd 产物机械转换段（66 条，原序）。 */
const RULES = `.apollo-modal-confirm-rtl{direction:rtl;}
.apollo-modal-confirm .apollo-modal-header{display:none;}
.apollo-modal-confirm .apollo-modal-confirm-body-wrapper::before{display:table;content:"";}
.apollo-modal-confirm .apollo-modal-confirm-body-wrapper::after{display:table;clear:both;content:"";}
.apollo-modal-confirm.apollo-modal .apollo-modal-body{padding:var(--apollo-modal-confirm-body-padding);}
.apollo-modal-confirm .apollo-modal-confirm-body{display:flex;flex-wrap:nowrap;align-items:start;}
.apollo-modal-confirm .apollo-modal-confirm-body >.apollo-icon{flex:none;font-size:var(--apollo-font-height);margin-inline-end:var(--apollo-modal-confirm-icon-margin-inline-end);margin-top:calc(calc(var(--apollo-font-height) - var(--apollo-font-height)) / 2);}
.apollo-modal-confirm .apollo-modal-confirm-body-has-title>.apollo-icon{margin-top:calc(calc(calc(var(--apollo-modal-title-font-size) * var(--apollo-modal-title-line-height)) - var(--apollo-font-height)) / 2);}
.apollo-modal-confirm .apollo-modal-confirm-paragraph{display:flex;flex-direction:column;flex:auto;row-gap:var(--apollo-margin-xs);max-width:calc(100% - var(--apollo-margin-sm));}
.apollo-modal-confirm .apollo-modal-confirm-body-no-icon .apollo-modal-confirm-paragraph{max-width:100%;}
.apollo-modal-confirm .apollo-icon+.apollo-modal-confirm-paragraph{max-width:calc(100% - calc(var(--apollo-font-height) + var(--apollo-margin-sm)));}
.apollo-modal-confirm .apollo-modal-confirm-title{color:var(--apollo-color-text-heading);font-weight:var(--apollo-font-weight-strong);font-size:var(--apollo-modal-title-font-size);line-height:var(--apollo-modal-title-line-height);}
.apollo-modal-confirm .apollo-modal-confirm-container{color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);}
.apollo-modal-confirm .apollo-modal-confirm-btns{text-align:end;margin-top:var(--apollo-modal-confirm-btns-margin-top);}
.apollo-modal-confirm .apollo-modal-confirm-btns .apollo-btn+.apollo-btn{margin-bottom:0;margin-inline-start:var(--apollo-margin-xs);}
.apollo-modal-confirm-error .apollo-modal-confirm-body>.apollo-icon{color:var(--apollo-color-error);}
.apollo-modal-confirm-warning .apollo-modal-confirm-body>.apollo-icon,.apollo-modal-confirm-confirm .apollo-modal-confirm-body>.apollo-icon{color:var(--apollo-color-warning);}
.apollo-modal-confirm-info .apollo-modal-confirm-body>.apollo-icon{color:var(--apollo-color-info);}
.apollo-modal-confirm-success .apollo-modal-confirm-body>.apollo-icon{color:var(--apollo-color-success);}
.apollo-modal [class^="apollo-modal"],.apollo-modal [class*=" apollo-modal"]{box-sizing:border-box;}
.apollo-modal [class^="apollo-modal"]::before,.apollo-modal [class*=" apollo-modal"]::before,.apollo-modal [class^="apollo-modal"]::after,.apollo-modal [class*=" apollo-modal"]::after{box-sizing:border-box;}
.apollo-modal-root .apollo-modal-wrap-rtl{direction:rtl;}
.apollo-modal-root .apollo-modal-centered{text-align:center;}
.apollo-modal-root .apollo-modal-centered::before{display:inline-block;width:0;height:100%;vertical-align:middle;content:"";}
.apollo-modal-root .apollo-modal-centered .apollo-modal{top:0;display:inline-block;padding-bottom:0;text-align:start;vertical-align:middle;}
@media (max-width: 767px){.apollo-modal-root .apollo-modal{max-width:calc(100vw - 16px);margin:var(--apollo-margin-xs) auto;}.apollo-modal-root .apollo-modal-centered .apollo-modal{flex:1;}}
.apollo-modal{box-sizing:border-box;margin:0 auto;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);pointer-events:none;position:relative;top:100px;width:auto;max-width:calc(100vw - calc(var(--apollo-margin) * 2));}
.apollo-modal:focus-visible{border-radius:var(--apollo-border-radius-lg);outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-modal .apollo-modal-title{margin:0;color:var(--apollo-modal-title-color);font-weight:var(--apollo-font-weight-strong);font-size:var(--apollo-modal-title-font-size);line-height:var(--apollo-modal-title-line-height);word-wrap:break-word;}
.apollo-modal .apollo-modal-container{position:relative;background-color:var(--apollo-modal-content-bg);background-clip:padding-box;border:0;border-radius:var(--apollo-border-radius-lg);box-shadow:var(--apollo-box-shadow);pointer-events:auto;padding:var(--apollo-modal-content-padding);}
.apollo-modal .apollo-modal-close{position:absolute;top:calc((calc(calc(var(--apollo-line-height-heading-5) * var(--apollo-font-size-heading-5)) + calc(var(--apollo-padding) * 2)) - var(--apollo-control-height)) / 2);inset-inline-end:calc((calc(calc(var(--apollo-line-height-heading-5) * var(--apollo-font-size-heading-5)) + calc(var(--apollo-padding) * 2)) - var(--apollo-control-height)) / 2);z-index:calc(var(--apollo-z-index-popup-base) + 10);padding:0;color:var(--apollo-color-icon);font-weight:var(--apollo-font-weight-strong);line-height:1;text-decoration:none;background:transparent;border-radius:var(--apollo-border-radius-sm);width:var(--apollo-control-height);height:var(--apollo-control-height);border:0;outline:0;cursor:pointer;transition:color var(--apollo-motion-duration-mid),background-color var(--apollo-motion-duration-mid);}
.apollo-modal .apollo-modal-close-x{display:flex;font-size:var(--apollo-font-size-lg);font-style:normal;line-height:var(--apollo-control-height);justify-content:center;text-transform:none;text-rendering:auto;}
.apollo-modal .apollo-modal-close:disabled{pointer-events:none;}
.apollo-modal .apollo-modal-close:hover{color:var(--apollo-color-icon-hover);background-color:var(--apollo-color-bg-text-hover);text-decoration:none;}
.apollo-modal .apollo-modal-close:active{background-color:var(--apollo-color-bg-text-active);}
.apollo-modal .apollo-modal-close:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-modal .apollo-modal-header{color:var(--apollo-color-text);background:var(--apollo-modal-header-bg);border-radius:var(--apollo-border-radius-lg) var(--apollo-border-radius-lg) 0 0;margin-bottom:var(--apollo-modal-header-margin-bottom);padding:var(--apollo-modal-header-padding);border-bottom:var(--apollo-modal-header-border-bottom);}
.apollo-modal .apollo-modal-body{font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);word-wrap:break-word;padding:var(--apollo-modal-body-padding);}
.apollo-modal .apollo-modal-body .apollo-modal-body-skeleton{width:100%;height:100%;display:flex;justify-content:center;align-items:center;margin:var(--apollo-margin) auto;}
.apollo-modal .apollo-modal-footer{text-align:end;background:var(--apollo-modal-footer-bg);margin-top:var(--apollo-modal-footer-margin-top);padding:var(--apollo-modal-footer-padding);border-top:var(--apollo-modal-footer-border-top);border-radius:var(--apollo-modal-footer-border-radius);}
.apollo-modal .apollo-modal-footer >.apollo-btn+.apollo-btn{margin-inline-start:var(--apollo-margin-xs);}
.apollo-modal .apollo-modal-open{overflow:hidden;}
.apollo-modal-pure-panel{top:auto;padding:0;display:flex;flex-direction:column;}
.apollo-modal-pure-panel .apollo-modal-container,.apollo-modal-pure-panel .apollo-modal-body,.apollo-modal-pure-panel .apollo-modal-confirm-body-wrapper{display:flex;flex-direction:column;flex:auto;}
.apollo-modal-pure-panel .apollo-modal-confirm-body{margin-bottom:auto;}
.apollo-modal-root .apollo-modal-wrap-rtl{direction:rtl;}
.apollo-modal-root .apollo-modal-wrap-rtl .apollo-modal-confirm-body{direction:rtl;}
.apollo-modal-root .apollo-modal.apollo-zoom-enter,.apollo-modal-root .apollo-modal.apollo-zoom-appear{transform:none;opacity:0;animation-duration:var(--apollo-motion-duration-slow);user-select:none;}
.apollo-modal-root .apollo-modal.apollo-zoom-leave .apollo-modal-container{pointer-events:none;}
.apollo-modal-root .apollo-modal-mask{position:fixed;inset:0;z-index:var(--apollo-z-index-popup-base);height:100%;background-color:var(--apollo-color-bg-mask);pointer-events:none;}
.apollo-modal-root .apollo-modal-mask.apollo-modal-mask-blur{backdrop-filter:blur(4px);}
.apollo-modal-root .apollo-modal-mask .apollo-modal-hidden{display:none;}
.apollo-modal-root .apollo-modal-wrap{position:fixed;inset:0;z-index:var(--apollo-z-index-popup-base);overflow:auto;outline:0;-webkit-overflow-scrolling:touch;}
.apollo-modal-root .apollo-fade-enter,.apollo-modal-root .apollo-fade-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-modal-root .apollo-fade-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-modal-root .apollo-fade-enter.apollo-fade-enter-active,.apollo-modal-root .apollo-fade-appear.apollo-fade-appear-active{animation-name:apollo-modal-fade-in;animation-play-state:running;}
.apollo-modal-root .apollo-fade-leave.apollo-fade-leave-active{animation-name:apollo-modal-fade-out;animation-play-state:running;pointer-events:none;}
.apollo-modal-root .apollo-fade-enter,.apollo-modal-root .apollo-fade-appear{opacity:0;animation-timing-function:linear;}
.apollo-modal-root .apollo-fade-leave{animation-timing-function:linear;}
.apollo-zoom-enter,.apollo-zoom-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-zoom-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-zoom-enter.apollo-zoom-enter-active,.apollo-zoom-appear.apollo-zoom-appear-active{animation-name:apollo-modal-zoom-in;animation-play-state:running;}
.apollo-zoom-leave.apollo-zoom-leave-active{animation-name:apollo-modal-zoom-out;animation-play-state:running;pointer-events:none;}
.apollo-zoom-enter,.apollo-zoom-appear{transform:scale(0);opacity:0;animation-timing-function:var(--apollo-motion-ease-out-circ);}
.apollo-zoom-enter-prepare,.apollo-zoom-appear-prepare{transform:none;}
.apollo-zoom-leave{animation-timing-function:var(--apollo-motion-ease-in-out-circ);}
.apollo-modal-root .apollo-modal{--apollo-modal-sm-width:var(--apollo-modal-xs-width);--apollo-modal-md-width:var(--apollo-modal-sm-width);--apollo-modal-lg-width:var(--apollo-modal-md-width);--apollo-modal-xl-width:var(--apollo-modal-lg-width);--apollo-modal-xxl-width:var(--apollo-modal-xl-width);--apollo-modal-xxxl-width:var(--apollo-modal-xxl-width);width:var(--apollo-modal-xs-width);}
@media (min-width: 576px){.apollo-modal-root .apollo-modal{width:var(--apollo-modal-sm-width);}}
@media (min-width: 768px){.apollo-modal-root .apollo-modal{width:var(--apollo-modal-md-width);}}
@media (min-width: 992px){.apollo-modal-root .apollo-modal{width:var(--apollo-modal-lg-width);}}
@media (min-width: 1200px){.apollo-modal-root .apollo-modal{width:var(--apollo-modal-xl-width);}}
@media (min-width: 1600px){.apollo-modal-root .apollo-modal{width:var(--apollo-modal-xxl-width);}}
@media (min-width: 1920px){.apollo-modal-root .apollo-modal{width:var(--apollo-modal-xxxl-width);}}`;

/** 生成单个前缀下的完整样式（约定出口：ant 前缀在出口替换类名段）。 */
export function genModalStyle(prefixCls: string = 'apollo'): string {
  const rename = (cssText: string): string =>
    prefixCls === 'apollo' ? cssText : cssText.split('.apollo-modal').join(`.${prefixCls}-modal`);
  const declsText =
    prefixCls === 'apollo' ? `.apollo-modal{${DECLS}}` : `.${prefixCls}-modal{${DECLS}}`;
  return `${KEYFRAMES}
${declsText}
${rename(RULES)}`;
}
