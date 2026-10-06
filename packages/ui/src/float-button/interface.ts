/**
 * FloatButton 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/float-button/*.d.ts`（H2 重新定义，不复制搬运）。
 *
 * C8-R2：icon / content（ReactNode）→ `#icon` / `#content` 插槽；
 * description（deprecated）并入 `#content`；Group 的 closeIcon → `#closeIcon` 插槽。
 * tooltip / badge 是数据 prop（C8-R2 豁免）。
 */

import type { CSSProperties } from 'vue';
import type { BadgeProps } from '../badge/interface';
import type { ButtonSemanticClassNames, ButtonSemanticStyles } from '../button/interface';
import type { TooltipProps } from '../tooltip/interface';

export type FloatButtonType = 'default' | 'primary';

export type FloatButtonShape = 'circle' | 'square';

export type FloatButtonGroupTrigger = 'click' | 'hover';

/** antd 的 `FloatButtonBadgeProps`（Omit status/text/title/children）。 */
export type FloatButtonBadgeProps = Omit<BadgeProps, 'status' | 'text' | 'title' | 'children'>;

/** antd 的 `FloatButtonSemanticType` = ButtonSemanticType。 */
export type FloatButtonSemanticClassNames = ButtonSemanticClassNames;
export type FloatButtonSemanticStyles = ButtonSemanticStyles;

export interface FloatButtonProps {
  // ---- 样式 ----
  prefixCls?: string;
  classNames?:
    | FloatButtonSemanticClassNames
    | ((info: { props: FloatButtonProps }) => FloatButtonSemanticClassNames);
  styles?:
    | FloatButtonSemanticStyles
    | ((info: { props: FloatButtonProps }) => FloatButtonSemanticStyles);

  // ---- 内容 ----
  /** @deprecated 用 `#content` 插槽。 */
  description?: string;
  href?: string;
  target?: string;
  htmlType?: 'submit' | 'button' | 'reset';
  'aria-label'?: string;

  // ---- 形态 ----
  type?: FloatButtonType;
  shape?: FloatButtonShape;
  disabled?: boolean;

  // ---- 附加 ----
  tooltip?: TooltipProps | string;
  badge?: FloatButtonBadgeProps;
}

/** `ref` 的 expose 面（antd `FloatButtonRef`）。 */
export interface FloatButtonRef {
  get nativeElement(): HTMLElement | null;
}

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

export interface FloatButtonGroupSemanticClassNames {
  root?: string;
  list?: string;
  item?: string;
  itemIcon?: string;
  itemContent?: string;
  trigger?: string;
  triggerIcon?: string;
  triggerContent?: string;
}

export interface FloatButtonGroupSemanticStyles {
  root?: CSSProperties;
  list?: CSSProperties;
  item?: CSSProperties;
  itemIcon?: CSSProperties;
  itemContent?: CSSProperties;
  trigger?: CSSProperties;
  triggerIcon?: CSSProperties;
  triggerContent?: CSSProperties;
}

export type FloatButtonGroupPlacement = 'top' | 'left' | 'right' | 'bottom';

export interface FloatButtonGroupProps {
  prefixCls?: string;
  classNames?:
    | FloatButtonGroupSemanticClassNames
    | ((info: { props: FloatButtonGroupProps }) => FloatButtonGroupSemanticClassNames);
  styles?:
    | FloatButtonGroupSemanticStyles
    | ((info: { props: FloatButtonGroupProps }) => FloatButtonGroupSemanticStyles);

  type?: FloatButtonType;
  shape?: FloatButtonShape;
  disabled?: boolean;
  'aria-label'?: string;
  href?: string;
  target?: string;
  htmlType?: 'submit' | 'button' | 'reset';
  tooltip?: TooltipProps | string;
  badge?: FloatButtonBadgeProps;

  /** menu 模式开关（click / hover）；不传 = 纯列表。 */
  trigger?: FloatButtonGroupTrigger;
  /** 受控开合（需与 trigger 同用，usage 告警）。 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 触发按钮点击（menu 模式下先于开合逻辑之外触发）。 */
  onClick?: (event: MouseEvent) => void;

  placement?: FloatButtonGroupPlacement;
}

export interface FloatButtonGroupRef {
  get nativeElement(): HTMLElement | null;
}

// ---------------------------------------------------------------------------
// BackTop
// ---------------------------------------------------------------------------

export interface FloatButtonBackTopProps extends Omit<FloatButtonProps, 'target'> {
  /** 滚动容器（默认 ownerDocument || window）。 */
  target?: () => HTMLElement | Window | Document;
  /** 滚动超过该高度才可见（默认 400；0 ⇒ 恒可见）。 */
  visibilityHeight?: number;
  duration?: number;
  /** v6.6.0：进度环。 */
  showProgress?: boolean;
  onClick?: (event: MouseEvent) => void;
}
