import { describe, expect, it } from 'vitest';
import { AllowanceError, assertAllowance, assertAllowances } from '../allowance';
import type { Allowance } from '../types';

/**
 * `assertAllowance` 是本包**唯一**的豁免校验点。
 * 它存在的理由只有一条：**不允许沉默的例外**（`AGENTS.md` H8 / `TESTING.md` T16）。
 * 因此这里的重点是「没写理由就一定要炸」，而不是「写了理由就放行」。
 */
describe('allowance', () => {
  describe('assertAllowance', () => {
    it('没有豁免时放行', () => {
      expect(() => assertAllowance(undefined, 'ctx')).not.toThrow();
    });

    it('理由非空时放行', () => {
      expect(() => assertAllowance({ reason: '上游行为如此' }, 'ctx')).not.toThrow();
    });

    it('理由为空白时抛 AllowanceError', () => {
      expect(() => assertAllowance({ reason: '' }, 'ctx')).toThrow(AllowanceError);
      expect(() => assertAllowance({ reason: '   ' }, 'ctx')).toThrow(AllowanceError);
      expect(() => assertAllowance({ reason: '\n\t ' }, 'ctx')).toThrow(AllowanceError);
    });

    it('理由不是字符串时抛 AllowanceError（防用类型断言绕过）', () => {
      const bogus = { reason: undefined } as unknown as Allowance;
      expect(() => assertAllowance(bogus, 'ctx')).toThrow(AllowanceError);
    });

    it('错误信息里带定位串与修复指引', () => {
      try {
        assertAllowance({ reason: '' }, "demoTest('button')");
        expect.unreachable('应当抛错');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain("demoTest('button')");
        expect(message).toContain('COMPATIBILITY.md');
        expect(message).toContain('deviationId');
      }
    });

    it('错误类型是 AllowanceError 且 name 正确', () => {
      try {
        assertAllowance({ reason: '' }, 'ctx');
        expect.unreachable('应当抛错');
      } catch (error) {
        expect(error).toBeInstanceOf(AllowanceError);
        expect((error as AllowanceError).name).toBe('AllowanceError');
      }
    });
  });

  describe('assertAllowances', () => {
    it('undefined 时放行', () => {
      expect(() => assertAllowances(undefined, 'ctx')).not.toThrow();
    });

    it('空数组时放行', () => {
      expect(() => assertAllowances([], 'ctx')).not.toThrow();
    });

    it('逐条校验，全部合法时放行', () => {
      expect(() => assertAllowances([{ reason: 'a' }, { reason: 'b' }], 'ctx')).not.toThrow();
    });

    it('错误信息里带条目下标（否则不知道是哪一条）', () => {
      try {
        assertAllowances([{ reason: 'ok' }, { reason: '' }], 'ctx');
        expect.unreachable('应当抛错');
      } catch (error) {
        expect((error as Error).message).toContain('ctx[1]');
      }
    });
  });
});
