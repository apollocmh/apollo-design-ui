/**
 * Pagination 的公共导出。
 *
 * 与 antd 的 es/pagination/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import PaginationComponent from './Pagination.vue';

/** Pagination 组件。注册名 `APagination`（COMPONENT-RULES.md 规则 R2）。 */
export const Pagination = withInstall(PaginationComponent);

export default Pagination;

// TODO(G2): export type { PaginationProps, PaginationRef, ... } from './interface';
// TODO(G4): export { genPaginationStyle } from './style';
// TODO(G4): export type { ComponentToken as PaginationComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as preparePaginationComponentToken } from './style/token';
