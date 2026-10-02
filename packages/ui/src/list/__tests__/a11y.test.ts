/**
 * L5 无障碍 —— List 的 role/ARIA 契约与 axe 扫描。
 *
 * ── 判据（antd 6.6.4）────────────────────────────────────────────────────────
 *
 * | 项 | 判据 | 出处 |
 * |---|---|---|
 * | 根 | **`<div>`，不加 `role` / `aria-*`** | `index.tsx:315` |
 * | `-items` | 非 grid 时是**真 `<ul>`**，子项是**真 `<li>`** ⇒ 列表语义由原生元素承担 | `index.tsx:288` |
 * | grid | 是 `<Row>`(div) > div > `Col`(div) > div ⇒ **没有**列表语义 | `index.tsx:280-286` |
 * | `-item-action` | `<ul>` + `<li>`（**嵌套**在 item 的 `<li>` 里） | `Item.tsx:119-131` |
 * | `Item.Meta` 的 `title` | **`<h4>`**（标题语义） | `Item.tsx:68` |
 * | `-empty-text` | 纯 `<div>`，**不加** `role` / `aria-live` | `index.tsx:292` |
 *
 * ⚠️ **为什么这几条必须钉**：List 的语义**完全由原生元素承担**（`ul` / `li` / `h4`）——
 * 组件不该再叠 `role="list"` / `aria-live` 之类（上游没有）。钉住它们才能防止后来者
 * 「顺手加个 role」而改变读屏行为。
 *
 * ⚠️ **本组件的废弃告警**（每次挂载一条 `console.error`）会污染输出 ⇒ 本文件统一 spy 掉。
 * ⚠️ **`axe.run()` 不能与 `vi.useFakeTimers()` 共存**（PITFALLS 268）⇒ 本文件不用假定时器。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { List, ListItem, ListItemMeta } from '../index';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** 跑一次 axe，返回 violations。 */
async function runAxe(): Promise<axe.Result[]> {
  const results = await axe.run(document.body, {
    runOnly: { type: 'tag', values: TAGS },
  });
  return results.violations;
}

const mountA11y = async (
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
): Promise<VueWrapper> => {
  const wrapper = mount(List, { props, slots, attachTo: document.body });
  await nextTick();
  return wrapper;
};

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  document.body.innerHTML = '';
  errorSpy.mockRestore();
});

describe('List · role / ARIA 契约（L5）', () => {
  it('根是 `<div>` 且**不加** `role` / `aria-*`', async () => {
    const w = await mountA11y();
    const root = w.element;
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('role')).toBeNull();
    // ⚠️ `w.element` 是 DOM 元素 ⇒ `attributes` 是 NamedNodeMap **属性**，不是函数
    expect(root.getAttributeNames().filter((n: string) => n.startsWith('aria-'))).toEqual([]);
  });

  it('非 grid：`-items` 是**真 `<ul>`**，子项是**真 `<li>`**', async () => {
    const w = await mountA11y(
      { dataSource: ['A', 'B'], renderItem: (item: string) => h(ListItem, null, () => item) },
      undefined,
    );
    const ul = w.find('ul.apollo-list-items');
    expect(ul.exists()).toBe(true);
    expect(ul.findAll(':scope > li')).toHaveLength(2);
    expect(ul.element.tagName).toBe('UL');
  });

  it('grid：**没有** `<ul>` ⇒ 不声明列表语义（上游同判）', async () => {
    const w = await mountA11y({
      dataSource: ['A'],
      grid: { column: 2 },
      renderItem: (item: string) => h(ListItem, null, () => item),
    });
    expect(w.find('ul.apollo-list-items').exists()).toBe(false);
    expect(w.find('.apollo-row').exists()).toBe(true);
  });

  it('`-item-action` 是**嵌套**的 `<ul>` + `<li>`', async () => {
    const w = await mountA11y(
      {
        dataSource: ['A'],
        renderItem: (item: string) =>
          h(ListItem, { actions: [h('a', 'edit'), h('a', 'more')] }, () => item),
      },
      undefined,
    );
    const actionUl = w.find('ul.apollo-list-item-action');
    expect(actionUl.exists()).toBe(true);
    expect(actionUl.findAll(':scope > li')).toHaveLength(2);
  });

  it('`Item.Meta` 的 `title` 是 `<h4>`（标题语义）', async () => {
    const w = await mountA11y(
      {
        dataSource: ['A'],
        renderItem: () => h(ListItem, null, () => h(ListItemMeta, { title: 'T' })),
      },
      undefined,
    );
    const title = w.find('.apollo-list-item-meta-title');
    expect(title.element.tagName).toBe('H4');
  });

  it('`-empty-text` 是纯 `<div>`，**不加** `role` / `aria-live`', async () => {
    const w = await mountA11y({ dataSource: [] });
    const empty = w.find('.apollo-list-empty-text');
    expect(empty.element.tagName).toBe('DIV');
    expect(empty.attributes('role')).toBeUndefined();
    expect(empty.attributes('aria-live')).toBeUndefined();
  });

  it('🚨 全树**零** `aria-*`（上游一个都不加 —— 语义全由原生元素承担）', async () => {
    const w = await mountA11y(
      {
        header: 'H',
        footer: 'F',
        bordered: true,
        dataSource: ['A'],
        renderItem: (item: string) =>
          h(ListItem, { actions: [h('a', 'edit')] }, () => h(ListItemMeta, { title: item })),
      },
      undefined,
    );
    // ⚠️ **不能断言「全树零 aria-*」** —— 内层 `<Spin>`（依赖组件）自带
    //    `aria-live="polite" aria-busy="false"`。这里只钉 **List 自己产出的元素**。
    const rootEl = w.element as HTMLElement;
    // ⚠️ `Array.from` 的元素类型必须显式给（`w.element` 是 `any` ⇒ 元素退化成 `unknown`）
    const own: HTMLElement[] = [
      rootEl,
      ...Array.from(rootEl.querySelectorAll<HTMLElement>('*')),
    ].filter((el) => Array.from(el.classList).some((c) => c.startsWith('apollo-list')));
    expect(own.length).toBeGreaterThan(3);
    for (const el of own) {
      expect(
        el.getAttributeNames().filter((n: string) => n.startsWith('aria-')),
        `List 自己的元素不应带 aria-*：${el.className}`,
      ).toEqual([]);
    }
  });
});

/** 扫描用例。⚠️ 必须**显式标注类型**（`it.each` 直接推断会得到隐式 any 的返回类型）。 */
interface A11yScanCase {
  name: string;
  props: Record<string, unknown>;
  slots?: Record<string, () => unknown>;
}

const items = (n: number) => Array.from({ length: n }, (_, i) => `item-${i}`);

const SCAN_CASES: A11yScanCase[] = [
  {
    name: 'basic（有数据的字符列表）',
    props: {
      dataSource: items(3),
      renderItem: (item: string) => h(ListItem, null, () => item),
    },
  },
  {
    name: 'meta（Item.Meta 的 h4 + 描述）',
    props: {
      dataSource: items(2),
      renderItem: (item: string) =>
        h(ListItem, null, () => h(ListItemMeta, { title: item, description: 'desc' })),
    },
  },
  {
    name: 'actions（嵌套 ul/li）',
    props: {
      dataSource: items(2),
      renderItem: (item: string) =>
        h(ListItem, { actions: [h('a', { href: '#' }, 'edit')] }, () => item),
    },
  },
  {
    name: 'bordered + header + footer',
    props: {
      bordered: true,
      header: 'Header',
      footer: 'Footer',
      dataSource: items(2),
      renderItem: (item: string) => h(ListItem, null, () => item),
    },
  },
  {
    name: 'vertical + extra',
    props: {
      itemLayout: 'vertical',
      dataSource: items(2),
      renderItem: (item: string) => h(ListItem, { extra: 'E' }, () => item),
    },
  },
  {
    name: 'grid（无列表语义）',
    props: {
      grid: { column: 2, gutter: 16 },
      dataSource: items(3),
      renderItem: (item: string) => h(ListItem, null, () => item),
    },
  },
  {
    name: 'pagination',
    props: {
      pagination: { pageSize: 2 },
      dataSource: items(4),
      renderItem: (item: string) => h(ListItem, null, () => item),
    },
  },
  { name: 'loading', props: { loading: true, dataSource: items(2) } },
  { name: 'empty（默认空态）', props: {} },
];

describe('List · axe 扫描（L5）', () => {
  it.each(SCAN_CASES)('$name 无 axe violation', async ({ props, slots }) => {
    const w = await mountA11y(props, slots);

    const violations = await runAxe();
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.length}`),
      `axe 违规（${w.html().slice(0, 200)}…）`,
    ).toEqual([]);
  });
});
