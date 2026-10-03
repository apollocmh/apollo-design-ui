/**
 * Mentions 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/mentions/style/index.js`，**逐条对拍 extractStyle 真实产物**
 * （`node tests/visual/debug/extract-mentions-css.mjs` ⇒ **98 条**规则，其中 97 条进 RULES、
 * 1 条是 cssinjs 的 `.data-ant-cssinjs-cache-path` 标记块，丢弃），不是照源码推演。
 *
 * ── 与 antd 产物的结构性差异（D5 / D46-D50 同判）──────────────────────────────
 *
 * 1. 无 hash / `-css-var` 包裹层：`:where(.css-dev-only-do-not-override-…)` 全部剥掉
 *    （本仓零运行时，不可能产出这类类名）。
 * 2. 全部 `--ant-*` → `--apollo-*`（全局 alias，随主题自适应）；
 *    `--ant-mentions-*` → `--{p}-mentions-*`、`--ant-cmp-mentions-*` → `--{p}-cmp-mentions-*`
 *    （组件自有变量，**跟着前缀走**）。
 * 3. 组件 token 声明块在 antd 里挂在 `.css-var-root.ant-mentions`；本仓挂在
 *    `.{p}-mentions`（见 genTokenDecls 的注释：affix 形态下根就是 affix wrapper，
 *    而它**同时带 `{p}-mentions` 类** ⇒ 一条声明块覆盖两种根形态）。
 * 4. 规则体**逐字节**来自产物（选择器形态 —— 复合 vs 后代 —— 与产物一致）。
 *    ⚠️ CHECKLIST #71/#75 的教训：形态错一条，浏览器整条静默丢弃。
 *
 * ── 规则体是**机器搬运**，但必须**参数化**（`style-prefix.test.ts` 会抓）──────────────
 *
 * 搬运时用占位符 `__P__` 代替前缀，`genMentionsStyle(p)` 里一次性替换
 * （`date-picker` 的静态串教训：写死 `.apollo-` 会让 `prefixCls="ant"` 下**完全没有样式**）。
 * 判据：`genMentionsStyle('ant')` 里 `.apollo-` **一个不剩**，且 `.ant-` 计数与
 * `genMentionsStyle('apollo')` 的 `.apollo-` **相等**。
 */

import { mentionsTokenValues } from './token';

/**
 * Component Token 声明块（对拍 antd 的 `.css-var-root.ant-mentions` 块，**22 条**）。
 *
 * ⚠️ 与 `input/style/index.ts` 的分工不同：input 把声明挂在**三种根形态**上
 * （裸 input / affix wrapper / group wrapper 都带 `-css-var` 类）；mentions 只有两种根，
 * 而 affix 形态的根**自带 `{p}-mentions` 类**（实测 DOM：`class="{p}-mentions-affix-wrapper … {p}-mentions …"`）
 * ⇒ 一条 `.{p}-mentions{…}` 就够。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const t = mentionsTokenValues();
  return [
    `  --${rootPrefixCls}-mentions-line-width-focus:${t.lineWidthFocus};`,
    `  --${rootPrefixCls}-mentions-padding-block:${t.paddingBlock};`,
    `  --${rootPrefixCls}-mentions-padding-block-sm:${t.paddingBlockSM};`,
    `  --${rootPrefixCls}-mentions-padding-block-lg:${t.paddingBlockLG};`,
    `  --${rootPrefixCls}-mentions-padding-inline:${t.paddingInline};`,
    `  --${rootPrefixCls}-mentions-padding-inline-sm:${t.paddingInlineSM};`,
    `  --${rootPrefixCls}-mentions-padding-inline-lg:${t.paddingInlineLG};`,
    `  --${rootPrefixCls}-mentions-addon-bg:${t.addonBg};`,
    `  --${rootPrefixCls}-mentions-active-border-color:${t.activeBorderColor};`,
    `  --${rootPrefixCls}-mentions-hover-border-color:${t.hoverBorderColor};`,
    `  --${rootPrefixCls}-mentions-active-shadow:${t.activeShadow};`,
    `  --${rootPrefixCls}-mentions-error-active-shadow:${t.errorActiveShadow};`,
    `  --${rootPrefixCls}-mentions-warning-active-shadow:${t.warningActiveShadow};`,
    `  --${rootPrefixCls}-mentions-hover-bg:${t.hoverBg};`,
    `  --${rootPrefixCls}-mentions-active-bg:${t.activeBg};`,
    `  --${rootPrefixCls}-mentions-input-font-size:${t.inputFontSize};`,
    `  --${rootPrefixCls}-mentions-input-font-size-lg:${t.inputFontSizeLG};`,
    `  --${rootPrefixCls}-mentions-input-font-size-sm:${t.inputFontSizeSM};`,
    `  --${rootPrefixCls}-mentions-dropdown-height:${t.dropdownHeight};`,
    `  --${rootPrefixCls}-mentions-control-item-width:${t.controlItemWidth};`,
    `  --${rootPrefixCls}-mentions-z-index-popup:${t.zIndexPopup};`,
    `  --${rootPrefixCls}-mentions-item-padding-vertical:${t.itemPaddingVertical};`,
  ];
}

/** antd 产物机械转换段（97 条，原序；占位符 __P__ = 前缀）。 */
const RULES = `
.__P__-mentions{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:relative;display:inline-block;width:100%;min-width:0;padding:var(--__P__-mentions-padding-block) var(--__P__-mentions-padding-inline);color:var(--apollo-color-text);font-size:var(--__P__-mentions-input-font-size);line-height:var(--apollo-line-height);border-radius:var(--apollo-border-radius);transition:all var(--apollo-motion-duration-mid);--__P__-cmp-mentions-padding-inline:var(--__P__-mentions-padding-inline);--__P__-cmp-mentions-padding-block:var(--__P__-mentions-padding-block);--__P__-cmp-mentions-control-height:var(--apollo-control-height);display:flex;padding:0;white-space:pre-wrap;}
.__P__-mentions::-moz-placeholder{opacity:1;}
.__P__-mentions::placeholder{color:var(--apollo-color-text-placeholder);user-select:none;}
.__P__-mentions:placeholder-shown{text-overflow:ellipsis;}
.__P__-mentions-lg{padding:0;font-size:var(--__P__-mentions-input-font-size-lg);line-height:var(--apollo-line-height-lg);border-radius:var(--apollo-border-radius-lg);}
.__P__-mentions-sm{padding:0;font-size:var(--__P__-mentions-input-font-size-sm);border-radius:var(--apollo-border-radius-sm);}
.__P__-mentions-rtl,.__P__-mentions-textarea-rtl{direction:rtl;}
.__P__-mentions-outlined{background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-border);}
.__P__-mentions-outlined:hover{border-color:var(--__P__-mentions-hover-border-color);background-color:var(--__P__-mentions-hover-bg);}
.__P__-mentions-outlined:focus,.__P__-mentions-outlined:focus-within{border-color:var(--__P__-mentions-active-border-color);box-shadow:var(--__P__-mentions-active-shadow);outline:0;background-color:var(--__P__-mentions-active-bg);}
.__P__-mentions-outlined.__P__-mentions-disabled,.__P__-mentions-outlined[disabled]{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}
.__P__-mentions-outlined.__P__-mentions-disabled input[disabled],.__P__-mentions-outlined[disabled] input[disabled],.__P__-mentions-outlined.__P__-mentions-disabled textarea[disabled],.__P__-mentions-outlined[disabled] textarea[disabled]{cursor:not-allowed;}
.__P__-mentions-outlined.__P__-mentions-disabled:hover:not([disabled]),.__P__-mentions-outlined[disabled]:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}
.__P__-mentions-outlined.__P__-mentions-status-error:not(.__P__-mentions-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-error);}
.__P__-mentions-outlined.__P__-mentions-status-error:not(.__P__-mentions-disabled):hover{border-color:var(--apollo-color-error-border-hover);background-color:var(--__P__-mentions-hover-bg);}
.__P__-mentions-outlined.__P__-mentions-status-error:not(.__P__-mentions-disabled):focus,.__P__-mentions-outlined.__P__-mentions-status-error:not(.__P__-mentions-disabled):focus-within{border-color:var(--apollo-color-error);box-shadow:var(--__P__-mentions-error-active-shadow);outline:0;background-color:var(--__P__-mentions-active-bg);}
.__P__-mentions-outlined.__P__-mentions-status-error:not(.__P__-mentions-disabled) .__P__-mentions-prefix,.__P__-mentions-outlined.__P__-mentions-status-error:not(.__P__-mentions-disabled) .__P__-mentions-suffix{color:var(--apollo-color-error-affix);}
.__P__-mentions-outlined.__P__-mentions-status-error.__P__-mentions-disabled{border-color:var(--apollo-color-error);}
.__P__-mentions-outlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-warning);}
.__P__-mentions-outlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled):hover{border-color:var(--apollo-color-warning-border-hover);background-color:var(--__P__-mentions-hover-bg);}
.__P__-mentions-outlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled):focus,.__P__-mentions-outlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled):focus-within{border-color:var(--apollo-color-warning);box-shadow:var(--__P__-mentions-warning-active-shadow);outline:0;background-color:var(--__P__-mentions-active-bg);}
.__P__-mentions-outlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled) .__P__-mentions-prefix,.__P__-mentions-outlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled) .__P__-mentions-suffix{color:var(--apollo-color-warning-affix);}
.__P__-mentions-outlined.__P__-mentions-status-warning.__P__-mentions-disabled{border-color:var(--apollo-color-warning);}
.__P__-mentions-filled{background:var(--apollo-color-fill-tertiary);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:transparent;}
input.__P__-mentions-filled,.__P__-mentions-filled input,textarea.__P__-mentions-filled,.__P__-mentions-filled textarea{color:var(--apollo-color-text);}
.__P__-mentions-filled:hover{background:var(--apollo-color-fill-secondary);}
.__P__-mentions-filled:focus,.__P__-mentions-filled:focus-within{outline:0;border-color:var(--__P__-mentions-active-border-color);background-color:var(--__P__-mentions-active-bg);}
.__P__-mentions-filled.__P__-mentions-disabled,.__P__-mentions-filled[disabled]{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}
.__P__-mentions-filled.__P__-mentions-disabled input[disabled],.__P__-mentions-filled[disabled] input[disabled],.__P__-mentions-filled.__P__-mentions-disabled textarea[disabled],.__P__-mentions-filled[disabled] textarea[disabled]{cursor:not-allowed;}
.__P__-mentions-filled.__P__-mentions-disabled:hover:not([disabled]),.__P__-mentions-filled[disabled]:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}
.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled){background:var(--apollo-color-error-bg);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:transparent;}
input.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled),.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled) input,textarea.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled),.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled) textarea{color:var(--apollo-color-error-text);}
.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled):hover{background:var(--apollo-color-error-bg-hover);}
.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled):focus,.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled):focus-within{outline:0;border-color:var(--apollo-color-error);background-color:var(--__P__-mentions-active-bg);}
.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled) .__P__-mentions-prefix,.__P__-mentions-filled.__P__-mentions-status-error:not(.__P__-mentions-disabled) .__P__-mentions-suffix{color:var(--apollo-color-error-affix);}
.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled){background:var(--apollo-color-warning-bg);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:transparent;}
input.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled),.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled) input,textarea.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled),.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled) textarea{color:var(--apollo-color-warning-text);}
.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled):hover{background:var(--apollo-color-warning-bg-hover);}
.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled):focus,.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled):focus-within{outline:0;border-color:var(--apollo-color-warning);background-color:var(--__P__-mentions-active-bg);}
.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled) .__P__-mentions-prefix,.__P__-mentions-filled.__P__-mentions-status-warning:not(.__P__-mentions-disabled) .__P__-mentions-suffix{color:var(--apollo-color-warning-affix);}
.__P__-mentions-borderless{background:transparent;border:none;padding-block:calc(var(--__P__-mentions-padding-block) + var(--apollo-line-width));}
.__P__-mentions-borderless.__P__-mentions-sm,.__P__-mentions-borderless.__P__-mentions-affix-wrapper-sm{padding-block:calc(var(--__P__-mentions-padding-block-sm) + var(--apollo-line-width));}
.__P__-mentions-borderless.__P__-mentions-lg,.__P__-mentions-borderless.__P__-mentions-affix-wrapper-lg{padding-block:calc(var(--__P__-mentions-padding-block-lg) + var(--apollo-line-width));}
.__P__-mentions-borderless:focus,.__P__-mentions-borderless:focus-within{outline:none;}
.__P__-mentions-borderless:focus-visible,.__P__-mentions-borderless:has(input:focus-visible),.__P__-mentions-borderless:has(textarea:focus-visible){outline:var(--__P__-mentions-line-width-focus) var(--apollo-line-type) var(--__P__-mentions-active-border-color);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}
.__P__-mentions-borderless.__P__-mentions-disabled,.__P__-mentions-borderless[disabled]{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.__P__-mentions-borderless.__P__-mentions-status-error,.__P__-mentions-borderless.__P__-mentions-status-error input,.__P__-mentions-borderless.__P__-mentions-status-error textarea{color:var(--apollo-color-error);}
.__P__-mentions-borderless.__P__-mentions-status-error:focus-visible,.__P__-mentions-borderless.__P__-mentions-status-error:has(input:focus-visible),.__P__-mentions-borderless.__P__-mentions-status-error:has(textarea:focus-visible){outline:var(--__P__-mentions-line-width-focus) var(--apollo-line-type) var(--apollo-color-error);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}
.__P__-mentions-borderless.__P__-mentions-status-error .__P__-mentions-prefix,.__P__-mentions-borderless.__P__-mentions-status-error .__P__-mentions-suffix{color:var(--apollo-color-error-affix);}
.__P__-mentions-borderless.__P__-mentions-status-warning,.__P__-mentions-borderless.__P__-mentions-status-warning input,.__P__-mentions-borderless.__P__-mentions-status-warning textarea{color:var(--apollo-color-warning);}
.__P__-mentions-borderless.__P__-mentions-status-warning:focus-visible,.__P__-mentions-borderless.__P__-mentions-status-warning:has(input:focus-visible),.__P__-mentions-borderless.__P__-mentions-status-warning:has(textarea:focus-visible){outline:var(--__P__-mentions-line-width-focus) var(--apollo-line-type) var(--apollo-color-warning);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}
.__P__-mentions-borderless.__P__-mentions-status-warning .__P__-mentions-prefix,.__P__-mentions-borderless.__P__-mentions-status-warning .__P__-mentions-suffix{color:var(--apollo-color-warning-affix);}
.__P__-mentions-underlined{background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-border) transparent;border-radius:0;}
.__P__-mentions-underlined:hover{border-color:transparent transparent var(--__P__-mentions-hover-border-color) transparent;background-color:var(--__P__-mentions-hover-bg);}
.__P__-mentions-underlined:focus,.__P__-mentions-underlined:focus-within{border-color:transparent transparent var(--__P__-mentions-active-border-color) transparent;outline:0;background-color:var(--__P__-mentions-active-bg);}
.__P__-mentions-underlined.__P__-mentions-disabled,.__P__-mentions-underlined[disabled]{color:var(--apollo-color-text-disabled);box-shadow:none;cursor:not-allowed;}
.__P__-mentions-underlined.__P__-mentions-disabled:hover,.__P__-mentions-underlined[disabled]:hover{border-color:transparent transparent var(--apollo-color-border) transparent;}
.__P__-mentions-underlined input[disabled],.__P__-mentions-underlined textarea[disabled]{cursor:not-allowed;}
.__P__-mentions-underlined.__P__-mentions-status-error:not(.__P__-mentions-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-error) transparent;border-radius:0;}
.__P__-mentions-underlined.__P__-mentions-status-error:not(.__P__-mentions-disabled):hover{border-color:transparent transparent var(--apollo-color-error-border-hover) transparent;background-color:var(--__P__-mentions-hover-bg);}
.__P__-mentions-underlined.__P__-mentions-status-error:not(.__P__-mentions-disabled):focus,.__P__-mentions-underlined.__P__-mentions-status-error:not(.__P__-mentions-disabled):focus-within{border-color:transparent transparent var(--apollo-color-error) transparent;outline:0;background-color:var(--__P__-mentions-active-bg);}
.__P__-mentions-underlined.__P__-mentions-status-error:not(.__P__-mentions-disabled) .__P__-mentions-prefix,.__P__-mentions-underlined.__P__-mentions-status-error:not(.__P__-mentions-disabled) .__P__-mentions-suffix{color:var(--apollo-color-error-affix);}
.__P__-mentions-underlined.__P__-mentions-status-error.__P__-mentions-disabled{border-color:transparent transparent var(--apollo-color-error) transparent;}
.__P__-mentions-underlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-warning) transparent;border-radius:0;}
.__P__-mentions-underlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled):hover{border-color:transparent transparent var(--apollo-color-warning-border-hover) transparent;background-color:var(--__P__-mentions-hover-bg);}
.__P__-mentions-underlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled):focus,.__P__-mentions-underlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled):focus-within{border-color:transparent transparent var(--apollo-color-warning) transparent;outline:0;background-color:var(--__P__-mentions-active-bg);}
.__P__-mentions-underlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled) .__P__-mentions-prefix,.__P__-mentions-underlined.__P__-mentions-status-warning:not(.__P__-mentions-disabled) .__P__-mentions-suffix{color:var(--apollo-color-warning-affix);}
.__P__-mentions-underlined.__P__-mentions-status-warning.__P__-mentions-disabled{border-color:transparent transparent var(--apollo-color-warning) transparent;}
.__P__-mentions >textarea{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);background:transparent;border:none;border-radius:inherit;outline:none;flex:auto;min-width:0;resize:none;}
.__P__-mentions >textarea::-moz-placeholder{opacity:1;}
.__P__-mentions >textarea::placeholder{color:var(--apollo-color-text-placeholder);user-select:none;}
.__P__-mentions >textarea:placeholder-shown{text-overflow:ellipsis;}
.__P__-mentions >textarea:disabled{color:var(--apollo-color-text-disabled);}
.__P__-mentions >textarea,.__P__-mentions .__P__-mentions-measure{color:var(--apollo-color-text);box-sizing:border-box;margin:0;min-height:calc(var(--__P__-cmp-mentions-control-height) - calc(var(--apollo-line-width) * 2));padding-inline:var(--__P__-cmp-mentions-padding-inline);padding-block:var(--__P__-cmp-mentions-padding-block);overflow:inherit;overflow-x:hidden;overflow-y:auto;font-weight:inherit;font-size:inherit;font-family:inherit;font-style:inherit;font-variant:inherit;font-size-adjust:inherit;font-stretch:inherit;line-height:inherit;direction:inherit;letter-spacing:inherit;white-space:inherit;text-align:inherit;vertical-align:top;word-wrap:break-word;word-break:inherit;tab-size:inherit;}
.__P__-mentions .__P__-mentions-measure{position:absolute;inset:0;z-index:-1;color:transparent;pointer-events:none;}
.__P__-mentions .__P__-mentions-measure >span{display:inline-block;min-height:1em;}
.__P__-mentions .__P__-mentions-suffix{display:inline-flex;align-items:center;flex:none;color:var(--apollo-color-text-quaternary);font-size:var(--apollo-font-size-icon);line-height:1;position:absolute;top:50%;transform:translateY(-50%);inset-inline-end:var(--__P__-cmp-mentions-padding-inline);column-gap:var(--apollo-margin-xs);}
.__P__-mentions .__P__-mentions-suffix .__P__-mentions-clear-icon{cursor:pointer;border:0;background:transparent;}
.__P__-mentions .__P__-mentions-suffix .__P__-mentions-clear-icon:hover{color:var(--apollo-color-icon);}
.__P__-mentions .__P__-mentions-suffix .__P__-mentions-clear-icon:active{color:var(--apollo-color-text);}
.__P__-mentions .__P__-mentions-suffix .__P__-mentions-clear-icon-hidden{visibility:hidden;}
.__P__-mentions .__P__-mentions-suffix .__P__-form-item-feedback-icon{display:inline-flex;align-items:center;justify-content:center;}
.__P__-mentions-has-suffix >textarea{padding-inline-end:calc(var(--apollo-padding-xxs) * 1.5 + var(--apollo-font-size-icon) + var(--__P__-cmp-mentions-padding-inline));}
.__P__-mentions-disabled >textarea{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}
.__P__-mentions-disabled >textarea input[disabled],.__P__-mentions-disabled >textarea textarea[disabled]{cursor:not-allowed;}
.__P__-mentions-disabled >textarea:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}
.__P__-mentions-lg{--__P__-cmp-mentions-padding-inline:var(--__P__-mentions-padding-inline-lg);--__P__-cmp-mentions-padding-block:var(--__P__-mentions-padding-block-lg);--__P__-cmp-mentions-control-height:var(--apollo-control-height-lg);}
.__P__-mentions-sm{--__P__-cmp-mentions-padding-inline:var(--__P__-mentions-padding-inline-sm);--__P__-cmp-mentions-padding-block:var(--__P__-mentions-padding-block-sm);--__P__-cmp-mentions-control-height:var(--apollo-control-height-sm);}
.__P__-mentions-dropdown{box-sizing:border-box;margin:0;padding:var(--apollo-padding-xxs);color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:absolute;top:-9999px;inset-inline-start:-9999px;z-index:var(--__P__-mentions-z-index-popup);font-variant:initial;background-color:var(--apollo-color-bg-elevated);border-radius:var(--apollo-border-radius-lg);outline:none;box-shadow:var(--apollo-box-shadow-secondary);}
.__P__-mentions-dropdown-hidden{display:none;}
.__P__-mentions-dropdown .__P__-mentions-dropdown-menu{max-height:var(--__P__-mentions-dropdown-height);margin:0;padding-inline-start:0;overflow:auto;list-style:none;outline:none;}
.__P__-mentions-dropdown .__P__-mentions-dropdown-menu-item{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;position:relative;display:block;min-width:var(--__P__-mentions-control-item-width);padding:var(--__P__-mentions-item-padding-vertical) var(--apollo-control-padding-horizontal);color:var(--apollo-color-text);border-radius:var(--apollo-border-radius);font-weight:normal;line-height:var(--apollo-line-height);cursor:pointer;transition:background-color var(--apollo-motion-duration-slow) ease;}
.__P__-mentions-dropdown .__P__-mentions-dropdown-menu-item:hover{background-color:var(--apollo-control-item-bg-hover);}
.__P__-mentions-dropdown .__P__-mentions-dropdown-menu-item-disabled{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.__P__-mentions-dropdown .__P__-mentions-dropdown-menu-item-disabled:hover{color:var(--apollo-color-text-disabled);background-color:var(--apollo-control-item-bg-hover);cursor:not-allowed;}
.__P__-mentions-dropdown .__P__-mentions-dropdown-menu-item-selected{color:var(--apollo-color-text);font-weight:var(--apollo-font-weight-strong);background-color:var(--apollo-control-item-bg-hover);}
.__P__-mentions-dropdown .__P__-mentions-dropdown-menu-item-active{background-color:var(--apollo-control-item-bg-hover);}
`;

/** Mentions 样式（根 + 输入族 variant/size/status/rtl + mentions 自有 + 下拉）。 */
export function genMentionsStyle(rootPrefixCls: string = 'apollo'): string {
  const d = genTokenDecls(rootPrefixCls).join('\n');
  const decls = `.${rootPrefixCls}-mentions{\n${d}\n}`;
  /**
   * 🚨 **第二份声明块挂在 `.{p}-mentions-css-var` 上** —— 浮层（`div.{p}-mentions-dropdown`）
   * **不在 `.mentions` 的子树里**（它被 Portal 到别处），却要用
   * `var(--{p}-mentions-item-padding-vertical)` 等组件变量。
   *
   * antd 靠 cssinjs 的 cssVar 类解决同一问题：它的 token 声明块选择器是
   * `.css-var-root.ant-mentions`，而浮层的 `classNames.popup` 里带了
   * `ant-mentions-css-var`（`rootCls`）⇒ 命中。本仓没有 `css-var-root`，
   * 但同样在 `classNames.popup` 里保留了 `{p}-css-var`（见 `engine/Mentions.ts`），
   * 所以这里补一条以它为选择器的声明块即可 —— **L6 实测**：漏了它，
   * `padding: var(...) var(...)` 整条失效 ⇒ 候选行高少 10px（1.33% / 0.65% / 0.35%，
   * 差异率随视口**反比**下降 = 固定尺寸区域）。
   */
  const popupDecls = `.${rootPrefixCls}-mentions-css-var{\n${d}\n}`;
  return `${decls}\n${popupDecls}\n${RULES.split('__P__').join(rootPrefixCls)}`;
}
