/**
 * Form 的静态样式（antd 6.6.4 `es/form/style/index.js` + `explain.js` 的**机械移植**）。
 *
 * ── 这份文件是怎么来的 ──────────────────────────────────────────────────────
 *
 * 规则体**不是**照源码推演的，而是从 antd 的真实产物转出来的：
 *
 * ```
 * node tests/visual/debug/extract-form-css.mjs --emit-static
 * ```
 *
 * 该脚本用 cssinjs 的 `extractStyle` dump `ConfigProvider theme.cssVar:true` 下的
 * Form CSS（脚本里把所有形态都渲染了一遍：size / vertical / inline / feedback /
 * explain / tooltip / hidden / labelCol 24），然后做**只删壳、不改值**的转换：
 *
 *   1. 去 `:where(.css-dev-only-do-not-override-X)` 作用域壳（D5：本仓无 hash 轨）
 *   2. 去 `.ant-form-css-var` 双轨段（D5：零运行时无 css-var 类机制）
 *   3. `.ant-` → `.apollo-`、`--ant-` → `--apollo-`、`.anticon` → `.apollo-icon`
 *   4. keyframes 去 hash（`css-dev-only-…-antZoomIn` ⇒ `apolloZoomIn`）
 *
 * ⚠️ 空白折叠必须折成**单个空格**而不是删掉：antd 的 CSS-in-JS 把后代选择器写成
 *    换行 + 缩进，删空白会把「后代」粘成「复合」，那是语义改变（实测踩过）。
 *
 * ── 已知的、有意为之的差异 ──────────────────────────────────────────────────
 *
 * - 无 `-css-var` 轨；Component Token 声明块改挂在 `.apollo-form`（见 `token.ts`）。
 * - `@keyframes apolloZoomIn` 是 antd 的 `antZoomIn` 去 hash 版（`-feedback-icon`
 *   的入场动画）。本仓此前没有组件发过 keyframes，这是第一条 —— 若出现第二个
 *   消费者应上移到 motion 包，别让 keyframes 在组件间重复定义。
 * - 网格覆盖变量 `--apollo-grid-display` 由 `-item-control` 声明为 flex，
 *   消费方在 `grid/style`（本轮已按 antd 逐字接线）。
 *
 * ⚠️ `rootPrefixCls` 仅支持默认 `apollo`：规则体是静态移植（var 名已含根前缀），
 *    参数为 API 对齐保留（input / cascader 同判）。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * Component Token 声明块（**11 个字段**，对拍 antd 产物里
 * `data-token-hash="css-var-…"` 的 `.ant-form-css-var` 块）。
 *
 * ⚠️ 第 11 个 `inlineItemMarginBottom` 只在 `-inline` 布局规则里被消费 ——
 *    漏声明时那条规则静默回退到继承值，静态 CSS 看不出来（PITFALLS 170 同族）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  return [
    `  --${rootPrefixCls}-form-label-required-mark-color:${v('colorError')};`,
    `  --${rootPrefixCls}-form-label-color:${v('colorTextHeading')};`,
    `  --${rootPrefixCls}-form-label-font-size:${v('fontSize')};`,
    `  --${rootPrefixCls}-form-label-height:${v('controlHeight')};`,
    `  --${rootPrefixCls}-form-vertical-label-height:auto;`,
    `  --${rootPrefixCls}-form-label-colon-margin-inline-start:calc(${v('marginXXS')} / 2);`,
    `  --${rootPrefixCls}-form-label-colon-margin-inline-end:${v('marginXS')};`,
    `  --${rootPrefixCls}-form-item-margin-bottom:${v('marginLG')};`,
    `  --${rootPrefixCls}-form-vertical-label-padding:0 0 ${v('paddingXS')};`,
    `  --${rootPrefixCls}-form-vertical-label-margin:0;`,
    `  --${rootPrefixCls}-form-inline-item-margin-bottom:0;`,
  ];
}

/** antd 产物机械转换段（75 条规则 + 1 条 keyframes，原序）。 */
const RULES = String.raw`
.apollo-form{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);}
.apollo-form legend{display:block;width:100%;margin-bottom:var(--apollo-margin-lg);padding:0;color:var(--apollo-color-text-description);font-size:var(--apollo-font-size-lg);line-height:inherit;border:0;border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);}
.apollo-form select[multiple],.apollo-form select[size]{height:auto;}
.apollo-form output{display:block;padding-top:15px;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);}
.apollo-form .apollo-form-text{display:inline-block;padding-inline-end:var(--apollo-padding-sm);}
.apollo-form-small .apollo-form-item .apollo-form-item-label>label{height:var(--apollo-control-height-sm);}
.apollo-form-large .apollo-form-item .apollo-form-item-label>label{height:var(--apollo-control-height-lg);}
.apollo-form-item{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);margin-bottom:var(--apollo-form-item-margin-bottom);vertical-align:top;}
.apollo-form-item-with-help{transition:none;}
.apollo-form-item-hidden,.apollo-form-item-hidden.apollo-row{display:none;}
.apollo-form-item .apollo-form-item-label{flex-grow:0;overflow:hidden;white-space:nowrap;text-align:end;vertical-align:middle;}
.apollo-form-item .apollo-form-item-label-left{text-align:start;}
.apollo-form-item .apollo-form-item-label-wrap{overflow:unset;line-height:var(--apollo-line-height);white-space:unset;}
.apollo-form-item .apollo-form-item-label-wrap >label{vertical-align:middle;text-wrap:balance;}
.apollo-form-item .apollo-form-item-label >label{position:relative;display:inline-flex;align-items:center;max-width:100%;height:var(--apollo-form-label-height);color:var(--apollo-form-label-color);font-size:var(--apollo-form-label-font-size);}
.apollo-form-item .apollo-form-item-label >label >.apollo-icon{font-size:var(--apollo-font-size);vertical-align:top;}
.apollo-form-item .apollo-form-item-label >label.apollo-form-item-required::before{display:inline-block;margin-inline-end:var(--apollo-margin-xxs);color:var(--apollo-form-label-required-mark-color);font-size:var(--apollo-font-size);font-family:sans-serif;line-height:1;content:"*";}
.apollo-form-item .apollo-form-item-label >label.apollo-form-item-required.apollo-form-item-required-mark-hidden::before,.apollo-form-item .apollo-form-item-label >label.apollo-form-item-required.apollo-form-item-required-mark-optional::before{display:none;}
.apollo-form-item .apollo-form-item-label >label .apollo-form-item-optional{display:inline-block;margin-inline-start:var(--apollo-margin-xxs);color:var(--apollo-color-text-description);}
.apollo-form-item .apollo-form-item-label >label .apollo-form-item-optional.apollo-form-item-required-mark-hidden{display:none;}
.apollo-form-item .apollo-form-item-label >label .apollo-form-item-tooltip{color:var(--apollo-color-text-description);cursor:help;writing-mode:horizontal-tb;margin-inline-start:var(--apollo-margin-xxs);}
.apollo-form-item .apollo-form-item-label >label::after{content:":";position:relative;margin-block:0;margin-inline-start:var(--apollo-form-label-colon-margin-inline-start);margin-inline-end:var(--apollo-form-label-colon-margin-inline-end);}
.apollo-form-item .apollo-form-item-label >label.apollo-form-item-no-colon::after{content:"\a0";}
.apollo-form-item .apollo-form-item-control{--apollo-grid-display:flex;flex-direction:column;flex-grow:1;}
.apollo-form-item .apollo-form-item-control:first-child:not([class^="'ant-col-'"]):not([class*="' ant-col-'"]){width:100%;}
.apollo-form-item .apollo-form-item-additional{display:flex;flex-direction:column;}
.apollo-form-item .apollo-form-item-explain,.apollo-form-item .apollo-form-item-extra{clear:both;color:var(--apollo-color-text-description);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);}
.apollo-form-item .apollo-form-item-explain-connected{width:100%;}
.apollo-form-item .apollo-form-item-extra{min-height:var(--apollo-control-height-sm);transition:color var(--apollo-motion-duration-mid) var(--apollo-motion-ease-out);}
.apollo-form-item .apollo-form-item-explain-error{color:var(--apollo-color-error);}
.apollo-form-item .apollo-form-item-explain-warning{color:var(--apollo-color-warning);}
.apollo-form-item-with-help .apollo-form-item-explain{height:auto;opacity:1;}
.apollo-form-item .apollo-form-item-feedback-icon{font-size:var(--apollo-font-size);text-align:center;visibility:visible;animation-name:apolloZoomIn;animation-duration:var(--apollo-motion-duration-mid);animation-timing-function:var(--apollo-motion-ease-out-back);pointer-events:none;}
.apollo-form-item .apollo-form-item-feedback-icon-success{color:var(--apollo-color-success);}
.apollo-form-item .apollo-form-item-feedback-icon-error{color:var(--apollo-color-error);}
.apollo-form-item .apollo-form-item-feedback-icon-warning{color:var(--apollo-color-warning);}
.apollo-form-item .apollo-form-item-feedback-icon-validating{color:var(--apollo-color-primary);}
.apollo-form-show-help{transition:opacity var(--apollo-motion-duration-fast) var(--apollo-motion-ease-in-out);}
.apollo-form-show-help-appear,.apollo-form-show-help-enter{opacity:0;}
.apollo-form-show-help-appear-active,.apollo-form-show-help-enter-active{opacity:1;}
.apollo-form-show-help-leave{opacity:1;}
.apollo-form-show-help-leave-active{opacity:0;}
.apollo-form-show-help .apollo-form-show-help-item{overflow:hidden;transition:height var(--apollo-motion-duration-fast) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-fast) var(--apollo-motion-ease-in-out),transform var(--apollo-motion-duration-fast) var(--apollo-motion-ease-in-out)!important;}
.apollo-form-show-help .apollo-form-show-help-item.apollo-form-show-help-item-appear,.apollo-form-show-help .apollo-form-show-help-item.apollo-form-show-help-item-enter{transform:translateY(-5px);opacity:0;}
.apollo-form-show-help .apollo-form-show-help-item.apollo-form-show-help-item-appear-active,.apollo-form-show-help .apollo-form-show-help-item.apollo-form-show-help-item-enter-active{transform:translateY(0);opacity:1;}
.apollo-form-show-help .apollo-form-show-help-item.apollo-form-show-help-item-leave-active{transform:translateY(-5px);}
.apollo-form-item-horizontal .apollo-form-item-label{flex-grow:0;}
.apollo-form-item-horizontal .apollo-form-item-control{flex:1 1 0;min-width:0;}
.apollo-form-item-horizontal .apollo-form-item-label[class$='-24']+.apollo-form-item-control,.apollo-form-item-horizontal .apollo-form-item-label[class*='-24 ']+.apollo-form-item-control{min-width:unset;}
.apollo-form-item-horizontal >.apollo-form-item-row>.apollo-col-24.apollo-form-item-label,.apollo-form-item-horizontal >.apollo-form-item-row>.apollo-col-xl-24.apollo-form-item-label{padding:var(--apollo-form-vertical-label-padding);white-space:initial;text-align:start;margin:var(--apollo-form-vertical-label-margin);}
.apollo-form-item-horizontal >.apollo-form-item-row>.apollo-col-24.apollo-form-item-label >label,.apollo-form-item-horizontal >.apollo-form-item-row>.apollo-col-xl-24.apollo-form-item-label >label{margin:0;}
.apollo-form-item-horizontal >.apollo-form-item-row>.apollo-col-24.apollo-form-item-label >label::after,.apollo-form-item-horizontal >.apollo-form-item-row>.apollo-col-xl-24.apollo-form-item-label >label::after{visibility:hidden;}
.apollo-form-inline{display:flex;flex-wrap:wrap;}
.apollo-form-inline .apollo-form-item-inline{flex:none;margin-inline-end:var(--apollo-margin);margin-bottom:var(--apollo-form-inline-item-margin-bottom);}
.apollo-form-inline .apollo-form-item-inline-row{flex-wrap:nowrap;}
.apollo-form-inline .apollo-form-item-inline >.apollo-form-item-label,.apollo-form-inline .apollo-form-item-inline >.apollo-form-item-control{display:inline-block;vertical-align:top;}
.apollo-form-inline .apollo-form-item-inline >.apollo-form-item-label{flex:none;}
.apollo-form-inline .apollo-form-item-inline .apollo-form-text{display:inline-block;}
.apollo-form-inline .apollo-form-item-inline .apollo-form-item-has-feedback{display:inline-block;}
.apollo-form-item{--apollo-form-item-label-margin:initial;}
.apollo-form-item-label{margin:var(--apollo-form-item-label-margin);}
.apollo-form-item-vertical .apollo-form-item-row{flex-direction:column;}
.apollo-form-item-vertical .apollo-form-item-label>label{height:var(--apollo-form-vertical-label-height);}
.apollo-form-item-vertical .apollo-form-item-control{width:100%;flex:none;}
.apollo-form-item-vertical >.apollo-form-item-row>.apollo-form-item-label,.apollo-form-item-vertical >.apollo-form-item-row>.apollo-col-24.apollo-form-item-label,.apollo-form-item-vertical >.apollo-form-item-row>.apollo-col-xl-24.apollo-form-item-label{padding:var(--apollo-form-vertical-label-padding);white-space:initial;text-align:start;--apollo-form-item-label-margin:var(--apollo-form-vertical-label-margin);}
.apollo-form-item-vertical >.apollo-form-item-row>.apollo-form-item-label >label,.apollo-form-item-vertical >.apollo-form-item-row>.apollo-col-24.apollo-form-item-label >label,.apollo-form-item-vertical >.apollo-form-item-row>.apollo-col-xl-24.apollo-form-item-label >label{margin:0;}
.apollo-form-item-vertical >.apollo-form-item-row>.apollo-form-item-label >label::after,.apollo-form-item-vertical >.apollo-form-item-row>.apollo-col-24.apollo-form-item-label >label::after,.apollo-form-item-vertical >.apollo-form-item-row>.apollo-col-xl-24.apollo-form-item-label >label::after{visibility:hidden;}
@media (max-width: 575px){.apollo-form-item:not(.apollo-form-item-vertical)>.apollo-form-item-row>.apollo-form-item-label{padding:var(--apollo-form-vertical-label-padding);white-space:initial;text-align:start;margin:var(--apollo-form-vertical-label-margin);}.apollo-form-item:not(.apollo-form-item-vertical)>.apollo-form-item-row>.apollo-form-item-label >label{margin:0;}.apollo-form-item:not(.apollo-form-item-vertical)>.apollo-form-item-row>.apollo-form-item-label >label::after{visibility:hidden;}.apollo-form:not(.apollo-form-inline) .apollo-form-item{flex-wrap:wrap;}.apollo-form:not(.apollo-form-inline) .apollo-form-item .apollo-form-item-label:not([class*=" ant-col-xs"]),.apollo-form:not(.apollo-form-inline) .apollo-form-item .apollo-form-item-control:not([class*=" ant-col-xs"]){flex:0 0 100%;max-width:100%;}.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-xs-24.apollo-form-item-label{padding:var(--apollo-form-vertical-label-padding);white-space:initial;text-align:start;margin:var(--apollo-form-vertical-label-margin);}.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-xs-24.apollo-form-item-label >label{margin:0;}.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-xs-24.apollo-form-item-label >label::after{visibility:hidden;}}
@media (max-width: 767px){.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-sm-24.apollo-form-item-label{padding:var(--apollo-form-vertical-label-padding);white-space:initial;text-align:start;margin:var(--apollo-form-vertical-label-margin);}.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-sm-24.apollo-form-item-label >label{margin:0;}.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-sm-24.apollo-form-item-label >label::after{visibility:hidden;}}
@media (max-width: 991px){.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-md-24.apollo-form-item-label{padding:var(--apollo-form-vertical-label-padding);white-space:initial;text-align:start;margin:var(--apollo-form-vertical-label-margin);}.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-md-24.apollo-form-item-label >label{margin:0;}.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-md-24.apollo-form-item-label >label::after{visibility:hidden;}}
@media (max-width: 1199px){.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-lg-24.apollo-form-item-label{padding:var(--apollo-form-vertical-label-padding);white-space:initial;text-align:start;margin:var(--apollo-form-vertical-label-margin);}.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-lg-24.apollo-form-item-label >label{margin:0;}.apollo-form .apollo-form-item:not(.apollo-form-item-horizontal):not(.apollo-form-item-vertical) >.apollo-form-item-row>.apollo-col-lg-24.apollo-form-item-label >label::after{visibility:hidden;}}
.apollo-form .apollo-motion-collapse-legacy{overflow:hidden;}
.apollo-form .apollo-motion-collapse-legacy-active{transition:height var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out)!important;}
.apollo-form .apollo-motion-collapse{overflow:hidden;transition:height var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out)!important;}
@media screen and (-ms-high-contrast: active),(-ms-high-contrast: none){.apollo-form-item-control{display:flex;}}
@keyframes apolloZoomIn{0%{transform:scale(0.2);opacity:0;}100%{transform:scale(1);opacity:1;}}
`;

/**
 * 样式入口：token 声明块 + 规则体。
 *
 * 🚨 **声明块必须包在选择器里**：`--x: v;` 这种裸声明是无效 CSS，
 *    会让紧随其后的规则一起被解析器丢弃（本次收口前就是这样 ——
 *    `--apollo-form-item-margin-bottom` 从未生效过，item 之间没有 24px 间距，
 *    而「没有视觉基线」让这个 bug 一直没被发现）。
 *
 * ⚠️ 要挂**两个根**（antd 的做法是每个带 `-css-var` 类的元素都声明一份）：
 *    `.apollo-form` 覆盖正常用法，`.apollo-form-item` 覆盖脱离 Form 单独使用
 *    Item 的形态（与 input 的三种根同判，见 CHECKLIST #77）。
 */
export function genFormStyle(rootPrefixCls: string): string {
  const d = genTokenDecls(rootPrefixCls).join('');
  const decls = [`.${rootPrefixCls}-form{${d}}`, `.${rootPrefixCls}-form-item{${d}}`].join('\n\n');
  return `${decls}\n\n${RULES}`;
}
