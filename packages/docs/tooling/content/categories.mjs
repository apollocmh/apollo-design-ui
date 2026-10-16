/**
 * 组件分组固定顺序 —— 内容管线（侧边栏 / 总览 / manifest）的唯一真源。
 *
 * 与 antd 官网的分类顺序保持一致；未知分组按名称兜底排到最后。
 *
 * ⚠️ 原在 `packages/docs/scripts/categories.mjs`（VitePress 时代的 config.mts 与
 * gen-component-pages.mjs 共享）。VitePress 拆除后随 Vite 站点迁入 tooling/content，
 * 避免文档站为两个入口维护两份顺序。
 */
export const CATEGORY_ORDER = ['通用', '布局', '导航', '数据录入', '数据展示', '反馈', '其他'];

export function categoryRank(cat) {
  const i = CATEGORY_ORDER.indexOf(cat);
  return i === -1 ? CATEGORY_ORDER.length : i;
}

/** 分组排序比较器：按固定序，未知分组按名称排在最后。 */
export function compareCategories(a, b) {
  return categoryRank(a) - categoryRank(b) || a.localeCompare(b);
}
