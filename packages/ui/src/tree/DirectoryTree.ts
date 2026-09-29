/**
 * DirectoryTree —— 目录树（antd `DirectoryTree.js` 147 行的 Vue 移植）。
 *
 * 与 Tree 的差异（G1 §4 判据）：
 *   - `showIcon=true` / `expandAction='click'` / `blockNode=true` / `defaultExpandParent=true`
 *   - `icon = getIcon`：isLeaf → FileOutlined；expanded → FolderOpen/Folder
 *   - **shift/ctrl 范围多选**：onSelect 包装 —— ctrl(meta) 直取 keys；shift 用
 *     `calcRangeKeys` 展开 cachedSelectedKeys ∪ 范围；`selected` 恒 true；
 *     selectedNodes 经 `convertDirectoryKeysToNodes` 反查
 *   - 受控包装 expandedKeys/selectedKeys（供 calcRangeKeys 读当前展开集）
 *   - `defaultExpandAll` 用**全部实体 key**（与 Tree 的「只展开有 children」不同——
 *     rc DirectoryTree getInitExpandedKeys 判据）
 */

import { FileOutlined, FolderOpenOutlined, FolderOutlined } from '@apollo-design/icons';
import { computed, defineComponent, h, ref, watch } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { clsx } from '../notification/engine/util';
import type { DataNode, EventDataNode, TreeKey } from './interface';
import Tree, { treeProps } from './Tree';
import { conductExpandParent } from './utils';
import { calcRangeKeys, convertDirectoryKeysToNodes } from './utils/dictUtil';
import { convertDataToEntities } from './utils/treeUtil';

function getIcon(props: { isLeaf?: boolean; expanded?: boolean }) {
  const { isLeaf, expanded } = props;
  if (isLeaf) {
    return h(FileOutlined);
  }
  return expanded ? h(FolderOpenOutlined) : h(FolderOutlined);
}

export default defineComponent({
  name: 'ADirectoryTree',
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
  setup(props, { emit, slots, expose }) {
    const { getPrefixCls } = useComponentConfig('tree');
    const prefixCls = computed(() => props.prefixCls ?? getPrefixCls('tree'));

    // ======================== 受控包装的展开态 ========================
    // rc getInitExpandedKeys：本地转换（不含 MOTION_KEY）；defaultExpandAll ⇒ 全部 key
    const initExpandedKeys = (): TreeKey[] => {
      const { keyEntities } = convertDataToEntities(props.treeData ?? [], {
        fieldNames: props.fieldNames,
      });
      const mergedExpandedKeys = props.expandedKeys ?? props.defaultExpandedKeys ?? [];
      if (props.defaultExpandAll) {
        return Object.keys(keyEntities);
      }
      if (props.defaultExpandParent !== false) {
        return conductExpandParent(mergedExpandedKeys, keyEntities as never);
      }
      return mergedExpandedKeys;
    };

    const expandedKeysRef = ref<TreeKey[]>(initExpandedKeys());
    watch(
      () => props.expandedKeys,
      (keys) => {
        if (keys !== undefined) expandedKeysRef.value = [...keys];
      },
    );

    // ======================== 受控包装的选中态 ========================
    // ⚠️ 初值必须含受控 selectedKeys（rc useControlledState(value, props.selectedKeys)
    //    的受控初值语义）—— 只拷 default 会让受控首挂丢失（实测踩过）
    const selectedKeysRef = ref<TreeKey[]>([
      ...(props.selectedKeys ?? props.defaultSelectedKeys ?? []),
    ]);
    watch(
      () => props.selectedKeys,
      (keys) => {
        if (keys !== undefined) selectedKeysRef.value = [...keys];
      },
    );

    // ======================== shift/ctrl 范围多选 ========================
    let lastSelectedKey: TreeKey | null = null;
    let cachedSelectedKeys: TreeKey[] | null = null;

    function onExpand(keys: TreeKey[], info: unknown): void {
      expandedKeysRef.value = keys;
      emit('update:expandedKeys', keys);
      emit('expand', keys, info as never);
    }

    function onSelect(keys: TreeKey[], event: Record<string, unknown>): void {
      const { multiple } = props;
      const node = event.node as EventDataNode;
      const nativeEvent = event.nativeEvent as MouseEvent | undefined;
      const key = (node?.key ?? '') as TreeKey;
      const treeData = (props.treeData ?? []) as DataNode[];
      // Directory selected always true（rc 判据）
      const newEvent: Record<string, unknown> = {
        ...event,
        selected: true,
      };
      const ctrlPick = nativeEvent?.ctrlKey || nativeEvent?.metaKey;
      const shiftPick = nativeEvent?.shiftKey;

      let newSelectedKeys: TreeKey[];
      if (multiple && ctrlPick) {
        // Control click
        newSelectedKeys = keys;
        lastSelectedKey = key;
        cachedSelectedKeys = [...newSelectedKeys];
        newEvent.selectedNodes = convertDirectoryKeysToNodes(
          treeData,
          newSelectedKeys,
          props.fieldNames,
        );
      } else if (multiple && shiftPick) {
        // Shift click
        newSelectedKeys = Array.from(
          new Set([
            ...(cachedSelectedKeys ?? []),
            ...calcRangeKeys({
              treeData,
              expandedKeys: expandedKeysRef.value,
              startKey: key,
              endKey: lastSelectedKey,
              fieldNames: props.fieldNames,
            }),
          ]),
        );
        newEvent.selectedNodes = convertDirectoryKeysToNodes(
          treeData,
          newSelectedKeys,
          props.fieldNames,
        );
      } else {
        // Single click
        newSelectedKeys = [key];
        lastSelectedKey = key;
        cachedSelectedKeys = [...newSelectedKeys];
        newEvent.selectedNodes = convertDirectoryKeysToNodes(
          treeData,
          newSelectedKeys,
          props.fieldNames,
        );
      }
      emit('update:selectedKeys', newSelectedKeys);
      emit('select', newSelectedKeys, newEvent as never);
      selectedKeysRef.value = newSelectedKeys;
    }

    expose({});

    return () => {
      const connectClassName = clsx(
        `${prefixCls.value}-directory`,
        {
          [`${prefixCls.value}-directory-rtl`]: false, // direction 接线见 Tree 内部
        },
        props.className,
      );

      return h(
        Tree,
        {
          ...props,
          icon: getIcon,
          blockNode: true,
          showIcon: props.showIcon ?? true,
          expandAction: props.expandAction ?? 'click',
          prefixCls: prefixCls.value,
          className: connectClassName,
          defaultExpandParent: props.defaultExpandParent ?? true,
          expandedKeys: expandedKeysRef.value,
          selectedKeys: selectedKeysRef.value,
          onExpand,
          onSelect,
        } as never,
        slots,
      );
    };
  },
});
