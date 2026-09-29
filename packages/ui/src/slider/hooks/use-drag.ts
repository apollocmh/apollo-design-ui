/**
 * `useDrag` —— rc-slider `hooks/useDrag.js`（219 行）的 Vue 等价物。
 *
 * 职责：把手/整轨的指针拖拽 + 拖拽删除 + 「拖拽期间用 cacheValues、结束后回归 rawValues」。
 * 判据（`docs/analysis/slider.md` §6）：
 *
 *   1. **拖拽用的是 `originValues`（起点快照）而不是当前值** —— 「以把手起点为基准」；
 *   2. `direction` 四方向的百分比与 `removeDist`（**垂直方向**的位移，用于判断拖拽删除）：
 *      ltr → `offsetX/width` + `offsetY`；rtl → `-offsetX/width` + `offsetY`；
 *      btt → `-offsetY/height` + `offsetX`；ttb → `offsetY/height` + `offsetX`；
 *   3. 拖拽删除阈值 **130px**（`REMOVE_DIST`），且必须 `editable && minCount < 当前把手数`；
 *   4. **整轨拖拽**（`valueIndex === -1`）：所有把手同时平移，并把位移量夹到
 *      「不越界」的范围内，再用量化后的差值（`formatValue(start+offset) - start`）重算；
 *      任一禁用把手存在 ⇒ 整轨拖拽被上层禁掉（Track 里 also 拦一次）；
 *   5. `returnValues`：只有当 `cacheValues` 与 `rawValues` 的**差异计数 ≤ (editable ? 1 : 0)** 时
 *      才用 cache（否则用 raw）—— 这是「外部受控值插进来时立刻放弃本地缓存」的判据；
 *   6. 监听器挂在 `document`（move/up）+ `e.currentTarget`（touch），卸载时必须全部摘掉。
 *
 * ⚠️ Vue 与 React 的唯一差异在「状态」：上游用 4 个 useState，本仓用 §`ref`；
 *    `useEvent` 的最新闭包语义由「每次拖拽开始时重新绑定 handler」自然满足。
 */

import { type MaybeRefOrGetter, onBeforeUnmount, type Ref, ref, toValue } from 'vue';
import type { SliderDirection } from '../interface';

/** 拖拽删除的位移阈值（rc 逐字注释：It's a user experience number for dragging out）。 */
export const REMOVE_DIST = 130;

/** 触摸事件取第一个触点；鼠标事件取自身。 */
function getPosition(e: MouseEvent | TouchEvent): { pageX: number; pageY: number } {
  if ('targetTouches' in e) {
    // ⚠️ `targetTouches[0]` 在 `noUncheckedIndexedAccess` 下是 `Touch | undefined`；
    //    真实 touchmove 必有一个触点，缺省分支只是类型兜底（退化成 event 本身）。
    // ⚠️ TouchEvent 本身**没有** pageX/pageY（那是 MouseEvent 的），兜底只能给零值 ——
    //    真实 touchmove 必有触点，这条分支不可达。
    const touch: { pageX: number; pageY: number } = e.targetTouches[0] ?? { pageX: 0, pageY: 0 };
    return { pageX: touch.pageX, pageY: touch.pageY };
  }
  return { pageX: e.pageX, pageY: e.pageY };
}

export interface UseDragOptions {
  containerRef: Ref<HTMLElement | null>;
  direction: MaybeRefOrGetter<SliderDirection>;
  /** 当前值（**内部**已归一/排序的那一份）。 */
  rawValues: MaybeRefOrGetter<number[]>;
  min: MaybeRefOrGetter<number>;
  max: MaybeRefOrGetter<number>;
  formatValue: (value: number) => number;
  triggerChange: (nextValues: number[]) => void;
  finishChange: (draggingDelete: boolean) => void;
  offsetValues: (
    values: number[],
    offset: number | 'min' | 'max',
    valueIndex: number,
    mode?: 'unit' | 'dist',
  ) => { value: number; values: number[] };
  /** `range.editable && !hasDisabledHandle`（可增删节点）。 */
  editable: MaybeRefOrGetter<boolean>;
  minCount: MaybeRefOrGetter<number>;
  isHandleDisabled: (index: number) => boolean;
  onDragStart?: (info: {
    rawValues: number[];
    draggingIndex: number;
    draggingValue: number;
  }) => void;
  onDragChange?: (info: {
    rawValues: number[];
    deleteIndex: number;
    draggingIndex: number;
    draggingValue: number | null;
  }) => void;
}

export interface UseDragResult {
  draggingIndex: Ref<number>;
  draggingValue: Ref<number | null>;
  draggingDelete: Ref<boolean>;
  /** 拖拽期间应渲染的值（见判据 5）。 */
  cacheValues: Ref<number[]>;
  onStartMove: (e: MouseEvent | TouchEvent, valueIndex: number, startValues?: number[]) => void;
  cancel: () => void;
}

export function useDrag(options: UseDragOptions): UseDragResult {
  const draggingIndex = ref(-1);
  const draggingValue = ref<number | null>(null);
  const draggingDelete = ref(false);
  const cacheValues = ref<number[]>([...toValue(options.rawValues)]);
  let originValues: number[] = [...toValue(options.rawValues)];

  let moveHandler: ((e: MouseEvent | TouchEvent) => void) | null = null;
  let upHandler: ((e: MouseEvent | TouchEvent) => void) | null = null;
  let touchTarget: EventTarget | null = null;

  const detach = (): void => {
    if (moveHandler) document.removeEventListener('mousemove', moveHandler as EventListener);
    if (upHandler) document.removeEventListener('mouseup', upHandler as EventListener);
    if (touchTarget) {
      if (moveHandler) touchTarget.removeEventListener('touchmove', moveHandler as EventListener);
      if (upHandler) touchTarget.removeEventListener('touchend', upHandler as EventListener);
    }
    moveHandler = null;
    upHandler = null;
    touchTarget = null;
  };

  onBeforeUnmount(detach);

  const flushValues = (nextValues: number[], nextValue?: number, deleteMark = false): void => {
    if (nextValue !== undefined) {
      draggingValue.value = nextValue;
    }
    cacheValues.value = nextValues;
    let changeValues = nextValues;
    if (deleteMark) {
      changeValues = nextValues.filter((_, i) => i !== draggingIndex.value);
    }
    options.triggerChange(changeValues);
    options.onDragChange?.({
      rawValues: nextValues,
      deleteIndex: deleteMark ? draggingIndex.value : -1,
      draggingIndex: draggingIndex.value,
      draggingValue: nextValue ?? null,
    });
  };

  const updateCacheValue = (
    valueIndex: number,
    offsetPercent: number,
    deleteMark: boolean,
  ): void => {
    const min = toValue(options.min);
    const max = toValue(options.max);
    if (valueIndex === -1) {
      // >>>> 整轨拖拽：所有把手一起平移
      if (originValues.some((_, index) => options.isHandleDisabled(index))) {
        return;
      }
      const startValue = originValues[0] ?? min;
      const endValue = originValues[originValues.length - 1] ?? max;
      const maxStartOffset = min - startValue;
      const maxEndOffset = max - endValue;

      let offset = offsetPercent * (max - min);
      offset = Math.max(offset, maxStartOffset);
      offset = Math.min(offset, maxEndOffset);

      // 用量化后的差值回算（保证落在 step/marks 网格上）
      const formatStartValue = options.formatValue(startValue + offset);
      offset = formatStartValue - startValue;
      const cloneCacheValues = originValues.map((val) => val + offset);
      flushValues(cloneCacheValues);
      return;
    }

    // >>>> 拖把手
    const offsetDist = (max - min) * offsetPercent;
    const cloneValues = [...cacheValues.value];
    cloneValues[valueIndex] = originValues[valueIndex] ?? min;
    const next = options.offsetValues(cloneValues, offsetDist, valueIndex, 'dist');
    flushValues(next.values, next.value, deleteMark);
  };

  const onStartMove = (
    e: MouseEvent | TouchEvent,
    valueIndex: number,
    startValues?: number[],
  ): void => {
    e.stopPropagation();
    const min = toValue(options.min);
    const max = toValue(options.max);
    const initialValues = startValues ?? [...toValue(options.rawValues)];
    if (options.isHandleDisabled(valueIndex)) {
      return;
    }

    const originValue = initialValues[valueIndex] ?? min;
    draggingIndex.value = valueIndex;
    draggingValue.value = originValue;
    originValues = initialValues;
    cacheValues.value = initialValues;
    draggingDelete.value = false;

    options.onDragStart?.({
      rawValues: initialValues,
      draggingIndex: valueIndex,
      draggingValue: originValue,
    });

    const { pageX: startX, pageY: startY } = getPosition(e);
    let deleteMark = false;

    const onMove = (event: MouseEvent | TouchEvent): void => {
      event.preventDefault();
      const { pageX: moveX, pageY: moveY } = getPosition(event);
      const offsetX = moveX - startX;
      const offsetY = moveY - startY;
      const rect = options.containerRef.value?.getBoundingClientRect();
      const width = rect?.width ?? 0;
      const height = rect?.height ?? 0;

      let offsetPercent: number;
      let removeDist: number;
      switch (toValue(options.direction)) {
        case 'btt':
          offsetPercent = -offsetY / height;
          removeDist = offsetX;
          break;
        case 'ttb':
          offsetPercent = offsetY / height;
          removeDist = offsetX;
          break;
        case 'rtl':
          offsetPercent = -offsetX / width;
          removeDist = offsetY;
          break;
        default:
          offsetPercent = offsetX / width;
          removeDist = offsetY;
      }

      deleteMark = toValue(options.editable)
        ? Math.abs(removeDist) > REMOVE_DIST && toValue(options.minCount) < cacheValues.value.length
        : false;
      draggingDelete.value = deleteMark;
      updateCacheValue(valueIndex, offsetPercent, deleteMark);
    };

    const onUp = (event: MouseEvent | TouchEvent): void => {
      event.preventDefault();
      detach();
      options.finishChange(deleteMark);
      draggingIndex.value = -1;
      draggingDelete.value = false;
    };

    // 先摘掉可能残留的监听（连点两次 mousedown 不会叠监听）
    detach();
    document.addEventListener('mouseup', onUp as EventListener);
    document.addEventListener('mousemove', onMove as EventListener);
    const target = e.currentTarget as EventTarget | null;
    if (target) {
      target.addEventListener('touchend', onUp as EventListener);
      target.addEventListener('touchmove', onMove as EventListener);
      touchTarget = target;
    }
    moveHandler = onMove;
    upHandler = onUp;
    void min;
    void max;
  };

  return {
    draggingIndex,
    draggingValue,
    draggingDelete,
    cacheValues,
    onStartMove,
    cancel: detach,
  };
}

/**
 * 拖拽期间应渲染的值（rc 的 `returnValues`）。
 *
 * 判据：`cacheValues` 与 `rawValues` 的多重集差异 ≤ `editable ? 1 : 0` 时才用 cache，
 *      否则说明外部值已经变了、本地缓存失效 ⇒ 立刻回到 `rawValues`。
 */
export function resolveDragValues(
  rawValues: number[],
  cacheValues: number[],
  editable: boolean,
): number[] {
  const counts: Record<number, number> = {};
  [...cacheValues]
    .sort((a, b) => a - b)
    .forEach((val) => {
      counts[val] = (counts[val] || 0) + 1;
    });
  [...rawValues]
    .sort((a, b) => a - b)
    .forEach((val) => {
      counts[val] = (counts[val] || 0) - 1;
    });
  const diffCount = Object.values(counts).reduce((prev, next) => prev + Math.abs(next), 0);
  return diffCount <= (editable ? 1 : 0) ? cacheValues : rawValues;
}
