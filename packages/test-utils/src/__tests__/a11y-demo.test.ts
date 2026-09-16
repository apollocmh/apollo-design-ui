/**
 * `a11y-demo-test.ts` 的契约测试。
 *
 * ⚠️ 这个文件会**真的跑 axe**（jsdom 下）。夹具刻意做得极小
 * （`A11yCleanBox` 2 个节点、`A11yBadBox` 2 个节点），
 * 因为 axe 在 jsdom 下的耗时对节点数超线性 —— 见 `a11y-demo-test.ts` 文件头实测表。
 *
 * 覆盖：
 *   1. 纯函数：`summarizeViolations` / `matchA11yAllowances` / `collectNodeCountFailures`
 *   2. 真实注册：干净通过 / 违规被精确豁免 / maxNodes
 *   3. 用**真实的 axe 结果**验证摘要与配对（而不是手搓假对象）
 */

import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import {
  a11yDemoTest,
  collectNodeCountFailures,
  matchA11yAllowances,
  summarizeViolations,
} from '../a11y-demo-test';
import { AllowanceError } from '../allowance';
import { mountCase } from '../render';
import { A11yBadBox, A11yCleanBox, makeNodeCountBox } from './fixture';

/** 跑一次真实 axe，拿到原始结果。 */
async function runAxe(component: Parameters<typeof h>[0]) {
  const mounted = mountCase(() => h(component));
  try {
    return await axe.run(mounted.content, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
  } finally {
    mounted.destroy();
  }
}

describe('summarizeViolations（纯函数，输入来自真实 axe）', () => {
  it('干净的夹具 → 空数组', async () => {
    const results = await runAxe(A11yCleanBox);
    expect(summarizeViolations(results.violations)).toEqual([]);
  });

  it('⭐ `<img>` 缺 alt → `image-alt(1)`', async () => {
    const results = await runAxe(A11yBadBox);
    const summary = summarizeViolations(results.violations);
    expect(summary).toContain('image-alt(1)');
    // 形态是 `id(节点数)`，不是裸的 id
    expect(summary.every((item) => /^[a-z0-9-]+\(\d+\)$/.test(item))).toBe(true);
  });

  it('结果已排序（报告可读、断言稳定）', async () => {
    const results = await runAxe(A11yBadBox);
    const summary = summarizeViolations(results.violations);
    expect(summary).toEqual([...summary].sort());
  });
});

describe('matchA11yAllowances（纯函数）', () => {
  it('无违规 + 无豁免 → 都为空', () => {
    expect(matchA11yAllowances([], [])).toEqual({ expected: [], stale: [] });
  });

  it('⭐ 从 actual 里**挑出**被覆盖的条目 —— 不是从 allowances 拼规则名', () => {
    // 踩过的坑：从 allowances 拼出来的是 `image-alt`，而 actual 是 `image-alt(1)`，
    // 两者永远不相等，于是豁免形同虚设。
    const { expected } = matchA11yAllowances(
      ['image-alt(1)', 'color-contrast(2)'],
      [{ rule: 'image-alt', reason: '夹具刻意缺 alt' }],
    );
    expect(expected).toEqual(['image-alt(1)']);
  });

  it('未被命中的豁免进 stale（防腐烂）', () => {
    const { expected, stale } = matchA11yAllowances(
      ['image-alt(1)'],
      [
        { rule: 'image-alt', reason: '命中' },
        { rule: 'color-contrast', reason: '已失效' },
      ],
    );
    expect(expected).toEqual(['image-alt(1)']);
    expect(stale.map((item) => item.rule)).toEqual(['color-contrast']);
  });

  it('规则名是前缀匹配：`image-alt` 不会命中 `image-alt-x(1)` 以外的规则', () => {
    const { stale } = matchA11yAllowances(
      ['aria-allowed-attr(3)'],
      [{ rule: 'aria-allowed', reason: 'x' }],
    );
    // `aria-allowed-attr(3)` 以 `aria-allowed(` 开头吗？不 —— 中间隔着 `-attr`。
    expect(stale).toHaveLength(1);
  });

  it('⭐ 规则名必须整体匹配到 `(` 之前，避免 `aria` 这种过宽前缀', () => {
    const { expected } = matchA11yAllowances(
      ['aria-allowed-attr(1)'],
      [{ rule: 'aria-allowed-attr', reason: 'x' }],
    );
    expect(expected).toEqual(['aria-allowed-attr(1)']);
  });
});

describe('collectNodeCountFailures（纯函数）', () => {
  it('未超限 → 空数组', () => {
    expect(collectNodeCountFailures(400, 400)).toEqual([]);
    expect(collectNodeCountFailures(10, 400)).toEqual([]);
  });

  it('⭐ 超限 → 报出节点数与上限，并解释为什么要有上限', () => {
    const failures = collectNodeCountFailures(848, 400);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/848 个节点，超过上限 400/);
    expect(failures[0]).toMatch(/超线性/);
    expect(failures[0]).toMatch(/拆小|调高 maxNodes/);
  });
});

describe('a11yDemoTest · 结构校验（收集阶段抛出）', () => {
  it('allow 缺 reason → AllowanceError', () => {
    expect(() =>
      a11yDemoTest('x', {
        render: () => h(A11yCleanBox),
        allow: [{ rule: 'image-alt', reason: '' }],
      }),
    ).toThrow(AllowanceError);
  });

  it('既没 demos 也没 render → 抛错', () => {
    expect(() => a11yDemoTest('x', {})).toThrow(/必须提供 demos 或 render/);
  });
});

// ---------------------------------------------------------------------------
// 真实注册
// ---------------------------------------------------------------------------

/** 干净 → 0 violation。 */
a11yDemoTest('fixture-a11y · 干净', {
  render: () => h(A11yCleanBox),
});

/** 有一处已知违规，被精确豁免（`reason` 必填）。 */
a11yDemoTest('fixture-a11y · 违规已豁免', {
  render: () => h(A11yBadBox),
  allow: [
    {
      rule: 'image-alt',
      reason: '夹具刻意渲染一个没有 alt 的 img，用于验证违规判定与豁免配对',
    },
  ],
});

/** 节点数上限：显式放宽（默认 400，这里给 10）。 */
a11yDemoTest('fixture-a11y · 自定义 maxNodes', {
  render: () => h(makeNodeCountBox(5)),
  maxNodes: 10,
});

// ---------------------------------------------------------------------------
// 敏感性：maxNodes 真的会拦
// ---------------------------------------------------------------------------

describe('maxNodes 的敏感性', () => {
  it('⭐ 节点数超过 maxNodes 时会被拦下（不是等 CI 跑十分钟再 OOM）', () => {
    const mounted = mountCase(() => h(makeNodeCountBox(20)));
    try {
      const nodeCount = mounted.content.querySelectorAll('*').length;
      expect(nodeCount).toBe(21); // 1 个外层 div + 20 个 span
      expect(collectNodeCountFailures(nodeCount, 400)).toEqual([]);
      expect(collectNodeCountFailures(nodeCount, 10)).toHaveLength(1);
    } finally {
      mounted.destroy();
    }
  });
});
