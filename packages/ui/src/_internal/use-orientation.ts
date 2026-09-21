/**
 * 方向合并 —— `orientation` > `vertical` > `direction`。
 *
 * 契约来源：antd 6.6.4 的 `es/_util/hooks/useOrientation.js`（逐字对齐）。
 *
 * ── 为什么它在 `_internal/`（2026-09-21 从 space 提升）────────────────────────
 *
 * antd 把它放在 `components/_util/hooks/`（全库共享）。Divider 当初把这段逻辑
 * **内联在自己的 `.vue` 里**，Space 落地时复制了一份到 `space/useOrientation.ts`
 * （当时按「三次法则」还不到提升的时候，且那两个文件域属于别的流）。
 * Flex 落地（2026-09-21）成为**第三个**消费者，达到三次法则的阈值，
 * 于是按 space/interface.ts 与 space/useOrientation.ts 里的预定计划抽到这里。
 *
 * 现状：`space/useOrientation.ts` 是本模块的 re-export 垫片（space 的三个
 * import 点不动）；`divider` 仍保留内联实现（等它自己的维护流处理）。
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
