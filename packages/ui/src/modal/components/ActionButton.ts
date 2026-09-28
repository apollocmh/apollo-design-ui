/**
 * 垫片：`ActionButton` 已于 2026-09-28 提升到 `_internal/action-button.ts`
 * （第二个消费者是 `Popconfirm`，避免 popconfirm → modal 的横向依赖）。
 * 本文件保留导入路径，modal 的三个 import 点不动。
 */

export { convertLegacyProps, default } from '../../_internal/action-button';
export type { ActionButtonProps, LegacyButtonType } from '../../_internal/action-button';
