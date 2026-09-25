/**
 * message 的类型图标 —— antd `components/message/PurePanel.tsx` 的 `TypeIcon` /
 * `getMessageIcon`。
 *
 * ⚠️ 这里存的是**组件**而不是「模块级常量 VNode」：Vue 的 VNode 是可变的
 * （patch 时会写 `el` / `component`），同一个 VNode 被两条消息渲染会互相踩
 * （empty 的 D23 已经踩过一次）⇒ 每次渲染现 `h()`。
 */
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  LoadingOutlined,
} from '@apollo-design/icons';
import { type Component, h, type VNodeChild } from 'vue';

import type { NoticeType } from './interface';

export const TypeIcon: Record<NoticeType, Component> = {
  info: InfoCircleFilled,
  success: CheckCircleFilled,
  error: CloseCircleFilled,
  warning: ExclamationCircleFilled,
  loading: LoadingOutlined,
};

/** 图标取值优先级：显式 `icon` → 类型图标 → 无（`null`）。 */
export function getMessageIcon(type?: NoticeType, icon?: VNodeChild): VNodeChild {
  if (icon) return icon;
  if (type) return h(TypeIcon[type]);
  return null;
}
