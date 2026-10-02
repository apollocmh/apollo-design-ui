/**
 * L5 无障碍 —— Card 的 role/ARIA 契约与 axe 扫描。
 *
 * ── 判据（antd 6.6.4）────────────────────────────────────────────────────────
 *
 * | 项 | 判据 | 出处 |
 * |---|---|---|
 * | 根 | **`<div>`，不加 `role` / `aria-*`** | `Card.tsx:306` |
 * | head / cover / body | 纯 `<div>`（无 role） | `Card.tsx:235/254/265` |
 * | actions | **原生 `<ul>` + `<li>`**（不是 `role="list"` 模拟） | `Card.tsx:95-106` |
 * | `Card.Meta` | 纯 `<div>`（avatar 与 section 都是 div） | `CardMeta.tsx:125` |
 * | `Card.Grid` | 纯 `<div>`（无 role） | `CardGrid.tsx:31` |
 *
 * ⚠️ **为什么这几条必须钉**：Card 的语义**完全由原生元素承担**（`div` / `ul` / `li`）——
 * 组件不该再叠 `role="region"`、`aria-label`、`aria-labelledby` 之类（上游没有）。
 * 钉住它们才能防止后来者「顺手加个 role」而改变读屏行为。
 *
 * ⚠️ **唯一的 `aria-*` 来自子组件**：`tabs` 变体的 `role="tablist"` / `aria-selected`
 * 与 `loading` 变体的 Skeleton 结构 —— 那是 Tabs / Skeleton 自己的契约（各有过 L5），
 * 不是 Card 加的。所以本文件对「全树 aria-*」的断言**只在不含子组件时**成立。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Card, CardGrid, CardMeta } from '../index';

const P = 'apollo-card';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** 挂到真实文档（axe 要求元素在文档里）。 */
const mountA11y = async (
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
) => {
  const wrapper = mount(Card, { props, slots, attachTo: document.body });
  await nextTick();
  return wrapper;
};

/** 跑一次 axe，返回 violations（只保留 WCAG A/AA 标签的）。 */
async function runAxe(): Promise<axe.Result[]> {
  const results = await axe.run(document.body, {
    runOnly: { type: 'tag', values: TAGS },
  });
  return results.violations;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Card · role / ARIA 契约（L5）', () => {
  it('根是 `<div>` 且**不加 `role` / `aria-*`**', async () => {
    const w = await mountA11y({ title: 'T' }, { default: () => [h('p', 'x')] });

    expect(w.element.tagName).toBe('DIV');
    expect(w.attributes('role')).toBeUndefined();
    expect(w.attributes('aria-label')).toBeUndefined();
    expect(w.attributes('aria-labelledby')).toBeUndefined();
    w.unmount();
  });

  it('head / head-title / extra / cover / body 都是**纯 `<div>`**（无 role）', async () => {
    const w = await mountA11y(
      { title: 'T', extra: 'E', cover: h('div') },
      { default: () => [h('p', 'x')] },
    );

    for (const cls of ['head', 'head-title', 'extra', 'cover', 'body']) {
      const node = w.find(`.${P}-${cls}`);
      expect(node.exists()).toBe(true);
      expect(node.element.tagName).toBe('DIV');
      expect(node.attributes('role')).toBeUndefined();
    }
    w.unmount();
  });

  it('🚨 `actions` 是**原生 `<ul>` + `<li>`**（不靠 `role="list"` 模拟）', async () => {
    const w = await mountA11y({ actions: [h('span', null, 'A'), h('span', null, 'B')] });

    const ul = w.find(`ul.${P}-actions`);
    expect(ul.exists()).toBe(true);
    expect(ul.attributes('role')).toBeUndefined();

    const lis = w.findAll(`.${P}-actions > li`);
    expect(lis).toHaveLength(2);
    for (const li of lis) {
      expect(li.element.tagName).toBe('LI');
      expect(li.attributes('role')).toBeUndefined();
    }
    w.unmount();
  });

  it('🚨 不含子组件时**全树没有任何 `aria-*`**（唯一的 aria 来自 Tabs / Skeleton）', async () => {
    const w = await mountA11y(
      { title: 'T', extra: 'E', actions: [h('span', null, 'A')], cover: h('div') },
      { default: () => [h('p', 'x')] },
    );

    const ariaAttrs = w.html().match(/aria-[a-z-]+/g) ?? [];
    expect(ariaAttrs).toEqual([]);
    w.unmount();
  });

  it('`Card.Meta` / `Card.Grid` 也都是**纯 `<div>`**（无 role）', async () => {
    const meta = mount(CardMeta, {
      props: { avatar: h('div'), title: 'MT', description: 'MD' },
      attachTo: document.body,
    });
    expect(meta.element.tagName).toBe('DIV');
    expect(meta.attributes('role')).toBeUndefined();
    expect(meta.find(`.${P}-meta-section`).attributes('role')).toBeUndefined();
    expect(meta.find(`.${P}-meta-avatar`).attributes('role')).toBeUndefined();
    meta.unmount();

    const grid = mount(CardGrid, { attachTo: document.body });
    expect(grid.element.tagName).toBe('DIV');
    expect(grid.attributes('role')).toBeUndefined();
    grid.unmount();
  });

  it('Card 自己**不引入任何可聚焦元素**（纯文本卡片没有 tabbable）', async () => {
    const w = await mountA11y({ title: 'T' }, { default: () => [h('p', 'x')] });

    expect(w.findAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0);
    w.unmount();
  });
});

describe('Card · axe 扫描（L5）', () => {
  /**
   * 一个扫描用例。
   *
   * ⚠️ 用**对象数组**而不是 `it.each` 的元组数组：元组数组里各元素的**长度不一致**
   *    （有的带 `slots`、有的不带）⇒ `it.each` 的推断退化成「元组的联合」，
   *    回调签名对不上（实测 TS2345）。对象数组的每个元素同形，推断是干净的。
   */
  interface A11yCase {
    name: string;
    props: Record<string, unknown>;
    slots?: Record<string, () => unknown>;
    /** 用 `CardGrid` 子元素（`-contain-grid` 的扫描面）。 */
    grid?: boolean;
    /** 用 `CardMeta` 子元素（meta 的扫描面）。 */
    meta?: boolean;
  }

  const CASES: A11yCase[] = [
    { name: 'basic', props: { title: 'Card title', extra: h('a', { href: '#more' }, 'More') } },
    { name: 'body-only', props: {}, slots: { default: () => [h('p', 'Card content')] } },
    {
      name: 'actions',
      props: { title: 'T', actions: [h('span', null, 'A'), h('span', null, 'B')] },
    },
    { name: 'loading', props: { title: 'T', loading: true } },
    { name: 'grid', props: { title: 'T' }, grid: true },
    { name: 'meta', props: {}, meta: true },
    {
      name: 'tabs',
      props: {
        title: 'T',
        tabList: [
          { key: 'a', tab: 'TabA' },
          { key: 'b', label: 'TabB' },
        ],
      },
    },
    { name: 'semantic', props: { title: 'T', classNames: { root: 'x-root', header: 'x-header' } } },
  ];

  it.each(CASES)('$name 无 axe violation', async (testCase) => {
    const slots: Record<string, () => unknown> = testCase.grid
      ? { default: () => [h(CardGrid, null, { default: () => 'g' })] }
      : testCase.meta
        ? {
            default: () => [
              h(CardMeta, {
                avatar: h('div'),
                title: 'Card title',
                description: 'This is the description',
              }),
            ],
          }
        : (testCase.slots ?? {});

    const w = mount(Card, { props: testCase.props, slots, attachTo: document.body });
    await nextTick();

    const violations = await runAxe();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    w.unmount();
  });

  it('RTL 下也无 axe violation（`direction: rtl` 不影响可访问名）', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: {
        default: () =>
          h(
            Card,
            { title: 'Card title', extra: h('a', { href: '#more' }, 'More') },
            {
              default: () => [h('p', 'Card content')],
            },
          ),
      },
      attachTo: document.body,
    });
    await nextTick();

    const violations = await runAxe();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    w.unmount();
  });
});
