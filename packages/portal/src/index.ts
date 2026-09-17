/**
 * @apollo-design/portal
 *
 * 基于 Vue Teleport 的挂载与层级管理。替代 `@rc-component/portal@2.1.0`
 * 及 rc-dialog 的挂载部分，外加 antd `_util/hooks/useZIndex.ts` 的层级计算。
 *
 * 契约文档：`docs/foundation/portal-contract.md`
 *
 * 分层约束（ARCHITECTURE.md §3.1）：L1，只依赖 L0 的 `utils`。
 * 因此**不依赖 `theme`** —— `zIndexPopupBase` 由调用方传入。
 *
 * ❌ 不做：浮层定位（position）、焦点陷阱（a11y）、触发时机与显隐延迟（overlay）、
 *    滚动锁定与 Esc（按 Modal 的 rationale 属 ui 交互语义）。
 */

// ---------------------------------------------------------------------------
// 纯数据侧（可穷举测试）
// ---------------------------------------------------------------------------

export type {
  AppendFn,
  ComputeZIndexInput,
  ContainerLike,
  GetContainer,
  ResolvedContainer,
  ZIndexComponentType,
  ZIndexConsumer,
  ZIndexContainer,
} from './container';
export {
  CONTAINER_MAX_OFFSET,
  CONTAINER_MAX_OFFSET_WITH_CHILDREN,
  CONTAINER_OFFSET,
  CONTAINER_OFFSET_MAX_COUNT,
  computeZIndex,
  consumerBaseZIndexOffset,
  containerBaseZIndexOffset,
  DEFAULT_Z_INDEX_POPUP_BASE,
  enqueueAppend,
  flushAppendQueue,
  isContainerType,
  resolveContainer,
  shouldWarnZIndex,
} from './container';

// ---------------------------------------------------------------------------
// 测试用全局开关
// ---------------------------------------------------------------------------

export { portalInlineMock, resetPortalInlineMock } from './mock';

// ---------------------------------------------------------------------------
// Vue 层
// ---------------------------------------------------------------------------

export { Portal } from './portal';
export type {
  PortalContainerRef,
  UsePortalContainerOptions,
  UsePortalContainerReturn,
  UseZIndexOptions,
} from './use-portal';
export {
  PORTAL_ORDER_KEY,
  usePortalContainer,
  usePortalOrder,
  useZIndex,
  ZINDEX_KEY,
} from './use-portal';
