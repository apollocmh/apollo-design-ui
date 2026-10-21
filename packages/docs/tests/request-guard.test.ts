/**
 * 异步页面加载的代次守卫（2026-10-21 审计 A05）。
 *
 * 症状：快速切换路由时，旧页面的请求晚于新页面 resolve，会把新内容覆盖回旧内容。
 * 修复不是「取消防抖」而是「旧代次的结果直接丢弃」—— 这里钉住这个判据。
 */
import { describe, expect, it } from 'vitest';
import { createRequestGuard } from '../src/composables/request-guard';

describe('createRequestGuard', () => {
  it('旧请求晚到时被丢弃，只有最新代次能写入', async () => {
    const guard = createRequestGuard();
    const applied: string[] = [];

    async function load(value: string, delay: number): Promise<void> {
      const token = guard.next();
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (guard.isCurrent(token)) applied.push(value);
    }

    await Promise.all([load('旧页面', 20), load('新页面', 5)]);
    expect(applied).toEqual(['新页面']);
  });

  it('每次 next() 都会让之前的代次失效', () => {
    const guard = createRequestGuard();
    const first = guard.next();
    expect(guard.isCurrent(first)).toBe(true);
    const second = guard.next();
    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });
});
