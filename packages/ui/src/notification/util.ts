/**
 * notification 的共享工具 —— antd `components/notification/util.ts` 的 Vue 版。
 *
 * ⚠️ 本文件被 **message 与 notification 共同消费**（registry 的 leafModules 里就有它），
 * 所以签名与语义必须与上游逐字对齐，不能为了某一方方便而改。
 */
import { isNonNullable } from '@apollo-design/utils';
import type { CSSProperties } from 'vue';

export interface PlacementOffsetStyle extends CSSProperties {
  '--notification-top'?: string;
  '--notification-bottom'?: string;
}

/** 把 `top` / `bottom` 写成 CSS 变量（number ⇒ px，字符串原样）。 */
export function getPlacementOffsetStyle(
  top?: number | string,
  bottom?: number | string,
): PlacementOffsetStyle {
  return {
    ...(isNonNullable(top)
      ? { '--notification-top': typeof top === 'number' ? `${top}px` : top }
      : {}),
    ...(isNonNullable(bottom)
      ? { '--notification-bottom': typeof bottom === 'number' ? `${bottom}px` : bottom }
      : {}),
  };
}

/** 通知的默认动效名（`{p}-fade`）。 */
export function getMotion(prefixCls: string): { motionName: string } {
  return { motionName: `${prefixCls}-fade` };
}

/** 关闭图标的取值优先级：实例 → 实例配置 → ConfigProvider 配置。 */
export function getCloseIconConfig<T>(
  closeIcon: T,
  notificationConfig?: { closeIcon?: T },
  notification?: { closeIcon?: T },
): T | undefined {
  if (typeof closeIcon !== 'undefined') return closeIcon;
  if (typeof notificationConfig?.closeIcon !== 'undefined') return notificationConfig.closeIcon;
  return notification?.closeIcon;
}
