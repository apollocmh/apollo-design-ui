/**
 * Drawer 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/drawer/Drawer.tsx` 的 `DrawerProps` +
 * `DrawerPanel.tsx` 的 `DrawerPanelProps` / `DrawerSemanticType` +
 * `@rc-component/drawer@1.4.2` 的 `DrawerProps`（`es/inter.d.ts` 与 `Drawer.d.ts`）。
 * 按本仓 Vue 化约定重新定义（H2）：
 *   - `React.ReactNode` ⇒ `VNodeChild`；`React.Key` ⇒ `string | number`；
 *   - `React.CSSProperties` ⇒ `CSSProperties`；
 *   - 语义槽的**函数式形态**（`GenerateSemantic`）本仓未落地 ⇒ 只保留对象形态（D36 同判）。
 *
 * ⚠️ 与 antd 的 `extends` 结构对应关系（便于逐条核对）：
 *   `DrawerProps = Omit<RcDrawerProps, 7 个键> & Omit<DrawerPanelProps, 'prefixCls' | 'ariaId'>`
 *   + 本文件里列出的 10 个自有字段。本仓不引入 rc 类型（R7），所以把 rc 的字段**展开**
 *   写在下面，并在注释里标明它们来自 rc 侧。
 */

import type { CSSProperties, VNodeChild } from 'vue';

/** 四个方位（rc-drawer 的 `Placement`）。 */
export const DrawerPlacements = ['top', 'right', 'bottom', 'left'] as const;

export type DrawerPlacement = (typeof DrawerPlacements)[number];

/** `size` 的预设值（`_SizeTypes`）。 */
export type DrawerSize = 'default' | 'large' | number | string;

/** `push` 的形态（rc-drawer 的 `PushState`）。 */
export interface PushState {
  distance: string | number;
}

/** `resizable` 的配置（antd v6 新增）。 */
export interface DrawerResizableConfig {
  onResize?: (size: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

/** mask 的配置（本仓 `_util/hooks` 的 `MaskType` 对应物）。 */
export type MaskType = boolean | { enabled?: boolean; blur?: boolean; closable?: boolean };

/** `focusable` 的配置（antd `useFocusable`）。 */
export interface FocusableConfig {
  /** 关闭后是否把焦点还给触发元素。 */
  focusTriggerAfterClose?: boolean;
  /** 是否做焦点陷阱。 */
  trap?: boolean;
}

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
  size?: DrawerSize;
  /**
   * 关闭按钮。
   * ⚠️ 对象形态多一个 `placement: 'start' | 'end'`（决定按钮在标题栏的哪一侧）。
   */
  closable?:
    | boolean
    | {
        closeIcon?: VNodeChild;
        disabled?: boolean;
        placement?: 'start' | 'end';
        'aria-label'?: string;
      };
  closeIcon?: VNodeChild;
  onClose?: (e: Event) => void;
  children?: VNodeChild;
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
  /** @deprecated 请用 `styles.wrapper`。 */
  contentWrapperStyle?: CSSProperties;
}

/**
 * `Drawer` 的 props。
 *
 * 前 8 个字段来自 **rc-drawer**（本仓不引 rc 类型，逐条展开）；
 * 其余来自 antd 的 `DrawerProps` 自有字段与 `DrawerPanelProps`。
 */
export interface DrawerProps extends DrawerPanelProps {
  // ---------------------------- rc-drawer 侧 ----------------------------
  /** 是否显示。 */
  open?: boolean;
  placement?: DrawerPlacement;
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
  getContainer?: false | (() => HTMLElement);
  /** 即使没开也渲染（配合 `destroyOnHidden`）。 */
  forceRender?: boolean;
  /** 动效结束后的回调。 */
  afterOpenChange?: (open: boolean) => void;
  /** 关闭后是否卸载内容。 */
  destroyOnHidden?: boolean;
  /** 关闭后是否把焦点还给触发元素（rc 的 `focusTriggerAfterClose`）。 */
  focusTriggerAfterClose?: boolean;

  // ------------------------------ antd 自有 ------------------------------
  /** 尺寸预设/数值；`'default'` = 378、`'large'` = 736。 */
  size?: DrawerSize;
  /** 可拖拽改尺寸（v6 新增）。 */
  resizable?: boolean | DrawerResizableConfig;
  /** @deprecated 请用 `destroyOnHidden`。 */
  destroyOnClose?: boolean;
  /** 焦点行为。 */
  focusable?: FocusableConfig;
  /** 推挤容器（把 `#root` 推开）。 */
  push?: boolean | PushState;
  /** 面板根节点（透传给 watermark 等）。 */
  panelRef?: unknown;
  /** @deprecated 请用 `classNames.content` / `styles.content` 之外的 `section`。 */
  destroyInactivePanel?: boolean;
  /** 根节点的类名（antd 的 `rootClassName`）。 */
  rootClassName?: string;
  /** 根节点的内联样式（v5 起 `style` 语义改到 `rootStyle`）。 */
  rootStyle?: CSSProperties;
  /** @deprecated 请用 `rootStyle`。 */
  drawerStyle?: CSSProperties;
  /** @deprecated 请用 `styles.mask`。 */
  maskStyle?: CSSProperties;
  /** 面板的 `aria-labelledby`（未传则用 `ariaId`）。 */
  ariaLabelledby?: string;
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
}

/** `_InternalPanelDoNotUseOrYouWillBeFired` 的 props。 */
export interface DrawerPurePanelProps extends DrawerPanelProps {
  style?: CSSProperties;
  className?: string;
  /** 默认 `'right'`。 */
  placement?: DrawerPlacement;
}
