/**
 * Card 的类型面（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的
 * `es/card/Card.d.ts` / `CardMeta.d.ts` / `CardGrid.d.ts` / `index.d.ts`。
 * **逐字段对齐**（名称、可选性、默认值、`@deprecated` 标记）。
 * 有意差异见 `packages/ui/src/card/README.md` §2 与 `COMPATIBILITY.md` §9。
 *
 * ── 与 antd 类型面的四处**有据可查**的差异 ────────────────────────────────────
 *
 * 1. `children` 不在任何 Props 里（规则 C19）—— antd 的 `React.ReactNode` 在 Vue 侧是
 *    默认插槽：`Card` 的 `CardSlot`、`Card.Meta` 的 `CardMetaSlot`、`Card.Grid` 的
 *    `CardGridSlot`。
 * 2. `React.CSSProperties` → Vue 的 `CSSProperties`，`React.ReactNode` → `VNodeChild`
 *    （规则 C16 / C18）。`React.HTMLAttributes<HTMLDivElement>`（`Card` / `Card.Grid`
 *    的基座）在 Vue 侧是 **attrs**（`inheritAttrs`），不进 Props。
 * 3. `CardSemanticAllType` 是**手写**的接口而不是 `GenerateSemantic<...>` 的展开
 *    —— 与 skeleton / empty / divider / space 同一条理由与同一个形态。
 * 4. `CardRef` / `CardGridRef` / `CardMetaRef` 的 `nativeElement` 声明为**可空**
 *    （上游声明非空，但首帧前同样是 `null`，与 `SkeletonRef` / `DividerRef` 同一条理由）。
 *
 * ── 一处**刻意保留**的上游形状 ────────────────────────────────────────────────
 *
 * `Card` 的 `title` 在 antd 里被 `Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>`
 * 从 DOM 属性里摘掉。Vue 侧把它声明成 prop 即可达到同一效果
 * （不声明 ⇒ 落进 `attrs` ⇒ 变成原生 tooltip）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';
import type { TabsExtraContent, TabsItem, TabsProps } from '../tabs/interface';

// ---------------------------------------------------------------------------
// 基础联合
// ---------------------------------------------------------------------------

/** 卡片类型。 */
export type CardType = 'inner';

/**
 * 卡片尺寸。
 *
 * `Exclude<SizeType, 'large'> | 'default'` —— 逐字来自上游：
 * `'large'` 不被 Card 支持，`'default'` 已废弃（用 `'medium'`，传了会告警）。
 */
export type CardSize = Exclude<SizeType, 'large'> | 'default';

// ---------------------------------------------------------------------------
// tabList
// ---------------------------------------------------------------------------

/**
 * 一个页签。逐字段对齐上游的 `CardTabListType extends Omit<Tab, 'label'>`。
 *
 * ⚠️ `tab` 与 `label` **两个都保留**（`tab` 已废弃）。G4 的归一化是
 * `{ label: tab, ...item }` —— 即 **item 里若还有 `label`，它赢**（与上游逐字一致）。
 */
export interface CardTabListType extends Omit<TabsItem, 'label'> {
  key: string;
  /** @deprecated 请用 `label`。 */
  tab?: VNodeChild;
  label?: VNodeChild;
}

// ---------------------------------------------------------------------------
// 语义化 —— Card（7 槽）
// ---------------------------------------------------------------------------

/**
 * `Card` 的语义化类名七个槽位。与 antd 的 `CardSemanticType['classNames']` 一致。
 *
 * | 槽位 | 落点 |
 * |---|---|
 * | `root` | 根 `<div class="{prefixCls}">` |
 * | `header` | 有 head 时的 `<div class="{prefixCls}-head">` |
 * | `body` | 有 body 时的 `<div class="{prefixCls}-body">` |
 * | `extra` | head 里的 `<div class="{prefixCls}-extra">` |
 * | `title` | head 里的 `<div class="{prefixCls}-head-title">` |
 * | `actions` | `<ul class="{prefixCls}-actions">` |
 * | `cover` | 有 cover 时的 `<div class="{prefixCls}-cover">` |
 */
export interface CardSemanticClassNames {
  root?: string;
  header?: string;
  body?: string;
  extra?: string;
  title?: string;
  actions?: string;
  cover?: string;
}

export interface CardSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  body?: CSSProperties;
  extra?: CSSProperties;
  title?: CSSProperties;
  actions?: CSSProperties;
  cover?: CSSProperties;
}

/**
 * 语义化输入：对象或函数。
 *
 * 对应 antd `GenerateSemantic<CardSemanticType, CardProps>` 的
 * `classNamesAndFn` / `stylesAndFn`。函数式由裁决 `empty-semantic-fn` = B 决定支持。
 */
export type CardSemanticValue<T> = T | ((info: { props: CardProps }) => T);

/** antd 的 `CardSemanticType`（不含函数式的形态）。 */
export interface CardSemanticType {
  classNames?: CardSemanticClassNames;
  styles?: CardSemanticStyles;
}

/** antd 的 `CardSemanticAllType`（含函数式的完整形态）。 */
export interface CardSemanticAllType {
  classNames: CardSemanticClassNames;
  classNamesAndFn: CardSemanticValue<CardSemanticClassNames>;
  styles: CardSemanticStyles;
  stylesAndFn: CardSemanticValue<CardSemanticStyles>;
}

// ---------------------------------------------------------------------------
// 语义化 —— Card.Meta（5 槽）
// ---------------------------------------------------------------------------

/**
 * `Card.Meta` 的语义化类名五个槽位。与 antd 的 `CardMetaSemanticType['classNames']` 一致。
 *
 * | 槽位 | 落点 |
 * |---|---|
 * | `root` | 根 `<div class="{prefixCls}-meta">` |
 * | `section` | 有 title / description 时的 `<div class="{prefixCls}-meta-section">` |
 * | `avatar` | 有 avatar 时的 `<div class="{prefixCls}-meta-avatar">` |
 * | `title` | `<div class="{prefixCls}-meta-title">` |
 * | `description` | `<div class="{prefixCls}-meta-description">` |
 */
export interface CardMetaSemanticClassNames {
  root?: string;
  section?: string;
  avatar?: string;
  title?: string;
  description?: string;
}

export interface CardMetaSemanticStyles {
  root?: CSSProperties;
  section?: CSSProperties;
  avatar?: CSSProperties;
  title?: CSSProperties;
  description?: CSSProperties;
}

export type CardMetaSemanticValue<T> = T | ((info: { props: CardMetaProps }) => T);

/** antd 的 `CardMetaSemanticType`（不含函数式的形态）。 */
export interface CardMetaSemanticType {
  classNames?: CardMetaSemanticClassNames;
  styles?: CardMetaSemanticStyles;
}

/** antd 的 `CardMetaSemanticAllType`（含函数式的完整形态）。 */
export interface CardMetaSemanticAllType {
  classNames: CardMetaSemanticClassNames;
  classNamesAndFn: CardMetaSemanticValue<CardMetaSemanticClassNames>;
  styles: CardMetaSemanticStyles;
  stylesAndFn: CardMetaSemanticValue<CardMetaSemanticStyles>;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

/**
 * `Card` 的 props。逐字段对齐 antd 的 `CardProps`。
 *
 * ⚠️ 上游的 `extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>` 在 Vue 侧
 *    落进 **attrs**（`inheritAttrs`），不进本接口 —— 唯一的例外是 `title`：
 *    它必须声明成 prop，否则会变成原生 tooltip。
 */
export interface CardProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 卡片标题。 */
  title?: VNodeChild;
  /** 右上角操作区。 */
  extra?: VNodeChild;
  /** @deprecated 请用 `variant`。 */
  bordered?: boolean;
  /** @deprecated 请用 `styles.header`。 */
  headStyle?: CSSProperties;
  /** @deprecated 请用 `styles.body`。 */
  bodyStyle?: CSSProperties;
  /** 加载中（内容替换成 `Skeleton`）。 */
  loading?: boolean;
  /** 悬浮时的阴影与手型光标（根类名 `-hoverable`）。 */
  hoverable?: boolean;
  /** 根元素 id。 */
  id?: string;
  /** 尺寸。`'small'` 落 `-small` 类名；`'default'` 已废弃。 */
  size?: CardSize;
  /** 卡片类型。目前只有 `'inner'`（落 `-type-inner`）。 */
  type?: CardType;
  /** 封面。 */
  cover?: VNodeChild;
  /** 操作区。每项包一层 `<li><span>`，宽度均分。 */
  actions?: VNodeChild[];
  /** 页签列表（`tab` 已废弃，用 `label`）。 */
  tabList?: CardTabListType[];
  /** 页签栏两侧的附加内容。 */
  tabBarExtraContent?: TabsExtraContent;
  /**
   * 页签切换回调。
   *
   * ⚠️ 上游是 `onTabChange` **prop**（不是 `v-model`）—— 本仓保持 prop 形态
   *    （规则 C11 的双发不适用，因为上游没有 value/onChange 对）。
   */
  onTabChange?: (key: string) => void;
  /** 受控的当前页签。传了它就用 `activeKey`，否则用 `defaultActiveTabKey`（**不会同时传**）。 */
  activeTabKey?: string;
  /** 非受控的初始页签。 */
  defaultActiveTabKey?: string;
  /** 透传给内部 `Tabs` 的 props（受控键与 `tabBarExtraContent` 会被覆盖）。 */
  tabProps?: TabsProps;
  /** 语义化类名。 */
  classNames?: CardSemanticValue<CardSemanticClassNames>;
  /** 语义化样式。 */
  styles?: CardSemanticValue<CardSemanticStyles>;
  /** 形态。`'borderless'` ⇒ 不加 `-bordered` 类名（改用 `box-shadow-tertiary`）。 */
  variant?: 'borderless' | 'outlined';
}

/** `Card` 暴露的实例。 */
export interface CardRef {
  nativeElement: HTMLDivElement | null;
}

/** `Card` 的默认插槽。antd 的 `children` 在 Vue 侧即此插槽。 */
export type CardSlot = () => VNodeChild;

// ---------------------------------------------------------------------------
// Card.Grid
// ---------------------------------------------------------------------------

/**
 * `Card.Grid` 的 props。逐字段对齐 antd 的 `CardGridProps`。
 *
 * ⚠️ `hoverable` **默认 `true`**（与 `Card` 的 `hoverable` 默认 `false` **不同**）。
 * ⚠️ 上游的 `extends React.HTMLAttributes<HTMLDivElement>` 在 Vue 侧是 attrs。
 */
export interface CardGridProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 悬浮高亮。**默认 `true`**。 */
  hoverable?: boolean;
}

/** `Card.Grid` 暴露的实例。 */
export interface CardGridRef {
  nativeElement: HTMLDivElement | null;
}

/** `Card.Grid` 的默认插槽。 */
export type CardGridSlot = () => VNodeChild;

// ---------------------------------------------------------------------------
// Card.Meta
// ---------------------------------------------------------------------------

/**
 * `Card.Meta` 的 props。逐字段对齐 antd 的 `CardMetaProps`。
 *
 * ⚠️ 根元素上**没有** `-rtl`（`Card.Meta` 不读 `direction`，与 `Card` 不同）。
 */
export interface CardMetaProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 头像。 */
  avatar?: VNodeChild;
  /** 标题。 */
  title?: VNodeChild;
  /** 描述。 */
  description?: VNodeChild;
  /** 语义化类名。 */
  classNames?: CardMetaSemanticValue<CardMetaSemanticClassNames>;
  /** 语义化样式。 */
  styles?: CardMetaSemanticValue<CardMetaSemanticStyles>;
}

/** `Card.Meta` 暴露的实例。 */
export interface CardMetaRef {
  nativeElement: HTMLDivElement | null;
}

/** `Card.Meta` 的默认插槽。 */
export type CardMetaSlot = () => VNodeChild;

// ---------------------------------------------------------------------------
// ConfigProvider 上的配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `card` 配置。与 antd 的
 * `CardConfig = ComponentStyleConfig & Pick<CardProps,'classNames'|'styles'>` 一致。
 *
 * ⚠️ 与 anchor / masonry / breadcrumb 一致：走 (B) 通道，**类型未提升**进
 * `ConfigProvider` 的 (A) 通道 —— 运行时可用，只是类型宽。
 */
export type CardConfig = ComponentStyleConfig & Pick<CardProps, 'classNames' | 'styles'>;

/**
 * `ConfigProvider` 的 `cardMeta` 配置。与 antd 的 `CardMetaConfig` 一致。
 *
 * 🚨 **同一组件族的第二个配置键** —— `Card.Meta` 自己读 `components.cardMeta`，
 * 别漏（`useComponentConfig('cardMeta')`）。
 */
export type CardMetaConfig = ComponentStyleConfig & Pick<CardMetaProps, 'classNames' | 'styles'>;
