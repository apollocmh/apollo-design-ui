/**
 * 后缀图标与清除按钮（G4 · S1）。
 *
 * 契约来源：antd 6.6.4 `es/date-picker/generatePicker/useSuffixIcon.js`（24 行）
 * + `es/date-picker/util.js` 的 `useIcons`（**重新定义**，不搬运）。
 *
 * ── `useSuffixIcon` 的三条判据（逐字）────────────────────────────────────────
 *
 * | 入参 | 结果 |
 * |---|---|
 * | `null` / `false` | **完全不渲染**（返回 `null`） |
 * | `undefined` / `true` | `picker === 'time' ? ClockCircleOutlined : CalendarOutlined`，`hasFeedback` 时**追加** `feedbackIcon` |
 * | 其他 | 原样渲染 |
 *
 * ⚠️ 默认图标带 `aria-hidden="true"`，但**文案标签仍在**（`aria-label="calendar"`）
 * —— 实测 SSR：`<span role="img" aria-label="calendar" aria-hidden="true" class="anticon anticon-calendar">`。
 * 这两个属性看着矛盾，但那是上游逐字产物（L4 会对齐）。
 *
 * ── `useIcons` 的职责（为什么本组件需要它）──────────────────────────────────
 *
 * antd 的 DatePicker 复用 **Select 的 `useIcons`** 来算 `clearIcon`：
 * `clearIcon` 的回退链是「`allowClear.clearIcon` → 独立 `clearIcon` prop（deprecated）
 * → context 的 → 默认 `CloseCircleFilled`」。本仓已有
 * `_internal/use-allow-clear.ts`（第二次法则时收敛的）—— **直接复用，不重写**。
 */

import { CalendarOutlined, ClockCircleOutlined } from '@apollo-design/icons';
import { type ComputedRef, computed, h, type VNodeChild } from 'vue';

export interface UseSuffixIconOptions {
  /** `picker === 'time'` 时用时钟图标。 */
  picker: ComputedRef<string | undefined>;
  hasFeedback: ComputedRef<boolean>;
  feedbackIcon: ComputedRef<VNodeChild>;
  /** 已按「prop ?? context」归一过的值。 */
  suffixIcon: ComputedRef<VNodeChild | boolean | null | undefined>;
}

/**
 * 算后缀图标。
 *
 * ⚠️ 返回值 `null` 表示**完全不渲染** `-suffix` 容器（`suffixIcon === null | false`），
 *    与「渲染一个空容器」不同 —— L4 的节点数会不一样。
 */
export function useSuffixIcon(options: UseSuffixIconOptions): ComputedRef<VNodeChild> {
  return computed<VNodeChild>(() => {
    const suffixIcon = options.suffixIcon.value;

    if (suffixIcon === null || suffixIcon === false) {
      return null;
    }

    if (suffixIcon === true || suffixIcon === undefined) {
      // 上游是 `React.Fragment`：默认图标 + （有反馈时）反馈图标
      const defaultIcon =
        options.picker.value === 'time'
          ? h(ClockCircleOutlined, { 'aria-hidden': 'true' })
          : h(CalendarOutlined, { 'aria-hidden': 'true' });
      const feedback = options.hasFeedback.value ? options.feedbackIcon.value : null;
      return [defaultIcon, feedback];
    }

    return suffixIcon as VNodeChild;
  });
}
