/** Native mouse/touch gesture ownership with scoped cancellation and the existing offset algorithms. */
import { type MaybeRefOrGetter, onBeforeUnmount, type Ref, ref, toValue } from 'vue';
import type { SliderDirection } from '../interface';

export const REMOVE_DIST = 130;
function getPosition(event: MouseEvent | TouchEvent, identifier?: number) {
  if ('targetTouches' in event) {
    const touches = event.touches.length ? event.touches : event.targetTouches;
    const point =
      identifier === undefined
        ? touches[0]
        : Array.from(touches).find((touch) => touch.identifier === identifier);
    return point
      ? { pageX: point.pageX, pageY: point.pageY, identifier: point.identifier }
      : undefined;
  }
  return { pageX: event.pageX, pageY: event.pageY, identifier: undefined };
}
export interface UseDragOptions {
  containerRef: Ref<HTMLElement | null>;
  direction: MaybeRefOrGetter<SliderDirection>;
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
  editable: MaybeRefOrGetter<boolean>;
  minCount: MaybeRefOrGetter<number>;
  isHandleDisabled: (index: number) => boolean;
  onCancel?: () => void;
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
  dragging: Ref<boolean>;
  draggingIndex: Ref<number>;
  draggingValue: Ref<number | null>;
  draggingDelete: Ref<boolean>;
  cacheValues: Ref<number[]>;
  onStartMove: (event: MouseEvent | TouchEvent, valueIndex: number, startValues?: number[]) => void;
  cancel: () => void;
}
export function useDrag(options: UseDragOptions): UseDragResult {
  const dragging = ref(false);
  const draggingIndex = ref(-1);
  const draggingValue = ref<number | null>(null);
  const draggingDelete = ref(false);
  const cacheValues = ref<number[]>([...toValue(options.rawValues)]);
  let originValues: number[] = [...toValue(options.rawValues)];
  let ownerDocument: Document | null = null;
  let ownerWindow: Window | null = null;
  let moveHandler: ((event: MouseEvent | TouchEvent) => void) | null = null;
  let upHandler: ((event: MouseEvent | TouchEvent) => void) | null = null;
  let cancelHandler: ((event: TouchEvent) => void) | null = null;
  const detach = () => {
    if (moveHandler) {
      ownerDocument?.removeEventListener('mousemove', moveHandler);
      ownerDocument?.removeEventListener('touchmove', moveHandler);
    }
    if (upHandler) {
      ownerDocument?.removeEventListener('mouseup', upHandler);
      ownerDocument?.removeEventListener('touchend', upHandler);
    }
    if (cancelHandler) ownerDocument?.removeEventListener('touchcancel', cancelHandler);
    ownerWindow?.removeEventListener('blur', cancel);
    moveHandler = null;
    upHandler = null;
    cancelHandler = null;
    ownerDocument = null;
    ownerWindow = null;
  };
  const cancel = () => {
    detach();
    dragging.value = false;
    draggingIndex.value = -1;
    draggingDelete.value = false;
    options.onCancel?.();
  };
  onBeforeUnmount(cancel);
  const flushValues = (nextValues: number[], nextValue?: number, deleteMark = false) => {
    if (nextValue !== undefined) draggingValue.value = nextValue;
    cacheValues.value = nextValues;
    options.triggerChange(
      deleteMark ? nextValues.filter((_, index) => index !== draggingIndex.value) : nextValues,
    );
    options.onDragChange?.({
      rawValues: nextValues,
      deleteIndex: deleteMark ? draggingIndex.value : -1,
      draggingIndex: draggingIndex.value,
      draggingValue: nextValue ?? null,
    });
  };
  const updateCacheValue = (valueIndex: number, offsetPercent: number, deleteMark: boolean) => {
    const min = toValue(options.min),
      max = toValue(options.max);
    if (valueIndex === -1) {
      if (originValues.some((_, index) => options.isHandleDisabled(index))) return;
      const start = originValues[0] ?? min,
        end = originValues[originValues.length - 1] ?? max;
      let offset = Math.min(Math.max(offsetPercent * (max - min), min - start), max - end);
      offset = options.formatValue(start + offset) - start;
      flushValues(originValues.map((value) => value + offset));
    } else {
      if (options.isHandleDisabled(valueIndex)) return;
      const clone = [...cacheValues.value];
      clone[valueIndex] = originValues[valueIndex] ?? min;
      const next = options.offsetValues(clone, (max - min) * offsetPercent, valueIndex, 'dist');
      flushValues(next.values, next.value, deleteMark);
    }
  };
  const onStartMove = (
    event: MouseEvent | TouchEvent,
    valueIndex: number,
    startValues?: number[],
  ) => {
    if (dragging.value && 'targetTouches' in event) return;
    if (event.defaultPrevented || (!('targetTouches' in event) && event.button !== 0)) return;
    const container = options.containerRef.value;
    const point = getPosition(event);
    if (!container || !point || (valueIndex !== -1 && options.isHandleDisabled(valueIndex))) return;
    if (
      valueIndex === -1 &&
      toValue(options.rawValues).some((_, index) => options.isHandleDisabled(index))
    )
      return;
    cancel();
    event.stopPropagation();
    const initialValues = startValues ?? [...toValue(options.rawValues)];
    const originValue = initialValues[valueIndex] ?? toValue(options.min);
    dragging.value = true;
    draggingIndex.value = valueIndex;
    draggingValue.value = originValue;
    originValues = [...initialValues];
    cacheValues.value = [...initialValues];
    draggingDelete.value = false;
    options.onDragStart?.({
      rawValues: initialValues,
      draggingIndex: valueIndex,
      draggingValue: originValue,
    });
    let deleteMark = false;
    const onMove = (move: MouseEvent | TouchEvent) => {
      const position = getPosition(move, point.identifier);
      if (!position) return;
      const rect = container.getBoundingClientRect();
      const direction = toValue(options.direction);
      const size = direction === 'ttb' || direction === 'btt' ? rect.height : rect.width;
      if (size <= 0) return;
      move.preventDefault();
      const x = position.pageX - point.pageX,
        y = position.pageY - point.pageY;
      const distance =
        direction === 'btt' ? -y : direction === 'ttb' ? y : direction === 'rtl' ? -x : x;
      const removeDist = direction === 'ttb' || direction === 'btt' ? x : y;
      deleteMark =
        toValue(options.editable) &&
        Math.abs(removeDist) > REMOVE_DIST &&
        toValue(options.minCount) < cacheValues.value.length;
      draggingDelete.value = deleteMark;
      updateCacheValue(valueIndex, distance / size, deleteMark);
    };
    const onUp = (event: MouseEvent | TouchEvent) => {
      if (
        'touches' in event &&
        Array.from(event.touches).some((touch) => touch.identifier === point.identifier)
      )
        return;
      detach();
      options.finishChange(deleteMark);
      dragging.value = false;
      draggingIndex.value = -1;
      draggingDelete.value = false;
    };
    ownerDocument = container.ownerDocument;
    ownerWindow = ownerDocument.defaultView;
    const onCancel = (event: TouchEvent) => {
      if (!Array.from(event.touches).some((touch) => touch.identifier === point.identifier))
        cancel();
    };
    moveHandler = onMove;
    upHandler = onUp;
    cancelHandler = onCancel;
    ownerWindow?.addEventListener('blur', cancel);
    if ('targetTouches' in event) {
      ownerDocument.addEventListener('touchmove', onMove, { passive: false });
      ownerDocument.addEventListener('touchend', onUp);
      ownerDocument.addEventListener('touchcancel', onCancel);
    } else {
      ownerDocument.addEventListener('mousemove', onMove);
      ownerDocument.addEventListener('mouseup', onUp);
    }
  };
  return {
    dragging,
    draggingIndex,
    draggingValue,
    draggingDelete,
    cacheValues,
    onStartMove,
    cancel,
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
