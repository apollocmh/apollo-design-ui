/**
 * `useId` —— 生成稳定且唯一的 HTML id。
 *
 * 契约来源：`@rc-component/util/hooks/useId`（antd 的 `drawer` / `radio` / `segmented` 使用）。
 *
 * Vue 3.5+ 内置了 `useId()`，语义与 React 的 `useId` 对齐（同一 app 内稳定且唯一）。
 * 我们只包一层「调用方显式传入的 id 优先」的规则，与 rc-util 一致。
 *
 * ⚠️ 与 rc-util 的**有意差异**（登记为 deviation，类型 INTENDED）：
 *    rc-util 在 `NODE_ENV === 'test'` 时**固定返回 `'test-id'`**。
 *    我们没有复刻这个行为，原因：
 *      1. 它会让「同页多个组件各自拿到唯一 id」这条断言在测试环境失效；
 *      2. 它是测试便利，不是对外契约；
 *      3. 固定值会让同页出现重复 id，反而掩盖真实的 a11y 问题。
 *    代价：id 值在不同环境不同 —— 所以**测试不得断言具体 id 值**，
 *    只能断言「非空 / 稳定 / 唯一 / 可作为 aria-* 目标」。
 *
 * 注意 Vue 产出的 id 形如 `v-0`，React 产出 `«r0»` / `:r1:` —— 两者都是合法 HTML id，
 * 但**值不同**，所以跨实现比对时必须归一化（见 tests/compat/README.md §4）。
 */

import { getCurrentInstance, useId as vueUseId } from 'vue';

/** 组件外调用时的兜底计数器。 */
let fallbackSeed = 0;

export function useId(id?: string): string {
  if (id) {
    return id;
  }

  // 允许在组件外使用（例如 headless composable、测试里直接调用）。
  // Vue 的 useId 在没有活动实例时会告警并返回空串，所以必须先自己挡一层。
  if (!getCurrentInstance()) {
    fallbackSeed += 1;
    return `apollo-id-${fallbackSeed}`;
  }

  return vueUseId();
}

export default useId;
