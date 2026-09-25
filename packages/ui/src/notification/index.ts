/**
 * Notification 的公共导出。
 *
 * 与 antd 的 es/notification/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import NotificationComponent from './Notification.vue';

/** Notification 组件。注册名 `ANotification`（COMPONENT-RULES.md 规则 R2）。 */
export const Notification = withInstall(NotificationComponent);

export default Notification;

// TODO(G2): export type { NotificationProps, NotificationRef, ... } from './interface';
// TODO(G4): export { genNotificationStyle } from './style';
// TODO(G4): export type { ComponentToken as NotificationComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareNotificationComponentToken } from './style/token';
