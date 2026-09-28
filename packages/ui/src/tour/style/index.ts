/**
 * Tour 的静态样式（G4 产物）。
 *
 * 契约来源：antd 6.6.4 es/tour/style（SSR extractStyle 产物逐条机械转换，
 * 提取脚本 tests/visual/debug/extract-tour-css.mjs；60 条规则，原序）。
 *
 * 与 antd 产物的转换规则（与 tooltip/style 同判）：
 *   1. 去掉 :where(.css-dev-only-…) hash 前缀（静态移植无 hashId）。
 *   2. .ant-* → .apollo-*；--ant-* → --apollo-*（`.ant-btn` → `.apollo-btn` ——
 *      本仓 Button 前缀是 apollo-btn；ant 前缀产物下随 prefixCls 一起替换）。
 *   3. 组件变量声明块：antd 挂在 .css-var-*.ant-tour 上（死选择器）；本仓按
 *      tooltip D69 同判，落在唯一的根形态 .{prefix}-tour 上（PurePanel 根同时带
 *      该类，变量沿树可达）。
 *   4. ⚠️ Tour 的箭头变量**借用 tooltip 组**（上游 genCssVar(antCls, 'tooltip')）：
 *      根规则里的 `--apollo-tooltip-arrow-background-color` 与各 placement 的
 *      `--apollo-tooltip-arrow-offset-x` 照原样保留（tooltip 的 dist CSS 里有声明）。
 *   5. 无 @keyframes —— rc-tour 的 Trigger 不传 motion；唯一的动效是蒙层挖洞的
 *      transition（`-placeholder-animated`）。
 *   6. `width: 520px` 与指示器 `6px` 是产物字面量（非 token 变量），E10 豁免
 *      （image 100px / float-button 9999px 同判）。
 *   7. 双份 clip-path（polygon 然后 path）是上游真实产物，逐字保留。
 */

import { tourTokenValues } from './token';

/** 组件变量声明（对拍 antd 的 .css-var-*.ant-tour 块；单位规则见 token.ts 头注释）。 */
export function genTourTokenDecls(): string {
  const t = tourTokenValues();
  return (
    `--apollo-tour-z-index-popup:${t.zIndexPopup};` +
    `--apollo-tour-close-btn-size:${t.closeBtnSize}px;` +
    `--apollo-tour-primary-prev-btn-bg:${t.primaryPrevBtnBg};` +
    `--apollo-tour-primary-next-btn-hover-bg:${t.primaryNextBtnHoverBg};` +
    `--apollo-tour-arrow-offset-horizontal:${t.arrowOffsetHorizontal}px;` +
    `--apollo-tour-arrow-offset-vertical:${t.arrowOffsetVertical}px;` +
    `--apollo-tour-arrow-shadow-width:${t.arrowShadowWidth}px;` +
    `--apollo-tour-arrow-path:${t.arrowPath};` +
    `--apollo-tour-arrow-polygon:${t.arrowPolygon};`
  );
}

/** antd 产物机械转换段（60 条，原序）。 */
const RULES = `
.apollo-tour{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}
.apollo-tour::before,.apollo-tour::after{box-sizing:border-box;}
.apollo-tour [class^="apollo-tour"],.apollo-tour [class*=" apollo-tour"]{box-sizing:border-box;}
.apollo-tour [class^="apollo-tour"]::before,.apollo-tour [class*=" apollo-tour"]::before,.apollo-tour [class^="apollo-tour"]::after,.apollo-tour [class*=" apollo-tour"]::after{box-sizing:border-box;}
.apollo-tour{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:absolute;z-index:var(--apollo-tour-z-index-popup);max-width:fit-content;visibility:visible;width:520px;--apollo-tooltip-arrow-background-color:var(--apollo-color-bg-elevated);}
.apollo-tour-pure{max-width:100%;position:relative;}
.apollo-tour.apollo-tour-hidden{display:none;}
.apollo-tour .apollo-tour-panel{position:relative;}
.apollo-tour .apollo-tour-section{text-align:start;text-decoration:none;border-radius:var(--apollo-border-radius-lg);box-shadow:var(--apollo-box-shadow-tertiary);position:relative;background-color:var(--apollo-color-bg-elevated);border:none;background-clip:padding-box;}
.apollo-tour .apollo-tour-section .apollo-tour-close{position:absolute;top:var(--apollo-padding);inset-inline-end:var(--apollo-padding);color:var(--apollo-color-icon);background:none;border:none;width:var(--apollo-tour-close-btn-size);height:var(--apollo-tour-close-btn-size);border-radius:var(--apollo-border-radius-sm);transition:color var(--apollo-motion-duration-mid),background-color var(--apollo-motion-duration-mid);display:flex;align-items:center;justify-content:center;cursor:pointer;}
.apollo-tour .apollo-tour-section .apollo-tour-close:hover{color:var(--apollo-color-icon-hover);background-color:var(--apollo-color-bg-text-hover);}
.apollo-tour .apollo-tour-section .apollo-tour-close:active{background-color:var(--apollo-color-bg-text-active);}
.apollo-tour .apollo-tour-section .apollo-tour-close:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-tour .apollo-tour-section .apollo-tour-cover{text-align:center;padding:calc(var(--apollo-padding) + var(--apollo-tour-close-btn-size) + var(--apollo-padding-xs)) var(--apollo-padding) 0;}
.apollo-tour .apollo-tour-section .apollo-tour-cover img{width:100%;}
.apollo-tour .apollo-tour-section .apollo-tour-header{padding:var(--apollo-padding) var(--apollo-padding) var(--apollo-padding-xs);width:calc(100% - var(--apollo-tour-close-btn-size));word-break:break-word;}
.apollo-tour .apollo-tour-section .apollo-tour-header .apollo-tour-title{font-weight:var(--apollo-font-weight-strong);}
.apollo-tour .apollo-tour-section .apollo-tour-description{padding:0 var(--apollo-padding);word-wrap:break-word;}
.apollo-tour .apollo-tour-section .apollo-tour-footer{padding:var(--apollo-padding-xs) var(--apollo-padding) var(--apollo-padding);text-align:end;border-radius:0 0 var(--apollo-border-radius-xs) var(--apollo-border-radius-xs);display:flex;}
.apollo-tour .apollo-tour-section .apollo-tour-footer .apollo-tour-indicators{display:inline-block;}
.apollo-tour .apollo-tour-section .apollo-tour-footer .apollo-tour-indicators .apollo-tour-indicator{width:6px;height:6px;display:inline-block;border-radius:50%;background:var(--apollo-color-fill);}
.apollo-tour .apollo-tour-section .apollo-tour-footer .apollo-tour-indicators .apollo-tour-indicator:not(:last-child){margin-inline-end:6px;}
.apollo-tour .apollo-tour-section .apollo-tour-footer .apollo-tour-indicators .apollo-tour-indicator-active{background:var(--apollo-color-primary);}
.apollo-tour .apollo-tour-section .apollo-tour-footer .apollo-tour-actions{margin-inline-start:auto;}
.apollo-tour .apollo-tour-section .apollo-tour-footer .apollo-tour-actions .apollo-btn{margin-inline-start:var(--apollo-margin-xs);}
.apollo-tour .apollo-tour-primary,.apollo-tour.apollo-tour-primary{--apollo-tooltip-arrow-background-color:var(--apollo-color-primary);}
.apollo-tour .apollo-tour-primary .apollo-tour-section,.apollo-tour.apollo-tour-primary .apollo-tour-section{color:var(--apollo-color-text-light-solid);text-align:start;text-decoration:none;background-color:var(--apollo-color-primary);border-radius:var(--apollo-border-radius);box-shadow:var(--apollo-box-shadow-tertiary);}
.apollo-tour .apollo-tour-primary .apollo-tour-section .apollo-tour-close,.apollo-tour.apollo-tour-primary .apollo-tour-section .apollo-tour-close{color:var(--apollo-color-text-light-solid);}
.apollo-tour .apollo-tour-primary .apollo-tour-section .apollo-tour-indicators .apollo-tour-indicator,.apollo-tour.apollo-tour-primary .apollo-tour-section .apollo-tour-indicators .apollo-tour-indicator{background:var(--apollo-tour-primary-prev-btn-bg);}
.apollo-tour .apollo-tour-primary .apollo-tour-section .apollo-tour-indicators .apollo-tour-indicator-active,.apollo-tour.apollo-tour-primary .apollo-tour-section .apollo-tour-indicators .apollo-tour-indicator-active{background:var(--apollo-color-text-light-solid);}
.apollo-tour .apollo-tour-primary .apollo-tour-section .apollo-tour-prev-btn,.apollo-tour.apollo-tour-primary .apollo-tour-section .apollo-tour-prev-btn{color:var(--apollo-color-text-light-solid);border-color:var(--apollo-tour-primary-prev-btn-bg);background-color:var(--apollo-color-primary);}
.apollo-tour .apollo-tour-primary .apollo-tour-section .apollo-tour-prev-btn:hover,.apollo-tour.apollo-tour-primary .apollo-tour-section .apollo-tour-prev-btn:hover{color:var(--apollo-color-text-light-solid);background-color:var(--apollo-tour-primary-prev-btn-bg);border-color:transparent;}
.apollo-tour .apollo-tour-primary .apollo-tour-section .apollo-tour-next-btn,.apollo-tour.apollo-tour-primary .apollo-tour-section .apollo-tour-next-btn{color:var(--apollo-color-primary);border-color:transparent;background:var(--apollo-color-white);}
.apollo-tour .apollo-tour-primary .apollo-tour-section .apollo-tour-next-btn:hover,.apollo-tour.apollo-tour-primary .apollo-tour-section .apollo-tour-next-btn:hover{background:var(--apollo-tour-primary-next-btn-hover-bg);}
.apollo-tour-mask .apollo-tour-placeholder-animated{transition:all var(--apollo-motion-duration-slow);}
.apollo-tour-placement-left .apollo-tour-section,.apollo-tour-placement-leftTop .apollo-tour-section,.apollo-tour-placement-leftBottom .apollo-tour-section,.apollo-tour-placement-right .apollo-tour-section,.apollo-tour-placement-rightTop .apollo-tour-section,.apollo-tour-placement-rightBottom .apollo-tour-section{border-radius:min(var(--apollo-border-radius-lg),8px);}
.apollo-tour .apollo-tour-arrow{position:absolute;z-index:1;display:block;pointer-events:none;width:var(--apollo-size-popup-arrow);height:var(--apollo-size-popup-arrow);overflow:hidden;}
.apollo-tour .apollo-tour-arrow::before{position:absolute;bottom:0;inset-inline-start:0;width:var(--apollo-size-popup-arrow);height:calc(var(--apollo-size-popup-arrow) / 2);background:var(--apollo-tooltip-arrow-background-color);clip-path:var(--apollo-tour-arrow-polygon);clip-path:var(--apollo-tour-arrow-path);content:"";}
.apollo-tour .apollo-tour-arrow::after{content:"";position:absolute;width:var(--apollo-tour-arrow-shadow-width);height:var(--apollo-tour-arrow-shadow-width);bottom:0;inset-inline:0;margin:auto;border-radius:0 0 var(--apollo-border-radius-xs) 0;transform:translateY(50%) rotate(-135deg);z-index:0;background:transparent;box-shadow:var(--apollo-box-shadow-popover-arrow);}
.apollo-tour .apollo-tour-arrow:before{background:var(--apollo-tooltip-arrow-background-color);}
.apollo-tour-placement-top>.apollo-tour-arrow,.apollo-tour-placement-topLeft>.apollo-tour-arrow,.apollo-tour-placement-topRight>.apollo-tour-arrow{bottom:0;transform:translateY(100%) rotate(180deg);}
.apollo-tour-placement-top>.apollo-tour-arrow{left:50%;transform:translateX(-50%) translateY(100%) rotate(180deg);}
.apollo-tour-placement-topLeft{--apollo-tooltip-arrow-offset-x:var(--apollo-tour-arrow-offset-horizontal);}
.apollo-tour-placement-topLeft >.apollo-tour-arrow{left:var(--apollo-tour-arrow-offset-horizontal);}
.apollo-tour-placement-topRight{--apollo-tooltip-arrow-offset-x:calc(100% - var(--apollo-tour-arrow-offset-horizontal));}
.apollo-tour-placement-topRight >.apollo-tour-arrow{right:var(--apollo-tour-arrow-offset-horizontal);}
.apollo-tour-placement-bottom>.apollo-tour-arrow,.apollo-tour-placement-bottomLeft>.apollo-tour-arrow,.apollo-tour-placement-bottomRight>.apollo-tour-arrow{top:0;transform:translateY(-100%);}
.apollo-tour-placement-bottom>.apollo-tour-arrow{left:50%;transform:translateX(-50%) translateY(-100%);}
.apollo-tour-placement-bottomLeft{--apollo-tooltip-arrow-offset-x:var(--apollo-tour-arrow-offset-horizontal);}
.apollo-tour-placement-bottomLeft >.apollo-tour-arrow{left:var(--apollo-tour-arrow-offset-horizontal);}
.apollo-tour-placement-bottomRight{--apollo-tooltip-arrow-offset-x:calc(100% - var(--apollo-tour-arrow-offset-horizontal));}
.apollo-tour-placement-bottomRight >.apollo-tour-arrow{right:var(--apollo-tour-arrow-offset-horizontal);}
.apollo-tour-placement-left>.apollo-tour-arrow,.apollo-tour-placement-leftTop>.apollo-tour-arrow,.apollo-tour-placement-leftBottom>.apollo-tour-arrow{right:0;transform:translateX(100%) rotate(90deg);}
.apollo-tour-placement-left>.apollo-tour-arrow{top:50%;transform:translateY(-50%) translateX(100%) rotate(90deg);}
.apollo-tour-placement-leftTop>.apollo-tour-arrow{top:var(--apollo-tour-arrow-offset-vertical);}
.apollo-tour-placement-leftBottom>.apollo-tour-arrow{bottom:var(--apollo-tour-arrow-offset-vertical);}
.apollo-tour-placement-right>.apollo-tour-arrow,.apollo-tour-placement-rightTop>.apollo-tour-arrow,.apollo-tour-placement-rightBottom>.apollo-tour-arrow{left:0;transform:translateX(-100%) rotate(-90deg);}
.apollo-tour-placement-right>.apollo-tour-arrow{top:50%;transform:translateY(-50%) translateX(-100%) rotate(-90deg);}
.apollo-tour-placement-rightTop>.apollo-tour-arrow{top:var(--apollo-tour-arrow-offset-vertical);}
.apollo-tour-placement-rightBottom>.apollo-tour-arrow{bottom:var(--apollo-tour-arrow-offset-vertical);}
`;

/**
 * 生成 Tour 全量静态 CSS（组件变量声明块 + 组件规则）。
 * 自定义前缀走 popover 同款字符串替换（R9：只预生成 apollo / ant 两份）。
 */
export function genTourStyle(prefixCls: string = 'apollo'): string {
  if (prefixCls === 'apollo') {
    return `.${prefixCls}-tour{${genTourTokenDecls()}}\n${RULES}`;
  }
  const rules = RULES.split('.apollo-tour')
    .join(`.${prefixCls}-tour`)
    .split('.apollo-btn')
    .join(`.${prefixCls}-btn`);
  return `.${prefixCls}-tour{${genTourTokenDecls()}}\n${rules}`;
}
