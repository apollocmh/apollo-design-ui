/**
 * 组件分组固定顺序 —— config.mts（侧边栏）与 gen-component-pages.mjs（总览页）
 * 的共享真源，两处不得漂移。未知分组兜底到最后。
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
