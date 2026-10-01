/**
 * `date-picker` 组件层的**共用纯归一**（G4 · S1）。
 *
 * 为什么单独一个文件：这批函数被 `Selector.ts`（输入框）、`root-class.ts`（根类名）
 * 与后续的 `.vue` 壳**三边**用。放任一侧会导致反向依赖（H11），复制多份会漂移。
 *
 * 每一条都注明上游出处（**读源码得到，不是推测**）。
 *
 * ⚠️ **状态类名不在这里** —— 它已有既有实现 `space/statusUtils.ts` 的
 * `getStatusClassNames`（逐字对齐上游），`root-class.ts` 直接复用。
 */

import { isRenderable } from '@apollo-design/utils';
import type { VNodeChild } from 'vue';
import type { MergedFormatEntry } from '../hooks/picker-format';
import type { DatePickerDate } from '../interface';

// ---------------------------------------------------------------------------
// 渲染性判定
// ---------------------------------------------------------------------------
//
// 🚨 **2026-10-01 修正：本文件不再自带 `isRenderable`。**
//
// 此前这里有一份**本地副本**，注释写着「只排除 `null` / `undefined` / boolean /
// **空数组**」且「**空字符串算可渲染**」—— **两条都与上游不符**。
// 上游 `@rc-component/util` 的 `isReactRenderable`（`es/is.js`）是：
//
// ```js
// // Returns `false` only for `null`, `undefined`, `false`, and `''`;
// // all other values, including `0` and `true`, are treated as renderable.
// export function isReactRenderable(value) {
//   return isNonNullable(value) && value !== false && value !== '';
// }
// ```
//
// ⇒ ① `''` **不可**渲染（`renderExtraFooter: () => ''` 不该把页脚凭空撑出来）；
//    ② 数组是普通值，**不**做递归判空（`[]` ⇒ `true`）；
//    ③ `true` **算**可渲染（本地副本的 `typeof === 'boolean'` 一刀切是错的）。
//
// 本仓的权威实现在 `@apollo-design/utils` 的 `isRenderable`（`is.ts:40`，逐字同上游），
// 全库 20+ 处用它 —— 收敛到那一份，**不要**在这里再起一份。
// 消费方直接 `import { isRenderable } from '@apollo-design/utils'`。

// ---------------------------------------------------------------------------
// 尺寸与 `input[size]`
// ---------------------------------------------------------------------------

/**
 * 归一后的 `firstFormat` → 用于 `input[size]` 的字符数（上游 `useInputProps.js` 的 `length` 分支）。
 *
 * ```js
 * const length = typeof firstFormat === 'function'
 *   ? firstFormat(generateConfig.getNow()).length   // ← 函数形态要**先求值**
 *   : firstFormat.length;
 * ```
 *
 * ⚠️ 函数形态（`CustomFormat`）没有 `.length` 的语义（那是**形参个数**）
 * ⇒ 必须先拿 `now` 求值。2026-10-01 起支持（`mergeFormat` 会保留函数）。
 *
 * ⚠️ 上游是在 `useMemo([firstFormat, picker, generateConfig])` 里算的 ⇒ 每次
 * `getNow()` 都是**当时**的值。本仓由调用方放进 `computed` 即可（缓存语义等价）。
 */
export function getFormatLength(
  firstFormat: MergedFormatEntry | undefined,
  now: DatePickerDate,
): number {
  if (!firstFormat) {
    return 0;
  }
  return typeof firstFormat === 'function' ? firstFormat(now).length : firstFormat.length;
}

/**
 * 算 `input[size]`（上游 `useInputProps.js` 的 `size` 分支，逐字）。
 *
 * ```js
 * const defaultSize = picker === 'time' ? 8 : 10;
 * return Math.max(defaultSize, length) + 2;
 * ```
 *
 * ⇒ 判定值（SSR 实测）：日期 `'YYYY-MM-DD'`（10 字符）⇒ **12**；
 * 带时间 `'YYYY-MM-DD HH:mm:ss'`（19 字符）⇒ **21**。
 *
 * ⚠️ 第二参是**已求值的字符数**（由 {@link getFormatLength} 给出）——
 * 本函数保持纯数值运算，不碰日期库（函数形态的求值在上一环）。
 */
export function getInputSize(picker: string | undefined, formatLength: number): number {
  const defaultSize = picker === 'time' ? 8 : 10;
  return Math.max(defaultSize, formatLength) + 2;
}

// ---------------------------------------------------------------------------
// 两端状态的归一
// ---------------------------------------------------------------------------

/**
 * 归一 `disabled` 成两端形态。
 *
 * ⚠️ 与 {@link isPairDisabled} 是**两件事**：
 *   - 本函数回答「**每一端**禁用吗」（拆成 `[start, end]`，供输入框属性与 `showClear`）；
 *   - `isPairDisabled` 回答「**整体**算禁用吗」（供根类名 `-disabled`）。
 */
export function toDisabledPair(
  disabled: boolean | [boolean, boolean] | undefined,
): [boolean, boolean] {
  if (Array.isArray(disabled)) {
    return [Boolean(disabled[0]), Boolean(disabled[1])];
  }
  const d = disabled === true;
  return [d, d];
}

/** 归一 `allowEmpty` 成两端形态（形状约定同 {@link toDisabledPair}）。 */
export function toAllowEmptyPair(
  allowEmpty: boolean | [boolean, boolean] | undefined,
): [boolean, boolean] | undefined {
  if (allowEmpty === undefined) {
    return undefined;
  }
  if (Array.isArray(allowEmpty)) {
    return [Boolean(allowEmpty[0]), Boolean(allowEmpty[1])];
  }
  return [allowEmpty, allowEmpty];
}

/**
 * **整体**是否禁用（根类名 `-disabled` 用）。
 *
 * 上游 `RangeSelector.js:168` 是 `disabled.every(i => i)` ⇒ **两端都禁才加 `-disabled`**。
 * 若误用「任一端禁用」判根类名，「只禁 start」会让整块错误地变灰。
 */
export function isPairDisabled(disabled: boolean | [boolean, boolean] | undefined): boolean {
  return toDisabledPair(disabled).every(Boolean);
}

// ---------------------------------------------------------------------------
// 状态合并
// ---------------------------------------------------------------------------
//
// ⚠️ **本文件不再自带状态合并** —— 2026-09-30 已把 `form/context.ts` 的
// `getMergedStatus` 从 `??` 统一成 **`||`**（与上游 `_util/statusUtils.js` 逐字一致），
// 因此 date-picker 与 input / select / input-number **共用同一个函数**。
//
// 此前本文件曾另起名 `getMergedPickerStatus` 以避开「同名不同义」（PITFALLS 223 记的
// 那次既有不一致）—— 现在不一致已消除，改名版**已删除**，避免留下两份语义相同的实现。
//
// 消费方直接 `import { getMergedStatus } from '../../form/context'`。

// ---------------------------------------------------------------------------
// `needConfirm` 的默认值
// ---------------------------------------------------------------------------

/**
 * `needConfirm` 的合并值（上游 `useFilledProps.js:74-76`，逐字）。
 *
 * ```js
 * const multipleInteractivePicker = internalPicker === 'time' || internalPicker === 'datetime';
 * const complexPicker = multipleInteractivePicker || multiple;
 * const mergedNeedConfirm = needConfirm ?? multipleInteractivePicker;
 * ```
 *
 * ⇒ **默认值取决于内部模式**：
 *
 * | 内部模式 | 默认 `needConfirm` | 行为 |
 * |---|---|---|
 * | `date` / `week` / `month` / `quarter` / `year` | `false` | 点面板格子**立即提交** |
 * | `time` | `true` | 必须点「确定」 |
 * | `datetime`（= `date` + `showTime`） | `true` | 必须点「确定」 |
 *
 * ⚠️ `'datetime'` **不是** `PickerMode` 的成员（它是 `InternalMode` 独有的组合态）
 * ⇒ 调用方必须传 `toInternalMode(picker, showTime)` 的结果，不能传 `props.picker`。
 * 传错会让 `showTime` 的日期选择器**点一下就提交**（与上游不一致）。
 *
 * ⚠️ 判据是 **`??`**（不是 `||`）—— `needConfirm: false` 是「显式关闭」，必须生效。
 */
export function getMergedNeedConfirm(
  needConfirm: boolean | undefined,
  internalPicker: string,
): boolean {
  const multipleInteractivePicker = internalPicker === 'time' || internalPicker === 'datetime';
  return needConfirm ?? multipleInteractivePicker;
}

// ---------------------------------------------------------------------------
// `showNow`（页脚的「此刻 / 今天」按钮）
// ---------------------------------------------------------------------------

/**
 * 「此刻 / 今天」按钮是否显示（上游 `PickerInput/hooks/useShowNow.js`，逐字）。
 *
 * ```js
 * export default function useShowNow(picker, mode, showNow, showToday, rangePicker) {
 *   if (mode !== 'date' && mode !== 'time') { return false; }
 *   if (showNow !== undefined) { return showNow; }
 *   // Compatible with old version `showToday`
 *   if (showToday !== undefined) { return showToday; }
 *   return !rangePicker && (picker === 'date' || picker === 'time');
 * }
 * ```
 *
 * ⚠️ 第二参是 **`mergedMode`（面板当前粒度）**，不是 `picker` —— 所以
 * 「下钻到月 / 年面板」会让页脚**消失**（`month` / `year` 变体在 antd 基线里
 * 根本没有页脚，容器高 309 而不是 348）。
 *
 * ⚠️ 调用方还要再叠一层上游 `Popup/index.js:130` 的覆盖：
 * `showNow={multiple ? false : showNow}`（`multiple` 恒为 false）。
 *
 * ⚠️ `showNow` / `showToday` 的判据是 **`!== undefined`**（不是 truthy）——
 * `showToday: false` 是「显式关闭」，必须生效。
 */
export function getShowNow(
  picker: string | undefined,
  mode: string | undefined,
  showNow: boolean | undefined,
  showToday: boolean | undefined,
  rangePicker?: boolean,
): boolean {
  if (mode !== 'date' && mode !== 'time') {
    return false;
  }
  if (showNow !== undefined) {
    return showNow;
  }
  if (showToday !== undefined) {
    return showToday;
  }
  return !rangePicker && (picker === 'date' || picker === 'time');
}

// ---------------------------------------------------------------------------
// `showClear`（两个形态的判据不同）
// ---------------------------------------------------------------------------

/** 单值的 `showClear`（上游 `SingleSelector/index.js:127`，逐字）。 */
export function getSingleShowClear(
  clearIcon: VNodeChild,
  valueLength: number,
  disabled: boolean,
): boolean {
  return isRenderable(clearIcon) && valueLength > 0 && !disabled;
}

/** 范围的 `showClear`（上游 `RangeSelector.js:156`，逐字）。 */
export function getRangeShowClear(
  clearIcon: VNodeChild,
  valueLengths: readonly [number, number],
  disabled: readonly [boolean, boolean],
): boolean {
  return (
    isRenderable(clearIcon) &&
    ((valueLengths[0] > 0 && !disabled[0]) || (valueLengths[1] > 0 && !disabled[1]))
  );
}
