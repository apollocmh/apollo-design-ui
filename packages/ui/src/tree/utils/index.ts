/**
 * Tree 的纯函数工具层（rc-tree `utils/*` + `util.js` 的移植总出口）。
 *
 * 全部为**纯函数**（可独立 L1 直测，不依赖 Vue 运行时）：
 *   - `treeUtil`：数据结构（entities / flatten / 节点态投影）
 *   - `conductUtil`：勾选级联（fill / clean 两段式）
 *   - `util`：遗留工具（arrAdd/arrDel、calcDropPosition、parseCheckedKeys、conductExpandParent）
 *   - `diffUtil`：展开 motion diff
 *
 * 不移植：`convertTreeToData` / `convertDataToTree`（`<TreeNode>` children 形态，
 * v6 deprecated —— docs/analysis/tree.md §6）。
 */

export * from './conductUtil';
export * from './diffUtil';
export * from './treeUtil';
export * from './util';
