/**
 * Issue #38 · [Listy] Virtual 分支丢失普通根 attrs
 *
 * `raw` 分支用 `h('div', { ...attrs, … })`，而 `Virtual` 分支只单独转发
 * `class` / `style` / `onScroll` ⇒ `id` / `data-*` / `aria-*` / `tabindex` 在
 * `virtual=true` 时**静默丢失**（Issue #38.1）。
 *
 * ⚠️ 上游（antd 6.6.4 + `@rc-component/listy@1.2.3`）**两个分支都不透传**这些 attrs
 *    —— rc 的 RawList / VirtualList 根节点没展开 `restProps`（SSR 实测：
 *    raw / virtual 的根都只有 `class` + `style`）。本仓 raw 分支的 `...attrs`
 *    已经比上游多透传了一层；本 Issue 的目标是**让本仓两侧自洽**（都透传），
 *    该差异登记在 README §2 / COMPATIBILITY。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Listy } from '../index';

const ITEMS = Array.from({ length: 30 }, (_, i) => ({ key: i, content: `Item ${i}` }));

const ROOT_ATTRS = {
  id: 'the-id',
  'data-testid': 'dt',
  'aria-label': 'al',
  tabindex: '3',
  class: 'user-cls',
  style: { margin: '4px' },
};

const mountListy = (virtual: boolean, extra: Record<string, unknown> = {}) =>
  mount(Listy<(typeof ITEMS)[number]>, {
    props: {
      items: ITEMS,
      rowKey: 'key',
      virtual,
      ...(virtual ? { height: 200 } : {}),
      ...ROOT_ATTRS,
      ...extra,
    },
  });

const rootOf = (virtual: boolean, extra: Record<string, unknown> = {}) => {
  const w = mountListy(virtual, extra);
  const root = w.find('.apollo-listy');
  expect(root.exists()).toBe(true);
  return { w, root };
};

describe('Listy · Issue #38 Virtual 分支的根 attrs 与 Raw 一致', () => {
  it('[A] virtual puts widget identity, ARIA and tabindex on its actual holder', () => {
    const { w, root } = rootOf(true);
    expect(root.attributes('data-testid')).toBe('dt');
    expect(root.attributes('id')).toBeUndefined();
    expect(root.attributes('aria-label')).toBeUndefined();
    expect(root.attributes('tabindex')).toBeUndefined();
    expect(w.get('.apollo-listy-holder').attributes('id')).toBe('the-id');
    expect(w.get('.apollo-listy-holder').attributes('aria-label')).toBe('al');
    expect(w.get('.apollo-listy-holder').attributes('tabindex')).toBe('3');
    w.unmount();
  });

  it('[B] raw and virtual expose the same native widget attributes at the actual holder', () => {
    const raw = rootOf(false);
    const virt = rootOf(true);
    expect(virt.root.attributes('data-testid')).toBe(raw.root.attributes('data-testid'));
    for (const key of ['id', 'aria-label']) {
      expect(virt.w.get('.apollo-listy-holder').attributes(key)).toBe(raw.root.attributes(key));
    }
    expect(virt.w.get('.apollo-listy-holder').attributes('tabindex')).toBe(
      raw.root.attributes('tabindex'),
    );
    raw.w.unmount();
    virt.w.unmount();
  });

  it('[C] class 合并：调用方 class 与内部类名共存（两侧一致）', () => {
    const raw = rootOf(false);
    const virt = rootOf(true);
    for (const { root } of [raw, virt]) {
      expect(root.classes()).toContain('apollo-listy');
      expect(root.classes()).toContain('user-cls');
    }
    raw.w.unmount();
    virt.w.unmount();
  });

  it('[D] style 合并：调用方 style 生效，且 virtual 的 position:relative 不被顶掉', () => {
    const raw = rootOf(false);
    expect(raw.w.get<HTMLElement>('.apollo-listy').element.style.margin).toBe('4px');
    raw.w.unmount();

    const virt = rootOf(true);
    const el = virt.w.get<HTMLElement>('.apollo-listy').element;
    expect(el.style.margin).toBe('4px');
    // VirtualList 的根自带 position:relative（展开顺序：attrs 在前、内部在后）
    expect(el.style.position).toBe('relative');
    virt.w.unmount();
  });

  it('[E] 守卫：内部 `dir` 优先于同名 attrs（方向只来自 ConfigProvider）', () => {
    const { w, root } = rootOf(true, { dir: 'rtl' });
    expect(root.attributes('dir')).toBe('ltr');
    w.unmount();
  });

  it('[F] 守卫：滚动事件只回调一次（attrs 透传不引入双调）', async () => {
    // ⚠️ virtual 分支的滚动源是 `-holder`（VirtualList 把 onScroll 挂在 holder 上；
    //    raw 分支的根自己就是滚动容器）。上游同构（rc-virtual-list 亦然）。
    const onScroll = vi.fn();
    const { w } = rootOf(true, { onScroll });
    await nextTick();
    await w.find('.apollo-listy-holder').trigger('scroll');
    expect(onScroll).toHaveBeenCalledTimes(1);
    w.unmount();
  });
});
