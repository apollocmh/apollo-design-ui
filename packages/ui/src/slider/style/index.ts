/**
 * Slider 的静态样式（antd 6.6.4 `es/slider/style/index.js` 的**机械移植**）。
 *
 * ── 这份文件是怎么来的 ──────────────────────────────────────────────────────
 *
 * ```
 * node tests/visual/debug/extract-slider-css.mjs --emit-static
 * ```
 *
 * 只做「删壳改名、不改值」：去 `:where(.css-dev-only-do-not-override-X)` 作用域壳、
 * 去 `.ant-slider-css-var` 双轨段、`.ant-` → `.apollo-`（**含属性选择器里的 `"ant-` 字面量**）、
 * 空白折成**单空格**（折成空会把后代选择器粘成复合选择器 —— form 收到过这条教训）。
 *
 * ── 规则面（54 条）────────────────────────────────────────────────────────────
 *
 * 根 / `-horizontal` / `-vertical` / `-with-marks` / `-disabled` / `-rtl` / `-lock`
 * + `-rail` / `-track(-{i+1})` / `-tracks` / `-track-draggable` /
 * `-step` / `-dot(-active)` / `-handle(-{i+1})(-dragging)(-dragging-delete)(-disabled)`
 * （含 hover/active/focus 的 `::before` / `::after` 与 `-lock` 下的抑制）/
 * `-mark` / `-mark-text(-active)`。
 *
 * ⚠️ antd 的 `marginPart` **不是 token**：产物里它始终是 calc 表达式
 *    （`calc((var(--apollo-control-height) - var(--apollo-slider-control-size)) / 2)`），
 *    已逐字落在规则里 —— 别在 token.ts 里另造一个数字常量。
 *
 * ⚠️ 单位：产物里数值 token 带 `px`（`10px` / `4px` / `2.5px`）—— `genTokenDecls` 用
 *    `toCssSize` 输出，别写裸数字（PITFALLS 170 族）。
 */

import { toCssSize } from '../../_internal/to-css-size';
import { sliderTokenValues } from './token';

/**
 * Component Token 声明块（18 个字段，对拍 antd 产物的 `.ant-slider-css-var` 块）。
 *
 * ⚠️ 数值字段必须带 `px`（antd 的 `unitless` 没列 slider 的任何字段 ⇒ 产物带单位）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const t = sliderTokenValues();
  const px = (value: number): string => toCssSize(value) ?? `${value}px`;
  const n = `--${rootPrefixCls}-slider`;
  return [
    `  ${n}-control-size:${px(t.controlSize)};`,
    `  ${n}-rail-size:${px(t.railSize)};`,
    `  ${n}-handle-size:${px(t.handleSize)};`,
    `  ${n}-handle-size-hover:${px(t.handleSizeHover)};`,
    `  ${n}-dot-size:${px(t.dotSize)};`,
    `  ${n}-handle-line-width:${px(t.handleLineWidth)};`,
    `  ${n}-handle-line-width-hover:${px(t.handleLineWidthHover)};`,
    `  ${n}-rail-bg:${t.railBg};`,
    `  ${n}-rail-hover-bg:${t.railHoverBg};`,
    `  ${n}-track-bg:${t.trackBg};`,
    `  ${n}-track-hover-bg:${t.trackHoverBg};`,
    `  ${n}-handle-color:${t.handleColor};`,
    `  ${n}-handle-active-color:${t.handleActiveColor};`,
    `  ${n}-handle-active-outline-color:${t.handleActiveOutlineColor};`,
    `  ${n}-handle-color-disabled:${t.handleColorDisabled};`,
    `  ${n}-dot-border-color:${t.dotBorderColor};`,
    `  ${n}-dot-active-border-color:${t.dotActiveBorderColor};`,
    `  ${n}-track-bg-disabled:${t.trackBgDisabled};`,
  ];
}

/** antd 产物机械转换段（54 条规则，原序）。 */
const RULES = `
.apollo-slider{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}
.apollo-slider::before,.apollo-slider::after{box-sizing:border-box;}
.apollo-slider [class^="apollo-slider"],.apollo-slider [class*=" apollo-slider"]{box-sizing:border-box;}
.apollo-slider [class^="apollo-slider"]::before,.apollo-slider [class*=" apollo-slider"]::before,.apollo-slider [class^="apollo-slider"]::after,.apollo-slider [class*=" apollo-slider"]::after{box-sizing:border-box;}
.apollo-slider{box-sizing:border-box;margin:calc((var(--apollo-control-height) - var(--apollo-slider-control-size)) / 2) calc(var(--apollo-slider-control-size) / 2);padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:relative;height:var(--apollo-slider-control-size);cursor:pointer;touch-action:none;user-select:none;}
.apollo-slider-vertical{margin:calc(var(--apollo-slider-control-size) / 2) calc((var(--apollo-control-height) - var(--apollo-slider-control-size)) / 2);}
.apollo-slider .apollo-slider-rail{position:absolute;background-color:var(--apollo-slider-rail-bg);border-radius:var(--apollo-border-radius-xs);transition:background-color var(--apollo-motion-duration-mid);}
.apollo-slider .apollo-slider-track,.apollo-slider .apollo-slider-tracks{position:absolute;transition:background-color var(--apollo-motion-duration-mid);}
.apollo-slider .apollo-slider-track{background-color:var(--apollo-slider-track-bg);border-radius:var(--apollo-border-radius-xs);}
.apollo-slider .apollo-slider-track-draggable{box-sizing:content-box;background-clip:content-box;border:solid rgba(0,0,0,0);}
.apollo-slider:hover .apollo-slider-rail{background-color:var(--apollo-slider-rail-hover-bg);}
.apollo-slider:hover .apollo-slider-track{background-color:var(--apollo-slider-track-hover-bg);}
.apollo-slider:hover .apollo-slider-dot{border-color:var(--apollo-color-fill-content-hover);}
.apollo-slider:hover .apollo-slider-handle:not(.apollo-slider-handle-disabled)::after{box-shadow:0 0 0 var(--apollo-slider-handle-line-width) var(--apollo-color-primary-border-hover);}
.apollo-slider:hover .apollo-slider-dot-active{border-color:var(--apollo-slider-dot-active-border-color);}
.apollo-slider .apollo-slider-handle{position:absolute;width:var(--apollo-slider-handle-size);height:var(--apollo-slider-handle-size);outline:none;user-select:none;}
.apollo-slider .apollo-slider-handle-dragging-delete{opacity:0;}
.apollo-slider .apollo-slider-handle::before{content:"";position:absolute;inset-inline-start:calc(var(--apollo-slider-handle-line-width) * -1);inset-block-start:calc(var(--apollo-slider-handle-line-width) * -1);width:calc(var(--apollo-slider-handle-size) + var(--apollo-slider-handle-line-width) * 2);height:calc(var(--apollo-slider-handle-size) + var(--apollo-slider-handle-line-width) * 2);background-color:transparent;}
.apollo-slider .apollo-slider-handle::after{content:"";position:absolute;inset-block-start:0;inset-inline-start:0;width:var(--apollo-slider-handle-size);height:var(--apollo-slider-handle-size);background-color:var(--apollo-color-bg-elevated);box-shadow:0 0 0 var(--apollo-slider-handle-line-width) var(--apollo-slider-handle-color);outline:0px solid transparent;border-radius:50%;cursor:pointer;transition:inset-inline-start var(--apollo-motion-duration-mid),inset-block-start var(--apollo-motion-duration-mid),width var(--apollo-motion-duration-mid),height var(--apollo-motion-duration-mid),box-shadow var(--apollo-motion-duration-mid),outline var(--apollo-motion-duration-mid);}
.apollo-slider .apollo-slider-handle:hover:not(.apollo-slider-handle-disabled)::before,.apollo-slider .apollo-slider-handle:active:not(.apollo-slider-handle-disabled)::before,.apollo-slider .apollo-slider-handle:focus:not(.apollo-slider-handle-disabled)::before{inset-inline-start:calc(((var(--apollo-slider-handle-size-hover) - var(--apollo-slider-handle-size)) / 2 + var(--apollo-slider-handle-line-width-hover)) * -1);inset-block-start:calc(((var(--apollo-slider-handle-size-hover) - var(--apollo-slider-handle-size)) / 2 + var(--apollo-slider-handle-line-width-hover)) * -1);width:calc(var(--apollo-slider-handle-size-hover) + var(--apollo-slider-handle-line-width-hover) * 2);height:calc(var(--apollo-slider-handle-size-hover) + var(--apollo-slider-handle-line-width-hover) * 2);}
.apollo-slider .apollo-slider-handle:hover:not(.apollo-slider-handle-disabled)::after,.apollo-slider .apollo-slider-handle:active:not(.apollo-slider-handle-disabled)::after,.apollo-slider .apollo-slider-handle:focus:not(.apollo-slider-handle-disabled)::after{box-shadow:0 0 0 var(--apollo-slider-handle-line-width-hover) var(--apollo-slider-handle-active-color);outline:6px solid var(--apollo-slider-handle-active-outline-color);width:var(--apollo-slider-handle-size-hover);height:var(--apollo-slider-handle-size-hover);inset-inline-start:calc((var(--apollo-slider-handle-size) - var(--apollo-slider-handle-size-hover)) / 2);inset-block-start:calc((var(--apollo-slider-handle-size) - var(--apollo-slider-handle-size-hover)) / 2);}
.apollo-slider-lock .apollo-slider-handle::before,.apollo-slider-lock .apollo-slider-handle::after{transition:none;}
.apollo-slider .apollo-slider-mark{position:absolute;font-size:var(--apollo-font-size);}
.apollo-slider .apollo-slider-mark-text{position:absolute;display:inline-block;color:var(--apollo-color-text-description);text-align:center;word-break:keep-all;cursor:pointer;user-select:none;}
.apollo-slider .apollo-slider-mark-text-active{color:var(--apollo-color-text);}
.apollo-slider .apollo-slider-step{position:absolute;background:transparent;pointer-events:none;}
.apollo-slider .apollo-slider-dot{position:absolute;width:var(--apollo-slider-dot-size);height:var(--apollo-slider-dot-size);background-color:var(--apollo-color-bg-elevated);border:var(--apollo-slider-handle-line-width) solid var(--apollo-slider-dot-border-color);border-radius:50%;cursor:pointer;transition:border-color var(--apollo-motion-duration-slow);pointer-events:auto;}
.apollo-slider .apollo-slider-dot-active{border-color:var(--apollo-slider-dot-active-border-color);}
.apollo-slider.apollo-slider-disabled{cursor:not-allowed;}
.apollo-slider.apollo-slider-disabled .apollo-slider-rail{background-color:var(--apollo-slider-rail-bg)!important;}
.apollo-slider.apollo-slider-disabled .apollo-slider-track{background-color:var(--apollo-slider-track-bg-disabled)!important;}
.apollo-slider.apollo-slider-disabled .apollo-slider-dot{background-color:var(--apollo-color-bg-elevated);border-color:var(--apollo-slider-track-bg-disabled);box-shadow:none;cursor:not-allowed;}
.apollo-slider.apollo-slider-disabled .apollo-slider-handle::after{background-color:var(--apollo-color-bg-elevated);cursor:not-allowed;width:var(--apollo-slider-handle-size);height:var(--apollo-slider-handle-size);box-shadow:0 0 0 var(--apollo-slider-handle-line-width) var(--apollo-slider-handle-color-disabled);inset-inline-start:0;inset-block-start:0;}
.apollo-slider.apollo-slider-disabled .apollo-slider-mark-text,.apollo-slider.apollo-slider-disabled .apollo-slider-dot{cursor:not-allowed!important;}
.apollo-slider .apollo-slider-handle-disabled::after{background-color:var(--apollo-color-bg-elevated);cursor:not-allowed;width:var(--apollo-slider-handle-size);height:var(--apollo-slider-handle-size);box-shadow:0 0 0 var(--apollo-slider-handle-line-width) var(--apollo-slider-handle-color-disabled);inset-inline-start:0;inset-block-start:0;}
.apollo-slider-tooltip .apollo-tooltip-container{min-width:unset;}
.apollo-slider-horizontal{padding-block:var(--apollo-slider-rail-size);height:calc(var(--apollo-slider-rail-size) * 3);}
.apollo-slider-horizontal .apollo-slider-rail{width:100%;height:var(--apollo-slider-rail-size);}
.apollo-slider-horizontal .apollo-slider-track,.apollo-slider-horizontal .apollo-slider-tracks{height:var(--apollo-slider-rail-size);}
.apollo-slider-horizontal .apollo-slider-track-draggable{border-width:calc((var(--apollo-slider-handle-size) - var(--apollo-slider-rail-size)) / 2) 0;transform:translateY(calc(calc((var(--apollo-slider-handle-size) - var(--apollo-slider-rail-size)) / 2) * -1));}
.apollo-slider-horizontal .apollo-slider-handle{inset-block-start:calc((var(--apollo-slider-rail-size) * 3 - var(--apollo-slider-handle-size)) / 2);}
.apollo-slider-horizontal .apollo-slider-mark{inset-inline-start:0;top:calc(var(--apollo-slider-rail-size) * 3 + 0px);width:100%;}
.apollo-slider-horizontal .apollo-slider-step{inset-inline-start:0;top:var(--apollo-slider-rail-size);width:100%;height:var(--apollo-slider-rail-size);}
.apollo-slider-horizontal .apollo-slider-dot{position:absolute;inset-block-start:calc((var(--apollo-slider-rail-size) - var(--apollo-slider-dot-size)) / 2);}
.apollo-slider-horizontal.apollo-slider-with-marks{margin-bottom:calc(var(--apollo-control-height-lg) - var(--apollo-slider-control-size));}
.apollo-slider-vertical{padding-inline:var(--apollo-slider-rail-size);width:calc(var(--apollo-slider-rail-size) * 3);height:100%;}
.apollo-slider-vertical .apollo-slider-rail{height:100%;width:var(--apollo-slider-rail-size);}
.apollo-slider-vertical .apollo-slider-track,.apollo-slider-vertical .apollo-slider-tracks{width:var(--apollo-slider-rail-size);}
.apollo-slider-vertical .apollo-slider-track-draggable{border-width:0 calc((var(--apollo-slider-handle-size) - var(--apollo-slider-rail-size)) / 2);transform:translateX(calc(calc((var(--apollo-slider-handle-size) - var(--apollo-slider-rail-size)) / 2) * -1));}
.apollo-slider-vertical .apollo-slider-handle{inset-inline-start:calc((var(--apollo-slider-rail-size) * 3 - var(--apollo-slider-handle-size)) / 2);}
.apollo-slider-vertical .apollo-slider-mark{inset-inline-start:calc(var(--apollo-slider-rail-size) * 3 + calc(var(--apollo-slider-control-size) / 2));top:0;height:100%;}
.apollo-slider-vertical .apollo-slider-step{inset-inline-start:var(--apollo-slider-rail-size);top:0;height:100%;width:var(--apollo-slider-rail-size);}
.apollo-slider-vertical .apollo-slider-dot{position:absolute;inset-inline-start:calc((var(--apollo-slider-rail-size) - var(--apollo-slider-dot-size)) / 2);}
.css-var-_R_0_.apollo-slider{--apollo-slider-control-size:10px;--apollo-slider-rail-size:4px;--apollo-slider-handle-size:10px;--apollo-slider-handle-size-hover:12px;--apollo-slider-dot-size:8px;--apollo-slider-handle-line-width:2px;--apollo-slider-handle-line-width-hover:2.5px;--apollo-slider-rail-bg:rgba(0,0,0,0.04);--apollo-slider-rail-hover-bg:rgba(0,0,0,0.06);--apollo-slider-track-bg:#91caff;--apollo-slider-track-hover-bg:#69b1ff;--apollo-slider-handle-color:#91caff;--apollo-slider-handle-active-color:#1677ff;--apollo-slider-handle-active-outline-color:rgba(22,119,255,0.2);--apollo-slider-handle-color-disabled:#bfbfbf;--apollo-slider-dot-border-color:#f0f0f0;--apollo-slider-dot-active-border-color:#91caff;--apollo-slider-track-bg-disabled:rgba(0,0,0,0.04);}
`;

/**
 * 样式入口：token 声明块（**挂在根选择器里**）+ 规则体。
 *
 * 🚨 声明块必须包在选择器里 —— 裸声明是无效 CSS，会让紧随其后的规则一起被丢弃
 *    （form 收口时踩过：`--apollo-form-item-margin-bottom` 从未生效）。
 */
export function genSliderStyle(rootPrefixCls: string): string {
  const d = genTokenDecls(rootPrefixCls).join('');
  return `.${rootPrefixCls}-slider{${d}}\n\n${RULES}`;
}
