/**
 * `mountTest` —— 渲染 → 更新 → 卸载不报错，且**不留观察者泄漏**。
 *
 * ── 与上游的关系（`tests/shared/mountTest.tsx`，17 行）──────────────────────────
 * 上游的全部契约是：
 *
 *     expect(() => { rerender(<Component />); unmount(); }).not.toThrow();
 *
 * 我们保留它，并加三条上游没有的断言：
 *   1. **无未豁免的告警**（上游完全不管告警）
 *   2. **无观察者泄漏**：卸载后 `ResizeObserver` / `MutationObserver` 不应继续持有元素
 *   3. 更新路径被**真的走到**（Vue 的重渲染，不是重新挂载）
 *
 * 第 2 条是「无内存泄漏警告」这句话的可执行版本。`vitest.setup.ts` 里那两个桩
 * 把 `instances` 定义为**可观测的契约**，正是为了让这件事能被断言而不是靠猜。
 *
 * ── 观察者泄漏的判据（两者语义不同，不能混为一谈）──────────────────────────────
 * | 桩 | 生命周期 | 泄漏判据 |
 * |---|---|---|
 * | `MutationObserver` | **每元素一个**（`observeMutation` 的实现） | `instances.size === 0` |
 * | `ResizeObserver` | **全局单例**（`observeResize` 的实现） | 每个实例的 `targets.size === 0` |
 *
 * ⚠️ `ResizeObserver` 不能断言 `instances.size === 0`：单例在最后一个元素取消监听后
 *    仍然存活（只有 `resetResizeObserver()` 会断开它）。断言实例数为 0 会让所有
 *    用了 `useResizeObserver` 的组件**必然失败**，且失败原因指向错误的方向。
 *
 * ── 这个测试没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**行为**正确。`TESTING.md` T14 明文：「不允许用 mountTest 替代行为测试」。
 *   - 没证明**属性/插槽**被正确处理 —— 它只证明「没炸」。
 *   - 泄漏判据只覆盖**本仓库自己的** observer 封装。第三方库自己 new 的
 *     `IntersectionObserver` 等不在观测范围内（jsdom 也没有 `IntersectionObserver`）。
 */

import { describe, expect, it } from 'vitest';
import { assertAllowance, assertAllowances } from './allowance';
import { mountCase } from './render';
import type { RenderFactory, WarningAllowance, Wrap } from './types';
import { assertNoUnexpectedWarnings, captureWarnings } from './warnings';

/**
 * `mountTest` 的选项。
 *
 * ⚠️ **刻意不继承 `RenderSource`** —— `RenderSource` 里有 `demos`，而 `mountTest`
 *    只接受 `render`。继承会让 `mountTest('button', { demos })` 在类型层合法、
 *    只在运行期报错。封闭接口把「传错选项」提前到编译期
 *    （运行期仍保留守卫，保护 JS 调用方）。
 */
export interface MountTestOptions {
  /**
   * 渲染工厂。它测的是「同一个渲染源反复更新」，所以需要能重复调用同一个工厂。
   *
   * 要遍历 demo 请用 `demoTest`（它的入参是 `demos`）。
   */
  render?: RenderFactory;
  /** Provider 包装。默认恒等。 */
  wrap?: Wrap;
  /**
   * 更新次数。默认 1 —— 走一次更新路径即可暴露「只在挂载时正确」的实现。
   * 想验证「连续更新不累积副作用」时调大。
   */
  updates?: number;
  /**
   * 是否断言观察者无泄漏。
   *
   * - `'auto'`（默认）：仅当环境里能观测到 observer 桩的 `instances`
   *   （即本仓库的 `vitest.setup.ts` 桩已生效）时才断言。在别的环境里静默跳过 ——
   *   而不是伪造一个「通过」。
   * - `{ skip: true, reason }`：**显式**跳过。`reason` 必填 ——
   *   与全包「不允许沉默的例外」同源（同 `Allowance`）。
   *   刻意不提供 `false`：一个布尔开关就是一条可以无声关掉断言的通道。
   */
  assertNoLeak?: 'auto' | { skip: true; reason: string };
  /** 允许的告警。必须带 `reason`。 */
  allow?: readonly WarningAllowance[];
}

interface ObservableObserver {
  instances?: Set<unknown>;
}
interface ObservableResizeObserver {
  targets?: Set<Element>;
}

/** 取出桩的 `instances`。没有桩（或桩没暴露 `instances`）时返回 null。 */
function observableInstances(): {
  resize: Set<unknown>;
  mutation: Set<unknown>;
} | null {
  const resize = (globalThis as { ResizeObserver?: ObservableObserver }).ResizeObserver;
  const mutation = (globalThis as { MutationObserver?: ObservableObserver }).MutationObserver;
  if (!resize?.instances || !mutation?.instances) return null;
  return { resize: resize.instances, mutation: mutation.instances };
}

/**
 * 挂载**之前**的观察者基线。
 *
 * ── 为什么需要它（2026-09-17 实测）─────────────────────────────────────────────
 *
 * 原判据是「卸载后 `MutationObserver.instances.size === 0`」，也就是**绝对值**。
 * 它在第一个真实组件（`packages/ui/src/empty`）落地时暴露为误报：
 *
 *   `axe-core`（`a11y-demo-test.ts` 的依赖）在**模块导入期**就 `new MutationObserver(...)`
 *   并一直持有。于是只要一个测试文件从 `@apollo-design/test-utils` 的入口导入任何东西
 *   （barrel 会把 `a11y-demo-test` 一起拉进来），这个实例就恒在 ——
 *   `mountTest` 对**每一个**组件都必然失败，且失败信息指向组件，指向完全错误的方向。
 *
 * 实测证据（同一台机器）：
 *   import 'vue'                            → instances.size = 0
 *   import '@apollo-design/utils'           → 0
 *   import '@apollo-design/test-utils'      → 1
 *   import '@apollo-design/test-utils/a11y-demo-test' → 1
 *
 * ── 改成的判据 ────────────────────────────────────────────────────────────────
 *
 * 「**这次挂载**没有新增未断开的观察者」。这才是 `mountTest` 想表达的契约：
 * 组件自己不该泄漏。至于别人在导入期留下的长命观察者，不是组件的责任，
 * 也不该由组件的测试来断言 —— 用绝对值断言只会训练人忽略红灯。
 *
 * ⚠️ 这是**收窄到正确的范围**，不是放宽：新增实例仍然会被抓到，而且现在
 *    失败信息只指向真的由本次挂载产生的泄漏。
 */
export interface ObserverBaseline {
  mutation: ReadonlySet<unknown>;
  resizeTargets: ReadonlyMap<unknown, number>;
}

/** 记录当前的观察者状态，供 {@link describeObserverLeaks} 做增量判定。 */
export function snapshotObservers(): ObserverBaseline | null {
  const instances = observableInstances();
  if (instances === null) return null;
  const resizeTargets = new Map<unknown, number>();
  for (const instance of instances.resize) {
    resizeTargets.set(instance, (instance as ObservableResizeObserver).targets?.size ?? 0);
  }
  return { mutation: new Set(instances.mutation), resizeTargets };
}

/**
 * 描述当前的观察者泄漏。空数组 = 无泄漏。
 *
 * 返回**可读描述**而不是布尔值：失败时应当直接看到「哪个 observer 还挂着几个元素」，
 * 而不是一句 `expected true to be false`。
 *
 * @param baseline 传 `snapshotObservers()` 的结果时，只统计**新增**的实例与**新增**的
 *   监听目标（见 {@link ObserverBaseline}）。不传则做绝对值判定。
 */
export function describeObserverLeaks(baseline?: ObserverBaseline | null): string[] {
  const instances = observableInstances();
  if (instances === null) return [];

  const leaks: string[] = [];

  if (baseline === undefined || baseline === null) {
    if (instances.mutation.size > 0) {
      leaks.push(`MutationObserver 泄漏 ${instances.mutation.size} 个实例（未 disconnect）`);
    }
  } else {
    const fresh = [...instances.mutation].filter((instance) => !baseline.mutation.has(instance));
    if (fresh.length > 0) {
      leaks.push(`MutationObserver 泄漏 ${fresh.length} 个实例（未 disconnect）`);
    }
  }

  for (const [index, instance] of [...instances.resize].entries()) {
    const size = (instance as ObservableResizeObserver).targets?.size ?? 0;
    const before = baseline?.resizeTargets.get(instance) ?? 0;
    const delta = size - before;
    if (delta > 0) {
      leaks.push(`ResizeObserver[${index}] 仍观察着 ${delta} 个元素（未 unobserve）`);
    }
  }

  return leaks;
}

/**
 * L1/L2 共享契约：组件能被渲染、更新、卸载而不报错、不告警、不泄漏。
 *
 * @param name    用例名（通常是组件名）。
 * @param options 渲染源 + 选项。`demos` 与 `render` 互斥。
 */
export function mountTest(name: string, options: MountTestOptions): void {
  const { updates = 1 } = options;
  const leakMode = options.assertNoLeak ?? 'auto';

  // ⚠️ 结构错误在**收集阶段**抛出（`describe` 之前）—— 快速失败，
  //    且让这条错误本身可被单测断言（`expect(() => mountTest(...)).toThrow()`）。
  const factory = options.render;
  if (factory === undefined) {
    throw new Error(
      `[test-utils] mountTest('${name}')：只接受 render。\n` +
        '  它测的是「同一个渲染源反复更新」，需要能重复调用同一个工厂。\n' +
        '  要遍历 demo 请用 demoTest —— 它的入参是 demos。',
    );
  }

  if (typeof leakMode === 'object') {
    assertAllowance(leakMode, `mountTest('${name}') → assertNoLeak`);
  }
  const assertLeak = leakMode === 'auto' ? observableInstances() !== null : !leakMode.skip;
  // ⚠️ 与 demoTest / a11yDemoTest / rtlTest / themeTest 一致：收集阶段就校验豁免。
  assertAllowances(options.allow ?? [], `mountTest('${name}')`);

  describe(`${name} · mount / unmount`, () => {
    it('渲染 → 更新 → 卸载：不抛错、不告警、不留观察者', async () => {
      const capture = captureWarnings();
      // 增量基线：只统计「本次挂载新增」的泄漏。理由见 ObserverBaseline 的注释。
      const baseline = assertLeak ? snapshotObservers() : null;
      let destroyed = false;

      try {
        const mounted = mountCase(
          factory,
          options.wrap === undefined ? {} : { wrap: options.wrap },
        );
        try {
          for (let index = 0; index < updates; index += 1) {
            await mounted.update();
          }
          // 更新期间也不该有未捕获异常 —— `update()` 内部 await 会把它抛出来。
        } finally {
          mounted.destroy();
          destroyed = true;
        }
      } finally {
        capture.restore();
      }

      expect(destroyed).toBe(true);

      assertNoUnexpectedWarnings(capture.records, options.allow, `mountTest('${name}')`);

      if (assertLeak) {
        expect(describeObserverLeaks(baseline)).toEqual([]);
      }
    });
  });
}

/**
 * 同时提供默认导出 —— 上游 antd 的 `tests/shared/*` 用的是默认导出，
 * 保留它可以让「从 antd 迁移」时按原样 `import mountTest from "…"` 继续工作。
 */
export default mountTest;
