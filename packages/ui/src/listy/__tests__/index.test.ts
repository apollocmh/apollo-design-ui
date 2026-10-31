/**
 * L1/L2 · 单元与交互 —— Listy（引擎语义逐条转断言）
 *
 * 判据：`@rc-component/listy@1.2.3` 的 RawList / VirtualList / useRawListScroll /
 * useFlattenRows / useGroupSegments / useStickyGroupHeader（行为判据，非 DOM 判据
 * —— DOM 由 L4 钉）。虚拟模式是行为测试（DOM 差异属 foundation PLATFORM）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, type VNodeChild } from 'vue';
import {
  collectGroupSegments,
  findActiveHeaderIndex,
  flattenRows,
  resolveItemKey,
  stickyPush,
  toTaggedKey,
} from '../engine';
import { Listy } from '../index';
import type { ListyProps, ListyRef } from '../interface';
import { itemHeightOf } from '../style';

// ============================== fixtures ==============================

const ITEMS = Array.from({ length: 30 }, (_, i) => ({ key: i, content: `Item ${i}` }));
const GROUP_ITEMS = [
  { key: 1, group: 'B', content: 'one' },
  { key: 2, group: 'A', content: 'two' },
  { key: 3, group: 'B', content: 'three' },
  { key: 4, group: 'A', content: 'four' },
];
type Item = (typeof ITEMS)[number];
type GroupItem = (typeof GROUP_ITEMS)[number];
const GROUP = { key: (item: GroupItem) => item.group };
const groupHeader = ({ groupKey, items }: { groupKey: string; items: GroupItem[] }) =>
  `${groupKey}:${items.length}`;

const makeListy = (
  props: Partial<ListyProps<Item>> = {},
  slot?: (scope: { item: Item; index: number }) => VNodeChild,
) => {
  const list = ref<ListyRef | null>(null);
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          Listy<Item>,
          { items: ITEMS, rowKey: 'key', ...props, ref: list },
          slot ? { default: slot } : {},
        ),
    }),
  );
  return Object.assign(wrapper, {
    scrollTo: (config?: Parameters<ListyRef['scrollTo']>[0]) => list.value?.scrollTo(config),
  });
};

// ============================== engine（纯函数） ==============================

describe('Listy · engine', () => {
  it('toTaggedKey：item/group 前缀防冲突', () => {
    expect(toTaggedKey(1, 'item')).toBe('item:number:1');
    expect(toTaggedKey('1', 'group')).toBe('group:string:1');
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
    expect(rows[0]).toMatchObject({ type: 'item', index: 0, taggedKey: 'item:number:0' });
    expect(groupKeys).toEqual([]);
    expect(groupKeyToItems.size).toBe(0);
  });

  it('flattenRows：有分组 ⇒ 组头行 + 项行，并建 itemKeyToGroupKey 索引', () => {
    const { rows, groupKeys, groupKeyToItems, itemKeyToGroupKey } = flattenRows(
      GROUP_ITEMS,
      GROUP,
      (i) => i.key,
    );
    expect(rows[0]).toMatchObject({ type: 'group', groupKey: 'B', taggedKey: 'group:string:B' });
    expect(groupKeys).toEqual(['B', 'A']);
    expect(groupKeyToItems.get('B')?.map((i) => i.content)).toEqual(['one', 'three']);
    expect(itemKeyToGroupKey.get('item:number:2')).toBe('A');
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
    expect(items[0]!.attributes('data-key')).toBe('item:number:0');
    expect(items[0]!.text()).toBe('X');
    expect(w.find('.apollo-listy').exists()).toBe(true);
  });

  it('default slot receives the actual item and original index', () => {
    const byItem = makeListy({}, ({ item, index }) => `${index}:${item.content}`);
    expect(byItem.find('[data-key="item:number:0"]').text()).toBe('0:Item 0');
    const bySlot = makeListy({}, () => 'SLOT');
    expect(bySlot.find('[data-key="item:number:0"]').text()).toBe('SLOT');
  });

  it('group headers and rows share a parent; non-contiguous groups still aggregate', () => {
    const w = mount(Listy<GroupItem, string>, {
      props: { items: GROUP_ITEMS, rowKey: 'key', group: GROUP },
      slots: { default: ({ item }: { item: GroupItem }) => item.content, groupHeader },
    });
    const headers = w.findAll('.apollo-listy-group-header');
    expect(headers).toHaveLength(2);
    expect(headers[0]?.attributes('data-key')).toBe('group:string:B');
    expect(headers[0]?.text()).toBe('B:2');
    const children = w.get('.apollo-listy').element.children;
    expect([...children].map((node) => node.getAttribute('data-key')).filter(Boolean)).toEqual([
      'group:string:B',
      'item:number:1',
      'item:number:3',
      'group:string:A',
      'item:number:2',
      'item:number:4',
    ]);
    expect(headers[0]?.element.parentElement).toBe(
      w.get('[data-key="item:number:1"]').element.parentElement,
    );
  });

  it('sticky：组头带 -sticky 类（CSS 吸顶）', () => {
    const w = mount(Listy<GroupItem, string>, {
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
    w.scrollTo(50);
    expect(w.get<HTMLElement>('.apollo-listy').element.scrollTop).toBe(50);
    expect(() => w.scrollTo(null)).not.toThrow();
  });

  it('ref.scrollTo({key, align}) offsets its own holder without scrolling ancestors', async () => {
    const w = makeListy({ height: 100 }, () => 'x');
    await nextTick();
    const target = w.get<HTMLElement>('[data-key="item:number:10"]').element;
    const holder = w.get<HTMLElement>('.apollo-listy').element;
    target.getBoundingClientRect = () => ({
      top: 200,
      bottom: 220,
      height: 20,
      left: 0,
      right: 100,
      width: 100,
      x: 0,
      y: 200,
      toJSON: () => ({}),
    });
    const spy = vi.fn();
    Object.defineProperty(target, 'scrollIntoView', { value: spy, configurable: true });
    w.scrollTo({ key: 10, align: 'top', offset: 5 });
    expect(holder.scrollTop).toBe(195);
    expect(spy).not.toHaveBeenCalled();
    expect(target.style.scrollMarginTop).toBe('');
    expect(target.style.scrollMarginBottom).toBe('');
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
    const rendered = w.findAll<HTMLElement>('.apollo-listy-item');
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
    const holder = w.get<HTMLElement>('.apollo-listy-holder').element;
    Object.defineProperty(holder, 'clientHeight', { value: 100, configurable: true });
    const itemHeight = itemHeightOf();
    for (const node of w.findAll<HTMLElement>('.apollo-listy-item')) {
      const el = node.element;
      Object.defineProperty(el, 'offsetParent', { value: document.body, configurable: true });
      Object.defineProperty(el, 'offsetHeight', { value: itemHeight, configurable: true });
    }
    w.scrollTo({
      key: 25,
      align: 'top',
    });
    await nextTick();
    await nextTick();
    const texts = w.findAll<HTMLElement>('.apollo-listy-item').map((n) => n.text());
    expect(texts).toContain('Item 25');
  });

  it('virtual 虚拟分组：组头行参与扁平化', async () => {
    const w = mount(Listy<GroupItem, string>, {
      props: { items: GROUP_ITEMS, rowKey: 'key', group: GROUP, virtual: true, height: 200 },
      slots: { default: () => 'x' },
    });
    await nextTick();
    await nextTick();
    expect(w.findAll('.apollo-listy-group-header').length).toBeGreaterThan(0);
  });
});
