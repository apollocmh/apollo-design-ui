/** Public Layout family contracts: Vue content, state, events and native element refs. */

import type { ComputedRef, CSSProperties, VNodeChild } from 'vue';

/** 响应式断点。 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';

/** 折叠来源。 */
export type CollapseType = 'clickTrigger' | 'responsive';

/** Sider 主题。 */
export type SiderTheme = 'light' | 'dark';

// ================================ Layout ================================

export interface LayoutProps {
  /** 自定义前缀（BasicLayout 用 getPrefixCls('layout', …)）。 */
  prefixCls?: string;
  /** 是否有侧边栏（不传 ⇒ 自动检测）。 */
  hasSider?: boolean;
}

export interface LayoutSlots {
  default?: () => VNodeChild;
}

export interface SiderSlots extends LayoutSlots {
  /** Content of the owned toggle button; an existing slot wins over trigger data. */
  trigger?: () => VNodeChild;
}

export interface SiderEmits {
  'update:collapsed': (collapsed: boolean) => void;
  collapse: (collapsed: boolean, type: CollapseType) => void;
  breakpoint: (broken: boolean) => void;
}

/**
 * ConfigProvider 的 `layout` 配置面。
 * className 用于 Layout/Sider，style 只用于 Layout 本体。
 */
export interface LayoutConfig {
  className?: string;
  style?: CSSProperties;
}

/** 暴露给父组件的实例（Layout / Header / Footer / Content 共用）。 */
export interface LayoutRef {
  nativeElement: HTMLElement | null;
}

/** generator 注入的内部参数（Vue 侧由工厂函数闭包传入，不进 props）。 */
export interface LayoutGeneratorConfig {
  suffixCls?: string;
  tagName: 'header' | 'footer' | 'main' | 'div';
  displayName: string;
}

// ================================ Sider ================================

export interface SiderSemanticClassNames {
  root?: string;
  body?: string;
}

export interface SiderSemanticStyles {
  root?: CSSProperties;
  body?: CSSProperties;
}

/** 语义化函数形态的入参（antd 的 `GenerateSemantic`）。 */
export interface SiderSemanticContext {
  props: SiderProps;
}

export type SiderSemanticClassNamesFn = (context: SiderSemanticContext) => SiderSemanticClassNames;
export type SiderSemanticStylesFn = (context: SiderSemanticContext) => SiderSemanticStyles;

export interface SiderProps {
  prefixCls?: string;
  /** 是否可收起。@default false */
  collapsible?: boolean;
  /** 当前收起状态（受控）。 */
  collapsed?: boolean;
  'onUpdate:collapsed'?: (collapsed: boolean) => void;
  /** 非受控初始值。@default false */
  defaultCollapsed?: boolean;
  /** 翻转箭头方向。@default false */
  reverseArrow?: boolean;
  /** 收起状态变化回调。 */
  onCollapse?: (collapsed: boolean, type: CollapseType) => void;
  /** 零宽触发器样式。 */
  zeroWidthTriggerStyle?: CSSProperties;
  /** 自定义触发器（`null` ⇒ 不渲染触发器区）。 */
  trigger?: VNodeChild;
  /** 展开宽度。@default 200 */
  width?: number | string;
  /** 收起宽度。@default 80 */
  collapsedWidth?: number | string;
  /** 响应式断点。 */
  breakpoint?: Breakpoint;
  /** 主题。@default 'dark' */
  theme?: SiderTheme;
  /** 断点变化回调（挂载时立即以 `mql.matches` 调用一次）。 */
  onBreakpoint?: (broken: boolean) => void;
  /** 语义化类名（对象或函数）。 */
  classNames?: SiderSemanticClassNames | SiderSemanticClassNamesFn;
  /** 语义化样式（对象或函数）。 */
  styles?: SiderSemanticStyles | SiderSemanticStylesFn;
}

/** 暴露给父组件的实例。 */
export interface SiderRef {
  nativeElement: HTMLElement | null;
}

/** SiderContext（Menu 消费 `siderCollapsed`）。 */
export interface SiderContextProps {
  /**
   * 折叠态。⚠️ 必须是 **ComputedRef**（响应式引用）：Sider 的 context 对象在 setup
   * 里只建一次，提供裸布尔值 ⇒ Menu 只能拿到首帧快照，折叠联动完全失效
   * （Issue #32.1）。
   */
  siderCollapsed?: ComputedRef<boolean>;
}

/** LayoutContext（Sider 注册自己，Layout 据此算 has-sider）。 */
export interface LayoutContextProps {
  siderHook: {
    addSider: (id: string) => void;
    removeSider: (id: string) => void;
  };
}
