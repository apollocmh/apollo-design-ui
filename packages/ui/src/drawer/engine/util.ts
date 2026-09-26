/**
 * drawer 内核的尺寸工具。
 *
 * ⚠️ 2026-09-26：实现已提到 `_internal/to-css-size.ts`（三次法则：image → drawer → modal）。
 *    本文件只做**再导出**，保持 `DrawerPopup.ts` 的 import 路径不变。
 *
 * 契约说明见 `_internal/to-css-size.ts`：**Vue 的 style 值必须带单位字符串**，
 * `{ width: 378 }`（number）会被静默丢弃 —— 实测整个 style 属性都不出现
 * （PITFALLS 170 / D94）。
 */
export { toCssSize } from '../../_internal/to-css-size';
