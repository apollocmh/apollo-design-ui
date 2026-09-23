/**
 * `useResizable` —— 相邻面板对的「可拖 / 可折叠方向 / 图标显隐」矩阵。
 * 契约来源：antd 6.6.4 `es/splitter/hooks/useResizable.js`（逐行对拍）。
 */

import { computed, type Ref } from 'vue';
import type { ShowCollapsibleIconMode } from '../interface';
import type { NormalizedCollapsible, SplitterItem } from './useItems';

export interface ResizableInfo {
  resizable: boolean;
  startCollapsible: boolean;
  endCollapsible: boolean;
  showStartCollapsibleIcon: ShowCollapsibleIconMode;
  showEndCollapsibleIcon: ShowCollapsibleIconMode;
}

function getShowCollapsibleIcon(
  prev: { collapsible: boolean; showCollapsibleIcon: ShowCollapsibleIconMode },
  next: { collapsible: boolean; showCollapsibleIcon: ShowCollapsibleIconMode },
): ShowCollapsibleIconMode {
  if (prev.collapsible && next.collapsible) {
    if (prev.showCollapsibleIcon === true || next.showCollapsibleIcon === true) {
      return true;
    }
    if (prev.showCollapsibleIcon === 'auto' || next.showCollapsibleIcon === 'auto') {
      return 'auto';
    }
    return false;
  }
  if (prev.collapsible) {
    return prev.showCollapsibleIcon;
  }
  if (next.collapsible) {
    return next.showCollapsibleIcon;
  }
  return false;
}

export function useResizable(
  items: Ref<SplitterItem[]>,
  pxSizes: Ref<number[]>,
  reverse: Ref<boolean>,
): Ref<ResizableInfo[]> {
  return computed<ResizableInfo[]>(() => {
    const infos: ResizableInfo[] = [];
    for (let i = 0; i < items.value.length - 1; i += 1) {
      const prevItem = items.value[i] as SplitterItem;
      const nextItem = items.value[i + 1] as SplitterItem;
      const prevSize = pxSizes.value[i] ?? 0;
      const nextSize = pxSizes.value[i + 1] ?? 0;
      const {
        resizable: prevResizable = true,
        min: prevMin,
        collapsible: prevCollapsible,
      } = prevItem;
      const {
        resizable: nextResizable = true,
        min: nextMin,
        collapsible: nextCollapsible,
      } = nextItem;

      const mergedResizable =
        // Both need to be resizable
        prevResizable &&
        nextResizable &&
        // Prev is not collapsed and limit min size
        (prevSize !== 0 || !prevMin) &&
        // Next is not collapsed and limit min size
        (nextSize !== 0 || !nextMin);

      const prevEndCollapsible = !!prevCollapsible.end && prevSize > 0;
      const nextStartExpandable = !!nextCollapsible.start && nextSize === 0 && prevSize > 0;
      const startCollapsible = prevEndCollapsible || nextStartExpandable;

      const nextStartCollapsible = !!nextCollapsible.start && nextSize > 0;
      const prevEndExpandable = !!prevCollapsible.end && prevSize === 0 && nextSize > 0;
      const endCollapsible = nextStartCollapsible || prevEndExpandable;

      const showStartCollapsibleIcon = getShowCollapsibleIcon(
        {
          collapsible: prevEndCollapsible,
          showCollapsibleIcon: prevCollapsible.showCollapsibleIcon,
        },
        {
          collapsible: nextStartExpandable,
          showCollapsibleIcon: nextCollapsible.showCollapsibleIcon,
        },
      );
      const showEndCollapsibleIcon = getShowCollapsibleIcon(
        {
          collapsible: nextStartCollapsible,
          showCollapsibleIcon: nextCollapsible.showCollapsibleIcon,
        },
        {
          collapsible: prevEndExpandable,
          showCollapsibleIcon: prevCollapsible.showCollapsibleIcon,
        },
      );

      infos[i] = {
        resizable: mergedResizable,
        startCollapsible: !!(reverse.value ? endCollapsible : startCollapsible),
        endCollapsible: !!(reverse.value ? startCollapsible : endCollapsible),
        showStartCollapsibleIcon: reverse.value ? showEndCollapsibleIcon : showStartCollapsibleIcon,
        showEndCollapsibleIcon: reverse.value ? showStartCollapsibleIcon : showEndCollapsibleIcon,
      };
    }
    return infos;
  });
}

/** collapsible 归一化兜底（测试 / 内部使用）。 */
export const emptyCollapsible: NormalizedCollapsible = {
  start: false,
  end: false,
  showCollapsibleIcon: 'auto',
};
