/**
 * Overflow · calcDisplayCount 纯函数 oracle（rc useLayoutEffect 循环逐分支）
 * + jsdom 集成（ResizeObserver 不可用 ⇒ 不测量 ⇒ 保持现状，与 React 版一致）。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import Overflow, { calcDisplayCount, INVALIDATE, RESPONSIVE } from '../overflow';

describe('calcDisplayCount · rc useLayoutEffect 循环逐分支', () => {
  it('containerWidth 为 0/null ⇒ 不计算（displayCount null = 保持现状）', () => {
    expect(calcDisplayCount(null, [10, 10], 10).displayCount).toBeNull();
    expect(calcDisplayCount(0, [10, 10], 10).displayCount).toBeNull();
  });

  it('空数据 ⇒ displayCount 0', () => {
    expect(calcDisplayCount(100, [], 10)).toEqual({ displayCount: 0, notReady: false });
  });

  it('只有一项且放得下 ⇒ 全显（lastIndex===0 分支）', () => {
    expect(calcDisplayCount(100, [50], 10)).toEqual({ displayCount: 0, notReady: false });
  });

  it('数据未测量齐（undefined）⇒ 停 i-1 且 notReady', () => {
    const r = calcDisplayCount(1000, [50, undefined, 50], 10);
    expect(r.displayCount).toBe(0);
    expect(r.notReady).toBe(true);
  });

  it('最后两项放得下 ⇒ 全显（lastIndex-1 分支）', () => {
    // 总宽 40 + rest 10 = 50 ≤ 100
    expect(calcDisplayCount(100, [10, 10, 10, 10], 10).displayCount).toBe(3);
  });

  it('放不下 ⇒ 折叠到 i-1（rest 分支）', () => {
    // 前两项 30，到第三项 30+30+rest10 > 50 ⇒ displayCount=1
    expect(calcDisplayCount(50, [10, 10, 30, 10], 10).displayCount).toBe(1);
  });

  it('rest 宽为 0 ⇒ 只要项宽之和放得下就全显', () => {
    expect(calcDisplayCount(30, [10, 10, 10], 0).displayCount).toBe(2);
  });
});

describe('Overflow · jsdom 集成（无 ResizeObserver ⇒ 不测量）', () => {
  it('invalidate 模式全渲染', () => {
    const wrapper = mount(Overflow, {
      props: {
        data: ['a', 'b', 'c'],
        maxCount: INVALIDATE,
        renderRawItem: (item: unknown) => h('span', String(item)),
      },
    });
    expect(wrapper.findAll('span').length).toBe(3);
  });

  it('responsive 模式：jsdom 下无测量 ⇒ displayCount 保持 null ⇒ 全部隐藏但渲染（opacity 0）', async () => {
    const wrapper = mount(Overflow, {
      props: {
        data: ['a', 'b'],
        maxCount: RESPONSIVE,
        renderRawItem: (item: unknown) => h('span', String(item)),
      },
    });
    await nextTick();
    // 与 React 版一致：containerWidth null ⇒ mergedData 空 ⇒ 无 item 节点
    expect(wrapper.findAll('span').length).toBe(0);
    void wrapper.unmount;
  });

  it('数字 maxCount：按数量截断 + rest 节点', () => {
    const wrapper = mount(Overflow, {
      props: {
        data: ['a', 'b', 'c'],
        maxCount: 2,
        renderRawItem: (item: unknown) => h('span', String(item)),
        renderRest: (omitted: unknown[]) => `+${omitted.length}`,
      },
    });
    // rest 是 div（renderRest 文本节点），items 是 span
    const texts = [
      ...wrapper.findAll('span').map((s) => s.text()),
      ...wrapper.findAll('.apollo-overflow-item-rest').map((d) => d.text()),
    ];
    expect(texts).toEqual(['a', 'b', '+1']);
  });
});
