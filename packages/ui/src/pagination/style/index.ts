/**
 * Pagination 的静态样式（antd 6.6.4 `es/pagination/style/index.js` 的**机械移植**）。
 *
 * ── 这份文件是怎么来的 ──────────────────────────────────────────────────────
 *
 * ```
 * node tests/visual/debug/extract-pagination-css.mjs --emit-static
 * ```
 *
 * 只做「删壳改名、不改值」：去 `:where(.css-dev-only-do-not-override-X)` 作用域壳、
 * 去 css-var 声明块（那份由 `genTokenDecls` 自己产出）、`.ant-` → `.apollo-`（含属性选择器
 * 里的 `"ant-` 字面量）、空白折成**单空格**。
 *
 * ── 规则面（108 条 + 2 个媒体查询）─────────────────────────────────────────────
 *
 * 根（含 `::before` / `::after` / `:not(-disabled) … :focus-visible`）/ `-item`（+ active /
 * disabled / hover / active / focus-visible / `a` 子选择器）/ `-item-link` / `-prev` / `-next`
 * （+ disabled / hover / active / focus-visible）/ `-jump-prev` / `-jump-next`
 * （+ `-item-container` / `-item-link-icon(-svg)` / `-item-ellipsis` 与 hover·focus-visible 的切换）/
 * `-options`（+ `-quick-jumper input` 全套 / `-size-changer`）/ `-simple` 的 `-simple-pager input`
 * （+ `-small` / `-underlined`）/ `@media (max-width: 992px)` 隐藏跳页项 /
 * `@media (max-width: 576px)` 隐藏 `-options`。
 *
 * ⚠️ 两个媒体查询是 antd 的**响应式收缩**（不是 `responsive` prop 的产物），照抄。
 * ⚠️ `-underlined` 来自 `variant`（`useVariant('input')`）⇒ 组件的根类名要带 `{p}-{variant}`。
 */

import { toCssSize } from '../../_internal/to-css-size';
import { paginationDerivedToken, paginationInputTokenValues, paginationTokenValues } from './token';

/**
 * Token 声明块（**32 条**：12 个自有 + 18 个输入框族 + 2 个派生）。
 *
 * ⚠️ 数值字段必须带 `px`（antd 的 `unitless` 没有 pagination 的任何字段）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const t = paginationTokenValues();
  const input = paginationInputTokenValues();
  const derived = paginationDerivedToken(rootPrefixCls);
  const n = `--${rootPrefixCls}-pagination`;

  return [
    // ── 12 个自有 ──
    `  ${n}-item-bg:${t.itemBg};`,
    `  ${n}-item-size:${t.itemSize};`,
    `  ${n}-item-size-sm:${t.itemSizeSM};`,
    `  ${n}-item-size-lg:${t.itemSizeLG};`,
    `  ${n}-item-active-bg:${t.itemActiveBg};`,
    `  ${n}-item-active-color:${t.itemActiveColor};`,
    `  ${n}-item-active-color-hover:${t.itemActiveColorHover};`,
    `  ${n}-item-link-bg:${t.itemLinkBg};`,
    `  ${n}-item-active-bg-disabled:${t.itemActiveBgDisabled};`,
    `  ${n}-item-active-color-disabled:${t.itemActiveColorDisabled};`,
    `  ${n}-item-input-bg:${t.itemInputBg};`,
    `  ${n}-mini-options-size-changer-top:${t.miniOptionsSizeChangerTop};`,
    // ── 18 个输入框族（本地复刻，见 token.ts 的先例说明）──
    `  ${n}-line-width-focus:${input.lineWidthFocus};`,
    `  ${n}-padding-block:${input.paddingBlock};`,
    `  ${n}-padding-block-sm:${input.paddingBlockSM};`,
    `  ${n}-padding-block-lg:${input.paddingBlockLG};`,
    `  ${n}-padding-inline:${input.paddingInline};`,
    `  ${n}-padding-inline-sm:${input.paddingInlineSM};`,
    `  ${n}-padding-inline-lg:${input.paddingInlineLG};`,
    `  ${n}-addon-bg:${input.addonBg};`,
    `  ${n}-active-border-color:${input.activeBorderColor};`,
    `  ${n}-hover-border-color:${input.hoverBorderColor};`,
    `  ${n}-active-shadow:${input.activeShadow};`,
    `  ${n}-error-active-shadow:${input.errorActiveShadow};`,
    `  ${n}-warning-active-shadow:${input.warningActiveShadow};`,
    `  ${n}-hover-bg:${input.hoverBg};`,
    `  ${n}-active-bg:${input.activeBg};`,
    `  ${n}-input-font-size:${input.inputFontSize};`,
    `  ${n}-input-font-size-lg:${input.inputFontSizeLG};`,
    `  ${n}-input-font-size-sm:${input.inputFontSizeSM};`,
    // ── 2 个派生 ──
    `  ${n}-item-size-actual:${derived.itemSizeActual};`,
    `  ${n}-item-spacing-actual:${derived.itemSpacingActual};`,
  ];
}

/** antd 产物机械转换段（108 条规则 + 2 个媒体查询，原序）。 */
const RULES = `
.apollo-pagination{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}
.apollo-pagination::before,.apollo-pagination::after{box-sizing:border-box;}
.apollo-pagination [class^="apollo-pagination"],.apollo-pagination [class*=" apollo-pagination"]{box-sizing:border-box;}
.apollo-pagination [class^="apollo-pagination"]::before,.apollo-pagination [class*=" apollo-pagination"]::before,.apollo-pagination [class^="apollo-pagination"]::after,.apollo-pagination [class*=" apollo-pagination"]::after{box-sizing:border-box;}
.apollo-pagination{--apollo-pagination-item-size-actual:var(--apollo-pagination-item-size);--apollo-pagination-item-spacing-actual:var(--apollo-margin-xs);box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);display:flex;align-items:center;}
.apollo-pagination-small{--apollo-pagination-item-size-actual:var(--apollo-pagination-item-size-sm);--apollo-pagination-item-spacing-actual:var(--apollo-margin-xxs);}
.apollo-pagination-large{--apollo-pagination-item-size-actual:var(--apollo-pagination-item-size-lg);--apollo-pagination-item-spacing-actual:var(--apollo-margin-sm);}
.apollo-pagination-start{justify-content:start;}
.apollo-pagination-center{justify-content:center;}
.apollo-pagination-end{justify-content:end;}
.apollo-pagination ul,.apollo-pagination ol{margin:0;padding:0;list-style:none;}
.apollo-pagination::after{display:block;clear:both;height:0;overflow:hidden;visibility:hidden;content:"";}
.apollo-pagination .apollo-pagination-total-text{display:inline-block;height:var(--apollo-pagination-item-size-actual);margin-inline-end:var(--apollo-pagination-item-spacing-actual);line-height:calc(var(--apollo-pagination-item-size-actual) - 2px);vertical-align:middle;}
.apollo-pagination .apollo-pagination-item{display:inline-block;min-width:var(--apollo-pagination-item-size-actual);height:var(--apollo-pagination-item-size-actual);margin-inline-end:var(--apollo-pagination-item-spacing-actual);font-family:var(--apollo-font-family);line-height:calc(var(--apollo-pagination-item-size-actual) - 2px);text-align:center;vertical-align:middle;list-style:none;background-color:var(--apollo-pagination-item-bg);border:var(--apollo-line-width) var(--apollo-line-type) transparent;border-radius:var(--apollo-border-radius);outline:0;cursor:pointer;user-select:none;}
.apollo-pagination .apollo-pagination-item a{display:block;padding:0 calc(var(--apollo-margin-xxs) * 1.5);color:var(--apollo-color-text);}
.apollo-pagination .apollo-pagination-item a:hover{text-decoration:none;}
.apollo-pagination .apollo-pagination-item:not(.apollo-pagination-item-active):hover{transition:all var(--apollo-motion-duration-mid);background-color:var(--apollo-color-bg-text-hover);}
.apollo-pagination .apollo-pagination-item:not(.apollo-pagination-item-active):active{background-color:var(--apollo-color-bg-text-active);}
.apollo-pagination .apollo-pagination-item-active{font-weight:var(--apollo-font-weight-strong);background-color:var(--apollo-pagination-item-active-bg);border-color:var(--apollo-color-primary);}
.apollo-pagination .apollo-pagination-item-active a{color:var(--apollo-pagination-item-active-color);}
.apollo-pagination .apollo-pagination-item-active:hover{border-color:var(--apollo-color-primary-hover);}
.apollo-pagination .apollo-pagination-item-active:hover a{color:var(--apollo-pagination-item-active-color-hover);}
.apollo-pagination .apollo-pagination-jump-prev,.apollo-pagination .apollo-pagination-jump-next{outline:0;}
.apollo-pagination .apollo-pagination-jump-prev .apollo-pagination-item-container,.apollo-pagination .apollo-pagination-jump-next .apollo-pagination-item-container{position:relative;}
.apollo-pagination .apollo-pagination-jump-prev .apollo-pagination-item-container .apollo-pagination-item-link-icon,.apollo-pagination .apollo-pagination-jump-next .apollo-pagination-item-container .apollo-pagination-item-link-icon{color:var(--apollo-color-primary);font-size:var(--apollo-font-size-sm);opacity:0;transition:all var(--apollo-motion-duration-mid);}
.apollo-pagination .apollo-pagination-jump-prev .apollo-pagination-item-container .apollo-pagination-item-link-icon-svg,.apollo-pagination .apollo-pagination-jump-next .apollo-pagination-item-container .apollo-pagination-item-link-icon-svg{top:0;inset-inline-end:0;bottom:0;inset-inline-start:0;margin:auto;}
.apollo-pagination .apollo-pagination-jump-prev .apollo-pagination-item-container .apollo-pagination-item-ellipsis,.apollo-pagination .apollo-pagination-jump-next .apollo-pagination-item-container .apollo-pagination-item-ellipsis{position:absolute;inset:0;display:inline-flex;justify-content:center;align-items:center;margin:auto;color:var(--apollo-color-text-disabled);text-align:center;opacity:1;transition:all var(--apollo-motion-duration-mid);}
.apollo-pagination .apollo-pagination-jump-prev .apollo-pagination-item-container .apollo-pagination-item-ellipsis .apollo-icon-ellipsis>svg,.apollo-pagination .apollo-pagination-jump-next .apollo-pagination-item-container .apollo-pagination-item-ellipsis .apollo-icon-ellipsis>svg{width:var(--apollo-size-lg);height:var(--apollo-size-lg);}
.apollo-pagination .apollo-pagination-jump-prev:hover .apollo-pagination-item-link-icon,.apollo-pagination .apollo-pagination-jump-next:hover .apollo-pagination-item-link-icon{opacity:1;}
.apollo-pagination .apollo-pagination-jump-prev:hover .apollo-pagination-item-ellipsis,.apollo-pagination .apollo-pagination-jump-next:hover .apollo-pagination-item-ellipsis{opacity:0;}
.apollo-pagination .apollo-pagination-prev,.apollo-pagination .apollo-pagination-jump-prev,.apollo-pagination .apollo-pagination-jump-next{margin-inline-end:var(--apollo-pagination-item-spacing-actual);}
.apollo-pagination .apollo-pagination-prev,.apollo-pagination .apollo-pagination-next,.apollo-pagination .apollo-pagination-jump-prev,.apollo-pagination .apollo-pagination-jump-next{display:inline-block;min-width:var(--apollo-pagination-item-size-actual);height:var(--apollo-pagination-item-size-actual);color:var(--apollo-color-text);font-family:var(--apollo-font-family);line-height:var(--apollo-pagination-item-size-actual);text-align:center;vertical-align:middle;list-style:none;border-radius:var(--apollo-border-radius);cursor:pointer;transition:all var(--apollo-motion-duration-mid);}
.apollo-pagination .apollo-pagination-prev,.apollo-pagination .apollo-pagination-next{outline:0;}
.apollo-pagination .apollo-pagination-prev button,.apollo-pagination .apollo-pagination-next button{color:var(--apollo-color-text);cursor:pointer;user-select:none;}
.apollo-pagination .apollo-pagination-prev .apollo-pagination-item-link,.apollo-pagination .apollo-pagination-next .apollo-pagination-item-link{display:block;width:100%;height:100%;padding:0;font-size:var(--apollo-font-size-sm);text-align:center;background-color:transparent;border:var(--apollo-line-width) var(--apollo-line-type) transparent;border-radius:var(--apollo-border-radius);outline:none;transition:all var(--apollo-motion-duration-mid);}
.apollo-pagination .apollo-pagination-prev:hover .apollo-pagination-item-link,.apollo-pagination .apollo-pagination-next:hover .apollo-pagination-item-link{background-color:var(--apollo-color-bg-text-hover);}
.apollo-pagination .apollo-pagination-prev:active .apollo-pagination-item-link,.apollo-pagination .apollo-pagination-next:active .apollo-pagination-item-link{background-color:var(--apollo-color-bg-text-active);}
.apollo-pagination .apollo-pagination-prev.apollo-pagination-disabled:hover .apollo-pagination-item-link,.apollo-pagination .apollo-pagination-next.apollo-pagination-disabled:hover .apollo-pagination-item-link{background-color:transparent;}
.apollo-pagination .apollo-pagination-slash{margin-inline-end:var(--apollo-margin-sm);margin-inline-start:var(--apollo-margin-sm);}
.apollo-pagination .apollo-pagination-options{display:inline-block;margin-inline-start:var(--apollo-margin);vertical-align:middle;}
.apollo-pagination .apollo-pagination-options-size-changer,.apollo-pagination .apollo-pagination-options-size-changer.apollo-pagination-options-size-changer-select{width:auto;}
.apollo-pagination .apollo-pagination-options-quick-jumper{display:inline-block;height:var(--apollo-pagination-item-size-actual);margin-inline-start:var(--apollo-margin-xs);line-height:var(--apollo-pagination-item-size-actual);vertical-align:baseline;}
.apollo-pagination .apollo-pagination-options-quick-jumper input{position:relative;display:inline-block;width:calc(var(--apollo-control-height-lg) * 1.25);min-width:0;padding:var(--apollo-pagination-padding-block) var(--apollo-pagination-padding-inline);color:var(--apollo-color-text);font-size:var(--apollo-pagination-input-font-size);line-height:var(--apollo-line-height);border-radius:var(--apollo-border-radius);transition:all var(--apollo-motion-duration-mid);background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-border);height:var(--apollo-pagination-item-size-actual);box-sizing:border-box;margin:0;margin-inline-start:var(--apollo-pagination-item-spacing-actual);margin-inline-end:var(--apollo-pagination-item-spacing-actual);}
.apollo-pagination .apollo-pagination-options-quick-jumper input::-moz-placeholder{opacity:1;}
.apollo-pagination .apollo-pagination-options-quick-jumper input::placeholder{color:var(--apollo-color-text-placeholder);user-select:none;}
.apollo-pagination .apollo-pagination-options-quick-jumper input:placeholder-shown{text-overflow:ellipsis;}
.apollo-pagination .apollo-pagination-options-quick-jumper input-lg{padding:var(--apollo-pagination-padding-block-lg) var(--apollo-pagination-padding-inline-lg);font-size:var(--apollo-pagination-input-font-size-lg);line-height:var(--apollo-line-height-lg);border-radius:var(--apollo-border-radius-lg);}
.apollo-pagination .apollo-pagination-options-quick-jumper input-sm{padding:var(--apollo-pagination-padding-block-sm) var(--apollo-pagination-padding-inline-sm);font-size:var(--apollo-pagination-input-font-size-sm);border-radius:var(--apollo-border-radius-sm);}
.apollo-pagination .apollo-pagination-options-quick-jumper input-rtl,.apollo-pagination .apollo-pagination-options-quick-jumper input-textarea-rtl{direction:rtl;}
.apollo-pagination .apollo-pagination-options-quick-jumper input:hover{border-color:var(--apollo-color-primary-hover);background-color:var(--apollo-pagination-hover-bg);}
.apollo-pagination .apollo-pagination-options-quick-jumper input:focus,.apollo-pagination .apollo-pagination-options-quick-jumper input:focus-within{border-color:var(--apollo-color-primary);box-shadow:var(--apollo-pagination-active-shadow);outline:0;background-color:var(--apollo-pagination-active-bg);}
.apollo-pagination .apollo-pagination-options-quick-jumper input[disabled]{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}
.apollo-pagination .apollo-pagination-options-quick-jumper input[disabled] input[disabled],.apollo-pagination .apollo-pagination-options-quick-jumper input[disabled] textarea[disabled]{cursor:not-allowed;}
.apollo-pagination .apollo-pagination-options-quick-jumper input[disabled]:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-prev,.apollo-pagination.apollo-pagination-simple .apollo-pagination-next{height:var(--apollo-pagination-item-size-actual);line-height:var(--apollo-pagination-item-size-actual);vertical-align:top;}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-prev .apollo-pagination-item-link,.apollo-pagination.apollo-pagination-simple .apollo-pagination-next .apollo-pagination-item-link{height:var(--apollo-pagination-item-size-actual);background-color:transparent;border:0;}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-prev .apollo-pagination-item-link:hover,.apollo-pagination.apollo-pagination-simple .apollo-pagination-next .apollo-pagination-item-link:hover{background-color:var(--apollo-color-bg-text-hover);}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-prev .apollo-pagination-item-link:active,.apollo-pagination.apollo-pagination-simple .apollo-pagination-next .apollo-pagination-item-link:active{background-color:var(--apollo-color-bg-text-active);}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-prev .apollo-pagination-item-link::after,.apollo-pagination.apollo-pagination-simple .apollo-pagination-next .apollo-pagination-item-link::after{height:var(--apollo-pagination-item-size-actual);line-height:var(--apollo-pagination-item-size-actual);}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-simple-pager{display:inline-flex;align-items:center;height:var(--apollo-pagination-item-size-actual);margin-inline-end:var(--apollo-pagination-item-spacing-actual);}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-simple-pager input{box-sizing:border-box;height:100%;width:calc(var(--apollo-control-height-lg) * 1.25);padding:0 calc(var(--apollo-margin-xxs) * 1.5);text-align:center;background-color:var(--apollo-pagination-item-input-bg);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);border-radius:var(--apollo-border-radius);outline:none;transition:border-color var(--apollo-motion-duration-mid);color:inherit;}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-simple-pager input:hover{border-color:var(--apollo-color-primary);}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-simple-pager input:focus{border-color:var(--apollo-color-primary-hover);box-shadow:0px 0 var(--apollo-control-outline-width) var(--apollo-control-outline);}
.apollo-pagination.apollo-pagination-simple .apollo-pagination-simple-pager input[disabled]{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border);cursor:not-allowed;}
.apollo-pagination.apollo-pagination-simple.apollo-pagination-disabled .apollo-pagination-prev .apollo-pagination-item-link:hover,.apollo-pagination.apollo-pagination-simple.apollo-pagination-disabled .apollo-pagination-next .apollo-pagination-item-link:hover,.apollo-pagination.apollo-pagination-simple.apollo-pagination-disabled .apollo-pagination-prev .apollo-pagination-item-link:active,.apollo-pagination.apollo-pagination-simple.apollo-pagination-disabled .apollo-pagination-next .apollo-pagination-item-link:active{background-color:transparent;}
.apollo-pagination.apollo-pagination-simple.apollo-pagination-small .apollo-pagination-simple-pager input{width:calc(var(--apollo-control-height-lg) * 1.1);}
.apollo-pagination.apollo-pagination-filled .apollo-pagination-options-quick-jumper input,.apollo-pagination.apollo-pagination-filled .apollo-pagination-simple-pager input{background:var(--apollo-color-fill-tertiary);border-color:transparent;}
.apollo-pagination.apollo-pagination-filled .apollo-pagination-options-quick-jumper input:hover,.apollo-pagination.apollo-pagination-filled .apollo-pagination-simple-pager input:hover{background:var(--apollo-color-fill-secondary);}
.apollo-pagination.apollo-pagination-filled .apollo-pagination-options-quick-jumper input:focus,.apollo-pagination.apollo-pagination-filled .apollo-pagination-simple-pager input:focus{border-color:var(--apollo-pagination-active-border-color);outline:0;background-color:var(--apollo-pagination-active-bg);}
.apollo-pagination.apollo-pagination-filled .apollo-pagination-options-quick-jumper input[disabled],.apollo-pagination.apollo-pagination-filled .apollo-pagination-simple-pager input[disabled]{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}
.apollo-pagination.apollo-pagination-filled .apollo-pagination-options-quick-jumper input[disabled] input[disabled],.apollo-pagination.apollo-pagination-filled .apollo-pagination-simple-pager input[disabled] input[disabled],.apollo-pagination.apollo-pagination-filled .apollo-pagination-options-quick-jumper input[disabled] textarea[disabled],.apollo-pagination.apollo-pagination-filled .apollo-pagination-simple-pager input[disabled] textarea[disabled]{cursor:not-allowed;}
.apollo-pagination.apollo-pagination-filled .apollo-pagination-options-quick-jumper input[disabled]:hover:not([disabled]),.apollo-pagination.apollo-pagination-filled .apollo-pagination-simple-pager input[disabled]:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}
.apollo-pagination.apollo-pagination-borderless .apollo-pagination-options-quick-jumper input,.apollo-pagination.apollo-pagination-borderless .apollo-pagination-simple-pager input{background:transparent;border:none;}
.apollo-pagination.apollo-pagination-borderless .apollo-pagination-options-quick-jumper input:focus,.apollo-pagination.apollo-pagination-borderless .apollo-pagination-simple-pager input:focus{outline:none;box-shadow:none;}
.apollo-pagination.apollo-pagination-borderless .apollo-pagination-options-quick-jumper input[disabled],.apollo-pagination.apollo-pagination-borderless .apollo-pagination-simple-pager input[disabled]{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-pagination.apollo-pagination-underlined .apollo-pagination-options-quick-jumper input,.apollo-pagination.apollo-pagination-underlined .apollo-pagination-simple-pager input{background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-border) transparent;border-radius:0;}
.apollo-pagination.apollo-pagination-underlined .apollo-pagination-options-quick-jumper input:hover,.apollo-pagination.apollo-pagination-underlined .apollo-pagination-simple-pager input:hover{border-color:transparent transparent var(--apollo-pagination-hover-border-color) transparent;background-color:var(--apollo-pagination-hover-bg);}
.apollo-pagination.apollo-pagination-underlined .apollo-pagination-options-quick-jumper input:focus,.apollo-pagination.apollo-pagination-underlined .apollo-pagination-simple-pager input:focus{border-color:transparent transparent var(--apollo-pagination-active-border-color) transparent;outline:0;background-color:var(--apollo-pagination-active-bg);}
.apollo-pagination.apollo-pagination-underlined .apollo-pagination-options-quick-jumper input[disabled],.apollo-pagination.apollo-pagination-underlined .apollo-pagination-simple-pager input[disabled]{color:var(--apollo-color-text-disabled);box-shadow:none;cursor:not-allowed;}
.apollo-pagination.apollo-pagination-small .apollo-pagination-options{margin-inline-start:calc(var(--apollo-margin-xxs) / 2);}
.apollo-pagination.apollo-pagination-small .apollo-pagination-options-quick-jumper input{padding:var(--apollo-pagination-padding-block-sm) var(--apollo-pagination-padding-inline-sm);font-size:var(--apollo-pagination-input-font-size-sm);border-radius:var(--apollo-border-radius-sm);width:calc(var(--apollo-control-height-lg) * 1.1);}
.apollo-pagination.apollo-pagination-large .apollo-pagination-options-quick-jumper input{padding:var(--apollo-pagination-padding-block-lg) var(--apollo-pagination-padding-inline-lg);font-size:var(--apollo-pagination-input-font-size-lg);line-height:var(--apollo-line-height-lg);border-radius:var(--apollo-border-radius-lg);}
.apollo-pagination .apollo-pagination-disabled,.apollo-pagination .apollo-pagination-disabled:hover{cursor:not-allowed;}
.apollo-pagination .apollo-pagination-disabled .apollo-pagination-item-link,.apollo-pagination .apollo-pagination-disabled:hover .apollo-pagination-item-link{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-pagination .apollo-pagination-disabled:focus-visible{cursor:not-allowed;}
.apollo-pagination .apollo-pagination-disabled:focus-visible .apollo-pagination-item-link{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-pagination.apollo-pagination-disabled{cursor:not-allowed;}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item{cursor:not-allowed;background-color:transparent;}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item:hover,.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item:active{background-color:transparent;}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item a{color:var(--apollo-color-text-disabled);background-color:transparent;border:none;cursor:not-allowed;}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-active{border-color:var(--apollo-color-border);background-color:var(--apollo-pagination-item-active-bg-disabled);}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-active:hover,.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-active:active{background-color:var(--apollo-pagination-item-active-bg-disabled);}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-active a{color:var(--apollo-pagination-item-active-color-disabled);}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-link{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-link:hover,.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-link:active{background-color:transparent;}
.apollo-pagination-simple.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-link{background-color:transparent;}
.apollo-pagination-simple.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-link:hover,.apollo-pagination-simple.apollo-pagination.apollo-pagination-disabled .apollo-pagination-item-link:active{background-color:transparent;}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-simple-pager{color:var(--apollo-color-text-disabled);}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-jump-prev .apollo-pagination-item-link-icon,.apollo-pagination.apollo-pagination-disabled .apollo-pagination-jump-next .apollo-pagination-item-link-icon{opacity:0;}
.apollo-pagination.apollo-pagination-disabled .apollo-pagination-jump-prev .apollo-pagination-item-ellipsis,.apollo-pagination.apollo-pagination-disabled .apollo-pagination-jump-next .apollo-pagination-item-ellipsis{opacity:1;}
@media only screen and (max-width: 992px){.apollo-pagination .apollo-pagination-item-after-jump-prev,.apollo-pagination .apollo-pagination-item-before-jump-next{display:none;}}
@media only screen and (max-width: 576px){.apollo-pagination .apollo-pagination-options{display:none;}}
.apollo-pagination-rtl{direction:rtl;}
.apollo-pagination:not(.apollo-pagination-disabled) .apollo-pagination-item:focus-visible{outline:var(--apollo-pagination-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-pagination:not(.apollo-pagination-disabled) .apollo-pagination-jump-prev:focus-visible,.apollo-pagination:not(.apollo-pagination-disabled) .apollo-pagination-jump-next:focus-visible{outline:var(--apollo-pagination-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-pagination:not(.apollo-pagination-disabled) .apollo-pagination-jump-prev:focus-visible .apollo-pagination-item-link-icon,.apollo-pagination:not(.apollo-pagination-disabled) .apollo-pagination-jump-next:focus-visible .apollo-pagination-item-link-icon{opacity:1;}
.apollo-pagination:not(.apollo-pagination-disabled) .apollo-pagination-jump-prev:focus-visible .apollo-pagination-item-ellipsis,.apollo-pagination:not(.apollo-pagination-disabled) .apollo-pagination-jump-next:focus-visible .apollo-pagination-item-ellipsis{opacity:0;}
.apollo-pagination:not(.apollo-pagination-disabled) .apollo-pagination-prev:focus-visible .apollo-pagination-item-link,.apollo-pagination:not(.apollo-pagination-disabled) .apollo-pagination-next:focus-visible .apollo-pagination-item-link{outline:var(--apollo-pagination-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
`;

/**
 * 样式入口：token 声明块（**挂在根选择器里**）+ 规则体。
 *
 * 🚨 声明块必须包在选择器里 —— 裸声明是无效 CSS，会让紧随其后的规则一起被丢弃
 *    （form 收口时踩过）。
 */
export function genPaginationStyle(rootPrefixCls: string): string {
  const d = genTokenDecls(rootPrefixCls).join('');
  return `.${rootPrefixCls}-pagination{${d}}\n\n${RULES}`;
}

/** 供调试脚本/测试复用：把数值常量转成 CSS 尺寸（避免各处重复实现）。 */
export const toPaginationCssSize = toCssSize;
