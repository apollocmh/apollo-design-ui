/**
 * `a11yDemoTest` —— 遍历组件的全部 demo，逐个跑 axe，要求 0 violation。
 *
 * ── 与上游的关系（`tests/shared/accessibilityTest.tsx`，207 行）─────────────────
 * 上游用 `jest-axe` + 一个手写的 `AxeQueueManager`（**串行队列**）来跑 axe。
 * 那个队列说明上游也踩到了「连续/并发跑 axe 会出问题」，但它只**排队**，
 * 没有测量过**耗时与 DOM 规模的关系**。
 *
 * 我们的实测（`docs/foundation/icons-contract.md` §6.2，同一份 DOM 结构）：
 *
 *   | 节点数 | 单次 axe.run 耗时 |
 *   | ---: | ---: |
 *   | 10 | 134ms |
 *   | 50 | 385ms |
 *   | 100 | 672ms |
 *   | 200 | 2 057ms |
 *   | 400 | 11 941ms |
 *   | 848 | 被 SIGTERM 杀掉（>500s / OOM） |
 *
 * 节点翻倍、耗时约 **5.7 倍**（二次方量级）。所以「排队」不够 ——
 * **一次扫完一个巨大的容器是跑不完的**，必须让每次扫描的 DOM 规模有上界。
 *
 * 本模块的做法：**逐 demo 扫描**（每个 demo 天然是独立的、规模可控的子树），
 * 并额外用 `maxNodes` 把「某个 demo 意外变得巨大」变成一条**明确的失败**，
 * 而不是让 CI 跑十分钟后被 OOM 杀掉。
 *
 * ⚠️ 逐 demo 扫描不是抽样，是**全量**：图标那次实测已确认，
 *    axe 的规则（`role-img-alt` / `aria-allowed-attr` / `svg-img-alt` …）都是**逐节点**判定的，
 *    与同一容器里还有多少别的节点无关。唯一与容器规模有关的是 `region` /
 *    `landmark-one-main` 这类文档级规则，而它们本来就不该按组件逐个判定
 *    （所以默认的 `tags` 里不含 `best-practice`）。
 *
 * ── 关于 `allow`：为什么没有 `disabledRules` ──────────────────────────────────
 * 上游提供 `disabledRules`（直接关掉某条规则）。本包的 `README.md` 明文写着
 * 「a11yDemoTest 不允许 disableRules 来通过」，所以这里**不提供**这个入口。
 * 需要放过时走 `allow: [{ rule, reason, deviationId? }]`，`reason` 非空才通过校验。
 * 这与 `tests/compat/README.md` §3.4 的 fixture `allow` 约定同构。
 *
 * ── 这个测试没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**对比度**。axe 在 jsdom 下不做布局与绘制，`color-contrast` 会落到
 *     `incomplete` 而**不是** `violation`。对比度按 `TESTING.md` §6.2 由 theme 层
 *     断言 Token，由 L6 断言渲染结果。
 *   - 没证明**键盘可达性**。axe 只能判定静态结构；键盘与焦点必须手工断言
 *     （`TESTING.md` §6.2 的表格，由各组件的 `a11y.test.ts` 承担）。
 *   - 没证明与真实浏览器一致：jsdom 缺少的 API（`IntersectionObserver` 等）
 *     会让相关规则静默跳过。
 */

import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { assertAllowances } from './allowance';
import { collectCountFailures, collectRenderCases, mountCase } from './render';
import type { Allowance, RenderSource } from './types';

/** 一条 axe 违规的豁免。 */
export interface A11yAllowance extends Allowance {
  /** 允许的 axe 规则 id（如 `'color-contrast'`）。 */
  rule: string;
}

export interface A11yDemoTestOptions extends RenderSource {
  /** 期望的 demo 条数。语义同 `demoTest` 的 `expectCount`。 */
  expectCount?: number;
  /**
   * 单个 demo 的 DOM 节点数上限。默认 `400`。
   *
   * 依据是上面的实测表：400 节点约 12s，是「还能忍受」的上界；
   * 848 节点会被 SIGTERM 杀掉。超过上限时**失败并给出节点数**，
   * 而不是让 CI 跑十分钟再 OOM —— 那种失败没有可操作的下一步。
   */
  maxNodes?: number;
  /** 允许的 axe 违规。必须带 `reason`；未被命中的豁免会让测试失败（防腐烂）。 */
  allow?: readonly A11yAllowance[];
  /** axe 的 `runOnly` tag 列表。默认 WCAG 2.0/2.1/2.2 的 A + AA。 */
  tags?: readonly string[];
}

/** 默认扫描的规则集。刻意**不含** `best-practice`：那是文档级规则，不该按组件逐个判定。 */
const DEFAULT_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** 默认节点上限，依据见文件头。 */
const DEFAULT_MAX_NODES = 400;

/** axe 在 jsdom 下的单次扫描可能很久；给足超时，避免把「慢」误报成「挂」。 */
const AXE_TIMEOUT_MS = 60_000;

/** 把 violation 摘要成稳定、可读、可断言的字符串（`id(节点数)`）。**纯函数**。 */
export function summarizeViolations(violations: readonly axe.Result[]): string[] {
  return violations.map((violation) => `${violation.id}(${violation.nodes.length})`).sort();
}

/**
 * 把「实际违规」与「豁免」配对。
 *
 * **纯函数**：判定逻辑可被单测覆盖，而不是只能在某个组件失败时才执行到。
 *
 * @returns `expected` 应当与 `actual` **完全相等**（多一条 = 新违规，少一条 = 豁免失效）；
 *          `stale` 是没被任何违规命中的豁免，必须为空（防腐烂）。
 */
export function matchA11yAllowances(
  actual: readonly string[],
  allowances: readonly A11yAllowance[],
): { expected: string[]; stale: A11yAllowance[] } {
  const hits = (rule: string): boolean => actual.some((item) => item.startsWith(`${rule}(`));
  return {
    // ⚠️ 必须从 `actual` 里**挑出**被覆盖的条目，不能从 `allowances` 里拼规则名：
    //    `actual` 的形态是 `image-alt(1)`，拼出来的是 `image-alt` —— 两者永远不相等，
    //    于是「豁免」会变成「每次都要在断言里再写一遍节点数」。
    expected: actual.filter((item) =>
      allowances.some((allowance) => item.startsWith(`${allowance.rule}(`)),
    ),
    stale: allowances.filter((allowance) => !hits(allowance.rule)),
  };
}

/** 构造节点数超限的失败信息。空数组 = 未超限。**纯函数**。 */
export function collectNodeCountFailures(nodeCount: number, maxNodes: number): string[] {
  if (nodeCount <= maxNodes) return [];
  return [
    `demo 的 DOM 有 ${nodeCount} 个节点，超过上限 ${maxNodes}。` +
      'axe 在 jsdom 下耗时对节点数超线性（见 a11y-demo-test.ts 文件头），' +
      '请把这个 demo 拆小，或显式调高 maxNodes 并说明理由。',
  ];
}

export function a11yDemoTest(name: string, options: A11yDemoTestOptions): void {
  const context = `a11yDemoTest('${name}')`;
  const cases = collectRenderCases(options, context);
  const allowances = options.allow ?? [];
  assertAllowances(allowances, context);
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const tags = [...(options.tags ?? DEFAULT_TAGS)];

  describe(`${name} · a11y（axe）`, () => {
    if (options.expectCount !== undefined) {
      const expected = options.expectCount;
      it(`demo 条数等于 expectCount（${expected}）`, () => {
        expect(collectCountFailures(cases.length, expected, 'demo 条数')).toEqual([]);
      });
    }

    for (const testCase of cases) {
      it(
        `${testCase.id} 无 axe violation`,
        async () => {
          const mounted = mountCase(
            testCase.render,
            options.wrap === undefined ? { attach: true } : { wrap: options.wrap, attach: true },
          );

          try {
            // ⚠️ 必须是**已挂载到 document 的**节点：axe 扫描游离节点会得到空结果，
            //    那种「0 violation」是假的（什么都没扫）。`attach: true` 保证这一点。
            //    扫描范围取 `content`（产物本身）而不是 `host` —— 后者多一层
            //    `@vue/test-utils` 的容器 div，会把节点计数算多 1。
            const nodeCount = mounted.content.querySelectorAll('*').length;
            expect(collectNodeCountFailures(nodeCount, maxNodes)).toEqual([]);

            const results = await axe.run(mounted.content, {
              runOnly: { type: 'tag', values: tags },
            });

            const actual = summarizeViolations(results.violations);
            const { expected, stale } = matchA11yAllowances(actual, allowances);

            // 断言「恰好等于」：允许的违规必须**恰好**出现，
            // 多一条（新违规）或少一条（豁免失效）都会红。
            expect(actual).toEqual(expected);

            expect(
              stale.map(
                (allowance) =>
                  `未被命中的豁免：rule="${allowance.rule}"（reason: ${allowance.reason}）`,
              ),
            ).toEqual([]);
          } finally {
            mounted.destroy();
          }
        },
        AXE_TIMEOUT_MS,
      );
    }
  });
}

/**
 * 同时提供默认导出 —— 上游 antd 的 `tests/shared/*` 用的是默认导出，
 * 保留它可以让「从 antd 迁移」时按原样 `import a11yDemoTest from "…"` 继续工作。
 */
export default a11yDemoTest;
