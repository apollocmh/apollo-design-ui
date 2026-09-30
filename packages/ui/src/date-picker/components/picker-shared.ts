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

import type { VNodeChild } from 'vue';
import type { InputStatus } from '../../space/statusUtils';

// ---------------------------------------------------------------------------
// 渲染性判定
// ---------------------------------------------------------------------------

/**
 * `isReactRenderable` —— 上游用 `@rc-component/util` 的同名函数。
 *
 * 判据：只排除 `null` / `undefined` / boolean / **空数组**。
 * ⚠️ **空字符串算「可渲染」**（上游不是 truthy 判据）——
 * 写成 `if (!node) return false` 会把 `''` 与 `0` 也误判成不可渲染。
 */
export function isRenderable(node: VNodeChild): boolean {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some((n) => isRenderable(n));
  }
  return true;
}

// ---------------------------------------------------------------------------
// 尺寸与 `input[size]`
// ---------------------------------------------------------------------------

/**
 * 算 `input[size]`（上游 `PickerInput/Selector/hooks/useInputProps.js` 的 `size` 分支，逐字）。
 *
 * ```js
 * const defaultSize = picker === 'time' ? 8 : 10;
 * const length = typeof firstFormat === 'function' ? firstFormat(getNow()).length : firstFormat.length;
 * return Math.max(defaultSize, length) + 2;
 * ```
 *
 * ⇒ 判定值（SSR 实测）：日期 `'YYYY-MM-DD'`（10 字符）⇒ **12**；
 * 带时间 `'YYYY-MM-DD HH:mm:ss'`（19 字符）⇒ **21**。
 *
 * ⚠️ 函数形态的 `format` 要拿 `getNow()` 求值 —— 本仓暂不支持函数形态
 * （跨包欠账，README §5.2），S2 落地时补这条。
 */
export function getInputSize(picker: string | undefined, firstFormat: string | undefined): number {
  const defaultSize = picker === 'time' ? 8 : 10;
  const length = firstFormat ? firstFormat.length : 0;
  return Math.max(defaultSize, length) + 2;
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
// 状态合并（类名不在这里，见文件头）
// ---------------------------------------------------------------------------

/**
 * 合并 Form.Item 的 status 与组件自己的 status（上游 `getMergedStatus`）。
 *
 * 🚨 **为什么另起名字，而不是复用 `form/context.ts` 的同名导出**：
 *
 * | 位置 | 实现 | 与上游 |
 * |---|---|---|
 * | antd `es/_util/statusUtils.js` | `customStatus \|\| contextStatus` | —— 规格 |
 * | 本仓 `form/context.ts` 的 `getMergedStatus` | `customStatus ?? contextStatus` | ❌ **不一致** |
 * | 本文件 | `customStatus \|\| contextStatus` | ✅ 按规格 |
 *
 * 两者只在 **`customStatus === ''`** 时不同（`''` 是 `InputStatus` 的合法取值）：
 * 上游回落到 context，本仓既有实现**不回落**。
 *
 * ⇒ 若此处直接复用 `form/context.ts` 的版本，就会出现「同名函数、两处不同语义」——
 * 那正是本仓最容易埋雷的形态（同 `picker-types.ts` 里两个 `PickerLocale` 的教训）。
 * 所以**改名**为 `getMergedPickerStatus`，并把既有那处的不一致登记到
 * `README §5`（待统一），不擅自改既有组件的行为（跨组件回归要单独过门禁）。
 */
export function getMergedPickerStatus(
  contextStatus: InputStatus | undefined,
  customStatus: InputStatus | undefined,
): InputStatus | undefined {
  return customStatus || contextStatus;
}

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
