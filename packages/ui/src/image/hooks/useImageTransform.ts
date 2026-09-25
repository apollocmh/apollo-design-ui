/**
 * `useImageTransform` —— rc-image `hooks/useImageTransform.js` 的 Vue 版。
 *
 * 维护 `{ rotate, scale, flipX, flipY, x, y }`，并提供
 * `updateTransform` / `dispatchZoomChange` / `resetTransform`。
 *
 * ⚠️ 判定值：
 * - `scale` clamp 到 `[minScale, maxScale]`（默认 1 / 50）；
 * - `dispatchZoomChange(delta, action, mouseX, mouseY)`：antd 的缩放以
 *   `BASE_SCALE_RATIO`（0.1）为指数底做增量，缩放时保持鼠标位置对应的图像点不动
 *   （见 §「以指针为锚的缩放」）；`action` 为 `zoomIn/zoomOut` 时以**视口中心**
 *   为锚（rc 传 undefined 的鼠标坐标）。
 */
import { type Ref, ref } from 'vue';

import type { TransformInfo } from '../interface';

/** rc 的 previewConfig.BASE_SCALE_RATIO。 */
export const BASE_SCALE_RATIO = 0.1;

export interface UseImageTransformResult {
  transform: Ref<TransformInfo>;
  updateTransform: (next: Partial<TransformInfo>) => void;
  dispatchZoomChange: (
    ratio: number,
    _action?: 'zoomIn' | 'zoomOut' | 'wheel',
    mouseX?: number,
    mouseY?: number,
  ) => void;
  resetTransform: (action?: 'close' | 'reset') => void;
}

const initialTransform = (): TransformInfo => ({
  rotate: 0,
  scale: 1,
  flipX: false,
  flipY: false,
  x: 0,
  y: 0,
});

export function useImageTransform(
  minScale = 1,
  maxScale = 50,
  onTransform?: (info: TransformInfo) => void,
): UseImageTransformResult {
  const transform = ref<TransformInfo>(initialTransform());

  const emit = (): void => {
    onTransform?.({ ...transform.value });
  };

  const updateTransform = (next: Partial<TransformInfo>): void => {
    const merged = { ...transform.value, ...next };
    merged.scale = Math.max(minScale, Math.min(maxScale, merged.scale));
    transform.value = merged;
    emit();
  };

  /**
   * 以指针为锚的缩放：缩放前后，(mouseX, mouseY) 处的图像点位置不变。
   * 设图像中心偏移为 (x, y)，锚点相对中心为 (dx, dy)，则
   *   newX = mouseX - (mouseX - x) * (newScale / oldScale)
   * 鼠标坐标未给定时以视口中心为锚（等价于 dx=dy=0 ⇒ 只缩放不位移）。
   */
  const dispatchZoomChange = (
    ratio: number,
    _action?: 'zoomIn' | 'zoomOut' | 'wheel',
    mouseX?: number,
    mouseY?: number,
  ): void => {
    const { scale, x, y } = transform.value;
    const nextScale = Math.max(minScale, Math.min(maxScale, scale * (1 + ratio)));

    if (mouseX === undefined || mouseY === undefined) {
      transform.value = { ...transform.value, scale: nextScale };
      emit();
      return;
    }

    const ratioScale = nextScale / scale;
    transform.value = {
      ...transform.value,
      scale: nextScale,
      x: mouseX - (mouseX - x) * ratioScale,
      y: mouseY - (mouseY - y) * ratioScale,
    };
    emit();
  };

  const resetTransform = (): void => {
    transform.value = initialTransform();
    emit();
  };

  return { transform, updateTransform, dispatchZoomChange, resetTransform };
}
