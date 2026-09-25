/**
 * Notification 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/notification/interface.ts`
 * （NotificationPlacement / IconType / NotificationSemanticType / ArgsProps /
 * NotificationInstance / GlobalConfigProps / NotificationConfig）。
 * 按本仓 Vue 化约定重新定义（H2）：
 *   - `React.ReactNode` ⇒ `VNodeChild`；`React.Key` ⇒ `string | number`；
 *   - 语义槽的**函数式形态**（`GenerateSemantic`）本仓未落地 ⇒ 只保留对象形态（D36 同判）。
 *
 * ⚠️ 与内核类型（`notification/engine/interface.ts`）是两回事：那里是 rc-notification 的
 *    类型（notice/列表/内核 API），这里是 antd 的 notification **组件**类型。
 */

import type { CSSProperties, VNodeChild } from 'vue';

/** 六个方位。`NotificationPlacements` 与 message 的 placement（恒 `top`）不同。 */
export const NotificationPlacements = [
  'top',
  'topLeft',
  'topRight',
  'bottom',
  'bottomLeft',
  'bottomRight',
] as const;

export type NotificationPlacement = (typeof NotificationPlacements)[number];

/** notification **没有** `loading` 形态（与 message 不同）。 */
export type IconType = 'success' | 'info' | 'error' | 'warning';

/** 11 个语义槽（比 message 多 `description` / `actions` / `section` / `close` / `progress`）。 */
export interface NotificationSemanticType {
  classNames?: {
    list?: string;
    listContent?: string;
    wrapper?: string;
    root?: string;
    title?: string;
    description?: string;
    actions?: string;
    icon?: string;
    section?: string;
    close?: string;
    progress?: string;
  };
  styles?: {
    list?: CSSProperties;
    listContent?: CSSProperties;
    wrapper?: CSSProperties;
    root?: CSSProperties;
    title?: CSSProperties;
    description?: CSSProperties;
    actions?: CSSProperties;
    icon?: CSSProperties;
    section?: CSSProperties;
    close?: CSSProperties;
    progress?: CSSProperties;
  };
}

/** 单条通知的完整配置（`notification.open`）。 */
export interface ArgsProps {
  /** @deprecated 请用 `title`。 */
  message?: VNodeChild;
  /** 标题。`isRenderable` 为假（如 `null` / `false`）时不渲染 title 节点。 */
  title?: VNodeChild;
  /** 描述。**有 title + description 时才包 `-notice-section`。 */
  description?: VNodeChild;
  /** @deprecated 请用 `actions`。 */
  btn?: VNodeChild;
  /** 操作区。 */
  actions?: VNodeChild;
  key?: string | number;
  onClose?: () => void;
  /** 秒。`false` / `0` ⇒ 不自动关闭。 */
  duration?: number | false;
  showProgress?: boolean;
  pauseOnHover?: boolean;
  icon?: VNodeChild;
  /** 单条方位，**优先于全局** `placement`。 */
  placement?: NotificationPlacement;
  style?: CSSProperties;
  className?: string;
  classNames?: NotificationSemanticType['classNames'];
  styles?: NotificationSemanticType['styles'];
  readonly type?: IconType;
  onClick?: () => void;
  /** `null` / `false` ⇒ 关闭按钮还在，但**不渲染图标**。 */
  closeIcon?: VNodeChild;
  closable?:
    | boolean
    | null
    | {
        closeIcon?: VNodeChild;
        disabled?: boolean;
        onClose?: () => void;
        'aria-label'?: string;
      };
  /** 透传到 notice 根 div 的其他属性。 */
  props?: Record<string, unknown>;
  /** notice 根的 ARIA 角色。 */
  role?: 'alert' | 'status';
}

/** `useNotification()` 返回的实例（与 antd 的 `NotificationInstance` 同构）。 */
export interface NotificationInstance {
  success: (config: ArgsProps) => void;
  error: (config: ArgsProps) => void;
  info: (config: ArgsProps) => void;
  warning: (config: ArgsProps) => void;
  open: (config: ArgsProps) => void;
  destroy: (key?: string | number) => void;
}

/** `notification.config()` 的全局配置。 */
export interface GlobalConfigProps {
  top?: number;
  bottom?: number;
  duration?: number | false;
  showProgress?: boolean;
  pauseOnHover?: boolean;
  prefixCls?: string;
  getContainer?: () => HTMLElement;
  placement?: NotificationPlacement;
  closeIcon?: VNodeChild;
  closable?: ArgsProps['closable'];
  rtl?: boolean;
  maxCount?: number;
  props?: Record<string, unknown>;
}

/** `useNotification()` 的配置。 */
export interface NotificationConfig {
  top?: number;
  bottom?: number;
  prefixCls?: string;
  getContainer?: () => HTMLElement;
  placement?: NotificationPlacement;
  maxCount?: number;
  rtl?: boolean;
  stack?: boolean | { threshold?: number };
  duration?: number | false;
  showProgress?: boolean;
  pauseOnHover?: boolean;
  closeIcon?: VNodeChild;
  classNames?: NotificationSemanticType['classNames'];
  styles?: NotificationSemanticType['styles'];
}

/** `_InternalListDoNotUseOrYouWillBeFired` 的单条数据。 */
export interface PureListItem {
  key: string | number;
  title?: VNodeChild;
  description?: VNodeChild;
  type?: IconType;
  duration?: number | false;
}
