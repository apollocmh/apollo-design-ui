/**
 * 浮层接线的配置与纯函数（G4 · S1）。
 *
 * 契约来源（**读源码得到**）：
 *   - rc `@rc-component/picker@1.12.2` 的 `PickerTrigger/index.js`（`BUILT_IN_PLACEMENTS`
 *     + Trigger 的 props 组装）
 *   - rc 的 `PickerTrigger/util.js`（`pickTriggerProps` 只挑 6 个键）
 *   - rc 的 `utils/uiUtil.js` 的 `getRealPlacement`
 *   - antd `es/date-picker/generatePicker/generateSinglePicker.js:176`（`transitionName` 默认）
 *
 * ── 为什么这些必须逐字对拍 ──────────────────────────────────────────────────
 *
 * `points` / `offset` / `overflow` 三个量直接决定浮层位置与「越界翻转」行为，
 * 任何一位写错都会在 L6 逐像素里暴露，但**在 jsdom 里完全看不出来**
 * （无布局）⇒ 只能靠这份配置与上游逐字一致来保证。
 *
 * ⚠️ `topLeft` / `topRight` 的 `overflow.adjustX` 是 **0**（不是 1）——
 * 与 `bottom*` 的 `adjustX: 1` **不同**。这是最容易「顺手写成 1」的一处。
 */

import type { AlignType } from '@apollo-design/position';

/**
 * 上游 `BUILT_IN_PLACEMENTS`（`PickerTrigger/index.js:12-47`，逐字）。
 *
 * | placement | points | offset | overflow |
 * |---|---|---|---|
 * | `bottomLeft` | `['tl', 'bl']` | `[0, 4]` | `adjustX: 1, adjustY: 1` |
 * | `bottomRight` | `['tr', 'br']` | `[0, 4]` | `adjustX: 1, adjustY: 1` |
 * | `topLeft` | `['bl', 'tl']` | `[0, -4]` | **`adjustX: 0`**, `adjustY: 1` |
 * | `topRight` | `['br', 'tr']` | `[0, -4]` | **`adjustX: 0`**, `adjustY: 1` |
 *
 * ⚠️ 类型刻意写成**四个键的映射**（不是 `Record<string, AlignType>`）——
 * `Record<string, …>` 在 `noUncheckedIndexedAccess` 下索引出来是 `AlignType | undefined`，
 * 调用方每次都得断言；写成具体键集既能表达「恰好四个」，也让 `Trigger` 的
 * `builtinPlacements[placement]` 查表保持可选语义（查不到就是 `undefined`，与上游一致）。
 */
export const BUILT_IN_PLACEMENTS: Partial<Record<string, AlignType>> & {
  bottomLeft: AlignType;
  bottomRight: AlignType;
  topLeft: AlignType;
  topRight: AlignType;
} = {
  bottomLeft: {
    points: ['tl', 'bl'],
    offset: [0, 4],
    overflow: { adjustX: 1, adjustY: 1 },
  },
  bottomRight: {
    points: ['tr', 'br'],
    offset: [0, 4],
    overflow: { adjustX: 1, adjustY: 1 },
  },
  topLeft: {
    points: ['bl', 'tl'],
    offset: [0, -4],
    overflow: { adjustX: 0, adjustY: 1 },
  },
  topRight: {
    points: ['br', 'tr'],
    offset: [0, -4],
    overflow: { adjustX: 0, adjustY: 1 },
  },
};

/**
 * 上游 `getRealPlacement(placement, rtl)`（`utils/uiUtil.js:8-13`，逐字）。
 *
 * ```js
 * function getRealPlacement(placement, rtl) {
 *   if (placement !== undefined) return placement;
 *   return rtl ? 'bottomRight' : 'bottomLeft';
 * }
 * ```
 *
 * ⇒ 默认落点**跟着方向走**：LTR `bottomLeft` / RTL `bottomRight`。
 * ⚠️ 这是「默认值」而非「RTL 就翻转」：用户显式给了 `placement` 就**原样用**，
 * 不做镜像（镜像由 CSS 的 `-rtl` 段负责）。
 */
export function getRealPlacement(placement: string | undefined, rtl: boolean): string {
  if (placement !== undefined) {
    return placement;
  }
  return rtl ? 'bottomRight' : 'bottomLeft';
}

/**
 * 浮层的类名（rc `PickerTrigger/index.js:81-84`）。
 *
 * ```js
 * popupClassName: clsx(popupClassName, {
 *   [`${dropdownPrefixCls}-range`]: range,
 *   [`${dropdownPrefixCls}-rtl`]: direction === 'rtl',
 * })
 * ```
 *
 * ⚠️ 这里的 `dropdownPrefixCls` = `${prefixCls}-dropdown`（`ant-picker-dropdown`），
 * 而 **`prefixCls` 本身是 `ant-picker`**（不是 `ant-date-picker`）——
 * 见 `interface.ts` 文件头的差异说明。
 */
export function getDropdownClassName(options: {
  prefixCls: string;
  range: boolean;
  rtl: boolean;
  popupClassName?: string;
}): (string | undefined)[] {
  const dropdownPrefixCls = `${options.prefixCls}-dropdown`;
  return [
    options.popupClassName,
    options.range ? `${dropdownPrefixCls}-range` : undefined,
    options.rtl ? `${dropdownPrefixCls}-rtl` : undefined,
  ];
}

/**
 * 浮层动效名（antd `generateSinglePicker.js:176` 的默认值）。
 *
 * ```js
 * transitionName: `${rootPrefixCls}-slide-up`,
 * ```
 *
 * 🚨 前缀是 **`rootPrefixCls`**（默认 `apollo`），不是组件前缀
 * ⇒ `apollo-slide-up`。写成 `${prefixCls}-slide-up`（= `apollo-picker-slide-up`）
 * 会让**动效静默失效**（PITFALLS 180 同族：动效类名不匹配时不报错，只是不播）。
 */
export function getTransitionName(
  rootPrefixCls: string,
  transitionName: string | undefined,
): string {
  return transitionName ?? `${rootPrefixCls}-slide-up`;
}
