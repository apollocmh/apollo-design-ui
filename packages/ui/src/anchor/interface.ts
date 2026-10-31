import type { CSSProperties, VNodeChild } from 'vue';
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
export interface AnchorLinkProps extends Omit<AnchorLinkBaseProps, 'title'> {
  /** Title data; a present #title slot takes precedence, including empty content. */
  title?: VNodeChild;
  onClick?: (event: MouseEvent, link: AnchorLinkInfo) => void;
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
  root?: CSSProperties | undefined;
  item?: CSSProperties | undefined;
  itemTitle?: CSSProperties | undefined;
  indicator?: CSSProperties | undefined;
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
  getContainer?: (() => AnchorContainer | null | undefined) | undefined;
  /** 改写**高亮**（不改 `onChange` 的载荷）。 */
  getCurrentAnchor?: ((activeLink: string) => string) | undefined;
  /** 用 `replaceState` 而不是 `pushState`。 */
  replace?: boolean | undefined;

  /** Listener for the owned Vue change notification (original link, before highlight mapping). */
  onChange?: (currentActiveLink: string) => void;
  /** Listener for owned click. preventDefault cancels selection, scrolling and history. */
  onClick?: (event: MouseEvent, link: AnchorLinkInfo) => void;
}

export interface AnchorEmits {
  change: [currentActiveLink: string];
  click: [event: MouseEvent, link: AnchorLinkInfo];
}

export interface AnchorLinkEmits {
  click: [event: MouseEvent, link: AnchorLinkInfo];
}

/** A present default slot takes precedence over items, including an empty slot. */
export type AnchorSlots = { default?: () => VNodeChild };

/** `Anchor.Link` 的插槽。 */
export type AnchorLinkSlots = {
  title?: () => VNodeChild;
  default?: () => VNodeChild;
};
