/**
 * `useItems` —— children(Panel vnode) → 归一化 items。
 * 契约来源：antd 6.6.4 `es/splitter/hooks/useItems.js`（逐行对拍）。
 */

import { isPlainObject } from '@apollo-design/utils';
import type { VNode } from 'vue';
import { computed, type Ref } from 'vue';
import type { ShowCollapsibleIconMode, SplitterPanelProps } from '../interface';

/** 归一化后的 collapsible（`showCollapsibleIcon` 缺省 `'auto'`）。 */
export interface NormalizedCollapsible {
  start: boolean;
  end: boolean;
  showCollapsibleIcon: ShowCollapsibleIconMode;
}

/** 归一化后的条目。 */
export interface SplitterItem extends SplitterPanelProps {
  collapsible: NormalizedCollapsible;
}

/** boolean/undefined ⇒ 双向折叠；对象 ⇒ 补 `showCollapsibleIcon: 'auto'`。 */
export function getCollapsible(collapsible: unknown): NormalizedCollapsible {
  if (isPlainObject(collapsible)) {
    const record = collapsible as Record<string, unknown>;
    return {
      start: record.start === true,
      end: record.end === true,
      showCollapsibleIcon:
        record.showCollapsibleIcon === undefined
          ? 'auto'
          : (record.showCollapsibleIcon as ShowCollapsibleIconMode),
    };
  }
  const mergedCollapsible = !!collapsible;
  return {
    start: mergedCollapsible,
    end: mergedCollapsible,
    showCollapsibleIcon: 'auto',
  };
}

/**
 * 从 slot vnodes 里收集 Splitter.Panel（renderless）的 props。
 * 注释/空白/非 Panel 元素全部过滤（descriptions 的 children 收集同范式）。
 */
export function useItems(childrenRef: Ref<VNode[]>): Ref<SplitterItem[]> {
  return computed(() =>
    childrenRef.value.map((node) => {
      const props = (node.props ?? {}) as SplitterPanelProps;
      const { collapsible, ...restProps } = props;
      return {
        ...restProps,
        collapsible: getCollapsible(collapsible),
      } as SplitterItem;
    }),
  );
}
