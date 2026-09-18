/**
 * L1 —— 动作集合解析 + 延迟解析（纯数据侧）。
 *
 * ⚠️ 这里的期望值**不是**照着实现写的，是从
 * `@rc-component/trigger@3.10.1/es/hooks/useAction.js` 与 `es/hooks/useDelay.js`
 * 逐行读出来的。改实现前先看这段注释。
 */

import { describe, expect, it } from 'vitest';

import { isClickToHide, resolveActions } from '../actions';
import { createDelayInvoker, resolveDelay } from '../delay';

describe('resolveActions · 回落与归一化', () => {
  it('action 的默认值是 hover（index.js:31）', () => {
    const { show, hide } = resolveActions();
    expect([...show]).toEqual(['hover', 'touch']);
    expect([...hide]).toEqual(['hover', 'touch']);
  });

  it('showAction / hideAction 为 undefined 时回落到 action', () => {
    const { show, hide } = resolveActions({ action: 'click', showAction: undefined });
    expect([...show]).toEqual(['click']);
    expect([...hide]).toEqual(['click']);
  });

  it('⭐ 用的是 ?? 不是 || —— 空数组不会被回落掉', () => {
    // antd Dropdown 用 `triggerActions = disabled ? [] : trigger` 表达禁用
    // （dropdown/dropdown.js:128），靠的正是这条。
    const { show, hide } = resolveActions({ action: 'hover', showAction: [] });
    expect(show.size).toBe(0);
    // hideAction 没给 ⇒ 照常回落到 action（两个集合**独立**判定，别被上一条带偏）
    expect([...hide]).toEqual(['hover', 'touch']);
  });

  it('toArray 对 falsy 一律返回空数组（useAction.js:3-5）', () => {
    // `val ? ... : []` —— '' / 0 / false 都走空数组分支
    const { show } = resolveActions({ action: '' as never, showAction: undefined });
    expect(show.size).toBe(0);
  });

  it('单个动作与数组等价', () => {
    expect([...resolveActions({ action: 'focus' }).show]).toEqual(['focus']);
    expect([...resolveActions({ action: ['focus', 'click'] }).show]).toEqual(['focus', 'click']);
  });
});

describe('resolveActions · touch 的隐式注入', () => {
  it('hover 且无 click ⇒ 注入 touch', () => {
    const { show, hide } = resolveActions({ action: 'hover' });
    expect(show.has('touch')).toBe(true);
    expect(hide.has('touch')).toBe(true);
  });

  it('⭐ hover + click 同时存在 ⇒ **不**注入 touch', () => {
    const { show } = resolveActions({ action: ['hover', 'click'] });
    expect(show.has('touch')).toBe(false);
  });

  it('click 单独存在 ⇒ 不注入', () => {
    const { show, hide } = resolveActions({ action: 'click' });
    expect(show.has('touch')).toBe(false);
    expect(hide.has('touch')).toBe(false);
  });

  it('⭐ show 与 hide 独立判定 —— show 有 click 时 hide 仍可注入 touch', () => {
    const { show, hide } = resolveActions({
      showAction: ['hover', 'click'],
      hideAction: ['hover'],
    });
    expect(show.has('touch')).toBe(false);
    expect(hide.has('touch')).toBe(true);
  });

  it('contextMenu 不影响 touch 注入', () => {
    const { show } = resolveActions({ action: 'contextMenu' });
    expect(show.has('touch')).toBe(false);
    expect(show.has('contextMenu')).toBe(true);
  });
});

describe('isClickToHide', () => {
  it('hide 含 click ⇒ true', () => {
    expect(isClickToHide(new Set(['click']))).toBe(true);
  });

  it('⭐ hide 只含 contextMenu 也是 true（index.js:257）', () => {
    // 右键菜单型浮层在**左键**点击外部时也要关。这条极易漏。
    expect(isClickToHide(new Set(['contextMenu']))).toBe(true);
  });

  it('hide 只有 hover / focus ⇒ false', () => {
    expect(isClickToHide(new Set(['hover']))).toBe(false);
    expect(isClickToHide(new Set(['focus']))).toBe(false);
    expect(isClickToHide(new Set())).toBe(false);
  });
});

describe('resolveDelay · 单位是秒', () => {
  it('0 ⇒ 同步立即执行', () => {
    expect(resolveDelay(0)).toEqual({ immediate: true, ms: 0 });
  });

  it('⭐ undefined ⇒ 不是 immediate，且 ms 归零（NaN → 0）', () => {
    // rc: `setTimeout(cb, undefined * 1000)` = `setTimeout(cb, NaN)`，浏览器按 0 处理。
    // 与 `0` 差一个宏任务 —— 这个差异可观测，别合并。
    expect(resolveDelay(undefined)).toEqual({ immediate: false, ms: 0 });
  });

  it('0.1 秒 ⇒ 100ms', () => {
    expect(resolveDelay(0.1)).toEqual({ immediate: false, ms: 100 });
  });

  it('0.15 秒 ⇒ 150ms（Dropdown 的 mouseEnterDelay）', () => {
    expect(resolveDelay(0.15)).toEqual({ immediate: false, ms: 150 });
  });
});

describe('createDelayInvoker', () => {
  it('新的触发取消上一个待执行的（不排队）', () => {
    const cleared: number[] = [];
    const invoker = createDelayInvoker({
      setTimeout: (_cb, ms) => {
        void _cb;
        return ms as unknown as number;
      },
      clearTimeout: (handle) => cleared.push(handle as number),
    });

    const calls: string[] = [];
    invoker.invoke(() => calls.push('a'), 0.1);
    invoker.invoke(() => calls.push('b'), 0.2);

    expect(cleared).toEqual([100]);
    expect(calls).toEqual([]);
    expect(invoker.pending).toBe(true);
  });

  it('immediate 的调用不进 pending', () => {
    const calls: string[] = [];
    const invoker = createDelayInvoker();
    invoker.invoke(() => calls.push('sync'), 0);
    expect(calls).toEqual(['sync']);
    expect(invoker.pending).toBe(false);
  });

  it('clear 之后 pending 归零', () => {
    const invoker = createDelayInvoker();
    invoker.invoke(() => {}, 0.1);
    expect(invoker.pending).toBe(true);
    invoker.clear();
    expect(invoker.pending).toBe(false);
  });
});
