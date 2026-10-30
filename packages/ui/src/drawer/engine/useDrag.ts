/**
 * Mouse resizing follows current options and owns listeners in the panel's document.
 * Historical reference: @rc-component/drawer 1.4.2 es/hooks/useDrag.js.
 */
import {
  type ComputedRef,
  type CSSProperties,
  computed,
  type MaybeRefOrGetter,
  onScopeDispose,
  type Ref,
  ref,
  toValue,
  watch,
} from 'vue';
import { clsx } from '../../_internal/clsx';
import type { DrawerPlacement } from '../interface';

export interface UseDragOptions {
  enabled?: boolean;
  prefixCls: string;
  direction: DrawerPlacement;
  className?: string;
  style?: CSSProperties;
  maxSize?: number;
  containerRef: Ref<HTMLElement | null>;
  currentSize?: number | string;
  onResize?: (size: number) => void;
  onResizeStart?: (size: number) => void;
  onResizeEnd?: (size: number) => void;
}
export interface UseDragResult {
  dragElementProps: ComputedRef<Record<string, unknown>>;
  isDragging: Ref<boolean>;
}

export function useDrag(options: MaybeRefOrGetter<UseDragOptions>): UseDragResult {
  const isDragging = ref(false);
  let startPos = 0;
  let startSize = 0;
  let owner: Document | null = null;
  const opts = () => toValue(options);
  const horizontal = () => opts().direction === 'left' || opts().direction === 'right';

  const release = () => {
    owner?.removeEventListener('mousemove', handleMouseMove);
    owner?.removeEventListener('mouseup', handleMouseUp);
    owner = null;
    isDragging.value = false;
  };
  const handleMouseDown = (event: MouseEvent) => {
    const o = opts();
    const element = o.containerRef.value;
    if (o.enabled === false || !element || event.button !== 0) return;
    release();
    event.preventDefault();
    event.stopPropagation();
    startPos = horizontal() ? event.clientX : event.clientY;
    const rect = element.getBoundingClientRect();
    startSize =
      typeof o.currentSize === 'number' ? o.currentSize : horizontal() ? rect.width : rect.height;
    owner = element.ownerDocument;
    owner.addEventListener('mousemove', handleMouseMove);
    owner.addEventListener('mouseup', handleMouseUp);
    isDragging.value = true;
    o.onResizeStart?.(startSize);
  };
  function handleMouseMove(event: MouseEvent) {
    if (!isDragging.value) return;
    const o = opts();
    const coordinate = horizontal() ? event.clientX : event.clientY;
    const delta =
      (coordinate - startPos) * (o.direction === 'right' || o.direction === 'bottom' ? -1 : 1);
    const size = Math.max(0, Math.min(startSize + delta, o.maxSize ?? Number.POSITIVE_INFINITY));
    o.onResize?.(size);
  }
  function handleMouseUp() {
    if (!isDragging.value) return;
    const o = opts();
    const rect = o.containerRef.value?.getBoundingClientRect();
    const size = rect ? (horizontal() ? rect.width : rect.height) : undefined;
    release();
    if (size !== undefined) o.onResizeEnd?.(size);
  }
  watch([() => opts().enabled, () => opts().direction, () => opts().containerRef.value], release, {
    flush: 'sync',
  });
  onScopeDispose(release);

  const dragElementProps = computed(() => {
    const o = opts();
    return {
      class: clsx(
        `${o.prefixCls}-dragger`,
        `${o.prefixCls}-dragger-${o.direction}`,
        {
          [`${o.prefixCls}-dragger-dragging`]: isDragging.value,
          [`${o.prefixCls}-dragger-horizontal`]: horizontal(),
          [`${o.prefixCls}-dragger-vertical`]: !horizontal(),
        },
        o.className,
      ),
      style: o.style,
      onMousedown: handleMouseDown,
    };
  });
  return { dragElementProps, isDragging };
}
