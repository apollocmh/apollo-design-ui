/**
 * rc `hooks/useExpand.js`（74 行）—— Vue 移植。
 *
 * 展开配置的归并 + 受控/非受控展开键 + 触发回调。
 * React 的 useState 在这里是 `ref` + `watch`（受控源变化时同步）。
 */

import { type ComputedRef, computed, type Ref, ref, watch } from 'vue';
import type {
  ExpandableConfig,
  ExpandableConfig as ExpandableConfigT,
  GetRowKey,
  RenderExpandIcon,
} from '../../interface';
import { INTERNAL_HOOKS } from '../constant';
import { findAllChildrenKeys, renderExpandIcon } from '../utils/expandUtil';
import { getExpandableProps } from '../utils/legacyUtil';
import { hasNestChildren } from './use-columns';

export interface UseExpandResult<RecordType> {
  expandableConfig: ComputedRef<ExpandableConfigT<RecordType>>;
  expandableType: ComputedRef<false | 'row' | 'nest'>;
  mergedExpandedKeys: ComputedRef<Set<string | number>>;
  mergedExpandIcon: ComputedRef<RenderExpandIcon<RecordType>>;
  mergedChildrenColumnName: ComputedRef<string>;
  onTriggerExpand: (record: RecordType, event?: Event) => void;
}

export function useExpand<RecordType>(
  props: Ref<Record<string, unknown>>,
  mergedData: ComputedRef<RecordType[]>,
  getRowKey: GetRowKey<RecordType>,
): UseExpandResult<RecordType> {
  const expandableConfig = computed<ExpandableConfigT<RecordType>>(
    () =>
      getExpandableProps(
        props.value as never,
        'expandable' in props.value,
      ) as unknown as ExpandableConfigT<RecordType>,
  );

  // ⚠️ rc：`const mergedExpandIcon = expandIcon || renderExpandIcon;`（antd 层注入
  //    的图标工厂优先，引擎默认兜底）—— 此前漏读 cfg.expandIcon 导致
  //    antd 的 button 形态图标（aria-label/aria-expanded）从未生效。
  const mergedExpandIcon = computed(
    () =>
      (expandableConfig.value.expandIcon ??
        renderExpandIcon) as unknown as RenderExpandIcon<RecordType>,
  );
  const mergedChildrenColumnName = computed(
    () => expandableConfig.value.childrenColumnName || 'children',
  );

  const expandableType = computed<false | 'row' | 'nest'>(() => {
    const cfg = expandableConfig.value;
    if (cfg.expandedRowRender) {
      return 'row';
    }
    const isInternal =
      (props.value as { internalHooks?: string }).internalHooks === INTERNAL_HOOKS &&
      Boolean(
        (props.value as { expandable?: { __PARENT_RENDER_ICON__?: unknown } }).expandable
          ?.__PARENT_RENDER_ICON__,
      );
    if (
      (props.value.expandable && isInternal) ||
      hasNestChildren(mergedData.value as never, mergedChildrenColumnName.value)
    ) {
      return 'nest';
    }
    return false;
  });

  // 初始化只跑一次：defaultExpandAllRows 变化不重算（rc 同判）。
  const initExpandedKeys = (): (string | number)[] => {
    const cfg = expandableConfig.value;
    if (cfg.defaultExpandedRowKeys) {
      return cfg.defaultExpandedRowKeys.slice();
    }
    if (cfg.defaultExpandAllRows) {
      return findAllChildrenKeys(
        mergedData.value as never,
        getRowKey as never,
        mergedChildrenColumnName.value,
      );
    }
    return [];
  };
  const innerExpandedKeys = ref<(string | number)[]>(initExpandedKeys());

  const mergedExpandedKeys = computed<Set<string | number>>(() => {
    const cfg = expandableConfig.value;
    return new Set(cfg.expandedRowKeys ?? innerExpandedKeys.value ?? []);
  });

  // 受控源变化时清掉内部值（rc 语义：受控优先，卸载受控后回退内部态）
  watch(
    () => expandableConfig.value.expandedRowKeys,
    (keys) => {
      if (keys) innerExpandedKeys.value = [...keys];
    },
  );

  const onTriggerExpand = (record: RecordType, _event?: Event) => {
    const index = mergedData.value.indexOf(record);
    const key = getRowKey(record, index);
    const set = new Set(mergedExpandedKeys.value);
    const hasKey = set.has(key);
    let newExpandedKeys: (string | number)[];
    if (hasKey) {
      set.delete(key);
      newExpandedKeys = [...set];
    } else {
      newExpandedKeys = [...set, key];
    }
    innerExpandedKeys.value = newExpandedKeys;
    const cfg = expandableConfig.value;
    cfg.onExpand?.(!hasKey, record);
    cfg.onExpandedRowsChange?.(newExpandedKeys);
  };

  return {
    expandableConfig,
    expandableType,
    mergedExpandedKeys,
    mergedExpandIcon,
    mergedChildrenColumnName,
    onTriggerExpand,
  };
}

export type { ExpandableConfig };
