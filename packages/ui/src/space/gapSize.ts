/**
 * 间距大小的两条判据。
 *
 * 契约来源：antd 6.6.4 的 `es/_util/gapSize.js`（逐字对齐）。
 *
 * ── 为什么是两条而不是一条 ─────────────────────────────────────────────────────
 *
 * `Space` 的 `size` 有两种**互斥**的落地方式：
 *
 * | 取值 | 判据 | 落地 |
 * |---|---|---|
 * | `'small'` / `'medium'` / `'middle'` / `'large'` | `isPresetSize` | 类名 `-gap-row-{size}` / `-gap-col-{size}`，值交给 CSS 变量 |
 * | 非零数字 | `!isPresetSize && isValidGapNumber` | 内联 `row-gap` / `column-gap` |
 * | `0` / `NaN` / 其它 | 两条都为假 | **什么都不加** |
 *
 * 一个值不可能同时命中两条（预设是字符串、gap 是数字），但代码里两条是
 * **分别**求值的 —— antd 的写法是 `!isPresetSize(x) && isValidGapNumber(x)`，
 * 不是 `else`。保留这个形态，因为「预设字符串同时也满足 gap 数字」这种事
 * 在类型层是不可能的，但阅读时容易想当然。
 *
 * ── `0` 为什么被排除 ───────────────────────────────────────────────────────────
 *
 * antd 的注释：CSS 里 gap 的默认值就是 `0`，用户传 `0` 时直接忽略即可。
 * 判据写成 `if (!size) return false` —— 这是**真值**判断，所以 `0` 与
 * `''` / `null` / `undefined` / `NaN` 走同一条短路。
 *
 * ⚠️ 但 `Space` 里 `size` 的**取值**用的是 `props.size ?? contextSize ?? 'small'`
 *    （`??`，不是 `||`）—— 所以 `size: 0` 会被**取用**，只是它两条判据都为假、
 *    最终不产生任何 gap。这两处判据不同，是最容易写成「顺手用 `||`」的地方：
 *    那样 `size: 0` 会回落到 `'small'` 并加上 `-gap-row-small` 类名。
 *    上游用例：`index.test.tsx` 的 `should render width ConfigProvider support 0`。
 */

import { isNumber } from '@apollo-design/utils';
import type { SizeType } from '../config-provider/size-context';

/**
 * 是不是预设尺寸串。
 *
 * ⚠️ `'middle'` 与 `'medium'` **两个都在**（antd 的注释：`middle` 已废弃，
 *    v7 移除，但存量代码在传）。裁掉任一个都会让对应写法静默失效。
 */
export function isPresetSize(size?: SizeType | string | number): size is SizeType {
  return ['small', 'middle', 'medium', 'large'].includes(size as string);
}

/**
 * 是不是可以当 gap 用的数字。
 *
 * `0` 被**刻意**排除（见文件头）；`NaN` 被 `isNumber` 排除。
 * `'10'` 这类字符串数字也被排除 —— 判据是 `typeof === 'number'`。
 */
export function isValidGapNumber(size?: SizeType | string | number): size is number {
  if (!size) {
    return false;
  }
  return isNumber(size);
}
