/**
 * `useDrag` —— `@rc-component/drawer@1.4.2` `es/hooks/useDrag.js` 的 Vue 版（`resizable` 用）。
 *
 * 契约逐条对齐上游：
 *   1. `mousedown` 时 `preventDefault + stopPropagation`，记下起始坐标与起始尺寸
 *      （`currentSize` 是数字就用它，否则实测容器的 `getBoundingClientRect`）；
 *   2. `mousemove` 只在拖拽中生效；**`right` / `bottom` 的 delta 取反**
 *      （往左拖才是变大）；`newSize` 先夹到 `>= 0`，有 `maxSize` 再夹上界；
 *   3. `mouseup` 用**实测尺寸**回调 `onResizeEnd`（不是最后算出的 `newSize`）；
 *   4. 监听挂在 `document` 上（拖到面板外也不断），拖拽结束即摘；
 *   5. 手柄类名：`{p}-dragger` + `{p}-dragger-{direction}` + 拖拽中 `-dragging`
 *      + `-horizontal` / `-vertical`。
 */
import { type MaybeRefOrGetter, onScopeDispose, ref, toValue, watch } from 'vue';
import { clsx } from '../../_internal/clsx';

export interface UseDragOptions {
  prefixCls: string;
  direction: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  style?: Record<string, unknown>;
  maxSize?: number;
  containerRef: { value: HTMLElement | null };
  currentSize?: number | string;
  onResize?: (size: number) => void;
  onResizeStart?: (size: number) => void;
  onResizeEnd?: (size: number) => void;
}

export interface UseDragResult {
  dragElementProps: Record<string, unknown>;
  isDragging: { value: boolean };
}

// ⚠️ 这里原先有一份本地 clsx（字符串 + `{[k]: boolean}` 对象形态）—— 2026-10-07 删除。
//    它与 `_internal/clsx.ts` 那份在自己的输入空间下**行为一致**（后者是超集，
//    额外支持数字与数组；并会跳过空串 —— 那只会少产空格，不会少产类名）。
//    ⇒ 统一到共享层，消掉本仓最后一份重复实现。

export function useDrag(options: MaybeRefOrGetter<UseDragOptions>): UseDragResult {
  const isDragging = ref(false);
  const startPos = ref(0);
  const startSize = ref(0);

  const opts = (): UseDragOptions => toValue(options);

  const handleMouseDown = (e: MouseEvent): void => {
    const o = opts();
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = true;

    const horizontal = o.direction === 'left' || o.direction === 'right';
    startPos.value = horizontal ? e.clientX : e.clientY;

    let size: number | undefined;
    if (typeof o.currentSize === 'number') {
      size = o.currentSize;
    } else if (o.containerRef.value) {
      const rect = o.containerRef.value.getBoundingClientRect();
      size = horizontal ? rect.width : rect.height;
    }
    startSize.value = size ?? 0;
    o.onResizeStart?.(startSize.value);
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isDragging.value) return;
    const o = opts();
    const horizontal = o.direction === 'left' || o.direction === 'right';
    const currentPos = horizontal ? e.clientX : e.clientY;

    let delta = currentPos - startPos.value;
    if (o.direction === 'right' || o.direction === 'bottom') {
      delta = -delta;
    }
    let newSize = startSize.value + delta;
    if (newSize < 0) newSize = 0;
    if (o.maxSize && newSize > o.maxSize) newSize = o.maxSize;

    o.onResize?.(newSize);
  };

  const handleMouseUp = (): void => {
    if (!isDragging.value) return;
    const o = opts();
    isDragging.value = false;

    if (o.containerRef.value) {
      const rect = o.containerRef.value.getBoundingClientRect();
      const horizontal = o.direction === 'left' || o.direction === 'right';
      o.onResizeEnd?.(horizontal ? rect.width : rect.height);
    }
  };

  watch(isDragging, (dragging) => {
    if (!dragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  // 拖拽中卸载也要摘监听（上游是 effect 的 cleanup）
  watch(isDragging, (dragging, _prev, onCleanup) => {
    if (!dragging) return;
    onCleanup(() => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    });
  });

  onScopeDispose(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  const o = opts();
  const horizontal = o.direction === 'left' || o.direction === 'right';
  const dragElementProps = {
    class: clsx(
      `${o.prefixCls}-dragger`,
      `${o.prefixCls}-dragger-${o.direction}`,
      {
        [`${o.prefixCls}-dragger-dragging`]: isDragging.value,
        [`${o.prefixCls}-dragger-horizontal`]: horizontal,
        [`${o.prefixCls}-dragger-vertical`]: !horizontal,
      },
      o.className,
    ),
    style: o.style,
    onMousedown: handleMouseDown,
  };

  return { dragElementProps, isDragging };
}
