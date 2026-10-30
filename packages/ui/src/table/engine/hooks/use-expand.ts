import type { EngineExpandableConfig } from '../interface';
/**
 * rc `hooks/useExpand.js`（74 行）—— Vue 移植。
 *
 * 展开配置的归并 + 受控/非受控展开键 + 触发回调。
 * React 的 useState 在这里是 `ref` + `watch`（受控源变化时同步）。
 */

import { useControlledValue } from '@apollo-design/utils';
import { type ComputedRef, computed, type Ref } from 'vue';
import type { GetRowKey, RenderExpandIcon } from '../../interface';
import { findAllChildrenKeys, renderExpandIcon } from '../utils/expandUtil';
import { hasNestChildren } from './use-columns';

export interface UseExpandResult<RecordType> {
  expandableConfig: ComputedRef<EngineExpandableConfig<RecordType>>;
  expandableType: ComputedRef<false | 'row' | 'nest'>;
  mergedExpandedKeys: ComputedRef<Set<string | number>>;
  mergedExpandIcon: ComputedRef<RenderExpandIcon<RecordType>>;
  mergedChildrenColumnName: ComputedRef<string>;
  onTriggerExpand: (record: RecordType, event?: Event) => void;
}

export function useExpand<RecordType extends object>(
  props: Ref<{ expandable?: EngineExpandableConfig<RecordType> }>,
  mergedData: ComputedRef<RecordType[]>,
  getRowKey: Ref<GetRowKey<RecordType>>,
): UseExpandResult<RecordType> {
  const expandableConfig = computed<EngineExpandableConfig<RecordType>>(() => {
    const config = props.value.expandable ?? {};
    return config.showExpandColumn === false ? { ...config, expandIconColumnIndex: -1 } : config;
  });
  const mergedExpandIcon = computed<RenderExpandIcon<RecordType>>(
    () => expandableConfig.value.expandIcon ?? renderExpandIcon,
  );
  const mergedChildrenColumnName = computed(
    () => expandableConfig.value.childrenColumnName ?? 'children',
  );
  const expandableType = computed<false | 'row' | 'nest'>(() => {
    if (expandableConfig.value.expandedRowRender) return 'row';
    return hasNestChildren(mergedData.value, mergedChildrenColumnName.value) ? 'nest' : false;
  });

  // 初始化只跑一次：defaultExpandAllRows 变化不重算（rc 同判）。
  const initExpandedKeys = (): (string | number)[] => {
    const cfg = expandableConfig.value;
    if (cfg.defaultExpandedRowKeys) {
      return cfg.defaultExpandedRowKeys.slice();
    }
    if (cfg.defaultExpandAllRows) {
      return findAllChildrenKeys(mergedData.value, getRowKey.value, mergedChildrenColumnName.value);
    }
    return [];
  };
  const [expandedKeys, setExpandedKeys] = useControlledValue<(string | number)[]>({
    defaultValue: initExpandedKeys,
    getValue: () => expandableConfig.value.expandedRowKeys,
  });
  const mergedExpandedKeys = computed(() => new Set(expandedKeys.value));

  const onTriggerExpand = (record: RecordType, _event?: Event) => {
    const index = mergedData.value.indexOf(record);
    const key = getRowKey.value(record, index);
    const set = new Set(mergedExpandedKeys.value);
    const hasKey = set.has(key);
    let newExpandedKeys: (string | number)[];
    if (hasKey) {
      set.delete(key);
      newExpandedKeys = [...set];
    } else {
      newExpandedKeys = [...set, key];
    }
    setExpandedKeys(newExpandedKeys);
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
