/**
 * Tooltip 的静态样式（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 es/tooltip/style（React SSR + extractStyle 产物逐条机械转换，
 * 提取脚本 tests/visual/debug/extract-tooltip.mjs；76 条规则，原序）。
 *
 * 与 antd 产物的转换规则：
 *   1. 去掉 :where(.css-dev-only-…) hash 前缀（静态移植无 hashId）。
 *   2. .ant-* → .apollo-*；--ant-* → --apollo-*；.ant-fade-* → .apollo-fade-*。
 *   3. 动画名 css-dev-only…-antFadeIn/Out、antZoomBigIn/Out → 本仓稳定命名
 *      apollo-tooltip-fade-in/-out、apollo-tooltip-zoom-big-in/-out（keyframes 在
 *      KEYFRAMES 段内联；SSR 的 extractStyle 不含 @keyframes，内容照抄
 *      components/style/{fade,zoom}.ts 的 Keyframes 定义）。
 *   4. 组件变量声明块：antd 挂在 .css-var-root.ant-tooltip-css-var 上（死选择器）；
 *      本仓按 input D69 同判，落在唯一的根形态 .apollo-tooltip 上（PurePanel 根
 *      同时带 .apollo-tooltip 类，变量沿树可达）。antd 的该块原样落在规则里会
 *      违反 E10（字面量 8px），已删除并以 genTooltipTokenDecls 等价替代。
 *   5. unique-container 三条规则保留（UniqueProvider v1 不做，类名永不出现 ——
 *      与 radio U7/U8 的死选择器同判，不修）。
 *   6. 动画名/keyframes 不影响静态像素与 DOM 契约（视觉基线跑动效禁用）。
 *
 * ⚠️ 三条提取期教训（COMPONENT-CHECKLIST #79/#80/#81）本组件逐条核对过：
 *    anticon 引用 0 处、common/reset 规则在首条内完整（resetComponent 合入）、
 *    无 @supports 块。
 */

import { tooltipTokenValues } from './token';

/** 组件变量声明（对拍 antd 的 .css-var-root.ant-tooltip-css-var 块）。 */
export function genTooltipTokenDecls(): string {
  const t = tooltipTokenValues();
  return (
    `--apollo-tooltip-z-index-popup:${t.zIndexPopup};` +
    `--apollo-tooltip-max-width:${t.maxWidth}px;` +
    `--apollo-tooltip-arrow-offset-horizontal:${t.arrowOffsetHorizontal}px;` +
    `--apollo-tooltip-arrow-offset-vertical:${t.arrowOffsetVertical}px;` +
    `--apollo-tooltip-arrow-shadow-width:${t.arrowShadowWidth}px;` +
    `--apollo-tooltip-arrow-path:${t.arrowPath};` +
    `--apollo-tooltip-arrow-polygon:${t.arrowPolygon};` +
    '--apollo-tooltip-max-vertical-content-radius:8px;' +
    // 运行时变量的缺省值：真实值由 Trigger 在对齐时内联写入浮层根
    //（rc-trigger 与浮层 CSS 的运行时契约，antd 逐字同构）
    '--arrow-x:0px;--arrow-y:0px;'
  );
}

/** antd motion 的 @keyframes（fade.ts / zoom.ts，命名空间换为本仓稳定名）。 */
const KEYFRAMES = `@keyframes apollo-tooltip-fade-in{0%{opacity:0;}100%{opacity:1;}}
@keyframes apollo-tooltip-fade-out{0%{opacity:1;}100%{opacity:0;}}
@keyframes apollo-tooltip-zoom-big-in{0%{transform:scale(0.8);opacity:0;}100%{transform:scale(1);opacity:1;}}
@keyframes apollo-tooltip-zoom-big-out{0%{transform:scale(1);}100%{transform:scale(0.8);opacity:0;}}`;

/** antd 产物机械转换段（76 条，原序）。 */
const RULES = `
.apollo-tooltip{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:absolute;z-index:var(--apollo-tooltip-z-index-popup);display:block;width:max-content;max-width:var(--apollo-tooltip-max-width);visibility:visible;filter:var(--apollo-drop-shadow-popover);--apollo-tooltip-valid-offset-x:var(--apollo-tooltip-arrow-offset-x, var(--arrow-x));transform-origin:var(--apollo-tooltip-valid-offset-x, 50%) var(--arrow-y, 50%);--apollo-tooltip-arrow-background-color:var(--apollo-color-bg-spotlight);}
.apollo-tooltip-hidden{display:none;}
.apollo-tooltip .apollo-tooltip-container{min-width:calc(var(--apollo-border-radius) * 2 + var(--apollo-size-popup-arrow));min-height:var(--apollo-control-height);padding:calc(var(--apollo-padding-sm) / 2) var(--apollo-padding-xs);color:var(--apollo-tooltip-overlay-color, var(--apollo-color-text-light-solid));text-align:start;text-decoration:none;word-wrap:break-word;background-color:var(--apollo-color-bg-spotlight);border-radius:var(--apollo-border-radius);box-sizing:border-box;}
.apollo-tooltip .apollo-tooltip-container.apollo-fade-enter,.apollo-tooltip .apollo-tooltip-container.apollo-fade-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-tooltip .apollo-tooltip-container.apollo-fade-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-tooltip .apollo-tooltip-container.apollo-fade-enter.apollo-fade-enter-active,.apollo-tooltip .apollo-tooltip-container.apollo-fade-appear.apollo-fade-appear-active{animation-name:apollo-tooltip-fade-in;animation-play-state:running;}
.apollo-tooltip .apollo-tooltip-container.apollo-fade-leave.apollo-fade-leave-active{animation-name:apollo-tooltip-fade-out;animation-play-state:running;pointer-events:none;}
.apollo-tooltip .apollo-tooltip-container.apollo-fade-enter,.apollo-tooltip .apollo-tooltip-container.apollo-fade-appear{opacity:0;animation-timing-function:linear;}
.apollo-tooltip .apollo-tooltip-container.apollo-fade-leave{animation-timing-function:linear;}
.apollo-tooltip:has(~ .apollo-tooltip-unique-container) .apollo-tooltip-container{border:none;background:transparent;}
.apollo-tooltip-placement-topLeft,.apollo-tooltip-placement-topRight,.apollo-tooltip-placement-bottomLeft,.apollo-tooltip-placement-bottomRight{min-width:calc(var(--apollo-border-radius) + var(--apollo-size-popup-arrow) + var(--apollo-tooltip-arrow-offset-horizontal));}
.apollo-tooltip-placement-left .apollo-tooltip-inner,.apollo-tooltip-placement-leftTop .apollo-tooltip-inner,.apollo-tooltip-placement-leftBottom .apollo-tooltip-inner,.apollo-tooltip-placement-right .apollo-tooltip-inner,.apollo-tooltip-placement-rightTop .apollo-tooltip-inner,.apollo-tooltip-placement-rightBottom .apollo-tooltip-inner{border-radius:min(var(--apollo-border-radius),var(--apollo-tooltip-max-vertical-content-radius));}
.apollo-tooltip .apollo-tooltip-content{position:relative;}
.apollo-tooltip.apollo-tooltip-blue .apollo-tooltip-container{background-color:var(--apollo-blue-6);}
.apollo-tooltip.apollo-tooltip-blue .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-blue-6);}
.apollo-tooltip.apollo-tooltip-purple .apollo-tooltip-container{background-color:var(--apollo-purple-6);}
.apollo-tooltip.apollo-tooltip-purple .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-purple-6);}
.apollo-tooltip.apollo-tooltip-cyan .apollo-tooltip-container{background-color:var(--apollo-cyan-6);}
.apollo-tooltip.apollo-tooltip-cyan .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-cyan-6);}
.apollo-tooltip.apollo-tooltip-green .apollo-tooltip-container{background-color:var(--apollo-green-6);}
.apollo-tooltip.apollo-tooltip-green .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-green-6);}
.apollo-tooltip.apollo-tooltip-magenta .apollo-tooltip-container{background-color:var(--apollo-magenta-6);}
.apollo-tooltip.apollo-tooltip-magenta .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-magenta-6);}
.apollo-tooltip.apollo-tooltip-pink .apollo-tooltip-container{background-color:var(--apollo-pink-6);}
.apollo-tooltip.apollo-tooltip-pink .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-pink-6);}
.apollo-tooltip.apollo-tooltip-red .apollo-tooltip-container{background-color:var(--apollo-red-6);}
.apollo-tooltip.apollo-tooltip-red .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-red-6);}
.apollo-tooltip.apollo-tooltip-orange .apollo-tooltip-container{background-color:var(--apollo-orange-6);}
.apollo-tooltip.apollo-tooltip-orange .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-orange-6);}
.apollo-tooltip.apollo-tooltip-yellow .apollo-tooltip-container{background-color:var(--apollo-yellow-6);}
.apollo-tooltip.apollo-tooltip-yellow .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-yellow-6);}
.apollo-tooltip.apollo-tooltip-volcano .apollo-tooltip-container{background-color:var(--apollo-volcano-6);}
.apollo-tooltip.apollo-tooltip-volcano .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-volcano-6);}
.apollo-tooltip.apollo-tooltip-geekblue .apollo-tooltip-container{background-color:var(--apollo-geekblue-6);}
.apollo-tooltip.apollo-tooltip-geekblue .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-geekblue-6);}
.apollo-tooltip.apollo-tooltip-lime .apollo-tooltip-container{background-color:var(--apollo-lime-6);}
.apollo-tooltip.apollo-tooltip-lime .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-lime-6);}
.apollo-tooltip.apollo-tooltip-gold .apollo-tooltip-container{background-color:var(--apollo-gold-6);}
.apollo-tooltip.apollo-tooltip-gold .apollo-tooltip-arrow{--apollo-tooltip-arrow-background-color:var(--apollo-gold-6);}
.apollo-tooltip-rtl{direction:rtl;}
.apollo-tooltip .apollo-tooltip-arrow{position:absolute;z-index:1;display:block;pointer-events:none;width:var(--apollo-size-popup-arrow);height:var(--apollo-size-popup-arrow);overflow:hidden;}
.apollo-tooltip .apollo-tooltip-arrow::before{position:absolute;bottom:0;inset-inline-start:0;width:var(--apollo-size-popup-arrow);height:calc(var(--apollo-size-popup-arrow) / 2);background:var(--apollo-tooltip-arrow-background-color);clip-path:var(--apollo-tooltip-arrow-polygon);clip-path:var(--apollo-tooltip-arrow-path);content:"";}
.apollo-tooltip .apollo-tooltip-arrow::after{content:"";position:absolute;width:var(--apollo-tooltip-arrow-shadow-width);height:var(--apollo-tooltip-arrow-shadow-width);bottom:0;inset-inline:0;margin:auto;border-radius:0 0 var(--apollo-border-radius-xs) 0;transform:translateY(50%) rotate(-135deg);z-index:0;background:transparent;}
.apollo-tooltip .apollo-tooltip-arrow:before{background:var(--apollo-tooltip-arrow-background-color);}
.apollo-tooltip-placement-top>.apollo-tooltip-arrow,.apollo-tooltip-placement-topLeft>.apollo-tooltip-arrow,.apollo-tooltip-placement-topRight>.apollo-tooltip-arrow{bottom:0;transform:translateY(100%) rotate(180deg);}
.apollo-tooltip-placement-top>.apollo-tooltip-arrow{left:50%;transform:translateX(-50%) translateY(100%) rotate(180deg);}
.apollo-tooltip-placement-topLeft{--apollo-tooltip-arrow-offset-x:var(--apollo-tooltip-arrow-offset-horizontal);}
.apollo-tooltip-placement-topLeft >.apollo-tooltip-arrow{left:var(--apollo-tooltip-arrow-offset-horizontal);}
.apollo-tooltip-placement-topRight{--apollo-tooltip-arrow-offset-x:calc(100% - var(--apollo-tooltip-arrow-offset-horizontal));}
.apollo-tooltip-placement-topRight >.apollo-tooltip-arrow{right:var(--apollo-tooltip-arrow-offset-horizontal);}
.apollo-tooltip-placement-bottom>.apollo-tooltip-arrow,.apollo-tooltip-placement-bottomLeft>.apollo-tooltip-arrow,.apollo-tooltip-placement-bottomRight>.apollo-tooltip-arrow{top:0;transform:translateY(-100%);}
.apollo-tooltip-placement-bottom>.apollo-tooltip-arrow{left:50%;transform:translateX(-50%) translateY(-100%);}
.apollo-tooltip-placement-bottomLeft{--apollo-tooltip-arrow-offset-x:var(--apollo-tooltip-arrow-offset-horizontal);}
.apollo-tooltip-placement-bottomLeft >.apollo-tooltip-arrow{left:var(--apollo-tooltip-arrow-offset-horizontal);}
.apollo-tooltip-placement-bottomRight{--apollo-tooltip-arrow-offset-x:calc(100% - var(--apollo-tooltip-arrow-offset-horizontal));}
.apollo-tooltip-placement-bottomRight >.apollo-tooltip-arrow{right:var(--apollo-tooltip-arrow-offset-horizontal);}
.apollo-tooltip-placement-left>.apollo-tooltip-arrow,.apollo-tooltip-placement-leftTop>.apollo-tooltip-arrow,.apollo-tooltip-placement-leftBottom>.apollo-tooltip-arrow{right:0;transform:translateX(100%) rotate(90deg);}
.apollo-tooltip-placement-left>.apollo-tooltip-arrow{top:50%;transform:translateY(-50%) translateX(100%) rotate(90deg);}
.apollo-tooltip-placement-leftTop>.apollo-tooltip-arrow{top:var(--apollo-tooltip-arrow-offset-vertical);}
.apollo-tooltip-placement-leftBottom>.apollo-tooltip-arrow{bottom:var(--apollo-tooltip-arrow-offset-vertical);}
.apollo-tooltip-placement-right>.apollo-tooltip-arrow,.apollo-tooltip-placement-rightTop>.apollo-tooltip-arrow,.apollo-tooltip-placement-rightBottom>.apollo-tooltip-arrow{left:0;transform:translateX(-100%) rotate(-90deg);}
.apollo-tooltip-placement-right>.apollo-tooltip-arrow{top:50%;transform:translateY(-50%) translateX(-100%) rotate(-90deg);}
.apollo-tooltip-placement-rightTop>.apollo-tooltip-arrow{top:var(--apollo-tooltip-arrow-offset-vertical);}
.apollo-tooltip-placement-rightBottom>.apollo-tooltip-arrow{bottom:var(--apollo-tooltip-arrow-offset-vertical);}
.apollo-tooltip-pure{position:relative;max-width:none;margin:var(--apollo-size-popup-arrow);}
.apollo-tooltip-unique-container{min-width:calc(var(--apollo-border-radius) * 2 + var(--apollo-size-popup-arrow));min-height:var(--apollo-control-height);padding:calc(var(--apollo-padding-sm) / 2) var(--apollo-padding-xs);color:var(--apollo-tooltip-overlay-color, var(--apollo-color-text-light-solid));text-align:start;text-decoration:none;word-wrap:break-word;background-color:var(--apollo-color-bg-spotlight);border-radius:var(--apollo-border-radius);box-sizing:border-box;--apollo-tooltip-valid-offset-x:var(--apollo-tooltip-arrow-offset-x, var(--arrow-x));transform-origin:var(--apollo-tooltip-valid-offset-x, 50%) var(--arrow-y, 50%);position:absolute;z-index:calc(var(--apollo-tooltip-z-index-popup) - 1);filter:var(--apollo-drop-shadow-popover);}
.apollo-tooltip-unique-container-hidden{display:none;}
.apollo-tooltip-unique-container-visible{transition:all var(--apollo-motion-duration-slow);}
.apollo-zoom-big-fast-enter,.apollo-zoom-big-fast-appear{animation-duration:var(--apollo-motion-duration-fast);animation-fill-mode:both;animation-play-state:paused;}
.apollo-zoom-big-fast-leave{animation-duration:var(--apollo-motion-duration-fast);animation-fill-mode:both;animation-play-state:paused;}
.apollo-zoom-big-fast-enter.apollo-zoom-big-fast-enter-active,.apollo-zoom-big-fast-appear.apollo-zoom-big-fast-appear-active{animation-name:apollo-tooltip-zoom-big-in;animation-play-state:running;}
.apollo-zoom-big-fast-leave.apollo-zoom-big-fast-leave-active{animation-name:apollo-tooltip-zoom-big-out;animation-play-state:running;pointer-events:none;}
.apollo-zoom-big-fast-enter,.apollo-zoom-big-fast-appear{transform:scale(0);opacity:0;animation-timing-function:var(--apollo-motion-ease-out-circ);}
.apollo-zoom-big-fast-enter-prepare,.apollo-zoom-big-fast-appear-prepare{transform:none;}
.apollo-zoom-big-fast-leave{animation-timing-function:var(--apollo-motion-ease-in-out-circ);}
`;

/** 生成 Tooltip 全量静态 CSS（keyframes + 组件变量声明块 + 组件规则）。 */
export function genTooltipStyle(): string {
  const decls = `.apollo-tooltip{${genTooltipTokenDecls()}}`;
  return `${KEYFRAMES}\n${decls}\n${RULES}`;
}
