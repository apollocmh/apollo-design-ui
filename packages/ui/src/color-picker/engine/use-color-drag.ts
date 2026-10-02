/**
 * `useColorDrag` —— 取色面板 / 滑块的拖拽内核（rc `hooks/useColorDrag.js` 107 行的移植）。
 *
 * ── 与上游的一处**有意**重构（唯一一处）────────────────────────────────────────
 *
 * 上游在 `updateOffset` 里直接读 `containerRef.current.getBoundingClientRect()`。
 * 本仓**照旧读真实矩形**（这是拖拽的固有行为，不能改），但把「偏移 → 颜色」的映射
 * 留在**纯函数** `calculateColor` 里（`engine/util.ts`）⇒ 几何可被 L1 直接喂矩形钉死。
 * 本 hook 只负责「读矩形 + 算偏移 + 挂/摘 document 监听」。
 *
 * ── 四条照抄的判据 ────────────────────────────────────────────────────────────
 *
 * 1. **`onDragStart` 先摘旧监听**（上游注释指向 antd issue 43529）——
 *    重复 mousedown 时不清旧的会累积监听。
 * 2. **`disabledDrag` 在摘完监听之后、`updateOffset` 之前** return
 *    ⇒ 禁用时**不**派发任何 `onDragChange`（但旧监听仍被清掉）。
 * 3. **「排除边界情形」的判据是 `targetWidth === 0 && targetHeight === 0 || targetWidth !== targetHeight`**
 *    ⇒ 手柄**非正方形**（或尺寸为 0，如未布局）时**直接 `return`，不派发**。
 *    ⚠️ 这条在 jsdom 里**恒真**（矩形全 0）⇒ 用例必须自己 mock 矩形。
 * 4. **`direction === 'x'` 时 `y` 取上一次的值**（横向滑块不跟着鼠标上下动）。
 */

import { type MaybeRefOrGetter, onBeforeUnmount, type Ref, ref, toValue, watch } from 'vue';
import type { Color } from './color';
import type { TransformOffset } from './interface';

/** 拖拽事件（鼠标 + 触摸）。 */
export type ColorDragEvent = MouseEvent | TouchEvent;

/**
 * 取事件坐标（rc `getPosition` 逐字）。
 *
 * ⚠️ 减去滚动偏移：`pageX` 是**文档**坐标，而矩形是**视口**坐标 ——
 * 不减去的话页面滚动后手柄会跳。
 */
function getPosition(e: ColorDragEvent): { pageX: number; pageY: number } {
  const obj: MouseEvent | Touch = 'touches' in e ? (e.touches[0] as Touch) : e;
  const scrollXOffset =
    document.documentElement.scrollLeft || document.body.scrollLeft || window.pageXOffset;
  const scrollYOffset =
    document.documentElement.scrollTop || document.body.scrollTop || window.pageYOffset;
  return { pageX: obj.pageX - scrollXOffset, pageY: obj.pageY - scrollYOffset };
}

export interface UseColorDragProps {
  /** 当前颜色（变化时把偏移重置为「由颜色反算」的位置）。 */
  color: MaybeRefOrGetter<Color>;
  /** 手柄元素（用于取它的宽高）。 */
  targetRef: Ref<HTMLElement | null>;
  /** 可拖拽容器（用于取它的宽高与位置）。 */
  containerRef: Ref<HTMLElement | null>;
  /** 由当前颜色反算偏移（纯函数 `calcOffset`）。 */
  calculate: () => TransformOffset;
  /** 拖拽中（每次移动）。 */
  onDragChange?: (offset: TransformOffset) => void;
  /** 拖拽结束（mouseup / touchend）。 */
  onDragChangeComplete?: () => void;
  /** `'x'` = 只在横轴移动（滑块）；不传 = 两轴（取色面板）。 */
  direction?: 'x';
  /** 禁用拖拽。 */
  disabledDrag?: boolean;
}

export function useColorDrag(
  props: UseColorDragProps,
): [Ref<TransformOffset>, (e: ColorDragEvent) => void] {
  const offsetValue = ref<TransformOffset>({ x: 0, y: 0 });
  let mouseMoveHandler: ((e: ColorDragEvent) => void) | null = null;
  let mouseUpHandler: ((e: ColorDragEvent) => void) | null = null;

  // 上游 `useEffect(() => setOffsetValue(calculate()), [color])`
  watch(
    () => toValue(props.color),
    () => {
      offsetValue.value = props.calculate();
    },
    { immediate: true },
  );

  const removeListeners = (): void => {
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('touchmove', mouseMoveHandler);
    }
    if (mouseUpHandler) {
      document.removeEventListener('mouseup', mouseUpHandler);
      document.removeEventListener('touchend', mouseUpHandler);
    }
    mouseMoveHandler = null;
    mouseUpHandler = null;
  };

  onBeforeUnmount(removeListeners);

  const updateOffset = (e: ColorDragEvent): boolean => {
    const container = props.containerRef.value;
    const target = props.targetRef.value;
    if (!container || !target) {
      return false;
    }

    const { pageX, pageY } = getPosition(e);
    const { x: rectX, y: rectY, width, height } = container.getBoundingClientRect();
    const { width: targetWidth, height: targetHeight } = target.getBoundingClientRect();

    const centerOffsetX = targetWidth / 2;
    const centerOffsetY = targetHeight / 2;
    const offsetX = Math.max(0, Math.min(pageX - rectX, width)) - centerOffsetX;
    const offsetY = Math.max(0, Math.min(pageY - rectY, height)) - centerOffsetY;

    const calcOffsetValue: TransformOffset = {
      x: offsetX,
      // 横向滑块：y 保持上一次的值
      y: props.direction === 'x' ? offsetValue.value.y : offsetY,
    };

    // 判据 3：排除边界情形（手柄非正方形 / 未布局）
    if ((targetWidth === 0 && targetHeight === 0) || targetWidth !== targetHeight) {
      return false;
    }

    props.onDragChange?.(calcOffsetValue);
    return true;
  };

  const onDragMove = (e: ColorDragEvent): void => {
    e.preventDefault();
    updateOffset(e);
  };

  const onDragStop = (e: ColorDragEvent): void => {
    e.preventDefault();
    removeListeners();
    props.onDragChangeComplete?.();
  };

  const onDragStart = (e: ColorDragEvent): void => {
    // 判据 1：先摘旧监听（antd issue 43529）
    removeListeners();

    // 判据 2：禁用时不派发（但旧监听已经清掉）
    if (props.disabledDrag) {
      return;
    }

    updateOffset(e);
    mouseMoveHandler = onDragMove;
    mouseUpHandler = onDragStop;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragStop);
    document.addEventListener('touchmove', onDragMove);
    document.addEventListener('touchend', onDragStop);
  };

  return [offsetValue, onDragStart];
}
