/**
 * List 的类型面（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/list/index.d.ts` / `Item.d.ts` / `context.d.ts`。
 * **逐字段对齐**（名称、可选性、默认值）。有意差异见
 * `packages/ui/src/list/README.md` §2 与 `docs/analysis/list.md` §5。
 *
 * ── 与 antd 类型面的四处**有据可查**的差异 ────────────────────────────────────
 *
 * 1. `children` 不在任何 Props 里（规则 C19）—— antd 的 `React.ReactNode` 在 Vue 侧是
 *    默认插槽：`List` 的 `ListSlot`、`List.Item` 的 `ListItemSlot`、
 *    `List.Item.Meta` 的 `ListItemMetaSlot`。
 * 2. `React.CSSProperties` → Vue 的 `CSSProperties`，`React.ReactNode` → `VNodeChild`
 *    （规则 C16 / C18）。`React.HTMLAttributes<HTMLDivElement>`（`ListItemProps extends …`）
 *    在 Vue 侧是 **attrs**（`inheritAttrs`），不进本接口。
 * 3. `React.Key` → `string | number`（规则 C16）。
 * 4. `ListRef` / `ListItemMetaRef` 的 `nativeElement` 声明为**可空**（上游声明非空，
 *    但首帧前同样是 `null`，与 `AvatarRef` / `CardRef` 同一条理由）。
 *
 * ── 两处**刻意保留**的上游形状 ────────────────────────────────────────────────
 *
 * - **内容类 prop 保持 `VNodeChild`**（`header` / `footer` / `loadMore` / `extra` /
 *   `title` / `description` / `avatar` / `emptyText`），数组类保持 `VNodeChild[]`
 *   （`actions`）—— 与 `card`（同组、最接近的先例）一致。
 *   ⚠️ `COMPATIBILITY.md` D111 的字面是「全部改为 slot」，与 card 的落地**不一致**；
 *   本组件取「与最近先例一致」这一侧，并登记进 `README §5`。
 * - `ListLocale.emptyText` 是**必填**（上游 `emptyText: React.ReactNode` 非可选）。
 *   ⚠️ 上游**没有** `useLocale('List')` —— `locale` 是纯 prop 覆盖，
 *   回退链是 `locale?.emptyText || renderEmpty?.('List') || <DefaultRenderEmpty/>`。
 *
 * ── 泛型（规则：SFC 泛型在本仓不用）──────────────────────────────────────────
 *
 * 上游 `ListProps<T>` / `InternalList<T>` 是泛型。本仓**组件实现**用非泛型默认实例化
 * （`T = unknown`），泛型只留在**类型导出**里（与 `listy` 同判）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';
import type { Gutter } from '../grid/interface';
import type { PaginationConfig } from '../pagination/interface';
import type { SpinProps } from '../spin/interface';

// ---------------------------------------------------------------------------
// 基础联合
// ---------------------------------------------------------------------------

/** 栅格列数。 */
export type ColumnCount = number;

/** 栅格的键。 */
export type ColumnType = 'gutter' | 'column' | Breakpoint;

/** `List` 的栅格配置。`gutter` 复用 `Row` 的 `Gutter` 类型。 */
export interface ListGridType {
  gutter?: Gutter;
  column?: ColumnCount;
  xs?: ColumnCount;
  sm?: ColumnCount;
  md?: ColumnCount;
  lg?: ColumnCount;
  xl?: ColumnCount;
  xxl?: ColumnCount;
  xxxl?: ColumnCount;
}

/** 尺寸。⚠️ `'default'` 仍被上游类型接受（**不加任何尺寸类**）。 */
export type ListSize = 'small' | 'default' | 'large';

/** 列表项布局。 */
export type ListItemLayout = 'horizontal' | 'vertical';

/** `List` 的 locale 覆盖（**纯 prop**，不读 ConfigProvider 的 locale）。 */
export interface ListLocale {
  /** 空态文案。 */
  emptyText: VNodeChild;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * `List` 的 props。逐字段对齐 antd 的 `ListProps<T>`。
 *
 * ⚠️ 上游的 `children?: React.ReactNode` 在 Vue 侧是**默认插槽**（`ListSlot`）。
 */
export interface ListProps<T = unknown> {
  /** 是否带边框。 */
  bordered?: boolean;
  /** 落在根元素上（在 ConfigProvider 的 `className` **之后**）。 */
  className?: string;
  /** 也落在根元素上（在 `className` **之后**）。 */
  rootClassName?: string;
  /** 根元素的内联样式（**覆盖** ConfigProvider 的 `style`）。 */
  style?: CSSProperties;
  /** 数据源。 */
  dataSource?: T[];
  /** 列表最外层右侧的内容（`-item-extra` 之外的另一个落点）。 */
  extra?: VNodeChild;
  /** 栅格配置。传了 ⇒ 根加 `-grid`、`Item` 外包 `Col`。 */
  grid?: ListGridType;
  /** 根元素 id。 */
  id?: string;
  /** 列表项布局。`'vertical'` ⇒ 根加 `-vertical`。 */
  itemLayout?: ListItemLayout;
  /** 加载中。`boolean` 会被包成 `{ spinning }`。 */
  loading?: boolean | SpinProps;
  /** 加载更多的内容（渲染在 `footer` / 分页**之后**的位置）。 */
  loadMore?: VNodeChild;
  /** 分页配置。`false`（默认）不渲染分页。 */
  pagination?: PaginationConfig | false;
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 行 key 的取值方式（函数或字段名）。 */
  rowKey?: ((item: T) => string | number) | keyof T;
  /** 逐项渲染。⚠️ **未传时该项渲染为 `null`**。 */
  renderItem?: (item: T, index: number) => VNodeChild;
  /** 尺寸。`'large'` / `'small'` 落 `-lg` / `-sm` 类名。 */
  size?: ListSize;
  /** 列表项之间是否显示分割线（默认 `true`）。 */
  split?: boolean;
  /** 列表头部。 */
  header?: VNodeChild;
  /** 列表底部。 */
  footer?: VNodeChild;
  /** 空态文案覆盖（**纯 prop**，见 `ListLocale` 的注释）。 */
  locale?: ListLocale;
}

/** `List` 暴露的实例。 */
export interface ListRef {
  nativeElement: HTMLDivElement | null;
}

/** `List` 的默认插槽。antd 的 `children` 在 Vue 侧即此插槽。 */
export type ListSlot = () => VNodeChild;

/** `ListContext` 的值（由 `List` 注入给 `List.Item`）。与上游一致。 */
export interface ListConsumerProps {
  grid?: ListGridType;
  itemLayout?: string;
}

// ---------------------------------------------------------------------------
// List.Item
// ---------------------------------------------------------------------------

/** `List.Item` 的语义化槽名。 */
export type ListItemSemanticName = keyof ListItemSemanticClassNames & keyof ListItemSemanticStyles;

/** `List.Item` 的语义化类名。 */
export interface ListItemSemanticClassNames {
  actions?: string;
  extra?: string;
}

/** `List.Item` 的语义化样式。 */
export interface ListItemSemanticStyles {
  actions?: CSSProperties;
  extra?: CSSProperties;
}

/**
 * `List.Item` 的 props。逐字段对齐 antd 的 `ListItemProps`。
 *
 * ⚠️ 上游的 `extends React.HTMLAttributes<HTMLDivElement>` 在 Vue 侧落进 **attrs**。
 */
export interface ListItemProps {
  /** 类名前缀。 */
  prefixCls?: string;
  /** 落在根元素上。 */
  className?: string;
  /** 根元素的内联样式。 */
  style?: CSSProperties;
  /** 语义化类名（`actions` / `extra` 两个槽）。 */
  classNames?: ListItemSemanticClassNames;
  /** 语义化样式（`actions` / `extra` 两个槽）。 */
  styles?: ListItemSemanticStyles;
  /** 额外内容。⚠️ `itemLayout === 'vertical'` 时它会独占 `-item-extra` 一格。 */
  extra?: VNodeChild;
  /** 操作区。每项一个 `<li>`，项间有 `-item-action-split`。⚠️ 空数组不渲染。 */
  actions?: VNodeChild[];
  /** grid 模式下 `Col` 的内联样式（由 `List` 传入）。 */
  colStyle?: CSSProperties;
}

/** `List.Item.Meta` 的 props。逐字段对齐 antd 的 `ListItemMetaProps`。 */
export interface ListItemMetaProps {
  /** 头像。 */
  avatar?: VNodeChild;
  /** 落在根元素上。 */
  className?: string;
  /** 根元素的内联样式。 */
  style?: CSSProperties;
  /** 描述。 */
  description?: VNodeChild;
  /** 类名前缀。 */
  prefixCls?: string;
  /** 标题。 */
  title?: VNodeChild;
}

/** `List.Item.Meta` 暴露的实例。 */
export interface ListItemMetaRef {
  nativeElement: HTMLDivElement | null;
}

/** `List.Item` 的默认插槽。 */
export type ListItemSlot = () => VNodeChild;

/** `List.Item.Meta` 的默认插槽。 */
export type ListItemMetaSlot = () => VNodeChild;

// ---------------------------------------------------------------------------
// ConfigProvider 上的配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `list` 配置。
 *
 * ⚠️ 与 card / empty **不同**：`List` 的配置面**多一层 `item`** —— 上游是
 * `useComponentConfig('list')` 取 `className` / `style`，`List.Item` 再取
 * `list?.item?.classNames` / `list?.item?.styles` 作为**语义化槽的底座**。
 */
export interface ListConfig {
  className?: string;
  style?: CSSProperties;
  item?: {
    classNames?: ListItemSemanticClassNames;
    styles?: ListItemSemanticStyles;
  };
}
