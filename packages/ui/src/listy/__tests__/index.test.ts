/**
 * L1/L2 · 单元与交互 —— Listy（引擎语义逐条转断言）
 *
 * 判据：`@rc-component/listy@1.2.3` 的 RawList / VirtualList / useRawListScroll /
 * useFlattenRows / useGroupSegments / useStickyGroupHeader（行为判据，非 DOM 判据
 * —— DOM 由 L4 钉）。虚拟模式是行为测试（DOM 差异属 foundation PLATFORM）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import {
  collectGroupSegments,
  findActiveHeaderIndex,
  flattenRows,
  resolveItemKey,
  stickyPush,
  toTaggedKey,
} from '../engine';
import { Listy } from '../index';
import { itemHeightOf } from '../style';

// ============================== fixtures ==============================

const ITEMS = Array.from({ length: 30 }, (_, i) => ({ key: i, content: `Item ${i}` }));
const GROUP_ITEMS = [
  { key: 1, group: 'B', content: 'one' },
  { key: 2, group: 'A', content: 'two' },
  { key: 3, group: 'B', content: 'three' },
  { key: 4, group: 'A', content: 'four' },
];
const GROUP = {
  key: (item: Record<string, unknown>) => item.group as string,
  title: (key: unknown, items: Record<string, unknown>[]) => `${key}:${items.length}`,
};

const makeListy = (
  props: Record<string, unknown> = {},
  slot?: (scope: { item: { content: string; key: number } }) => unknown,
) =>
  mount(Listy, {
    props: { items: ITEMS, rowKey: 'key', ...props },
    slots: slot ? { default: slot as never } : undefined,
  });

// ============================== engine（纯函数） ==============================

describe('Listy · engine', () => {
  it('toTaggedKey：item/group 前缀防冲突', () => {
    expect(toTaggedKey(1, 'item')).toBe('item:1');
    expect(toTaggedKey('1', 'group')).toBe('group:1');
  });

  it('collectGroupSegments：按 key 聚合、不要求连续、保首次出现顺序', () => {
    const map = collectGroupSegments(GROUP_ITEMS, GROUP);
    expect([...map.keys()]).toEqual(['B', 'A']);
    expect(map.get('B')?.map((s) => s.item.key)).toEqual([1, 3]);
    expect(map.get('A')?.map((s) => s.index)).toEqual([1, 3]);
  });

  it('collectGroupSegments：无 group ⇒ 空 Map', () => {
    expect(collectGroupSegments(GROUP_ITEMS, undefined).size).toBe(0);
  });

  it('resolveItemKey：字段名与函数两形态', () => {
    expect(resolveItemKey('key', { key: 7 })).toBe(7);
    expect(resolveItemKey((item: { key: number }) => item.key * 2, { key: 7 })).toBe(14);
  });

  it('flattenRows：无分组 ⇒ 纯 item 行（tagged 键）', () => {
    const { rows, groupKeys, groupKeyToItems } = flattenRows(ITEMS, undefined, (i) => i.key);
    expect(rows).toHaveLength(ITEMS.length);
    expect(rows[0]).toMatchObject({ type: 'item', index: 0, taggedKey: 'item:0' });
    expect(groupKeys).toEqual([]);
    expect(groupKeyToItems.size).toBe(0);
  });

  it('flattenRows：有分组 ⇒ 组头行 + 项行，并建 itemKeyToGroupKey 索引', () => {
    const { rows, groupKeys, groupKeyToItems, itemKeyToGroupKey } = flattenRows(
      GROUP_ITEMS,
      GROUP,
      (i) => i.key,
    );
    expect(rows[0]).toMatchObject({ type: 'group', groupKey: 'B', taggedKey: 'group:B' });
    expect(groupKeys).toEqual(['B', 'A']);
    expect(groupKeyToItems.get('B')?.map((i) => i.content)).toEqual(['one', 'three']);
    expect(itemKeyToGroupKey.get('item:2')).toBe('A');
  });

  it('findActiveHeaderIndex：二分 + 1px 容差', () => {
    const keys = ['a', 'b', 'c'];
    const tops: Record<string, number> = { a: 0, b: 100, c: 200 };
    expect(findActiveHeaderIndex(keys, (k) => tops[k] ?? 0, 0)).toBe(0);
    // ⚠️ rc 语义：top <= scrollTop + 1(容差) ⇒ 到达。scrollTop=99.5 时 b(100) 已命中
    expect(findActiveHeaderIndex(keys, (k) => tops[k] ?? 0, 98)).toBe(0);
    expect(findActiveHeaderIndex(keys, (k) => tops[k] ?? 0, 99.5)).toBe(1);
    expect(findActiveHeaderIndex(keys, (k) => tops[k] ?? 0, 100.5)).toBe(1);
    expect(findActiveHeaderIndex(keys, (k) => tops[k] ?? 0, 999)).toBe(2);
  });

  it('stickyPush：下一组顶到视口顶时推头；无下一组 ⇒ 0', () => {
    expect(stickyPush(undefined, 40, 500)).toBe(0);
    expect(stickyPush(300, 40, 500)).toBe(-240); // 300-40-500 = -240
    expect(stickyPush(560, 40, 500)).toBe(0); // 正 ⇒ clamp 到 0
  });
});

// ============================== Raw 分支（默认） ==============================

describe('Listy · Raw（virtual 默认 false）', () => {
  it('items 数据驱动：每项渲染为 .{p}-item[data-key="item:k"]，内容来自插槽', () => {
    const w = makeListy({}, () => 'X');
    const items = w.findAll('[data-key^="item:"]');
    expect(items).toHaveLength(30);
    expect(items[0]!.attributes('data-key')).toBe('item:0');
    expect(items[0]!.text()).toBe('X');
    expect(w.find('.apollo-listy').exists()).toBe(true);
  });

  it('itemRender prop 与插槽等价（插槽优先）', () => {
    const byProp = makeListy({ itemRender: (item: { content: string }) => item.content });
    expect(byProp.find('[data-key="item:0"]').text()).toBe('Item 0');
    const bySlot = makeListy({}, () => 'SLOT');
    expect(bySlot.find('[data-key="item:0"]').text()).toBe('SLOT');
  });

  it('分组：section[data-key=group:k] + 组头 title(k, items)；不同 key 非连续也聚合', () => {
    const w = mount(Listy, {
      props: { items: GROUP_ITEMS, rowKey: 'key', group: GROUP },
      slots: { default: ({ item }: { item: { content: string } }) => item.content },
    });
    const sections = w.findAll('.apollo-listy-group-section');
    expect(sections).toHaveLength(2);
    expect(sections[0]!.attributes('data-key')).toBe('group:B');
    expect(sections[0]!.find('.apollo-listy-group-header').text()).toBe('B:2');
    // B 组的项：key 1、3
    const bKeys = sections[0]!.findAll('[data-key^="item:"]').map((n) => n.attributes('data-key'));
    expect(bKeys).toEqual(['item:1', 'item:3']);
  });

  it('sticky：组头带 -sticky 类（CSS 吸顶）', () => {
    const w = mount(Listy, {
      props: { items: GROUP_ITEMS, rowKey: 'key', group: GROUP, sticky: true },
      slots: { default: () => 'x' },
    });
    expect(w.find('.apollo-listy-group-header-sticky').exists()).toBe(true);
  });

  it('height ⇒ maxHeight + overflowY:auto；无 height ⇒ 不设', () => {
    const withH = makeListy({ height: 120 }, () => 'x');
    const style = withH.find('.apollo-listy').attributes('style') ?? '';
    expect(style).toContain('max-height');
    expect(style).toContain('overflow-y');
    const noH = makeListy({}, () => 'x');
    expect(noH.find('.apollo-listy').attributes('style') ?? '').not.toContain('max-height');
  });

  it('onScroll 透传到根节点', async () => {
    const onScroll = vi.fn();
    const w = makeListy({ onScroll }, () => 'x');
    await w.find('.apollo-listy').trigger('scroll');
    expect(onScroll).toHaveBeenCalled();
  });

  it('ref.scrollTo(number) ⇒ 设置 scrollTop；null ⇒ no-op', async () => {
    const w = makeListy({ height: 100 }, () => 'x');
    await nextTick();
    (w.vm as unknown as { scrollTo: (c?: unknown) => void }).scrollTo(50);
    expect((w.find('.apollo-listy').element as HTMLElement).scrollTop).toBe(50);
    expect(() =>
      (w.vm as unknown as { scrollTo: (c?: unknown) => void }).scrollTo(null),
    ).not.toThrow();
  });

  it('ref.scrollTo({key, align}) ⇒ scrollIntoView 到 data-key 目标', async () => {
    const w = makeListy({ height: 100 }, () => 'x');
    await nextTick();
    const target = w.find('[data-key="item:10"]').element as HTMLElement;
    // jsdom 未实现 scrollIntoView ⇒ 桩（vi.spyOn 要求已有属性）
    const spy = vi.fn();
    Object.defineProperty(target, 'scrollIntoView', { value: spy, configurable: true });
    (w.vm as unknown as { scrollTo: (c?: unknown) => void }).scrollTo({
      key: 10,
      align: 'top',
      offset: 5,
    });
    expect(spy).toHaveBeenCalledWith({ block: 'start', inline: 'nearest' });
    // scrollMargin 占位与恢复
    expect(target.style.scrollMarginTop).toBe('');
    expect(target.style.scrollMarginBottom).toBe('');
    spy.mockRestore();
  });
});

// ============================== Virtual 分支 ==============================

describe('Listy · Virtual（virtual + height）', () => {
  it('只渲染视口内的项（30 项 / 高 100 ⇒ 远少于全量）', async () => {
    const w = makeListy(
      { virtual: true, height: 100 },
      ({ item }: { item: { content: string } }) => item.content,
    );
    await nextTick();
    await nextTick();
    const rendered = w.findAll('.apollo-listy-item');
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(ITEMS.length);
  });

  it('ref.scrollTo({key, align}) 迭代到目标项（30 项里滚到第 25）', async () => {
    const w = makeListy(
      { virtual: true, height: 100 },
      ({ item }: { item: { content: string } }) => item.content,
    );
    await nextTick();
    await nextTick();
    // jsdom 无布局：桩 holder 的 clientHeight（computeScrollTarget 需要）与项高
    const holder = w.find('.apollo-listy-holder').element as HTMLElement;
    Object.defineProperty(holder, 'clientHeight', { value: 100, configurable: true });
    const itemHeight = itemHeightOf();
    for (const node of w.findAll('.apollo-listy-item')) {
      const el = node.element as HTMLElement;
      Object.defineProperty(el, 'offsetParent', { value: document.body, configurable: true });
      Object.defineProperty(el, 'offsetHeight', { value: itemHeight, configurable: true });
    }
    (w.vm as unknown as { scrollTo: (c?: unknown) => void }).scrollTo({
      key: 25,
      align: 'top',
    });
    await nextTick();
    await nextTick();
    const texts = w.findAll('.apollo-listy-item').map((n) => n.text());
    expect(texts).toContain('Item 25');
  });

  it('virtual 虚拟分组：组头行参与扁平化', async () => {
    const w = mount(Listy, {
      props: { items: GROUP_ITEMS, rowKey: 'key', group: GROUP, virtual: true, height: 200 },
      slots: { default: () => 'x' },
    });
    await nextTick();
    await nextTick();
    expect(w.findAll('.apollo-listy-group-header').length).toBeGreaterThan(0);
  });
});
