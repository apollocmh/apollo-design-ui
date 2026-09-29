/**
 * Pagination 的 Component Token（G3 产物落点）。
 *
 * 契约来源：antd 6.6.4 的 es/pagination/style/index.js 的 ComponentToken 接口与
 * prepareComponentToken。registry 数据：该组件 token 数 = 12。
 *
 * 规则（divider 的 token.ts 是范本）：
 *   - 名称、数量、默认值计算方式与 antd 逐条对齐（规则 R7）
 *   - 别名派生的 token 落 var(--apollo-*)（B7 可校验、随主题自适应）
 *   - 字面量 token 以常量为唯一真源，由 style/index.ts 内联消费
 */
// TODO(G3): 逐条对齐后替换本占位（tokenCount 为 0 时，写明「该组件无 Component Token」并删除本行）
export type ComponentToken = Record<string, never>;

// TODO(G3): export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({ ... });
