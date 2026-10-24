/**
 * Transfer 的 Apollo 类型契约。内容扩展使用 Vue scoped slots（ADR 0006 / F06）。
 * 包含 ListBody / Section 的内部类型；历史来源为 antd 6.6.4，当前 API 以本文件和公开文档为准。
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
  classNames?: TransferSemanticClassNames;
  styles?: TransferSemanticStyles;
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
  selectAllLabels?: [VNodeChild?, VNodeChild?];
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

/** Template extension points; evaluated during rendering, including intentionally empty slots. */
export interface TransferItemSlotProps {
  item: TransferItem;
  direction: TransferDirection;
  selected: boolean;
  disabled: boolean;
}

export interface TransferFooterSlotProps {
  direction: TransferDirection;
  selectedKeys: TransferKey[];
  totalCount: number;
}

export interface TransferSelectAllLabelSlotProps {
  direction: TransferDirection;
  selectedCount: number;
  totalCount: number;
}

export interface TransferListSlotProps {
  direction: TransferDirection;
  filteredItems: TransferItem[];
  selectedKeys: TransferKey[];
  disabled: boolean;
  onItemSelect: (key: TransferKey, selected: boolean) => void;
  onItemSelectAll: (keys: TransferKey[], selected: boolean | 'replace') => void;
  onItemRemove: (keys: TransferKey[]) => void;
  onScroll: (event: Event) => void;
}

export interface TransferSlots {
  item?: (props: TransferItemSlotProps) => VNodeChild;
  footer?: (props: TransferFooterSlotProps) => VNodeChild;
  list?: (props: TransferListSlotProps) => VNodeChild;
  selectAllLabel?: (props: TransferSelectAllLabelSlotProps) => VNodeChild;
}

/** Default list body props. */
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
