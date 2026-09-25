/**
 * notification 的静态样式（G4 产物）。
 *
 * 来源：antd 6.6.4 的 cssinjs 产物（`extractStyle`），经机械转换：
 *   `:where(.css-dev-only-do-not-override-*)` 前缀剥离 → `ant-` 改 `apollo-`
 *   → `--ant-*` 改 `--apollo-*`。**不做人肉转写**（AGENTS.md：选择器从产物提取，不推演）。
 *
 * 与 message 的样式是**同一套共享层**的两个实例（antd 的 `genNotificationStyle` +
 * `placement` + 共享的列表/堆叠样式），差异在：
 *   - notice 的宽度用 `--apollo-notification-width`（message 是 `max-content`）；
 *   - 六个方位的定位规则（message 只有 `top`）；
 *   - 图标字号 = `fontSizeLG × lineHeightLG`、标题字号 = `fontSizeLG`（message 用
 *     `fontSize` / `lineHeight`）。
 *
 * ⚠️ 三个必须逐字保留的上游事实：
 *   1. `--notification-*`（`-margin-edge` / `-scale` / `-index` / `-y`）是**局部变量**，
 *      由规则自己声明；`-scale` 的算式 `calc(1 - min(var(--notification-index, 0), 2) * 0.06)`
 *      是堆叠折叠的可观测契约；
 *   2. 四个容器背景色（`-color-success-bg` 等）在 antd 里**没有默认值** ⇒ 产物是
 *      `var(--apollo-notification-color-success-bg, var(--apollo-color-bg-elevated))`
 *      （带 fallback 的 var()），不要顺手把它们塞进声明块 —— 那会改变「未配置时」的取值；
 *   3. `-hook-holder` 是上游的**死选择器**（本仓/上游都没有渲染点），与 radio 的
 *      U7/U8 同判，保留以与上游产物对齐。
 *
 * ⚠️ 声明块挂在**两个**根形态上（同 input 的 D69 / image 的 D95 / message 的 D96 家族）：
 *   `.apollo-notification`（holder/列表根）与 `.apollo-notification-notice-pure-panel`
 *   （静态面板根）—— 后者不在前者的子树里。
 */

/** 组件变量声明（对拍 antd 的 `.ant-notification-css-var` 块，原序字面量）。 */
const DECLS = `--apollo-notification-z-index-popup:2050;--apollo-notification-width:384px;--apollo-notification-progress-bg:linear-gradient(90deg, #69b1ff, #1677ff);`;

/** 组件变量声明块（出口：构建期写进 CSS，L7 逐字对拍）。 */
export function genNotificationTokenDecls(): string {
  return DECLS;
}

/** 规则集（原序，逐条来自 antd 产物）。 */
const RULES = `
.apollo-notification{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);--notification-margin-edge:var(--apollo-margin-lg);position:fixed;z-index:var(--apollo-notification-z-index-popup);width:calc(var(--apollo-notification-width) + var(--apollo-margin-lg) * 2);max-width:100vw;height:100vh;overflow:hidden;overscroll-behavior:contain;}
.apollo-notification .apollo-notification-hook-holder{position:relative;}
.apollo-notification.apollo-notification-list{max-height:100vh;padding:var(--notification-margin-edge);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;ms-overflow-style:none;pointer-events:none;}
.apollo-notification.apollo-notification-list::-webkit-scrollbar{display:none;width:0;height:0;}
.apollo-notification .apollo-notification-list-content{position:relative;display:flex;flex-shrink:0;flex-direction:column;gap:var(--apollo-margin);width:100%;will-change:height,transform;transition:none;}
.apollo-notification .apollo-notification-list-content.apollo-notification-list-content-decrease{transition:height calc(var(--apollo-motion-duration-slow) * 2) var(--apollo-motion-ease-in-out) var(--apollo-motion-duration-mid);}
.apollo-notification .apollo-notification-fade{backface-visibility:hidden;will-change:transform,opacity;}
.apollo-notification.apollo-notification-stack .apollo-notification-notice{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice{--notification-scale:calc(1 - min(var(--notification-index, 0), 2) * 0.06);}
.apollo-notification.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice:not(.apollo-notification-notice-stack-in-threshold){opacity:0;pointer-events:none;}
.apollo-notification.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice:nth-last-child(n + 4){opacity:0;pointer-events:none;}
.apollo-notification-rtl{direction:rtl;}
.apollo-notification-rtl .apollo-notification-notice-actions{float:left;}
.apollo-notification .apollo-notification-notice{position:absolute;width:var(--apollo-notification-width);max-width:calc(100vw - calc(var(--apollo-margin-lg) * 2));padding:var(--apollo-padding-md) var(--apollo-padding-content-horizontal-lg);pointer-events:auto;--apollo-notification-icon-font-size:calc(var(--apollo-font-size-lg) * var(--apollo-line-height-lg));--apollo-notification-title-font-size:var(--apollo-font-size-lg);--apollo-notification-title-line-height:var(--apollo-line-height-lg);box-sizing:border-box;color:var(--apollo-color-text);background:var(--apollo-color-bg-elevated);border-radius:var(--apollo-border-radius-lg);box-shadow:var(--apollo-box-shadow);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);word-wrap:break-word;overflow:visible;transform:scale(var(--notification-scale, 1));transition:transform var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),inset var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),clip-path var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out);}
.apollo-notification .apollo-notification-notice::after{position:absolute;inset-inline:0;top:calc(var(--apollo-margin) * -1);height:var(--apollo-margin);content:"";}
.apollo-notification .apollo-notification-notice-success{background:var(--apollo-notification-color-success-bg, var(--apollo-color-bg-elevated));}
.apollo-notification .apollo-notification-notice-error{background:var(--apollo-notification-color-error-bg, var(--apollo-color-bg-elevated));}
.apollo-notification .apollo-notification-notice-info{background:var(--apollo-notification-color-info-bg, var(--apollo-color-bg-elevated));}
.apollo-notification .apollo-notification-notice-warning{background:var(--apollo-notification-color-warning-bg, var(--apollo-color-bg-elevated));}
.apollo-notification .apollo-notification-notice-wrapper{display:flex;align-items:flex-start;gap:var(--apollo-margin-sm);}
.apollo-notification .apollo-notification-notice-title{color:var(--apollo-color-text-heading);font-size:var(--apollo-notification-title-font-size);line-height:var(--apollo-notification-title-line-height);}
.apollo-notification .apollo-notification-notice-icon{flex:none;font-size:var(--apollo-notification-icon-font-size);line-height:1;}
.apollo-notification .apollo-notification-notice-icon.apollo-notification-notice-icon-success{color:var(--apollo-color-success);}
.apollo-notification .apollo-notification-notice-icon.apollo-notification-notice-icon-info,.apollo-notification .apollo-notification-notice-icon.apollo-notification-notice-icon-loading{color:var(--apollo-color-info);}
.apollo-notification .apollo-notification-notice-icon.apollo-notification-notice-icon-warning{color:var(--apollo-color-warning);}
.apollo-notification .apollo-notification-notice-icon.apollo-notification-notice-icon-error{color:var(--apollo-color-error);}
.apollo-notification .apollo-notification-notice-section{display:flex;flex-direction:column;flex:auto;gap:var(--apollo-margin-xs);min-width:0;}
.apollo-notification .apollo-notification-notice-description{color:var(--apollo-color-text);font-size:var(--apollo-font-size);}
.apollo-notification .apollo-notification-notice-closable .apollo-notification-notice-title,.apollo-notification .apollo-notification-notice-closable .apollo-notification-notice-description{padding-inline-end:var(--apollo-padding-lg);}
.apollo-notification .apollo-notification-notice-closable .apollo-notification-notice-title+.apollo-notification-notice-description{padding-inline-end:0;}
.apollo-notification .apollo-notification-notice-close{position:absolute;top:var(--apollo-padding-md);inset-inline-end:var(--apollo-padding-lg);display:flex;align-items:center;justify-content:center;width:calc(var(--apollo-control-height-lg) * 0.55);height:calc(var(--apollo-control-height-lg) * 0.55);color:var(--apollo-color-icon);background:none;border:none;border-radius:var(--apollo-border-radius-sm);outline:none;transition:color var(--apollo-motion-duration-mid),background-color var(--apollo-motion-duration-mid);}
.apollo-notification .apollo-notification-notice-close:hover{color:var(--apollo-color-icon-hover);background-color:var(--apollo-color-bg-text-hover);}
.apollo-notification .apollo-notification-notice-close:active{background-color:var(--apollo-color-bg-text-active);}
.apollo-notification .apollo-notification-notice-close:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-notification .apollo-notification-notice-progress{position:absolute;bottom:0;display:block;appearance:none;inline-size:calc(100% - var(--apollo-border-radius-lg) * 2);block-size:2px;border:0;left:var(--apollo-border-radius-lg);right:var(--apollo-border-radius-lg);}
.apollo-notification .apollo-notification-notice-progress,.apollo-notification .apollo-notification-notice-progress::-webkit-progress-bar{border-radius:var(--apollo-border-radius-lg);background-color:rgba(0, 0, 0, 0.04);}
.apollo-notification .apollo-notification-notice-progress::-moz-progress-bar{background:var(--apollo-notification-progress-bg);}
.apollo-notification .apollo-notification-notice-progress::-webkit-progress-value{border-radius:var(--apollo-border-radius-lg);background:var(--apollo-notification-progress-bg);}
.apollo-notification .apollo-notification-notice-actions{float:right;margin-top:var(--apollo-margin-sm);}
.apollo-notification.apollo-notification-top{top:calc(var(--notification-top, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));bottom:auto;display:flex;flex-direction:column;margin-inline:0;left:50%;right:auto;transform:translateX(-50%);}
.apollo-notification.apollo-notification-top .apollo-notification-notice{top:var(--notification-y, 0);left:50%;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));transform-origin:center bottom;}
.apollo-notification.apollo-notification-top .apollo-notification-notice.apollo-notification-fade-appear-prepare,.apollo-notification.apollo-notification-top .apollo-notification-notice.apollo-notification-fade-enter-prepare{opacity:0;transform:translate3d(-50%, -64px, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-notification.apollo-notification-top .apollo-notification-notice.apollo-notification-fade-appear-start,.apollo-notification.apollo-notification-top .apollo-notification-notice.apollo-notification-fade-enter-start{opacity:0;transform:translate3d(-50%, -64px, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-top .apollo-notification-notice.apollo-notification-fade-appear-active,.apollo-notification.apollo-notification-top .apollo-notification-notice.apollo-notification-fade-enter-active{opacity:1;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-top .apollo-notification-notice.apollo-notification-fade-leave-start{opacity:1;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-top .apollo-notification-notice.apollo-notification-fade-leave-active{opacity:0;transform:translate3d(-50%, -64px, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-top.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice{clip-path:inset(50% calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-top.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-topLeft{top:calc(var(--notification-top, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));bottom:auto;display:flex;flex-direction:column;left:0;right:auto;}
.apollo-notification.apollo-notification-topLeft .apollo-notification-notice{top:var(--notification-y, 0);left:var(--notification-x, 0);transform-origin:center bottom;}
.apollo-notification.apollo-notification-topLeft .apollo-notification-notice.apollo-notification-fade-appear-prepare,.apollo-notification.apollo-notification-topLeft .apollo-notification-notice.apollo-notification-fade-enter-prepare{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-notification.apollo-notification-topLeft .apollo-notification-notice.apollo-notification-fade-appear-start,.apollo-notification.apollo-notification-topLeft .apollo-notification-notice.apollo-notification-fade-enter-start{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-topLeft .apollo-notification-notice.apollo-notification-fade-appear-active,.apollo-notification.apollo-notification-topLeft .apollo-notification-notice.apollo-notification-fade-enter-active{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-topLeft .apollo-notification-notice.apollo-notification-fade-leave-start{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-topLeft .apollo-notification-notice.apollo-notification-fade-leave-active{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-topLeft.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice{clip-path:inset(50% calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-topLeft.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-topRight{top:calc(var(--notification-top, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));bottom:auto;display:flex;flex-direction:column;right:0;left:auto;}
.apollo-notification.apollo-notification-topRight .apollo-notification-notice{top:var(--notification-y, 0);right:var(--notification-x, 0);transform-origin:center bottom;}
.apollo-notification.apollo-notification-topRight .apollo-notification-notice.apollo-notification-fade-appear-prepare,.apollo-notification.apollo-notification-topRight .apollo-notification-notice.apollo-notification-fade-enter-prepare{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-notification.apollo-notification-topRight .apollo-notification-notice.apollo-notification-fade-appear-start,.apollo-notification.apollo-notification-topRight .apollo-notification-notice.apollo-notification-fade-enter-start{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-topRight .apollo-notification-notice.apollo-notification-fade-appear-active,.apollo-notification.apollo-notification-topRight .apollo-notification-notice.apollo-notification-fade-enter-active{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-topRight .apollo-notification-notice.apollo-notification-fade-leave-start{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-topRight .apollo-notification-notice.apollo-notification-fade-leave-active{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-topRight.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice{clip-path:inset(50% calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-topRight.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-bottom{bottom:calc(var(--notification-bottom, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));top:auto;display:flex;flex-direction:column-reverse;margin-inline:0;left:50%;right:auto;transform:translateX(-50%);}
.apollo-notification.apollo-notification-bottom .apollo-notification-notice{bottom:var(--notification-y, 0);left:50%;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));transform-origin:center top;}
.apollo-notification.apollo-notification-bottom .apollo-notification-notice.apollo-notification-fade-appear-prepare,.apollo-notification.apollo-notification-bottom .apollo-notification-notice.apollo-notification-fade-enter-prepare{opacity:0;transform:translate3d(-50%, 64px, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-notification.apollo-notification-bottom .apollo-notification-notice.apollo-notification-fade-appear-start,.apollo-notification.apollo-notification-bottom .apollo-notification-notice.apollo-notification-fade-enter-start{opacity:0;transform:translate3d(-50%, 64px, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottom .apollo-notification-notice.apollo-notification-fade-appear-active,.apollo-notification.apollo-notification-bottom .apollo-notification-notice.apollo-notification-fade-enter-active{opacity:1;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottom .apollo-notification-notice.apollo-notification-fade-leave-start{opacity:1;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottom .apollo-notification-notice.apollo-notification-fade-leave-active{opacity:0;transform:translate3d(-50%, 64px, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottom.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) 50% calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-bottom.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-bottomLeft{bottom:calc(var(--notification-bottom, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));top:auto;display:flex;flex-direction:column-reverse;left:0;right:auto;}
.apollo-notification.apollo-notification-bottomLeft .apollo-notification-notice{bottom:var(--notification-y, 0);left:var(--notification-x, 0);transform-origin:center top;}
.apollo-notification.apollo-notification-bottomLeft .apollo-notification-notice.apollo-notification-fade-appear-prepare,.apollo-notification.apollo-notification-bottomLeft .apollo-notification-notice.apollo-notification-fade-enter-prepare{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-notification.apollo-notification-bottomLeft .apollo-notification-notice.apollo-notification-fade-appear-start,.apollo-notification.apollo-notification-bottomLeft .apollo-notification-notice.apollo-notification-fade-enter-start{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottomLeft .apollo-notification-notice.apollo-notification-fade-appear-active,.apollo-notification.apollo-notification-bottomLeft .apollo-notification-notice.apollo-notification-fade-enter-active{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottomLeft .apollo-notification-notice.apollo-notification-fade-leave-start{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottomLeft .apollo-notification-notice.apollo-notification-fade-leave-active{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottomLeft.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) 50% calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-bottomLeft.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-bottomRight{bottom:calc(var(--notification-bottom, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));top:auto;display:flex;flex-direction:column-reverse;right:0;left:auto;}
.apollo-notification.apollo-notification-bottomRight .apollo-notification-notice{bottom:var(--notification-y, 0);right:var(--notification-x, 0);transform-origin:center top;}
.apollo-notification.apollo-notification-bottomRight .apollo-notification-notice.apollo-notification-fade-appear-prepare,.apollo-notification.apollo-notification-bottomRight .apollo-notification-notice.apollo-notification-fade-enter-prepare{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-notification.apollo-notification-bottomRight .apollo-notification-notice.apollo-notification-fade-appear-start,.apollo-notification.apollo-notification-bottomRight .apollo-notification-notice.apollo-notification-fade-enter-start{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottomRight .apollo-notification-notice.apollo-notification-fade-appear-active,.apollo-notification.apollo-notification-bottomRight .apollo-notification-notice.apollo-notification-fade-enter-active{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottomRight .apollo-notification-notice.apollo-notification-fade-leave-start{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottomRight .apollo-notification-notice.apollo-notification-fade-leave-active{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-notification.apollo-notification-bottomRight.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) 50% calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification.apollo-notification-bottomRight.apollo-notification-stack:not(.apollo-notification-stack-expanded) .apollo-notification-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-notification-notice-pure-panel{width:var(--apollo-notification-width);max-width:100%;}
.apollo-notification-notice-pure-panel .apollo-notification-notice{position:relative;width:100%;max-width:100%;padding:var(--apollo-padding-md) var(--apollo-padding-content-horizontal-lg);pointer-events:auto;--apollo-notification-icon-font-size:calc(var(--apollo-font-size-lg) * var(--apollo-line-height-lg));--apollo-notification-title-font-size:var(--apollo-font-size-lg);--apollo-notification-title-line-height:var(--apollo-line-height-lg);box-sizing:border-box;color:var(--apollo-color-text);background:var(--apollo-color-bg-elevated);border-radius:var(--apollo-border-radius-lg);box-shadow:var(--apollo-box-shadow);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);word-wrap:break-word;overflow:visible;transform:scale(var(--notification-scale, 1));transition:transform var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),inset var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),clip-path var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out);}
.apollo-notification-notice-pure-panel .apollo-notification-notice::after{position:absolute;inset-inline:0;top:calc(var(--apollo-margin) * -1);height:var(--apollo-margin);content:"";}
.apollo-notification-notice-pure-panel .apollo-notification-notice-success{background:var(--apollo-notification-color-success-bg, var(--apollo-color-bg-elevated));}
.apollo-notification-notice-pure-panel .apollo-notification-notice-error{background:var(--apollo-notification-color-error-bg, var(--apollo-color-bg-elevated));}
.apollo-notification-notice-pure-panel .apollo-notification-notice-info{background:var(--apollo-notification-color-info-bg, var(--apollo-color-bg-elevated));}
.apollo-notification-notice-pure-panel .apollo-notification-notice-warning{background:var(--apollo-notification-color-warning-bg, var(--apollo-color-bg-elevated));}
.apollo-notification-notice-pure-panel .apollo-notification-notice-wrapper{display:flex;align-items:flex-start;gap:var(--apollo-margin-sm);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-title{color:var(--apollo-color-text-heading);font-size:var(--apollo-notification-title-font-size);line-height:var(--apollo-notification-title-line-height);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-icon{flex:none;font-size:var(--apollo-notification-icon-font-size);line-height:1;}
.apollo-notification-notice-pure-panel .apollo-notification-notice-icon.apollo-notification-notice-icon-success{color:var(--apollo-color-success);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-icon.apollo-notification-notice-icon-info,.apollo-notification-notice-pure-panel .apollo-notification-notice-icon.apollo-notification-notice-icon-loading{color:var(--apollo-color-info);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-icon.apollo-notification-notice-icon-warning{color:var(--apollo-color-warning);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-icon.apollo-notification-notice-icon-error{color:var(--apollo-color-error);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-section{display:flex;flex-direction:column;flex:auto;gap:var(--apollo-margin-xs);min-width:0;}
.apollo-notification-notice-pure-panel .apollo-notification-notice-description{color:var(--apollo-color-text);font-size:var(--apollo-font-size);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-closable .apollo-notification-notice-title,.apollo-notification-notice-pure-panel .apollo-notification-notice-closable .apollo-notification-notice-description{padding-inline-end:var(--apollo-padding-lg);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-closable .apollo-notification-notice-title+.apollo-notification-notice-description{padding-inline-end:0;}
.apollo-notification-notice-pure-panel .apollo-notification-notice-close{position:absolute;top:var(--apollo-padding-md);inset-inline-end:var(--apollo-padding-lg);display:flex;align-items:center;justify-content:center;width:calc(var(--apollo-control-height-lg) * 0.55);height:calc(var(--apollo-control-height-lg) * 0.55);color:var(--apollo-color-icon);background:none;border:none;border-radius:var(--apollo-border-radius-sm);outline:none;transition:color var(--apollo-motion-duration-mid),background-color var(--apollo-motion-duration-mid);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-close:hover{color:var(--apollo-color-icon-hover);background-color:var(--apollo-color-bg-text-hover);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-close:active{background-color:var(--apollo-color-bg-text-active);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-close:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-notification-notice-pure-panel .apollo-notification-notice-progress{position:absolute;bottom:0;display:block;appearance:none;inline-size:calc(100% - var(--apollo-border-radius-lg) * 2);block-size:2px;border:0;left:var(--apollo-border-radius-lg);right:var(--apollo-border-radius-lg);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-progress,.apollo-notification-notice-pure-panel .apollo-notification-notice-progress::-webkit-progress-bar{border-radius:var(--apollo-border-radius-lg);background-color:rgba(0, 0, 0, 0.04);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-progress::-moz-progress-bar{background:var(--apollo-notification-progress-bg);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-progress::-webkit-progress-value{border-radius:var(--apollo-border-radius-lg);background:var(--apollo-notification-progress-bg);}
.apollo-notification-notice-pure-panel .apollo-notification-notice-actions{float:none;margin-top:var(--apollo-margin-sm);text-align:end;}`;

/** 生成单个前缀下的完整样式（约定出口：ant 前缀在出口替换类名段）。 */
export function genNotificationStyle(prefixCls: string = 'apollo'): string {
  const rename = (cssText: string): string =>
    prefixCls === 'apollo'
      ? cssText
      : cssText.split('.apollo-notification').join('.' + prefixCls + '-notification');
  const decls = [
    `.apollo-notification{${DECLS}}`,
    `.apollo-notification-notice-pure-panel{${DECLS}}`,
  ].join('\n');
  return `${decls}
${rename(RULES)}`;
}
