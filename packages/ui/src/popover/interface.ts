/**
 * Popover 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/popover/index.tsx`（PopoverProps extends
 * AbstractTooltipProps）+ `PurePanel.tsx`。上游是**兼容性规格**，按本仓 Vue 化
 * 约定重新定义（H2）；TooltipProps 的复用是**类型 extends**，非复制搬运。
 *
 * 结构：Popover 主体复用 Tooltip 的全协议（Trigger/portal/motion/开合），只在
 * 内容通道（title + content 双通道）与语义槽（title/content）上扩展。
 */

import type {
  TooltipArrow,
  TooltipContent,
  TooltipPlacement,
  TooltipProps,
  TooltipRef,
} from '../tooltip/interface';

export type { TooltipArrow, TooltipContent, TooltipPlacement };

/** 语义槽位（D36 同判：手写接口，不做条件类型）。 */
export interface PopoverSemanticType {
  classNames?: {
    root?: string;
    container?: string;
    arrow?: string;
    title?: string;
    content?: string;
  };
  styles?: {
    root?: Record<string, string | number>;
    container?: Record<string, string | number>;
    arrow?: Record<string, string | number>;
    title?: Record<string, string | number>;
    content?: Record<string, string | number>;
  };
}

/** 语义化类名（含函数式变体）。 */
export type PopoverClassNames =
  | PopoverSemanticType['classNames']
  | ((info: { props: PopoverProps }) => PopoverSemanticType['classNames']);

/** 语义化样式（含函数式变体）。 */
export type PopoverStyles =
  | PopoverSemanticType['styles']
  | ((info: { props: PopoverProps }) => PopoverSemanticType['styles']);

export interface PopoverProps extends Omit<TooltipProps, 'classNames' | 'styles' | 'title'> {
  /** 标题内容（`0` 合法；可为惰性函数）。 */
  title?: TooltipContent;
  /** 正文内容（`0` 合法；可为惰性函数）。 */
  content?: TooltipContent;
  /** 语义化类名（比 Tooltip 多 title / content 两槽）。 */
  classNames?: PopoverClassNames;
  /** 语义化样式（比 Tooltip 多 title / content 两槽）。 */
  styles?: PopoverStyles;
}

/** expose —— 与 Tooltip 同物（antd 的 `TooltipRef`）。 */
export type PopoverRef = TooltipRef;
