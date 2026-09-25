/**
 * 通知内核的出口 —— `@rc-component/notification` 的 Vue 等价物（内部层）。
 *
 * ⚠️ 这是 **ui 包内部**的模块，不进 `packages/ui/src/index.ts` 的公共 barrel：
 * 对外只暴露 antd 有的东西（`message` / `notification` 自己的导出）。
 */
export type {
  ComponentsType,
  NoticeClassNames,
  NoticeListConfig,
  NoticeListProps,
  NoticeProps,
  NoticeStyles,
  NotificationAPI,
  NotificationClassNames,
  NotificationConfig,
  NotificationProgressProps,
  NotificationStyles,
  NotificationsProps,
  Placement,
  StackConfig,
} from './interface';
export { useClosable } from './hooks/useClosable';
export { useListPosition } from './hooks/useListPosition';
export { useNoticeTimer } from './hooks/useNoticeTimer';
export { useSizes } from './hooks/useSizes';
export { useStack } from './hooks/useStack';
export { default as Notice } from './Notice';
export { default as NoticeList } from './NoticeList';
export { default as NoticeListContent } from './NoticeListContent';
export {
  default as NotificationProvider,
  notificationContextKey,
  useNotificationContext,
} from './NotificationProvider';
export { default as Notifications } from './Notifications';
export { default as NotificationProgress } from './Progress';
export { default as useNotification } from './useNotification';
export { clsx } from './util';
