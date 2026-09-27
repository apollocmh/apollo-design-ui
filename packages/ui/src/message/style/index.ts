/**
 * message 的静态样式（G4 产物）。
 *
 * 来源：antd 6.6.4 的 cssinjs 产物（`extractStyle`），经机械转换：
 *   `:where(.css-dev-only-do-not-override-*)` 前缀剥离 → `ant-` 改 `apollo-`
 *   → `--ant-*` 改 `--apollo-*`。**不做人肉转写**（AGENTS.md：选择器从产物提取，不推演）。
 *
 * ⚠️ 三个必须逐字保留的上游事实：
 *   1. `--notification-*` 系列（`-margin-edge` / `-scale` / `-index` / `-y`）是**局部变量**，
 *      由规则自己声明、不经组件 token —— 不要顺手改成 `--apollo-message-*`；
 *   2. `-hook-holder` 与 `.apollo-message.ant-message-list` 的**复合选择器**都是上游原样：
 *      前者在本仓/上游都没有渲染点（**死选择器**，与 radio 的 U7/U8 同判，保留以与上游产物对齐），
 *      后者命中的是**同一个元素**（rc 的列表根同时挂 `{p}` 与 `{p}-list`）；
 *   3. 规则里的 `--apollo-notification-icon-font-size` / `-title-font-size` /
 *      `-title-line-height` 是 **notification 共享样式层**写在 notice 规则内部的
 *      （见 antd `notification/style` 的 `genListItemSharedStyle`），不是声明块里的 token。
 *
 * ⚠️ 声明块挂在**两个**根形态上（同 input 的 D69 / image 的 D95）：
 *   `.apollo-message`（holder/列表根）与 `.apollo-message-notice-pure-panel`（静态面板根）——
 *   后者不在前者的子树里，antd 靠它的 `-css-var` 类解决，本仓靠这份声明块。
 */

/** 组件变量声明（对拍 antd 的 `.ant-message-css-var` 块，原序字面量）。 */
const DECLS = `--apollo-message-z-index-popup:2010;--apollo-message-content-bg:#ffffff;--apollo-message-content-padding:9px 12px;`;

/** 组件变量声明块（出口：构建期写进 CSS，L7 逐字对拍）。 */
export function genMessageTokenDecls(): string {
  return DECLS;
}

/** 规则集（原序，逐条来自 antd 产物）。 */
const RULES = `
.apollo-message{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);--notification-margin-edge:var(--apollo-margin-lg);position:fixed;z-index:var(--apollo-message-z-index-popup);width:100%;max-width:100vw;height:100vh;overflow:hidden;overscroll-behavior:contain;}
.apollo-message .apollo-message-hook-holder{position:relative;}
.apollo-message.apollo-message-list{max-height:100vh;padding:var(--notification-margin-edge);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;ms-overflow-style:none;pointer-events:none;}
.apollo-message.apollo-message-list::-webkit-scrollbar{display:none;width:0;height:0;}
.apollo-message .apollo-message-list-content{position:relative;display:flex;flex-shrink:0;flex-direction:column;gap:var(--apollo-margin);width:100%;will-change:height,transform;transition:none;}
.apollo-message .apollo-message-list-content.apollo-message-list-content-decrease{transition:height calc(var(--apollo-motion-duration-slow) * 2) var(--apollo-motion-ease-in-out) var(--apollo-motion-duration-mid);}
.apollo-message .apollo-message-fade{backface-visibility:hidden;will-change:transform,opacity;}
.apollo-message.apollo-message-stack .apollo-message-notice{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice{--notification-scale:calc(1 - min(var(--notification-index, 0), 2) * 0.06);}
.apollo-message.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice:not(.apollo-message-notice-stack-in-threshold){opacity:0;pointer-events:none;}
.apollo-message.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice:nth-last-child(n + 2){opacity:0;pointer-events:none;}
.apollo-message-rtl{direction:rtl;}
.apollo-message-rtl .apollo-message-notice-actions{float:left;}
.apollo-message .apollo-message-notice{position:absolute;width:max-content;max-width:calc(100vw - calc(var(--apollo-margin-lg) * 2));padding:var(--apollo-message-content-padding);pointer-events:auto;--apollo-notification-icon-font-size:var(--apollo-font-size-lg);--apollo-notification-title-font-size:var(--apollo-font-size);--apollo-notification-title-line-height:var(--apollo-line-height);box-sizing:border-box;color:var(--apollo-color-text);background:var(--apollo-message-content-bg);border-radius:var(--apollo-border-radius-lg);box-shadow:var(--apollo-box-shadow);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);word-wrap:break-word;overflow:visible;transform:scale(var(--notification-scale, 1));transition:transform var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),inset var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),clip-path var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out);z-index:1;}
.apollo-message .apollo-message-notice::after{position:absolute;inset-inline:0;top:calc(var(--apollo-margin) * -1);height:var(--apollo-margin);content:"";}
.apollo-message .apollo-message-notice-wrapper{display:flex;align-items:center;gap:var(--apollo-margin-xs);}
.apollo-message .apollo-message-notice-title{color:var(--apollo-color-text-heading);font-size:var(--apollo-notification-title-font-size);line-height:var(--apollo-notification-title-line-height);}
.apollo-message .apollo-message-notice-icon{flex:none;font-size:var(--apollo-notification-icon-font-size);line-height:1;}
.apollo-message .apollo-message-notice-icon.apollo-message-notice-icon-success{color:var(--apollo-color-success);}
.apollo-message .apollo-message-notice-icon.apollo-message-notice-icon-info,.apollo-message .apollo-message-notice-icon.apollo-message-notice-icon-loading{color:var(--apollo-color-info);}
.apollo-message .apollo-message-notice-icon.apollo-message-notice-icon-warning{color:var(--apollo-color-warning);}
.apollo-message .apollo-message-notice-icon.apollo-message-notice-icon-error{color:var(--apollo-color-error);}
.apollo-message.apollo-message-top{top:calc(var(--notification-top, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));bottom:auto;display:flex;flex-direction:column;margin-inline:0;left:50%;right:auto;transform:translateX(-50%);}
.apollo-message.apollo-message-top .apollo-message-notice{top:var(--notification-y, 0);left:50%;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));transform-origin:center bottom;}
.apollo-message.apollo-message-top .apollo-message-notice.apollo-message-fade-appear-prepare,.apollo-message.apollo-message-top .apollo-message-notice.apollo-message-fade-enter-prepare{opacity:0;transform:translate3d(-50%, -64px, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-message.apollo-message-top .apollo-message-notice.apollo-message-fade-appear-start,.apollo-message.apollo-message-top .apollo-message-notice.apollo-message-fade-enter-start{opacity:0;transform:translate3d(-50%, -64px, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-top .apollo-message-notice.apollo-message-fade-appear-active,.apollo-message.apollo-message-top .apollo-message-notice.apollo-message-fade-enter-active{opacity:1;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-top .apollo-message-notice.apollo-message-fade-leave-start{opacity:1;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-top .apollo-message-notice.apollo-message-fade-leave-active{opacity:0;transform:translate3d(-50%, -64px, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-top.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice{clip-path:inset(50% calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-top.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-topLeft{top:calc(var(--notification-top, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));bottom:auto;display:flex;flex-direction:column;left:0;right:auto;}
.apollo-message.apollo-message-topLeft .apollo-message-notice{top:var(--notification-y, 0);left:var(--notification-x, 0);transform-origin:center bottom;}
.apollo-message.apollo-message-topLeft .apollo-message-notice.apollo-message-fade-appear-prepare,.apollo-message.apollo-message-topLeft .apollo-message-notice.apollo-message-fade-enter-prepare{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-message.apollo-message-topLeft .apollo-message-notice.apollo-message-fade-appear-start,.apollo-message.apollo-message-topLeft .apollo-message-notice.apollo-message-fade-enter-start{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-topLeft .apollo-message-notice.apollo-message-fade-appear-active,.apollo-message.apollo-message-topLeft .apollo-message-notice.apollo-message-fade-enter-active{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-topLeft .apollo-message-notice.apollo-message-fade-leave-start{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-topLeft .apollo-message-notice.apollo-message-fade-leave-active{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-topLeft.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice{clip-path:inset(50% calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-topLeft.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-topRight{top:calc(var(--notification-top, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));bottom:auto;display:flex;flex-direction:column;right:0;left:auto;}
.apollo-message.apollo-message-topRight .apollo-message-notice{top:var(--notification-y, 0);right:var(--notification-x, 0);transform-origin:center bottom;}
.apollo-message.apollo-message-topRight .apollo-message-notice.apollo-message-fade-appear-prepare,.apollo-message.apollo-message-topRight .apollo-message-notice.apollo-message-fade-enter-prepare{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-message.apollo-message-topRight .apollo-message-notice.apollo-message-fade-appear-start,.apollo-message.apollo-message-topRight .apollo-message-notice.apollo-message-fade-enter-start{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-topRight .apollo-message-notice.apollo-message-fade-appear-active,.apollo-message.apollo-message-topRight .apollo-message-notice.apollo-message-fade-enter-active{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-topRight .apollo-message-notice.apollo-message-fade-leave-start{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-topRight .apollo-message-notice.apollo-message-fade-leave-active{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-topRight.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice{clip-path:inset(50% calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-topRight.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-bottom{bottom:calc(var(--notification-bottom, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));top:auto;display:flex;flex-direction:column-reverse;margin-inline:0;left:50%;right:auto;transform:translateX(-50%);}
.apollo-message.apollo-message-bottom .apollo-message-notice{bottom:var(--notification-y, 0);left:50%;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));transform-origin:center top;}
.apollo-message.apollo-message-bottom .apollo-message-notice.apollo-message-fade-appear-prepare,.apollo-message.apollo-message-bottom .apollo-message-notice.apollo-message-fade-enter-prepare{opacity:0;transform:translate3d(-50%, 64px, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-message.apollo-message-bottom .apollo-message-notice.apollo-message-fade-appear-start,.apollo-message.apollo-message-bottom .apollo-message-notice.apollo-message-fade-enter-start{opacity:0;transform:translate3d(-50%, 64px, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottom .apollo-message-notice.apollo-message-fade-appear-active,.apollo-message.apollo-message-bottom .apollo-message-notice.apollo-message-fade-enter-active{opacity:1;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottom .apollo-message-notice.apollo-message-fade-leave-start{opacity:1;transform:translate3d(-50%, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottom .apollo-message-notice.apollo-message-fade-leave-active{opacity:0;transform:translate3d(-50%, 64px, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottom.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) 50% calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-bottom.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-bottomLeft{bottom:calc(var(--notification-bottom, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));top:auto;display:flex;flex-direction:column-reverse;left:0;right:auto;}
.apollo-message.apollo-message-bottomLeft .apollo-message-notice{bottom:var(--notification-y, 0);left:var(--notification-x, 0);transform-origin:center top;}
.apollo-message.apollo-message-bottomLeft .apollo-message-notice.apollo-message-fade-appear-prepare,.apollo-message.apollo-message-bottomLeft .apollo-message-notice.apollo-message-fade-enter-prepare{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-message.apollo-message-bottomLeft .apollo-message-notice.apollo-message-fade-appear-start,.apollo-message.apollo-message-bottomLeft .apollo-message-notice.apollo-message-fade-enter-start{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottomLeft .apollo-message-notice.apollo-message-fade-appear-active,.apollo-message.apollo-message-bottomLeft .apollo-message-notice.apollo-message-fade-enter-active{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottomLeft .apollo-message-notice.apollo-message-fade-leave-start{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottomLeft .apollo-message-notice.apollo-message-fade-leave-active{opacity:0;transform:translate3d(-64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottomLeft.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) 50% calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-bottomLeft.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-bottomRight{bottom:calc(var(--notification-bottom, var(--notification-margin-edge, 0px)) - var(--notification-margin-edge, 0px));top:auto;display:flex;flex-direction:column-reverse;right:0;left:auto;}
.apollo-message.apollo-message-bottomRight .apollo-message-notice{bottom:var(--notification-y, 0);right:var(--notification-x, 0);transform-origin:center top;}
.apollo-message.apollo-message-bottomRight .apollo-message-notice.apollo-message-fade-appear-prepare,.apollo-message.apollo-message-bottomRight .apollo-message-notice.apollo-message-fade-enter-prepare{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));transition:none;}
.apollo-message.apollo-message-bottomRight .apollo-message-notice.apollo-message-fade-appear-start,.apollo-message.apollo-message-bottomRight .apollo-message-notice.apollo-message-fade-enter-start{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottomRight .apollo-message-notice.apollo-message-fade-appear-active,.apollo-message.apollo-message-bottomRight .apollo-message-notice.apollo-message-fade-enter-active{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottomRight .apollo-message-notice.apollo-message-fade-leave-start{opacity:1;transform:translate3d(0, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottomRight .apollo-message-notice.apollo-message-fade-leave-active{opacity:0;transform:translate3d(64px, 0, 0) scale(var(--notification-scale, 1));}
.apollo-message.apollo-message-bottomRight.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) 50% calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-bottomRight.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-notice[data-notification-index='0']{clip-path:inset(calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1) calc(var(--apollo-margin-xxl) * -1));}
.apollo-message.apollo-message-stack .apollo-message-list-content{isolation:isolate;}
.apollo-message.apollo-message-stack .apollo-message-list-content::before{position:absolute;width:calc(var(--top-notificiation-width) - var(--apollo-margin));max-width:calc(100vw - calc(var(--apollo-margin-lg) * 2));padding:0;pointer-events:none;--apollo-notification-icon-font-size:var(--apollo-font-size-lg);--apollo-notification-title-font-size:var(--apollo-font-size);--apollo-notification-title-line-height:var(--apollo-line-height);box-sizing:border-box;color:var(--apollo-color-text);background:var(--apollo-message-content-bg);border-radius:var(--apollo-border-radius-lg);box-shadow:var(--apollo-box-shadow-tertiary);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);word-wrap:break-word;overflow:visible;transform:translateX(-50%) translateY(100%);transition:opacity var(--apollo-motion-duration-fast) var(--apollo-motion-ease-in-out),transform var(--apollo-motion-duration-fast) var(--apollo-motion-ease-in-out),width var(--apollo-motion-duration-slow) var(--apollo-motion-ease-in-out);z-index:-1;left:50%;height:calc(var(--apollo-margin-xs) * 2);opacity:0;content:"";top:calc(var(--top-notificiation-height) - var(--apollo-margin-xs));}
.apollo-message.apollo-message-stack .apollo-message-list-content::after{position:absolute;width:calc(var(--top-notificiation-width) - calc(var(--apollo-margin) * 2));max-width:calc(100vw - calc(var(--apollo-margin-lg) * 2));padding:0;pointer-events:none;--apollo-notification-icon-font-size:var(--apollo-font-size-lg);--apollo-notification-title-font-size:var(--apollo-font-size);--apollo-notification-title-line-height:var(--apollo-line-height);box-sizing:border-box;color:var(--apollo-color-text);background:var(--apollo-message-content-bg);border-radius:var(--apollo-border-radius-lg);box-shadow:var(--apollo-box-shadow-tertiary);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);word-wrap:break-word;overflow:visible;transform:translateX(-50%) translateY(100%);transition:opacity var(--apollo-motion-duration-fast) var(--apollo-motion-ease-in-out),transform var(--apollo-motion-duration-fast) var(--apollo-motion-ease-in-out),width var(--apollo-motion-duration-slow) var(--apollo-motion-ease-in-out);z-index:-2;left:50%;height:calc(var(--apollo-margin-xs) * 2);opacity:0;content:"";top:var(--top-notificiation-height);}
.apollo-message.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-list-content::before,.apollo-message.apollo-message-stack:not(.apollo-message-stack-expanded) .apollo-message-list-content::after{opacity:1;transform:translateX(-50%) translateY(0);}
.apollo-message-notice-pure-panel{width:max-content;max-width:100%;}
.apollo-message-notice-pure-panel .apollo-message-notice{position:relative;width:max-content;max-width:100%;padding:var(--apollo-message-content-padding);pointer-events:auto;--apollo-notification-icon-font-size:var(--apollo-font-size-lg);--apollo-notification-title-font-size:var(--apollo-font-size);--apollo-notification-title-line-height:var(--apollo-line-height);box-sizing:border-box;color:var(--apollo-color-text);background:var(--apollo-message-content-bg);border-radius:var(--apollo-border-radius-lg);box-shadow:var(--apollo-box-shadow);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);word-wrap:break-word;overflow:visible;transform:scale(var(--notification-scale, 1));transition:transform var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),inset var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),clip-path var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out);z-index:1;}
.apollo-message-notice-pure-panel .apollo-message-notice::after{position:absolute;inset-inline:0;top:calc(var(--apollo-margin) * -1);height:var(--apollo-margin);content:"";}
.apollo-message-notice-pure-panel .apollo-message-notice-wrapper{display:flex;align-items:center;gap:var(--apollo-margin-xs);}
.apollo-message-notice-pure-panel .apollo-message-notice-title{color:var(--apollo-color-text-heading);font-size:var(--apollo-notification-title-font-size);line-height:var(--apollo-notification-title-line-height);}
.apollo-message-notice-pure-panel .apollo-message-notice-icon{flex:none;font-size:var(--apollo-notification-icon-font-size);line-height:1;}
.apollo-message-notice-pure-panel .apollo-message-notice-icon.apollo-message-notice-icon-success{color:var(--apollo-color-success);}
.apollo-message-notice-pure-panel .apollo-message-notice-icon.apollo-message-notice-icon-info,.apollo-message-notice-pure-panel .apollo-message-notice-icon.apollo-message-notice-icon-loading{color:var(--apollo-color-info);}
.apollo-message-notice-pure-panel .apollo-message-notice-icon.apollo-message-notice-icon-warning{color:var(--apollo-color-warning);}
.apollo-message-notice-pure-panel .apollo-message-notice-icon.apollo-message-notice-icon-error{color:var(--apollo-color-error);}`;

/** 生成单个前缀下的完整样式（约定出口：ant 前缀在出口替换类名段）。 */
export function genMessageStyle(prefixCls: string = 'apollo'): string {
  const rename = (cssText: string): string =>
    prefixCls === 'apollo'
      ? cssText
      : cssText.split('.apollo-message').join(`.${prefixCls}-message`);
  const decls = [`.apollo-message{${DECLS}}`, `.apollo-message-notice-pure-panel{${DECLS}}`].join(
    '\n',
  );
  return `${decls}
${rename(RULES)}`;
}
