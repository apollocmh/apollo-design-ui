/**
 * notification 的类型图标与关闭图标 —— antd `components/notification/PurePanel.tsx` 的
 * `TypeIcon` / `getCloseIcon`。
 *
 * ⚠️ `TypeIcon` 存**组件**而不是模块级 VNode（D23：Vue 的 VNode 可变，同一份常量被两条
 *    notice 渲染会互相踩）。
 * ⚠️ `TypeIcon` 里**有 `loading`**（上游也保留了它），但 `IconType` 只有 4 个值
 *    —— notification 没有 `loading` 这种类型。
 */
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
  ExclamationCircleFilled,
  InfoCircleFilled,
  LoadingOutlined,
} from '@apollo-design/icons';
import { type Component, h, type VNodeChild } from 'vue';

import type { IconType } from './interface';

export const TypeIcon: Record<IconType | 'loading', Component> = {
  info: InfoCircleFilled,
  success: CheckCircleFilled,
  error: CloseCircleFilled,
  warning: ExclamationCircleFilled,
  loading: LoadingOutlined,
};

/**
 * 关闭图标的取值（antd 逐字）：
 *   - `null` / `false` ⇒ `null`（关闭按钮还在，但不渲染图标）；
 *   - 未传 ⇒ `CloseOutlined` 且带 `{prefixCls}-close-icon` 类；
 *   - 其余原样返回。
 */
export function getCloseIcon(prefixCls: string, closeIcon?: VNodeChild): VNodeChild {
  if (closeIcon === null || closeIcon === false) {
    return null;
  }
  return closeIcon ?? h(CloseOutlined, { class: `${prefixCls}-close-icon` });
}
