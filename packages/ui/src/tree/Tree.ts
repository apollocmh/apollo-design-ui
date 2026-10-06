/**
 * Tree —— 导览树（rc-tree 1.4.0 内核 + antd 6.6.4 薄壳的 Vue 合并实现）。
 *
 * 架构：rc class 组件的 `state`（23 槽）→ 本文件的一组 ref；
 * `gDSFP` 八步流水线 → computed（fieldNames/keyEntities/flattenNodes）+ 拆分 watch
 * （每个受控键一条 watch，触发条件与 rc needSync 逐一对齐）；
 * `setUncontrolledState` → 逐事件的「props 有则跳过」判断（受控不落地内层 ref，仍 emit）。
 *
 * antd 壳六件事全部并入（docs/analysis/tree.md §3）：showIcon=false 默认、collapse motion、
 * itemHeight=paddingXS/2+titleHeight、draggableConfig(icon 默认 HolderOutlined)、
 * checkable 自定义 span（checkable 的 VNode 形态原样入 context）、语义槽 ×5（函数形态）。
 *
 * 事件面（C11）：四键 `update:*` 与语义事件（expand/check/select/load）同发。
 */

import { HolderOutlined } from '@apollo-design/icons';
import { getDesignToken } from '@apollo-design/theme';
import { warning as devWarning, pickAttrs } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  provide,
  reactive,
  ref,
  watch,
} from 'vue';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import {
  useComponentConfig,
  useConfigContext,
  useDirection,
  useThemeConfig,
} from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { clsx } from '../notification/engine/util';
import DropIndicator, { type DropIndicatorProps } from './DropIndicator';
import type {
  DataNode,
  SafeKey,
  TreeCheckedKeys,
  TreeKey,
  TreeProps,
  TreeSemanticClassNames,
  TreeSemanticStyles,
} from './interface';
import NodeList, { MOTION_KEY, MotionEntity } from './NodeList';
import { type DragNodeSnapshot, treeContextKey } from './TreeContext';
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
import { conductCheck } from './utils/conductUtil';
import renderSwitcherIcon from './utils/iconUtil';
import getEntity from './utils/keyUtil';
import {
  convertDataToEntities,
  convertNodePropsToEventData,
  type EventDataNodeLike,
  type FlattenNode,
  fillFieldNames,
  flattenTreeData,
  getTreeNodeProps,
  isLeafNode,
  type TreeNodeRequiredProps,
  warningWithoutKey,
} from './utils/treeUtil';

/** rc `MAX_RETRY_TIMES`：loadData 失败重试上限。 */
const MAX_RETRY_TIMES = 10;

/** rc `EventDataNodeLike` 的本仓别名（convertNodePropsToEventData 的产物）。 */
type TreeEventData = EventDataNodeLike<BasicDataNodeLike>;

type BasicDataNodeLike = import('./utils/keyUtil').BasicDataNodeLike;

export const treeProps = {
  treeData: { type: Array as PropType<DataNode[]>, default: undefined },
  fieldNames: { type: Object as PropType<TreeProps['fieldNames']>, default: undefined },

  expandedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
  defaultExpandedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
  defaultExpandAll: { type: Boolean, default: false },
  defaultExpandParent: { type: Boolean, default: true },
  autoExpandParent: { type: Boolean, default: false },

  checkable: { type: [Boolean, Object] as PropType<TreeProps['checkable']>, default: false },
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
  icon: { type: [Object, Function, String] as PropType<TreeProps['icon']>, default: undefined },
  switcherIcon: {
    type: [Object, Function, String] as PropType<TreeProps['switcherIcon']>,
    default: undefined,
  },
  switcherLoadingIcon: {
    type: [Object, Function] as PropType<TreeProps['switcherLoadingIcon']>,
    default: undefined,
  },
  blockNode: { type: Boolean, default: false },
  expandAction: {
    type: [Boolean, String] as PropType<TreeProps['expandAction']>,
    default: false,
  },
  titleRender: { type: Function as PropType<TreeProps['titleRender']>, default: undefined },

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
  rootStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  classNames: {
    type: [Object, Function] as PropType<TreeProps['classNames']>,
    default: undefined,
  },
  styles: { type: [Object, Function] as PropType<TreeProps['styles']>, default: undefined },
};

export default defineComponent({
  name: 'ATree',
  props: treeProps,
  emits: [
    'update:expandedKeys',
    'update:checkedKeys',
    'update:selectedKeys',
    'update:loadedKeys',
    'update:activeKey',
    'expand',
    'check',
    'select',
    'load',
    'click',
    'doubleClick',
    'contextmenu',
    'mouseEnter',
    'mouseLeave',
    'dragStart',
    'dragEnter',
    'dragOver',
    'dragLeave',
    'dragEnd',
    'drop',
    'activeChange',
  ],
  setup(props, { emit, attrs, slots, expose }) {
    // ======================== Config ========================
    const componentConfig = useComponentConfig('tree');
    const getPrefixCls = componentConfig.getPrefixCls;
    const config = useConfigContext();
    const direction = useDirection();
    const ctxDisabled = useDisabled();
    const themeConfig = useThemeConfig();

    const prefixCls = computed(() => props.prefixCls ?? getPrefixCls('tree'));
    const rootPrefixCls = getPrefixCls();
    const mergedDisabled = computed(() => props.disabled ?? ctxDisabled.value);
    // antd：virtual 来自 ConfigProvider（props 显式传值优先）
    const mergedVirtual = computed(() => props.virtual ?? config.virtual ?? true);

    // antd：motion 默认 collapse（`{rootPrefixCls}-motion-collapse`，motionAppear: false）
    const motion = computed(() => ({
      motionName: `${rootPrefixCls}-motion-collapse`,
      motionAppear: false,
    }));

    // itemHeight = token.paddingXS / 2 + (token.Tree?.titleHeight || token.controlHeightSM)
    const computedItemHeight = computed(() => {
      const token = getDesignToken(themeConfig.value) as unknown as {
        paddingXS: number;
        controlHeightSM: number;
        Tree?: { titleHeight?: number };
      };
      return token.paddingXS / 2 + (token.Tree?.titleHeight ?? token.controlHeightSM);
    });
    const mergedItemHeight = computed(() => props.itemHeight ?? computedItemHeight.value);

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
    if (slots.default) {
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

    // ======================== 展开态（gDSFP 4-5）========================
    const expandedKeysRef = ref<TreeKey[]>([]);
    const expandedKeysControlled = computed(() => props.expandedKeys !== undefined);

    /** rc setExpandedKeys：受控时 no-op。 */
    function setExpandedKeys(keys: TreeKey[]): void {
      if (expandedKeysControlled.value) {
        return;
      }
      expandedKeysRef.value = keys;
    }

    // 分支 A：受控 expandedKeys 变化（含 autoExpandParent 触发的 conductExpandParent）
    watch(
      () => props.expandedKeys,
      (controlledKeys, oldKeys) => {
        if (controlledKeys === undefined) return;
        const isFirst = oldKeys === undefined;
        expandedKeysRef.value =
          props.autoExpandParent || (isFirst && props.defaultExpandParent)
            ? conductExpandParent(controlledKeys, keyEntities.value)
            : [...controlledKeys];
      },
      { immediate: true },
    );
    // 分支 A'：autoExpandParent 变化（rc needSync('autoExpandParent')）
    watch(
      () => props.autoExpandParent,
      (autoExpand) => {
        if (props.expandedKeys !== undefined && autoExpand) {
          expandedKeysRef.value = conductExpandParent(props.expandedKeys, keyEntities.value);
        }
      },
    );
    // 分支 B/C：首挂 defaultExpandAll / defaultExpandedKeys
    if (props.expandedKeys === undefined) {
      if (props.defaultExpandAll) {
        // ⚠️ 只取有 children 的 key（rc 性能判据），且排除 MOTION_KEY
        const next: TreeKey[] = [];
        for (const key of Object.keys(keyEntities.value)) {
          if (key === MOTION_KEY) continue;
          const entity = keyEntities.value[key as SafeKey] as
            | { children?: unknown[]; key: SafeKey }
            | undefined;
          if (entity?.children?.length) {
            next.push(entity.key);
          }
        }
        expandedKeysRef.value = next;
      } else if (props.defaultExpandedKeys) {
        expandedKeysRef.value =
          props.autoExpandParent || props.defaultExpandParent
            ? conductExpandParent(props.defaultExpandedKeys, keyEntities.value)
            : [...props.defaultExpandedKeys];
      }
    }

    const flattenNodes = computed<FlattenNode[]>(() =>
      flattenTreeData(props.treeData ?? [], expandedKeysRef.value, props.fieldNames),
    );

    // ======================== 选中态（gDSFP 6）========================
    const selectedKeysRef = ref<TreeKey[]>([]);

    watch(
      () => props.selectedKeys,
      (controlledKeys, oldKeys) => {
        if (!props.selectable) return;
        if (controlledKeys !== undefined) {
          selectedKeysRef.value = calcSelectedKeys(controlledKeys, props) ?? [];
        } else if (oldKeys === undefined && props.defaultSelectedKeys) {
          selectedKeysRef.value = calcSelectedKeys(props.defaultSelectedKeys, props) ?? [];
        }
      },
      { immediate: true },
    );

    // ======================== 勾选态（gDSFP 7）========================
    const checkedKeysRef = ref<SafeKey[]>([]);
    const halfCheckedKeysRef = ref<SafeKey[]>([]);

    watch(
      () => props.checkedKeys,
      (controlledKeys, oldKeys) => {
        if (!props.checkable) return;
        let checkedKeyEntity: ReturnType<typeof parseCheckedKeys> | null = null;
        if (controlledKeys !== undefined) {
          checkedKeyEntity = parseCheckedKeys(controlledKeys as never);
        } else if (oldKeys === undefined && props.defaultCheckedKeys) {
          checkedKeyEntity = parseCheckedKeys(props.defaultCheckedKeys);
        } else if (oldKeys !== undefined && controlledKeys === undefined) {
          // 从受控切回非受控（防御）
          return;
        }
        if (checkedKeyEntity) {
          let { checkedKeys = [], halfCheckedKeys = [] } = checkedKeyEntity;
          if (!props.checkStrictly) {
            const conduct = conductCheck(checkedKeys, true, keyEntities.value as never);
            checkedKeys = conduct.checkedKeys;
            halfCheckedKeys = conduct.halfCheckedKeys;
          }
          checkedKeysRef.value = checkedKeys;
          halfCheckedKeysRef.value = halfCheckedKeys ?? [];
        }
      },
      { immediate: true },
    );
    // rc：treeData 变化 ⇒ 用当前勾选态重算级联
    watch(keyEntities, (entities) => {
      if (!props.checkable || props.checkedKeys !== undefined || props.checkStrictly) return;
      const conduct = conductCheck(checkedKeysRef.value, true, entities as never);
      checkedKeysRef.value = conduct.checkedKeys;
      halfCheckedKeysRef.value = conduct.halfCheckedKeys;
    });

    // ======================== 加载态（gDSFP 8）========================
    const loadedKeysRef = ref<SafeKey[]>([]);
    const loadingKeysRef = ref<SafeKey[]>([]);
    watch(
      () => props.loadedKeys,
      (keys) => {
        if (keys !== undefined) loadedKeysRef.value = [...keys];
      },
      { immediate: true },
    );

    // ======================== 焦点 / 拖拽 / 动效槽 ========================
    const activeKeyRef = ref<TreeKey | null>(null);
    watch(
      () => props.activeKey,
      (key) => {
        if (key !== undefined && key !== activeKeyRef.value) {
          activeKeyRef.value = key;
          if (key !== null) {
            scrollTo({ key, offset: props.itemScrollOffset });
          }
        }
      },
      { immediate: true },
    );

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
      loadingRetryTimes: {} as Record<string, number>,
      destroyed: false,
      delayedDragEnterLogic: {} as Record<string, ReturnType<typeof setTimeout>>,
    };
    let dragStartMouse: { x: number; y: number } | null = null;

    const listRef = ref<{ scrollTo: (s: unknown) => void; getIndentWidth: () => number } | null>(
      null,
    );

    // ======================== setUncontrolledState ========================
    /** rc 语义：props 上已有同名键（受控）⇒ 跳过该键的落地。 */
    function setUncontrolled(
      key: 'expandedKeys' | 'selectedKeys' | 'checkedKeys' | 'loadedKeys',
      value: unknown,
      extra?: () => void,
    ): void {
      if (instanceState.destroyed) return;
      const controlled =
        key === 'expandedKeys'
          ? props.expandedKeys !== undefined
          : key === 'selectedKeys'
            ? props.selectedKeys !== undefined
            : key === 'checkedKeys'
              ? props.checkedKeys !== undefined
              : props.loadedKeys !== undefined;
      if (!controlled) {
        if (key === 'expandedKeys') expandedKeysRef.value = value as TreeKey[];
        else if (key === 'selectedKeys') selectedKeysRef.value = value as TreeKey[];
        else if (key === 'checkedKeys') checkedKeysRef.value = value as SafeKey[];
        else loadedKeysRef.value = value as SafeKey[];
      }
      extra?.();
    }

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
    function onNodeExpand(e: MouseEvent | undefined, treeNode: TreeEventData): void {
      let expandedKeys = expandedKeysRef.value;

      // Do nothing when motion is in progress
      if (listChanging.value) {
        return;
      }

      const fieldKey = fieldNames.value.key;
      const key = (treeNode as unknown as Record<string, unknown>)[fieldKey] as TreeKey;
      const targetExpanded = !treeNode.expanded;
      expandedKeys = targetExpanded ? arrAdd(expandedKeys, key) : arrDel(expandedKeys, key);
      setExpandedKeys(expandedKeys);
      emit('update:expandedKeys', [...expandedKeys]);
      emit('expand', [...expandedKeys], {
        node: treeNode,
        expanded: targetExpanded,
        nativeEvent: e as unknown as MouseEvent,
      } as never);

      // Async Load data
      if (targetExpanded && props.loadData) {
        const loadPromise = onNodeLoad(treeNode);
        if (loadPromise) {
          loadPromise
            .then(() => {
              // [Legacy] flattenNodes 为 computed 已自动刷新（rc 显式 setState 的等价物）
              setUncontrolled('expandedKeys', [...expandedKeysRef.value]);
            })
            .catch(() => {
              const current = expandedKeysRef.value;
              const restore = arrDel(current, key);
              setExpandedKeys(restore);
            });
        }
      }
    }

    // ======================== 选中 / 勾选 / 加载 ========================
    function onNodeSelect(e: MouseEvent | undefined, treeNode: TreeEventData): void {
      let selectedKeys = [...selectedKeysRef.value];
      const { multiple } = props;
      const { selected } = treeNode;
      const fieldKey = fieldNames.value.key;
      const key = (treeNode as unknown as Record<string, unknown>)[fieldKey] as TreeKey;
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

      setUncontrolled('selectedKeys', selectedKeys);
      emit('update:selectedKeys', [...selectedKeys]);
      emit('select', [...selectedKeys], {
        event: 'select',
        selected: targetSelected,
        node: treeNode,
        selectedNodes,
        nativeEvent: e as unknown as MouseEvent,
      } as never);
    }

    function onNodeCheck(
      e: MouseEvent | undefined,
      treeNode: TreeEventData,
      checked: boolean,
    ): void {
      const oriCheckedKeys = [...checkedKeysRef.value];
      const oriHalfCheckedKeys = [...halfCheckedKeysRef.value];
      const { checkStrictly } = props;
      const key = (treeNode as unknown as Record<string, unknown>)[fieldNames.value.key] as TreeKey;

      let checkedObj: SafeKey[] | TreeCheckedKeys;
      const eventObj: Record<string, unknown> & {
        checkedNodes?: unknown[];
        checkedNodesPositions?: unknown[];
        halfCheckedKeys?: SafeKey[];
      } = {
        event: 'check',
        node: treeNode,
        checked,
        nativeEvent: e as unknown as MouseEvent,
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
        setUncontrolled('checkedKeys', checkedKeys);
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
        setUncontrolled('checkedKeys', checkedKeys, () => {
          halfCheckedKeysRef.value = halfCheckedKeys;
        });
      }
      emit('update:checkedKeys', checkedObj as never);
      emit('check', checkedObj as never, eventObj as never);
    }

    function onNodeLoad(treeNode: TreeEventData): Promise<unknown> | null {
      const key = (treeNode as unknown as Record<string, unknown>)[fieldNames.value.key] as TreeKey;
      const entity = getEntity(keyEntities.value as never, key) as never as {
        children?: unknown[];
      };

      // Skip if has children already
      if (entity?.children?.length) {
        return null;
      }
      if (!props.loadData) return null;
      if (
        loadedKeysRef.value.includes(key as SafeKey) ||
        loadingKeysRef.value.includes(key as SafeKey)
      ) {
        return null;
      }

      loadingKeysRef.value = arrAdd(loadingKeysRef.value, key as SafeKey);
      const promise = props.loadData(treeNode as never);
      promise
        .then(() => {
          const newLoadedKeys = arrAdd(loadedKeysRef.value, key as SafeKey);
          // onLoad 先于内部 setState（antd #12464 判据）
          emit('update:loadedKeys', [...newLoadedKeys]);
          emit('load', [...newLoadedKeys], { event: 'load', node: treeNode } as never);
          setUncontrolled('loadedKeys', newLoadedKeys);
          loadingKeysRef.value = arrDel(loadingKeysRef.value, key);
        })
        .catch(() => {
          loadingKeysRef.value = arrDel(loadingKeysRef.value, key);
          instanceState.loadingRetryTimes[String(key)] =
            (instanceState.loadingRetryTimes[String(key)] ?? 0) + 1;
          const retryTimes = instanceState.loadingRetryTimes[String(key)] ?? 0;
          if (retryTimes >= MAX_RETRY_TIMES) {
            devWarning(false, 'Retry for `loadData` many times but still failed. No more retry.');
            const current = loadedKeysRef.value ?? [];
            setUncontrolled('loadedKeys', arrAdd(current, key as SafeKey));
          }
        });
      return promise;
    }

    // ======================== 点击 / 悬停 / 右键 ========================
    function triggerExpandActionExpand(e: MouseEvent, treeNode: TreeEventData): void {
      const { expanded, key } = treeNode;
      const isLeaf =
        (treeNode as unknown as { isLeaf?: boolean }).isLeaf ??
        (treeNode.data as { isLeaf?: boolean } | undefined)?.isLeaf ??
        false;
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
      setExpandedKeys(
        expanded
          ? arrDel(expandedKeysRef.value, key as TreeKey)
          : arrAdd(expandedKeysRef.value, key as TreeKey),
      );
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
      emit('mouseEnter', { event, node } as never);
    }
    function onNodeMouseLeave(event: MouseEvent, node: TreeEventData): void {
      emit('mouseLeave', { event, node } as never);
    }
    function onNodeContextMenu(event: MouseEvent, node: TreeEventData): void {
      emit('contextmenu', event, node);
    }

    // ======================== 焦点 / active ========================
    function onActiveChange(newActiveKey: TreeKey | null): void {
      if (activeKeyRef.value === newActiveKey) return;
      activeKeyRef.value = newActiveKey;
      if (newActiveKey !== null) {
        scrollTo({ key: newActiveKey, offset: props.itemScrollOffset });
      }
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
      const { checkable, selectable } = props;
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
      if (activeItem && activeItem.data) {
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
              onNodeExpand(undefined, eventNode);
            } else if (activeItem.parent) {
              onActiveChange((activeItem.parent as FlattenNode).key);
            }
            event.preventDefault();
            break;
          }
          case 'ArrowRight': {
            if (expandable && !expandedKeys.includes(activeKeyRef.value as TreeKey)) {
              onNodeExpand(undefined, eventNode);
            } else if (activeItem.children && activeItem.children.length) {
              onActiveChange(activeItem.children[0]!.key);
            }
            event.preventDefault();
            break;
          }
          case 'Enter': {
            if (expandable) {
              event.preventDefault();
              onNodeExpand(undefined, eventNode);
            } else if (canCheck && !checkedKeys.includes(activeKeyRef.value as SafeKey)) {
              event.preventDefault();
              onNodeCheck(undefined, eventNode, true);
            } else if (canSelect && !(eventNode as unknown as { selected?: boolean }).selected) {
              event.preventDefault();
              onNodeSelect(undefined, eventNode);
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
              onNodeCheck(
                undefined,
                eventNode,
                !checkedKeys.includes(activeKeyRef.value as SafeKey),
              );
            } else if (canSelect) {
              event.preventDefault();
              onNodeSelect(undefined, eventNode);
            }
            break;
          }
        }
      }
    }

    // ======================== 拖拽（rc :250-500）=======================
    function resetDragState(): void {
      dragOverNodeKey.value = null;
      dropPosition.value = null;
      dropLevelOffset.value = null;
      dropTargetKey.value = null;
      dropContainerKey.value = null;
      dropTargetPos.value = null;
      dropAllowed.value = false;
    }

    function cleanDragState(): void {
      if (draggingNodeKey.value !== null) {
        draggingNodeKey.value = null;
        dropPosition.value = null;
        dropContainerKey.value = null;
        dropTargetKey.value = null;
        dropLevelOffset.value = null;
        dropAllowed.value = true;
        dragOverNodeKey.value = null;
      }
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
      emit('dragStart', {
        event,
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
        props.allowDrop as never,
        flattenNodes.value as never,
        keyEntities.value as never,
        expandedKeysRef.value,
        direction.value,
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
      emit('dragEnter', {
        event,
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
      emit('dragOver', {
        event,
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
      emit('dragLeave', {
        event,
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
      emit('dragEnd', {
        event,
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
      if (!da) {
        return;
      }
      dragOverNodeKey.value = null;
      cleanDragState();
      if (dtp === null) return;
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
      const posArr = posToArr(dropTargetPos.value ?? '');
      const dropResult = {
        event,
        node: convertNodePropsToEventData(abstractDropNodeProps as never),
        dragNode: instanceState.dragNodeProps
          ? convertNodePropsToEventData(instanceState.dragNodeProps as never)
          : null,
        dragNodesKeys: [
          (instanceState.dragNodeProps as { eventKey: TreeKey } | null)?.eventKey,
          ...dragChildrenKeysVal,
        ].filter((k) => k !== undefined),
        dropToGap: dp !== 0,
        dropPosition: (dp ?? 0) + Number(posArr[posArr.length - 1]),
      };
      if (!outsideTree) {
        emit('drop', dropResult as never);
      }
      instanceState.dragNodeProps = null;
    }

    // ======================== scroll / expose ========================
    function scrollTo(
      scroll?: number | { key?: TreeKey; autoExpand?: boolean; offset?: number } | null,
    ): void {
      if (scroll && typeof scroll === 'object' && scroll.autoExpand) {
        setExpandedKeys(arrAdd(expandedKeysRef.value, scroll.key as TreeKey));
      }
      listRef.value?.scrollTo(scroll);
    }

    expose({
      scrollTo,
      keyEntities,
      // rc Tree ref API 同构：keyboard 事件代理入口（focusable=false 时由
      // 外层容器转发，TreeSelect 的 OptionList 依赖它）。
      onKeyDown,
    });

    onMounted(() => {
      instanceState.destroyed = false;
      window.addEventListener('mouseup', onGlobalMouseUp);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('dragend', onWindowDragEnd);
      window.removeEventListener('mouseup', onGlobalMouseUp);
      instanceState.destroyed = true;
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
    function renderSwitcherIconFn(treeNodeProps: {
      isLeaf?: boolean;
      expanded?: boolean;
      loading?: boolean;
    }) {
      return renderSwitcherIcon({
        prefixCls: prefixCls.value,
        switcherIcon: props.switcherIcon,
        switcherLoadingIcon: props.switcherLoadingIcon,
        treeNodeProps: treeNodeProps as never,
        showLine: props.showLine,
      });
    }

    // ======================== Context ========================
    provide(
      treeContextKey,
      reactive({
        get prefixCls() {
          return prefixCls.value;
        },
        get selectable() {
          return props.selectable;
        },
        get showIcon() {
          return props.showIcon;
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
          return props.checkable
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
        get dragOverNodeKey() {
          return dragOverNodeKey.value;
        },
        get indent() {
          return indent.value;
        },
        get direction() {
          return direction.value;
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
        get titleRender() {
          return props.titleRender;
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
        // 🚨 曾漏了这一行（2026-09-30 修）：`TreeNode` 的 `onContextmenu` 会调
        //    `ctx.onNodeContextMenu(...)`，而它不在 context 对象里 ⇒ **右键点击节点抛
        //    `TypeError: ctx.onNodeContextMenu is not a function`**（不是「事件不触发」）。
        //    之所以没被类型检查拦住：整个 context 对象被 `as never` 断言了
        //    （`TreeContext` 里该字段是必填，但断言把它绕过了）。
        //    发现路径：`biome check` 报 `onNodeContextMenu` 未被引用 ——
        //    这类「定义了但没接线」的死代码正是门禁要抓的东西。
        onNodeContextMenu,
        onNodeDragStart,
        onNodeDragEnter,
        onNodeDragOver,
        onNodeDragLeave,
        onNodeDragEnd,
        onNodeDrop,
        onNodeMouseMove: () => {
          // rc：mouse 移动 ⇒ active 复位
          if (activeKeyRef.value !== null && props.activeKey === undefined) {
            activeKeyRef.value = null;
            emit('update:activeKey', null);
          }
        },
      }) as never,
    );

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
          [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
          [`${prefixCls.value}-disabled`]: mergedDisabled.value,
        },
        componentConfig.className,
      );

      return h(
        'div',
        {
          class: rootClass,
          style: {
            ...(componentConfig.style as Record<string, unknown> | undefined),
            ...(mergedStyles.value.root as Record<string, unknown> | undefined),
            ...(props.rootStyle as Record<string, unknown> | undefined),
            // ⚠️ 原生 style 同样交给 inheritAttrs 的自动落根（见上）。
          },
        },
        [
          h(NodeList, {
            prefixCls: prefixCls.value,
            data: flattenNodes.value,
            expandedKeys: expandedKeysRef.value,
            disabled: mergedDisabled.value,
            selectable: props.selectable,
            checkable: !!props.checkable,
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
              setTimeout(() => {
                listChanging.value = false;
              });
            },
            onKeydown: onKeyDown,
            onFocus: onFocus,
            onBlur: onBlur,
            onMousedown: onMouseDown,
            scrollWidth: props.scrollWidth,
            ...domProps,
          }),
        ],
      );
    };
  },
});
