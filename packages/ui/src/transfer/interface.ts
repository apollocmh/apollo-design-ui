/**
 * Transfer 的类型契约 —— antd 6.6.4 `es/transfer/interface.d.ts` 的机械移植
 * （+ `ListBody` / `Section` 的内部 props 类型，合并在同一处以避免循环 import）。
 */
import type { VNodeChild } from 'vue';

export type TransferKey = string | number;

export type PaginationType =
  | boolean
  | {
      pageSize?: number;
      simple?: boolean;
      showSizeChanger?: boolean;
      showLessItems?: boolean;
    };

export type TransferDirection = 'left' | 'right';

export type TransferItem = Record<string, unknown> & {
  key: TransferKey;
};

/** antd `render` prop：返回 `{ label, value }` 对象或直接返回节点。 */
export interface RenderResultObject {
  label?: VNodeChild;
  value?: string;
}

export type RenderResult = VNodeChild | RenderResultObject;

/** antd `selectAllLabels[i]`：字符串节点或 `(info) => 节点`。 */
export type SelectAllLabelRender =
  | VNodeChild
  | ((info: { selectedCount: number; totalCount: number }) => VNodeChild);

/** 语义结构（antd 6 语义化 classNames/styles，含 source/target 方向子结构）。 */
export interface TransferSemanticClassNames {
  root?: string;
  section?: string;
  header?: string;
  title?: string;
  body?: string;
  list?: string;
  item?: string;
  itemIcon?: string;
  itemContent?: string;
  footer?: string;
  actions?: string;
  source?: Partial<Omit<TransferSemanticClassNames, 'root' | 'actions' | 'source' | 'target'>>;
  target?: Partial<Omit<TransferSemanticClassNames, 'root' | 'actions' | 'source' | 'target'>>;
}

export interface TransferSemanticStyles {
  root?: Record<string, string>;
  section?: Record<string, string>;
  header?: Record<string, string>;
  title?: Record<string, string>;
  body?: Record<string, string>;
  list?: Record<string, string>;
  item?: Record<string, string>;
  itemIcon?: Record<string, string>;
  itemContent?: Record<string, string>;
  footer?: Record<string, string>;
  actions?: Record<string, string>;
  source?: Partial<Omit<TransferSemanticStyles, 'root' | 'actions' | 'source' | 'target'>>;
  target?: Partial<Omit<TransferSemanticStyles, 'root' | 'actions' | 'source' | 'target'>>;
}

export interface TransferLocale {
  titles?: VNodeChild[];
  notFoundContent?: VNodeChild | VNodeChild[];
  searchPlaceholder?: string;
  itemUnit?: string;
  itemsUnit?: string;
  remove?: string;
  selectAll?: string;
  deselectAll?: string;
  selectCurrent?: string;
  selectInvert?: string;
  removeAll?: string;
  removeCurrent?: string;
}

export interface TransferProps {
  prefixCls?: string;
  rootClassName?: string;
  className?: string;
  classNames?: TransferSemanticClassNames;
  styles?: TransferSemanticStyles;
  style?: Record<string, string>;
  /** 面板外联样式（⚠️ antd 6 已废弃 → `styles.section`，本仓保留兼容）。 */
  listStyle?:
    | Record<string, string>
    | ((info: { direction: TransferDirection }) => Record<string, string>);
  /** 操作区样式（⚠️ antd 6 已废弃 → `styles.actions`）。 */
  operationStyle?: Record<string, string>;
  /** 操作按钮文案（⚠️ antd 6 已废弃 → `actions`）。 */
  operations?: VNodeChild[];
  /** 自定义操作按钮文案 `[向右, 向左]`。 */
  actions?: VNodeChild[];
  dataSource?: TransferItem[];
  targetKeys?: TransferKey[];
  selectedKeys?: TransferKey[];
  selectAllLabels?: [SelectAllLabelRender?, SelectAllLabelRender?];
  locale?: TransferLocale;
  titles?: VNodeChild[];
  disabled?: boolean;
  showSearch?: boolean | { defaultValue?: string; placeholder?: string };
  showSelectAll?: boolean;
  /** 单向模式：右列渲染删除按钮、隐藏向左操作。 */
  oneWay?: boolean;
  pagination?: PaginationType;
  status?: 'error' | 'warning';
  selectionsIcon?: VNodeChild;
  filterOption?: (inputValue: string, item: TransferItem, direction: TransferDirection) => boolean;
  /** 行渲染（非对象返回值按文本降级：`getTextFromRenderResult`）。 */
  render?: (item: TransferItem) => RenderResult;
  footer?: (props: Record<string, unknown>, info?: { direction: TransferDirection }) => VNodeChild;
  /** 自定义列表面板（Transfer.List 的渲染入口；传入后根节点带 `-customize-list`）。 */
  children?: (props: Record<string, unknown>) => VNodeChild;
  rowKey?: (record: TransferItem) => TransferKey;
  onScroll?: (direction: TransferDirection, e: Event) => void;
  onChange?: (
    targetKeys: TransferKey[],
    direction: TransferDirection,
    moveKeys: TransferKey[],
  ) => void;
  onSearch?: (direction: TransferDirection, value: string) => void;
  onSelectChange?: (sourceSelectedKeys: TransferKey[], targetSelectedKeys: TransferKey[]) => void;
}

/** Section（Transfer.List）对外暴露的渲染入参（`renderList` 的调用面）。 */
export interface TransferListBodyProps {
  prefixCls: string;
  filteredItems: TransferItem[];
  filteredRenderItems: RenderedItem[];
  selectedKeys: TransferKey[];
  onItemSelect: (key: TransferKey, check: boolean, e?: { shiftKey?: boolean }) => void;
  onItemRemove?: (keys: TransferKey[]) => void;
  onScroll?: (e: Event) => void;
  disabled?: boolean;
  showRemove?: boolean;
  pagination?: PaginationType;
  remove?: string;
  classNames?: TransferSemanticClassNames;
  styles?: TransferSemanticStyles;
}

/** 列表项渲染结果（Section 内部传递）。 */
export interface RenderedItem {
  item: TransferItem;
  renderedEl: VNodeChild;
  renderedText: string;
}
