/**
 * Tooltip 的类型定义（G2 产物）。
 *
 * 判据：antd 6.6.4 `components/tooltip/index.tsx` 的 AbstractTooltipProps /
 * TooltipProps / TooltipSemanticType / TooltipRef + `@rc-component/tooltip`
 * TooltipProps（H2 重新定义，禁止复制搬运）。禁 any / as any / @ts-expect-error（H10）。
 */

import type { TriggerAlign } from '../_internal/trigger';

type VNodeChild = import('vue').VNodeChild;

/** antd 的 `TooltipPlacement`（_util 的 12 个 placement）。 */
export type TooltipPlacement =
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom';

/** 内容：`title` / `overlay` 同形（ReactNode | RenderFunction）。 */
export type TooltipContent = VNodeChild | (() => VNodeChild);

/** `arrow` 三形态（useMergedArrow 消费）。 */
export type TooltipArrow = boolean | { pointAtCenter?: boolean };

/** antd `AdjustOverflow`。 */
export interface AdjustOverflow {
  adjustX?: boolean | number;
  adjustY?: boolean | number;
  shiftX?: boolean | number;
  shiftY?: boolean | number;
}

/** 语义槽位（D36 同判：手写接口，不做条件类型）。 */
export interface TooltipSemanticType {
  classNames?: {
    root?: string;
    container?: string;
    arrow?: string;
  };
  styles?: {
    root?: Record<string, string | number>;
    container?: Record<string, string | number>;
    arrow?: Record<string, string | number>;
  };
}

/** 语义化类名（含函数式变体）。 */
export type TooltipClassNames =
  | TooltipSemanticType['classNames']
  | ((info: { props: TooltipProps }) => TooltipSemanticType['classNames']);

/** 语义化样式（含函数式变体）。 */
export type TooltipStyles =
  | TooltipSemanticType['styles']
  | ((info: { props: TooltipProps }) => TooltipSemanticType['styles']);

export interface TooltipProps {
  /** 类名前缀。从 ConfigProvider 取，兜底 `apollo-tooltip`。 */
  prefixCls?: string;
  /** 受控开合（`v-model:open` 等价）。 */
  open?: boolean;
  /** 非受控初始值。 */
  defaultOpen?: boolean;
  /** 开合回调（C11：与 `update:open` 同时发出）。 */
  onOpenChange?: (open: boolean) => void;
  /** 开合动画结束回调。 */
  afterOpenChange?: (open: boolean) => void;
  /** 提示内容（`title === 0` 合法）。 */
  title?: TooltipContent;
  /** 旧版内容通道（与 `title` 同物，antd 未废弃）。 */
  overlay?: TooltipContent;
  /** 触发动作（`hover` / `click` / `focus` / `contextMenu` 或数组）。 */
  trigger?: string | string[];
  /** 浮层对齐位置。 */
  placement?: TooltipPlacement;
  /** 箭头：`false` 隐藏；`{ pointAtCenter }` 指向中心。 */
  arrow?: TooltipArrow;
  /** 预设色（`blue` 等 13 个）或自定义 CSS 颜色。 */
  color?: string;
  /** 溢出自动调整（默认 `true`）。 */
  autoAdjustOverflow?: boolean | AdjustOverflow;
  /** 覆盖内置 12 placement 的对齐配置。 */
  builtinPlacements?: Record<string, TriggerAlign>;
  /** 用户 align 合并（rc 的 `popupAlign`）。 */
  align?: TriggerAlign;
  /** 挂载容器。 */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** 同 `getPopupContainer`（rc-tooltip 旧名）。 */
  getTooltipContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** 开启时给触发元素追加的类名（默认 `{p}-open`）。 */
  openClassName?: string;
  /** 关闭且动画结束后卸载 portal。 */
  destroyOnHidden?: boolean;
  /** ⚠️ 已废弃，请用 `destroyOnHidden`。 */
  destroyTooltipOnHide?: boolean | { keepParent?: boolean };
  /** 单位**秒**。 */
  mouseEnterDelay?: number;
  /** 单位**秒**。 */
  mouseLeaveDelay?: number;
  /** 动画配置（仅支持 motionName 覆盖，其余走 `apollo-zoom-big-fast`）。 */
  motion?: { motionName?: string };
  /** 浮层 z-index（未传走 useZIndex 的层叠体系）。 */
  zIndex?: number;
  /** 浮层 role=tooltip 元素的 id（aria-describedby 用）。 */
  id?: string;
  /** 点击浮层内容回调。 */
  onPopupClick?: (event: MouseEvent) => void;
  /** 关闭时不缓存内容。 */
  fresh?: boolean;
  /** 关闭后仍挂载 portal。 */
  forceRender?: boolean;
  /** 禁用（禁用时不响应触发，且不渲染浮层）。 */
  disabled?: boolean;
  classNames?: TooltipClassNames;
  styles?: TooltipStyles;
  /** ⚠️ 已废弃，请用 `styles.root`。 */
  overlayStyle?: Record<string, string | number>;
  /** ⚠️ 已废弃，请用 `styles.container`。 */
  overlayInnerStyle?: Record<string, string | number>;
  /** ⚠️ 已废弃，请用 `classNames.root`。 */
  overlayClassName?: string;
  /** 触发元素 —— 默认插槽。 */
  children?: VNodeChild;
}

/** expose（antd 的 `TooltipRef`；nativeElement 可空性按真实情况，D22 同判）。 */
export interface TooltipRef {
  forceAlign: () => void;
  nativeElement: HTMLElement | null;
  popupElement: HTMLDivElement | null;
}
