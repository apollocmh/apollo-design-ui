import { describe, expect, it } from 'vitest';
import {
  compactAlgorithm,
  darkAlgorithm,
  defaultAlgorithm,
  getDesignToken,
} from '../get-design-token';
import type { MappingAlgorithm } from '../types';
import baseline from './__fixtures__/antd-token-baseline.json';

/**
 * ★ 这个包的落点：与 antd 真实产出的 token **逐字段**比对。
 *
 * 基准来自 `registry/tools/gen-theme-baseline.mjs`，它**直接执行 antd 6.6.4 的
 * es/theme 代码**（算法部分不依赖 React）并把结果落盘成 JSON。
 *
 * 为什么不用「我们再写一份 antd 的实现当 oracle」：
 * 那只会证明「两边都是我写的」，连一起犯的错都测不出来。基准必须来自 antd 自己的代码。
 *
 * 这个测试**没有证明**什么：
 *   - 没证明视觉一致（那是 L6 截图比对）
 *   - 没证明组件 token 一致（70 组默认值在 ui 侧，本包只提供类型与合并机制）
 *   - 没证明 CSS 变量被正确消费（那是组件样式的事，见 css-var.test.ts）
 */

const ALGOS: Record<string, MappingAlgorithm> = {
  default: defaultAlgorithm,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
};

interface BaselineCase {
  algorithm: string[];
  tokenOverride: Record<string, string | number | boolean>;
  token: Record<string, string | number | boolean>;
}

const cases = baseline.cases as unknown as Record<string, BaselineCase>;

describe('与 antd v6.6.4 的 token 基准逐字段比对', () => {
  it('基准文件本身是 antd 6.6.4 产出的', () => {
    expect(baseline.antdVersion).toBe('6.6.4');
    expect(Object.keys(cases).length).toBeGreaterThanOrEqual(15);
  });

  for (const [name, c] of Object.entries(cases)) {
    it(`用例 ${name}：全部字段一致`, () => {
      const config = {
        algorithm: c.algorithm.map((a) => {
          const algo = ALGOS[a];
          if (!algo) throw new Error(`基准用例 ${name} 引用了未知算法 ${a}`);
          return algo;
        }),
        token: c.tokenOverride,
      };
      const actual = getDesignToken(config) as unknown as Record<string, unknown>;
      const expected = c.token;

      // 先比键集合，再比值 —— 键集合相同但值不同时报"缺字段"会误导排查方向
      const missing = Object.keys(expected).filter((k) => !(k in actual));
      const extra = Object.keys(actual).filter((k) => !(k in expected));
      // ALLOWED_EXTRA：登记过的有意扩展（spin 会话裁决：完美圆是几何常量不是视觉值，
      // 让 dot-item 走 var(--apollo-border-radius-circle) 绕开 E10 —— antd 6.6.4
      // 的 token 集不含它，见 registry 决策登记）。除这个白名单外多一个字段都算错。
      const allowedExtra = new Set(['borderRadiusCircle']);
      expect(missing).toEqual([]);
      expect(extra.filter((k) => !allowedExtra.has(k))).toEqual([]);

      const diffs: string[] = [];
      for (const [k, v] of Object.entries(expected)) {
        // 浮点用精确相等：派生链里所有浮点都是同一批 deterministic 运算，
        // 不相等就说明转写有误，不该用 toBeCloseTo 放过
        if (actual[k] !== v) diffs.push(`${k}: antd=${String(v)} ours=${String(actual[k])}`);
      }
      expect(diffs).toEqual([]);
    });
  }

  it('★ 字段总数与 antd 一致（防止"少派生了一批 token"；多出的仅限 ALLOWED_EXTRA）', () => {
    const defaultCase = cases.default;
    if (!defaultCase) throw new Error('基准文件缺少 default 用例');
    const allowedExtra = new Set(['borderRadiusCircle']);
    const oursExtra = Object.keys(getDesignToken()).filter((k) => allowedExtra.has(k)).length;
    const ours = Object.keys(getDesignToken()).length - oursExtra;
    const antd = Object.keys(defaultCase.token).length;
    expect(ours).toBe(antd);
  });
});
