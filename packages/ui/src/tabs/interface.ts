/**
 * Tabs 的类型契约（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/tabs/index.d.ts`（+ `TabPane.d.ts`）与 rc 内核
 * `@rc-component/tabs@1.13.0` 的 `es/interface.d.ts`（**重新定义**，不搬运，H2）。
 * 判据逐条见 `docs/analysis/tabs.md`。
 *
 * ── Vue 化映射（COMPATIBILITY.md 的规则）───────────────────────────────────────
 *
 * | React | Vue | 规则 |
 * |---|---|---|
 * | `activeKey` + `onChange` | `v-model:activeKey`（同时发 `change`，C11） | §3 |
 * | `onTabClick` / `onEdit` / `onTabScroll` | **emits**（载荷与 antd 同形） | C5 |
 * | `renderTabBar` | **scoped slot** `#tabBar`（槽参数 = rc 的 `RenderTabBarProps`） | C8 |
 * | `more.popupRender` | **scoped slot** `#morePopup`（`(menu, { restTabs, onClose })`） | C8 |
 * | `tabBarExtraContent`（`ReactNode \| {left,right}`） | `#extra` 槽（带 `position` 参数）+ 同形 prop | C8 |
 * | `TabsRef.nativeElement` | `expose({ nativeElement })` | 同上游 |
 * | `Tabs.TabPane`（children 兼容写法） | **不实现**（v6 已 deprecated），只发告警 | UPSTREAM |
 *
 * ── 与本仓其它组件的两处差异（刻意）─────────────────────────────────────────────
 *
 * 1. **语义槽是「8 个平铺 + 1 个嵌套」**（`popup` 是 `{ root }`）—— 与 antd 的
 *    `TabsSemanticType` 同形。⚠️ rc 侧消费的是**扁平**的 `classNames.popup`，所以 G4 在
 *    传给内部组件时要**展平**（`popup: mergedClassNames.popup?.root`）。
 * 2. **有 expose**（`nativeElement`）—— 与 pagination 的「无 expose」相反。
 */

import type { CSSProperties, VNodeChild } from 'vue';

// ---------------------------------------------------------------------------
// 基础联合
// ---------------------------------------------------------------------------

/** 页签类型。 */
export type TabsType = 'line' | 'card' | 'editable-card';

/** 页签位置（**废弃**写法，保留以兼容）。 */
export type TabPosition = 'top' | 'right' | 'bottom' | 'left';

/** 页签位置（新写法，`start`/`end` 会按 RTL 映射成 `left`/`right`）。 */
export type TabPlacement = 'top' | 'end' | 'bottom' | 'start';

/** `indicator.size` 的三形态：数字 / 按基准长度求值 / 缺省（= 页签自身长度）。 */
export type GetIndicatorSize = number | ((origin: number) => number);

/** 增删页签的事件载荷（与 rc 同类）。 */
export type TabsEditEvent = MouseEvent | KeyboardEvent;

/** `onEdit` 的 action。 */
export type TabsEditAction = 'add' | 'remove';

// ---------------------------------------------------------------------------
// items
// ---------------------------------------------------------------------------

/**
 * 一个页签。
 *
 * ⚠️ `destroyInactiveTabPane` 是**每个 item** 也支持的历史写法（antd 的
 *    `items?: (Tab & CompatibilityProps)[]`），G4 在归一化时映射到 `destroyOnHidden`。
 */
export interface TabsItem {
  key: string;
  label: VNodeChild;
  children?: VNodeChild;
  /** 图标（有 icon 且 label 是字符串时，标签会被包一层 `<span>`）。 */
  icon?: VNodeChild;
  disabled?: boolean;
  /** `false` ⇒ 不可删（仅 `type=\'editable-card\'` 有意义）。 */
  closable?: boolean;
  /** 自定义关闭图标（`null`/`false` + `closable` 未传 ⇒ 不可删）。 */
  closeIcon?: VNodeChild;
  /** 未激活时也渲染面板内容。 */
  forceRender?: boolean;
  /** 隐藏时销毁面板（item 级覆盖组件的同名字段）。 */
  destroyOnHidden?: boolean;
  /** @deprecated 用 `destroyOnHidden`。 */
  destroyInactiveTabPane?: boolean;
  style?: CSSProperties;
  className?: string;
}

// ---------------------------------------------------------------------------
// 语义化（antd `TabsSemanticType`：**8 个平铺 + 1 个嵌套**）
// ---------------------------------------------------------------------------

export interface TabsSemanticClassNames {
  root?: string;
  item?: string;
  remove?: string;
  indicator?: string;
  body?: string;
  content?: string;
  header?: string;
  /** ⚠️ 嵌套形状（antd 同形）；传给内部时要展平成扁平值。 */
  popup?: { root?: string };
}

export interface TabsSemanticStyles {
  root?: CSSProperties;
  item?: CSSProperties;
  remove?: CSSProperties;
  indicator?: CSSProperties;
  body?: CSSProperties;
  content?: CSSProperties;
  header?: CSSProperties;
  popup?: { root?: CSSProperties };
}

/** 语义化输入：对象或函数（对应 antd 的 `GenerateSemantic<TabsSemanticType, TabsProps>`）。 */
export type TabsSemanticValue<T> = T | ((info: { props: TabsProps }) => T);

/** antd 的 `TabsSemanticAllType`（手写形态）。 */
export interface TabsSemanticAllType {
  classNames: TabsSemanticClassNames;
  classNamesAndFn: TabsSemanticValue<TabsSemanticClassNames>;
  styles: TabsSemanticStyles;
  stylesAndFn: TabsSemanticValue<TabsSemanticStyles>;
}

// ---------------------------------------------------------------------------
// 溢出下拉（antd 的 `more` / rc 的 `MoreProps`）
// ---------------------------------------------------------------------------

/** `more.popupRender` 的槽参数（rc 的 `PopupRender` 第二参数）。 */
export interface TabsMorePopupInfo {
  /** 未显示的页签。 */
  restTabs: TabsItem[];
  onClose: () => void;
}

/**
 * `more` 的配置。
 *
 * ⚠️ `transitionName` 由 antd **强制**为 `{rootPrefixCls}-slide-up`（不是组件前缀）——
 *    调用方给的同名值会被覆盖（PITFALLS 180 同族：动效名写错会静默失效）。
 */
export interface TabsMoreProps {
  icon?: VNodeChild;
  popupRender?: (menu: VNodeChild, info: TabsMorePopupInfo) => VNodeChild;
  /** 浮层的其余 props（透传给本仓 Dropdown 家族）。 */
  [key: string]: unknown;
}

/** 指示条的合并后配置（`indicator` / `indicatorSize` / ConfigProvider 三源合并的结果）。 */
export interface TabsIndicator {
  /** 对齐：`start` / `center`（默认）/ `end`。 */
  align?: 'start' | 'center' | 'end';
  /** 长度：数字 / 按基准长度求值 / 缺省（= 页签自身长度）。 */
  size?: GetIndicatorSize;
}

/**
 * `animated` 的对象形态。
 *
 * ⚠️ 默认值是 `{ inkBar: true, tabPane: false }`（**面板默认无动画**）；
 * "`animated === undefined`" 与 "`animated === true`" 的结果**不同**（前者面板无动画）。
 */
export interface TabsAnimatedConfig {
  /** 指示条的位移是否带过渡（默认 `true`）。 */
  inkBar?: boolean;
  /** 面板切换是否带动画（默认 `false`）。 */
  tabPane?: boolean;
}

/** `tabBarExtraContent` 的两种形态：单个节点（放 right）或分左右。 */
export type TabsExtraContent = VNodeChild | { left?: VNodeChild; right?: VNodeChild };

/** 语言包分片（rc 的 `TabsLocale`）。 */
export interface TabsLocale {
  dropdownAriaLabel?: string;
  removeAriaLabel?: string;
  addAriaLabel?: string;
}

/** `editable-card` 的内部配置（antd 壳组装后传给内核）。 */
export interface TabsEditableConfig {
  /** ⚠️ `type=\'add\'` 时调用方拿到的是**事件对象**、`remove` 时是 **key**。 */
  onEdit: (type: TabsEditAction, info: { key?: string; event: TabsEditEvent }) => void;
  showAdd?: boolean;
  removeIcon?: VNodeChild;
  addIcon?: VNodeChild;
}

/** `#tabBar` 槽 / `renderTabBar` 拿到的参数（= rc 的 `RenderTabBarProps` 的 Vue 化）。 */
export interface TabsRenderTabBarProps {
  id: string | null;
  activeKey: string;
  tabPosition: TabPosition;
  rtl: boolean;
  mobile: boolean;
  editable?: TabsEditableConfig;
  locale?: TabsLocale;
  more: TabsMoreProps;
  tabBarGutter?: number;
  onTabClick: (key: string, event: TabsEditEvent) => void;
  onTabScroll?: (info: { direction: 'left' | 'right' | 'top' | 'bottom' }) => void;
  extra?: TabsExtraContent;
  style?: CSSProperties;
  indicator?: TabsIndicator;
}

/** 实例句柄（antd 的 `TabsRef`）。 */
export interface TabsRef {
  nativeElement: HTMLElement | null;
}

// ---------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------

/**
 * `Tabs` 的 props。
 *
 * ⚠️ antd 的 `TabsProps` 是 `BaseTabsProps & CompatibilityProps & Omit<RcTabsProps, …>`；
 *    本仓按「最终对外形状」定义（H2：重新定义而不是搬运继承链）。
 */
export interface TabsProps {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  style?: CSSProperties;
  /** 页签类型。 */
  type?: TabsType;
  /** `card` / `editable-card` 的整体居中。 */
  centered?: boolean;
  /** 尺寸（未传走 ConfigProvider 的 `componentSize`）。 */
  size?: 'small' | 'default' | 'large';
  /** 位置（新写法；`start`/`end` 在 RTL 下映射为 `right`/`left`）。 */
  tabPlacement?: TabPlacement;
  /** @deprecated 用 `tabPlacement`。 */
  tabPosition?: TabPosition;
  /** 受控激活页签（`v-model:activeKey`）。 */
  activeKey?: string;
  defaultActiveKey?: string;
  /**
   * 根节点的 `id`，同时被用作 aria 关联的前缀（`{id}-tab-{key}` / `{id}-panel-{key}`）。
   *
   * ⚠️ **不传时是异步生成的**（首帧 `null` ⇒ 首帧没有 `aria-controls` / `aria-labelledby`），
   *    这是上游的刻意行为（避免 SSR 与客户端 id 不匹配）。做 DOM 对拍（L4）时要**显式传**
   *    它，否则两侧的首帧对不上。
   */
  id?: string;
  items?: TabsItem[];
  /** ⚠️ 兼容形态：只发 deprecated 告警，**不实现**（用 `items`）。 */
  children?: VNodeChild;
  renderTabBar?: (props: TabsRenderTabBarProps) => VNodeChild;
  onChange?: (activeKey: string) => void;
  onTabClick?: (key: string, event: TabsEditEvent) => void;
  onTabScroll?: (info: { direction: 'left' | 'right' | 'top' | 'bottom' }) => void;
  /** ⚠️ 载荷被改写：`add` ⇒ 透传**事件**；`remove` ⇒ 透传**key**。 */
  onEdit?: (target: TabsEditEvent | string, action: TabsEditAction) => void;
  /** `type=\'editable-card\'` 时隐藏加号。 */
  hideAdd?: boolean;
  addIcon?: VNodeChild;
  removeIcon?: VNodeChild;
  /** @deprecated 用 `more.icon`。 */
  moreIcon?: VNodeChild;
  more?: TabsMoreProps;
  /** @deprecated 用 `classNames.popup`。 */
  popupClassName?: string;
  indicator?: TabsIndicator;
  /** @deprecated 用 `indicator={{ size }}`。 */
  indicatorSize?: GetIndicatorSize;
  /** 面板动画：`false` / `true` / 对象（默认 `{ inkBar: true, tabPane: false }`）。 */
  animated?: boolean | TabsAnimatedConfig;
  tabBarGutter?: number;
  tabBarStyle?: CSSProperties;
  tabBarExtraContent?: TabsExtraContent;
  /** 隐藏时销毁面板（**组件级**默认值；item 级可覆盖）。 */
  destroyOnHidden?: boolean;
  /** @deprecated 用 `destroyOnHidden`。 */
  destroyInactiveTabPane?: boolean;
  /** 语言包。 */
  locale?: TabsLocale;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  classNames?: TabsSemanticValue<TabsSemanticClassNames>;
  styles?: TabsSemanticValue<TabsSemanticStyles>;
}

// ---------------------------------------------------------------------------
// emits / slots
// ---------------------------------------------------------------------------

export interface TabsEmits {
  /** v-model:activeKey（C11：与 `change` 同发）。 */
  'update:activeKey': [activeKey: string];
  /** 激活页签真的变化时（反复点同一个不发）。 */
  change: [activeKey: string];
  /** 每次点击都发（含重复点击当前页签）。 */
  tabClick: [key: string, event: TabsEditEvent];
  /** 滚动（方向）。 */
  tabScroll: [info: { direction: 'left' | 'right' | 'top' | 'bottom' }];
  /** 增删页签（载荷与 antd 的 `onEdit` 同形：add ⇒ 事件、remove ⇒ key）。 */
  edit: [target: TabsEditEvent | string, action: TabsEditAction];
}

export interface TabsSlots {
  /** 自定义整条导航栏（替代 `renderTabBar`）。 */
  tabBar?: (props: TabsRenderTabBarProps) => VNodeChild;
  /** 自定义溢出下拉（替代 `more.popupRender`）。 */
  popupRender?: (menu: VNodeChild, info: TabsMorePopupInfo) => VNodeChild;
  /** 导航栏两侧的附加内容（替代 `tabBarExtraContent`）。 */
  extra?: (props: { position: 'left' | 'right' }) => VNodeChild;
}
