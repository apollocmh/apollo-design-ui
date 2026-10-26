/** Apollo List contracts. Content uses Vue slots; data and pagination remain props. */

import type { CSSProperties, VNodeChild } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';
import type { Gutter } from '../grid/interface';
import type {
  PaginationConfig,
  PaginationItemSlotProps,
  PaginationSizeChangerInfo,
  PaginationTotalSlotProps,
} from '../pagination/interface';
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
 * `List` 的数据与布局 props。逐项模板使用 `#item`。
 *
 * ⚠️ 上游的 `children?: React.ReactNode` 在 Vue 侧是**默认插槽**（`ListSlot`）。
 */
export interface ListProps<T = unknown> {
  /** 是否带边框。 */
  bordered?: boolean;
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

/** The index is relative to the current page. */
export interface ListItemSlotProps<T = unknown> {
  item: T;
  index: number;
}

export interface ListSlots<T = unknown> {
  default?: ListSlot;
  item?: (props: ListItemSlotProps<T>) => VNodeChild;
  header?: ListSlot;
  footer?: ListSlot;
  loadMore?: ListSlot;
  /** Content beside the list; an empty slot suppresses the matching prop. */
  extra?: ListSlot;
  paginationItemRender?: (props: PaginationItemSlotProps) => VNodeChild;
  paginationTotal?: (props: PaginationTotalSlotProps) => VNodeChild;
  paginationSizeChanger?: (props: PaginationSizeChangerInfo) => VNodeChild;
}

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
  /** 语义化类名（`actions` / `extra` 两个槽）。 */
  classNames?: ListItemSemanticClassNames;
  /** 语义化样式（`actions` / `extra` 两个槽）。 */
  styles?: ListItemSemanticStyles;
  /** 额外内容。两种布局都使用稳定的 `-item-extra` 语义容器。 */
  extra?: VNodeChild;
  /** 操作区。每项一个 `<li>`，项间有 `-item-action-split`。⚠️ 空数组不渲染。 */
  actions?: VNodeChild[];
  /** 用户配置的 grid 模式 `Col` 根内联样式；不改变根 List 的列数。 */
  colStyle?: CSSProperties;
}

/** Item slots take precedence over corresponding content props, even when empty. */
export interface ListItemSlots {
  default?: ListItemSlot;
  extra?: ListItemSlot;
  /** Each nonempty top-level node is an action; fragments are flattened. */
  actions?: ListItemSlot;
}

export interface ListItemRef {
  nativeElement: HTMLElement | null;
}

/** `List.Item.Meta` 的 props。逐字段对齐 antd 的 `ListItemMetaProps`。 */
export interface ListItemMetaProps {
  /** 头像。 */
  avatar?: VNodeChild;
  /** 描述。 */
  description?: VNodeChild;
  /** 类名前缀。 */
  prefixCls?: string;
  /** 标题。 */
  title?: VNodeChild;
}

export interface ListItemMetaSlots {
  avatar?: ListItemMetaSlot;
  title?: ListItemMetaSlot;
  description?: ListItemMetaSlot;
}

/** `List.Item.Meta` 暴露的实例。 */
export interface ListItemMetaRef {
  nativeElement: HTMLDivElement | null;
}

/** `List.Item` 的默认插槽。 */
export type ListItemSlot = () => VNodeChild;

/** `List.Item.Meta` 的内容插槽函数类型。 */
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
