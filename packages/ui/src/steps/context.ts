/**
 * Steps 的两个**内部**上下文 —— 供 `Timeline` 这类「把 Steps 当内核复用」的组件使用。
 *
 * 契约来源：antd 6.6.4 的 `components/steps/context.ts`（`InternalContext`）与
 * `@rc-component/steps` 的 `UnstableContext`。
 *
 * ── 为什么需要它们 ────────────────────────────────────────────────────────────
 *
 * antd 的 `Timeline` **没有自己的 DOM** —— 它是 `<Steps type="dot" />` 的薄壳，
 * 靠这两个上下文把 Steps 改造成「时间轴」的形态：
 *
 * | 上下文 | 作用 | Timeline 传的值 |
 * |---|---|---|
 * | `stepsInternalContextKey` | 覆盖**根元素**与**项元素**的标签 | `{ rootComponent: 'ol', itemComponent: 'li' }` |
 * | `stepsUnstableContextKey` | rail（连线）的 status 跟**当前**项还是**下一**项 | `{ railFollowPrevStatus: reverse }` |
 *
 * ── 🚨 一处**必须**的平台差异：不能只靠 `provide` 的「最近的赢」────────────────
 *
 * `Steps` **自己**也 `provide(stepsIconContextKey, …)`，而 `Step` 是它的后代
 * ⇒ 如果 `Timeline` 在 `Steps` **外面** `provide` 同族的键，`Step` 拿到的是
 * **Steps 的那一份**（外层被遮蔽）—— 这正是 PITFALLS **256** 的形态。
 *
 * ⇒ 本仓的解法：`Steps` **接住**注入的值，并把它**合并进自己的 provide**
 *   （`ItemComponent`）与**自己的渲染**（`rootComponent` / `railFollowPrevStatus`）。
 *   于是「外层 provide + Steps 转发」等价于上游的嵌套 Context。
 *
 * ⚠️ 两个键都**不进** `StepsProps` —— 它们是内部协议，不是公开 API
 *   （上游同样把它们藏在 context 里，`Steps` 的文档里没有）。
 */

import type { InjectionKey } from 'vue';

/** `InternalContext` 的值。与上游 `InternalContextProps` 同形。 */
export interface StepsInternalContextValue {
  /** 根元素标签。上游 `Timeline` 传 `'ol'`；缺省时 `Steps` 用 `'div'`。 */
  rootComponent?: string;
  /** 项元素标签。上游 `Timeline` 传 `'li'`；缺省时 `Step` 用 `'div'`。 */
  itemComponent?: string;
}

/** `UnstableContext` 的值。与 rc-steps 同形（目前只有一个键）。 */
export interface StepsUnstableContextValue {
  /**
   * rail（连线）的 status 跟谁。
   *
   * - `false`（默认）⇒ 跟**下一项**的 status（「连线通向下一步」）
   * - `true` ⇒ 跟**当前项**的 status
   *
   * 判据（rc-steps `Step.js:147`）：`status: railFollowPrevStatus ? status : nextStatus`。
   * ⚠️ 本仓 `Step` 侧的历史实现**恒取 `nextStatus`**（`Step.ts:221`），
   *    新增的开关只是把这个既有行为变成可切换。
   */
  railFollowPrevStatus?: boolean;
}

/** `Steps` 读取、`Timeline` 提供（见文件头的「最近的赢」说明）。 */
export const stepsInternalContextKey: InjectionKey<StepsInternalContextValue> = Symbol(
  'apolloStepsInternalContext',
);

/** `Steps` 读取、`Timeline` 提供。 */
export const stepsUnstableContextKey: InjectionKey<StepsUnstableContextValue> = Symbol(
  'apolloStepsUnstableContext',
);
