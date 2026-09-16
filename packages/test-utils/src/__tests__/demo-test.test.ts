/**
 * `demo-test.ts` 的契约测试。
 *
 * 覆盖：
 *   1. 结构校验（收集阶段抛出）：互斥、缺失、豁免缺 reason
 *   2. `expectCount` 守卫 —— 由 `collectCountFailures` 承担，纯函数可单测
 *   3. 真实注册：多 demo 遍历、逐 demo 判告警、`allow` 通道
 *   4. 「去掉快照」之后的替代断言：**告警列表为空**（比快照强，见文件头）
 */

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import { AllowanceError } from '../allowance';
import { demoTest } from '../demo-test';
import { collectCountFailures } from '../render';
import { demoKey, demoModules, NoisyBox, PlainBox } from './fixture';

describe('collectCountFailures（expectCount 守卫，纯函数）', () => {
  it('未声明 expectCount → 空数组（不校验）', () => {
    expect(collectCountFailures(3, undefined, 'demo 条数')).toEqual([]);
  });

  it('条数一致 → 空数组', () => {
    expect(collectCountFailures(2, 2, 'demo 条数')).toEqual([]);
  });

  it('⭐ 实际比声明少 → 失败，并指出「glob 匹配不到文件不会报错」', () => {
    // 这是去掉运行时 glob 之后唯一的防线：文件被重命名/移动时，
    // 用例会静默变少，「测试全绿」变成「少测了几条」。
    const failures = collectCountFailures(1, 3, 'demo 条数');
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/demo 条数：实际 1 条，声明 3 条/);
    expect(failures[0]).toMatch(/glob 模式/);
  });

  it('实际比声明多也失败（新增了 demo 但没更新声明）', () => {
    expect(collectCountFailures(3, 1, 'demo 条数')[0]).toMatch(/实际 3 条，声明 1 条/);
  });

  it('0 条也算：声明 1 条但 glob 一个都没匹配到 → 失败', () => {
    expect(collectCountFailures(0, 1, 'demo 条数')).toHaveLength(1);
  });
});

describe('demoTest · 结构校验（收集阶段抛出）', () => {
  it('demos 与 render 同时给 → 抛错', () => {
    expect(() => demoTest('x', { demos: {}, render: () => h(PlainBox) })).toThrow(
      /demos 与 render 互斥/,
    );
  });

  it('两者都不给 → 抛错并给出正确写法', () => {
    expect(() => demoTest('x', {})).toThrow(/必须提供 demos 或 render/);
    expect(() => demoTest('x', {})).toThrow(/import\.meta\.glob/);
  });

  it('allow 缺 reason → AllowanceError（不允许沉默的豁免）', () => {
    expect(() =>
      demoTest('x', {
        render: () => h(PlainBox),
        allow: [{ match: 'whatever', reason: '' }],
      }),
    ).toThrow(AllowanceError);
  });

  it('allow 的第二条缺 reason 时，错误信息带下标', () => {
    expect(() =>
      demoTest('x', {
        render: () => h(PlainBox),
        allow: [
          { match: 'a', reason: '有理由' },
          { match: 'b', reason: '  ' },
        ],
      }),
    ).toThrow(/demoTest\('x'\)\[1\]/);
  });
});

// ---------------------------------------------------------------------------
// 真实注册
// ---------------------------------------------------------------------------

/** 多 demo 遍历 + expectCount。 */
demoTest('fixture-demo · demos', {
  demos: demoModules({ [demoKey('basic')]: PlainBox, [demoKey('label')]: PlainBox }),
  expectCount: 2,
});

/** 单 render 工厂（等价于「一个 demo」）。 */
demoTest('fixture-demo · render 单例', {
  render: () => h(PlainBox),
});

/** 有告警但已豁免。 */
demoTest('fixture-demo · 告警已豁免', {
  demos: demoModules({ [demoKey('noisy')]: NoisyBox }),
  expectCount: 1,
  allow: [
    { match: 'Warning: fixture error', reason: '夹具刻意产出，用于验证逐 demo 的告警判定' },
    { match: 'Note: fixture note', reason: '同上，验证 console.warn 也在采集范围内' },
  ],
});

/** 带 Provider 包装（`wrap` 透传给每个 demo）。 */
demoTest('fixture-demo · 带 wrap', {
  demos: demoModules({ [demoKey('wrapped')]: PlainBox }),
  expectCount: 1,
  wrap: (slot) => h('section', { class: 'demo-wrap' }, [slot() as never]),
});

// ---------------------------------------------------------------------------
// 敏感性：证明「去掉快照」之后替代断言仍然有效
// ---------------------------------------------------------------------------

describe('demoTest 的替代断言（去快照之后）', () => {
  it('⭐ NoisyBox 的告警在**未豁免**时会被逐 demo 判定抓到', async () => {
    const { captureWarnings, partitionWarnings } = await import('../warnings');
    const { mountCase } = await import('../render');

    const capture = captureWarnings();
    try {
      const mounted = mountCase(() => h(NoisyBox));
      await mounted.update();
      mounted.destroy();
    } finally {
      capture.restore();
    }

    // 没有豁免 → 全部落进 unexpected（这正是「断言列表为空」会失败的原因）
    expect(partitionWarnings(capture.records, []).unexpected).toHaveLength(2);

    // 给了豁免 → 全部被覆盖
    const { unexpected, used } = partitionWarnings(capture.records, [
      { match: 'Warning: fixture error', reason: '夹具刻意产出' },
      { match: 'Note: fixture note', reason: '夹具刻意产出' },
    ]);
    expect(unexpected).toEqual([]);
    expect(used).toHaveLength(2);
  });

  it('⚠️ 本包的测试**不产出任何快照文件** —— 全量 DOM 快照违反 TESTING.md A7', () => {
    // 结构契约由 L4 `domContractTest` 承担，且比对方向是「与 React 基线」
    // 而不是「与上一次的自己」；快照会把「结构漂移」与「无意义属性变化」混在一起。
    //
    // ⚠️ 刻意用**行为断言**（快照目录不存在）而不是 grep 源码：
    //    本包的模块文档里会**引用**上游的 `toMatchSnapshot()` 作为对照，
    //    grep 源码会把这些引用误判成「真的用了快照」（实测踩过）。
    expect(existsSync('packages/test-utils/src/__tests__/__snapshots__')).toBe(false);
  });
});
