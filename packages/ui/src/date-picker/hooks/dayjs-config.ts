/**
 * 日期库适配层的**类型统一**（G4 · S1）。
 *
 * ── 为什么需要这个文件 ──────────────────────────────────────────────────────
 *
 * pnpm 的严格 `node_modules` 让 `dayjs` 在**每个包下各有一份**：
 *
 * ```
 * packages/ui/node_modules/dayjs       ← ui 的副本
 * packages/picker/node_modules/dayjs   ← picker 的副本
 * ```
 *
 * `@apollo-design/picker` 的 `PanelDateType` / `GenerateConfig<Dayjs>` 引用的是
 * **picker 的**那份声明。ui 侧只要把这类类型**放进 `setup()` 的返回值**
 * （template 要用 ⇒ Vue 的 `__VLS_export` 会带上），`vue-tsc` 就会报
 * **TS2742**：
 *
 * ```
 * The inferred type of '__VLS_export' cannot be named without a reference to
 * 'packages/picker/node_modules/dayjs'. This is likely not portable.
 * ```
 *
 * ⇒ 解法不是 `as any` 掩盖，而是**在 ui 侧把类型统一到 ui 自己的 dayjs 声明**。
 * 两者是同一个 dayjs 版本（`catalog:` 统一），`Dayjs` 又是无私有成员的结构类型
 * ⇒ 断言是**纯类型面**的搬运，运行时是同一个对象（`dayjsGenerateConfig` 直接引用）。
 *
 * ⚠️ 断言只写一次、集中在本文档；下游（`.vue` / hooks）一律用 `dayjsConfig`
 * 与 `DatePickerDate`，不再各写 `as`。
 */

import { dayjsGenerateConfig, type GenerateConfig } from '@apollo-design/picker';
import type { Dayjs } from 'dayjs';
import type { DatePickerDate } from '../interface';

/**
 * 日期值类型（= ui 侧的 `Dayjs`）。
 *
 * 与 `interface.ts` 的 `DatePickerDate` 是**同一个类型**（后者也是 ui 的 `Dayjs`）；
 * 这里再导出一次是为了让「引擎适配层」的文件不必反向 import `../interface`。
 */
export type PickerDayjs = Dayjs;

/**
 * 引擎的日期库适配层，类型面统一到 **ui 的 `Dayjs`**。
 *
 * ⚠️ 运行时就是 `@apollo-design/picker` 的 `dayjsGenerateConfig`（同一对象）；
 * 断言只影响类型面的解析路径，从而消掉 TS2742。
 */
export const dayjsConfig = dayjsGenerateConfig as unknown as GenerateConfig<DatePickerDate>;
