import { resetWarned, warningOnce } from '@apollo-design/utils';
import { describe, expect, it } from 'vitest';
import type { WarningAllowance } from '../types';
import {
  assertNoUnexpectedWarnings,
  captureWarnings,
  excludeAllWarning,
  excludeWarning,
  partitionWarnings,
  type WarningRecord,
} from '../warnings';

const record = (text: string, method: 'error' | 'warn' = 'error'): WarningRecord => ({
  method,
  args: [text],
  text,
});

/**
 * 告警采集与断言。
 *
 * 这里的重点是两件事：
 *   1. 采集**不漏**（`console.warn` 也要抓，Vue 的 dev 警告走 warn）
 *   2. 断言**不软**（未豁免的告警要炸；未使用的豁免也要炸）
 */
describe('warnings', () => {
  describe('captureWarnings', () => {
    it('同时采集 console.error 与 console.warn，且不真的写出去', () => {
      const capture = captureWarnings();
      try {
        console.error('e1');
        console.warn('w1');
        console.error('e2');
      } finally {
        capture.restore();
      }

      expect(capture.records.map((item) => `${item.method}:${item.text}`)).toEqual([
        'error:e1',
        'warn:w1',
        'error:e2',
      ]);
      expect(capture.texts()).toEqual(['e1', 'w1', 'e2']);
    });

    it('多个实参拼成一行文本', () => {
      const capture = captureWarnings();
      try {
        console.error('a', 1, true);
      } finally {
        capture.restore();
      }
      expect(capture.texts()).toEqual(['a 1 true']);
    });

    it('Error 实参取 message 而不是整个对象', () => {
      const capture = captureWarnings();
      try {
        console.error(new Error('boom'));
      } finally {
        capture.restore();
      }
      expect(capture.texts()).toEqual(['boom']);
    });

    it('普通对象序列化成 JSON', () => {
      const capture = captureWarnings();
      try {
        console.error({ a: 1 });
      } finally {
        capture.restore();
      }
      expect(capture.texts()).toEqual(['{"a":1}']);
    });

    it('循环引用不抛错（退化成 String）', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      const capture = captureWarnings();
      try {
        console.error(circular);
      } finally {
        capture.restore();
      }
      expect(capture.texts()).toEqual(['[object Object]']);
    });

    it('restore 后 console 复原，且幂等', () => {
      const origin = { error: console.error, warn: console.warn };
      const capture = captureWarnings();
      capture.restore();
      capture.restore();

      expect(console.error).toBe(origin.error);
      expect(console.warn).toBe(origin.warn);
    });

    it('excludeWarning 是 captureWarnings 的别名（上游命名对照）', () => {
      expect(excludeWarning).toBe(captureWarnings);
    });
  });

  describe('partitionWarnings', () => {
    const allowError: WarningAllowance = { match: 'fixture error', reason: '夹具' };

    it('无告警、无豁免 → 都是空', () => {
      expect(partitionWarnings([], [])).toEqual({ unexpected: [], used: [] });
    });

    it('未命中的告警进入 unexpected，带 method 前缀', () => {
      const result = partitionWarnings([record('something else', 'warn')], [allowError]);
      expect(result.unexpected).toEqual(['[warn] something else']);
      expect(result.used).toEqual([]);
    });

    it('命中的告警消耗掉对应豁免', () => {
      const result = partitionWarnings([record('a fixture error b')], [allowError]);
      expect(result.unexpected).toEqual([]);
      expect(result.used).toEqual([allowError]);
    });

    it('used 保持豁免的原始顺序', () => {
      const first: WarningAllowance = { match: 'one', reason: 'r1' };
      const second: WarningAllowance = { match: 'two', reason: 'r2' };
      const result = partitionWarnings([record('two'), record('one')], [first, second]);
      expect(result.used).toEqual([first, second]);
    });
  });

  describe('assertNoUnexpectedWarnings', () => {
    it('无告警时放行', () => {
      expect(() => assertNoUnexpectedWarnings([], undefined, 'ctx')).not.toThrow();
    });

    it('有未豁免告警时抛错，且信息里列出原文', () => {
      try {
        assertNoUnexpectedWarnings([record('bad thing')], [], 'ctx');
        expect.unreachable('应当抛错');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('[error] bad thing');
        expect(message).toContain('TESTING.md §4.2');
      }
    });

    it('豁免被命中时放行', () => {
      const allow: WarningAllowance = { match: 'bad thing', reason: '夹具' };
      expect(() => assertNoUnexpectedWarnings([record('bad thing')], [allow], 'ctx')).not.toThrow();
    });

    it('豁免没被命中时也抛错（防腐烂）', () => {
      const allow: WarningAllowance = { match: 'never happens', reason: '陈旧' };
      try {
        assertNoUnexpectedWarnings([], [allow], 'ctx');
        expect.unreachable('应当抛错');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('没有被任何告警命中');
        expect(message).toContain('never happens');
      }
    });

    it('豁免缺 reason 时先抛豁免校验错误（优先级更高）', () => {
      const allow: WarningAllowance = { match: 'x', reason: '' };
      expect(() => assertNoUnexpectedWarnings([], [allow], 'ctx')).toThrow(/非空 reason/);
    });
  });

  describe('resetWarned（复用 @apollo-design/utils，不重写）', () => {
    it('重置去重表：同一条 warningOnce 在 reset 后能再次输出', () => {
      const message = 'test-utils · resetWarned 探针';

      const first = captureWarnings();
      try {
        warningOnce(false, message);
        warningOnce(false, message);
      } finally {
        first.restore();
      }
      // 去重生效：只输出一次。
      expect(first.records).toHaveLength(1);

      resetWarned();

      const second = captureWarnings();
      try {
        warningOnce(false, message);
      } finally {
        second.restore();
      }
      // 重置后同一条消息重新可输出 —— 证明拿到的是 utils 的**同一个**模块状态。
      expect(second.records).toHaveLength(1);
    });
  });

  describe('excludeAllWarning（beforeAll / afterAll 包装）', () => {
    const handle = excludeAllWarning();

    it('beforeAll 之后 console 已被接管（写出去的内容不会真的输出）', () => {
      expect(handle.capture).toBeDefined();
      console.error('excludeAllWarning 探针');
      expect(handle.capture?.texts()).toContain('excludeAllWarning 探针');
    });
  });
});
