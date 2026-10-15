/**
 * Issue #51 · [Splitter] 多面板与 RTL 模式 ARIA 上下界（运行时验证）
 *
 * 结论前置（实测）：`aria-valuemin/max` 的算术与 antd 6.6.4 **逐字同源**
 * （`Splitter.js:181-201`），而它有两个**上游同款**的边界事实：
 *   1. 容器**未测量**（SSR / jsdom）时 `ptgMaxSizes = (item.max || 0) / 0 = NaN`
 *      ⇒ `min/max` 也是 `NaN`，由 `SplitBar.getValidNumber` 归一成 `0`；
 *   2. 面板 `min` 之和 > 100% 这类**互相矛盾**的约束下会产出 `min > max`。
 * 所以「`min <= now <= max` 恒成立」**在蚂蚁原版上也不成立**，本轮按
 * 「对照 antd + 不扩张为强制修复」处理：不改变数值（改了会与 L4 基线分叉），
 * 只把这段算术抽成 `getAriaBounds` 并**把可成立的部分钉住**：
 *   · 良构配置 + 已测量容器 ⇒ `min <= now <= max`（回归）；
 *   · 未测量 / 矛盾约束 ⇒ 表征（防止有人悄悄改数值而不更新 L4）；
 *   · DOM 层：三个属性恒为**有限整数**（不出现 NaN / 空串）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, provide, type VNodeChild } from 'vue';

import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { getAriaBounds } from '../hooks/ariaBounds';
import { autoPtgSizes, getPtg } from '../hooks/sizeUtil';
import { Splitter } from '../index';

// ============================ 纯函数：上下界 ============================

const CONTAINER = 500;

/** 复刻 `useSizes` 的百分比推导（`min` 缺省 0、`max` 缺省 = 容器宽）。 */
const ptgMinOf = (v: string | number | undefined): number =>
  typeof v === 'string' ? getPtg(v) : (v ?? 0) / CONTAINER;
const ptgMaxOf = (v: string | number | undefined): number =>
  typeof v === 'string' ? getPtg(v) : (v ?? CONTAINER) / CONTAINER;

/** sizes 全 undefined（走自动分配）时，按 useSizes 的口径求出 ARIA。 */
const boundsFor = (
  mins: (string | number | undefined)[],
  maxs: (string | number | undefined)[],
  idx: number,
  container = CONTAINER,
) => {
  const ptgMin = mins.map(ptgMinOf);
  const ptgMax = maxs.map(ptgMaxOf);
  const ptg = autoPtgSizes(
    mins.map(() => undefined),
    ptgMin,
    ptgMax,
  );
  const stack: number[] = [];
  let acc = 0;
  for (const p of ptg) {
    acc += p;
    stack.push(acc);
  }
  void container;
  return getAriaBounds(stack, ptgMin, ptgMax, idx);
};

const finiteRange = (b: { now: number; min: number; max: number }) => {
  expect(Number.isFinite(b.now)).toBe(true);
  expect(Number.isFinite(b.min)).toBe(true);
  expect(Number.isFinite(b.max)).toBe(true);
  expect(b.min).toBeLessThanOrEqual(b.now);
  expect(b.now).toBeLessThanOrEqual(b.max);
};

describe('Splitter · Issue #51 ARIA 上下界', () => {
  it('[A] 良构约束 + 已测量容器 ⇒ min <= now <= max（核心回归）', () => {
    // 默认两面板
    finiteRange(boundsFor([undefined, undefined], [undefined, undefined], 0));
    // 两侧 min=20%
    finiteRange(boundsFor(['20%', '20%'], [undefined, undefined], 0));
    // 两侧 max=20%（退化但合法：min = now = max）
    finiteRange(boundsFor([undefined, undefined], ['20%', '20%'], 0));
    // 单侧受限
    finiteRange(boundsFor(['20%', undefined], [undefined, '80%'], 0));

    const plain = boundsFor([undefined, undefined], [undefined, undefined], 0);
    expect(plain.now).toBeCloseTo(50, 10);
    expect(plain.min).toBeCloseTo(0, 10);
    expect(plain.max).toBeCloseTo(100, 10);

    const min20 = boundsFor(['20%', '20%'], [undefined, undefined], 0);
    expect(min20.now).toBeCloseTo(50, 10);
    expect(min20.min).toBeCloseTo(20, 10);
    expect(min20.max).toBeCloseTo(80, 10);
  });

  it('[A2] 三面板：每一根拖拽条各自合法（min <= now <= max）', () => {
    const mins = [undefined, '50%', undefined];
    const maxs = [undefined, undefined, undefined];
    finiteRange(boundsFor(mins, maxs, 0));
    finiteRange(boundsFor(mins, maxs, 1));
  });

  it('[B] 容器未测量（SSR）⇒ min/max 为 NaN ⇒ 由 SplitBar 归一成 0（上游同式）', () => {
    // 未测量 ⇒ `ptgMaxSizes = (item.max || 0) / 0` = NaN（useSizes 与上游同式），
    // 于是 `Math.max/min` 也得出 NaN；DOM 上看到的是 `getValidNumber(NaN) === 0`。
    const raw = getAriaBounds([0.5, 1], [0, 0], [Number.NaN, Number.NaN], 0);
    expect(raw.now).toBe(50);
    expect(Number.isNaN(raw.min)).toBe(true);
    expect(Number.isNaN(raw.max)).toBe(true);
    // 归一后（SplitBar.getValidNumber 的口径：非有限 ⇒ 0）
    expect(Number.isFinite(raw.min) ? raw.min : 0).toBe(0);
  });

  it('[C] 矛盾约束（两侧 min=80%）⇒ min > max（上游同式，别当成本仓缺陷）', () => {
    const b = boundsFor(['80%', '80%'], [undefined, undefined], 0);
    expect(b.now).toBeCloseTo(20, 10);
    expect(b.min).toBeCloseTo(80, 10);
    expect(b.max).toBeCloseTo(20, 10);
    // 有限但**区间非法** —— 与 antd 逐字同源（Math.max / Math.min 各取一侧极值）
    expect(Number.isFinite(b.min) && Number.isFinite(b.max)).toBe(true);
    expect(b.min).toBeGreaterThan(b.max);
  });
});

// ============================ DOM 层：有限整数 ============================

function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ASplitterAriaConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const panels = (...specs: Record<string, unknown>[]) =>
  specs.map((s, i) => h(Splitter.Panel, { key: i, ...s }, () => `P${i}`));

const draggerAria = (w: ReturnType<typeof mount>) =>
  [...w.findAll('.apollo-splitter-bar-dragger')].map((d) => ({
    now: d.attributes('aria-valuenow'),
    min: d.attributes('aria-valuemin'),
    max: d.attributes('aria-valuemax'),
  }));

describe('Splitter · Issue #51 DOM 层 ARIA 恒为有限整数', () => {
  const cases: [string, () => ReturnType<typeof mount>][] = [
    ['default', () => mount(Splitter, { slots: { default: () => panels({}, {}) } })],
    [
      'min-max',
      () =>
        mount(Splitter, {
          slots: { default: () => panels({ min: '20%' }, { max: '80%' }) },
        }),
    ],
    [
      'contradictory',
      () => mount(Splitter, { slots: { default: () => panels({ min: '80%' }, { min: '80%' }) } }),
    ],
    [
      'collapsible',
      () =>
        mount(Splitter, {
          slots: {
            default: () =>
              panels({ collapsible: true, min: '20%', defaultSize: '40%' }, { collapsible: true }),
          },
        }),
    ],
    ['three', () => mount(Splitter, { slots: { default: () => panels({}, { min: '50%' }, {}) } })],
    [
      'vertical',
      () =>
        mount(Splitter, {
          props: { orientation: 'vertical' },
          slots: { default: () => panels({ min: '20%' }, { min: '20%' }) },
        }),
    ],
    [
      'rtl',
      () =>
        mount(
          withConfig({ direction: 'rtl' }, () =>
            h(Splitter, null, () => panels({ min: '20%' }, { min: '20%' })),
          ),
        ),
    ],
  ];

  for (const [name, make] of cases) {
    it(`[D] ${name}：aria-valuenow / min / max 都是有限整数`, () => {
      const list = draggerAria(make());
      expect(list.length).toBeGreaterThan(0);
      for (const a of list) {
        for (const v of [a.now, a.min, a.max]) {
          expect(v).toBeDefined();
          expect(Number.isFinite(Number(v))).toBe(true);
          expect(Number.isInteger(Number(v))).toBe(true);
        }
      }
    });
  }

  it('[D2] RTL 与 LTR 的 ARIA 数值一致（方向只影响视觉/键盘轴向）', () => {
    const ltr = draggerAria(
      mount(Splitter, { slots: { default: () => panels({ min: '20%' }, { min: '20%' }) } }),
    );
    const rtl = draggerAria(
      mount(
        withConfig({ direction: 'rtl' }, () =>
          h(Splitter, null, () => panels({ min: '20%' }, { min: '20%' })),
        ),
      ),
    );
    expect(rtl).toEqual(ltr);
  });
});
