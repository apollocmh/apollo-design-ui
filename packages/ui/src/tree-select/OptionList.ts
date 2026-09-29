/**
 * TreeSelect 的树型选项列表（rc `OptionList.js` 347 行的 Vue 等价物）。
 *
 * 内嵌**本仓 Tree**（BaseSelect 的 optionListRenderer 注入，Cascader 同范式）。
 *
 * ── 关键判据（docs/analysis/tree-select.md §3）──────────────────────────────
 * 1. 传给内嵌树的一律 `checkStrictly: true` —— 勾选级联由 TreeSelect 层算好
 *    （{checked, halfChecked}），树只做受控显示。
 * 2. checkedKeys 双语义：checkable ⇒ 勾选集合；否则直接当 selectedKeys。
 * 3. 展开三分支：treeExpandedKeys（受控）?? (searchValue ? searchExpandedKeys
 *    : expandedKeys)；搜索词出现时展开全部父节点（getAllKeys）。
 * 4. active：打开时定位首个可选节点（搜索时首个命中）；单选定位当前选中。
 *    Enter 选中 active，Esc 关闭，方向键代理树的 onKeyDown（focusable=false）。
 * 5. 单选打开时 scrollTo 定位当前选中节点。
 * 6. 空态：role="listbox" + `-empty` + notFoundContent。
 * 7. aria-live=assertive 隐藏 span 播报 active 节点值（基线逐字）。
 */

import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h, ref, shallowRef, watch } from 'vue';
import { Tree } from '../tree';
import type { TreeKey } from '../tree/interface';
import type { TreeSelectDataNode } from './interface';
import type { FilledFieldNames } from './utils/value-util';
import { getAllKeys, isCheckDisabled } from './utils/value-util';

/** 实体表条目（props 通道以 unknown 传递，使用处断言到本接口）。 */
interface LooseEntity {
  node: TreeSelectDataNode;
  key: string | number;
  parent?: LooseEntity;
  children?: LooseEntity[];
}

const HIDDEN_STYLE = {
  width: '0',
  height: '0',
  display: 'flex',
  overflow: 'hidden',
  opacity: '0',
  border: '0',
  padding: '0',
  margin: '0',
} as const;

const OptionList = defineComponent({
  name: 'ATreeSelectOptionList',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    // BaseProps
    multiple: { type: Boolean, default: false },
    searchValue: { type: String, default: '' },
    open: { type: Boolean, default: false },
    notFoundContent: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    toggleOpen: { type: Function as PropType<(open: boolean) => void>, required: true },
    // TreeSelectContext
    virtual: { type: Boolean, default: undefined },
    listHeight: { type: Number, default: 256 },
    listItemHeight: { type: Number, default: 28 },
    listItemScrollOffset: { type: Number, default: 0 },
    popupMatchSelectWidth: { type: [Boolean, Number], default: undefined },
    treeData: { type: Array as PropType<TreeSelectDataNode[]>, default: () => [] },
    fieldNames: { type: Object as PropType<FilledFieldNames>, required: true },
    onSelect: {
      type: Function as PropType<
        (
          key: TreeKey,
          info: { selected: boolean; source?: string; node?: TreeSelectDataNode },
        ) => void
      >,
      required: true,
    },
    treeExpandAction: {
      type: [Boolean, String] as PropType<false | 'click' | 'doubleClick'>,
      default: undefined,
    },
    treeTitleRender: {
      type: Function as PropType<(node: TreeSelectDataNode) => VNodeChild>,
      default: undefined,
    },
    onPopupScroll: { type: Function as PropType<(e: UIEvent) => void>, default: undefined },
    leftMaxCount: { type: Number, default: null },
    leafCountOnly: { type: Boolean, default: false },
    valueEntities: { type: Object as PropType<Map<unknown, unknown>>, required: true },
    // LegacyContext
    checkable: { type: [Boolean, Object], default: false },
    loadData: {
      type: Function as PropType<(node: TreeSelectDataNode) => Promise<unknown>>,
      default: undefined,
    },
    treeLoadedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
    onTreeLoad: { type: Function as PropType<(keys: TreeKey[]) => void>, default: undefined },
    checkedKeys: { type: Array as PropType<string[]>, default: () => [] },
    halfCheckedKeys: { type: Array as PropType<string[]>, default: () => [] },
    treeDefaultExpandAll: { type: Boolean, default: undefined },
    treeExpandedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
    treeDefaultExpandedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
    onTreeExpand: { type: Function as PropType<(keys: TreeKey[]) => void>, default: undefined },
    treeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    showTreeIcon: { type: Boolean, default: undefined },
    switcherIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    treeLine: { type: [Boolean, Object], default: undefined },
    treeNodeFilterProp: { type: String, default: 'value' },
    keyEntities: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(props, { expose }) {
    const treeRef = shallowRef<{
      scrollTo: (s: unknown) => void;
      onKeyDown: (e: KeyboardEvent) => void;
    } | null>(null);

    /** 打开期间的数据快照（rc memoTreeData：open 变化才重算，避免动画期闪烁）。 */
    // ⚠️ shallowRef：树数据是递归结构，深 ref 的 UnwrapRef 会爆 TS2589（且无需深响应）
    const memoTreeData = shallowRef<TreeSelectDataNode[]>([]);
    watch(
      () => [props.open, props.treeData] as const,
      ([nextOpen, nextData]) => {
        if (nextOpen && nextData) memoTreeData.value = nextData;
      },
      { immediate: true },
    );

    // ========================== Values ==========================
    const mergedCheckedKeys = computed(() => {
      if (!props.checkable) return null;
      return { checked: props.checkedKeys, halfChecked: props.halfCheckedKeys };
    });

    // ========================== Scroll ==========================
    watch(
      () => props.open,
      (open) => {
        // 单选打开时定位当前选中（rc 逐字）
        if (open && !props.multiple && props.checkedKeys.length) {
          treeRef.value?.scrollTo({ key: props.checkedKeys[0] });
        }
      },
    );

    // ========================== Events ==========================
    const onInternalSelect = (
      _key: unknown,
      info: { node: TreeSelectDataNode | { key: TreeKey }; selected?: boolean },
    ): void => {
      const node = info.node as TreeSelectDataNode;
      const key = (node.key ??
        (node as Record<string, unknown>)[props.fieldNames.value]) as TreeKey;
      if (props.checkable && isCheckDisabled(node)) {
        return;
      }
      props.onSelect(key, { selected: !props.checkedKeys.includes(key as string) });
      if (!props.multiple) {
        props.toggleOpen(false);
      }
    };

    // =========================== Keys ===========================
    const expandedKeys = ref<TreeKey[] | undefined>(props.treeDefaultExpandedKeys);
    const searchExpandedKeys = ref<TreeKey[] | null>(null);
    const mergedExpandedKeys = computed(() => {
      if (props.treeExpandedKeys) return [...props.treeExpandedKeys];
      return props.searchValue ? searchExpandedKeys.value : expandedKeys.value;
    });
    const onInternalExpand = (keys: TreeKey[]): void => {
      expandedKeys.value = keys;
      searchExpandedKeys.value = keys;
      props.onTreeExpand?.(keys);
    };

    // ========================== Search ==========================
    const lowerSearchValue = computed(() => String(props.searchValue).toLowerCase());
    const filterTreeNode = (treeNode: TreeSelectDataNode): boolean => {
      if (!lowerSearchValue.value) return false;
      return String((treeNode as Record<string, unknown>)[props.treeNodeFilterProp] ?? '')
        .toLowerCase()
        .includes(lowerSearchValue.value);
    };
    watch(
      () => props.searchValue,
      (searchValue) => {
        if (searchValue) {
          searchExpandedKeys.value = getAllKeys(props.treeData, props.fieldNames) as TreeKey[];
        }
      },
    );

    // ========================= maxCount 禁用 =====================
    // rc 经 UnstableContext.nodeDisabled 注入；Vue 侧等价实现：把超额节点在数据层
    // 标 disabled（同样的 DOM 产物 —— TreeNode 走 disabled 分支）。缓存避免重复计算。
    const disabledCache = ref(new Map<unknown, boolean>());
    watch(
      () => props.leftMaxCount,
      () => {
        disabledCache.value = new Map();
      },
    );
    const getDisabledWithCache = (node: TreeSelectDataNode): boolean => {
      const value = node[props.fieldNames.value];
      if (!disabledCache.value.has(value)) {
        const entity = props.valueEntities.get(value) as LooseEntity | undefined;
        const children = entity?.children ?? [];
        const isLeaf = children.length === 0;
        if (!isLeaf) {
          const checkableChildrenCount = children.filter(
            (child: { node: Record<string, unknown> }) =>
              !child.node.disabled &&
              !(child.node as { disableCheckbox?: boolean }).disableCheckbox &&
              !props.checkedKeys.includes(
                (child.node as Record<string, unknown>)[props.fieldNames.value] as string,
              ),
          ).length;
          disabledCache.value.set(value, checkableChildrenCount > (props.leftMaxCount as number));
        } else {
          disabledCache.value.set(value, false);
        }
      }
      return disabledCache.value.get(value) ?? false;
    };
    const nodeDisabled = (node: TreeSelectDataNode): boolean => {
      const nodeValue = node[props.fieldNames.value];
      if (props.checkedKeys.includes(nodeValue as string)) return false;
      if (props.leftMaxCount === null) return false;
      if (props.leftMaxCount <= 0) return true;
      if (props.leafCountOnly && props.leftMaxCount) return getDisabledWithCache(node);
      return false;
    };
    /** 把 nodeDisabled 写入数据副本（只在上层有 maxCount 限制时生效；render 内调用）。 */
    const buildEffectiveTreeData = (): TreeSelectDataNode[] => {
      if (props.leftMaxCount === null) return memoTreeData.value;
      type Node = TreeSelectDataNode;
      const dig = (nodes: Node[]): Node[] =>
        nodes.map((node: Node): Node => {
          const next: Node = { ...node };
          if (nodeDisabled(node)) next.disabled = true;
          const rec = next as unknown as Record<string, unknown>;
          const children = rec[props.fieldNames.children] as TreeSelectDataNode[] | undefined;
          if (children) rec[props.fieldNames.children] = dig(children);
          return next;
        });
      return dig(memoTreeData.value);
    };

    // ==================== 首个可选节点 / active ==================
    const getFirstMatchingNode = (nodes: TreeSelectDataNode[]): TreeSelectDataNode | null => {
      for (const node of nodes) {
        if (node.disabled || node.selectable === false) continue;
        if (props.searchValue) {
          if (filterTreeNode(node)) return node;
        } else {
          return node;
        }
        const children = node[props.fieldNames.children] as TreeSelectDataNode[] | undefined;
        if (children) {
          const matchInChildren = getFirstMatchingNode(children);
          if (matchInChildren) return matchInChildren;
        }
      }
      return null;
    };

    const activeKey = ref<TreeKey | null>(null);
    const activeEntity = computed(() =>
      activeKey.value
        ? (props.keyEntities[activeKey.value as string] as LooseEntity | undefined)
        : undefined,
    );
    watch(
      () => [props.open, props.searchValue] as const,
      ([open]) => {
        if (!open) return;
        const getFirstNode = (): TreeKey | null => {
          const firstNode = getFirstMatchingNode(buildEffectiveTreeData());
          return firstNode
            ? ((firstNode as Record<string, unknown>)[props.fieldNames.value] as TreeKey)
            : null;
        };
        const nextActiveKey =
          !props.multiple && props.checkedKeys.length && !props.searchValue
            ? (props.checkedKeys[0] as TreeKey)
            : getFirstNode();
        activeKey.value = nextActiveKey;
      },
    );

    // ========================= Keyboard =========================
    const onKeyDown = (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          treeRef.value?.onKeyDown(event);
          break;
        case 'Enter': {
          const entity = activeEntity.value;
          if (entity) {
            const isNodeDisabled = nodeDisabled(entity.node as TreeSelectDataNode);
            const node = entity.node as TreeSelectDataNode & {
              selectable?: boolean;
              value?: unknown;
              disabled?: boolean;
            };
            if (node.selectable !== false && !node.disabled && !isNodeDisabled) {
              onInternalSelect(null, {
                node: { key: activeKey.value as TreeKey },
                selected: !props.checkedKeys.includes(String(node.value)),
              });
            }
          }
          break;
        }
        case 'Escape':
          props.toggleOpen(false);
          break;
      }
    };

    // 🚨 曾漏了这段 expose（2026-09-30 修）：外层 `TreeSelect.ts` 有
    //    `optionListRef` + `onInputKeyDown → optionListRef.value?.onKeyDown(event)`
    //    的转发链，README 也写了「键盘方向键代理 Tree.onKeyDown」—— 但本组件**从未
    //    expose** ⇒ `optionListRef.value` 里拿不到 `onKeyDown` ⇒ **弹层里按方向键没反应**
    //    （转发静默打空）。
    //    发现路径：`biome check` 报 `onKeyDown` 未被引用 —— 与 tree 的
    //    `onNodeContextMenu` 漏接线是同一类「定义了但没接线」的问题。
    //    与 `tree/Tree.ts` 的 expose 同构（rc 的 ref API：`scrollTo` / `keyEntities` / `onKeyDown`）。
    expose({ onKeyDown });

    // ========================= loadData =========================
    // rc：搜索期间停用异步加载（hasLoadDataFn）
    const syncLoadData = computed(() => (props.searchValue ? undefined : props.loadData));

    // ========================= Render ===========================
    return () => {
      const treeData = buildEffectiveTreeData();
      if (treeData.length === 0) {
        return h(
          'div',
          {
            role: 'listbox',
            class: `${props.prefixCls}-empty`,
            onMousedown: (event: MouseEvent) => event.preventDefault(),
          },
          [props.notFoundContent],
        );
      }

      const treeProps: Record<string, unknown> = {
        ref: treeRef,
        // ⚠️ antd 薄壳三前缀（select/select-tree/tree-select）在 customize 模式下
        //    **合一**（getPrefixCls(x, customize) 直接用 customize）—— 本仓单前缀直通。
        prefixCls: props.prefixCls,
        treeData: treeData as never,
        height: props.listHeight,
        itemHeight: props.listItemHeight,
        itemScrollOffset: props.listItemScrollOffset,
        virtual: props.virtual !== false && props.popupMatchSelectWidth !== false,
        multiple: props.multiple,
        icon: props.treeIcon,
        showIcon: props.showTreeIcon,
        switcherIcon: props.switcherIcon,
        showLine: props.treeLine,
        loadData: syncLoadData.value,
        motion: false, // rc：antd 薄壳固定 treeMotion: null
        activeKey: activeKey.value,
        // 勾选级联由 TreeSelect 层算 —— 树永远严格模式
        checkable: props.checkable,
        checkStrictly: true,
        checkedKeys: mergedCheckedKeys.value as never,
        selectedKeys: props.checkable ? [] : props.checkedKeys,
        defaultExpandAll: props.treeDefaultExpandAll,
        titleRender: props.treeTitleRender,
        fieldNames: {
          key: props.fieldNames.key,
          title: props.fieldNames._title[0],
          children: props.fieldNames.children,
        },
        focusable: false,
        filterTreeNode,
        expandAction: props.treeExpandAction,
        onActiveChange: (key: TreeKey) => {
          activeKey.value = key;
        },
        onSelect: onInternalSelect as never,
        onCheck: onInternalSelect as never,
        onExpand: (keys: TreeKey[]) => onInternalExpand(keys),
        onLoad: (loadedKeys: TreeKey[]) => props.onTreeLoad?.(loadedKeys),
        onScroll: props.onPopupScroll,
      };
      if (props.treeLoadedKeys) treeProps.loadedKeys = props.treeLoadedKeys;
      if (mergedExpandedKeys.value) treeProps.expandedKeys = mergedExpandedKeys.value;

      return h('div', { onMousedown: (event: MouseEvent) => event.preventDefault() }, [
        activeEntity.value &&
          props.open &&
          h(
            'span',
            { style: HIDDEN_STYLE, 'aria-live': 'assertive' },
            String(
              (activeEntity.value.node as Record<string, unknown>)[props.fieldNames.value] ?? '',
            ),
          ),
        h(Tree, treeProps as never),
      ]);
    };
  },
});

export default OptionList;
