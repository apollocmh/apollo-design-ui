/**
 * Popconfirm 的类型定义。
 *
 * 契约来源：antd 6.6.4 `es/popconfirm/index.d.ts`（薄壳）+ `PurePanel.d.ts`（Overlay）。
 * 按 AGENTS.md H3 重新定义 —— 不复制上游源码。
 *
 * 与 antd 的差异（INTENDED / PITFALLS 35）：
 *   - 确认 / 取消业务回调保留 props，确认返回值参与异步关闭；
 *   - openChange / popupClick / afterOpenChange 使用 Vue emits；
 *   - `open` 支持 `v-model:open`（emits `update:open`）。
 */

import type { ClassValue, CSSProperties, VNode, VNodeChild } from 'vue';
import type { LegacyButtonType } from '../_internal/action-button';
import type { TriggerAlign } from '../_internal/trigger';
import type {
  TooltipArrow,
  TooltipContent,
  TooltipEmits,
  TooltipPlacement,
  TooltipRef,
} from '../tooltip/interface';

export interface PopconfirmSlots {
  default?: () => VNodeChild;
  title?: () => VNodeChild;
  description?: () => VNodeChild;
  icon?: () => VNodeChild;
  okText?: () => VNodeChild;
  cancelText?: () => VNodeChild;
}

/** Button 配置属性；根节点 class/style 采用 Vue 原生 attrs。 */
export interface PopconfirmButtonProps extends Record<string, unknown> {
  class?: ClassValue;
  style?: CSSProperties;
  /** @deprecated Use `class`. */
  className?: never;
  /** @deprecated Use `class`. */
  rootClassName?: never;
}

/** 语义槽位：Popover 的三槽 + Popconfirm 的 icon（description 复用 `content`）。 */
export interface PopconfirmSemanticType {
  classNames?: {
    root?: string;
    container?: string;
    arrow?: string;
    icon?: string;
    title?: string;
    content?: string;
  };
  styles?: {
    root?: CSSProperties;
    container?: CSSProperties;
    arrow?: CSSProperties;
    icon?: CSSProperties;
    title?: CSSProperties;
    content?: CSSProperties;
  };
}

/** 语义化类名（含函数式变体）。 */
export type PopconfirmClassNames =
  | PopconfirmSemanticType['classNames']
  | ((info: { props: PopconfirmProps }) => PopconfirmSemanticType['classNames']);

/** 语义化样式（含函数式变体）。 */
export type PopconfirmStyles =
  | PopconfirmSemanticType['styles']
  | ((info: { props: PopconfirmProps }) => PopconfirmSemanticType['styles']);

export interface PopconfirmProps {
  /** 类名前缀。 */
  prefixCls?: string;
  /** 根元素（浮层）追加类名。 */
  overlayClassName?: string;
  /** 浮层内联样式。 */
  overlayStyle?: CSSProperties;
  /** 标题数据（`0` 合法）；富内容优先使用 #title。 */
  title?: TooltipContent;
  /** 描述数据；富内容优先使用 #description。 */
  description?: TooltipContent;
  /** 禁用：不打开浮层。 */
  disabled?: boolean;
  /** 触发方式；默认 `click`（与 Popover 的 `hover` 不同）。 */
  trigger?: string | string[];
  /** 浮层位置；默认 `top`。 */
  placement?: TooltipPlacement;
  /** 是否展开（受控）。 */
  open?: boolean;
  /** v-model:open 的 JSX / h() 监听器。 */
  'onUpdate:open'?: (open: boolean) => void;
  /** 默认是否展开。 */
  defaultOpen?: boolean;
  /** 确认按钮文案；falsy 时回退到 locale。 */
  okText?: string;
  /** 确认按钮类型；默认 `primary`。 */
  okType?: LegacyButtonType;
  /** 取消按钮文案；falsy 时回退到 locale。 */
  cancelText?: string;
  /** 确认按钮属性。 */
  okButtonProps?: PopconfirmButtonProps;
  /** 取消按钮属性。 */
  cancelButtonProps?: PopconfirmButtonProps;
  /** 是否显示取消按钮；默认 true。 */
  showCancel?: boolean;
  /** 自定义图标；默认 `ExclamationCircleFilled`。 */
  icon?: VNode | string | false;
  /** 箭头配置（与 Tooltip 同物）。 */
  arrow?: TooltipArrow;
  /** 悬浮进入延迟（默认 0.1）。 */
  mouseEnterDelay?: number;
  /** 悬浮离开延迟（默认 0.1）。 */
  mouseLeaveDelay?: number;
  /** 语义化类名。 */
  classNames?: PopconfirmClassNames;
  /** 语义化样式。 */
  styles?: PopconfirmStyles;
  /** openChange 事件的 JSX / h() 监听器。 */
  onOpenChange?: (open: boolean) => void;
  /** 确认回调；Promise 返回值用于等待完成后关闭。 */
  onConfirm?: (e?: MouseEvent) => unknown;
  /** 取消回调。 */
  onCancel?: (e?: MouseEvent) => void;
  /** popupClick 事件的 JSX / h() 监听器。 */
  onPopupClick?: (e: MouseEvent) => void;

  // ------------------------------------------------------------------
  // 以下来自 antd 的 `AbstractTooltipProps`（Issue #26.1）：上游 Popconfirm 继承它，
  // 本仓原先是**手写独立接口** ⇒ 这些字段类型上不存在（运行时靠 attrs 逃逸，时灵
  // 时不灵）。现在补齐类型 + 运行时声明，统一显式下传给 Popover。
  // ------------------------------------------------------------------
  /** 浮层挂载容器。 */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** 浮层挂载容器（Tooltip 旧名，与 `getPopupContainer` 同义）。 */
  getTooltipContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** 浮层对齐配置。 */
  align?: TriggerAlign;
  /** 预设对齐位置表。 */
  builtinPlacements?: Record<string, TriggerAlign>;
  /** 浮层层级。 */
  zIndex?: number;
  /** 关闭后销毁浮层。 */
  destroyOnHidden?: boolean;
  /** 每次打开都重新渲染内容。 */
  fresh?: boolean;
  /** 强制预渲染浮层。 */
  forceRender?: boolean;
  /** afterOpenChange 事件的 JSX / h() 监听器。 */
  onAfterOpenChange?: (open: boolean) => void;
  /** 浮层容器 id（ARIA 关联用）。 */
  id?: string;
}

/** expose —— 与 Popover 同物（antd 的 `TooltipRef`）。 */
export type PopconfirmRef = TooltipRef;
export type PopconfirmEmits = TooltipEmits;

export type { TooltipArrow, TooltipContent, TooltipPlacement };
