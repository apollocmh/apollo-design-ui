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
 * ❌ 不做：浮层定位（position）、焦点陷阱（a11y）、触发时机与显隐延迟（overlay）。
 *
 * ⚠️ **边界修订（2026-09-26，drawer 落地时）**：原文写「滚动锁定与 Esc 属 ui 交互语义」，
 *    实测这条与上游不符 —— `@rc-component/portal` 自己就带 `useScrollLocker` / `useEscKeyDown`，
 *    且 rc-drawer / rc-dialog 都是**从 portal 拿**的（不是各自实现）。
 *    ⇒ 改判：两者留在 portal（容器与「谁是顶层」只有 portal 知道），本包导出
 *    `useScrollLocker` / `useEscKeyDown` 与 Portal 的 `autoLock` / `onEsc` 两个 prop。
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
export type { EscInfo } from './use-esc-key-down';
export { escKeyDownTest, useEscKeyDown } from './use-esc-key-down';
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
export { useScrollLocker } from './use-scroll-locker';
