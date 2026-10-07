/**
 * `rtlTest` —— 在 RTL 上下文里渲染，并断言组件打上了 `-rtl` 标记类。
 *
 * ── 与上游的关系（`tests/shared/rtlTest.tsx`，28 行）───────────────────────────
 * 上游的契约是：
 *
 *     render(<ConfigProvider direction="rtl"><Component /></ConfigProvider>);
 *     expect(container.firstChild).toMatchSnapshot();
 *
 * 它靠**全量 HTML 快照**绕过了「RTL 契约到底是什么」这个问题 ——
 * 快照不需要你知道契约是什么，只要它不变就绿。这正是 `TESTING.md` 反模式 A7
 * 说的「噪声大、无契约价值」。
 *
 * ── RTL 的真实契约（实测，不是文档）────────────────────────────────────────────
 * **`ConfigProvider` 不在 DOM 上写 `dir` 属性**（`grep 'dir' components/config-provider/*.tsx`
 * 零命中）。真正的 DOM 契约是组件自己加的**后缀类**：
 *
 *     components/button/Button.tsx:389   [`${prefixCls}-rtl`]: direction === 'rtl',
 *
 * 实测统计：55 个组件产出 `-rtl` 结尾的类。但**后缀形态不统一**：
 * `-rtl` / `-wrapper-rtl` / `-wrap-rtl` / `-group-rtl` / `-dropdown-rtl` /
 * `-directory-rtl` / `-compact-item-rtl`。
 *
 * 因此默认断言是「渲染树里存在一个以 `-rtl` 结尾的类名」，
 * 而**不是**「根元素上有 `${prefixCls}-rtl`」—— 后者会把 antd 自己都不统一的约定
 * 当成规范，让一半的组件无法通过。需要精确锁定时传 `rtlClass`。
 *
 * ── Provider 由调用方注入（重要）──────────────────────────────────────────────
 * 上游直接 `import ConfigProvider from '../../components/config-provider'`。
 * 本包**不**这么做：`direction` 的 provide 键属于 ui 层的契约，本包若自己定义一个
 * 就是**第二个事实来源**（`test-utils-contract.md` F5）。
 * 所以 `wrap` 默认恒等 —— 不给 Provider 时组件收不到 `direction: 'rtl'`，
 * 断言会失败。这是**正确**的行为：它在告诉你「还没接上 RTL 上下文」。
 *
 * ⚠️ 本文件此前写着「我们的 ConfigProvider **尚未实现**」—— 那条已过期
 *    （`config-provider` 早已 completed，是 72 个组件之一）。但**结论不变**：
 *    依赖方向仍是 ui → test-utils，本包不该 import 它。
 *
 *     rtlTest('button', {
 *       demos,
 *       wrap: (slot) => h(ConfigProvider, { direction: 'rtl' }, { default: slot }),
 *     });
 *
 * ── 这个测试没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**布局正确**。jsdom 没有布局引擎，「镜像后没串位」这件事
 *     靠 `COMPONENT-RULES.md` §5.3 的「只用逻辑属性」约束 + L6 像素比对。
 *   - 没证明 `-rtl` 类名挂在**正确的层级**。要锁层级请用 `domContractTest`
 *     与 React 基线逐节点比对。
 */

import { describe, expect, it } from 'vitest';
import { assertAllowance } from './allowance';
import { collectCountFailures, collectRenderCases, mountCase } from './render';
import type { Allowance, RenderSource, WarningAllowance } from './types';
import { assertNoUnexpectedWarnings, captureWarnings } from './warnings';

export interface RtlTestOptions extends RenderSource {
  /** 期望的 demo 条数。语义同 `demoTest` 的 `expectCount`。 */
  expectCount?: number;
  /** 精确锁定的 RTL 标记类名。默认：存在任一以 `-rtl` 结尾的类名即可。 */
  rtlClass?: string;
  /**
   * 该组件**有意不产出** RTL 标记类，跳过这条断言。必须带 `reason`。
   *
   * 这是唯一的跳过入口 —— 存在的意义是让「跳过」留下痕迹，
   * 而不是靠一个布尔开关静默关掉。
   */
  allowMissingRtlClass?: Allowance;
  /** 允许的告警。必须带 `reason`。 */
  allow?: readonly WarningAllowance[];
}

/** 判定：类名列表里是否存在 RTL 标记类。**纯函数**，便于单测。 */
export function hasRtlClass(classList: readonly string[], expected: string | undefined): boolean {
  if (expected !== undefined) return classList.includes(expected);
  return classList.some((token) => token.endsWith('-rtl'));
}

/** 构造失败信息。空数组 = 通过。**纯函数**，便于单测。 */
export function collectRtlClassFailures(
  classList: readonly string[],
  expected: string | undefined,
): string[] {
  if (hasRtlClass(classList, expected)) return [];
  return [
    expected === undefined
      ? '渲染树里没有任何以 `-rtl` 结尾的类名。' +
        '若组件确实不产出 RTL 标记类，请传 allowMissingRtlClass: { reason } 显式声明。'
      : `渲染树里没有类名 "${expected}"。`,
    `实际类名：${classList.join(' ')}`,
  ];
}

/** 收集整个渲染子树里的全部类名 token。 */
function collectClasses(host: HTMLElement): string[] {
  const tokens = new Set<string>();
  for (const element of Array.from(host.querySelectorAll('*'))) {
    for (const token of Array.from(element.classList)) tokens.add(token);
  }
  return [...tokens].sort();
}

export function rtlTest(name: string, options: RtlTestOptions): void {
  const context = `rtlTest('${name}')`;
  const cases = collectRenderCases(options, context);
  assertAllowance(options.allowMissingRtlClass, `${context} → allowMissingRtlClass`);
  const skipRtlClass = options.allowMissingRtlClass !== undefined;

  describe(`${name} · RTL`, () => {
    if (options.expectCount !== undefined) {
      const expected = options.expectCount;
      it(`demo 条数等于 expectCount（${expected}）`, () => {
        expect(collectCountFailures(cases.length, expected, 'demo 条数')).toEqual([]);
      });
    }

    for (const testCase of cases) {
      it(`渲染 ${testCase.id} 时带 RTL 标记`, async () => {
        const capture = captureWarnings();
        let classes: string[] = [];

        try {
          const mounted = mountCase(
            testCase.render,
            options.wrap === undefined ? {} : { wrap: options.wrap },
          );
          try {
            await mounted.update();
            classes = collectClasses(mounted.content);
          } finally {
            mounted.destroy();
          }
        } finally {
          capture.restore();
        }

        assertNoUnexpectedWarnings(capture.records, options.allow, `${context} → ${testCase.id}`);

        if (skipRtlClass) return;

        expect(collectRtlClassFailures(classes, options.rtlClass)).toEqual([]);
      });
    }
  });
}

/**
 * 同时提供默认导出 —— 上游 antd 的 `tests/shared/*` 用的是默认导出，
 * 保留它可以让「从 antd 迁移」时按原样 `import rtlTest from "…"` 继续工作。
 */
export default rtlTest;
