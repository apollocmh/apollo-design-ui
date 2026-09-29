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

export type {
  PaginationAlign,
  PaginationConfig,
  PaginationEmits,
  PaginationItemRender,
  PaginationItemType,
  PaginationLocale,
  PaginationPosition,
  PaginationProps,
  PaginationRange,
  PaginationSemanticAllType,
  PaginationSemanticClassNames,
  PaginationSemanticStyles,
  PaginationSemanticValue,
  PaginationShowTotal,
  PaginationSimple,
  PaginationSizeChangerInfo,
  PaginationSlots,
} from './interface';
export { genPaginationStyle, genTokenDecls as genPaginationTokenDecls } from './style';
export type { ComponentToken as PaginationComponentToken } from './style/token';
export { prepareComponentToken as preparePaginationComponentToken } from './style/token';
