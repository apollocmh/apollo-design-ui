/**
 * Tree 的静态样式（G4-4 产物）。
 *
 * 契约来源：antd 6.6.4 es/tree/style（SSR extractStyle 产物逐条机械转换，
 * 提取脚本 tests/visual/debug/extract-tree-css.mjs；100 条规则，原序）。
 *
 * 与 antd 产物的转换规则（与 tour/style 同判）：
 *   1. 去掉 :where(.css-dev-only-…) hash 前缀（静态移植无 hashId）。
 *   2. .ant-* → .apollo-*；--ant-* → --apollo-*。
 *   3. 组件变量声明块：antd 挂在 .css-var-*.ant-tree 上（死选择器）；本仓按
 *      tooltip D69 同判，落在唯一的根形态 .{prefix}-tree 上。
 *   4. `.apollo-tree-checkbox-group >.apollo-row` 是上游 checkbox 旧版重置的
 *      遗留选择器，逐字保留（Grid Row 的前缀一并替换）。
 *   5. `.apollo-motion-collapse(-legacy)(-active)` 是展开动效类（initCollapseMotion），
 *      与 motion-collapse 组件共享命名；tree 的 NodeList motion 依赖它。
 *   6. `switcher-leaf-line` 的 border 与 `-op-icon` svg 尺寸是产物字面量，E10 豁免。
 */

import { getDesignToken } from '@apollo-design/theme';
import { type ComponentToken, prepareComponentToken } from './token';

/** 组件变量值（G3 产物对拍：24px ×3、rgba(0,0,0,0.04)、#e6f4ff、#fff、#1677ff）。 */
function treeTokenValues(): ComponentToken {
  return prepareComponentToken(getDesignToken() as never);
}

/** 组件变量声明（对拍 antd 的 .css-var-*.ant-tree 块；单位规则：3 个尺寸 px）。 */
export function genTreeTokenDecls(): string {
  const t = treeTokenValues();
  return (
    `--apollo-tree-title-height:${t.titleHeight}px;` +
    `--apollo-tree-switcher-size:${t.switcherSize}px;` +
    `--apollo-tree-indent-size:${t.indentSize}px;` +
    `--apollo-tree-node-hover-bg:${t.nodeHoverBg};` +
    `--apollo-tree-node-hover-color:${t.nodeHoverColor};` +
    `--apollo-tree-node-selected-bg:${t.nodeSelectedBg};` +
    `--apollo-tree-node-selected-color:${t.nodeSelectedColor};` +
    `--apollo-tree-directory-node-selected-color:${t.directoryNodeSelectedColor};` +
    `--apollo-tree-directory-node-selected-bg:${t.directoryNodeSelectedBg};`
  );
}

/** antd 产物机械转换段（100 条，原序）。 */
const RULES = `
.apollo-tree{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}
.apollo-tree::before,.apollo-tree::after{box-sizing:border-box;}
.apollo-tree [class^="apollo-tree"],.apollo-tree [class*=" apollo-tree"]{box-sizing:border-box;}
.apollo-tree [class^="apollo-tree"]::before,.apollo-tree [class*=" apollo-tree"]::before,.apollo-tree [class^="apollo-tree"]::after,.apollo-tree [class*=" apollo-tree"]::after{box-sizing:border-box;}
.apollo-tree .apollo-tree-checkbox-group{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);display:inline-flex;flex-wrap:wrap;column-gap:var(--apollo-margin-xs);}
.apollo-tree .apollo-tree-checkbox-group >.apollo-row{flex:1;}
.apollo-tree .apollo-tree-checkbox-wrapper{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);display:inline-flex;align-items:baseline;cursor:pointer;}
.apollo-tree .apollo-tree-checkbox-wrapper:after{display:inline-block;width:0;overflow:hidden;content:'a0';}
.apollo-tree .apollo-tree-checkbox-wrapper+.apollo-tree-checkbox-wrapper{margin-inline-start:0;}
.apollo-tree .apollo-tree-checkbox{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:1;list-style:none;font-family:var(--apollo-font-family);position:relative;white-space:nowrap;cursor:pointer;align-self:center;display:block;width:var(--apollo-control-interactive-size);height:var(--apollo-control-interactive-size);direction:ltr;background-color:var(--apollo-color-bg-container);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);border-radius:var(--apollo-border-radius-sm);border-collapse:separate;transition:all var(--apollo-motion-duration-slow);flex:none;}
.apollo-tree .apollo-tree-checkbox,.apollo-tree .apollo-tree-checkbox::before,.apollo-tree .apollo-tree-checkbox::after{transition:none;animation:none;}
.apollo-tree .apollo-tree-checkbox:after{box-sizing:border-box;position:absolute;top:calc(var(--apollo-control-interactive-size) / 2 - var(--apollo-line-width));inset-inline-start:calc(var(--apollo-control-interactive-size) / 4 - var(--apollo-line-width));display:table;width:calc(var(--apollo-control-interactive-size) / 14 * 5);height:calc(var(--apollo-control-interactive-size) / 14 * 8);border:var(--apollo-line-width-bold) solid var(--apollo-color-white);border-top:0;border-inline-start:0;transform:rotate(45deg) scale(0) translate(-50%,-50%);opacity:0;content:"";transition:all var(--apollo-motion-duration-fast) var(--apollo-motion-ease-in-back),opacity var(--apollo-motion-duration-fast);}
.apollo-tree .apollo-tree-checkbox:after{transition:none;animation:none;}
.apollo-tree .apollo-tree-checkbox .apollo-tree-checkbox-input{position:absolute;inset:calc(-1 * (var(--apollo-line-width)));z-index:1;cursor:pointer;opacity:0;margin:0;}
.apollo-tree .apollo-tree-checkbox:has(.apollo-tree-checkbox-input:focus-visible){outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-tree .apollo-tree-checkbox+span{padding-inline-start:var(--apollo-padding-xs);padding-inline-end:var(--apollo-padding-xs);}
.apollo-tree .apollo-tree-checkbox-wrapper:not(.apollo-tree-checkbox-wrapper-disabled):hover .apollo-tree-checkbox,.apollo-tree .apollo-tree-checkbox:not(.apollo-tree-checkbox-disabled):hover .apollo-tree-checkbox{border-color:var(--apollo-color-primary);}
.apollo-tree .apollo-tree-checkbox-wrapper:not(.apollo-tree-checkbox-wrapper-disabled):hover .apollo-tree-checkbox-checked:not(.apollo-tree-checkbox-disabled){background-color:var(--apollo-color-primary-hover);border-color:transparent;}
.apollo-tree .apollo-tree-checkbox-checked{background-color:var(--apollo-color-primary);border-color:var(--apollo-color-primary);}
.apollo-tree .apollo-tree-checkbox-checked:after{opacity:1;transform:rotate(45deg) scale(1) translate(-50%,-50%);transition:all var(--apollo-motion-duration-mid) var(--apollo-motion-ease-out-back) var(--apollo-motion-duration-fast);}
.apollo-tree .apollo-tree-checkbox-checked:after{transition:none;animation:none;}
.apollo-tree .apollo-tree-checkbox-checked:not(.apollo-tree-checkbox-disabled):hover{background-color:var(--apollo-color-primary-hover);border-color:transparent;}
.apollo-tree .apollo-tree-checkbox-indeterminate{background-color:var(--apollo-color-bg-container);border-color:var(--apollo-color-border);}
.apollo-tree .apollo-tree-checkbox-indeterminate:after{top:50%;inset-inline-start:50%;width:calc(var(--apollo-font-size-lg) / 2);height:calc(var(--apollo-font-size-lg) / 2);background-color:var(--apollo-color-primary);border:0;transform:translate(-50%, -50%) scale(1);opacity:1;content:"";}
.apollo-tree .apollo-tree-checkbox-indeterminate:not(.apollo-tree-checkbox-disabled):hover{background-color:var(--apollo-color-bg-container);border-color:var(--apollo-color-primary);}
.apollo-tree .apollo-tree-checkbox-wrapper-disabled{cursor:not-allowed;}
.apollo-tree .apollo-tree-checkbox-disabled{background:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border);}
.apollo-tree .apollo-tree-checkbox-disabled,.apollo-tree .apollo-tree-checkbox-disabled .apollo-tree-checkbox-input{cursor:not-allowed;pointer-events:none;}
.apollo-tree .apollo-tree-checkbox-disabled:after{border-color:var(--apollo-color-text-disabled);}
.apollo-tree .apollo-tree-checkbox-disabled+span{color:var(--apollo-color-text-disabled);}
.apollo-tree .apollo-tree-checkbox-disabled.apollo-tree-checkbox-indeterminate::after{background:var(--apollo-color-text-disabled);}
.apollo-tree{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);--rc-virtual-list-scrollbar-bg:var(--apollo-color-split);background:var(--apollo-color-bg-container);border-radius:var(--apollo-border-radius);transition:background-color var(--apollo-motion-duration-slow);}
.apollo-tree-rtl{direction:rtl;}
.apollo-tree.apollo-tree-rtl .apollo-tree-switcher_close .apollo-tree-switcher-icon svg{transform:rotate(90deg);}
.apollo-tree .apollo-tree-list:focus-visible{outline:none;}
.apollo-tree .apollo-tree-list:focus-visible .apollo-tree-treenode-active .apollo-tree-node-content-wrapper{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
.apollo-tree .apollo-tree-list-scrollbar{cursor:pointer;}
.apollo-tree .apollo-tree-list-scrollbar:hover{background-color:var(--apollo-color-fill-quaternary);}
.apollo-tree .apollo-tree-list-holder-inner{align-items:flex-start;}
.apollo-tree.apollo-tree-block-node .apollo-tree-list-holder-inner{align-items:stretch;}
.apollo-tree.apollo-tree-block-node .apollo-tree-list-holder-inner .apollo-tree-node-content-wrapper{flex:auto;}
.apollo-tree.apollo-tree-block-node .apollo-tree-list-holder-inner .apollo-tree-treenode.dragging:after{position:absolute;inset:0;border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-primary);opacity:0;animation-name:css-dev-only-do-not-override-19u5a7b-apollo-tree-node-fx-do-not-use;animation-duration:var(--apollo-motion-duration-slow);animation-play-state:running;animation-fill-mode:forwards;content:"";pointer-events:none;border-radius:var(--apollo-border-radius);}
.apollo-tree .apollo-tree-treenode{display:flex;align-items:flex-start;margin-bottom:calc(var(--apollo-padding-xs) / 2);line-height:var(--apollo-tree-title-height);position:relative;}
.apollo-tree .apollo-tree-treenode:before{content:"";position:absolute;z-index:1;inset-inline-start:0;width:100%;top:100%;height:calc(var(--apollo-padding-xs) / 2);}
.apollo-tree .apollo-tree-treenode-disabled .apollo-tree-node-content-wrapper{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
.apollo-tree .apollo-tree-treenode-disabled .apollo-tree-node-content-wrapper:hover{background:transparent;}
.apollo-tree .apollo-tree-treenode .apollo-tree-checkbox-disabled+.apollo-tree-node-selected,.apollo-tree .apollo-tree-treenode.apollo-tree-treenode-disabled.apollo-tree-treenode-selected .apollo-tree-node-content-wrapper{background-color:var(--apollo-control-item-bg-active-disabled);}
.apollo-tree .apollo-tree-treenode .apollo-tree-checkbox-disabled{pointer-events:unset;}
.apollo-tree .apollo-tree-treenode:not(.apollo-tree-treenode-disabled) .apollo-tree-node-content-wrapper:hover{color:var(--apollo-tree-node-hover-color);}
.apollo-tree .apollo-tree-treenode-active .apollo-tree-node-content-wrapper{background:var(--apollo-control-item-bg-hover);}
.apollo-tree .apollo-tree-treenode:not(.apollo-tree-treenode-disabled).filter-node .apollo-tree-title{color:var(--apollo-color-primary);font-weight:var(--apollo-font-weight-strong);}
.apollo-tree .apollo-tree-treenode-draggable{cursor:grab;}
.apollo-tree .apollo-tree-treenode-draggable .apollo-tree-draggable-icon{flex-shrink:0;width:var(--apollo-tree-switcher-size);text-align:center;visibility:visible;color:var(--apollo-color-text-quaternary);}
.apollo-tree .apollo-tree-treenode-draggable.apollo-tree-treenode-disabled .apollo-tree-draggable-icon{visibility:hidden;}
.apollo-tree .apollo-tree-indent{align-self:stretch;white-space:nowrap;user-select:none;}
.apollo-tree .apollo-tree-indent-unit{display:inline-block;width:var(--apollo-tree-indent-size);}
.apollo-tree .apollo-tree-draggable-icon{visibility:hidden;}
.apollo-tree .apollo-tree-switcher,.apollo-tree .apollo-tree-checkbox{margin-inline-end:calc((var(--apollo-tree-switcher-size) - var(--apollo-control-interactive-size)) / 2);}
.apollo-tree .apollo-tree-checkbox{flex-shrink:0;align-self:flex-start;margin-block-start:calc((var(--apollo-tree-title-height) - var(--apollo-control-interactive-size)) / 2);}
.apollo-tree .apollo-tree-switcher{position:relative;flex:none;align-self:stretch;width:var(--apollo-tree-switcher-size);text-align:center;cursor:pointer;user-select:none;transition:all var(--apollo-motion-duration-slow);}
.apollo-tree .apollo-tree-switcher .apollo-tree-switcher-icon{display:inline-block;font-size:10px;vertical-align:baseline;}
.apollo-tree .apollo-tree-switcher .apollo-tree-switcher-icon svg{transition:transform var(--apollo-motion-duration-slow);}
.apollo-tree .apollo-tree-switcher-noop{cursor:unset;}
.apollo-tree .apollo-tree-switcher:before{pointer-events:none;content:"";width:var(--apollo-tree-switcher-size);height:var(--apollo-tree-title-height);position:absolute;left:0;top:0;border-radius:var(--apollo-border-radius);transition:all var(--apollo-motion-duration-slow);}
.apollo-tree .apollo-tree-switcher:not(.apollo-tree-switcher-noop):hover:before{background-color:var(--apollo-color-bg-text-hover);}
.apollo-tree .apollo-tree-switcher_close .apollo-tree-switcher-icon svg{transform:rotate(-90deg);}
.apollo-tree .apollo-tree-switcher-loading-icon{color:var(--apollo-color-primary);}
.apollo-tree .apollo-tree-switcher-leaf-line{position:relative;z-index:1;display:inline-block;width:100%;height:100%;}
.apollo-tree .apollo-tree-switcher-leaf-line:before{position:absolute;top:0;inset-inline-end:calc(var(--apollo-tree-switcher-size) / 2);bottom:calc(calc(var(--apollo-padding-xs) / 2) * -1);margin-inline-start:calc(var(--apollo-line-width) * -1);border-inline-end:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);content:"";}
.apollo-tree .apollo-tree-switcher-leaf-line:after{position:absolute;width:calc(calc(var(--apollo-tree-switcher-size) / 2) * 0.8);height:calc(var(--apollo-tree-title-height) / 2);border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);content:"";}
.apollo-tree .apollo-tree-node-content-wrapper{position:relative;min-height:var(--apollo-tree-title-height);padding-block:0;padding-inline:var(--apollo-padding-xs);background:transparent;border-radius:var(--apollo-border-radius);cursor:pointer;transition:all var(--apollo-motion-duration-mid),border 0s,line-height 0s,box-shadow 0s;}
.apollo-tree .apollo-tree-node-content-wrapper .apollo-tree-drop-indicator{position:absolute;z-index:1;height:2px;background-color:var(--apollo-color-primary);border-radius:1px;pointer-events:none;}
.apollo-tree .apollo-tree-node-content-wrapper .apollo-tree-drop-indicator:after{position:absolute;top:-3px;inset-inline-start:-6px;width:8px;height:8px;background-color:transparent;border:var(--apollo-line-width-bold) solid var(--apollo-color-primary);border-radius:50%;content:"";}
.apollo-tree .apollo-tree-node-content-wrapper:hover{background-color:var(--apollo-tree-node-hover-bg);}
.apollo-tree .apollo-tree-node-content-wrapper.apollo-tree-node-selected{color:var(--apollo-tree-node-selected-color);background-color:var(--apollo-tree-node-selected-bg);}
.apollo-tree .apollo-tree-node-content-wrapper .apollo-tree-iconEle{display:inline-block;width:var(--apollo-tree-switcher-size);height:var(--apollo-tree-title-height);text-align:center;vertical-align:top;}
.apollo-tree .apollo-tree-node-content-wrapper .apollo-tree-iconEle:empty{display:none;}
.apollo-tree .apollo-tree-unselectable .apollo-tree-node-content-wrapper:hover{background-color:transparent;}
.apollo-tree .apollo-tree-treenode.drop-container>[draggable]{box-shadow:0 0 0 2px var(--apollo-color-primary);}
.apollo-tree-show-line .apollo-tree-indent-unit{position:relative;height:100%;}
.apollo-tree-show-line .apollo-tree-indent-unit:before{position:absolute;top:0;inset-inline-end:calc(var(--apollo-tree-switcher-size) / 2);bottom:calc(calc(var(--apollo-padding-xs) / 2) * -1);border-inline-end:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);content:"";}
.apollo-tree-show-line .apollo-tree-indent-unit-end:before{display:none;}
.apollo-tree-show-line .apollo-tree-switcher{background:transparent;}
.apollo-tree-show-line .apollo-tree-switcher-line-icon{vertical-align:-0.15em;}
.apollo-tree .apollo-tree-treenode-leaf-last .apollo-tree-switcher-leaf-line:before{top:auto!important;bottom:auto!important;height:calc(var(--apollo-tree-title-height) / 2)!important;}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode .apollo-tree-node-content-wrapper{position:static;}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode .apollo-tree-node-content-wrapper:has(.apollo-tree-drop-indicator){position:relative;}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode .apollo-tree-node-content-wrapper >*:not(.apollo-tree-drop-indicator){position:relative;}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode .apollo-tree-node-content-wrapper:hover{background:transparent;}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode .apollo-tree-node-content-wrapper:before{position:absolute;inset:0;transition:background-color var(--apollo-motion-duration-mid);content:"";border-radius:var(--apollo-border-radius);}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode .apollo-tree-node-content-wrapper:hover:before{background:var(--apollo-control-item-bg-hover);}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode .apollo-tree-switcher,.apollo-tree.apollo-tree-directory .apollo-tree-treenode .apollo-tree-checkbox,.apollo-tree.apollo-tree-directory .apollo-tree-treenode .apollo-tree-draggable-icon{z-index:1;}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode-selected{background:var(--apollo-tree-directory-node-selected-bg);border-radius:var(--apollo-border-radius);}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode-selected .apollo-tree-switcher,.apollo-tree.apollo-tree-directory .apollo-tree-treenode-selected .apollo-tree-draggable-icon{color:var(--apollo-tree-directory-node-selected-color);}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode-selected .apollo-tree-node-content-wrapper{color:var(--apollo-tree-directory-node-selected-color);background:transparent;}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode-selected .apollo-tree-node-content-wrapper,.apollo-tree.apollo-tree-directory .apollo-tree-treenode-selected .apollo-tree-node-content-wrapper:hover{color:var(--apollo-tree-directory-node-selected-color);}
.apollo-tree.apollo-tree-directory .apollo-tree-treenode-selected .apollo-tree-node-content-wrapper:before,.apollo-tree.apollo-tree-directory .apollo-tree-treenode-selected .apollo-tree-node-content-wrapper:hover:before{background:var(--apollo-tree-directory-node-selected-bg);}
.apollo-tree .apollo-motion-collapse-legacy{overflow:hidden;}
.apollo-tree .apollo-motion-collapse-legacy-active{transition:height var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out)!important;}
.apollo-tree .apollo-motion-collapse{overflow:hidden;transition:height var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out),opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out)!important;}
`;

/**
 * 生成 Tree 全量静态 CSS（组件变量声明块 + 组件规则）。
 * 自定义前缀走 popover/tour 同款字符串替换（R9：只预生成 apollo / ant 两份）。
 */
export function genTreeStyle(prefixCls: string = 'apollo'): string {
  if (prefixCls === 'apollo') {
    return `.${prefixCls}-tree{${genTreeTokenDecls()}}
${RULES}`;
  }
  const rules = RULES.split('.apollo-tree')
    .join(`.${prefixCls}-tree`)
    .split('.apollo-motion-collapse')
    .join(`.${prefixCls}-motion-collapse`)
    .split('.apollo-row')
    .join(`.${prefixCls}-row`);
  return `.${prefixCls}-tree{${genTreeTokenDecls()}}
${rules}`;
}
