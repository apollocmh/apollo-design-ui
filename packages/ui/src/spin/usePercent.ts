/**
 * `percent="auto"` 的进度模拟器。
 *
 * 契约来源：antd 6.6.4 的 `components/spin/usePercent.ts`（**逐条对齐**，含常量）。
 *
 * ── 行为契约（三条，都是可观测的）───────────────────────────────────────────────
 *
 * 1. `percent !== 'auto'` 时**原样返回** `percent`（不做钳制、不补 0）——
 *    钳制发生在 `Progress` 里（`Math.max(Math.min(percent,100), 0)`）。
 * 2. `percent === 'auto'` 且 `spinning` 为真时，每 `AUTO_INTERVAL`（200ms）
 *    推进一跳；推进量按 `prev` 落在哪个 STEP_BUCKETS 区间决定，**越接近 100 越慢**，
 *    所以它是**渐近**的：永远到不了 100，只会无限逼近。
 * 3. `spinning` 由真变假时**只清定时器，不重置** `mockPercent` —— 这是上游行为
 *    （它的 `useEffect` 清理函数只 `clearInterval`），我们逐字保留。
 *
 *    ⚠️ 这一条在**组件层不可观测**：整个指示器块都在 `v-if="spinning"` 里，
 *    `spinning` 为假时根本不渲染，所以看不到「最后一跳的值」。
 *    它的观测点是 hook 层（`__tests__/index.test.ts` 用 `effectScope` 直接驱动
 *    `usePercent`）—— 断言保留在那里，不因为「DOM 上看不见」就删掉契约。
 *    一旦将来把指示器挪出 `v-if`，这条行为会立刻变得可见，而测试已经就绪。
 *
 *    再次变真时 effect 重新执行，会 `mockPercent = 0` 重置 —— 这一条在组件层可观测。
 *
 * ── 与 antd 的一处**平台差异**（PLATFORM）─────────────────────────────────────
 *
 * antd 用 `useEffect(..., [isAuto, spinning])` + `useRef` 存 interval id。
 * Vue 侧用 `watchEffect` + `onCleanup`：依赖集合**恰好**是 `isAuto` 与 `spinning`
 * （`isAuto` 是 computed，只在 `'auto'` ↔ 非 `'auto'` 跨越时才变，所以
 * 「`percent` 从 5 变成 10」不会触发重跑，与 antd 的 `[isAuto, spinning]` 等价）。
 *
 * ⚠️ `mockPercent` **只能写不能读**（在 effect 体内读会把自己变成依赖 ⇒ 无限循环）。
 *    读发生在 `setInterval` 的回调里 —— 那时没有活跃的 effect 在收集依赖，安全。
 */

import {
  type ComputedRef,
  type MaybeRefOrGetter,
  computed,
  ref,
  toValue,
  watchEffect,
} from 'vue';
import type { SpinPercent } from './interface';

/** 自动推进的间隔（毫秒）。与 antd 的 `AUTO_INTERVAL` 同值。 */
export const AUTO_INTERVAL = 200;

/**
 * 分段步长：`[上限, 步长比例]`。与 antd 的 `STEP_BUCKETS` 逐条同值。
 *
 * 语义：`prev <= limit` 时取该档的步长，推进量 = `(100 - prev) * stepPtg`。
 * 四档之后（`prev > 96`）返回 `prev` —— **不再推进**。
 */
export const STEP_BUCKETS: readonly (readonly [number, number])[] = [
  [30, 0.05],
  [70, 0.03],
  [96, 0.01],
];

/**
 * 由上一跳推出下一跳。
 *
 * 与 antd 的 `setMockPercent` 回调函数逐行对应 —— 包括「四档都不命中时返回 `prev`」
 * （此时 `restPTG` 被算出来但没用，与上游一致）。
 */
export function nextPercent(prev: number): number {
  const restPTG = 100 - prev;
  for (let i = 0; i < STEP_BUCKETS.length; i += 1) {
    const bucket = STEP_BUCKETS[i];
    if (!bucket) continue;
    const [limit, stepPtg] = bucket;
    if (prev <= limit) return prev + restPTG * stepPtg;
  }
  return prev;
}

/**
 * 合并后的进度值。
 *
 * @param spinning 内部延迟之后的加载态（不是 `spinning` prop —— 见 `Spin.vue`）
 * @param percent `percent` prop（可以是 getter / ref / 普通值）
 */
export function usePercent(
  spinning: MaybeRefOrGetter<boolean>,
  percent: MaybeRefOrGetter<SpinPercent | undefined>,
): ComputedRef<number | undefined> {
  const mockPercent = ref(0);
  const isAuto = computed(() => toValue(percent) === 'auto');

  watchEffect((onCleanup) => {
    if (isAuto.value && toValue(spinning)) {
      mockPercent.value = 0;
      const id = setInterval(() => {
        mockPercent.value = nextPercent(mockPercent.value);
      }, AUTO_INTERVAL);
      onCleanup(() => clearInterval(id));
    }
  });

  // ⚠️ 判据写成 `raw === 'auto'` 而不是 `isAuto.value`：**只有这里**能让 TS 把
  //    `SpinPercent` 收窄成 `number`（`'auto'` 那一支单独处理），否则返回类型会是
  //    `number | 'auto' | undefined`，与 antd 的 `number | undefined` 不符。
  //    语义上与 antd 的 `isAuto ? mockPercent : percent` 完全相同。
  return computed<number | undefined>(() => {
    const raw = toValue(percent);
    return raw === 'auto' ? mockPercent.value : raw;
  });
}
