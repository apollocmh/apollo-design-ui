/**
 * `@rc-component/table@1.11.1` 的 `es/constant.js`（1 行）。
 *
 * `EXPAND_COLUMN` 是「展开图标列」的**位置哨兵**：用户把它放进 `columns` 数组
 * 来指定展开图标落在哪一列（默认插在 index 0）。`useColumns` 里按**引用相等**比较，
 * 所以它必须是**模块级单例** —— 不能每次新建 `{}`。
 */

/** 展开列的哨兵（引用相等判据）。 */
export const EXPAND_COLUMN = {};

/** 内部 hook 通道的名字（antd 用它给 rc-table 注入 transformColumns）。 */
export const INTERNAL_HOOKS = 'rc-table-internal-hook';
