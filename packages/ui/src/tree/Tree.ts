/**
 * Tree owns accepted model values, computed node projections and business events.
 * NodeList owns the actual list/focus host; TreeNode consumes reactive context and slots.
 */

import { HolderOutlined } from '@apollo-design/icons';
import { initCollapseMotion } from '@apollo-design/motion';
import { warning as devWarning, pickAttrs, useControlledValue } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  type PropType,
  provide,
  ref,
  type SlotsType,
  type VNodeChild,
  watch,
} from 'vue';
import { clsx } from '../_internal/clsx';
import { conductCheck } from '../_internal/tree/conduct-util';
import getEntity from '../_internal/tree/key-util';
import {
  convertDataToEntities,
  convertNodePropsToEventData,
  type FlattenNode,
  fillFieldNames,
  flattenTreeData,
  getTreeNodeProps,
  isLeafNode,
  type TreeNodeRequiredProps,
  warningWithoutKey,
} from '../_internal/tree/tree-util';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import { useComponentConfig, useConfigContext, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import DropIndicator, { type DropIndicatorProps } from './DropIndicator';
import type {
  DataNode,
  EventDataNode,
  SafeKey,
  TreeCheckedKeys,
  TreeCheckInfo,
  TreeDragEnterEventInfo,
  TreeDragEventInfo,
  TreeDropEventInfo,
  TreeExpandEventInfo,
  TreeKey,
  TreeLoadEventInfo,
  TreeProps,
  TreeRef,
  TreeScrollConfig,
  TreeSelectEventInfo,
  TreeSemanticClassNames,
  TreeSemanticStyles,
  TreeSlots,
} from './interface';
import NodeList, { MOTION_KEY, MotionEntity, type NodeListRef } from './NodeList';
import { type DragNodeSnapshot, type TreeContextValue, treeContextKey } from './TreeContext';
import { useTreeTheme } from './use-tree-theme';
import {
  arrAdd,
  arrDel,
  calcDropPosition,
  calcSelectedKeys,
  conductExpandParent,
  getDragChildrenKeys,
  parseCheckedKeys,
  posToArr,
} from './utils';
import renderSwitcherIcon from './utils/iconUtil';

/** rc `EventDataNodeLike` 的本仓别名（convertNodePropsToEventData 的产物）。 */
type TreeEventData = EventDataNode;

type BasicDataNodeLike = import('../_internal/tree/key-util').BasicDataNodeLike;

export const treeProps = {
  treeData: { type: Array as PropType<object[]>, default: undefined },
  fieldNames: { type: Object as PropType<TreeProps['fieldNames']>, default: undefined },

  expandedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
  defaultExpandedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
  defaultExpandAll: { type: Boolean, default: false },
  defaultExpandParent: { type: Boolean, default: true },
  autoExpandParent: { type: Boolean, default: false },

  checkable: { type: null as unknown as PropType<TreeProps['checkable']>, default: false },
  checkStrictly: { type: Boolean, default: false },
  checkedKeys: {
    type: [Array, Object] as PropType<SafeKey[] | TreeCheckedKeys>,
    default: undefined,
  },
  defaultCheckedKeys: { type: Array as PropType<SafeKey[]>, default: undefined },

  selectable: { type: Boolean, default: true },
  multiple: { type: Boolean, default: false },
  selectedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
  defaultSelectedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },

  loadData: { type: Function as PropType<TreeProps['loadData']>, default: undefined },
  loadedKeys: { type: Array as PropType<SafeKey[]>, default: undefined },

  // ⚠️ default undefined（非 false）：DirectoryTree 需区分「未传」以覆盖 true
  showIcon: { type: Boolean, default: undefined },
  showLine: { type: [Boolean, Object] as PropType<TreeProps['showLine']>, default: false },
  icon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  switcherIcon: {
    type: null as unknown as PropType<VNodeChild>,
    default: undefined,
  },
  switcherLoadingIcon: {
    type: null as unknown as PropType<VNodeChild>,
    default: undefined,
  },
  blockNode: { type: Boolean, default: false },
  expandAction: {
    type: [Boolean, String] as PropType<TreeProps['expandAction']>,
    default: false,
  },

  disabled: { type: Boolean, default: undefined },
  draggable: {
    type: [Boolean, Function, Object] as PropType<TreeProps['draggable']>,
    default: false,
  },
  allowDrop: { type: Function as PropType<TreeProps['allowDrop']>, default: undefined },

  height: { type: Number, default: undefined },
  itemHeight: { type: Number, default: undefined },
  scrollWidth: { type: Number, default: undefined },
  virtual: { type: Boolean, default: undefined },
  itemScrollOffset: { type: Number, default: 0 },

  focusable: { type: Boolean, default: true },
  activeKey: { type: [String, Number] as PropType<TreeKey | null>, default: undefined },
  tabIndex: { type: Number, default: 0 },

  filterTreeNode: { type: Function as PropType<TreeProps['filterTreeNode']>, default: undefined },

  prefixCls: { type: String, default: undefined },
  rootStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  classNames: {
    type: [Object, Function] as PropType<TreeProps['classNames']>,
    default: undefined,
  },
  styles: { type: [Object, Function] as PropType<TreeProps['styles']>, default: undefined },
};

function eventType<Args extends unknown[]>(..._args: Args): boolean {
  return true;
}
export const treeEmits = {
  'update:expandedKeys': eventType<[keys: TreeKey[]]>,
  'update:checkedKeys': eventType<[keys: SafeKey[] | TreeCheckedKeys]>,
  'update:selectedKeys': eventType<[keys: TreeKey[]]>,
  'update:loadedKeys': eventType<[keys: SafeKey[]]>,
  'update:activeKey': eventType<[key: TreeKey | null]>,
  activeChange: eventType<[key: TreeKey | null]>,
  expand: eventType<[keys: TreeKey[], info: TreeExpandEventInfo]>,
  check: eventType<[keys: SafeKey[] | TreeCheckedKeys, info: TreeCheckInfo]>,
  select: eventType<[keys: TreeKey[], info: TreeSelectEventInfo]>,
  load: eventType<[keys: SafeKey[], info: TreeLoadEventInfo]>,
  click: eventType<[event: MouseEvent, node: EventDataNode]>,
  doubleClick: eventType<[event: MouseEvent, node: EventDataNode]>,
  contextmenu: eventType<[event: MouseEvent, node: EventDataNode]>,
  mouseEnter: eventType<[event: MouseEvent, node: EventDataNode]>,
  mouseLeave: eventType<[event: MouseEvent, node: EventDataNode]>,
  dragStart: eventType<[event: DragEvent, info: TreeDragEventInfo]>,
  dragEnter: eventType<[event: DragEvent, info: TreeDragEnterEventInfo]>,
  dragOver: eventType<[event: DragEvent, info: TreeDragEventInfo]>,
  dragLeave: eventType<[event: DragEvent, info: TreeDragEventInfo]>,
  dragEnd: eventType<[event: DragEvent, info: { node: EventDataNode | null }]>,
  drop: eventType<[event: DragEvent, info: TreeDropEventInfo]>,
};

export default defineComponent({
  name: 'ATree',
  props: treeProps,
  emits: treeEmits,
  slots: Object as SlotsType<TreeSlots>,
  setup(props, { emit, attrs, slots, expose }) {
    // ======================== Config ========================
    const componentConfig = useComponentConfig('tree');
    const getPrefixCls = componentConfig.getPrefixCls;
    const config = useConfigContext();
    const direction = useDirection();
    const getDirection = () =>
      attrs.dir === 'rtl' || attrs.dir === 'ltr' ? attrs.dir : direction.value;
    const ctxDisabled = useDisabled();
    const treeTheme = useTreeTheme();

    const prefixCls = computed(() => props.prefixCls ?? getPrefixCls('tree'));
    const mergedDisabled = computed(() => props.disabled ?? ctxDisabled.value);
    // antd：virtual 来自 ConfigProvider（props 显式传值优先）
    const mergedVirtual = computed(() => props.virtual ?? config.virtual ?? true);

    // antd：`const motion = customMotion ?? { ...initCollapseMotion(rootPrefixCls), motionAppear: false }`
    //
    // ⚠️ 那 9 个 handler（height `0 ↔ scrollHeight / offsetHeight`）+ `motionDeadline: 500`
    // **一个都不能省**（2026-10-17 修）：CSS 侧只有 `transition: height, opacity`，
    // 高度的目标值必须靠 JS 运行期测量。少了它们 ⇒ 高度从不变化 ⇒ 没有过渡可跑
    // ⇒ `transitionend` 永不到 ⇒ 收起动效永不结束 ⇒ `listChanging` 永久为真
    // ⇒ 整棵树的展开/收起全部失效。`motionDeadline` 是慢机器上的兜底闸门。
    const motion = computed(() => ({
      ...initCollapseMotion(getPrefixCls()),
      motionAppear: false,
    }));

    const checkableEnabled = computed(() => props.checkable !== false && props.checkable != null);
    const mergedItemHeight = computed(() => props.itemHeight ?? treeTheme.itemHeight.value);

    // ======================== 语义槽 ×5（函数形态）========================
    // ⚠️ classNames 是**拼接**语义、styles 是逐键浅合并（后者胜）——
    //    对齐 antd useMergeSemantic（与 tooltip/popconfirm 同判），不能用对象展开。
    const mergedClassNames = computed<Partial<TreeSemanticClassNames>>(() => {
      const own =
        typeof props.classNames === 'function'
          ? (props.classNames as (i: { props: TreeProps }) => Partial<TreeSemanticClassNames>)({
              props: props as unknown as TreeProps,
            })
          : props.classNames;
      return mergeClassNames<Partial<TreeSemanticClassNames>>(
        componentConfig.classNames as Partial<TreeSemanticClassNames>,
        own,
      );
    });
    const mergedStyles = computed<Partial<TreeSemanticStyles>>(() => {
      const own =
        typeof props.styles === 'function'
          ? (props.styles as (i: { props: TreeProps }) => Partial<TreeSemanticStyles>)({
              props: props as unknown as TreeProps,
            })
          : props.styles;
      return mergeStyles<Partial<TreeSemanticStyles>>(
        componentConfig.styles as Partial<TreeSemanticStyles>,
        own,
      );
    });

    // ======================== 派生数据（gDSFP 1-3）========================
    const fieldNames = computed(() => fillFieldNames(props.fieldNames));

    /** rc：`children` 形态 deprecated —— 传了就告警（本仓不实现转换）。 */
    if ('default' in slots) {
      devWarning(false, '`children` of Tree is deprecated. Please use `treeData` instead.');
    }

    // rc：MOTION_KEY 哨兵实体注入 keyEntities（motion 占位用）
    const keyEntities = computed(() => {
      const { keyEntities: entities } = convertDataToEntities(props.treeData ?? [], {
        fieldNames: props.fieldNames,
      });
      return { [MOTION_KEY]: MotionEntity, ...entities };
    });

    watch(
      () => props.treeData,
      (treeData) => {
        if (treeData) warningWithoutKey(treeData, fieldNames.value);
      },
      { immediate: true },
    );

    // Models keep accepted values separate from their current visual projection.
    const initialExpandedKeys = props.defaultExpandAll
      ? Object.values(keyEntities.value)
          .filter((entity) => entity.key !== MOTION_KEY && entity.children?.length)
          .map((entity) => entity.key)
      : (props.defaultExpandedKeys ?? []);
    const [expandedKeysModel, setExpandedKeys] = useControlledValue<TreeKey[]>({
      getValue: () => props.expandedKeys,
      defaultValue: () =>
        props.defaultExpandParent
          ? conductExpandParent(initialExpandedKeys, keyEntities.value)
          : [...initialExpandedKeys],
    });
    const initialControlledParents = ref(
      props.expandedKeys !== undefined && props.defaultExpandParent && !props.autoExpandParent,
    );
    const initialControlledExpanded =
      props.expandedKeys === undefined
        ? []
        : conductExpandParent(props.expandedKeys, keyEntities.value);
    watch(
      () => props.expandedKeys,
      () => {
        initialControlledParents.value = false;
      },
    );
    const expandedKeysRef = computed(() =>
      props.autoExpandParent
        ? conductExpandParent(expandedKeysModel.value, keyEntities.value)
        : initialControlledParents.value
          ? initialControlledExpanded
          : expandedKeysModel.value,
    );
    const flattenNodes = computed<FlattenNode[]>(() =>
      flattenTreeData(props.treeData ?? [], expandedKeysRef.value, props.fieldNames),
    );

    const [selectedKeysModel, setSelectedKeys] = useControlledValue<TreeKey[]>({
      getValue: () => props.selectedKeys,
      defaultValue: () => [...(props.defaultSelectedKeys ?? [])],
    });
    const selectedKeysRef = computed(() =>
      props.selectable ? (calcSelectedKeys(selectedKeysModel.value, props) ?? []) : [],
    );

    const [checkedKeysModel, setCheckedKeys] = useControlledValue<SafeKey[] | TreeCheckedKeys>({
      getValue: () => props.checkedKeys,
      defaultValue: () => [...(props.defaultCheckedKeys ?? [])],
    });
    const checkedProjection = computed(() => {
      const parsed = parseCheckedKeys(checkedKeysModel.value);
      const checkedKeys = parsed?.checkedKeys ?? [];
      const halfCheckedKeys = parsed?.halfCheckedKeys ?? [];
      if (!checkableEnabled.value) return { checkedKeys: [], halfCheckedKeys: [] };
      return props.checkStrictly
        ? { checkedKeys, halfCheckedKeys }
        : conductCheck(checkedKeys, true, keyEntities.value);
    });
    const checkedKeysRef = computed(() => checkedProjection.value.checkedKeys);
    const halfCheckedKeysRef = computed(() => checkedProjection.value.halfCheckedKeys);

    const [loadedKeysRef, setLoadedKeys] = useControlledValue<SafeKey[]>({
      getValue: () => props.loadedKeys,
      defaultValue: [],
    });
    const loadingKeysRef = ref<SafeKey[]>([]);
    const [activeKeyRef, setActiveKey] = useControlledValue<TreeKey | null>({
      getValue: () => props.activeKey,
      defaultValue: null,
    });

    const draggingNodeKey = ref<TreeKey | null>(null);
    const dragChildrenKeys = ref<TreeKey[]>([]);
    const dropTargetKey = ref<TreeKey | null>(null);
    const dropPosition = ref<-1 | 0 | 1 | null>(null);
    const dropContainerKey = ref<TreeKey | null>(null);
    const dropLevelOffset = ref<number | null>(null);
    const dropTargetPos = ref<string | null>(null);
    const dropAllowed = ref(true);
    const dragOverNodeKey = ref<TreeKey | null>(null);
    const indent = ref<number | null>(null);
    const listChanging = ref(false);

    // 非响应式实例槽（rc class field）
    const instanceState = {
      dragNodeProps: null as DragNodeSnapshot | null,
      currentMouseOverDroppableNodeKey: null as TreeKey | null,
      focusedByMouse: false,
      destroyed: false,
      delayedDragEnterLogic: {} as Record<string, ReturnType<typeof setTimeout>>,
    };
    let dragStartMouse: { x: number; y: number } | null = null;

    const listRef = ref<NodeListRef | null>(null);
    let listChangeTimer: ReturnType<typeof setTimeout> | undefined;
    watch(
      activeKeyRef,
      (key) => {
        if (key !== null) scrollTo({ key, align: 'top', offset: props.itemScrollOffset });
      },
      { flush: 'post' },
    );

    // ======================== treeNodeRequiredProps ========================
    function getTreeNodeRequiredProps(): TreeNodeRequiredProps {
      return {
        expandedKeys: expandedKeysRef.value || [],
        selectedKeys: selectedKeysRef.value || [],
        loadedKeys: loadedKeysRef.value || [],
        loadingKeys: loadingKeysRef.value || [],
        checkedKeys: checkedKeysRef.value || [],
        halfCheckedKeys: halfCheckedKeysRef.value || [],
        dragOverNodeKey: dragOverNodeKey.value,
        dropPosition: dropPosition.value,
        keyEntities: keyEntities.value,
      };
    }

    // ======================== 展开事件 ========================
    function onNodeExpand(e: MouseEvent | KeyboardEvent, treeNode: TreeEventData): void {
      let expandedKeys = expandedKeysRef.value;

      // Do nothing when motion is in progress
      if (listChanging.value) {
        return;
      }

      const key = treeNode.key as TreeKey;
      const targetExpanded = !treeNode.expanded;
      expandedKeys = targetExpanded ? arrAdd(expandedKeys, key) : arrDel(expandedKeys, key);
      setExpandedKeys(expandedKeys);
      emit('update:expandedKeys', [...expandedKeys]);
      emit('expand', [...expandedKeys], {
        node: treeNode,
        expanded: targetExpanded,
        nativeEvent: e,
      } as never);

      // Async Load data
      if (targetExpanded && props.loadData) {
        const expandedNode = getEntity(keyEntities.value, key)?.node;
        const loadPromise = onNodeLoad(treeNode);
        if (loadPromise) {
          void loadPromise.then((loaded) => {
            if (
              !loaded &&
              !instanceState.destroyed &&
              getEntity(keyEntities.value, key)?.node === expandedNode
            ) {
              setExpandedKeys(arrDel(expandedKeysRef.value, key));
            }
          });
        }
      }
    }

    // ======================== 选中 / 勾选 / 加载 ========================
    function onNodeSelect(e: MouseEvent | KeyboardEvent, treeNode: TreeEventData): void {
      let selectedKeys = [...selectedKeysRef.value];
      const { multiple } = props;
      const { selected } = treeNode;
      const key = treeNode.key as TreeKey;
      const targetSelected = !selected;

      if (!targetSelected) {
        selectedKeys = arrDel(selectedKeys, key);
      } else if (!multiple) {
        selectedKeys = [key];
      } else {
        selectedKeys = arrAdd(selectedKeys, key);
      }

      // [Legacy] selectedNodes
      const selectedNodes = selectedKeys
        .map(
          (selectedKey) =>
            (getEntity(keyEntities.value as never, selectedKey) as never as { node: DataNode })
              ?.node,
        )
        .filter(Boolean);

      setSelectedKeys(selectedKeys);
      emit('update:selectedKeys', [...selectedKeys]);
      emit('select', [...selectedKeys], {
        event: 'select',
        selected: targetSelected,
        node: treeNode,
        selectedNodes,
        nativeEvent: e,
      } as never);
    }

    function onNodeCheck(
      e: MouseEvent | KeyboardEvent,
      treeNode: TreeEventData,
      checked: boolean,
    ): void {
      const oriCheckedKeys = [...checkedKeysRef.value];
      const oriHalfCheckedKeys = [...halfCheckedKeysRef.value];
      const { checkStrictly } = props;
      const key = treeNode.key as TreeKey;

      let checkedObj: SafeKey[] | TreeCheckedKeys;
      const eventObj: Record<string, unknown> & {
        checkedNodes?: unknown[];
        checkedNodesPositions?: unknown[];
        halfCheckedKeys?: SafeKey[];
      } = {
        event: 'check',
        node: treeNode,
        checked,
        nativeEvent: e,
      };
      if (checkStrictly) {
        const checkedKeys = checked ? arrAdd(oriCheckedKeys, key) : arrDel(oriCheckedKeys, key);
        const halfCheckedKeys = arrDel(oriHalfCheckedKeys, key);
        checkedObj = { checked: checkedKeys, halfChecked: halfCheckedKeys };
        eventObj.checkedNodes = checkedKeys
          .map(
            (checkedKey) =>
              (getEntity(keyEntities.value as never, checkedKey) as never as { node: DataNode })
                ?.node,
          )
          .filter(Boolean);
        setCheckedKeys(checkedObj);
      } else {
        // Always fill first
        let { checkedKeys, halfCheckedKeys } = conductCheck(
          [...oriCheckedKeys, key],
          true,
          keyEntities.value as never,
        ) as { checkedKeys: SafeKey[]; halfCheckedKeys: SafeKey[] };

        // If remove, we do it again to correction
        if (!checked) {
          const keySet = new Set<SafeKey>(checkedKeys);
          keySet.delete(key as SafeKey);
          const again = conductCheck(
            Array.from(keySet),
            { checked: false, halfCheckedKeys },
            keyEntities.value as never,
          ) as { checkedKeys: SafeKey[]; halfCheckedKeys: SafeKey[] };
          checkedKeys = again.checkedKeys;
          halfCheckedKeys = again.halfCheckedKeys;
        }
        checkedObj = checkedKeys;

        // [Legacy] rc-tree-select 依赖
        eventObj.checkedNodes = [];
        eventObj.checkedNodesPositions = [];
        eventObj.halfCheckedKeys = halfCheckedKeys;
        checkedKeys.forEach((checkedKey) => {
          const entity = getEntity(keyEntities.value as never, checkedKey) as never as {
            node: DataNode;
            pos: string;
          };
          if (!entity) return;
          (eventObj.checkedNodes as unknown[]).push(entity.node);
          (eventObj.checkedNodesPositions as unknown[]).push({
            node: entity.node,
            pos: entity.pos,
          });
        });
        setCheckedKeys(checkedObj);
      }
      emit('update:checkedKeys', checkedObj as never);
      emit('check', checkedObj as never, eventObj as never);
    }

    const loadRequests = new Map<TreeKey, { node: BasicDataNodeLike; promise: Promise<boolean> }>();
    watch(keyEntities, (entities) => {
      for (const [key, request] of loadRequests) {
        if (getEntity(entities, key)?.node !== request.node) {
          loadRequests.delete(key);
          loadingKeysRef.value = arrDel(loadingKeysRef.value, key);
        }
      }
    });
    function onNodeLoad(treeNode: TreeEventData): Promise<boolean> | null {
      const key = treeNode.key as TreeKey;
      const entity = getEntity(keyEntities.value, key);
      const loadData = props.loadData;
      if (!entity || entity.children?.length || !loadData || loadedKeysRef.value.includes(key))
        return null;
      const inFlight = loadRequests.get(key);
      if (inFlight?.node === entity.node) return inFlight.promise;
      const requestNode = entity.node;
      loadingKeysRef.value = arrAdd(loadingKeysRef.value, key);
      const isCurrent = () =>
        !instanceState.destroyed &&
        getEntity(keyEntities.value, key)?.node === requestNode &&
        loadRequests.get(key)?.promise === promise;
      const promise = new Promise<unknown>((resolve) => {
        resolve(loadData(treeNode));
      })
        .then(
          () => {
            if (!isCurrent()) return false;
            const newLoadedKeys = arrAdd(loadedKeysRef.value, key);
            emit('update:loadedKeys', [...newLoadedKeys]);
            emit('load', [...newLoadedKeys], { event: 'load', node: treeNode } as never);
            setLoadedKeys(newLoadedKeys);
            return true;
          },
          (error: unknown) => {
            if (isCurrent())
              devWarning(false, `Tree loadData failed for '${key}': ${String(error)}`);
            return false;
          },
        )
        .finally(() => {
          if (loadRequests.get(key)?.promise === promise) {
            loadRequests.delete(key);
            if (!instanceState.destroyed) loadingKeysRef.value = arrDel(loadingKeysRef.value, key);
          }
        });
      loadRequests.set(key, { node: requestNode, promise });
      return promise;
    }

    // ======================== 点击 / 悬停 / 右键 ========================
    function triggerExpandActionExpand(e: MouseEvent, treeNode: TreeEventData): void {
      const { key } = treeNode;
      const isLeaf = treeNode.isLeaf === true;
      if (isLeaf || e.shiftKey || e.metaKey || e.ctrlKey) {
        return;
      }
      const node = flattenNodes.value.find((nodeItem) => nodeItem.key === key);
      if (!node) return;
      const eventNode = convertNodePropsToEventData({
        ...getTreeNodeProps(key as TreeKey, getTreeNodeRequiredProps()),
        data: node.data,
        pos: node.pos,
        isStart: node.isStart,
        isEnd: node.isEnd,
      } as never);
      onNodeExpand(e, eventNode);
    }

    function onNodeClick(e: MouseEvent, treeNode: TreeEventData): void {
      if (props.expandAction === 'click') {
        triggerExpandActionExpand(e, treeNode);
      }
      emit('click', e, treeNode);
    }
    function onNodeDoubleClick(e: MouseEvent, treeNode: TreeEventData): void {
      if (props.expandAction === 'doubleClick') {
        triggerExpandActionExpand(e, treeNode);
      }
      emit('doubleClick', e, treeNode);
    }
    function onNodeMouseEnter(event: MouseEvent, node: TreeEventData): void {
      emit('mouseEnter', event, node);
    }
    function onNodeMouseLeave(event: MouseEvent, node: TreeEventData): void {
      emit('mouseLeave', event, node);
    }
    function onNodeContextMenu(event: MouseEvent, node: TreeEventData): void {
      emit('contextmenu', event, node);
    }

    // ======================== 焦点 / active ========================
    function onActiveChange(newActiveKey: TreeKey | null): void {
      if (activeKeyRef.value === newActiveKey) return;
      setActiveKey(newActiveKey);
      emit('update:activeKey', newActiveKey);
      emit('activeChange', newActiveKey);
    }

    function getActiveItem(): FlattenNode | null {
      if (activeKeyRef.value === null) return null;
      return flattenNodes.value.find(({ key }) => key === activeKeyRef.value) ?? null;
    }

    function offsetActiveKey(offset: number): void {
      const nodes = flattenNodes.value;
      let index = nodes.findIndex(({ key }) => key === activeKeyRef.value);

      // Align with index
      if (index === -1 && offset < 0) {
        index = nodes.length;
      }
      index = (index + offset + nodes.length) % nodes.length;
      const item = nodes[index];
      if (item) {
        onActiveChange(item.key);
      } else {
        onActiveChange(null);
      }
    }

    function onMouseDown(): void {
      instanceState.focusedByMouse = true;
    }
    function onGlobalMouseUp(): void {
      instanceState.focusedByMouse = false;
    }
    function onFocus(): void {
      if (!instanceState.focusedByMouse && !mergedDisabled.value && activeKeyRef.value === null) {
        const visibleSelectedKey = selectedKeysRef.value.find((key) => {
          return flattenNodes.value.some((nodeItem) => nodeItem.key === key);
        });
        if (visibleSelectedKey !== undefined) {
          onActiveChange(visibleSelectedKey);
        } else {
          onActiveChange(flattenNodes.value[0]?.key ?? null);
        }
      }
    }
    function onBlur(): void {
      onActiveChange(null);
    }

    // ======================== 键盘（rc :1014-1129）=======================
    function onKeyDown(event: KeyboardEvent): void {
      const { selectable } = props;
      const checkable = checkableEnabled.value;
      if (mergedDisabled.value) {
        return;
      }
      const expandedKeys = expandedKeysRef.value;
      const checkedKeys = checkedKeysRef.value;
      const nodes = flattenNodes.value;

      // >>>>>>>>>> Direction
      switch (event.key) {
        case 'ArrowUp':
          offsetActiveKey(-1);
          event.preventDefault();
          break;
        case 'ArrowDown':
          offsetActiveKey(1);
          event.preventDefault();
          break;
        case 'Home':
          onActiveChange(nodes[0]?.key ?? null);
          event.preventDefault();
          break;
        case 'End':
          onActiveChange(nodes[nodes.length - 1]?.key ?? null);
          event.preventDefault();
          break;
      }

      // >>>>>>>>>> Expand & Selection
      const activeItem = getActiveItem();
      // ⚠️ 提成局部变量才能收窄（`children?.length` 收窄不了 `children[0]`）
      const firstChild = activeItem?.children?.[0];
      if (activeItem?.data) {
        const treeNodeRequiredProps = getTreeNodeRequiredProps();
        const eventNode = convertNodePropsToEventData({
          ...getTreeNodeProps(activeKeyRef.value as TreeKey, treeNodeRequiredProps),
          data: activeItem.data,
          active: true,
        } as never);
        const entity = getEntity(
          keyEntities.value as never,
          activeKeyRef.value as TreeKey,
        ) as never as {
          children?: unknown[];
        };
        const hasChildren = !!entity?.children?.length;
        const expandable = !isLeafNode(
          (activeItem.data as { isLeaf?: boolean }).isLeaf,
          props.loadData,
          hasChildren,
          (eventNode as unknown as { loaded: boolean }).loaded,
        );
        const canCheck =
          !!checkable &&
          !(eventNode as unknown as { disabled?: boolean }).disabled &&
          (eventNode as unknown as { checkable?: boolean }).checkable !== false &&
          !(eventNode as unknown as { disableCheckbox?: boolean }).disableCheckbox;
        const canSelect =
          !checkable &&
          selectable &&
          !(eventNode as unknown as { disabled?: boolean }).disabled &&
          (eventNode as unknown as { selectable?: boolean }).selectable !== false;
        switch (event.key) {
          case 'ArrowLeft': {
            if (expandable && expandedKeys.includes(activeKeyRef.value as TreeKey)) {
              onNodeExpand(event, eventNode);
            } else if (activeItem.parent) {
              onActiveChange((activeItem.parent as FlattenNode).key);
            }
            event.preventDefault();
            break;
          }
          case 'ArrowRight': {
            if (expandable && !expandedKeys.includes(activeKeyRef.value as TreeKey)) {
              onNodeExpand(event, eventNode);
            } else if (firstChild) {
              onActiveChange(firstChild.key);
            }
            event.preventDefault();
            break;
          }
          case 'Enter': {
            if (expandable) {
              event.preventDefault();
              onNodeExpand(event, eventNode);
            } else if (canCheck && !checkedKeys.includes(activeKeyRef.value as SafeKey)) {
              event.preventDefault();
              onNodeCheck(event, eventNode, true);
            } else if (canSelect && !(eventNode as unknown as { selected?: boolean }).selected) {
              event.preventDefault();
              onNodeSelect(event, eventNode);
            }
            break;
          }
          // ⚠️ rc 判据是 `case ' '`（浏览器空格键真实值）；jsdom 把 key 规范成
          //    'Space'（trigger 与原生 KeyboardEvent 皆是）—— 兼容两值，真实
          //    浏览器行为不变（浏览器不会发出 'Space'）。
          case ' ':
          case 'Space': {
            if (canCheck) {
              event.preventDefault();
              onNodeCheck(event, eventNode, !checkedKeys.includes(activeKeyRef.value as SafeKey));
            } else if (canSelect) {
              event.preventDefault();
              onNodeSelect(event, eventNode);
            }
            break;
          }
        }
      }
    }

    // ======================== 拖拽（rc :250-500）=======================
    function resetDragState(): void {
      clearDragTimers();
      dragOverNodeKey.value = null;
      dropPosition.value = null;
      dropLevelOffset.value = null;
      dropTargetKey.value = null;
      dropContainerKey.value = null;
      dropTargetPos.value = null;
      dropAllowed.value = false;
    }

    function clearDragTimers(): void {
      for (const timer of Object.values(instanceState.delayedDragEnterLogic)) clearTimeout(timer);
      instanceState.delayedDragEnterLogic = {};
    }

    function cleanDragState(): void {
      resetDragState();
      draggingNodeKey.value = null;
      dragChildrenKeys.value = [];
      window.removeEventListener('dragend', onWindowDragEnd);
      dragStartMouse = null;
      instanceState.currentMouseOverDroppableNodeKey = null;
    }

    function onNodeDragStart(event: DragEvent, nodeProps: DragNodeSnapshot): void {
      const { eventKey } = nodeProps;
      instanceState.dragNodeProps = nodeProps;
      dragStartMouse = { x: event.clientX, y: event.clientY };
      const newExpandedKeys = arrDel(expandedKeysRef.value, eventKey);
      draggingNodeKey.value = eventKey;
      dragChildrenKeys.value = getDragChildrenKeys(eventKey, keyEntities.value as never);
      indent.value = listRef.value?.getIndentWidth() ?? 0;
      setExpandedKeys(newExpandedKeys);
      window.addEventListener('dragend', onWindowDragEnd);
      emit('dragStart', event, {
        node: convertNodePropsToEventData(nodeProps as never),
      } as never);
    }

    function calcDrop(
      event: DragEvent,
      nodeProps: DragNodeSnapshot,
    ): {
      dropPosition: -1 | 0 | 1;
      dropLevelOffset: number;
      dropTargetKey: TreeKey;
      dropContainerKey: TreeKey | null;
      dropTargetPos: string;
      dropAllowed: boolean;
      dragOverNodeKey: TreeKey;
    } {
      return calcDropPosition(
        event as never,
        instanceState.dragNodeProps as never,
        nodeProps as never,
        indent.value ?? 0,
        dragStartMouse,
        (props.allowDrop ?? (() => true)) as never,
        flattenNodes.value as never,
        keyEntities.value as never,
        expandedKeysRef.value,
        getDirection(),
      ) as never;
    }

    function onNodeDragEnter(event: DragEvent, nodeProps: DragNodeSnapshot): void {
      const { pos, eventKey } = nodeProps as never as { pos: string; eventKey: TreeKey };

      if (instanceState.currentMouseOverDroppableNodeKey !== eventKey) {
        instanceState.currentMouseOverDroppableNodeKey = eventKey;
      }
      if (!instanceState.dragNodeProps) {
        resetDragState();
        return;
      }
      const {
        dropPosition: dp,
        dropLevelOffset: dlo,
        dropTargetKey: dtk,
      } = calcDrop(event, nodeProps);
      if (dragChildrenKeys.value.includes(dtk)) {
        resetDragState();
        return;
      }

      // Side effect for delay drag（拖入其他节点 800ms 后自动展开）
      Object.keys(instanceState.delayedDragEnterLogic).forEach((key) => {
        clearTimeout(instanceState.delayedDragEnterLogic[key]);
      });
      if (instanceState.dragNodeProps.eventKey !== eventKey) {
        instanceState.delayedDragEnterLogic[String(pos)] = setTimeout(() => {
          if (draggingNodeKey.value === null) return;
          let newExpandedKeys = [...expandedKeysRef.value];
          const entity = getEntity(keyEntities.value as never, eventKey) as never as {
            children?: unknown[];
          };
          if (entity && (entity.children ?? []).length) {
            newExpandedKeys = arrAdd(expandedKeysRef.value, eventKey);
          }
          setExpandedKeys(newExpandedKeys);
          emit('update:expandedKeys', [...newExpandedKeys]);
          emit('expand', [...newExpandedKeys], {
            node: convertNodePropsToEventData(nodeProps as never),
            expanded: true,
            nativeEvent: event,
          } as never);
        }, 800);
      }

      // Skip if drag node is self
      if (instanceState.dragNodeProps.eventKey === dtk && dlo === 0) {
        resetDragState();
        return;
      }

      const {
        dropPosition: dp2,
        dropLevelOffset: dlo2,
        dropTargetKey: dtk2,
        dropContainerKey: dck,
        dropTargetPos: dtp,
        dropAllowed: da,
        dragOverNodeKey: dok,
      } = calcDrop(event, nodeProps);
      if (!da) {
        resetDragState();
        clearDragTimers();
        return;
      }
      void dp;
      void dlo;
      void dtk;
      dragOverNodeKey.value = dok;
      dropPosition.value = dp2;
      dropLevelOffset.value = dlo2;
      dropTargetKey.value = dtk2;
      dropContainerKey.value = dck;
      dropTargetPos.value = dtp;
      dropAllowed.value = da;
      emit('dragEnter', event, {
        node: convertNodePropsToEventData(nodeProps as never),
        expandedKeys: expandedKeysRef.value,
      } as never);
    }

    function onNodeDragOver(event: DragEvent, nodeProps: DragNodeSnapshot): void {
      if (!instanceState.dragNodeProps) {
        return;
      }
      const {
        dropPosition: dp,
        dropLevelOffset: dlo,
        dropTargetKey: dtk,
        dropContainerKey: dck,
        dropTargetPos: dtp,
        dropAllowed: da,
        dragOverNodeKey: dok,
      } = calcDrop(event, nodeProps);
      if (dragChildrenKeys.value.includes(dtk) || !da) {
        resetDragState();
        return;
      }
      if (instanceState.dragNodeProps.eventKey === dtk && dlo === 0) {
        const cleared =
          dropPosition.value === null &&
          dropLevelOffset.value === null &&
          dropTargetKey.value === null &&
          dropContainerKey.value === null &&
          dropTargetPos.value === null &&
          dropAllowed.value === false &&
          dragOverNodeKey.value === null;
        if (!cleared) {
          resetDragState();
        }
      } else {
        dropPosition.value = dp;
        dropLevelOffset.value = dlo;
        dropTargetKey.value = dtk;
        dropContainerKey.value = dck;
        dropTargetPos.value = dtp;
        dropAllowed.value = da;
        dragOverNodeKey.value = dok;
      }
      emit('dragOver', event, {
        node: convertNodePropsToEventData(nodeProps as never),
      } as never);
    }

    function onNodeDragLeave(event: DragEvent, nodeProps: DragNodeSnapshot): void {
      const { eventKey } = nodeProps as never as { eventKey: TreeKey };
      const target = event.currentTarget as HTMLElement | null;
      const related = event.relatedTarget as Node | null;
      if (
        instanceState.currentMouseOverDroppableNodeKey === eventKey &&
        !target?.contains(related)
      ) {
        resetDragState();
        instanceState.currentMouseOverDroppableNodeKey = null;
      }
      emit('dragLeave', event, {
        node: convertNodePropsToEventData(nodeProps as never),
      } as never);
    }

    function onWindowDragEnd(event: DragEvent): void {
      onNodeDragEnd(event, null, true);
      window.removeEventListener('dragend', onWindowDragEnd);
    }

    function onNodeDragEnd(
      event: DragEvent,
      nodeProps: DragNodeSnapshot | null,
      _isWindow = false,
    ): void {
      dragOverNodeKey.value = null;
      cleanDragState();
      emit('dragEnd', event, {
        node: nodeProps ? convertNodePropsToEventData(nodeProps as never) : null,
      } as never);
      instanceState.dragNodeProps = null;
      window.removeEventListener('dragend', onWindowDragEnd);
    }

    function onNodeDrop(
      event: DragEvent,
      _nodeProps: DragNodeSnapshot | null,
      outsideTree = false,
    ): void {
      const dragChildrenKeysVal = dragChildrenKeys.value;
      const dtp = dropTargetKey.value;
      const dp = dropPosition.value;
      const da = dropAllowed.value;
      const targetPos = dropTargetPos.value;
      const dragSnapshot = instanceState.dragNodeProps;
      if (!da) {
        cleanDragState();
        instanceState.dragNodeProps = null;
        return;
      }
      dragOverNodeKey.value = null;
      cleanDragState();
      instanceState.dragNodeProps = null;
      if (dtp === null || !dragSnapshot) return;
      const entity = getEntity(keyEntities.value as never, dtp) as never as { node: DataNode };
      const abstractDropNodeProps = {
        ...getTreeNodeProps(dtp, getTreeNodeRequiredProps()),
        active: getActiveItem()?.key === dtp,
        data: entity?.node,
      };
      const dropToChild = dragChildrenKeysVal.includes(dtp);
      devWarning(
        !dropToChild,
        "Can not drop to dragNode's children node. This is a bug of rc-tree. Please report an issue.",
      );
      const posArr = posToArr(targetPos ?? '');
      const dropResult = {
        event,
        node: convertNodePropsToEventData(abstractDropNodeProps as never),
        dragNode: convertNodePropsToEventData(dragSnapshot as never),
        dragNodesKeys: [dragSnapshot.eventKey, ...dragChildrenKeysVal].filter(
          (k) => k !== undefined,
        ),
        dropToGap: dp !== 0,
        dropPosition: (dp ?? 0) + Number(posArr[posArr.length - 1]),
      };
      if (!outsideTree) {
        emit('drop', event, dropResult as never);
      }
      instanceState.dragNodeProps = null;
    }

    // ======================== scroll / expose ========================
    function scrollTo(scroll?: number | TreeScrollConfig | null): void {
      if (scroll && typeof scroll === 'object' && scroll.autoExpand) {
        const ancestors = conductExpandParent([scroll.key], keyEntities.value);
        const next = Array.from(new Set([...expandedKeysRef.value, ...ancestors]));
        setExpandedKeys(next);
        emit('update:expandedKeys', next);
        void nextTick(() => listRef.value?.scrollTo(scroll));
      } else {
        listRef.value?.scrollTo(scroll);
      }
    }

    expose({
      scrollTo,
      focus: () => listRef.value?.focus(),
      get keyEntities() {
        return keyEntities.value;
      },
      // TreeSelect forwards keyboard events while it owns focus.
      onKeyDown,
    } satisfies TreeRef<object> & { onKeyDown: (event: KeyboardEvent) => void });

    onMounted(() => {
      instanceState.destroyed = false;
      if (activeKeyRef.value !== null)
        scrollTo({ key: activeKeyRef.value, align: 'top', offset: props.itemScrollOffset });
      window.addEventListener('mouseup', onGlobalMouseUp);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('dragend', onWindowDragEnd);
      window.removeEventListener('mouseup', onGlobalMouseUp);
      instanceState.destroyed = true;
      clearTimeout(listChangeTimer);
      clearDragTimers();
      loadRequests.clear();
    });

    // ======================== draggableConfig（antd 壳）========================
    const draggableConfig = computed<
      false | { nodeDraggable?: (node: DataNode) => boolean; icon?: unknown }
    >(() => {
      if (!props.draggable) {
        return false;
      }
      let merged: { nodeDraggable?: (node: DataNode) => boolean; icon?: unknown } = {};
      switch (typeof props.draggable) {
        case 'function':
          merged.nodeDraggable = props.draggable;
          break;
        case 'object':
          merged = {
            ...(props.draggable as { nodeDraggable?: (node: DataNode) => boolean; icon?: unknown }),
          };
          break;
        default:
          break;
      }
      if (merged.icon !== false) {
        merged.icon = merged.icon ?? h(HolderOutlined);
      }
      return merged;
    });

    /** iconUtil 包装（antd 壳的 renderSwitcherIcon）。 */
    function renderSwitcherIconFn(node: EventDataNode, data: Record<string, unknown>) {
      return renderSwitcherIcon({
        prefixCls: prefixCls.value,
        switcherIcon:
          typeof node.switcherIcon === 'function'
            ? node.switcherIcon({ ...node, eventKey: node.key, data })
            : (node.switcherIcon ?? props.switcherIcon),
        switcherLoadingIcon: props.switcherLoadingIcon,
        treeNodeProps: node,
        showLine: props.showLine,
      });
    }

    // ======================== Context ========================
    provide(treeContextKey, {
      get prefixCls() {
        return prefixCls.value;
      },
      get selectable() {
        return props.selectable;
      },
      get showIcon() {
        return props.showIcon ?? false;
      },
      get icon() {
        return props.icon;
      },
      get switcherIcon() {
        return renderSwitcherIconFn;
      },
      get draggable() {
        return draggableConfig.value;
      },
      get draggingNodeKey() {
        return draggingNodeKey.value;
      },
      get checkable() {
        // antd 壳：checkable ⇒ 自定义 `<span class="{p}-checkbox-inner">`（非原生框）
        return props.checkable === true
          ? h('span', { class: `${prefixCls.value}-checkbox-inner` })
          : props.checkable;
      },
      get checkStrictly() {
        return props.checkStrictly;
      },
      get disabled() {
        return mergedDisabled.value;
      },
      get keyEntities() {
        return keyEntities.value;
      },
      get dropLevelOffset() {
        return dropLevelOffset.value;
      },
      get dropContainerKey() {
        return dropContainerKey.value;
      },
      get dropTargetKey() {
        return dropTargetKey.value;
      },
      get dropPosition() {
        return dropPosition.value;
      },
      get dropAllowed() {
        return dropAllowed.value;
      },
      get dragOverNodeKey() {
        return dragOverNodeKey.value;
      },
      get indent() {
        return indent.value;
      },
      get direction() {
        return getDirection();
      },
      get dropIndicatorRender() {
        return (dropProps: DropIndicatorProps) => h(DropIndicator, dropProps);
      },
      get loadData() {
        return props.loadData;
      },
      get filterTreeNode() {
        return props.filterTreeNode;
      },
      get classNames() {
        return mergedClassNames.value;
      },
      get styles() {
        return mergedStyles.value;
      },
      onNodeClick,
      onNodeDoubleClick,
      onNodeExpand,
      onNodeSelect,
      onNodeCheck,
      onNodeLoad,
      onNodeMouseEnter,
      onNodeMouseLeave,
      onNodeContextMenu,
      onNodeDragStart,
      onNodeDragEnter,
      onNodeDragOver,
      onNodeDragLeave,
      onNodeDragEnd,
      onNodeDrop,
      onNodeMouseMove: () => {
        // rc：mouse 移动 ⇒ active 复位
        if (activeKeyRef.value !== null) {
          onActiveChange(null);
        }
      },
    } satisfies TreeContextValue);

    return () => {
      const domProps = pickAttrs({ ...attrs } as Record<string, unknown>, {
        aria: true,
        data: true,
      });
      const rootClass = clsx(
        prefixCls.value,
        mergedClassNames.value.root,
        // ⚠️ 调用方原生 class/style **不在这里加** —— Tree 没关 inheritAttrs，
        //    Vue 会自动把它们合并到根（且位置与上游一致）。加一遍会重复。
        {
          [`${prefixCls.value}-show-line`]: !!props.showLine,
          [`${prefixCls.value}-icon-hide`]: !(props.showIcon ?? false),
          [`${prefixCls.value}-block-node`]: props.blockNode,
          [`${prefixCls.value}-unselectable`]: !props.selectable,
          [`${prefixCls.value}-rtl`]: getDirection() === 'rtl',
          [`${prefixCls.value}-disabled`]: mergedDisabled.value,
        },
        componentConfig.className,
      );

      return h(
        'div',
        {
          class: rootClass,
          style: {
            ...treeTheme.style.value,
            ...(componentConfig.style as Record<string, unknown> | undefined),
            ...(mergedStyles.value.root as Record<string, unknown> | undefined),
            ...(props.rootStyle as Record<string, unknown> | undefined),
            // ⚠️ 原生 style 同样交给 inheritAttrs 的自动落根（见上）。
          },
        },
        [
          h(
            NodeList,
            {
              ref: listRef,
              prefixCls: prefixCls.value,
              data: flattenNodes.value,
              expandedKeys: expandedKeysRef.value,
              disabled: mergedDisabled.value,
              selectable: props.selectable,
              checkable: checkableEnabled.value,
              motion: motion.value,
              dragging: draggingNodeKey.value !== null,
              height: props.height,
              itemHeight: mergedItemHeight.value,
              virtual: mergedVirtual.value,
              focusable: props.focusable,
              activeKey: activeKeyRef.value,
              tabIndex: props.tabIndex,
              treeNodeRequiredProps: getTreeNodeRequiredProps(),
              onActiveChange: onActiveChange,
              onListChangeStart: () => {
                listChanging.value = true;
              },
              onListChangeEnd: () => {
                if (instanceState.destroyed) return;
                clearTimeout(listChangeTimer);
                listChangeTimer = setTimeout(() => {
                  listChanging.value = false;
                });
              },
              onKeydown: onKeyDown,
              onFocus: onFocus,
              onBlur: onBlur,
              onMousedown: onMouseDown,
              scrollWidth: props.scrollWidth,
              ...domProps,
            },
            slots,
          ),
        ],
      );
    };
  },
});
