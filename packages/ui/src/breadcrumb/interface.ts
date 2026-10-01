/**
 * Breadcrumb 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/breadcrumb/{Breadcrumb,BreadcrumbItem,BreadcrumbSeparator,index}.d.ts`
 * （**重新定义**，不复制 —— H2）。逐字段对齐名称、可选性与默认值。
 * 契约全文见 `docs/analysis/breadcrumb.md`。
 *
 * ── 四处平台映射（COMPONENT-RULES.md 规则 C16 / C18）─────────────────────────
 *
 * | antd | 本仓 | 理由 |
 * |---|---|---|
 * | `React.Key` | `BreadcrumbKey = string \| number` | 与 tree / listy / masonry / anchor 同判 |
 * | `React.ReactNode` | `VNodeChild` | |
 * | `React.CSSProperties` | `Record<string, string \| number>` | 本仓内联样式惯例 |
 * | `React.MouseEventHandler<…>` | 原生 `MouseEvent` | Vue 没有合成事件 |
 *
 * ── 三处**不能照抄**的地方 ──────────────────────────────────────────────────
 *
 * 1. **泛型 `<T extends AnyObject>` 不落地**（SFC 无泛型先例）⇒ `params` 是
 *    `Record<string, unknown>`，泛型只留在**类型导出**里。⚠️ 因此 `itemRender` 的入参
 *    **不能写窄**（函数参数逆变 ⇒ TS2322）。
 * 2. **`children` 在 Vue 侧是插槽**（规则 C19）⇒ 不进 `BreadcrumbProps`，进 `BreadcrumbSlots`。
 *    但 `BreadcrumbItemType.children`（item **数据**里的嵌套项，已废弃）**要保留** ——
 *    它不是插槽，是 `menu.items` 的旧通道。
 * 3. **`React.AriaAttributes` 不展开**：本仓的 `aria-*` 一律走 `attrs`（无先例把
 *    `AriaAttributes` 铺成 prop）⇒ 用**模板字面量索引签名**表达 `pickAttrs` 能吃到的键。
 *
 * ── 本组件**没有**的东西（「有」比「没有」更容易搞错）──────────────────────────
 *
 * - **没有 emits**：根 `<nav>` 上不挂任何组件事件；item 的 `onClick` 是**数据字段**
 *   （随 `items` 传入、落到链接元素上），不是组件事件。
 * - **`ref` 不是 DOM**：`BreadcrumbRef = { nativeElement }`（上游走 `useImperativeHandle`）
 *   ⇒ Vue 侧 `expose({ nativeElement })`，**不要** `expose` 元素本身。
 */

import type { VNodeChild } from 'vue';
import type { DropdownProps } from '../dropdown/interface';
import type { MenuProps } from '../menu/interface';

/** `React.Key` 的 Vue 对应物。 */
export type BreadcrumbKey = string | number;

/** `params` 的类型（泛型 `T` 的非泛型实例化）。 */
export type BreadcrumbParams = Record<string, unknown>;

// ---------------------------------------------------------------------------
// 数据项
// ---------------------------------------------------------------------------

/**
 * `items` / `routes` 里的一项（上游 `BreadcrumbItemType`）。
 *
 * ⚠️ `href` 与 `path` 的语义**不同**：`href` 是直给链接；`path` 会**累加**前面所有
 * `path` 再拼成 `#/a/b/c`（见 `docs/analysis/breadcrumb.md` §2.3）。
 */
export interface BreadcrumbItemType {
  key?: BreadcrumbKey | undefined;
  /** 直给链接。 */
  href?: string | undefined;
  /** 累加式路径（`getPath(params, path)` 后再逐级拼）。 */
  path?: string | undefined;
  title?: VNodeChild;
  /** @deprecated 用 `title`。 */
  breadcrumbName?: string | undefined;
  /** 下拉菜单（会让这一项被 `Dropdown` 包一层）。 */
  menu?: BreadcrumbItemMenu | undefined;
  /** ⚠️ 落在**链接元素**（`<a>` / `<span>`）上，**不是** `<li>`（见分析 §6.2）。 */
  className?: string | undefined;
  /** ⚠️ 上游读码结论：**两条路径下都落不到 DOM**（待 G10 oracle 实测，分析 §6.2）。 */
  style?: Record<string, string | number> | undefined;
  /** 透传给 `Dropdown`。 */
  dropdownProps?: DropdownProps | undefined;
  onClick?: ((e: MouseEvent) => void) | undefined;
  /** @deprecated 用 `menu`。**这是数据字段，不是插槽**。 */
  children?: Omit<BreadcrumbItemType, 'children'>[] | undefined;

  /** `aria-*` 透传（`pickAttrs(item, { aria: true })`）。 */
  [key: `aria-${string}`]: string | number | boolean | undefined;
  /** `data-*` 透传（`pickAttrs(item, { data: true })`）。 */
  [key: `data-${string}`]: string | undefined;
}

/** `type: 'separator'` 的项（上游 `BreadcrumbSeparatorType`）。 */
export interface BreadcrumbSeparatorType {
  type: 'separator';
  separator?: VNodeChild;
}

/**
 * `items` 的元素类型（上游叫 `ItemType` / `InternalRouteType`）。
 *
 * ⚠️ 刻意**不叫** `ItemType`：那个名字太泛，导出会与其它包撞名（本仓的既有裁决：
 * 跨包重名按 antd 的做法**不导出**）。
 */
export type BreadcrumbItemInput = Partial<BreadcrumbItemType & BreadcrumbSeparatorType>;

/** `menu.items` 的一项（上游 `BreadcrumbItem.tsx` 的 `MenuItem`）。 */
export interface BreadcrumbMenuItem {
  key?: BreadcrumbKey | undefined;
  title?: VNodeChild;
  label?: VNodeChild;
  /** 相对 `href` 的路径（存在时 label 会被包成 `<a href={href + path}>`）。 */
  path?: string | undefined;
  href?: string | undefined;
}

/** item 的 `menu`（上游 `Omit<DropdownProps['menu'], 'items'> & { items?: MenuItem[] }`）。 */
export type BreadcrumbItemMenu = Omit<MenuProps, 'items'> & {
  items?: BreadcrumbMenuItem[] | undefined;
};

// ---------------------------------------------------------------------------
// 语义化（三个槽）
// ---------------------------------------------------------------------------

export interface BreadcrumbSemanticClassNames {
  root?: string | undefined;
  item?: string | undefined;
  separator?: string | undefined;
}

export interface BreadcrumbSemanticStyles {
  root?: Record<string, string | number> | undefined;
  item?: Record<string, string | number> | undefined;
  separator?: Record<string, string | number> | undefined;
}

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

export interface BreadcrumbProps {
  // ---------------------------------------------------------------- 样式
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-breadcrumb`。 */
  prefixCls?: string | undefined;
  className?: string | undefined;
  rootClassName?: string | undefined;
  style?: Record<string, string | number> | undefined;
  classNames?:
    | BreadcrumbSemanticClassNames
    | ((info: { props: BreadcrumbProps }) => BreadcrumbSemanticClassNames)
    | undefined;
  styles?:
    | BreadcrumbSemanticStyles
    | ((info: { props: BreadcrumbProps }) => BreadcrumbSemanticStyles)
    | undefined;

  // ---------------------------------------------------------------- 数据
  /** 数据源（推荐）。 */
  items?: BreadcrumbItemInput[] | undefined;
  /** @deprecated 用 `items`。 */
  routes?: BreadcrumbItemInput[] | undefined;
  /** 路径参数，用于替换 `title` / `path` 里的 `:key`。 */
  params?: BreadcrumbParams | undefined;
  /**
   * ⚠️ **本仓没有 `children` prop**（规则 C19）：上游的 `children` 在 Vue 侧是
   * **默认插槽**（`BreadcrumbSlots.default`），塞进 `BreadcrumbProps` 等于声明一个
   * 永远 `undefined` 的键（`spin` / `anchor` 同判）。它仍然**已废弃**。
   */

  // ---------------------------------------------------------------- 分隔符
  /** 分隔符。三级兜底：`separator ?? context.separator ?? '/'`。 */
  separator?: VNodeChild;
  /** 下拉箭头图标。三级兜底：`dropdownIcon ?? context.dropdownIcon ?? <DownOutlined />`。 */
  dropdownIcon?: VNodeChild;

  // ---------------------------------------------------------------- 渲染
  /**
   * 自定义每一项的渲染。
   *
   * ⚠️ 上游只传 **4 个实参**（`item, params, routes, path`）—— **没有 `href`**。
   * 默认实现（`renderItem`）拿得到 `href`，自定义渲染拿不到，这是上游的既有形状。
   */
  itemRender?:
    | ((
        route: BreadcrumbItemInput,
        params: BreadcrumbParams,
        routes: BreadcrumbItemInput[],
        paths: string[],
      ) => VNodeChild)
    | undefined;
}

/**
 * ⚠️ **本组件没有 `BreadcrumbEmits`**（不是漏写）：
 * 根 `<nav>` 上不挂任何组件事件 —— item 的 `onClick` 随 `items` 传入、
 * 落到链接元素上（数据字段，不是组件事件）。
 * 全仓约定：**没有事件就不声明 `XxxEmits`**（空 interface 会被 biome 的
 * `noBannedTypes` 拦下，而且「声明了但永远不触发」比不声明更容易误导）。
 */

/** `Breadcrumb` 的插槽（只有默认插槽 —— 对应废弃的 `children` 通道）。 */
export interface BreadcrumbSlots {
  default?: () => VNodeChild;
}

/** `expose` 出来的东西（上游 `useImperativeHandle` 的形状）。 */
export interface BreadcrumbExpose {
  /**
   * 根 `<nav>`。
   *
   * ⚠️ 上游类型是非空（`useImperativeHandle` 里带 `!`），本仓按 **`badge/Ribbon` /
   * `descriptions` 的既有约定**声明成**可空** —— 未挂载时确实是 `null`，
   * 类型上写非空只是把断言推给消费者。
   */
  nativeElement: HTMLElement | null;
}

/** `BreadcrumbRef` —— **不是** DOM 本身。 */
export type BreadcrumbRef = BreadcrumbExpose;

// ---------------------------------------------------------------------------
// Breadcrumb.Item（deprecated）
// ---------------------------------------------------------------------------

/** `Breadcrumb.Item` 的 props（上游 `BreadcrumbItemProps`）。 */
export interface BreadcrumbItemProps {
  prefixCls?: string | undefined;
  href?: string | undefined;
  menu?: BreadcrumbItemMenu | undefined;
  dropdownProps?: DropdownProps | undefined;
  dropdownIcon?: VNodeChild;
  onClick?: ((e: MouseEvent) => void) | undefined;
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
  /** 分隔符。⚠️ 默认 `'/'`，但**最后一项**会被 `Breadcrumb` 覆盖成 `''`。 */
  separator?: VNodeChild;
  key?: BreadcrumbKey | undefined;
}

/** `Breadcrumb.Item` 的插槽。 */
export interface BreadcrumbItemSlots {
  default?: () => VNodeChild;
}

// ---------------------------------------------------------------------------
// Breadcrumb.Separator（deprecated）
// ---------------------------------------------------------------------------

/**
 * ⚠️ **`Breadcrumb.Separator` 没有 props 类型**（不是漏写）：它只接一个默认插槽。
 *
 * 两处必须照抄上游的判据：
 * 1. **没有 `prefixCls` prop** —— 上游从 `ConfigContext` 取
 *    （`getPrefixCls('breadcrumb')`），与 `AnchorLink` 同族
 *    （PITFALLS 272：L4 基线生成器**每个用例都要包 ConfigProvider**）。
 * 2. 内容规则是 `children === '' ? children : children ?? '/'` —— **空串要原样保留**
 *    （不是回退成 `'/'`）。⚠️ 这条分支只在「直接使用 `<Breadcrumb.Separator>''</…>`」
 *    或 `items` 里 `type: 'separator'` + `separator: ''` 时才可达
 *    （最后一项的 `separator=''` 会被 `isRenderable` 拦在**不渲染**那一侧，见分析 §6.1）。
 */

/** `Breadcrumb.Separator` 的插槽（内容是 `children === '' ? children : children ?? '/'`）。 */
export interface BreadcrumbSeparatorSlots {
  default?: () => VNodeChild;
}
