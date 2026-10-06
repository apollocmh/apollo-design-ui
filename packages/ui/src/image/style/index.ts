/**
 * Image 的静态样式（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 components/image/style（React SSR + extractStyle 产物
 * 逐条机械转换，提取脚本 tests/visual/debug/extract-image.mjs（括号配平提取）；
 * 57 条规则，原序）。
 *
 * 与 antd 产物的转换规则：
 *   1. 去掉 :where(.css-dev-only-…) hash 前缀（静态移植无 hashId）。
 *   2. .ant-* → .apollo-*；--ant-* → --apollo-*；.anticon → .apollo-icon（D15）。
 *   3. 动画名 → 本仓稳定命名（apollo-image-ink-flow-1/2/3、progress-active、
 *      fade-in/out；loadingCircle 由 icons 基线提供同名 keyframes 的稳定名）。
 *   4. 组件变量声明块：antd 挂在 .ant-image-css-var（死选择器）；本仓按 D69
 *      同判，落在唯一的根形态 .apollo-image 上（genImageTokenDecls 返回该块
 *      原序字面量；关键值由 L7 的 token 判据对拍）。
 *   5. Preview 的样式随组件一起注册（antd 的 useStyle 注册整份组件样式 ——
 *      portal 浮层在 SSR 不可见但样式已产出），本仓同样全量保留。
 */
const DECLS = `--apollo-image-z-index-popup:1080;--apollo-image-preview-operation-color:rgba(255,255,255,0.65);--apollo-image-preview-operation-hover-color:rgba(255,255,255,0.85);--apollo-image-preview-operation-color-disabled:rgba(255,255,255,0.25);--apollo-image-preview-operation-size:18px;--apollo-image-progress-animation-duration:3s;`;

/** 组件变量声明（对拍 antd 的 .ant-image-css-var 块，原序字面量）。 */
export function genImageTokenDecls(): string {
  return DECLS;
}

/** antd motion 的 @keyframes（稳定命名，原序）。 */
const KEYFRAMES = `
@keyframes apollo-image-ink-flow-1{0%{transform:translate(0%, 0%);opacity:0.8;}50%{transform:translate(15%, -20%) scale(1.25);opacity:0.5;}100%{transform:translate(0%, 0%);opacity:0.8;}}
@keyframes apollo-image-ink-flow-2{0%{transform:translate(0%, 0%) scale(1.1);opacity:0.7;}50%{transform:translate(-18%, 15%) scale(0.85);opacity:0.9;}100%{transform:translate(0%, 0%) scale(1.1);opacity:0.7;}}
@keyframes apollo-image-ink-flow-3{0%{transform:translate(0%, 0%) scale(0.85);opacity:0.65;}50%{transform:translate(8%, 10%) scale(1.15);opacity:0.8;}100%{transform:translate(0%, 0%) scale(0.85);opacity:0.65;}}
@keyframes apollo-image-progress-active{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
`;

/** antd 产物机械转换段（57 条，原序）。 */
const RULES = `
.apollo-image-css-var{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}
.apollo-image-css-var::before,.apollo-image-css-var::after{box-sizing:border-box;}
.apollo-image-css-var [class^="ant-image"],.apollo-image-css-var [class*=" ant-image"]{box-sizing:border-box;}
.apollo-image-css-var [class^="ant-image"]::before,.apollo-image-css-var [class*=" ant-image"]::before,.apollo-image-css-var [class^="ant-image"]::after,.apollo-image-css-var [class*=" ant-image"]::after{box-sizing:border-box;}
.apollo-image{position:relative;display:inline-block;}
.apollo-image:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-image .apollo-image-img{width:100%;height:auto;vertical-align:middle;}
.apollo-image .apollo-image-img-placeholder{background-color:var(--apollo-color-bg-container-disabled);background-image:url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTQuNSAyLjVoLTEzQS41LjUgMCAwIDAgMSAzdjEwYS41LjUgMCAwIDAgLjUuNWgxM2EuNS41IDAgMCAwIC41LS41VjNhLjUuNSAwIDAgMC0uNS0uNXpNNS4yODEgNC43NWExIDEgMCAwIDEgMCAyIDEgMSAwIDAgMSAwLTJ6bTguMDMgNi44M2EuMTI3LjEyNyAwIDAgMS0uMDgxLjAzSDIuNzY5YS4xMjUuMTI1IDAgMCAxLS4wOTYtLjIwN2wyLjY2MS0zLjE1NmEuMTI2LjEyNiAwIDAgMSAuMTc3LS4wMTZsLjAxNi4wMTZMNy4wOCAxMC4wOWwyLjQ3LTIuOTNhLjEyNi4xMjYgMCAwIDEgLjE3Ny0uMDE2bC4wMTUuMDE2IDMuNTg4IDQuMjQ0YS4xMjcuMTI3IDAgMCAxLS4wMi4xNzV6IiBmaWxsPSIjOEM4QzhDIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48L3N2Zz4=');background-repeat:no-repeat;background-position:center center;background-size:30%;}
.apollo-image .apollo-image-placeholder{position:absolute;inset:0;}
.apollo-image .apollo-image-cover{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--apollo-color-text-light-solid);background:rgba(0,0,0,0.3);cursor:pointer;opacity:0;transition:opacity var(--apollo-motion-duration-slow);}
.apollo-image:hover .apollo-image-cover,.apollo-image:focus-visible .apollo-image-cover{opacity:1;}
.apollo-image .apollo-image-cover-top{inset:0 0 auto 0;justify-content:center;}
.apollo-image .apollo-image-cover-bottom{inset:auto 0 0 0;justify-content:center;}
.apollo-image-progress-wrapper{position:relative;display:inline-block;overflow:hidden;border-radius:inherit;background-color:var(--apollo-color-bg-base);backdrop-filter:blur(8px);}
.apollo-image-progress-wrapper .apollo-image-progress-ink-1{position:absolute;width:150%;height:150%;left:-25%;top:-25%;animation-timing-function:var(--apollo-motion-ease-in-out);animation-iteration-count:infinite;pointer-events:none;will-change:transform,opacity;background:radial-gradient(ellipse 65% 55% at 25% 30%, rgba(100, 180, 255, 0.98) 0%, transparent 55%);animation-name:apollo-image-ink-flow-1;animation-duration:var(--apollo-image-progress-animation-duration);filter:blur(40px);}
.apollo-image-progress-wrapper .apollo-image-progress-ink-1::before{content:"";position:absolute;width:150%;height:150%;left:-25%;top:-25%;animation-timing-function:var(--apollo-motion-ease-in-out);animation-iteration-count:infinite;pointer-events:none;will-change:transform,opacity;background:radial-gradient(ellipse 60% 65% at 75% 45%, rgba(180, 140, 255, 0.95) 0%, transparent 50%);animation-name:apollo-image-ink-flow-2;animation-duration:calc(var(--apollo-image-progress-animation-duration) + 2s);animation-delay:-1s;filter:blur(45px);}
.apollo-image-progress-wrapper .apollo-image-progress-ink-1::after{content:"";position:absolute;width:150%;height:150%;left:-25%;top:-25%;animation-timing-function:var(--apollo-motion-ease-in-out);animation-iteration-count:infinite;pointer-events:none;will-change:transform,opacity;background:radial-gradient(ellipse 55% 50% at 50% 70%, rgba(100, 220, 220, 0.9) 0%, transparent 45%);animation-name:apollo-image-ink-flow-3;animation-duration:calc(var(--apollo-image-progress-animation-duration) + 0.5s);animation-delay:-2s;filter:blur(38px);}
.apollo-image-progress-wrapper .apollo-image-progress-ink-2{position:absolute;width:150%;height:150%;left:-25%;top:-25%;animation-timing-function:var(--apollo-motion-ease-in-out);animation-iteration-count:infinite;pointer-events:none;will-change:transform,opacity;background:radial-gradient(ellipse 45% 40% at 60% 20%, rgba(255, 150, 200, 0.88) 0%, transparent 45%);animation-name:apollo-image-ink-flow-3;animation-duration:calc(var(--apollo-image-progress-animation-duration) + 1.5s);animation-delay:-3s;filter:blur(42px);}
.apollo-image-progress-wrapper .apollo-image-progress-ink-2::before{content:"";position:absolute;width:150%;height:150%;left:-25%;top:-25%;animation-timing-function:var(--apollo-motion-ease-in-out);animation-iteration-count:infinite;pointer-events:none;will-change:transform,opacity;background:radial-gradient(ellipse 50% 55% at 20% 75%, rgba(160, 190, 255, 0.88) 0%, transparent 50%);animation-name:apollo-image-ink-flow-1;animation-duration:calc(var(--apollo-image-progress-animation-duration) + 2.5s);animation-delay:-2.5s;filter:blur(35px);}
.apollo-image-progress-wrapper .apollo-image-progress-content{position:absolute;top:50%;left:0;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;width:100%;padding-inline:var(--apollo-padding-lg);text-align:center;font-size:var(--apollo-font-size);color:var(--apollo-color-text-secondary);z-index:1;}
.apollo-image-progress-wrapper .apollo-image-progress-rail{width:100%;height:6px;margin-top:var(--apollo-margin-sm);background-color:rgba(255, 255, 255, 0.5);border-radius:var(--apollo-border-radius-xs);overflow:hidden;backdrop-filter:blur(4px);}
.apollo-image-progress-wrapper .apollo-image-progress-rail::before{content:"";display:block;height:100%;width:var(--progress-percent, 0%);background:linear-gradient(90deg, rgba(120, 170, 255, 0.85) 0%, rgba(160, 150, 245, 0.85) 40%, rgba(130, 200, 220, 0.85) 60%, rgba(120, 170, 255, 0.85) 100%);background-size:200% 100%;border-radius:calc(var(--apollo-border-radius-xs)/2);transition:width var(--apollo-motion-duration-mid) ease;animation-name:apollo-image-progress-active;animation-duration:var(--apollo-image-progress-animation-duration);animation-timing-function:linear;animation-iteration-count:infinite;}
.apollo-image-progress-wrapper .apollo-image-progress-indicator{margin-top:var(--apollo-margin-xs);}
.apollo-image-preview{text-align:center;inset:0;position:fixed;user-select:none;z-index:var(--apollo-image-z-index-popup);}
.apollo-image-preview .apollo-image-preview-mask{inset:0;position:absolute;background:var(--apollo-color-bg-mask);backdrop-filter:blur(0px);transition:backdrop-filter var(--apollo-motion-duration-slow);}
.apollo-image-preview .apollo-image-preview-mask.apollo-image-preview-mask-blur{backdrop-filter:blur(4px);}
.apollo-image-preview .apollo-image-preview-mask.apollo-image-preview-mask-hidden{display:none;}
.apollo-image-preview .apollo-image-preview-body{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;}
.apollo-image-preview .apollo-image-preview-body >*{pointer-events:auto;}
.apollo-image-preview .apollo-image-preview-img{max-width:100%;max-height:70%;vertical-align:middle;transform:scale3d(1, 1, 1);transition:transform var(--apollo-motion-duration-slow) var(--apollo-motion-ease-out) 0s;}
.apollo-image-preview-movable .apollo-image-preview-img{cursor:grab;}
.apollo-image-preview-moving .apollo-image-preview-img{cursor:grabbing;}
.apollo-image-preview .apollo-image-preview-close{position:absolute;color:var(--apollo-color-text-light-solid);background-color:rgba(0,0,0,0.1);border-radius:50%;padding:var(--apollo-padding-sm);outline:0;border:0;cursor:pointer;transition:all var(--apollo-motion-duration-slow);display:flex;font-size:var(--apollo-image-preview-operation-size);top:var(--apollo-margin-sm);inset-inline-end:var(--apollo-margin-sm);}
.apollo-image-preview .apollo-image-preview-close:hover{background-color:rgba(0,0,0,0.2);}
.apollo-image-preview .apollo-image-preview-close:active{background-color:rgba(0,0,0,0.1);}
.apollo-image-preview .apollo-image-preview-close:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-image-preview .apollo-image-preview-switch{position:absolute;color:var(--apollo-color-text-light-solid);background-color:rgba(0,0,0,0.1);border-radius:50%;padding:var(--apollo-padding-sm);outline:0;border:0;cursor:pointer;transition:all var(--apollo-motion-duration-slow);display:flex;font-size:var(--apollo-image-preview-operation-size);top:50%;transform:translateY(-50%);}
.apollo-image-preview .apollo-image-preview-switch:hover{background-color:rgba(0,0,0,0.2);}
.apollo-image-preview .apollo-image-preview-switch:active{background-color:rgba(0,0,0,0.1);}
.apollo-image-preview .apollo-image-preview-switch:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-image-preview .apollo-image-preview-switch-disabled,.apollo-image-preview .apollo-image-preview-switch-disabled:hover,.apollo-image-preview .apollo-image-preview-switch-disabled:active{color:var(--apollo-image-preview-operation-color-disabled);background:transparent;cursor:not-allowed;}
.apollo-image-preview .apollo-image-preview-switch-prev{inset-inline-start:var(--apollo-margin-sm);}
.apollo-image-preview .apollo-image-preview-switch-next{inset-inline-end:var(--apollo-margin-sm);}
.apollo-image-preview .apollo-image-preview-footer{position:absolute;bottom:var(--apollo-margin-xl);left:50%;display:flex;flex-direction:column;align-items:center;color:var(--apollo-image-preview-operation-color);transform:translateX(-50%);gap:var(--apollo-margin);}
.apollo-image-preview .apollo-image-preview-actions{display:flex;gap:var(--apollo-padding-sm);padding:0 var(--apollo-padding-lg);background-color:rgba(0,0,0,0.1);border-radius:100px;font-size:var(--apollo-image-preview-operation-size);}
.apollo-image-preview .apollo-image-preview-actions-action{color:inherit;background:transparent;border:0;font:inherit;padding:var(--apollo-padding-sm);cursor:pointer;transition:all var(--apollo-motion-duration-slow);display:flex;}
.apollo-image-preview .apollo-image-preview-actions-action:not(.apollo-image-preview-actions-action-disabled):hover{color:var(--apollo-image-preview-operation-hover-color);}
.apollo-image-preview .apollo-image-preview-actions-action:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-image-preview .apollo-image-preview-actions-action-disabled{color:var(--apollo-image-preview-operation-color-disabled);cursor:not-allowed;}
.apollo-image-preview-fade{transition:opacity var(--apollo-motion-duration-slow);}
.apollo-image-preview-fade-enter,.apollo-image-preview-fade-appear{opacity:0;}
.apollo-image-preview-fade-enter .apollo-image-preview-body,.apollo-image-preview-fade-appear .apollo-image-preview-body{transform:scale(0);}
.apollo-image-preview-fade-enter-active,.apollo-image-preview-fade-appear-active{opacity:1;}
.apollo-image-preview-fade-enter-active .apollo-image-preview-body,.apollo-image-preview-fade-appear-active .apollo-image-preview-body{transform:scale(1);transition:transform var(--apollo-motion-duration-slow);}
.apollo-image-preview-fade-leave{opacity:1;}
.apollo-image-preview-fade-leave-active{opacity:0;}
.apollo-image-preview-fade-leave-active .apollo-image-preview-body{transform:scale(0);transition:transform var(--apollo-motion-duration-slow);}`;

/** 生成单个前缀下的完整样式（约定出口：ant 前缀在出口替换类名段）。 */
export function genImageStyle(prefixCls: string = 'apollo'): string {
  const rename = (cssText: string): string =>
    prefixCls === 'apollo' ? cssText : cssText.split('.apollo-image').join(`.${prefixCls}-image`);
  // ⚠️ 声明块必须覆盖**两个**根形态（同 input 的 D69）。
  // antd 把组件变量声明在每个 `-css-var` 根上，而预览浮层的根拿到的是
  // `mergedRootClassName`（含 cssVarCls）⇒ 它也带 `-css-var` 类；本仓无这个类，
  // 等价做法是让声明块同时挂在 `.apollo-image` 与 `.apollo-image-preview` 上。
  // 只挂前者时：预览浮层经 Teleport 挂在 body 上、**不在** `.apollo-image` 子树内，
  // 于是 `var(--apollo-image-preview-operation-size)` 等全部失效 ⇒ 关闭按钮
  // font-size 由 18px 回退成继承的 16px（图标 1em ⇒ 16px，antd 18px）。
  // 抓它的层：L6（`image/preview__light__*` 0.011%–0.043% block-diff，且差异像素
  // 100% 落在关闭按钮的 40×40 区域内）；L4 的 contract 档看不见（丢 style）。
  const body = rename(`{${DECLS}}`).slice(1, -1);
  const decls = [`.apollo-image{${body}}`, `.apollo-image-preview{${body}}`].join('\n');
  return `${KEYFRAMES}
${decls}
${rename(RULES)}`;
}
