/**
 * Transfer 的静态样式（antd 6.6.4 `es/transfer/style/index.js` 的**机械移植**）。
 *
 * ── 这份文件是怎么来的 ──────────────────────────────────────────────────────
 *
 * ```
 * node tests/visual/debug/extract-transfer-css.mjs --emit-static
 * ```
 *
 * 用 React SSR + cssinjs extractStyle dump antd 真实产物（10 个 case 覆盖常规 /
 * oneWay / 搜索 / 分页 / status / 自定义 actions / 禁用 / footer / listStyle），
 * 再做「删壳改名、不改值」：去 `:where(.css-dev-only-do-not-override-X)` 作用域壳、
 * 去 css-var 声明块（那份由 `genTokenDecls` 自己产出）、`.ant-` → `.apollo-`、空白折成
 * **单空格**。
 *
 * ── 规则面（53 条）───────────────────────────────────────────────────────────
 *
 * 根（resetComponent + flex）/ `-disabled` 内的 `-section` 背景 / `-section`（列表面板
 * 的 border + width/height + `&-with-pagination`）/ `-list-search` 的搜索图标 /
 * `-list-header`（+ `-title` / `-dropdown` resetIcon 全套）/ `-list-body`（+
 * `-search-wrapper`）/ `-list-content`（+ `-item` 的 hover/checked/disabled/
 * `-remove` 按钮（operationUnit 展开）/ `-show-remove` 的 hover 清零）/ `-list-pagination`
 * （消费 `-options` 内边距）/ `-list-body-not-found` / `-list-footer` / `-list-checkbox` /
 * `-actions`（按钮图标字号）/ `-customize-list`（自定义列表面板：section 撑满 +
 * 内嵌 table/input 的钩子覆盖）/ `-status-error` / `-status-warning` / `-rtl`。
 *
 * ⚠️ 跨组件类名字面量：`.apollo-icon-search`（搜索图标）、`.apollo-pagination-options`
 *    （分页选项区）、`.apollo-btn` / `.apollo-icon`（操作按钮）、`.apollo-table-*` /
 *    `.apollo-input`（customize-list 钩子）—— 与 antd 的 `${antCls}-table` 同构，
 *    按「跨组件前缀随消费组件的默认前缀走」登记 style-prefix KNOWN_GAPS。
 *
 * ⚠️ 变量名 `--{p}-transfer-transfer-header-vertical-padding` 出现两次 `transfer`
 *    是 antd 的真实命名（token 名以 transfer 开头），照抄。
 */

import { toCssSize } from '../../_internal/to-css-size';
import { transferTokenValues } from './token';

/**
 * Token 声明块（**7 条**：6 个自有 + 1 个派生 `transfer-header-vertical-padding`）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const t = transferTokenValues();
  const n = `--${rootPrefixCls}-transfer`;

  return [
    `  ${n}-list-width:${t.listWidth};`,
    `  ${n}-list-height:${t.listHeight};`,
    `  ${n}-list-width-lg:${t.listWidthLG};`,
    `  ${n}-header-height:${t.headerHeight};`,
    `  ${n}-item-height:${t.itemHeight};`,
    `  ${n}-item-padding-block:${t.itemPaddingBlock};`,
    `  ${n}-transfer-header-vertical-padding:${t.transferHeaderVerticalPadding};`,
  ];
}

/** antd 产物机械转换段（53 条规则，原序）。 */
const RULES = `
.apollo-transfer{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}
.apollo-transfer::before,.apollo-transfer::after{box-sizing:border-box;}
.apollo-transfer [class^="apollo-transfer"],.apollo-transfer [class*=" apollo-transfer"]{box-sizing:border-box;}
.apollo-transfer [class^="apollo-transfer"]::before,.apollo-transfer [class*=" apollo-transfer"]::before,.apollo-transfer [class^="apollo-transfer"]::after,.apollo-transfer [class*=" apollo-transfer"]::after{box-sizing:border-box;}
.apollo-transfer{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:relative;display:flex;align-items:stretch;}
.apollo-transfer .apollo-transfer-disabled .apollo-transfer-section{background:var(--apollo-color-bg-container-disabled);}
.apollo-transfer .apollo-transfer-section{display:flex;flex-direction:column;width:var(--apollo-transfer-list-width);height:var(--apollo-transfer-list-height);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);border-radius:var(--apollo-border-radius-lg);}
.apollo-transfer .apollo-transfer-section-with-pagination{width:var(--apollo-transfer-list-width-lg);height:auto;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-search .apollo-icon-search{color:var(--apollo-color-text-disabled);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-header{display:flex;flex:none;align-items:center;height:var(--apollo-transfer-header-height);padding:calc(var(--apollo-transfer-transfer-header-vertical-padding) - var(--apollo-line-width)) var(--apollo-padding-sm) var(--apollo-transfer-transfer-header-vertical-padding);color:var(--apollo-color-text);background:var(--apollo-color-bg-container);border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);border-radius:var(--apollo-border-radius-lg) var(--apollo-border-radius-lg) 0 0;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-header >*:not(:last-child){margin-inline-end:4px;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-header >*{flex:none;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-header-title{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:0 1 auto;text-align:end;margin-inline-start:auto;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-header-dropdown{display:inline-flex;align-items:center;color:inherit;font-style:normal;line-height:0;text-align:center;text-transform:none;vertical-align:-0.125em;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-size:var(--apollo-font-size-icon);transform:translateY(10%);cursor:pointer;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-header-dropdown >*{line-height:1;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-header-dropdown svg{display:inline-block;vertical-align:inherit;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-header-dropdown[disabled]{cursor:not-allowed;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-body{display:flex;flex:auto;flex-direction:column;font-size:var(--apollo-font-size);min-height:0;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-body-search-wrapper{position:relative;flex:none;padding:var(--apollo-padding-sm);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content{flex:auto;margin:0;padding:0;overflow:auto;list-style:none;border-radius:0 0 calc(var(--apollo-border-radius-lg) - var(--apollo-line-width)) calc(var(--apollo-border-radius-lg) - var(--apollo-line-width));}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item{display:flex;align-items:center;min-height:var(--apollo-transfer-item-height);padding:var(--apollo-transfer-item-padding-block) var(--apollo-padding-sm);transition:all var(--apollo-motion-duration-slow);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item >*:not(:last-child){margin-inline-end:var(--apollo-margin-xs);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item >*{flex:none;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-text{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:auto;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-remove{color:var(--apollo-color-border);text-decoration:var(--apollo-link-decoration);outline:none;cursor:pointer;transition:all var(--apollo-motion-duration-slow);border:0;padding:0;background:none;user-select:none;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-remove:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-remove:hover{color:var(--apollo-color-link-hover);text-decoration:var(--apollo-link-hover-decoration);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-remove:focus{color:var(--apollo-color-link-hover);text-decoration:var(--apollo-link-focus-decoration);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-remove:active{color:var(--apollo-color-link-active);text-decoration:var(--apollo-link-hover-decoration);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-remove:hover,.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-remove:focus{color:var(--apollo-color-text-secondary);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-remove:disabled{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item:not(.apollo-transfer-list-content-item-disabled):hover{background-color:var(--apollo-control-item-bg-hover);cursor:pointer;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item:not(.apollo-transfer-list-content-item-disabled).apollo-transfer-list-content-item-checked:hover{background-color:var(--apollo-control-item-bg-active-hover);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-checked{background-color:var(--apollo-control-item-bg-active);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-item-disabled{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-content-show-remove .apollo-transfer-list-content-item:not(.apollo-transfer-list-content-item-disabled):hover{background:transparent;cursor:default;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-pagination{padding:var(--apollo-padding-xs);text-align:end;border-top:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-pagination .apollo-pagination-options{padding-inline-end:var(--apollo-padding-xs);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-body-not-found{flex:none;width:100%;margin:auto 0;color:var(--apollo-color-text-disabled);text-align:center;}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-footer{border-top:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
.apollo-transfer .apollo-transfer-section .apollo-transfer-list-checkbox{line-height:1;}
.apollo-transfer .apollo-transfer-actions{display:flex;flex:none;flex-direction:column;align-self:center;margin:0 var(--apollo-margin-xs);vertical-align:middle;gap:var(--apollo-margin-xxs);}
.apollo-transfer .apollo-transfer-actions .apollo-btn .apollo-icon{font-size:var(--apollo-font-size-icon);}
.apollo-transfer-customize-list .apollo-transfer-section{flex:1 1 50%;width:auto;height:auto;min-height:var(--apollo-transfer-list-height);min-width:0;}
.apollo-transfer-customize-list .apollo-table-wrapper .apollo-table-small{border:0;border-radius:0;}
.apollo-transfer-customize-list .apollo-table-wrapper .apollo-table-small .apollo-table-selection-column{width:var(--apollo-control-height-lg);min-width:var(--apollo-control-height-lg);}
.apollo-transfer-customize-list .apollo-table-wrapper .apollo-table-pagination.apollo-table-pagination{margin:0;padding:var(--apollo-padding-xs);}
.apollo-transfer-customize-list .apollo-input[disabled]{background-color:transparent;}
.apollo-transfer-status-error .apollo-transfer-section{border-color:var(--apollo-color-error);}
.apollo-transfer-status-error .apollo-transfer-section .apollo-transfer-list-search:not([disabled]){border-color:var(--apollo-color-border);}
.apollo-transfer-status-warning .apollo-transfer-section{border-color:var(--apollo-color-warning);}
.apollo-transfer-status-warning .apollo-transfer-section .apollo-transfer-list-search:not([disabled]){border-color:var(--apollo-color-border);}
.apollo-transfer-rtl{direction:rtl;}
`;

/**
 * 样式入口：token 声明块（**挂在根选择器里**）+ 规则体。
 *
 * 🚨 声明块必须包在选择器里 —— 裸声明是无效 CSS，会让紧随其后的规则一起被丢弃
 *    （form 收口时踩过）。
 * 🚨 规则体按目标前缀改名（select 同款 `rename`）：`prefixCls` 为 `ant` 时，
 *    transfer 自身的类名/变量名整体换成 `.ant-transfer` / `--ant-transfer-*`，
 *    跨组件引用（`.apollo-table-*` 等全局/消费侧命名）保持不动。
 */
export function genTransferStyle(rootPrefixCls: string): string {
  const d = genTokenDecls(rootPrefixCls).join('');
  const self = `${rootPrefixCls}-transfer`;
  const rename = (cssText: string): string =>
    rootPrefixCls === 'apollo'
      ? cssText
      : cssText
          .split('.apollo-transfer')
          .join(`.${self}`)
          .split('--apollo-transfer-')
          .join(`--${rootPrefixCls}-transfer-`);
  return `.${self}{${d}}\n\n${rename(RULES)}`;
}

/** 供调试脚本/测试复用：把数值常量转成 CSS 尺寸（避免各处重复实现）。 */
export const toTransferCssSize = toCssSize;
