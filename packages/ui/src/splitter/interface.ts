/**
 * Splitter 的类型契约（从 antd 6.6.4 的 `es/splitter/interface.d.ts` 与
 * `SplitBar.d.ts` **重新定义**，不复制）。
 */

import type { VNodeChild } from 'vue';
import type { Orientation } from '../_internal/use-orientation';

/** 折叠图标的显隐模式。 */
export type ShowCollapsibleIconMode = boolean | 'auto';

// ============================== Panel ==============================

export interface PanelCollapsible {
  start?: boolean | undefined;
  end?: boolean | undefined;
  showCollapsibleIcon?: ShowCollapsibleIconMode | undefined;
}

export interface SplitterPanelProps {
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
  /** 面板最小尺寸（px 或 '%'）。 */
  min?: number | string | undefined;
  /** 面板最大尺寸（px 或 '%'）。 */
  max?: number | string | undefined;
  /** 受控尺寸（px 或 '%'）。 */
  size?: number | string | undefined;
  collapsible?: boolean | PanelCollapsible | undefined;
  resizable?: boolean | undefined;
  /** 非受控初始尺寸（px 或 '%'）。 */
  defaultSize?: number | string | undefined;
  destroyOnHidden?: boolean | undefined;
}

// ============================== Splitter ==============================

export interface SplitterCollapsibleIcon {
  start?: VNodeChild | undefined;
  end?: VNodeChild | undefined;
}

/** @deprecated 用 `collapsible.icon`。 */
export type SplitterLegacyCollapsibleIcon = SplitterCollapsibleIcon;

export interface SplitterDraggerClassNames {
  default?: string | undefined;
  active?: string | undefined;
}

export interface SplitterDraggerStyles {
  default?: Record<string, string | number> | undefined;
  active?: Record<string, string | number> | undefined;
}

export interface SplitterSemanticClassNames {
  root?: string | undefined;
  panel?: string | undefined;
  /** string 展平为 `{ default }`（antd 的 `_default: 'default'` 语义）。 */
  dragger?: string | SplitterDraggerClassNames | undefined;
}

export interface SplitterSemanticStyles {
  root?: Record<string, string | number> | undefined;
  panel?: Record<string, string | number> | undefined;
  dragger?: SplitterDraggerStyles | undefined;
}

export interface SplitterProps {
  prefixCls?: string | undefined;
  className?: string | undefined;
  rootClassName?: string | undefined;
  style?: Record<string, string | number> | undefined;
  classNames?: SplitterSemanticClassNames | undefined;
  styles?: SplitterSemanticStyles | undefined;
  /** 折叠全局配置：`motion: true` 开启折叠动画（时长走 Component Token）。 */
  collapsible?:
    | { motion?: boolean | undefined; icon?: SplitterCollapsibleIcon | undefined }
    | undefined;
  /** @deprecated 用 `orientation`。 */
  layout?: Orientation | undefined;
  orientation?: Orientation | undefined;
  vertical?: boolean | undefined;
  destroyOnHidden?: boolean | undefined;
  /** @deprecated 用 `collapsible.icon`。 */
  collapsibleIcon?: SplitterLegacyCollapsibleIcon | undefined;
  lazy?: boolean | undefined;
  onResizeStart?: ((sizes: number[]) => void) | undefined;
  onResize?: ((sizes: number[]) => void) | undefined;
  onResizeEnd?: ((sizes: number[]) => void) | undefined;
  onCollapse?: ((collapsed: boolean[], sizes: number[]) => void) | undefined;
  onDraggerDoubleClick?: ((index: number) => void) | undefined;
}

/** ref 形状（antd 的 `SplitterRef`）。 */
export interface SplitterRef {
  nativeElement: HTMLDivElement | null;
}
