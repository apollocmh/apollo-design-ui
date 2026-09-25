/**
 * 通知内核的类型面 —— `@rc-component/notification@2.0.8` 的 Vue 化（**内核层**）。
 *
 * 为什么单独一层：antd 的 `message` 与 `notification` 都建立在这套内核之上
 * （`useRcNotification` + `Notifications`/`NotificationList`/`Notification`），
 * 而本仓 R7/E19 禁止 `@rc-component/*` 运行时依赖 ⇒ 必须自建。
 * 放在 `notification/engine/` 而不是新开 foundation 包：**只有 ui 层消费它**，
 * 且它与 notification 组件的样式/token 强耦合（同 `menu/engine/` 的判据）。
 *
 * 逐文件对应：`Notifications.js` / `NotificationList/{index,Content}.js` /
 * `Notification.js` / `NotificationProvider.js` / `Progress.js` / `hooks/*`。
 */
import type { Component, CSSProperties } from 'vue';

export type Placement = 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';

/** rc 的 `StackConfig`：折叠堆叠的偏移与阈值。 */
export interface StackConfig {
  offset?: number;
  threshold?: number;
}

/** 单条 notice 的语义槽（rc `NotificationClassNames`）。 */
export interface NoticeClassNames {
  wrapper?: string;
  root?: string;
  icon?: string;
  section?: string;
  title?: string;
  description?: string;
  actions?: string;
  close?: string;
  progress?: string;
}

export interface NoticeStyles {
  wrapper?: CSSProperties;
  root?: CSSProperties;
  icon?: CSSProperties;
  section?: CSSProperties;
  title?: CSSProperties;
  description?: CSSProperties;
  actions?: CSSProperties;
  close?: CSSProperties;
  progress?: CSSProperties;
}

export interface NotificationProgressProps {
  className?: string;
  style?: CSSProperties;
  percent: number;
}

/** rc 的 `components`（只用于替换进度条）。 */
export interface ComponentsType {
  progress?: Component;
}

/**
 * ⚠️ 内容类字段一律用 `unknown` 而不是 `VNodeChild`。
 *
 * 判据（实测 TS2589）：`VNodeChild` 是**递归类型**（`VNodeArrayChildren` 自引用），
 * 而内核要把它放进 `NoticeListConfig` → `Record<string, NoticeListConfig[]>` →
 * `computed` / 索引访问里，任何一层结构操作都会让 TS 做深度实例化
 * （`Type instantiation is excessively deep and possibly infinite`）。
 * 内核只是把这些值原样透传给 `h()`，不需要类型精度；
 * **对外的 `VNodeChild` 精度保留在 message / notification 自己的类型里**。
 */
export type NoticeNode = unknown;

/** rc `NotificationProps`：单条 notice 的全部入参。 */
export interface NoticeProps {
  prefixCls: string;
  className?: string;
  style?: CSSProperties;
  classNames?: NoticeClassNames;
  styles?: NoticeStyles;
  components?: ComponentsType;
  title?: NoticeNode;
  description?: NoticeNode;
  icon?: NoticeNode;
  actions?: NoticeNode;
  role?: string;
  closable?:
    | boolean
    | { closeIcon?: NoticeNode; disabled?: boolean; onClose?: () => void; 'aria-label'?: string };
  offset?: number;
  notificationIndex?: number;
  stackInThreshold?: boolean;
  /** 透传到 notice 根元素的其余属性。 */
  props?: Record<string, unknown>;
  duration?: number | false | null;
  showProgress?: boolean;
  times?: number;
  hovering?: boolean;
  pauseOnHover?: boolean;
  onClick?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  /** @deprecated 用 `closable.onClose`。 */
  onClose?: () => void;
}

/** rc `NotificationListConfig`：带 key 的 notice 配置。 */
export interface NoticeListConfig extends Omit<NoticeProps, 'prefixCls'> {
  key: string | number;
  placement?: Placement;
}

/** 列表层比 notice 多两个槽（`list` / `listContent`）。 */
export interface NotificationClassNames extends NoticeClassNames {
  list?: string;
  listContent?: string;
}

export interface NotificationStyles extends NoticeStyles {
  list?: CSSProperties;
  listContent?: CSSProperties;
}

export interface NoticeListProps {
  configList?: NoticeListConfig[];
  prefixCls?: string;
  placement: Placement;
  pauseOnHover?: boolean;
  classNames?: NotificationClassNames;
  styles?: NotificationStyles;
  components?: ComponentsType;
  stack?: boolean | StackConfig;
  motion?: { motionName?: string } | ((placement: Placement) => { motionName?: string });
  className?: string;
  style?: CSSProperties;
  onNoticeClose?: (key: string | number) => void;
  onAllRemoved?: (placement: Placement) => void;
}

/** rc `NotificationsProps`（容器层）。 */
export interface NotificationsProps {
  prefixCls?: string;
  container?: HTMLElement | ShadowRoot | null;
  motion?: NoticeListProps['motion'];
  maxCount?: number;
  pauseOnHover?: boolean;
  classNames?: NotificationClassNames;
  styles?: NotificationStyles;
  components?: ComponentsType;
  className?: (placement: Placement) => string | undefined;
  style?: (placement: Placement) => CSSProperties | undefined;
  onAllRemoved?: () => void;
  stack?: boolean | StackConfig;
  renderNotifications?: (
    node: NoticeNode,
    info: { prefixCls: string; key: Placement },
  ) => NoticeNode;
}

/** rc `NotificationConfig`：`useNotification` 的根配置。 */
export interface NotificationConfig extends Omit<NotificationsProps, 'container'> {
  placement?: Placement;
  getContainer?: () => HTMLElement | ShadowRoot;
  closable?: NoticeProps['closable'];
  duration?: number | false | null;
  showProgress?: boolean;
}

/** rc `NotificationAPI`。 */
export interface NotificationAPI {
  open: (config: Partial<NoticeListConfig>) => void;
  close: (key: string | number) => void;
  destroy: () => void;
}
