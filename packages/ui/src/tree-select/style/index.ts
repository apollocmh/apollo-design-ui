/**
 * TreeSelect 样式（antd `es/tree-select/style/index.js` 62 行的 Vue 等价物）。
 *
 * 结构（与组件的**单前缀直通**约定一致：customize 模式下 antd 的三个前缀
 * select / select-tree / tree-select 合一 ⇒ 本仓 shell 与树都用
 * `${rootPrefixCls}-tree-select`）：
 * 1. **外壳**：select 全套规则按目标前缀重生成（`genSelectStyle('apollo', p)`）——
 *    Cascader 同判；🚨 不能传 `('apollo', 'apollo')`，会命中同一性短路拿到一份
 *    `.apollo-select-*`（目标前缀零规则）。
 * 2. **树**：`genTreeStyle(p)` 同前缀（antd `genTreeStyle(treePrefixCls)`）。
 * 3. **dropdown**：`padding: paddingXS paddingXS/2`；内嵌树 `borderRadius: 0`、
 *    node-content-wrapper `flex: auto`；RTL close-switcher rotate(90deg)。
 * 4. **0 自有 Component Token**：antd `prepareComponentToken = initComponentToken`
 *    （tree 的 9 个）。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { genSelectStyle } from '../../select/style';
import { genTreeStyle } from '../../tree/style';

const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** dropdown 块（antd genBaseStyle 逐字语义，前缀随根）。 */
function genDropdownStyle(p: string): string {
  const tree = `.${p}`;
  // ⚠️ antd 的树压平规则**嵌套在 `-dropdown` 作用域下**（genBaseStyle 的
  //    [`${componentCls}-dropdown`] 数组项）—— 写成顶层会命中**触发器根**，
  //    把圆角清零（视觉 diff 四角红点实测根因）。
  const scoped = `.${p}-dropdown`;
  return [
    `${scoped}{padding:${v('paddingXS')} calc(${v('paddingXS')} / 2);}`,
    // 内嵌树形态压平（antd 逐字：[treeCls] { borderRadius: 0 }，作用域内）
    `${scoped} ${tree}{border-radius:0;}`,
    // antd：list-holder-inner 内 node-content-wrapper flex:auto
    `${scoped} ${tree}-list-holder-inner ${tree}-treenode ${tree}-node-content-wrapper{flex:auto;}`,
    // RTL：close 状态 switcher 图标旋转（antd 逐字）
    `${scoped}-rtl{direction:rtl;}`,
    `${scoped}-rtl ${tree}-switcher${tree}-switcher_close ${tree}-switcher-icon svg{transform:rotate(90deg);}`,
  ].join('\n');
}

export function genTreeSelectStyle(rootPrefixCls: string): string {
  const p = `${rootPrefixCls}-tree-select`;
  // 树全套：以默认前缀产物为基准整体替换。⚠️ 不能直接 genTreeStyle(p) —— 它的
  // 非 'apollo' 分支生成 `.${p}-tree`（多一段），而 Tree 根类 = prefixCls 本身
  // （Tree.ts rootClass = prefixCls.value），会声明/选择器双双落空。
  const tree =
    p === 'apollo-tree'
      ? genTreeStyle('apollo')
      : genTreeStyle('apollo').split('.apollo-tree').join(`.${p}`);
  // 外壳全套（select 规则按目标前缀重生成 —— Cascader 同判）。
  // ⚠️ 必须拼在**树规则之后**：tree 的 reset（`.${p}{padding:0}`）与 shell 的根块
  //    （padding-block/inline）同特异性，shell 在后才能保住选择器的 padding ——
  //    顺序反了触发器塌成内容高度（视觉 size-mismatch 96 vs 88 实测根因）。
  const shell = genSelectStyle('apollo', p);
  return `${tree}\n${shell}\n${genDropdownStyle(p)}`;
}
