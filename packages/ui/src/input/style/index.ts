/**
 * Input 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 es/input/style（index.js + variants.js + textarea.js），
 * **逐条对拍 extractStyle 真实产物**（kept.length 条规则，覆盖 Input / TextArea /
 * Password / Group 家族；Search / OTP 的规则不在本轮 DOM 范围内），
 * 不是照源码推演（CHECKLIST #2）。
 *
 * ── 与 antd 产物的结构性差异 ──────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）：antd 产物里 `.ant-input-css-var` 与
 *    `.ant-input` 双轨重复段只保留普通轨；Component Token 声明块（antd 挂在
 *    `.css-var-root.ant-input`）改挂在 `.apollo-input` 根规则。
 * 2. 全部 `--ant-*` 换成 `--apollo-*`（全局 alias，随主题自适应）与
 *    `--apollo-input-*`（组件 token，见 genTokenDecls）。构建期算式值
 *    （activeShadow 组合串、padding 算式）落常量（collapse D46/D50 同判）。
 * 3. 规则体由产物机械转换（184 条保持原序），手写段只有根规则的 token 声明。
 *    选择器形态（复合 vs 后代）与产物逐字节一致 —— CHECKLIST #71/#75 的
 *    教训：形态错一条，浏览器整条静默丢弃。
 *
 * ⚠️ rootPrefixCls 仅支持默认 'apollo'：规则体是静态移植（var 名已含根前缀），
 *    参数为 API 对齐保留（input-number 同构）。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { inputTokenValues } from './token';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * Component Token 声明块（对拍 antd 6.6.4 的 `.css-var-root.ant-input` 块：
 * padding-block 4px / 0px / 7px，padding-inline 11px / 7px / 11px）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const t = inputTokenValues();
  return [
    `  --${rootPrefixCls}-input-line-width-focus:${t.lineWidthFocus};`,
    `  --${rootPrefixCls}-input-padding-block:${t.paddingBlock};`,
    `  --${rootPrefixCls}-input-padding-block-sm:${t.paddingBlockSM};`,
    `  --${rootPrefixCls}-input-padding-block-lg:${t.paddingBlockLG};`,
    `  --${rootPrefixCls}-input-padding-inline:${t.paddingInline};`,
    `  --${rootPrefixCls}-input-padding-inline-sm:${t.paddingInlineSM};`,
    `  --${rootPrefixCls}-input-padding-inline-lg:${t.paddingInlineLG};`,
    `  --${rootPrefixCls}-input-addon-bg:${v('colorFillAlter')};`,
    `  --${rootPrefixCls}-input-active-border-color:${v('colorPrimary')};`,
    `  --${rootPrefixCls}-input-hover-border-color:${v('colorPrimaryHover')};`,
    `  --${rootPrefixCls}-input-active-shadow:0 0 0 ${v('controlOutlineWidth')}px ${v('controlOutline')};`,
    `  --${rootPrefixCls}-input-error-active-shadow:0 0 0 ${v('controlOutlineWidth')}px ${v('colorErrorOutline')};`,
    `  --${rootPrefixCls}-input-warning-active-shadow:0 0 0 ${v('controlOutlineWidth')}px ${v('colorWarningOutline')};`,
    `  --${rootPrefixCls}-input-hover-bg:${v('colorBgContainer')};`,
    `  --${rootPrefixCls}-input-active-bg:${v('colorBgContainer')};`,
    `  --${rootPrefixCls}-input-input-font-size:${t.inputFontSize};`,
    `  --${rootPrefixCls}-input-input-font-size-lg:${t.inputFontSizeLG};`,
    `  --${rootPrefixCls}-input-input-font-size-sm:${t.inputFontSizeSM};`,
  ];
}

/** antd 产物机械转换段（201 条，原序、sel+body 去重；同选择器多条合法 —— antd 分段发规则）。 */
const RULES = String.raw`
textarea.apollo-input{max-width:100%;height:auto;min-height:var(--apollo-control-height);line-height:var(--apollo-line-height);vertical-align:bottom;transition:all var(--apollo-motion-duration-slow);resize:vertical;}

textarea.apollo-input.apollo-input-mouse-active{transition:all var(--apollo-motion-duration-slow),height 0s,width 0s;}

.apollo-input-textarea-affix-wrapper-resize-dirty{width:auto;}

.apollo-input-textarea{position:relative;}

.apollo-input-textarea-show-count .apollo-input-data-count{position:absolute;bottom:calc(var(--apollo-font-size) * var(--apollo-line-height) * -1);inset-inline-end:0;color:var(--apollo-color-text-description);white-space:nowrap;pointer-events:none;}

.apollo-input-textarea-allow-clear>.apollo-input,.apollo-input-textarea-affix-wrapper.apollo-input-textarea-has-feedback .apollo-input{padding-inline-end:var(--apollo-padding-lg);}

.apollo-input-textarea-affix-wrapper.apollo-input-affix-wrapper{padding:0;}

.apollo-input-textarea-affix-wrapper.apollo-input-affix-wrapper >textarea.apollo-input{font-size:inherit;border:none;outline:none;background:transparent;min-height:calc(var(--apollo-control-height) - var(--apollo-line-width) * 2);}

.apollo-input-textarea-affix-wrapper.apollo-input-affix-wrapper >textarea.apollo-input:focus{box-shadow:none!important;}

.apollo-input-textarea-affix-wrapper.apollo-input-affix-wrapper .apollo-input-suffix{margin:0;}

.apollo-input-textarea-affix-wrapper.apollo-input-affix-wrapper .apollo-input-suffix >*:not(:last-child){margin-inline:0;}

.apollo-input-textarea-affix-wrapper.apollo-input-affix-wrapper .apollo-input-suffix .apollo-input-clear-icon{position:absolute;inset-inline-end:var(--apollo-input-padding-inline);inset-block-start:var(--apollo-padding-xs);}

.apollo-input-textarea-affix-wrapper.apollo-input-affix-wrapper .apollo-input-suffix .apollo-input-textarea-suffix{position:absolute;top:0;inset-inline-end:var(--apollo-input-padding-inline);bottom:0;z-index:1;display:inline-flex;align-items:center;margin:auto;pointer-events:none;}

.apollo-input-textarea-affix-wrapper.apollo-input-affix-wrapper-rtl .apollo-input-suffix .apollo-input-data-count{direction:ltr;inset-inline-start:0;}

.apollo-input-textarea-affix-wrapper.apollo-input-affix-wrapper-sm .apollo-input-suffix .apollo-input-clear-icon{inset-inline-end:var(--apollo-input-padding-inline-sm);}

.apollo-input{box-sizing:border-box;}

.apollo-input::before,.apollo-input::after{box-sizing:border-box;}

.apollo-input [class^="ant-input"],.apollo-input [class*=" ant-input"]{box-sizing:border-box;}

.apollo-input [class^="ant-input"]::before,.apollo-input [class*=" ant-input"]::before,.apollo-input [class^="ant-input"]::after,.apollo-input [class*=" ant-input"]::after{box-sizing:border-box;}

.apollo-input{box-sizing:border-box;margin:0;padding:var(--apollo-input-padding-block) var(--apollo-input-padding-inline);color:var(--apollo-color-text);font-size:var(--apollo-input-input-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:relative;display:inline-block;width:100%;min-width:0;border-radius:var(--apollo-border-radius);transition:all var(--apollo-motion-duration-mid);}

.apollo-input::-moz-placeholder{opacity:1;}

.apollo-input::placeholder{color:var(--apollo-color-text-placeholder);user-select:none;}

.apollo-input:placeholder-shown{text-overflow:ellipsis;}

.apollo-input-lg{padding:var(--apollo-input-padding-block-lg) var(--apollo-input-padding-inline-lg);font-size:var(--apollo-input-input-font-size-lg);line-height:var(--apollo-line-height-lg);border-radius:var(--apollo-border-radius-lg);}

.apollo-input-sm{padding:var(--apollo-input-padding-block-sm) var(--apollo-input-padding-inline-sm);font-size:var(--apollo-input-input-font-size-sm);border-radius:var(--apollo-border-radius-sm);}

.apollo-input-rtl,.apollo-input-textarea-rtl{direction:rtl;}

.apollo-input-outlined{background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-border);}

.apollo-input-outlined:hover{border-color:var(--apollo-input-hover-border-color);background-color:var(--apollo-input-hover-bg);}

.apollo-input-outlined:focus,.apollo-input-outlined:focus-within{border-color:var(--apollo-input-active-border-color);box-shadow:var(--apollo-input-active-shadow);outline:0;background-color:var(--apollo-input-active-bg);}

.apollo-input-outlined.apollo-input-disabled,.apollo-input-outlined[disabled]{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}

.apollo-input-outlined.apollo-input-disabled input[disabled],.apollo-input-outlined[disabled] input[disabled],.apollo-input-outlined.apollo-input-disabled textarea[disabled],.apollo-input-outlined[disabled] textarea[disabled]{cursor:not-allowed;}

.apollo-input-outlined.apollo-input-disabled:hover:not([disabled]),.apollo-input-outlined[disabled]:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}

.apollo-input-outlined.apollo-input-status-error:not(.apollo-input-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-error);}

.apollo-input-outlined.apollo-input-status-error:not(.apollo-input-disabled):hover{border-color:var(--apollo-color-error-border-hover);background-color:var(--apollo-input-hover-bg);}

.apollo-input-outlined.apollo-input-status-error:not(.apollo-input-disabled):focus,.apollo-input-outlined.apollo-input-status-error:not(.apollo-input-disabled):focus-within{border-color:var(--apollo-color-error);box-shadow:var(--apollo-input-error-active-shadow);outline:0;background-color:var(--apollo-input-active-bg);}

.apollo-input-outlined.apollo-input-status-error:not(.apollo-input-disabled) .apollo-input-prefix,.apollo-input-outlined.apollo-input-status-error:not(.apollo-input-disabled) .apollo-input-suffix{color:var(--apollo-color-error-affix);}

.apollo-input-outlined.apollo-input-status-error.apollo-input-disabled{border-color:var(--apollo-color-error);}

.apollo-input-outlined.apollo-input-status-warning:not(.apollo-input-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-warning);}

.apollo-input-outlined.apollo-input-status-warning:not(.apollo-input-disabled):hover{border-color:var(--apollo-color-warning-border-hover);background-color:var(--apollo-input-hover-bg);}

.apollo-input-outlined.apollo-input-status-warning:not(.apollo-input-disabled):focus,.apollo-input-outlined.apollo-input-status-warning:not(.apollo-input-disabled):focus-within{border-color:var(--apollo-color-warning);box-shadow:var(--apollo-input-warning-active-shadow);outline:0;background-color:var(--apollo-input-active-bg);}

.apollo-input-outlined.apollo-input-status-warning:not(.apollo-input-disabled) .apollo-input-prefix,.apollo-input-outlined.apollo-input-status-warning:not(.apollo-input-disabled) .apollo-input-suffix{color:var(--apollo-color-warning-affix);}

.apollo-input-outlined.apollo-input-status-warning.apollo-input-disabled{border-color:var(--apollo-color-warning);}

.apollo-input-filled{background:var(--apollo-color-fill-tertiary);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:transparent;}

input.apollo-input-filled,.apollo-input-filled input,textarea.apollo-input-filled,.apollo-input-filled textarea{color:var(--apollo-color-text);}

.apollo-input-filled:hover{background:var(--apollo-color-fill-secondary);}

.apollo-input-filled:focus,.apollo-input-filled:focus-within{outline:0;border-color:var(--apollo-input-active-border-color);background-color:var(--apollo-input-active-bg);}

.apollo-input-filled.apollo-input-disabled,.apollo-input-filled[disabled]{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}

.apollo-input-filled.apollo-input-disabled input[disabled],.apollo-input-filled[disabled] input[disabled],.apollo-input-filled.apollo-input-disabled textarea[disabled],.apollo-input-filled[disabled] textarea[disabled]{cursor:not-allowed;}

.apollo-input-filled.apollo-input-disabled:hover:not([disabled]),.apollo-input-filled[disabled]:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}

.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled){background:var(--apollo-color-error-bg);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:transparent;}

input.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled),.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled) input,textarea.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled),.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled) textarea{color:var(--apollo-color-error-text);}

.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled):hover{background:var(--apollo-color-error-bg-hover);}

.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled):focus,.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled):focus-within{outline:0;border-color:var(--apollo-color-error);background-color:var(--apollo-input-active-bg);}

.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled) .apollo-input-prefix,.apollo-input-filled.apollo-input-status-error:not(.apollo-input-disabled) .apollo-input-suffix{color:var(--apollo-color-error-affix);}

.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled){background:var(--apollo-color-warning-bg);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:transparent;}

input.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled),.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled) input,textarea.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled),.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled) textarea{color:var(--apollo-color-warning-text);}

.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled):hover{background:var(--apollo-color-warning-bg-hover);}

.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled):focus,.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled):focus-within{outline:0;border-color:var(--apollo-color-warning);background-color:var(--apollo-input-active-bg);}

.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled) .apollo-input-prefix,.apollo-input-filled.apollo-input-status-warning:not(.apollo-input-disabled) .apollo-input-suffix{color:var(--apollo-color-warning-affix);}

.apollo-input-borderless{background:transparent;border:none;padding-block:calc(var(--apollo-input-padding-block) + var(--apollo-line-width));}

.apollo-input-borderless.apollo-input-sm,.apollo-input-borderless.apollo-input-affix-wrapper-sm{padding-block:calc(var(--apollo-input-padding-block-sm) + var(--apollo-line-width));}

.apollo-input-borderless.apollo-input-lg,.apollo-input-borderless.apollo-input-affix-wrapper-lg{padding-block:calc(var(--apollo-input-padding-block-lg) + var(--apollo-line-width));}

.apollo-input-borderless:focus,.apollo-input-borderless:focus-within{outline:none;}

.apollo-input-borderless:focus-visible,.apollo-input-borderless:has(input:focus-visible),.apollo-input-borderless:has(textarea:focus-visible){outline:var(--apollo-input-line-width-focus) var(--apollo-line-type) var(--apollo-input-active-border-color);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}

.apollo-input-borderless.apollo-input-disabled,.apollo-input-borderless[disabled]{color:var(--apollo-color-text-disabled);cursor:not-allowed;}

.apollo-input-borderless.apollo-input-status-error,.apollo-input-borderless.apollo-input-status-error input,.apollo-input-borderless.apollo-input-status-error textarea{color:var(--apollo-color-error);}

.apollo-input-borderless.apollo-input-status-error:focus-visible,.apollo-input-borderless.apollo-input-status-error:has(input:focus-visible),.apollo-input-borderless.apollo-input-status-error:has(textarea:focus-visible){outline:var(--apollo-input-line-width-focus) var(--apollo-line-type) var(--apollo-color-error);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}

.apollo-input-borderless.apollo-input-status-error .apollo-input-prefix,.apollo-input-borderless.apollo-input-status-error .apollo-input-suffix{color:var(--apollo-color-error-affix);}

.apollo-input-borderless.apollo-input-status-warning,.apollo-input-borderless.apollo-input-status-warning input,.apollo-input-borderless.apollo-input-status-warning textarea{color:var(--apollo-color-warning);}

.apollo-input-borderless.apollo-input-status-warning:focus-visible,.apollo-input-borderless.apollo-input-status-warning:has(input:focus-visible),.apollo-input-borderless.apollo-input-status-warning:has(textarea:focus-visible){outline:var(--apollo-input-line-width-focus) var(--apollo-line-type) var(--apollo-color-warning);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}

.apollo-input-borderless.apollo-input-status-warning .apollo-input-prefix,.apollo-input-borderless.apollo-input-status-warning .apollo-input-suffix{color:var(--apollo-color-warning-affix);}

.apollo-input-underlined{background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-border) transparent;border-radius:0;}

.apollo-input-underlined:hover{border-color:transparent transparent var(--apollo-input-hover-border-color) transparent;background-color:var(--apollo-input-hover-bg);}

.apollo-input-underlined:focus,.apollo-input-underlined:focus-within{border-color:transparent transparent var(--apollo-input-active-border-color) transparent;outline:0;background-color:var(--apollo-input-active-bg);}

.apollo-input-underlined.apollo-input-disabled,.apollo-input-underlined[disabled]{color:var(--apollo-color-text-disabled);box-shadow:none;cursor:not-allowed;}

.apollo-input-underlined.apollo-input-disabled:hover,.apollo-input-underlined[disabled]:hover{border-color:transparent transparent var(--apollo-color-border) transparent;}

.apollo-input-underlined input[disabled],.apollo-input-underlined textarea[disabled]{cursor:not-allowed;}

.apollo-input-underlined.apollo-input-status-error:not(.apollo-input-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-error) transparent;border-radius:0;}

.apollo-input-underlined.apollo-input-status-error:not(.apollo-input-disabled):hover{border-color:transparent transparent var(--apollo-color-error-border-hover) transparent;background-color:var(--apollo-input-hover-bg);}

.apollo-input-underlined.apollo-input-status-error:not(.apollo-input-disabled):focus,.apollo-input-underlined.apollo-input-status-error:not(.apollo-input-disabled):focus-within{border-color:transparent transparent var(--apollo-color-error) transparent;outline:0;background-color:var(--apollo-input-active-bg);}

.apollo-input-underlined.apollo-input-status-error:not(.apollo-input-disabled) .apollo-input-prefix,.apollo-input-underlined.apollo-input-status-error:not(.apollo-input-disabled) .apollo-input-suffix{color:var(--apollo-color-error-affix);}

.apollo-input-underlined.apollo-input-status-error.apollo-input-disabled{border-color:transparent transparent var(--apollo-color-error) transparent;}

.apollo-input-underlined.apollo-input-status-warning:not(.apollo-input-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-warning) transparent;border-radius:0;}

.apollo-input-underlined.apollo-input-status-warning:not(.apollo-input-disabled):hover{border-color:transparent transparent var(--apollo-color-warning-border-hover) transparent;background-color:var(--apollo-input-hover-bg);}

.apollo-input-underlined.apollo-input-status-warning:not(.apollo-input-disabled):focus,.apollo-input-underlined.apollo-input-status-warning:not(.apollo-input-disabled):focus-within{border-color:transparent transparent var(--apollo-color-warning) transparent;outline:0;background-color:var(--apollo-input-active-bg);}

.apollo-input-underlined.apollo-input-status-warning:not(.apollo-input-disabled) .apollo-input-prefix,.apollo-input-underlined.apollo-input-status-warning:not(.apollo-input-disabled) .apollo-input-suffix{color:var(--apollo-color-warning-affix);}

.apollo-input-underlined.apollo-input-status-warning.apollo-input-disabled{border-color:transparent transparent var(--apollo-color-warning) transparent;}

.apollo-input[type="color"]{height:var(--apollo-control-height);}

.apollo-input[type="color"].apollo-input-lg{height:var(--apollo-control-height-lg);}

.apollo-input[type="color"].apollo-input-sm{height:var(--apollo-control-height-sm);padding-top:calc((var(--apollo-control-height-sm) - var(--apollo-line-width) * 2 - 16px) / 2);padding-bottom:calc((var(--apollo-control-height-sm) - var(--apollo-line-width) * 2 - 16px) / 2);}

.apollo-input[type="search"]::-webkit-search-cancel-button,.apollo-input[type="search"]::-webkit-search-decoration{appearance:none;}

.apollo-input-affix-wrapper{position:relative;display:inline-flex;width:100%;min-width:0;padding:var(--apollo-input-padding-block) var(--apollo-input-padding-inline);color:var(--apollo-color-text);font-size:var(--apollo-input-input-font-size);line-height:var(--apollo-line-height);border-radius:var(--apollo-border-radius);transition:all var(--apollo-motion-duration-mid);}

.apollo-input-affix-wrapper::-moz-placeholder{opacity:1;}

.apollo-input-affix-wrapper::placeholder{color:var(--apollo-color-text-placeholder);user-select:none;}

.apollo-input-affix-wrapper:placeholder-shown{text-overflow:ellipsis;}

.apollo-input-affix-wrapper-lg{padding:var(--apollo-input-padding-block-lg) var(--apollo-input-padding-inline-lg);font-size:var(--apollo-input-input-font-size-lg);line-height:var(--apollo-line-height-lg);border-radius:var(--apollo-border-radius-lg);}

.apollo-input-affix-wrapper-sm{padding:var(--apollo-input-padding-block-sm) var(--apollo-input-padding-inline-sm);font-size:var(--apollo-input-input-font-size-sm);border-radius:var(--apollo-border-radius-sm);}

.apollo-input-affix-wrapper-rtl,.apollo-input-affix-wrapper-textarea-rtl{direction:rtl;}

.apollo-input-affix-wrapper-focused,.apollo-input-affix-wrapper:focus{z-index:1;}

.apollo-input-affix-wrapper >input.apollo-input{padding:0;}

.apollo-input-affix-wrapper >input.apollo-input,.apollo-input-affix-wrapper >textarea.apollo-input{font-size:inherit;border:none;border-radius:0;outline:none;background:transparent;color:inherit;}

.apollo-input-affix-wrapper >input.apollo-input::-ms-reveal,.apollo-input-affix-wrapper >textarea.apollo-input::-ms-reveal{display:none;}

.apollo-input-affix-wrapper >input.apollo-input:focus,.apollo-input-affix-wrapper >textarea.apollo-input:focus{box-shadow:none!important;}

.apollo-input-affix-wrapper::before{display:inline-block;width:0;visibility:hidden;content:"\a0";}

.apollo-input-affix-wrapper .apollo-input-prefix,.apollo-input-affix-wrapper .apollo-input-suffix{display:flex;flex:none;align-items:center;}

.apollo-input-affix-wrapper .apollo-input-prefix >*:not(:last-child),.apollo-input-affix-wrapper .apollo-input-suffix >*:not(:last-child){margin-inline-end:var(--apollo-padding-xs);}

.apollo-input-affix-wrapper .apollo-input-show-count-suffix{color:var(--apollo-color-text-description);direction:ltr;}

.apollo-input-affix-wrapper .apollo-input-show-count-has-suffix{margin-inline-end:var(--apollo-padding-xxs);}

.apollo-input-affix-wrapper .apollo-input-prefix{margin-inline-end:var(--apollo-padding-xxs);}

.apollo-input-affix-wrapper .apollo-input-suffix{margin-inline-start:var(--apollo-padding-xxs);}

.apollo-input-affix-wrapper .apollo-input-password-icon{display:inline-flex;color:var(--apollo-color-icon);cursor:pointer;transition:all var(--apollo-motion-duration-slow);}

.apollo-input-affix-wrapper .apollo-input-password-icon:hover{color:var(--apollo-color-icon-hover);}

.apollo-input-affix-wrapper .apollo-input-clear-icon{margin:0;padding:0;line-height:0;color:var(--apollo-color-text-quaternary);font-size:var(--apollo-font-size-icon);vertical-align:-1px;cursor:pointer;transition:color var(--apollo-motion-duration-slow);border:none;outline:none;background-color:transparent;}

.apollo-input-affix-wrapper .apollo-input-clear-icon:hover{color:var(--apollo-color-icon);}

.apollo-input-affix-wrapper .apollo-input-clear-icon:focus-visible{color:var(--apollo-color-icon);border-radius:var(--apollo-border-radius-sm);outline:var(--apollo-input-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}

.apollo-input-affix-wrapper .apollo-input-clear-icon:active{color:var(--apollo-color-text);}

.apollo-input-affix-wrapper .apollo-input-clear-icon-hidden{visibility:hidden;}

.apollo-input-affix-wrapper .apollo-input-clear-icon-has-suffix{margin:0 var(--apollo-padding-xxs);}

.apollo-input-underlined{border-radius:0;}

.apollo-input-affix-wrapper-disabled .apollo-input-password-icon{color:var(--apollo-color-icon);cursor:not-allowed;}

.apollo-input-affix-wrapper-disabled .apollo-input-password-icon:hover{color:var(--apollo-color-icon);}

.apollo-input-group{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:relative;display:table;width:100%;border-collapse:separate;border-spacing:0;}

.apollo-input-group[class*='col-']{padding-inline-end:var(--apollo-padding-xs);}

.apollo-input-group[class*='col-']:last-child{padding-inline-end:0;}

.apollo-input-group-lg .apollo-input,.apollo-input-group-lg>.apollo-input-group-addon{padding:var(--apollo-input-padding-block-lg) var(--apollo-input-padding-inline-lg);font-size:var(--apollo-input-input-font-size-lg);line-height:var(--apollo-line-height-lg);border-radius:var(--apollo-border-radius-lg);}

.apollo-input-group-sm .apollo-input,.apollo-input-group-sm>.apollo-input-group-addon{padding:var(--apollo-input-padding-block-sm) var(--apollo-input-padding-inline-sm);font-size:var(--apollo-input-input-font-size-sm);border-radius:var(--apollo-border-radius-sm);}

.apollo-input-group-lg .apollo-select-single{height:var(--apollo-control-height-lg);}

.apollo-input-group-sm .apollo-select-single{height:var(--apollo-control-height-sm);}

.apollo-input-group >.apollo-input{display:table-cell;}

.apollo-input-group >.apollo-input:not(:first-child):not(:last-child){border-radius:0;}

.apollo-input-group .apollo-input-group-addon,.apollo-input-group .apollo-input-group-wrap{display:table-cell;width:1px;white-space:nowrap;vertical-align:middle;}

.apollo-input-group .apollo-input-group-addon:not(:first-child):not(:last-child),.apollo-input-group .apollo-input-group-wrap:not(:first-child):not(:last-child){border-radius:0;}

.apollo-input-group .apollo-input-group-wrap>*{display:block!important;}

.apollo-input-group .apollo-input-group-addon{position:relative;padding:0 var(--apollo-input-padding-inline);color:var(--apollo-color-text);font-weight:normal;font-size:var(--apollo-input-input-font-size);text-align:center;border-radius:var(--apollo-border-radius);transition:all var(--apollo-motion-duration-slow);line-height:1;}

.apollo-input-group .apollo-input-group-addon .apollo-select{margin:calc((var(--apollo-input-padding-block) + 1px) * -1) calc(var(--apollo-input-padding-inline) * -1);}

.apollo-input-group .apollo-input-group-addon .apollo-select.apollo-select-single:not(.apollo-select-customize-input):not(.apollo-pagination-size-changer){background-color:inherit;border:var(--apollo-line-width) var(--apollo-line-type) transparent;box-shadow:none;}

.apollo-input-group .apollo-input-group-addon .apollo-cascader-picker{margin:-9px calc(var(--apollo-input-padding-inline) * -1);background-color:transparent;}

.apollo-input-group .apollo-input-group-addon .apollo-cascader-picker .apollo-cascader-input{text-align:start;border:0;box-shadow:none;}

.apollo-input-group .apollo-input{width:100%;margin-bottom:0;text-align:inherit;}

.apollo-input-group .apollo-input:focus{z-index:1;border-inline-end-width:1px;}

.apollo-input-group .apollo-input:hover{z-index:1;border-inline-end-width:1px;}

.apollo-input-group >.apollo-input:first-child,.apollo-input-group .apollo-input-group-addon:first-child{border-start-end-radius:0;border-end-end-radius:0;}

.apollo-input-group >.apollo-input:first-child .apollo-select,.apollo-input-group .apollo-input-group-addon:first-child .apollo-select{border-start-end-radius:0;border-end-end-radius:0;}

.apollo-input-group >.apollo-input-affix-wrapper:not(:first-child) .apollo-input{border-start-start-radius:0;border-end-start-radius:0;}

.apollo-input-group >.apollo-input-affix-wrapper:not(:last-child) .apollo-input{border-start-end-radius:0;border-end-end-radius:0;}

.apollo-input-group >.apollo-input:last-child,.apollo-input-group .apollo-input-group-addon:last-child{border-start-start-radius:0;border-end-start-radius:0;}

.apollo-input-group >.apollo-input:last-child .apollo-select,.apollo-input-group .apollo-input-group-addon:last-child .apollo-select{border-start-start-radius:0;border-end-start-radius:0;}

.apollo-input-group .apollo-input-affix-wrapper:not(:last-child){border-start-end-radius:0;border-end-end-radius:0;}

.apollo-input-group .apollo-input-affix-wrapper:not(:first-child){border-start-start-radius:0;border-end-start-radius:0;}

.apollo-input-group.apollo-input-group-compact{display:block;}

.apollo-input-group.apollo-input-group-compact::before{display:table;content:"";}

.apollo-input-group.apollo-input-group-compact::after{display:table;clear:both;content:"";}

.apollo-input-group.apollo-input-group-compact .apollo-input-group-addon:not(:first-child):not(:last-child),.apollo-input-group.apollo-input-group-compact .apollo-input-group-wrap:not(:first-child):not(:last-child),.apollo-input-group.apollo-input-group-compact >.apollo-input:not(:first-child):not(:last-child){border-inline-end-width:var(--apollo-line-width);}

.apollo-input-group.apollo-input-group-compact .apollo-input-group-addon:not(:first-child):not(:last-child):hover,.apollo-input-group.apollo-input-group-compact .apollo-input-group-wrap:not(:first-child):not(:last-child):hover,.apollo-input-group.apollo-input-group-compact >.apollo-input:not(:first-child):not(:last-child):hover,.apollo-input-group.apollo-input-group-compact .apollo-input-group-addon:not(:first-child):not(:last-child):focus,.apollo-input-group.apollo-input-group-compact .apollo-input-group-wrap:not(:first-child):not(:last-child):focus,.apollo-input-group.apollo-input-group-compact >.apollo-input:not(:first-child):not(:last-child):focus{z-index:1;}

.apollo-input-group.apollo-input-group-compact>*{display:inline-flex;float:none;vertical-align:top;border-radius:0;}

.apollo-input-group.apollo-input-group-compact>.apollo-input-affix-wrapper,.apollo-input-group.apollo-input-group-compact>.apollo-input-number-affix-wrapper,.apollo-input-group.apollo-input-group-compact>.apollo-picker-range{display:inline-flex;}

.apollo-input-group.apollo-input-group-compact>*:not(:last-child){margin-inline-end:calc(var(--apollo-line-width) * -1);border-inline-end-width:var(--apollo-line-width);}

.apollo-input-group.apollo-input-group-compact .apollo-input{float:none;}

.apollo-input-group.apollo-input-group-compact>.apollo-select,.apollo-input-group.apollo-input-group-compact>.apollo-select-auto-complete .apollo-input,.apollo-input-group.apollo-input-group-compact>.apollo-cascader-picker .apollo-input,.apollo-input-group.apollo-input-group-compact>.apollo-input-group-wrapper .apollo-input{border-inline-end-width:var(--apollo-line-width);border-radius:0;}

.apollo-input-group.apollo-input-group-compact>.apollo-select:hover,.apollo-input-group.apollo-input-group-compact>.apollo-select-auto-complete .apollo-input:hover,.apollo-input-group.apollo-input-group-compact>.apollo-cascader-picker .apollo-input:hover,.apollo-input-group.apollo-input-group-compact>.apollo-input-group-wrapper .apollo-input:hover,.apollo-input-group.apollo-input-group-compact>.apollo-select:focus,.apollo-input-group.apollo-input-group-compact>.apollo-select-auto-complete .apollo-input:focus,.apollo-input-group.apollo-input-group-compact>.apollo-cascader-picker .apollo-input:focus,.apollo-input-group.apollo-input-group-compact>.apollo-input-group-wrapper .apollo-input:focus{z-index:1;}

.apollo-input-group.apollo-input-group-compact>.apollo-select-focused{z-index:1;}

.apollo-input-group.apollo-input-group-compact>.apollo-select>.apollo-select-arrow{z-index:1;}

.apollo-input-group.apollo-input-group-compact>*:first-child,.apollo-input-group.apollo-input-group-compact>.apollo-select:first-child,.apollo-input-group.apollo-input-group-compact>.apollo-select-auto-complete:first-child .apollo-input,.apollo-input-group.apollo-input-group-compact>.apollo-cascader-picker:first-child .apollo-input{border-start-start-radius:var(--apollo-border-radius);border-end-start-radius:var(--apollo-border-radius);}

.apollo-input-group.apollo-input-group-compact>*:last-child,.apollo-input-group.apollo-input-group-compact>.apollo-select:last-child,.apollo-input-group.apollo-input-group-compact>.apollo-cascader-picker:last-child .apollo-input,.apollo-input-group.apollo-input-group-compact>.apollo-cascader-picker-focused:last-child .apollo-input{border-inline-end-width:var(--apollo-line-width);border-start-end-radius:var(--apollo-border-radius);border-end-end-radius:var(--apollo-border-radius);}

.apollo-input-group.apollo-input-group-compact>.apollo-select-auto-complete .apollo-input{vertical-align:top;}

.apollo-input-group.apollo-input-group-compact .apollo-input-group-wrapper+.apollo-input-group-wrapper{margin-inline-start:calc(var(--apollo-line-width) * -1);}

.apollo-input-group-rtl{direction:rtl;}

.apollo-input-group-wrapper{display:inline-block;width:100%;text-align:start;vertical-align:top;}

.apollo-input-group-wrapper-rtl{direction:rtl;}

.apollo-input-group-wrapper-lg .apollo-input-group-addon{border-radius:var(--apollo-border-radius-lg);font-size:var(--apollo-input-input-font-size-lg);}

.apollo-input-group-wrapper-sm .apollo-input-group-addon{border-radius:var(--apollo-border-radius-sm);}

.apollo-input-group-wrapper-outlined .apollo-input-group-addon{background:var(--apollo-input-addon-bg);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);}

.apollo-input-group-wrapper-outlined .apollo-input-group-addon:first-child{border-inline-end:0;}

.apollo-input-group-wrapper-outlined .apollo-input-group-addon:last-child{border-inline-start:0;}

.apollo-input-group-wrapper-outlined.apollo-input-group-wrapper-status-error .apollo-input-group-addon{border-color:var(--apollo-color-error);color:var(--apollo-color-error-text);}

.apollo-input-group-wrapper-outlined.apollo-input-group-wrapper-status-warning .apollo-input-group-addon{border-color:var(--apollo-color-warning);color:var(--apollo-color-warning-text);}

.apollo-input-group-wrapper-outlined.apollo-input-group-wrapper-disabled .apollo-input-group-addon{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}

.apollo-input-group-wrapper-outlined.apollo-input-group-wrapper-disabled .apollo-input-group-addon input[disabled],.apollo-input-group-wrapper-outlined.apollo-input-group-wrapper-disabled .apollo-input-group-addon textarea[disabled]{cursor:not-allowed;}

.apollo-input-group-wrapper-outlined.apollo-input-group-wrapper-disabled .apollo-input-group-addon:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}

.apollo-input-group-wrapper-filled .apollo-input-group-addon{background:var(--apollo-color-fill-tertiary);}

.apollo-input-group-wrapper-filled .apollo-input-group-addon:last-child{position:static;}

.apollo-input-group-wrapper-filled.apollo-input-group-wrapper-status-error .apollo-input-group-addon{background:var(--apollo-color-error-bg);color:var(--apollo-color-error-text);}

.apollo-input-group-wrapper-filled.apollo-input-group-wrapper-status-warning .apollo-input-group-addon{background:var(--apollo-color-warning-bg);color:var(--apollo-color-warning-text);}

.apollo-input-group-wrapper-filled.apollo-input-group-wrapper-disabled .apollo-input-group-addon{background:var(--apollo-color-fill-tertiary);color:var(--apollo-color-text-disabled);}

.apollo-input-group-wrapper-filled.apollo-input-group-wrapper-disabled .apollo-input-group-addon:first-child{border-inline-start:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);border-top:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);}

.apollo-input-group-wrapper-filled.apollo-input-group-wrapper-disabled .apollo-input-group-addon:last-child{border-inline-end:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);border-top:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);}

.apollo-input-group-wrapper:not(.apollo-input-compact-first-item):not(.apollo-input-compact-last-item).apollo-input-compact-item .apollo-input,.apollo-input-group-wrapper:not(.apollo-input-compact-first-item):not(.apollo-input-compact-last-item).apollo-input-compact-item .apollo-input-group-addon{border-radius:0;}

.apollo-input-group-wrapper:not(.apollo-input-compact-last-item).apollo-input-compact-first-item .apollo-input,.apollo-input-group-wrapper:not(.apollo-input-compact-last-item).apollo-input-compact-first-item .apollo-input-group-addon{border-start-end-radius:0;border-end-end-radius:0;}

.apollo-input-group-wrapper:not(.apollo-input-compact-first-item).apollo-input-compact-last-item .apollo-input,.apollo-input-group-wrapper:not(.apollo-input-compact-first-item).apollo-input-compact-last-item .apollo-input-group-addon{border-start-start-radius:0;border-end-start-radius:0;}

.apollo-input-group-wrapper:not(.apollo-input-compact-last-item).apollo-input-compact-item .apollo-input-affix-wrapper{border-start-end-radius:0;border-end-end-radius:0;}

.apollo-input-group-wrapper:not(.apollo-input-compact-first-item).apollo-input-compact-item .apollo-input-affix-wrapper{border-start-start-radius:0;border-end-start-radius:0;}

.apollo-input-out-of-range,.apollo-input-out-of-range input,.apollo-input-out-of-range textarea,.apollo-input-out-of-range .apollo-input-show-count-suffix,.apollo-input-out-of-range .apollo-input-data-count{color:var(--apollo-color-error);}

.apollo-input-compact-item:not(.apollo-input-compact-last-item){margin-inline-end:calc(var(--apollo-line-width) * -1);}

.apollo-input-compact-item:not(.apollo-input-status-success){z-index:2;}

.apollo-input-compact-item:focus,.apollo-input-compact-item:active{z-index:3;}

.apollo-input-compact-item:hover,.apollo-input-compact-item:hover.apollo-input-affix-wrapper-focused{z-index:4;}

.apollo-input-compact-item.apollo-input-affix-wrapper-focused{z-index:3;}

.apollo-input-compact-item[disabled]{z-index:0;}

.apollo-input-compact-item:not(.apollo-input-compact-first-item):not(.apollo-input-compact-last-item){border-radius:0;}

.apollo-input-compact-item:not(.apollo-input-compact-last-item).apollo-input-compact-first-item,.apollo-input-compact-item:not(.apollo-input-compact-last-item).apollo-input-compact-first-item.apollo-input-sm,.apollo-input-compact-item:not(.apollo-input-compact-last-item).apollo-input-compact-first-item.apollo-input-lg{border-start-end-radius:0;border-end-end-radius:0;}

.apollo-input-compact-item:not(.apollo-input-compact-first-item).apollo-input-compact-last-item,.apollo-input-compact-item:not(.apollo-input-compact-first-item).apollo-input-compact-last-item.apollo-input-sm,.apollo-input-compact-item:not(.apollo-input-compact-first-item).apollo-input-compact-last-item.apollo-input-lg{border-start-start-radius:0;border-end-start-radius:0;}
`;

/** Input 家族样式（Input / TextArea / Password / Group）。 */
export function genInputStyle(rootPrefixCls: string = 'apollo'): string {
  // ⚠️ antd 把组件变量声明在每个 css-var 根上（useCSSVarCls：裸 input / affix
  // wrapper / group wrapper 都带 -css-var 类）—— 本仓无 -css-var 类，等价做法是
  // 声明块覆盖全部三种根形态（L6 实测：只挂 .{p}-input 时 wrapper 根的
  // padding:var(...) 整体失效回退 0、字号回落继承 16px —— CHECKLIST #77）。
  const d = genTokenDecls(rootPrefixCls).join('');
  const decls = [
    `.${rootPrefixCls}-input{${d}}`,
    `.${rootPrefixCls}-input-affix-wrapper{${d}}`,
    `.${rootPrefixCls}-input-group-wrapper{${d}}`,
  ].join('\n\n');
  return `${decls}

${RULES}`;
}
