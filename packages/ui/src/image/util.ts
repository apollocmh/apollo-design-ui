/**
 * image 的尺寸工具。
 *
 * ⚠️ 2026-09-26：实现已提到 `_internal/to-css-size.ts`（三次法则：image → drawer → modal）。
 *    本文件只做**再导出**，保持 `Image.ts` / `Progress.ts` 的 import 路径不变。
 */
export { toCssSize } from '../_internal/to-css-size';
