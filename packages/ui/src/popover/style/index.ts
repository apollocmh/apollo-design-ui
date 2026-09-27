/**
 * Popover 的静态样式（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 components/popover/style（React SSR + extractStyle 产物
 * 逐条机械转换，提取脚本 tests/visual/debug/extract-popover.mjs；77 条规则，
 * 原序）。
 *
 * 与 antd 产物的转换规则：
 *   1. 去掉 :where(.css-dev-only-…) hash 前缀（静态移植无 hashId）。
 *   2. .ant-* → .apollo-*；--ant-* → --apollo-*；.ant-zoom-big → .apollo-zoom-big。
 *   3. 动画名 css-dev-only…-antZoomBigIn/Out → 本仓稳定命名
 *      apollo-popover-zoom-big-in/-out（keyframes 在 KEYFRAMES 段内联；内容与
 *      zoom-big-fast 完全一致 —— antd 两套 motion 共享 antZoomBigIn/Out）。
 *   4. 组件变量声明块：antd 挂在 .css-var-root.ant-popover 上（死选择器）；本仓按
 *      input D69 同判，落在唯一的根形态 .apollo-popover 上
 *      （genPopoverTokenDecls 等价替代）。antd 混入产物里的 tooltip css-var 死块
 *      （.ant-popover-css-var）已丢弃 —— popover 规则所需的
 *      --apollo-tooltip-arrow-offset-x 等全部由 placement 规则本地定义。
 *   5. wireframe 主题态不支持（D84）：标题三件套取非线框缺省值。
 *
 * ⚠️ 三条提取期教训（COMPONENT-CHECKLIST #79/#80/#81）本组件逐条核对过：
 *    anticon 引用 0 处、common/reset 规则在首条内完整（resetComponent 合入）、
 *    无 @supports 块。
 */

import { popoverTokenValues } from './token';

/** 组件变量声明（对拍 antd 的 .css-var-root.ant-popover 块）。 */
export function genPopoverTokenDecls(): string {
  const t = popoverTokenValues();
  return (
    `--apollo-popover-title-min-width:${t.titleMinWidth}px;` +
    `--apollo-popover-z-index-popup:${t.zIndexPopup};` +
    `--apollo-popover-arrow-shadow-width:${t.arrowShadowWidth}px;` +
    `--apollo-popover-arrow-path:${t.arrowPath};` +
    `--apollo-popover-arrow-polygon:${t.arrowPolygon};` +
    `--apollo-popover-arrow-offset-horizontal:${t.arrowOffsetHorizontal}px;` +
    `--apollo-popover-arrow-offset-vertical:${t.arrowOffsetVertical}px;` +
    `--apollo-popover-inner-padding:${t.innerPadding}px;` +
    `--apollo-popover-title-margin-bottom:${t.titleMarginBottom}px;` +
    `--apollo-popover-title-padding:${t.titlePadding};` +
    `--apollo-popover-title-border-bottom:${t.titleBorderBottom};` +
    `--apollo-popover-inner-content-padding:${t.innerContentPadding};` +
    // 运行时变量的缺省值：真实值由 Trigger 在对齐时内联写入浮层根
    //（rc-trigger 与浮层 CSS 的运行时契约，antd 逐字同构）
    '--arrow-x:0px;--arrow-y:0px;'
  );
}

/** antd motion 的 @keyframes（zoom.ts 的 antZoomBigIn/Out，稳定命名）。 */
const KEYFRAMES = `@keyframes apollo-popover-zoom-big-in{0%{transform:scale(0.8);opacity:0;}100%{transform:scale(1);opacity:1;}}
@keyframes apollo-popover-zoom-big-out{0%{transform:scale(1);}100%{transform:scale(0.8);opacity:0;}}`;

/** antd 产物机械转换段（77 条，原序）。 */
const RULES = `
.apollo-popover{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:absolute;top:0;left:0;z-index:var(--apollo-popover-z-index-popup);font-weight:normal;white-space:normal;text-align:start;cursor:auto;user-select:text;filter:var(--apollo-drop-shadow-popover);--apollo-tooltip-valid-offset-x:var(--apollo-tooltip-arrow-offset-x, var(--arrow-x));transform-origin:var(--apollo-tooltip-valid-offset-x, 50%) var(--arrow-y, 50%);--apollo-tooltip-arrow-background-color:var(--apollo-color-bg-elevated);width:max-content;max-width:100vw;}
.apollo-popover-rtl{direction:rtl;}
.apollo-popover-hidden{display:none;}
.apollo-popover .apollo-popover-content{color:var(--apollo-color-text);padding:var(--apollo-popover-inner-content-padding);}
.apollo-popover .apollo-popover-container{background-color:var(--apollo-color-bg-elevated);background-clip:padding-box;border-radius:var(--apollo-border-radius-lg);padding:var(--apollo-popover-inner-padding);}
.apollo-popover .apollo-popover-title{min-width:var(--apollo-popover-title-min-width);margin-bottom:var(--apollo-popover-title-margin-bottom);color:var(--apollo-color-text-heading);font-weight:var(--apollo-font-weight-strong);border-bottom:var(--apollo-popover-title-border-bottom);padding:var(--apollo-popover-title-padding);}
.apollo-popover .apollo-popover-arrow{position:absolute;z-index:1;display:block;pointer-events:none;width:var(--apollo-size-popup-arrow);height:var(--apollo-size-popup-arrow);overflow:hidden;}
.apollo-popover .apollo-popover-arrow::before{position:absolute;bottom:0;inset-inline-start:0;width:var(--apollo-size-popup-arrow);height:calc(var(--apollo-size-popup-arrow) / 2);background:var(--apollo-tooltip-arrow-background-color);clip-path:var(--apollo-popover-arrow-polygon);clip-path:var(--apollo-popover-arrow-path);content:"";}
.apollo-popover .apollo-popover-arrow::after{content:"";position:absolute;width:var(--apollo-popover-arrow-shadow-width);height:var(--apollo-popover-arrow-shadow-width);bottom:0;inset-inline:0;margin:auto;border-radius:0 0 var(--apollo-border-radius-xs) 0;transform:translateY(50%) rotate(-135deg);z-index:0;background:transparent;}
.apollo-popover .apollo-popover-arrow:before{background:var(--apollo-tooltip-arrow-background-color);}
.apollo-popover-placement-top>.apollo-popover-arrow,.apollo-popover-placement-topLeft>.apollo-popover-arrow,.apollo-popover-placement-topRight>.apollo-popover-arrow{bottom:0;transform:translateY(100%) rotate(180deg);}
.apollo-popover-placement-top>.apollo-popover-arrow{left:50%;transform:translateX(-50%) translateY(100%) rotate(180deg);}
.apollo-popover-placement-topLeft{--apollo-tooltip-arrow-offset-x:var(--apollo-popover-arrow-offset-horizontal);}
.apollo-popover-placement-topLeft >.apollo-popover-arrow{left:var(--apollo-popover-arrow-offset-horizontal);}
.apollo-popover-placement-topRight{--apollo-tooltip-arrow-offset-x:calc(100% - var(--apollo-popover-arrow-offset-horizontal));}
.apollo-popover-placement-topRight >.apollo-popover-arrow{right:var(--apollo-popover-arrow-offset-horizontal);}
.apollo-popover-placement-bottom>.apollo-popover-arrow,.apollo-popover-placement-bottomLeft>.apollo-popover-arrow,.apollo-popover-placement-bottomRight>.apollo-popover-arrow{top:0;transform:translateY(-100%);}
.apollo-popover-placement-bottom>.apollo-popover-arrow{left:50%;transform:translateX(-50%) translateY(-100%);}
.apollo-popover-placement-bottomLeft{--apollo-tooltip-arrow-offset-x:var(--apollo-popover-arrow-offset-horizontal);}
.apollo-popover-placement-bottomLeft >.apollo-popover-arrow{left:var(--apollo-popover-arrow-offset-horizontal);}
.apollo-popover-placement-bottomRight{--apollo-tooltip-arrow-offset-x:calc(100% - var(--apollo-popover-arrow-offset-horizontal));}
.apollo-popover-placement-bottomRight >.apollo-popover-arrow{right:var(--apollo-popover-arrow-offset-horizontal);}
.apollo-popover-placement-left>.apollo-popover-arrow,.apollo-popover-placement-leftTop>.apollo-popover-arrow,.apollo-popover-placement-leftBottom>.apollo-popover-arrow{right:0;transform:translateX(100%) rotate(90deg);}
.apollo-popover-placement-left>.apollo-popover-arrow{top:50%;transform:translateY(-50%) translateX(100%) rotate(90deg);}
.apollo-popover-placement-leftTop>.apollo-popover-arrow{top:var(--apollo-popover-arrow-offset-vertical);}
.apollo-popover-placement-leftBottom>.apollo-popover-arrow{bottom:var(--apollo-popover-arrow-offset-vertical);}
.apollo-popover-placement-right>.apollo-popover-arrow,.apollo-popover-placement-rightTop>.apollo-popover-arrow,.apollo-popover-placement-rightBottom>.apollo-popover-arrow{left:0;transform:translateX(-100%) rotate(-90deg);}
.apollo-popover-placement-right>.apollo-popover-arrow{top:50%;transform:translateY(-50%) translateX(-100%) rotate(-90deg);}
.apollo-popover-placement-rightTop>.apollo-popover-arrow{top:var(--apollo-popover-arrow-offset-vertical);}
.apollo-popover-placement-rightBottom>.apollo-popover-arrow{bottom:var(--apollo-popover-arrow-offset-vertical);}
.apollo-popover-pure{position:relative;max-width:none;margin:var(--apollo-size-popup-arrow);display:inline-block;}
.apollo-popover.apollo-popover-blue{--apollo-tooltip-arrow-background-color:var(--apollo-blue-6);}
.apollo-popover.apollo-popover-blue .apollo-popover-inner{background-color:var(--apollo-blue-6);}
.apollo-popover.apollo-popover-blue .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-purple{--apollo-tooltip-arrow-background-color:var(--apollo-purple-6);}
.apollo-popover.apollo-popover-purple .apollo-popover-inner{background-color:var(--apollo-purple-6);}
.apollo-popover.apollo-popover-purple .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-cyan{--apollo-tooltip-arrow-background-color:var(--apollo-cyan-6);}
.apollo-popover.apollo-popover-cyan .apollo-popover-inner{background-color:var(--apollo-cyan-6);}
.apollo-popover.apollo-popover-cyan .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-green{--apollo-tooltip-arrow-background-color:var(--apollo-green-6);}
.apollo-popover.apollo-popover-green .apollo-popover-inner{background-color:var(--apollo-green-6);}
.apollo-popover.apollo-popover-green .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-magenta{--apollo-tooltip-arrow-background-color:var(--apollo-magenta-6);}
.apollo-popover.apollo-popover-magenta .apollo-popover-inner{background-color:var(--apollo-magenta-6);}
.apollo-popover.apollo-popover-magenta .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-pink{--apollo-tooltip-arrow-background-color:var(--apollo-pink-6);}
.apollo-popover.apollo-popover-pink .apollo-popover-inner{background-color:var(--apollo-pink-6);}
.apollo-popover.apollo-popover-pink .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-red{--apollo-tooltip-arrow-background-color:var(--apollo-red-6);}
.apollo-popover.apollo-popover-red .apollo-popover-inner{background-color:var(--apollo-red-6);}
.apollo-popover.apollo-popover-red .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-orange{--apollo-tooltip-arrow-background-color:var(--apollo-orange-6);}
.apollo-popover.apollo-popover-orange .apollo-popover-inner{background-color:var(--apollo-orange-6);}
.apollo-popover.apollo-popover-orange .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-yellow{--apollo-tooltip-arrow-background-color:var(--apollo-yellow-6);}
.apollo-popover.apollo-popover-yellow .apollo-popover-inner{background-color:var(--apollo-yellow-6);}
.apollo-popover.apollo-popover-yellow .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-volcano{--apollo-tooltip-arrow-background-color:var(--apollo-volcano-6);}
.apollo-popover.apollo-popover-volcano .apollo-popover-inner{background-color:var(--apollo-volcano-6);}
.apollo-popover.apollo-popover-volcano .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-geekblue{--apollo-tooltip-arrow-background-color:var(--apollo-geekblue-6);}
.apollo-popover.apollo-popover-geekblue .apollo-popover-inner{background-color:var(--apollo-geekblue-6);}
.apollo-popover.apollo-popover-geekblue .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-lime{--apollo-tooltip-arrow-background-color:var(--apollo-lime-6);}
.apollo-popover.apollo-popover-lime .apollo-popover-inner{background-color:var(--apollo-lime-6);}
.apollo-popover.apollo-popover-lime .apollo-popover-arrow{background:transparent;}
.apollo-popover.apollo-popover-gold{--apollo-tooltip-arrow-background-color:var(--apollo-gold-6);}
.apollo-popover.apollo-popover-gold .apollo-popover-inner{background-color:var(--apollo-gold-6);}
.apollo-popover.apollo-popover-gold .apollo-popover-arrow{background:transparent;}
.apollo-zoom-big-enter,.apollo-zoom-big-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-zoom-big-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-zoom-big-enter.apollo-zoom-big-enter-active,.apollo-zoom-big-appear.apollo-zoom-big-appear-active{animation-name:apollo-popover-zoom-big-in;animation-play-state:running;}
.apollo-zoom-big-leave.apollo-zoom-big-leave-active{animation-name:apollo-popover-zoom-big-out;animation-play-state:running;pointer-events:none;}
.apollo-zoom-big-enter,.apollo-zoom-big-appear{transform:scale(0);opacity:0;animation-timing-function:var(--apollo-motion-ease-out-circ);}
.apollo-zoom-big-enter-prepare,.apollo-zoom-big-appear-prepare{transform:none;}
.apollo-zoom-big-leave{animation-timing-function:var(--apollo-motion-ease-in-out-circ);}
`;
// 规则以默认前缀 `apollo` 落盘；其余静态前缀（ant）在出口处整体替换
// 类名段（keyframes 名不含点号，不受影响）—— upload 同一约定。
export function genPopoverStyle(prefixCls: string = 'apollo'): string {
  const rules =
    prefixCls === 'apollo' ? RULES : RULES.split('.apollo-popover').join(`.${prefixCls}-popover`);
  const decls =
    prefixCls === 'apollo'
      ? `.apollo-popover{${genPopoverTokenDecls()}}`
      : `.${prefixCls}-popover{${genPopoverTokenDecls()}}`;
  return `${KEYFRAMES}\n${decls}\n${rules}`;
}
