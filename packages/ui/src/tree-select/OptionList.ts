/** TreeSelect owns value conduction; this list owns the current Tree projection and keyboard target. */

import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  type HTMLAttributes,
  h,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { conductCheck } from '../_internal/tree/conduct-util';
import type { TreeKey, TreeProps, TreeRef, TreeScrollConfig, TreeSlots } from '../tree/interface';
import { TreeSelectTree as Tree } from '../tree/Tree';
import type { DataEntities } from './hooks/use-data-entities';
import type {
  SearchConfig,
  TreeSelectDataNode,
  TreeSelectProps,
  TreeSelectSlots,
} from './interface';
import { formatStrategyValues, SHOW_CHILD } from './utils/strategy-util';
import type { FilledFieldNames } from './utils/value-util';
import { getAllKeys, getNodeValue, isCheckDisabled } from './utils/value-util';

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
type ListSlots = Pick<
  TreeSelectSlots,
  'treeTitleRender' | 'treeIcon' | 'switcherIcon' | 'switcherLoadingIcon'
>;

export default defineComponent({
  name: 'ATreeSelectOptionList',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String, required: true },
    multiple: { type: Boolean, default: false },
    searchValue: { type: String, default: '' },
    open: { type: Boolean, default: false },
    notFoundContent: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    toggleOpen: { type: Function as PropType<(open: boolean) => void>, required: true },
    virtual: { type: Boolean, default: undefined },
    listHeight: { type: Number, default: 256 },
    listItemHeight: { type: Number, default: 28 },
    popupMatchSelectWidth: { type: [Boolean, Number], default: undefined },
    treeData: { type: Array as PropType<TreeSelectDataNode[]>, default: () => [] },
    fieldNames: { type: Object as PropType<FilledFieldNames>, required: true },
    onSelect: {
      type: Function as PropType<
        (key: TreeKey, info: { selected: boolean; source?: string }) => void
      >,
      required: true,
    },
    treeExpandAction: {
      type: [Boolean, String] as PropType<TreeSelectProps['treeExpandAction']>,
      default: undefined,
    },
    onPopupScroll: { type: Function as PropType<(event: Event) => void>, default: undefined },
    leftMaxCount: { type: Number as PropType<number | null>, default: null },
    leafCountOnly: { type: Boolean, default: false },
    valueEntities: { type: Object as PropType<DataEntities['valueEntities']>, required: true },
    checkable: { type: Boolean, default: false },
    loadData: { type: Function as PropType<TreeSelectProps['loadData']>, default: undefined },
    treeLoadedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
    onTreeLoad: { type: Function as PropType<(keys: TreeKey[]) => void>, default: undefined },
    checkedKeys: { type: Array as PropType<TreeKey[]>, default: () => [] },
    halfCheckedKeys: { type: Array as PropType<TreeKey[]>, default: () => [] },
    treeDefaultExpandAll: { type: Boolean, default: undefined },
    treeExpandedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
    treeDefaultExpandedKeys: { type: Array as PropType<TreeKey[]>, default: undefined },
    onTreeExpand: { type: Function as PropType<(keys: TreeKey[]) => void>, default: undefined },
    treeIcon: { type: Boolean, default: undefined },
    showTreeIcon: { type: Boolean, default: undefined },
    switcherIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    treeLine: {
      type: [Boolean, Object] as PropType<TreeSelectProps['treeLine']>,
      default: undefined,
    },
    treeNodeFilterProp: { type: String, default: 'value' },
    filterTreeNode: {
      type: [Boolean, Function] as PropType<SearchConfig['filterTreeNode']>,
      default: undefined,
    },
    keyEntities: { type: Object as PropType<DataEntities['keyEntities']>, required: true },
  },
  slots: Object as SlotsType<ListSlots>,
  setup(props, { expose, slots }) {
    const treeRef = shallowRef<
      (TreeRef<object> & { onKeyDown: (event: KeyboardEvent) => void }) | null
    >(null);
    // Keep the last open data during the popup's leave animation.
    const memoTreeData = shallowRef<TreeSelectDataNode[]>([]);
    watch(
      () => [props.open, props.treeData] as const,
      ([open, data]) => {
        if (open) memoTreeData.value = data;
      },
      { immediate: true },
    );
    const [expandedKeys, setExpandedKeys] = useControlledValue<TreeKey[]>({
      getValue: () => props.treeExpandedKeys,
      defaultValue: () =>
        props.treeDefaultExpandedKeys ??
        (props.treeDefaultExpandAll ? getAllKeys(props.treeData, props.fieldNames) : []),
    });
    const searchExpandedKeys = ref<TreeKey[]>([]);
    watch(
      () => [props.searchValue, props.treeData] as const,
      ([search]) => {
        if (search) searchExpandedKeys.value = getAllKeys(props.treeData, props.fieldNames);
      },
      { immediate: true },
    );
    const mergedExpandedKeys = computed(
      () =>
        props.treeExpandedKeys ??
        (props.searchValue ? searchExpandedKeys.value : expandedKeys.value),
    );
    const onInternalExpand = (keys: TreeKey[]) => {
      setExpandedKeys(keys);
      searchExpandedKeys.value = keys;
      props.onTreeExpand?.(keys);
    };

    const getDataNode = (key: TreeKey) => props.keyEntities[key]?.node;
    const matchesSearch = (node: TreeSelectDataNode): boolean => {
      if (!props.searchValue) return false;
      if (typeof props.filterTreeNode === 'function')
        return props.filterTreeNode(props.searchValue, node);
      return String(node[props.treeNodeFilterProp] ?? '')
        .toLowerCase()
        .includes(props.searchValue.toLowerCase());
    };
    const nodeDisabled = (node: TreeSelectDataNode): boolean => {
      const value = getNodeValue(node, props.fieldNames.value);
      if ((value !== undefined && props.checkedKeys.includes(value)) || props.leftMaxCount === null)
        return false;
      if (props.leftMaxCount <= 0) return true;
      if (!props.leafCountOnly) return false;
      const entity = props.valueEntities.get(value);
      if (!entity) return false;
      const project = (keys: TreeKey[]) =>
        formatStrategyValues(keys, SHOW_CHILD, props.keyEntities, props.fieldNames).length;
      const checked = conductCheck(
        [...props.checkedKeys, entity.key],
        true,
        props.keyEntities,
      ).checkedKeys;
      return project(checked) - project(props.checkedKeys) > props.leftMaxCount;
    };
    const effectiveTreeData = computed<TreeSelectDataNode[]>(() => {
      if (props.leftMaxCount === null) return memoTreeData.value;
      const dig = (nodes: TreeSelectDataNode[]): TreeSelectDataNode[] =>
        nodes.map((node) => {
          const children = node[props.fieldNames.children] as TreeSelectDataNode[] | undefined;
          return {
            ...node,
            disabled: node.disabled || nodeDisabled(node),
            ...(children ? { [props.fieldNames.children]: dig(children) } : {}),
          };
        });
      return dig(memoTreeData.value);
    });
    const canSelect = (node: TreeSelectDataNode) =>
      !node.disabled &&
      !nodeDisabled(node) &&
      (props.checkable ? !isCheckDisabled(node) : node.selectable !== false);
    const firstMatchingKey = (nodes: TreeSelectDataNode[]): TreeKey | null => {
      for (const node of nodes) {
        if (
          canSelect(node) &&
          (!props.searchValue || props.filterTreeNode === false || matchesSearch(node))
        )
          return getNodeValue(node, props.fieldNames.value) ?? null;
        const children = node[props.fieldNames.children] as TreeSelectDataNode[] | undefined;
        if (children) {
          const child = firstMatchingKey(children);
          if (child !== null) return child;
        }
      }
      return null;
    };
    const activeKey = ref<TreeKey | null>(null);
    const activeEntity = computed(() =>
      activeKey.value === null ? undefined : props.keyEntities[activeKey.value],
    );
    watch(
      () => [props.open, props.searchValue, props.treeData] as const,
      ([open]) => {
        if (!open) return;
        activeKey.value =
          !props.multiple && props.checkedKeys.length && !props.searchValue
            ? (props.checkedKeys[0] ?? null)
            : firstMatchingKey(effectiveTreeData.value);
        if (activeKey.value !== null) treeRef.value?.scrollTo({ key: activeKey.value });
      },
      { immediate: true, flush: 'post' },
    );
    const selectKey = (key: TreeKey) => {
      const entity = props.keyEntities[key];
      if (!entity || !canSelect(entity.node)) return;
      props.onSelect(key, { selected: !props.checkedKeys.includes(key) });
      if (!props.multiple) props.toggleOpen(false);
    };
    const onInternalSelect = (_keys: unknown, info: { node: { key: TreeKey } }) =>
      selectKey(info.node.key);
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!props.open || event.isComposing) return;
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'Home':
        case 'End':
          treeRef.value?.onKeyDown(event);
          break;
        case 'Enter':
          if (activeKey.value !== null) selectKey(activeKey.value);
          event.preventDefault();
          break;
        case 'Escape':
          props.toggleOpen(false);
          break;
      }
    };
    expose({
      onKeyDown,
      scrollTo: (arg?: number | TreeScrollConfig | null) => treeRef.value?.scrollTo(arg),
    });
    const filterTreeNode: NonNullable<TreeProps['filterTreeNode']> = (node) => {
      const data = getDataNode(node.key);
      // The popup can still render its leave snapshot after source data is removed.
      return data ? matchesSearch(data) : false;
    };
    const syncLoadData = computed<TreeProps['loadData']>(() => {
      const loadData = !props.open || props.searchValue ? undefined : props.loadData;
      return loadData
        ? (node) => {
            const data = getDataNode(node.key);
            if (!data)
              throw new Error(`TreeSelect has no current data for load key ${String(node.key)}`);
            return loadData(data);
          }
        : undefined;
    });
    return () => {
      if (!effectiveTreeData.value.length)
        return h(
          'div',
          {
            role: 'tree',
            id: props.id,
            class: `${props.prefixCls}-empty`,
            onMousedown: (event: MouseEvent) => event.preventDefault(),
          },
          [props.notFoundContent],
        );
      const treeSlots: TreeSlots = {};
      if (slots.treeTitleRender)
        treeSlots.title = ({ data }) => slots.treeTitleRender?.({ node: data });
      if (slots.treeIcon) treeSlots.icon = slots.treeIcon;
      if (slots.switcherIcon) treeSlots.switcherIcon = slots.switcherIcon;
      if (slots.switcherLoadingIcon) treeSlots.switcherLoadingIcon = slots.switcherLoadingIcon;
      const treeProps = {
        ref: treeRef,
        listId: props.id,
        prefixCls: props.prefixCls,
        treeData: effectiveTreeData.value,
        height: props.listHeight,
        itemHeight: props.listItemHeight,
        virtual: props.virtual !== false && props.popupMatchSelectWidth !== false,
        multiple: props.multiple,
        showIcon: props.showTreeIcon ?? props.treeIcon,
        switcherIcon: props.switcherIcon,
        showLine: props.treeLine,
        loadData: syncLoadData.value,
        activeKey: activeKey.value,
        checkable: props.checkable,
        checkStrictly: true,
        checkedKeys: props.checkable
          ? { checked: props.checkedKeys, halfChecked: props.halfCheckedKeys }
          : [],
        selectedKeys: props.checkable ? [] : props.checkedKeys,
        fieldNames: {
          key: props.fieldNames.key,
          title: props.fieldNames._title[0],
          children: props.fieldNames.children,
        },
        focusable: false,
        filterTreeNode,
        expandAction: props.treeExpandAction,
        onActiveChange: (key) => {
          activeKey.value = key;
        },
        onSelect: onInternalSelect,
        onCheck: onInternalSelect,
        onExpand: onInternalExpand,
        onLoad: (keys) => props.onTreeLoad?.(keys),
        onScrollCapture: props.onPopupScroll,
        loadedKeys: props.treeLoadedKeys,
        expandedKeys: mergedExpandedKeys.value,
      } satisfies InstanceType<typeof Tree>['$props'] & {
        onScrollCapture?: HTMLAttributes['onScroll'];
      };
      return h('div', { onMousedown: (event: MouseEvent) => event.preventDefault() }, [
        activeEntity.value && props.open
          ? h(
              'span',
              { style: HIDDEN_STYLE, 'aria-live': 'assertive' },
              String(activeEntity.value.node[props.fieldNames.value] ?? ''),
            )
          : null,
        h(Tree, treeProps, { ...treeSlots }),
      ]);
    };
  },
});
