/**
 * drawer 的静态样式（G4 产物）。
 *
 * 来源：antd 6.6.4 的 cssinjs 产物（`extractStyle`，触发方式见下），经机械转换：
 *   `:where(.css-dev-only-do-not-override-*)` / `.css-var-*` 前缀剥离 →
 *   `ant-` 改 `apollo-` → `--ant-*` 改 `--apollo-*`。**不做人肉转写**。
 *
 * ⚠️ 提取方式（drawer 是普通组件，不是命令式）：
 *   `Drawer._InternalPanelDoNotUseOrYouWillBeFired` **四个方位各渲染一次**
 *   （PurePanel 自己调 `useStyle` 且不 portal ⇒ SSR 拿得到）+ 一个 `open` 的内联
 *   `<Drawer getContainer={false}>`（把 `-mask` / `-content-wrapper` / `-open`
 *   这些只在打开态出现的规则逼出来）+ 一个 `resizable` 的（逼出 `-resizable-*`）。
 *
 * ⚠️ 两处必须逐字保留的上游事实：
 *   1. 尺寸轴随方位切换 —— `-left`/`-right` 用 `width`、`-top`/`-bottom` 用 `height`，
 *      且 `-content-wrapper` 的 `transform` 是四个方位各一套（动效与 push 都靠它）；
 *   2. `-content-wrapper-hidden`（`leavedClassName`）是「离开动效结束后的兜底类」，
 *      由 rc 侧的 `CSSMotion` 挂上，**不是** CSS 自己声明的 —— 删掉它会让关闭后的
 *      面板重新可见。
 *
 * 声明块挂在 `.apollo-drawer` 上（PurePanel 的根类里**含** `{p}-drawer` ⇒ 同一份覆盖）。
 */

/** 组件变量声明（对拍 antd 的 `.ant-drawer-css-var` 块，原序字面量）。 */
const DECLS = `--apollo-drawer-z-index-popup:1000;--apollo-drawer-footer-padding-block:8px;--apollo-drawer-footer-padding-inline:16px;--apollo-drawer-dragger-size:4px;`;

/** 组件变量声明块（出口：构建期写进 CSS，L7 逐字对拍）。 */
export function genDrawerTokenDecls(): string {
  return DECLS;
}

/** 规则集（原序，逐条来自 antd 产物）。 */
const RULES = `
.apollo-drawer{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}
.apollo-drawer::before,.apollo-drawer::after{box-sizing:border-box;}
.apollo-drawer [class^="apollo-drawer"],.apollo-drawer [class*=" apollo-drawer"]{box-sizing:border-box;}
.apollo-drawer [class^="apollo-drawer"]::before,.apollo-drawer [class*=" apollo-drawer"]::before,.apollo-drawer [class^="apollo-drawer"]::after,.apollo-drawer [class*=" apollo-drawer"]::after{box-sizing:border-box;}
.apollo-drawer{position:fixed;inset:0;z-index:var(--apollo-drawer-z-index-popup);pointer-events:none;color:var(--apollo-color-text);}
.apollo-drawer-pure{position:relative;background:var(--apollo-color-bg-elevated);display:flex;flex-direction:column;pointer-events:auto;}
.apollo-drawer-pure.apollo-drawer-left{box-shadow:var(--apollo-box-shadow-drawer-left);}
.apollo-drawer-pure.apollo-drawer-right{box-shadow:var(--apollo-box-shadow-drawer-right);}
.apollo-drawer-pure.apollo-drawer-top{box-shadow:var(--apollo-box-shadow-drawer-up);}
.apollo-drawer-pure.apollo-drawer-bottom{box-shadow:var(--apollo-box-shadow-drawer-down);}
.apollo-drawer-inline{position:absolute;}
.apollo-drawer .apollo-drawer-mask{position:absolute;inset:0;z-index:var(--apollo-drawer-z-index-popup);background:var(--apollo-color-bg-mask);pointer-events:auto;}
.apollo-drawer .apollo-drawer-mask.apollo-drawer-mask-blur{backdrop-filter:blur(4px);}
.apollo-drawer .apollo-drawer-content-wrapper{position:absolute;z-index:var(--apollo-drawer-z-index-popup);max-width:100vw;transition:all var(--apollo-motion-duration-slow);}
.apollo-drawer .apollo-drawer-content-wrapper-hidden{display:none;}
.apollo-drawer-left>.apollo-drawer-content-wrapper{top:0;bottom:0;left:0;box-shadow:var(--apollo-box-shadow-drawer-left);}
.apollo-drawer-right>.apollo-drawer-content-wrapper{top:0;right:0;bottom:0;box-shadow:var(--apollo-box-shadow-drawer-right);}
.apollo-drawer-top>.apollo-drawer-content-wrapper{top:0;inset-inline:0;box-shadow:var(--apollo-box-shadow-drawer-up);}
.apollo-drawer-bottom>.apollo-drawer-content-wrapper{bottom:0;inset-inline:0;box-shadow:var(--apollo-box-shadow-drawer-down);}
.apollo-drawer .apollo-drawer-section{display:flex;flex-direction:column;width:100%;height:100%;overflow:auto;background:var(--apollo-color-bg-elevated);pointer-events:auto;}
.apollo-drawer .apollo-drawer-header{display:flex;flex:0;align-items:center;padding:var(--apollo-padding) var(--apollo-padding-lg);font-size:var(--apollo-font-size-lg);line-height:var(--apollo-line-height-lg);border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
.apollo-drawer .apollo-drawer-header-title{display:flex;flex:1;align-items:center;min-width:0;min-height:0;}
.apollo-drawer .apollo-drawer-extra{flex:none;}
.apollo-drawer .apollo-drawer-close{display:inline-flex;width:calc(var(--apollo-font-size-lg) + var(--apollo-padding-xs));height:calc(var(--apollo-font-size-lg) + var(--apollo-padding-xs));border-radius:var(--apollo-border-radius-sm);justify-content:center;align-items:center;color:var(--apollo-color-icon);font-weight:var(--apollo-font-weight-strong);font-size:var(--apollo-font-size-lg);font-style:normal;line-height:1;text-align:center;text-transform:none;text-decoration:none;background:transparent;border:0;cursor:pointer;transition:all var(--apollo-motion-duration-mid);text-rendering:auto;}
.apollo-drawer .apollo-drawer-close.apollo-drawer-close-end{margin-inline-start:var(--apollo-margin-xs);}
.apollo-drawer .apollo-drawer-close:not(.apollo-drawer-close-end){margin-inline-end:var(--apollo-margin-xs);}
.apollo-drawer .apollo-drawer-close:disabled{pointer-events:none;}
.apollo-drawer .apollo-drawer-close:hover{color:var(--apollo-color-icon-hover);background-color:var(--apollo-color-bg-text-hover);text-decoration:none;}
.apollo-drawer .apollo-drawer-close:active{background-color:var(--apollo-color-bg-text-active);}
.apollo-drawer .apollo-drawer-close:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-drawer .apollo-drawer-title{flex:1;margin:0;font-weight:var(--apollo-font-weight-strong);font-size:var(--apollo-font-size-lg);line-height:var(--apollo-line-height-lg);}
.apollo-drawer .apollo-drawer-body{flex:1;min-width:0;min-height:0;padding:var(--apollo-padding-lg);overflow:auto;}
.apollo-drawer .apollo-drawer-body .apollo-drawer-body-skeleton{width:100%;height:100%;display:flex;justify-content:center;}
.apollo-drawer .apollo-drawer-footer{flex-shrink:0;padding:var(--apollo-drawer-footer-padding-block) var(--apollo-drawer-footer-padding-inline);border-top:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
.apollo-drawer .apollo-drawer-resizable-dragger{position:absolute;z-index:1;background-color:transparent;user-select:none;pointer-events:auto;}
.apollo-drawer .apollo-drawer-resizable-dragger:hover{background-color:var(--apollo-color-primary);opacity:0.2;}
.apollo-drawer .apollo-drawer-resizable-dragger-dragging{background-color:var(--apollo-color-primary);opacity:0.3;}
.apollo-drawer .apollo-drawer-resizable-dragger-left{top:0;bottom:0;right:0;width:var(--apollo-drawer-dragger-size);cursor:col-resize;}
.apollo-drawer .apollo-drawer-resizable-dragger-right{top:0;bottom:0;left:0;width:var(--apollo-drawer-dragger-size);cursor:col-resize;}
.apollo-drawer .apollo-drawer-resizable-dragger-top{inset-inline:0;bottom:0;height:var(--apollo-drawer-dragger-size);cursor:row-resize;}
.apollo-drawer .apollo-drawer-resizable-dragger-bottom{inset-inline:0;top:0;height:var(--apollo-drawer-dragger-size);cursor:row-resize;}
.apollo-drawer .apollo-drawer-content-wrapper-dragging{user-select:none;transition:none;will-change:width,height;}
.apollo-drawer .apollo-drawer-content-wrapper-dragging .apollo-drawer-content{pointer-events:none;}
.apollo-drawer .apollo-drawer-content-wrapper-dragging .apollo-drawer-section{pointer-events:none;}
.apollo-drawer-rtl{direction:rtl;}
.apollo-drawer .apollo-drawer-mask-motion-enter-start,.apollo-drawer .apollo-drawer-mask-motion-appear-start,.apollo-drawer .apollo-drawer-mask-motion-leave-start{transition:none;}
.apollo-drawer .apollo-drawer-mask-motion-enter-active,.apollo-drawer .apollo-drawer-mask-motion-appear-active,.apollo-drawer .apollo-drawer-mask-motion-leave-active{transition:all var(--apollo-motion-duration-slow);}
.apollo-drawer .apollo-drawer-mask-motion-enter,.apollo-drawer .apollo-drawer-mask-motion-appear{opacity:0;}
.apollo-drawer .apollo-drawer-mask-motion-enter-active,.apollo-drawer .apollo-drawer-mask-motion-appear-active{opacity:1;}
.apollo-drawer .apollo-drawer-mask-motion-leave{opacity:1;}
.apollo-drawer .apollo-drawer-mask-motion-leave-active{opacity:0;}
.apollo-drawer .apollo-drawer-panel-motion-left-enter-start,.apollo-drawer .apollo-drawer-panel-motion-left-appear-start,.apollo-drawer .apollo-drawer-panel-motion-left-leave-start{transition:none;}
.apollo-drawer .apollo-drawer-panel-motion-left-enter-active,.apollo-drawer .apollo-drawer-panel-motion-left-appear-active,.apollo-drawer .apollo-drawer-panel-motion-left-leave-active{transition:all var(--apollo-motion-duration-slow);}
.apollo-drawer .apollo-drawer-panel-motion-left-enter,.apollo-drawer .apollo-drawer-panel-motion-left-appear{opacity:0.7;}
.apollo-drawer .apollo-drawer-panel-motion-left-enter-active,.apollo-drawer .apollo-drawer-panel-motion-left-appear-active{opacity:1;}
.apollo-drawer .apollo-drawer-panel-motion-left-leave{opacity:1;}
.apollo-drawer .apollo-drawer-panel-motion-left-leave-active{opacity:0.7;}
.apollo-drawer .apollo-drawer-panel-motion-left-enter,.apollo-drawer .apollo-drawer-panel-motion-left-appear{transform:translateX(-100%);}
.apollo-drawer .apollo-drawer-panel-motion-left-enter-active,.apollo-drawer .apollo-drawer-panel-motion-left-appear-active{transform:none;}
.apollo-drawer .apollo-drawer-panel-motion-left-leave{transform:none;}
.apollo-drawer .apollo-drawer-panel-motion-left-leave-active{transform:translateX(-100%);}
.apollo-drawer .apollo-drawer-panel-motion-right-enter-start,.apollo-drawer .apollo-drawer-panel-motion-right-appear-start,.apollo-drawer .apollo-drawer-panel-motion-right-leave-start{transition:none;}
.apollo-drawer .apollo-drawer-panel-motion-right-enter-active,.apollo-drawer .apollo-drawer-panel-motion-right-appear-active,.apollo-drawer .apollo-drawer-panel-motion-right-leave-active{transition:all var(--apollo-motion-duration-slow);}
.apollo-drawer .apollo-drawer-panel-motion-right-enter,.apollo-drawer .apollo-drawer-panel-motion-right-appear{opacity:0.7;}
.apollo-drawer .apollo-drawer-panel-motion-right-enter-active,.apollo-drawer .apollo-drawer-panel-motion-right-appear-active{opacity:1;}
.apollo-drawer .apollo-drawer-panel-motion-right-leave{opacity:1;}
.apollo-drawer .apollo-drawer-panel-motion-right-leave-active{opacity:0.7;}
.apollo-drawer .apollo-drawer-panel-motion-right-enter,.apollo-drawer .apollo-drawer-panel-motion-right-appear{transform:translateX(100%);}
.apollo-drawer .apollo-drawer-panel-motion-right-enter-active,.apollo-drawer .apollo-drawer-panel-motion-right-appear-active{transform:none;}
.apollo-drawer .apollo-drawer-panel-motion-right-leave{transform:none;}
.apollo-drawer .apollo-drawer-panel-motion-right-leave-active{transform:translateX(100%);}
.apollo-drawer .apollo-drawer-panel-motion-top-enter-start,.apollo-drawer .apollo-drawer-panel-motion-top-appear-start,.apollo-drawer .apollo-drawer-panel-motion-top-leave-start{transition:none;}
.apollo-drawer .apollo-drawer-panel-motion-top-enter-active,.apollo-drawer .apollo-drawer-panel-motion-top-appear-active,.apollo-drawer .apollo-drawer-panel-motion-top-leave-active{transition:all var(--apollo-motion-duration-slow);}
.apollo-drawer .apollo-drawer-panel-motion-top-enter,.apollo-drawer .apollo-drawer-panel-motion-top-appear{opacity:0.7;}
.apollo-drawer .apollo-drawer-panel-motion-top-enter-active,.apollo-drawer .apollo-drawer-panel-motion-top-appear-active{opacity:1;}
.apollo-drawer .apollo-drawer-panel-motion-top-leave{opacity:1;}
.apollo-drawer .apollo-drawer-panel-motion-top-leave-active{opacity:0.7;}
.apollo-drawer .apollo-drawer-panel-motion-top-enter,.apollo-drawer .apollo-drawer-panel-motion-top-appear{transform:translateY(-100%);}
.apollo-drawer .apollo-drawer-panel-motion-top-enter-active,.apollo-drawer .apollo-drawer-panel-motion-top-appear-active{transform:none;}
.apollo-drawer .apollo-drawer-panel-motion-top-leave{transform:none;}
.apollo-drawer .apollo-drawer-panel-motion-top-leave-active{transform:translateY(-100%);}
.apollo-drawer .apollo-drawer-panel-motion-bottom-enter-start,.apollo-drawer .apollo-drawer-panel-motion-bottom-appear-start,.apollo-drawer .apollo-drawer-panel-motion-bottom-leave-start{transition:none;}
.apollo-drawer .apollo-drawer-panel-motion-bottom-enter-active,.apollo-drawer .apollo-drawer-panel-motion-bottom-appear-active,.apollo-drawer .apollo-drawer-panel-motion-bottom-leave-active{transition:all var(--apollo-motion-duration-slow);}
.apollo-drawer .apollo-drawer-panel-motion-bottom-enter,.apollo-drawer .apollo-drawer-panel-motion-bottom-appear{opacity:0.7;}
.apollo-drawer .apollo-drawer-panel-motion-bottom-enter-active,.apollo-drawer .apollo-drawer-panel-motion-bottom-appear-active{opacity:1;}
.apollo-drawer .apollo-drawer-panel-motion-bottom-leave{opacity:1;}
.apollo-drawer .apollo-drawer-panel-motion-bottom-leave-active{opacity:0.7;}
.apollo-drawer .apollo-drawer-panel-motion-bottom-enter,.apollo-drawer .apollo-drawer-panel-motion-bottom-appear{transform:translateY(100%);}
.apollo-drawer .apollo-drawer-panel-motion-bottom-enter-active,.apollo-drawer .apollo-drawer-panel-motion-bottom-appear-active{transform:none;}
.apollo-drawer .apollo-drawer-panel-motion-bottom-leave{transform:none;}
.apollo-drawer .apollo-drawer-panel-motion-bottom-leave-active{transform:translateY(100%);}`;

/** 生成单个前缀下的完整样式（约定出口：ant 前缀在出口替换类名段）。 */
export function genDrawerStyle(prefixCls: string = 'apollo'): string {
  const rename = (cssText: string): string =>
    prefixCls === 'apollo' ? cssText : cssText.split('.apollo-drawer').join(`.${prefixCls}-drawer`);
  return `.apollo-drawer{${DECLS}}
${rename(RULES)}`;
}
