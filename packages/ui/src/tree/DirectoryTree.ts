import { FileOutlined, FolderOpenOutlined, FolderOutlined } from '@apollo-design/icons';
import { useControlledValue } from '@apollo-design/utils';
import { computed, defineComponent, h, type SlotsType } from 'vue';
import { clsx } from '../_internal/clsx';
import { convertDataToEntities } from '../_internal/tree/tree-util';
import { useComponentConfig } from '../config-provider/context';
import type { TreeKey, TreeSelectEventInfo, TreeSlots } from './interface';
import Tree, { treeEmits, treeProps } from './Tree';
import { conductExpandParent } from './utils';
import { calcRangeKeys, convertDirectoryKeysToNodes } from './utils/dictUtil';

export default defineComponent({
  name: 'ADirectoryTree',
  inheritAttrs: false,
  props: {
    ...treeProps,
    showIcon: { type: Boolean, default: true },
    blockNode: { type: Boolean, default: true },
    expandAction: { ...treeProps.expandAction, default: 'click' },
  },
  emits: treeEmits,
  slots: Object as SlotsType<TreeSlots>,
  setup(props, { attrs, emit, slots, expose }) {
    const { getPrefixCls } = useComponentConfig('tree');
    const prefixCls = computed(() => props.prefixCls ?? getPrefixCls('tree'));
    const [expandedKeys, setExpandedKeys] = useControlledValue<TreeKey[]>({
      getValue: () => props.expandedKeys,
      defaultValue: () => {
        const { keyEntities } = convertDataToEntities(props.treeData ?? [], {
          fieldNames: props.fieldNames,
        });
        const keys = props.defaultExpandAll
          ? Object.values(keyEntities).map((entity) => entity.key)
          : (props.defaultExpandedKeys ?? []);
        return props.defaultExpandParent ? conductExpandParent(keys, keyEntities) : [...keys];
      },
    });
    const [selectedKeys, setSelectedKeys] = useControlledValue<TreeKey[]>({
      getValue: () => props.selectedKeys,
      defaultValue: () => [...(props.defaultSelectedKeys ?? [])],
    });
    let lastSelectedKey: TreeKey | null = null;
    let cachedSelectedKeys: TreeKey[] = [];

    function onSelect(keys: TreeKey[], event: TreeSelectEventInfo): void {
      const key = event.node.key;
      const nativeEvent = event.nativeEvent;
      const treeData = props.treeData ?? [];
      const ctrlPick = nativeEvent.ctrlKey || nativeEvent.metaKey;
      let next: TreeKey[];
      if (props.multiple && ctrlPick) {
        next = keys;
      } else if (props.multiple && nativeEvent.shiftKey) {
        const { keyEntities } = convertDataToEntities(treeData, { fieldNames: props.fieldNames });
        const visibleExpandedKeys = props.autoExpandParent
          ? conductExpandParent(expandedKeys.value, keyEntities)
          : expandedKeys.value;
        next = Array.from(
          new Set([
            ...cachedSelectedKeys,
            ...calcRangeKeys({
              treeData,
              expandedKeys: visibleExpandedKeys,
              startKey: key,
              endKey: lastSelectedKey,
              fieldNames: props.fieldNames,
            }),
          ]),
        );
      } else {
        next = [key];
      }
      if (!nativeEvent.shiftKey || !props.multiple) {
        lastSelectedKey = key;
        cachedSelectedKeys = [...next];
      }
      setSelectedKeys(next);
      emit('update:selectedKeys', next);
      emit('select', next, {
        ...event,
        selected: true,
        selectedNodes: convertDirectoryKeysToNodes(treeData, next, props.fieldNames),
      } as never);
    }

    expose({});
    return () =>
      h(
        Tree,
        {
          ...attrs,
          ...props,
          prefixCls: prefixCls.value,
          class: clsx(`${prefixCls.value}-directory`, attrs.class),
          expandedKeys: expandedKeys.value,
          selectedKeys: selectedKeys.value,
          'onUpdate:expandedKeys': (keys) => {
            setExpandedKeys(keys);
            emit('update:expandedKeys', keys);
          },
          'onUpdate:selectedKeys': () => {}, // Directory owns the selection proposal below.
          'onUpdate:checkedKeys': (keys) => emit('update:checkedKeys', keys),
          'onUpdate:loadedKeys': (keys) => emit('update:loadedKeys', keys),
          'onUpdate:activeKey': (key) => emit('update:activeKey', key),
          onExpand: (keys, info) => emit('expand', keys, info),
          onSelect,
          onCheck: (keys, info) => emit('check', keys, info),
          onLoad: (keys, info) => emit('load', keys, info),
          onActiveChange: (key) => emit('activeChange', key),
          onClick: (event, node) => emit('click', event, node),
          onDoubleClick: (event, node) => emit('doubleClick', event, node),
          onContextmenu: (event, node) => emit('contextmenu', event, node),
          onMouseEnter: (event, node) => emit('mouseEnter', event, node),
          onMouseLeave: (event, node) => emit('mouseLeave', event, node),
          onDragStart: (event, info) => emit('dragStart', event, info),
          onDragEnter: (event, info) => emit('dragEnter', event, info),
          onDragOver: (event, info) => emit('dragOver', event, info),
          onDragLeave: (event, info) => emit('dragLeave', event, info),
          onDragEnd: (event, info) => emit('dragEnd', event, info),
          onDrop: (event, info) => emit('drop', event, info),
        },
        {
          ...slots,
          ...(!slots.icon && props.icon === undefined
            ? ({
                icon: ({ node, data }) => {
                  if (node.icon !== undefined)
                    return typeof node.icon === 'function'
                      ? node.icon({ ...node, eventKey: node.key, data })
                      : node.icon;
                  return h(
                    node.isLeaf
                      ? FileOutlined
                      : node.expanded
                        ? FolderOpenOutlined
                        : FolderOutlined,
                  );
                },
              } satisfies TreeSlots)
            : {}),
        },
      );
  },
});
