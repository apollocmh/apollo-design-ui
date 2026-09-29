/**
 * Form 的静态样式（antd `es/form/style/index.js` 486 行的核心子集）。
 *
 * 契约来源：antd 6.6.4 逐字判定值（docs/analysis/form.md §7）。
 * 覆盖：布局（horizontal/vertical/inline）、label（colon/required mark/tooltip/
 * optional）、item control、explain（错误文字）、show-help 动效、extra、hidden、
 * -item-margin-offset。按需引入用 `@apollo-design/ui/form/style.css`。
 */

import { token2CSSVar } from '@apollo-design/theme';

const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 变量声明（10 个字段，前缀随根）。 */
export function genFormTokenDecls(rootPrefixCls: string): string {
  return [
    `--${rootPrefixCls}-form-label-required-mark-color:${v('colorError')};`,
    `--${rootPrefixCls}-form-label-color:${v('colorTextHeading')};`,
    `--${rootPrefixCls}-form-label-font-size:${v('fontSize')};`,
    `--${rootPrefixCls}-form-label-height:${v('controlHeight')};`,
    `--${rootPrefixCls}-form-vertical-label-height:auto;`,
    `--${rootPrefixCls}-form-label-colon-margin-inline-start:calc(${v('marginXXS')} / 2);`,
    `--${rootPrefixCls}-form-label-colon-margin-inline-end:${v('marginXS')};`,
    `--${rootPrefixCls}-form-item-margin-bottom:${v('marginLG')};`,
    `--${rootPrefixCls}-form-vertical-label-padding:0 0 ${v('paddingXS')};`,
    `--${rootPrefixCls}-form-vertical-label-margin:0;`,
  ].join('');
}

export function genFormStyle(rootPrefixCls: string): string {
  const p = `${rootPrefixCls}-form`;
  const item = `.${p}-item`;
  const explain = `${item}-explain`;
  return [
    // ── 根 ──
    `.${p}{display:flex;flex-direction:column;}`,
    `.${p}-${'inline'}{display:flex;flex-flow:row wrap;}`,
    // ── Item 基础 ──
    `${item}{margin-bottom:${v('marginLG')};}`,
    `${item}-hidden{display:none;}`,
    // ── Row / Label ──
    `${item}-row{display:flex;flex-flow:row wrap;row-gap:0;}`,
    `${item}-label{flex-grow:0;overflow:hidden;white-space:nowrap;text-align:end;vertical-align:middle;`,
    `label,${item}-label{color:${v('colorTextHeading')};font-size:${v('fontSize')};}`,
    `${item}-label>label{position:relative;display:inline-flex;align-items:center;max-width:100%;height:${v('controlHeight')};color:${v('colorTextHeading')};font-size:${v('fontSize')};}`,
    `${item}-label>label .${p}-item-tooltip{display:inline-flex;align-items:center;margin-inline-start:${v('marginXXS')};color:${v('colorTextDescription')};font-size:${v('fontSize')};vertical-align:top;cursor:pointer;transition:all .2s;}`,
    `${item}-label>label .${p}-item-tooltip:hover{color:${v('colorText')};}`,
    `${item}-label>label .${p}-item-optional{display:inline-block;margin-inline-start:${v('marginXXS')};color:${v('colorTextDescription')};}`,
    `${item}-label>label.${p}-item-required:not(.${p}-item-required-mark-optional)::before{display:inline-block;margin-inline-end:4px;color:${v('colorError')};font-size:${v('fontSize')};font-family:SimSun,sans-serif;line-height:1;content:"*";}`,
    `${item}-label>label.${p}-item-required-mark-optional::after{display:inline-block;margin-inline-start:${v('marginXXS')};color:${v('colorTextDescription')};content:"(optional)";}`,
    // ── Control ──
    `${item}-control{flex:1 0 0;min-width:0;}`,
    `${item}-control-input{position:relative;display:flex;align-items:center;min-height:${v('controlHeight')};}`,
    `${item}-control-input-content{flex:auto;max-width:100%;}`,
    `${item}-control-input-content input[type="checkbox"],${item}-control-input-content input[type="radio"]{width:14px;height:14px;}`,
    `${item}-additional{min-height:${v('controlHeight')};transition:margin-bottom .3s linear 0s;}`,
    `${item}-extra{clear:both;min-height:${v('controlHeight')};padding-top:2px;color:${v('colorTextDescription')};font-size:${v('fontSize')};line-height:${v('lineHeight')};transition:color .3s cubic-bezier(.215,.61,.355,1);}`,
    // ── Explain / show-help 动效 ──
    `${explain}{clear:both;min-height:${v('controlHeight')};margin-top:-2px;color:${v('colorError')};font-size:${v('fontSize')};line-height:${v('lineHeight')};transition:color .3s cubic-bezier(.215,.61,.355,1);}`,
    `${explain}-error{color:${v('colorError')};}`,
    `${explain}-warning{color:${v('colorWarning')};}`,
    `${explain}-success{color:${v('colorSuccess')};}`,
    `${explain}-validating{color:${v('colorPrimary')};}`,
    `.${p}-show-help{transition:opacity .3s cubic-bezier(.215,.61,.355,1);}`,
    `.${p}-show-help-exit-done{display:none;}`,
    `.${p}-show-help-item{max-height:9999px;overflow:hidden;transition:height .3s cubic-bezier(.215,.61,.355,1),opacity .3s cubic-bezier(.215,.61,.355,1),transform .3s cubic-bezier(.215,.61,.355,1) !important;}`,
    `.${p}-show-help-item-appear,.${p}-show-help-item-enter{opacity:0;transform:translateY(-5px);}`,
    `.${p}-show-help-item-appear-active,.${p}-show-help-item-enter-active{opacity:1;transform:translateY(0);}`,
    `.${p}-show-help-item-leave{opacity:1;transform:translateY(0);}`,
    `.${p}-show-help-item-leave-active,.${p}-show-help-item-leave-done{opacity:0;transform:translateY(-5px);}`,
    // ── 状态反馈 ──
    `${item}-has-feedback .${p}-item-control-input{padding-inline-end:24px;}`,
    `${item}-has-feedback${item}-has-success .${item}-explain,${item}-has-success .${item}-explain{color:${v('colorSuccess')};}`,
    `${item}-has-feedback${item}-has-warning .${item}-explain,${item}-has-warning .${item}-explain{color:${v('colorWarning')};}`,
    `${item}-has-error .${item}-explain,${item}-has-feedback${item}-has-error .${item}-explain{color:${v('colorError')};}`,
    `${item}-is-validating .${item}-explain{color:${v('colorPrimary')};}`,
    // ── margin 联动（错误占位回收）──
    `${item}-margin-offset{margin-bottom:-${v('marginLG')};}`,
    // ── 垂直布局 ──
    `.${p}-vertical ${item}-row{flex-direction:column;}`,
    `.${p}-vertical ${item}-label>label{height:auto;}`,
    `.${p}-vertical ${item}-label{padding:var(--${rootPrefixCls}-form-vertical-label-padding);margin:var(--${rootPrefixCls}-form-vertical-label-margin);}`,
    // ── inline ──
    `.${p}-${'inline'} ${item}{flex:none;flex-wrap:nowrap;margin-right:${v('marginLG')};margin-bottom:0;}`,
    `.${p}-${'inline'} ${item}-label{display:inline-block;text-align:start;}`,
    // ── hide required mark ──
    `.${p}-hide-required-mark ${item}-required:not(.${p}-item-required-mark-optional)::before{display:none;}`,
  ].join('\n');
}
