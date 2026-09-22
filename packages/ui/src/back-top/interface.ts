/**
 * BackTop 的类型定义。
 *
 * 契约来源：antd 6.6.4 的 `es/back-top/index.d.ts`。
 * **逐字段对齐**（规则 R7）。差异：children 不在 Props（规则 C19，默认插槽）。
 *
 * ⚠️ 整个组件在 antd 6.x 已 `@deprecated`（→ FloatButton.BackTop）——
 *    JSDoc 标记逐字保留。
 */

/** antd 的 `getDefaultTarget` 返回：ownerDocument 或 window。 */
export type BackTopTarget = () => HTMLElement | Window | Document;

/**
 * @deprecated Please use `GetProps<typeof FloatButton.BackTop>` instead.
 */
export interface BackTopProps {
  /** 滚动超过该值才显示（px）。 */
  visibilityHeight?: number;
  /** 点击回调（滚动开始后调用）。 */
  onClick?: (e: MouseEvent) => void;
  /** 滚动容器（默认 ownerDocument / window）。 */
  target?: BackTopTarget;
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-back-top`。 */
  prefixCls?: string;
  /** 透传类名。 */
  className?: string;
  /** 透传类名（根级，antd 契约保留）。 */
  rootClassName?: string;
  /** 透传根样式。 */
  style?: Record<string, string | number>;
  /** 回顶动画时长（ms；<=0 直落）。 */
  duration?: number;
}
