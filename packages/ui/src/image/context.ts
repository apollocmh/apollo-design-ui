/**
 * image 的 PreviewGroup 上下文（rc-image `context.js` + `useRegisterImage` +
 * `usePreviewItems` 的 Vue 版）。
 *
 * 注册协议（rc 逐字）：
 * - 组内 Image 挂载时拿到一个**稳定自增 id**（uid 全局递增，字符串形态）；
 * - 每次 data 变化都 `register(id, data)`（覆盖同 id），卸载时 `unregister(id)`；
 * - 顺序由「Object.keys(images)」的插入顺序保证（JS 对象对整数键会按数值序，
 *   对字符串键按插入序 —— rc 用的是字符串 uid ⇒ 插入序，本仓同样用字符串）。
 */
import { type InjectionKey, inject, provide, type Ref, ref, shallowRef } from 'vue';

import type { ImageCommonProps } from './interface';

export interface RegisteredImage {
  data: ImageCommonProps & { src?: string };
  canPreview: boolean;
  id?: string;
}

export interface PreviewGroupContextValue {
  register: (id: string, data: RegisteredImage) => () => void;
  onPreview: (id: string, src: string | undefined, left: number, top: number) => void;
  isPreviewOpen: Ref<boolean>;
  mousePosition: Ref<{ x: number; y: number } | null>;
  current: Ref<number>;
}

export const previewGroupContextKey: InjectionKey<PreviewGroupContextValue> =
  Symbol('previewGroupContext');

export function usePreviewGroup(): PreviewGroupContextValue | null {
  return inject(previewGroupContextKey, null);
}

export function providePreviewGroup(ctx: PreviewGroupContextValue): void {
  provide(previewGroupContextKey, ctx);
}

/** rc 的全局 uid（字符串形态 —— 保证插入序）。 */
let uid = 0;
export function nextImageId(): string {
  uid += 1;
  return String(uid);
}

/** rc 的 usePreviewItems：`Map<string, RegisteredImage>`（插入序）。 */
export function createImageRegistry() {
  const images = shallowRef(new Map<string, RegisteredImage>());

  const register = (id: string, data: RegisteredImage): (() => void) => {
    const clone = new Map(images.value);
    clone.set(id, data);
    images.value = clone;
    return () => {
      const next = new Map(images.value);
      next.delete(id);
      images.value = next;
    };
  };

  const list = ref<RegisteredImage[]>([]);

  return { images, register, list };
}

/** 从 images Map 里筛出可预览项（rc 的 mergedItems 的注册分支）。 */
export function filterPreviewable(
  images: Map<string, RegisteredImage>,
): Array<RegisteredImage & { id: string }> {
  const out: Array<RegisteredImage & { id: string }> = [];
  for (const [id, item] of images) {
    if (item.canPreview) out.push({ ...item, id });
  }
  return out;
}
