/**
 * Transfer 的 Apollo 类型契约。内容扩展使用 Vue scoped slots（ADR 0006 / F06）。
 * 包含 ListBody / Section 的内部类型；历史来源为 antd 6.6.4，当前 API 以本文件和公开文档为准。
 */
import type { CSSProperties, VNodeChild } from 'vue';

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
  root?: CSSProperties;
  section?: CSSProperties;
  header?: CSSProperties;
  title?: CSSProperties;
  body?: CSSProperties;
  list?: CSSProperties;
  item?: CSSProperties;
  itemIcon?: CSSProperties;
  itemContent?: CSSProperties;
  footer?: CSSProperties;
  actions?: CSSProperties;
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
  listStyle?: CSSProperties | ((info: { direction: TransferDirection }) => CSSProperties);
  /** 操作区样式（⚠️ antd 6 已废弃 → `styles.actions`）。 */
  operationStyle?: CSSProperties;
  /** 操作按钮文案（⚠️ antd 6 已废弃 → `actions`）。 */
  operations?: VNodeChild[];
  /** 自定义操作按钮文案 `[向右, 向左]`。 */
  actions?: VNodeChild[];
  dataSource?: TransferItem[];
  targetKeys?: TransferKey[];
  selectedKeys?: TransferKey[];
  'onUpdate:targetKeys'?: TransferEmits['update:targetKeys'];
  'onUpdate:selectedKeys'?: TransferEmits['update:selectedKeys'];
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
  onScroll?: TransferEmits['scroll'];
  onChange?: TransferEmits['change'];
  onSearch?: TransferEmits['search'];
  onSelectChange?: TransferEmits['selectChange'];
}

export interface TransferEmits {
  'update:targetKeys': (keys: TransferKey[]) => void;
  'update:selectedKeys': (keys: TransferKey[]) => void;
  change: (
    targetKeys: TransferKey[],
    direction: TransferDirection,
    moveKeys: TransferKey[],
  ) => void;
  selectChange: (sourceSelectedKeys: TransferKey[], targetSelectedKeys: TransferKey[]) => void;
  search: (direction: TransferDirection, value: string) => void;
  scroll: (direction: TransferDirection, event: Event) => void;
}

export interface TransferRef {
  nativeElement: HTMLElement | null;
  /** Focus the first enabled control in this instance. */
  focus: (options?: FocusOptions) => void;
  /** Blur the focused control only when it belongs to this instance. */
  blur: () => void;
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
