/**
 * Apollo Drawer 的 Props、Vue 事件、内容插槽与模板引用。
 *
 * 契约来源：antd 6.6.4 `components/drawer/Drawer.tsx` 的 `DrawerProps` +
 * `DrawerPanel.tsx` 的 `DrawerPanelProps` / `DrawerSemanticType` +
 * `@rc-component/drawer@1.4.2` 的 `DrawerProps`（`es/inter.d.ts` 与 `Drawer.d.ts`）。
 * 按本仓 Vue 化约定重新定义（H2）：
 *   - `React.ReactNode` ⇒ `VNodeChild`；`React.Key` ⇒ `string | number`；
 *   - `React.CSSProperties` ⇒ `CSSProperties`；
 *   - 语义槽的**函数式形态**（`GenerateSemantic`）本仓未落地 ⇒ 只保留对象形态（D36 同判）。
 *
 * 上述版本仅记录历史参考；公开通知使用 Vue emits，不继承上游回调或内部 ref 形态。
 */

import type { GetContainer } from '@apollo-design/portal';
import type { CSSProperties, VNodeChild } from 'vue';

import type { MaskType } from '../_internal/use-merged-mask';

/** Native content slots; presence takes precedence, including empty content. */
export interface DrawerSlots {
  default?: () => VNodeChild;
  title?: () => VNodeChild;
  footer?: () => VNodeChild;
  extra?: () => VNodeChild;
  closeIcon?: () => VNodeChild;
}

/** 四个方位（rc-drawer 的 `Placement`）。 */
export const DrawerPlacements = ['top', 'right', 'bottom', 'left'] as const;

export type DrawerPlacement = (typeof DrawerPlacements)[number];

/** `size` 的预设值（`_SizeTypes`）。 */
export type DrawerSize = 'default' | 'large' | number | string;

/** `push` 的形态（rc-drawer 的 `PushState`）。 */
export interface PushState {
  distance: string | number;
}

/**
 * mask 的配置。
 *
 * ⚠️ 2026-09-26 起**单一真源**在 `_internal/use-merged-mask.ts`（drawer 与 modal 共用，
 *    三次法则满足后搬家）。这里只做**再导出**，保持 drawer 的公开类型名不变。
 */
export type { MaskType };

/** `focusable` 的配置（antd `useFocusable`）。 */
export interface FocusableConfig {
  /** 关闭后是否把焦点还给触发元素。 */
  focusTriggerAfterClose?: boolean;
  /** 是否做焦点陷阱。 */
  trap?: boolean;
}

export interface DrawerRef {
  /** The current outer Drawer root, or null before mounting/after destruction. */
  nativeElement: HTMLElement | null;
  focus: (options?: FocusOptions) => void;
}

export interface DrawerEmits {
  close: (nativeEvent: Event) => void;
  afterOpenChange: (open: boolean) => void;
  resize: (size: number) => void;
  resizeStart: (size: number) => void;
  resizeEnd: (size: number) => void;
}

export type DrawerClosable =
  | boolean
  | null
  | {
      closeIcon?: VNodeChild;
      disabled?: boolean;
      placement?: 'start' | 'end';
      'aria-label'?: string;
    };

/**
 * 12 个语义槽。
 * ⚠️ `content` 是 **deprecated**（⇒ `section`），保留是为了让迁移期的旧代码仍能通过类型检查
 * （上游同样保留 + dev 告警）。
 */
export interface DrawerSemanticType {
  classNames?: {
    root?: string;
    mask?: string;
    header?: string;
    title?: string;
    extra?: string;
    section?: string;
    body?: string;
    footer?: string;
    wrapper?: string;
    dragger?: string;
    close?: string;
    /** @deprecated 请用 `section`。 */
    content?: string;
  };
  styles?: {
    root?: CSSProperties;
    mask?: CSSProperties;
    header?: CSSProperties;
    title?: CSSProperties;
    extra?: CSSProperties;
    section?: CSSProperties;
    body?: CSSProperties;
    footer?: CSSProperties;
    wrapper?: CSSProperties;
    dragger?: CSSProperties;
    close?: CSSProperties;
    /** @deprecated 请用 `section`。 */
    content?: CSSProperties;
  };
}

/** `DrawerPanel` 的 props（内容面板）。 */
export interface DrawerPanelProps {
  prefixCls?: string;
  ariaId?: string;
  /** 标题区。 */
  title?: VNodeChild;
  /** 底部区。 */
  footer?: VNodeChild;
  /** 标题栏右侧的额外内容（关闭按钮之前）。 */
  extra?: VNodeChild;
  /**
   * 关闭按钮。
   * ⚠️ 对象形态多一个 `placement: 'start' | 'end'`（决定按钮在标题栏的哪一侧）。
   */
  closable?: DrawerClosable;
  closeIcon?: VNodeChild;
  onClose?: (e: Event) => void;
  classNames?: DrawerSemanticType['classNames'];
  styles?: DrawerSemanticType['styles'];
  /** 内容区骨架态（依赖 `@apollo-design/ui` 的 Skeleton）。 */
  loading?: boolean;
  /** @deprecated 请用 `styles.header`。 */
  headerStyle?: CSSProperties;
  /** @deprecated 请用 `styles.body`。 */
  bodyStyle?: CSSProperties;
  /** @deprecated 请用 `styles.footer`。 */
  footerStyle?: CSSProperties;
}

/**
 * `Drawer` 的 props。
 *
 * 类型由本项目声明，不引入 rc 类型；当前行为见双语 API 与回归测试。
 *
 * ⚠️ C8-R2：`DrawerPanelProps` 的 `footer` / `extra` / `closeIcon` 是 React 式 VNode prop，
 *    在公开 `DrawerProps` 中已删除，改同名 slot（`#footer` / `#extra` / `#closeIcon`，空 slot
 *    等价隐藏）；`title` 收窄为 `string`（富标题走 `#title` slot，slot 优先）。
 */
export interface DrawerProps
  extends Omit<DrawerPanelProps, 'ariaId' | 'title' | 'footer' | 'extra' | 'closeIcon'> {
  /** 标题（文本）。富标题走 `#title` slot（slot 优先）。 */
  title?: string;
  // ---------------------------- rc-drawer 侧 ----------------------------
  /** 是否显示。 */
  open?: boolean;
  placement?: DrawerPlacement;
  defaultSize?: number;
  /** 打开时是否自动聚焦面板。 */
  autoFocus?: boolean;
  /** ESC 是否可关。 */
  keyboard?: boolean;
  /** @deprecated 请用 `size`（rc 的 `width`）。 */
  width?: string | number;
  /** @deprecated 请用 `size`（rc 的 `height`）。 */
  height?: string | number;
  maxSize?: number;
  mask?: MaskType;
  /** @deprecated 请用 `mask.closable`。 */
  maskClosable?: boolean;
  getContainer?: GetContainer;
  /** 即使没开也渲染（配合 `destroyOnHidden`）。 */
  forceRender?: boolean;
  /** Vue listener for the completed visibility transition. */
  onAfterOpenChange?: (open: boolean) => void;
  /** 关闭后是否卸载内容。 */
  destroyOnHidden?: boolean;
  /** 关闭后是否把焦点还给触发元素（rc 的 `focusTriggerAfterClose`）。 */
  focusTriggerAfterClose?: boolean;

  // ------------------------------ antd 自有 ------------------------------
  /** 尺寸预设/数值；`'default'` = 378、`'large'` = 736。 */
  size?: DrawerSize;
  /** 可拖拽改尺寸。通知通过 resize / resizeStart / resizeEnd 发出。 */
  resizable?: boolean;
  onResize?: (size: number) => void;
  onResizeStart?: (size: number) => void;
  onResizeEnd?: (size: number) => void;
  /** @deprecated 请用 `destroyOnHidden`。 */
  destroyOnClose?: boolean;
  /** 焦点行为。 */
  focusable?: FocusableConfig;
  /** 子抽屉打开时，本级被推挤的距离。 */
  push?: boolean | PushState;
  /** 根节点附加样式，优先级低于原生 style。 */
  rootStyle?: CSSProperties;
  /** @deprecated 请用 `styles.section`。 */
  drawerStyle?: CSSProperties;
  /** @deprecated 请用 `styles.mask`。 */
  maskStyle?: CSSProperties;
  /** @deprecated 请用 `styles.wrapper`。 */
  contentWrapperStyle?: CSSProperties;
  /** 面板的 `aria-labelledby`（未传则用 `ariaId`）。 */
  ariaLabelledby?: string;
  zIndex?: number;
}

/** `_InternalPanelDoNotUseOrYouWillBeFired` 的 props。 */
export interface DrawerPurePanelProps
  extends Pick<
    DrawerPanelProps,
    | 'prefixCls'
    | 'closable'
    | 'onClose'
    | 'classNames'
    | 'styles'
    | 'loading'
    | 'headerStyle'
    | 'bodyStyle'
    | 'footerStyle'
  > {
  /** 标题（文本）。富标题走 `#title` slot（slot 优先）。 */
  title?: string;
  /** 默认 `'right'`。 */
  placement?: DrawerPlacement;
}
