/**
 * modal 的局部工具。
 *
 * `fallbackProp` —— antd `_util/fallbackProp.ts` 的 Vue 版（**第一个消费者**；
 * 按三次法则先留在组件内，第三个消费者出现时提到 `_internal/`）。
 *
 * ⚠️ 语义是「**第一个非 `undefined`**」，与 `??` 不同 —— `??` 会跳过 `null`：
 *   `fallbackProp(null, 'x')` ⇒ `null`（`??` 会得到 `'x'`）。
 *   `Modal.confirm` 的 `okText: null` 正是靠这条把默认文案「显式清空」。
 */
import type { VNodeChild } from 'vue';

export function fallbackProp<T>(...args: T[]): T | undefined {
  return args.find((arg) => arg !== undefined);
}

/**
 * `fallbackProp` 的 **`VNodeChild` 专用版**（非泛型）。
 *
 * ⚠️ 为什么要单列：`fallbackProp<VNodeChild>(a, b)` 会让 TS 在 `VNodeChild` 这个
 *    很深的联合上做泛型实例化，直接报 `TS2589: Type instantiation is excessively deep`
 *    （modal 的 `useModal` 实测）。显式签名把类型推理挡在函数边界外。
 */
export function fallbackNode(...args: VNodeChild[]): VNodeChild | undefined {
  return args.find((arg) => arg !== undefined);
}

/**
 * antd `buttonHelpers.convertLegacyProps(type)`：`'danger'` / `'ghost'` 是**布尔 prop**
 * 而不是 `type` 的取值，其余原样进 `type`。
 */
export function convertLegacyProps(type?: string): Record<string, unknown> {
  if (type === 'danger' || type === 'ghost') {
    return { [type]: true };
  }
  return type ? { type } : {};
}

/**
 * antd `_util/motion.getTransitionName(rootPrefixCls, motion, transitionName)`。
 *
 * ⚠️ 动效名的前缀是 **rootPrefixCls**（`apollo`），不是组件前缀（`apollo-modal`）——
 *    所以 modal 的 zoom 类是 `.apollo-zoom-*`、fade 类是 `.apollo-fade-*`
 *    （`style/index.ts` 里那批**裸类**规则就是它们）。
 *    `transitionName` 显式给了就用它（含空串）。
 */
export function getTransitionName(
  rootPrefixCls: string,
  motion: string,
  transitionName?: string,
): string {
  if (transitionName !== undefined) return transitionName;
  return `${rootPrefixCls}-${motion}`;
}
