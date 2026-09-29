/**
 * Tree 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/tree/Tree.d.ts` + `DirectoryTree` 的行为面 + `@rc-component/tree`
 * 1.4.0 的 `Tree.d.ts` / `interface.d.ts`（antd 用 `Omit<RcTreeProps, ...>` 继承）。
 * 分析见 `docs/analysis/tree.md`（G1，R1–R8 已闭环）。
 *
 * ── Vue 化映射（COMPATIBILITY.md §1–§4 的规则）────────────────────────────────
 *   · `expandedKeys` / `checkedKeys` / `selectedKeys` / `loadedKeys` + onExpand/onCheck/
 *     onSelect/onLoad → `v-model:*` + `update:*` + `expand`/`check`/`select`/`load`
 *     语义事件**同发**（规则 C11）
 *   · 拖拽 7 个 onDragXxx / onClick / onMouseEnter 等 → 纯 emit（Vue 事件面）
 *   · `title`（fn）→ scoped slot `#title`；`titleRender` prop 保留 fn（C8-R2）
 *   · `icon` / `switcherIcon` / `switcherLoadingIcon` / `draggable.icon` 保留 VNode|fn
 *     —— iconUtil 需要按节点态分支，属 D111 程序化上下文例外清单
 *   · `<TreeNode>` children 形态：v6 已 deprecated（rc gDSFP 传 children 时告警），
 *     本仓**不实现**——传 children 时 dev 告警指回 treeData（UPSTREAM 同判）
 *   · `classNames` / `styles` 5 槽支持**函数形态**（GenerateSemantic）
 *   · `checkable` 支持 `boolean | VNode`（antd 传 `<span class="{p}-checkbox-inner">`）
 *
 * ⚠️ 禁止 any / as any / @ts-expect-error（H10）。
 */

import type { CSSProperties, VNodeChild } from 'vue';

// ---------------------------------------------------------------------------
// 数据结构（rc interface.d.ts 逐字段对齐）
// ---------------------------------------------------------------------------

/** `React.Key` 的 Vue 对应物；`SafeKey` 排除 bigint（rc :88-95 的既有约束）。 */
export type TreeKey = string | number;
export type SafeKey = Exclude<TreeKey, bigint>;

/** rc `FieldDataNode`：用户数据节点 + 递归 children（字段名可由 fieldNames 改写）。 */
export interface BasicDataNode {
  checkable?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  icon?: TreeIconType;
  isLeaf?: boolean;
  selectable?: boolean;
  switcherIcon?: TreeIconType;
  className?: string;
  style?: CSSProperties;
}

export type FieldDataNode<T, ChildFieldName extends string = 'children'> = BasicDataNode &
  T &
  Partial<Record<ChildFieldName, FieldDataNode<T, ChildFieldName>[]>>;

/** rc `DataNode`（默认字段名形态）。 */
export type DataNode = FieldDataNode<{
  key: TreeKey;
  title?: VNodeChild | ((data: DataNode) => VNodeChild);
}>;

/** rc `EventDataNode`：事件回调里的节点（数据 + 运行时态）。 */
export type EventDataNode<TreeDataType extends BasicDataNode = DataNode> = {
  key: TreeKey;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
  loaded: boolean;
  loading: boolean;
  halfChecked: boolean;
  dragOver: boolean;
  dragOverGapTop: boolean;
  dragOverGapBottom: boolean;
  pos: string;
  active: boolean;
} & TreeDataType &
  BasicDataNode;

/** rc `FieldNames`（`_title` 仅 tree-select 内部使用，保留字段不公开）。 */
export interface TreeFieldNames {
  title?: string;
  key?: string;
  children?: string;
}

/** rc `DataEntity`（键实体表值；keyEntities 的公开形态）。 */
export interface TreeDataEntity<TreeDataType extends BasicDataNode = DataNode> {
  index: number;
  key: SafeKey;
  pos: string;
  level: number;
  node: TreeDataType;
  nodes: TreeDataType[];
  children?: TreeDataEntity<TreeDataType>[];
  parent?: TreeDataEntity<TreeDataType>;
}

// ---------------------------------------------------------------------------
// 图标 / 回调形态（D111 例外清单：程序化上下文保留 VNode|fn）
// ---------------------------------------------------------------------------

/** 节点态传给 icon/switcherIcon fn 的参数（rc `TreeNodeProps` 的只读子集）。 */
export interface TreeNodeRenderInfo<TreeDataType extends BasicDataNode = DataNode> {
  eventKey?: TreeKey;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  loaded?: boolean;
  loading?: boolean;
  halfChecked?: boolean;
  dragOver?: boolean;
  dragOverGapTop?: boolean;
  dragOverGapBottom?: boolean;
  pos?: string;
  data?: TreeDataType;
  isLeaf?: boolean;
  checkable?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  /** 展开函数等注入位与 rc 的 treeNodeProps 同构。 */
  [key: string]: unknown;
}

/** rc `IconType`：VNode 或按节点态求值的 fn。 */
export type TreeIconType = VNodeChild | ((props: TreeNodeRenderInfo) => VNodeChild);

/** rc `ExpandAction`。 */
export type TreeExpandAction = false | 'click' | 'doubleClick';

/** rc `DraggableFn` / `DraggableConfig`。 */
export type TreeNodeDraggableFn = (node: DataNode) => boolean;
export interface TreeDraggableConfig {
  /** `false` 显式关闭拖拽把手（默认渲染 HolderOutlined）。 */
  icon?: VNodeChild | false;
  nodeDraggable?: TreeNodeDraggableFn;
}
export type TreeDraggable = TreeNodeDraggableFn | boolean | TreeDraggableConfig;

/** rc `AllowDrop`。 */
export interface TreeAllowDropOptions<TreeDataType extends BasicDataNode = DataNode> {
  dragNode: TreeDataType;
  dropNode: TreeDataType;
  dropPosition: -1 | 0 | 1;
}
export type TreeAllowDrop<TreeDataType extends BasicDataNode = DataNode> = (
  options: TreeAllowDropOptions<TreeDataType>,
) => boolean;

// ---------------------------------------------------------------------------
// 事件信息（rc 逐字段）
// ---------------------------------------------------------------------------

export interface TreeExpandEventInfo<TreeDataType extends BasicDataNode = DataNode> {
  node: EventDataNode<TreeDataType>;
  expanded: boolean;
  nativeEvent: MouseEvent;
}

export interface TreeCheckInfo<TreeDataType extends BasicDataNode = DataNode> {
  event: 'check';
  node: EventDataNode<TreeDataType>;
  checked: boolean;
  nativeEvent: MouseEvent;
  checkedNodes: TreeDataType[];
  /** 仅非 checkStrictly（级联）时携带（rc [Legacy]，tree-select 依赖）。 */
  checkedNodesPositions?: { node: TreeDataType; pos: string }[];
  halfCheckedKeys?: SafeKey[];
}

export interface TreeSelectEventInfo<TreeDataType extends BasicDataNode = DataNode> {
  event: 'select';
  selected: boolean;
  node: EventDataNode<TreeDataType>;
  selectedNodes: TreeDataType[];
  nativeEvent: MouseEvent;
}

export interface TreeLoadEventInfo<TreeDataType extends BasicDataNode = DataNode> {
  event: 'load';
  node: EventDataNode<TreeDataType>;
}

export interface TreeDragEventInfo<TreeDataType extends BasicDataNode = DataNode> {
  event: MouseEvent;
  node: EventDataNode<TreeDataType>;
}

export interface TreeDragEnterEventInfo<TreeDataType extends BasicDataNode = DataNode>
  extends TreeDragEventInfo<TreeDataType> {
  expandedKeys: TreeKey[];
}

export interface TreeDropEventInfo<TreeDataType extends BasicDataNode = DataNode>
  extends TreeDragEventInfo<TreeDataType> {
  dragNode: EventDataNode<TreeDataType>;
  dragNodesKeys: TreeKey[];
  dropPosition: number;
  dropToGap: boolean;
}

// ---------------------------------------------------------------------------
// 语义化槽位（5 个；antd `TreeSemanticType`）
// ---------------------------------------------------------------------------

export interface TreeSemanticClassNames {
  root?: string;
  item?: string;
  itemIcon?: string;
  itemTitle?: string;
  itemSwitcher?: string;
}

export interface TreeSemanticStyles {
  root?: CSSProperties;
  item?: CSSProperties;
  itemIcon?: CSSProperties;
  itemTitle?: CSSProperties;
  itemSwitcher?: CSSProperties;
}

/** 函数形态（裁决 `empty-semantic-fn` = B）。 */
export type TreeSemanticValue<T> = T | ((info: { props: TreeProps }) => T);

// ---------------------------------------------------------------------------
// Props（antd 面 = Omit<rc TreeProps, ...> + antd 追加）
// ---------------------------------------------------------------------------

/** rc `checkedKeys` 的对象形态。 */
export interface TreeCheckedKeys {
  checked: SafeKey[];
  halfChecked: SafeKey[];
}

/**
 * `scrollTo` 的参数（rc 的 `ScrollTo` 配置：数字 / `{ key, autoExpand? }` / 对齐配置）。
 *
 * 🚨 **字段名是 `align`，不是 DOM `scrollIntoView` 的 `block` / `inline`**（2026-09-30 修）：
 *    原来这里写了 `block` / `inline`，但
 *      ①文档 `index.zh-CN.md` 的方法表写的是 `scrollTo({ key, autoExpand?, offset?, align? })`；
 *      ②实现（`Tree.ts` → `NodeList.ts`）把配置**原样透传**给 `@apollo-design/virtual-list`，
 *        而它的 `ScrollAlign = 'top' | 'bottom'`（对拍 rc-virtual-list）；
 *    三方只有本接口不一致 ⇒ 调用方按文档写 `align: 'top'` 会被类型系统拒绝
 *    （demo `scroll-to.vue` 就是这样暴露出来的），按接口写 `block` 则**静默失效**。
 *
 * ⚠️ 值域只到 `'top' | 'bottom'`（本仓 virtual-list 的 `ScrollAlign`），没有 `'auto'`。
 */
export interface TreeScrollConfig {
  key: TreeKey;
  autoExpand?: boolean;
  /** 距视口顶部的附加偏移（rc `itemScrollOffset`）。 */
  offset?: number;
  /** 对齐方式：贴顶 / 贴底。缺省时不滚动（见 virtual-list 的 scroll-target 契约）。 */
  align?: 'top' | 'bottom';
}

export interface TreeProps {
  // ---- 数据 ----
  /** 树数据（v6 主通道；`<TreeNode>` children 形态已 deprecated，不实现）。 */
  treeData?: DataNode[];
  /** 字段名映射（title / key / children）。 */
  fieldNames?: TreeFieldNames;

  // ---- 展开态 ----
  expandedKeys?: TreeKey[];
  defaultExpandedKeys?: TreeKey[];
  /** 默认展开全部（**只展开有 children 的节点** —— rc gDSFP 判据）。 */
  defaultExpandAll?: boolean;
  /** 默认展开父节点（受控 expandedKeys 首挂时也 conductExpandParent 补全祖先）。 */
  defaultExpandParent?: boolean;
  /** 展开受控时自动补全祖先（autoExpandParent）。 */
  autoExpandParent?: boolean;

  // ---- 勾选态 ----
  checkable?: boolean | VNodeChild;
  checkStrictly?: boolean;
  checkedKeys?: SafeKey[] | TreeCheckedKeys;
  defaultCheckedKeys?: SafeKey[];

  // ---- 选中态 ----
  selectable?: boolean;
  multiple?: boolean;
  selectedKeys?: TreeKey[];
  defaultSelectedKeys?: TreeKey[];

  // ---- 异步加载 ----
  loadData?: (node: EventDataNode) => Promise<unknown>;
  loadedKeys?: SafeKey[];

  // ---- 外观 ----
  showIcon?: boolean;
  showLine?: boolean | { showLeafIcon: boolean | TreeIconType };
  icon?: TreeIconType;
  switcherIcon?: TreeIconType;
  switcherLoadingIcon?: VNodeChild;
  blockNode?: boolean;
  /** 点击/双击节点时是否触发展开（DirectoryTree 默认 'click'）。 */
  expandAction?: TreeExpandAction;
  /** 标题渲染函数（`#title` slot 优先）。 */
  titleRender?: (node: DataNode) => VNodeChild;

  // ---- 禁用 / 拖拽 ----
  disabled?: boolean;
  draggable?: TreeDraggable;
  allowDrop?: TreeAllowDrop;

  // ---- 滚动 / 虚拟 ----
  /** 虚拟滚动容器高度（不传则不虚拟）。 */
  height?: number;
  /** 行高（antd 用 `paddingXS/2 + titleHeight` 计算，勿手传）。 */
  itemHeight?: number;
  scrollWidth?: number;
  virtual?: boolean;
  /** activeKey 滚动跟随时的附加偏移。 */
  itemScrollOffset?: number;

  // ---- 焦点 / ARIA ----
  focusable?: boolean;
  activeKey?: TreeKey | null;
  tabIndex?: number;
  /** rc 自述「TODO: full a11y」—— 现状键盘可达 + active 跟随；无 tree role（UPSTREAM）。 */

  // ---- 过滤 ----
  filterTreeNode?: (node: EventDataNode) => boolean;

  // ---- 常规 ----
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  style?: CSSProperties;
  /** @deprecated 请用 `styles.root`（antd v6 标记）。 */
  rootStyle?: CSSProperties;
  classNames?: TreeSemanticValue<TreeSemanticClassNames>;
  styles?: TreeSemanticValue<TreeSemanticStyles>;
}

// ---------------------------------------------------------------------------
// Emits（C11：v-model 与语义事件同发）
// ---------------------------------------------------------------------------

export interface TreeEmits {
  /** `v-model:expandedKeys`。 */
  (e: 'update:expandedKeys', keys: TreeKey[]): void;
  /** `v-model:checkedKeys`；checkStrictly 时为对象形态。 */
  (e: 'update:checkedKeys', keys: SafeKey[] | TreeCheckedKeys): void;
  /** `v-model:selectedKeys`。 */
  (e: 'update:selectedKeys', keys: TreeKey[]): void;
  /** `v-model:loadedKeys`。 */
  (e: 'update:loadedKeys', keys: SafeKey[]): void;
  /** 展开/收起（与 `update:expandedKeys` 同发）。 */
  (e: 'expand', keys: TreeKey[], info: TreeExpandEventInfo): void;
  /** 勾选（与 `update:checkedKeys` 同发；返回值形态随 checkStrictly）。 */
  (e: 'check', checked: SafeKey[] | TreeCheckedKeys, info: TreeCheckInfo): void;
  /** 选中（与 `update:selectedKeys` 同发）。 */
  (e: 'select', keys: TreeKey[], info: TreeSelectEventInfo): void;
  /** 异步加载完成（与 `update:loadedKeys` 同发）。 */
  (e: 'load', keys: SafeKey[], info: TreeLoadEventInfo): void;
  (e: 'click', evt: MouseEvent, node: EventDataNode): void;
  (e: 'doubleClick', evt: MouseEvent, node: EventDataNode): void;
  (e: 'contextmenu', evt: MouseEvent, node: EventDataNode): void;
  (e: 'mouseEnter', info: { event: MouseEvent; node: EventDataNode }): void;
  (e: 'mouseLeave', info: { event: MouseEvent; node: EventDataNode }): void;
  (e: 'dragStart', info: TreeDragEventInfo): void;
  (e: 'dragEnter', info: TreeDragEnterEventInfo): void;
  (e: 'dragOver', info: TreeDragEventInfo): void;
  (e: 'dragLeave', info: TreeDragEventInfo): void;
  (e: 'dragEnd', info: TreeDragEventInfo): void;
  (e: 'drop', info: TreeDropEventInfo): void;
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

export interface TreeSlots {
  /** 节点标题（优先于 `treeData[].title` 与 `titleRender`）。 */
  title?: (props: { node: EventDataNode; data: DataNode }) => VNodeChild;
}

// ---------------------------------------------------------------------------
// Expose（rc class 实例的公开方法面）
// ---------------------------------------------------------------------------

export interface TreeRef {
  /** 滚动到指定节点；`autoExpand: true` 时先展开再滚。 */
  scrollTo: (scroll?: number | TreeScrollConfig | null) => void;
  /** 聚焦树容器（rc focusable 管理）。 */
  focus: () => void;
  /** 节点数据实体表（只读快照）。 */
  keyEntities: Record<SafeKey, TreeDataEntity>;
}

// ---------------------------------------------------------------------------
// DirectoryTree
// ---------------------------------------------------------------------------

/**
 * DirectoryTree 的 props：与 TreeProps 相同，但**默认值不同**（G1 §4）——
 * `showIcon=true` / `expandAction='click'` / `blockNode=true` / `defaultExpandParent=true`
 * + shift/ctrl 范围多选 + File/Folder 图标。类型上直接复用 {@link TreeProps}。
 */
export type DirectoryTreeProps = TreeProps;
