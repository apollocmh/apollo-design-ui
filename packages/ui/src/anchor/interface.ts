/**
 * Anchor 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/anchor/{Anchor,AnchorLink,index}.d.ts`（**重新定义**，不复制 —— H2）。
 * 逐字段对齐名称、可选性与默认值。契约全文见 `docs/analysis/anchor.md`。
 *
 * ── 四处平台映射（COMPONENT-RULES.md 规则 C16 / C18）─────────────────────────
 *
 * | antd | 本仓 | 理由 |
 * |---|---|---|
 * | `React.Key` | `AnchorKey = string \| number` | 与 tree / listy / masonry 同判 |
 * | `React.ReactNode` | `VNodeChild` | |
 * | `React.CSSProperties` | `Record<string, string \| number>` | 本仓内联样式惯例 |
 * | `React.MouseEvent<…>` | 原生 `MouseEvent` | Vue 没有合成事件 |
 *
 * ── 本组件**没有**的东西（「有」比「没有」更容易搞错）──────────────────────────
 *
 * - **没有 `ref` / `expose`**：上游 `Anchor` 是 `React.FC`，**没有 forwardRef**
 *   ⇒ 不暴露 `nativeElement`（与 affix / masonry 不同）。
 * - **没有 `click` 事件**：上游的 `onClick` 是**自定义签名**的 prop
 *   （`(e, {title, href}) => void`），不是 DOM 事件。
 *   🚨 本仓**不能**把它声明成 `emits: ['click']` —— 那会把组件上的 `@click`
 *   从「原生事件」变成「组件事件」，根的 DOM 监听**不再挂上**（静默失效）。
 *   ⇒ `onClick` 只做 prop；`onChange` 走 `emit('change')`（它自己会调同名的 `onChange` prop）。
 */

import type { VNodeChild } from 'vue';
import type { AffixProps } from '../affix/interface';

/** `React.Key` 的 Vue 对应物。 */
export type AnchorKey = string | number;

/** 滚动容器。与上游的 `AnchorContainer` 一致。 */
export type AnchorContainer = HTMLElement | Window;

/** 方向。与上游的 `AnchorDirection` 一致。 */
export type AnchorDirection = 'vertical' | 'horizontal';

/** `affix` 传对象时的配置（上游 `Omit<AffixProps, 'offsetTop' | 'target' | 'children'>`）。 */
export type AnchorAffixConfig = Omit<AffixProps, 'offsetTop' | 'target'>;

// ---------------------------------------------------------------------------
// 链接
// ---------------------------------------------------------------------------

/** 单条链接的公共字段（上游 `AnchorLinkBaseProps`）。 */
export interface AnchorLinkBaseProps {
  prefixCls?: string | undefined;
  /** 必填。内部锚点形如 `#section-1`。 */
  href: string;
  /** `<a target>`。 */
  target?: string | undefined;
  /** 显示的文本。 */
  title: VNodeChild;
  /**
   * 落在 `.{prefixCls}-link` 上。
   *
   * ⚠️ 这是**共享基类型**的字段：既用于 `items[]` 的数据项（不是组件 prop），
   *    也被 `Anchor.Link` 组件继承。⇒ 不按「根别名」处理，保留。
   *    （根节点的类名请用 Vue 原生 `class`。）
   */
  className?: string | undefined;
  /** 单条覆盖 `Anchor` 的 `replace`。 */
  replace?: boolean | undefined;
  /** 单条的滚动偏移（也参与滚动侦测）。 */
  targetOffset?: number | undefined;
}

/** `Anchor.Link` 的 props（上游 `AnchorLinkProps`）。 */
export interface AnchorLinkProps extends AnchorLinkBaseProps {
  /** 子链接。⚠️ **仅垂直方向支持**（水平会发 usage 告警）。 */
  children?: VNodeChild;
}

/** `items` 里的一项（上游 `AnchorLinkItemProps`）。 */
export interface AnchorLinkItemProps extends AnchorLinkBaseProps {
  key: AnchorKey;
  /** **嵌套**子项。⚠️ 水平方向不支持（上游会发 usage 告警）。 */
  children?: AnchorLinkItemProps[] | undefined;
}

/** `onClick` 的第二个参数。 */
export interface AnchorLinkInfo {
  title: VNodeChild;
  href: string;
}

// ---------------------------------------------------------------------------
// 语义化（四个槽）
// ---------------------------------------------------------------------------

export interface AnchorSemanticClassNames {
  root?: string | undefined;
  item?: string | undefined;
  itemTitle?: string | undefined;
  indicator?: string | undefined;
}

export interface AnchorSemanticStyles {
  root?: Record<string, string | number> | undefined;
  item?: Record<string, string | number> | undefined;
  itemTitle?: Record<string, string | number> | undefined;
  indicator?: Record<string, string | number> | undefined;
}

// ---------------------------------------------------------------------------
// Anchor
// ---------------------------------------------------------------------------

export interface AnchorProps {
  // ---------------------------------------------------------------- 样式
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-anchor`。 */
  prefixCls?: string | undefined;
  classNames?:
    | AnchorSemanticClassNames
    | ((info: { props: AnchorProps }) => AnchorSemanticClassNames)
    | undefined;
  styles?:
    | AnchorSemanticStyles
    | ((info: { props: AnchorProps }) => AnchorSemanticStyles)
    | undefined;

  // ---------------------------------------------------------------- 数据
  /** 数据源（推荐）。 */
  items?: AnchorLinkItemProps[] | undefined;
  /**
   * ⚠️ **本仓没有 `children` prop**（规则 C19）：上游的 `children` 在 Vue 侧是
   * **默认插槽**（`AnchorSlots.default`），塞进 `AnchorProps` 等于声明一个永远
   * `undefined` 的键（`spin/Spin.vue` 同判）。
   * 它仍然**已废弃** —— 传了插槽内容会发废弃告警，用 `items` 代替。
   */

  // ---------------------------------------------------------------- 行为
  /** 方向。@default 'vertical' */
  direction?: AnchorDirection | undefined;
  /** 容器顶部偏移（同时喂给 `Affix` 与 `maxHeight` 计算）。 */
  offsetTop?: number | undefined;
  /** 命中判据的容差。@default 5 */
  bounds?: number | undefined;
  /** 滚动落点偏移（**优先于** `offsetTop`）。 */
  targetOffset?: number | undefined;
  /** 是否固钉。@default true（⚠️ 默认**开**） */
  affix?: boolean | AnchorAffixConfig | undefined;
  /** 非 affix 时是否仍显示指示条。@default false */
  showInkInFixed?: boolean | undefined;
  /** 滚动容器。回落到 ConfigProvider 的 `getTargetContainer`，再回落 `window`。 */
  getContainer?: (() => AnchorContainer) | undefined;
  /** 改写**高亮**（不改 `onChange` 的载荷）。 */
  getCurrentAnchor?: ((activeLink: string) => string) | undefined;
  /** 用 `replaceState` 而不是 `pushState`。 */
  replace?: boolean | undefined;

  // ---------------------------------------------------------------- 回调
  /**
   * 当前锚点变化（滚动或点击）。
   * ⚠️ 载荷是**原始 link**（不是 `getCurrentAnchor` 改写后的）。
   * ⚠️ 与 `emit('change')` 是**同一条通路**（emit 自己会调它）—— 不要再手写一遍（PITFALLS 267）。
   */
  onChange?: ((currentActiveLink: string) => void) | undefined;
  /**
   * 点击链接。**在滚动之前**调用。
   *
   * ⚠️ 这是**自定义签名**的 prop，不是 DOM 事件 ⇒ 不声明 `emits: ['click']`
   * （那会让组件上的 `@click` 不再挂到根元素上）。
   */
  onClick?: ((e: MouseEvent, link: AnchorLinkInfo) => void) | undefined;
}

/**
 * 事件。
 *
 * ⚠️ **只有 `change`**：
 * - `change` 与 `onChange` 是同一条通路（`emit` 自己会调同名 prop）；
 * - `onClick` **不是**事件（自定义签名，见 `AnchorProps.onClick` 的说明）。
 */
export interface AnchorEmits {
  change: [currentActiveLink: string];
}

/** `Anchor` 的插槽（只有默认插槽 —— 对应废弃的 `children`）。 */
export interface AnchorSlots {
  default?: () => VNodeChild;
}

/** `Anchor.Link` 的插槽。 */
export interface AnchorLinkSlots {
  default?: () => VNodeChild;
}
