/**
 * image 的尺寸工具。
 *
 * ⚠️ 2026-09-26：实现已提到 `_internal/to-css-size.ts`（三次法则：image → drawer → modal）。
 *    本文件只做**再导出**，保持 `Image.ts` / `Progress.ts` 的 import 路径不变。
 */
export { toCssSize } from '../_internal/to-css-size';

import type { ImageCommonProps } from './interface';

/** Only native image attributes cross into imgCommonProps; source metadata stays separate. */
export function getImageCommonProps(source: ImageCommonProps): ImageCommonProps {
  return {
    alt: source.alt,
    crossOrigin: source.crossOrigin,
    decoding: source.decoding,
    loading: source.loading,
    referrerPolicy: source.referrerPolicy,
    sizes: source.sizes,
    srcSet: source.srcSet,
    useMap: source.useMap,
    draggable: source.draggable,
  };
}
