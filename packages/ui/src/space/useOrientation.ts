/**
 * 方向合并 —— **re-export 垫片**。
 *
 * 2026-09-21 Flex 成为第三个消费者，实现按预定计划提升到
 * `_internal/use-orientation.ts`（三次法则；提升原因与判据说明见该文件头）。
 * 保留本文件是为了让 space 内部的三个 import 点
 * （`interface.ts` / `Space.vue` / `Compact.vue`）与既有测试不用改。
 */

export { isValidOrientation, type Orientation, useOrientation } from '../_internal/use-orientation';
