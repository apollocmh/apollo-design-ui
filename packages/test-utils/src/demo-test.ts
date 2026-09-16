/**
 * `demoTest` —— 遍历组件的全部 demo，每个都渲染、更新、卸载且不报错、不告警。
 *
 * ── 与上游的关系（`tests/shared/demoTest.tsx`，220 行）──────────────────────────
 * 上游每个 demo 做三件事：`toMatchSnapshot()`（全量 HTML）、`toMatchSnapshot()`（警告列表）、
 * 以及隐式的「render 不抛错」。还额外断言组件名是 kebab-case，并顺带跑 `rootPropsTest`。
 *
 * 我们**有意去掉两个快照**（`TESTING.md` 反模式 **A7**：用完整 DOM 快照替代契约测试）：
 *   - HTML 快照：会把「结构漂移」和「无意义属性变化」混在一起报警，噪声大；
 *     而且**首次运行即写盘**，第一版永远是绿的 —— 它检测「变了」，不检测「对不对」。
 *     结构契约改由 L4 `domContractTest` 承担，且比对方向是**与 React 基线**而不是
 *     「与上一次的自己」。
 *   - 警告快照：我们改成**断言警告列表为空**。快照会把已有的错误固化成「预期」，
 *     而「这个 demo 不该产生任何告警」是一条可以直接判定对错的契约。
 *
 * 另外去掉的：`TriggerMockContext` 注入（浮层的 provide 键属 overlay/ui 层契约）、
 * `ConfigProvider theme={{hashed:false}}` + `StyleProvider`（`@ant-design/cssinjs`，H6 禁止；
 * 我们零运行时，测试环境不注入样式）。Provider 需求由调用方通过 `wrap` 提供。
 *
 * 上游还顺手断言「组件名是 kebab-case」并顺带跑 `rootPropsTest`。前者**不做**：
 * `COMPONENT-RULES.md` §3 的 R2 规定组件名是**带 `A` 前缀的 PascalCase**（`AButton`），
 * 与上游的 kebab-case 规则相反。后者**不做**：隐式跑另一个契约会让失败归属变模糊，
 * 需要 rootProps 契约的组件显式调用 `rootPropsTest`。
 *
 * ── demo 从哪来（关键差异）────────────────────────────────────────────────────
 * 上游用 `globSync('./components/<x>/demo/*.tsx')` + `jest.requireActual` —— **运行时**扫描。
 * Vite 的 `import.meta.glob` 是**编译期**静态分析，模式串必须是字面量、基准是调用它的文件，
 * 所以本包**无法**替别的目录 glob。必须由组件测试传入自己的 glob 结果：
 *
 *     demoTest('button', import.meta.glob('../demo/*.vue', { eager: true }));
 *
 * 代价是「少写一个 demo」不再自动发现。为此提供 `expectCount`：
 * 声明的 demo 数量与实际不符即失败（详见 `test-utils-contract.md` F1）。
 *
 * ── 这个测试没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明 demo **渲染出了预期内容**。去掉 HTML 快照后，demo 的语义正确性
 *     靠人读 + L6 截图；结构契约由 `domContractTest`（对 fixture，不是对 demo）承担。
 *   - 没证明 demo 的 props 组合**在真实使用中合理**。
 */

import { describe, expect, it } from 'vitest';
import { assertAllowances } from './allowance';
import { collectCountFailures, collectRenderCases, mountCase } from './render';
import type { RenderSource, WarningAllowance } from './types';
import { captureWarnings, partitionWarnings, type WarningRecord } from './warnings';

export interface DemoTestOptions extends RenderSource {
  /**
   * 期望的 demo 条数。
   *
   * `import.meta.glob` 匹配不到文件时**不会报错**，只会少生成用例 ——
   * 文件被重命名/删除后，「测试全绿」会静默地少测几条。声明条数把这件事变成红灯。
   */
  expectCount?: number;
  /** 允许的告警。必须带 `reason`；未被命中的豁免会让测试失败（防腐烂）。 */
  allow?: readonly WarningAllowance[];
}

/** 一次 demoTest 调用里累积的观测结果。 */
interface Observation {
  id: string;
  records: readonly WarningRecord[];
}

export function demoTest(name: string, options: DemoTestOptions): void {
  const context = `demoTest('${name}')`;
  // 结构错误（既没 demos 也没 render / 两者都给）在**收集阶段**抛出 —— 快速失败。
  const cases = collectRenderCases(options, context);
  const allowances = options.allow ?? [];
  assertAllowances(allowances, context);

  const observations: Observation[] = [];

  describe(`${name} · demo`, () => {
    if (options.expectCount !== undefined) {
      const expected = options.expectCount;
      it(`demo 条数等于 expectCount（${expected}）`, () => {
        expect(collectCountFailures(cases.length, expected, 'demo 条数')).toEqual([]);
      });
    }

    for (const testCase of cases) {
      it(`渲染 ${testCase.id}`, async () => {
        const capture = captureWarnings();
        try {
          const mounted = mountCase(
            testCase.render,
            options.wrap === undefined ? {} : { wrap: options.wrap },
          );
          try {
            await mounted.update();
          } finally {
            mounted.destroy();
          }
        } finally {
          capture.restore();
        }

        observations.push({ id: testCase.id, records: capture.records });

        // 逐 demo 判定，失败信息里带 demo 名 —— 比在最后统一报要好定位。
        const { unexpected } = partitionWarnings(capture.records, allowances);
        expect(unexpected, `demo ${testCase.id}`).toEqual([]);
      });
    }

    it('全部豁免都被用到（防腐烂）', () => {
      // ⚠️ 这条依赖「上面的用例已按声明顺序、串行执行完」。
      //    用渲染计数把这个假设变成**可证伪**的断言：若顺序变了（例如有人加了 .concurrent），
      //    这里会先红，而不是给出一个假的「没有腐烂」结论。
      expect(observations).toHaveLength(cases.length);

      const all = observations.flatMap((observation) => observation.records);
      const { used } = partitionWarnings(all, allowances);
      const stale = allowances.filter((allowance) => !used.includes(allowance));

      expect(
        stale.map(
          (allowance) =>
            `未被任何 demo 命中的豁免：match="${allowance.match}"（reason: ${allowance.reason}）`,
        ),
      ).toEqual([]);
    });
  });
}

/**
 * 同时提供默认导出 —— 上游 antd 的 `tests/shared/*` 用的是默认导出，
 * 保留它可以让「从 antd 迁移」时按原样 `import demoTest from "…"` 继续工作。
 */
export default demoTest;
