/**
 * `mount-test.ts` 的契约测试。
 *
 * 重点覆盖「本模块比上游多出来的三条断言」各自**真的会触发**：
 *   1. 告警：`NoisyBox` 在不给 `allow` 时会被抓到
 *   2. 泄漏：`LeakyBox` 会被抓到，`CleanBox` 不会误报
 *   3. 更新：`updates` 参数真的驱动了多次更新
 */

import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { AllowanceError } from '../allowance';
import { describeObserverLeaks, mountTest } from '../mount-test';
import { mountCase } from '../render';
import { assertNoUnexpectedWarnings, captureWarnings } from '../warnings';
import { CleanBox, LeakyBox, NoisyBox, PlainBox } from './fixture';

describe('describeObserverLeaks', () => {
  it('⭐ LeakyBox 卸载后：两个 observer 的泄漏都被描述出来', async () => {
    const mounted = mountCase(() => h(LeakyBox));
    await mounted.update();
    mounted.destroy();

    const leaks = describeObserverLeaks();
    expect(leaks).toHaveLength(2);
    expect(leaks.join('\n')).toMatch(/MutationObserver 泄漏 1 个实例（未 disconnect）/);
    expect(leaks.join('\n')).toMatch(/ResizeObserver\[0\] 仍观察着 1 个元素（未 unobserve）/);
  });

  it('CleanBox 卸载后：无泄漏（不误报）', async () => {
    const mounted = mountCase(() => h(CleanBox));
    await mounted.update();
    mounted.destroy();
    expect(describeObserverLeaks()).toEqual([]);
  });

  it('环境里没有可观测桩时返回空数组 —— 不伪造一个「通过」结论', () => {
    const saved = globalThis.ResizeObserver;
    Reflect.deleteProperty(globalThis, 'ResizeObserver');
    try {
      expect(describeObserverLeaks()).toEqual([]);
    } finally {
      globalThis.ResizeObserver = saved;
    }
  });
});

describe('mountTest · 结构校验（收集阶段抛出）', () => {
  it('只给 demos 不给 render → 抛错，并指向 demoTest', () => {
    // ⚠️ `MountTestOptions` 是**封闭接口**，类型层已经拒绝 `demos`
    //    （见 `api.test-d.ts` 的同名负例）。这里绕过类型，验证**运行期守卫**
    //    仍然存在 —— 它保护的是没有类型信息的 JS 调用方。
    const callWithDemos = (): void => {
      // @ts-expect-error MountTestOptions 里没有 demos
      mountTest('x', { demos: {} });
    };

    expect(callWithDemos).toThrow(/只接受 render/);
    expect(callWithDemos).toThrow(/要遍历 demo 请用 demoTest/);
  });

  it('两者都不给 → 同样抛错', () => {
    expect(() => mountTest('x', {})).toThrow(/只接受 render/);
  });

  it('assertNoLeak 用 { skip: true } 但缺 reason → AllowanceError', () => {
    expect(() =>
      mountTest('x', { render: () => h(PlainBox), assertNoLeak: { skip: true, reason: '  ' } }),
    ).toThrow(AllowanceError);
  });
});

// ---------------------------------------------------------------------------
// 真实注册
// ---------------------------------------------------------------------------

/** 最简：渲染 → 更新 1 次 → 卸载，无告警、无泄漏。 */
mountTest('fixture-mount · 干净', {
  render: () => h(PlainBox),
});

/** 连续更新 3 次。 */
mountTest('fixture-mount · 连续更新 3 次', {
  render: () => h(PlainBox, { label: 'x' }),
  updates: 3,
});

/** 有告警但已豁免 —— 证明 `allow` 通道可用，且不会漏判。 */
mountTest('fixture-mount · 告警已豁免', {
  render: () => h(NoisyBox),
  allow: [
    { match: 'Warning: fixture error', reason: '夹具刻意往 console 写一条，用于验证告警采集' },
    { match: 'Note: fixture note', reason: '同上，验证 console.warn 也被采集' },
  ],
});

/** 泄漏版：显式跳过泄漏断言（带 reason）。 */
mountTest('fixture-mount · 泄漏版显式跳过', {
  render: () => h(LeakyBox),
  assertNoLeak: {
    skip: true,
    reason: '本用例的**被测对象**就是泄漏本身，泄漏断言由 describeObserverLeaks 的用例覆盖',
  },
});

// ---------------------------------------------------------------------------
// 敏感性：证明「不告警」这条断言不是摆设
// ---------------------------------------------------------------------------

describe('mountTest 的敏感性', () => {
  it('⭐ 未豁免的告警会被 captureWarnings 抓到（NoisyBox 产 1 error + 1 warn）', async () => {
    const capture = captureWarnings();
    const mounted = mountCase(() => h(NoisyBox));
    try {
      await mounted.update();
    } finally {
      mounted.destroy();
      capture.restore();
    }

    expect(capture.records.map((record) => record.method)).toEqual(['error', 'warn']);

    // 不给 allow → 抛错
    expect(() => assertNoUnexpectedWarnings(capture.records, [], 'ctx')).toThrow(
      /出现 2 条未豁免的告警/,
    );
    // 给了 allow → 通过
    expect(() =>
      assertNoUnexpectedWarnings(
        capture.records,
        [
          { match: 'Warning: fixture error', reason: '夹具刻意产出' },
          { match: 'Note: fixture note', reason: '夹具刻意产出' },
        ],
        'ctx',
      ),
    ).not.toThrow();
  });

  it('⭐ 更新期间抛错会**同时**走两条通道被捕获：update() 的 reject + Vue 的 warn', async () => {
    // 实测（探针）：
    //   · update() 会 reject，原因是渲染函数抛出的那个 Error
    //   · 同时 Vue 会经 console.warn 输出两条 `[Vue warn]: Unhandled error …`
    // 所以 mountTest 的告警断言是第二道防线 —— 即使有人吞掉了 reject 也躲不过。
    const bump = ref(0);
    let renders = 0;
    const Boom = defineComponent({
      name: 'FixtureBoom',
      setup() {
        return () => {
          // 必须读一个**响应式**依赖，否则子组件根本不会重渲染（Vue 的正常语义）。
          void bump.value;
          renders += 1;
          if (renders > 1) throw new Error('boom-on-update');
          return h('div', 'ok');
        };
      },
    });

    const mounted = mountCase(() => h(Boom));
    const capture = captureWarnings();
    try {
      bump.value = 1;
      await expect(mounted.update()).rejects.toThrow(/boom-on-update/);

      const texts = capture.texts().join('\n');
      expect(texts).toContain('[Vue warn]: Unhandled error during execution of render function');
      expect(texts).toContain('[Vue warn]: Unhandled error during execution of component update');
    } finally {
      mounted.destroy();
      capture.restore();
    }
  });

  it('对照：不抛错的组件在 update() 下正常 resolve，且不产生任何告警', async () => {
    const mounted = mountCase(() => h(PlainBox));
    const capture = captureWarnings();
    try {
      await expect(mounted.update()).resolves.toBeUndefined();
      expect(capture.texts()).toEqual([]);
    } finally {
      mounted.destroy();
      capture.restore();
    }
  });
});
