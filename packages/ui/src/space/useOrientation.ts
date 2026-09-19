/**
 * 方向合并 —— `orientation` > `vertical` > `direction`。
 *
 * 契约来源：antd 6.6.4 的 `es/_util/hooks/useOrientation.js`（逐字对齐）。
 *
 * ── 为什么它在本组件目录里，而不是 `_internal/` ────────────────────────────────
 *
 * antd 把它放在 `components/_util/hooks/`（全库共享）。我们没有 `_util/`，
 * 而 `packages/ui/src/_internal/` 目前只有两个文件（`use-merge-semantic` /
 * `with-install`）—— Divider 当初把同一段逻辑**内联在自己的 `.vue` 里**，
 * 于是现在全仓有**两份**同构实现（Divider 一份、Space 一份）。
 *
 * 按「三次法则」它还不到提升的时候：等第三个消费者出现（`Flex` / `Descriptions`
 * 之类）再抽到 `_internal/use-orientation.ts`，那时才有三个真实用例来约束抽象。
 * 本轮**不**动 `_internal/` 与 `divider/`（它们是别的流的文件域）。
 *
 * ── 这条判据最容易写错的地方 ───────────────────────────────────────────────────
 *
 * 第二级的判据是 `typeof vertical === 'boolean'`，**不是**真值判断：
 *
 * ```
 * orientation 合法          → 用它
 * 否则 vertical 是布尔       → vertical ? 'vertical' : 'horizontal'
 * 否则 direction 合法        → 用它（旧 API，调用方负责告警）
 * 否则                       → 'horizontal'
 * ```
 *
 * 所以「未传 `vertical`」与「显式传 `vertical={false}`」是**两条不同**的分支。
 * Vue 的 Boolean prop 转换会把未传的布尔 prop 变成 `false`（PITFALLS 46 / D21），
 * 组件的 `withDefaults` 必须显式给 `vertical: undefined` 才能保住这条差异 ——
 * 否则 `<Space direction="vertical" />` 会静默变成 `horizontal`。
 */

import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';

/** 方向。与 antd 的 `Orientation` 同构。 */
export type Orientation = 'horizontal' | 'vertical';

/** 是不是合法的方向值。非字符串、`'left'` 之类都返回 `false`。 */
export function isValidOrientation(value: unknown): value is Orientation {
  return value === 'horizontal' || value === 'vertical';
}

/**
 * 合并三个方向来源，返回 `[方向, 是否垂直]`。
 *
 * ⚠️ 返回 `ComputedRef` 而不是裸元组：antd 用 `useMemo`，而 Vue 侧这三个来源
 *    都是 props，必须让「props 变化 → 类名变化」可追踪。调用方在 `computed` 里
 *    读 `.value` 即可。
 *
 * @param orientation 新 API，优先级最高
 * @param vertical    布尔；**未传时必须保持 `undefined`**（见文件头）
 * @param legacyDirection 旧 API（antd 的 `direction`）
 */
export function useOrientation(
  orientation: MaybeRefOrGetter<Orientation | undefined>,
  vertical: MaybeRefOrGetter<boolean | undefined>,
  legacyDirection: MaybeRefOrGetter<Orientation | undefined>,
): ComputedRef<[Orientation, boolean]> {
  return computed<[Orientation, boolean]>(() => {
    const rawOrientation = toValue(orientation);
    const rawVertical = toValue(vertical);
    const rawLegacy = toValue(legacyDirection);

    let merged: Orientation;
    if (isValidOrientation(rawOrientation)) {
      merged = rawOrientation;
    } else if (typeof rawVertical === 'boolean') {
      merged = rawVertical ? 'vertical' : 'horizontal';
    } else if (isValidOrientation(rawLegacy)) {
      merged = rawLegacy;
    } else {
      merged = 'horizontal';
    }

    return [merged, merged === 'vertical'];
  });
}
