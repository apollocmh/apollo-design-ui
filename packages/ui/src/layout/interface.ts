/**
 * Layout 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/layout/layout.d.ts` / `es/layout/Sider.d.ts`。
 * **逐字段对齐**（名称、可选性、默认值）。差异：`React.CSSProperties` → Vue 的
 * `CSSProperties`、`React.ReactNode` → `VNodeChild`（规则 C16 / C18）。
 */

import type { CSSProperties, VNodeChild } from 'vue';

/** 响应式断点（antd 的 `_util/responsiveObserver` 的 Breakpoint）。 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';

/** 折叠来源。 */
export type CollapseType = 'clickTrigger' | 'responsive';

/** Sider 主题。 */
export type SiderTheme = 'light' | 'dark';

// ================================ Layout ================================

export interface LayoutProps {
  /** 自定义前缀（BasicLayout 用 getPrefixCls('layout', …)）。 */
  prefixCls?: string;
  /** 根元素类名。 */
  className?: string;
  /** 根元素类名（语义化之前，排在 className 之后）。 */
  rootClassName?: string;
  /** 是否有侧边栏（不传 ⇒ 自动检测）。 */
  hasSider?: boolean;
  /** 根元素内联样式（**覆盖** ConfigProvider 的 layout.style）。 */
  style?: CSSProperties;
}

/**
 * ConfigProvider 的 `layout` 配置面（antd 的 `useComponentConfig('layout')`）。
 * 只有 className / style 两项参与 Layout 本体（Header/Footer/Content 不读）。
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
  /** 根元素类名。 */
  className?: string;
  /** 根元素内联样式。 */
  style?: CSSProperties;
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
  siderCollapsed?: boolean;
}

/** LayoutContext（Sider 注册自己，Layout 据此算 has-sider）。 */
export interface LayoutContextProps {
  siderHook: {
    addSider: (id: string) => void;
    removeSider: (id: string) => void;
  };
}
