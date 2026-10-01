/**
 * L5 无障碍 —— Breadcrumb 的 role/ARIA 契约与 axe 扫描。
 *
 * ── 判据（antd 6.6.4）────────────────────────────────────────────────────────
 *
 * | 项 | 判据 | 出处 |
 * |---|---|---|
 * | 根 | **`<nav>`**（原生 landmark ⇒ 读屏能跳转到「导航」），**不加 `role`** | `Breadcrumb.tsx:304` |
 * | 列表 | `<ol>` + `<li>`（原生列表语义；**不是** `role="list"` 模拟） | `Breadcrumb.tsx:310` |
 * | 链接项 | **真 `<a href="#/…">`**（键盘/读屏天然可用） | `useItemRender.tsx:51` |
 * | 非链接项 | `<span>`（**没有** `role` / `tabindex`） | `useItemRender.tsx:58` |
 * | 分隔符 | `<li aria-hidden="true">` —— **组件唯一**的 `aria-*` | `BreadcrumbSeparator.tsx:20` |
 *
 * ⚠️ **为什么这几条必须钉**：Breadcrumb 的语义**完全由原生元素承担**
 * （`nav` / `ol` / `li` / `a`）—— 组件不该再叠 `role="navigation"`、
 * `aria-label`、`aria-current` 之类（上游没有）。钉住它们才能防止后来者
 * 「顺手加个 role」而改变读屏行为。
 *
 * ⚠️ **`aria-hidden="true"` 落在分隔符的 `<li>` 上**意味着读屏**不朗读**分隔符，
 * 而列表项的计数也少一项 —— 这是上游的刻意选择（分隔符是纯视觉装饰），照抄。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Breadcrumb } from '../Breadcrumb';
import { BreadcrumbItem } from '../BreadcrumbItem';
import { BreadcrumbSeparator } from '../BreadcrumbSeparator';
import type { BreadcrumbItemInput } from '../interface';

const P = 'apollo-breadcrumb';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const ITEMS: BreadcrumbItemInput[] = [
  { title: 'Home', href: '#/home' },
  { title: 'List', href: '#/list' },
  { title: 'Detail' },
];

const ROUTES: BreadcrumbItemInput[] = [
  { breadcrumbName: 'Home', path: 'home' },
  { breadcrumbName: 'Detail' },
];

const MENU_ITEMS: BreadcrumbItemInput[] = [
  { title: 'Home', href: '#/home' },
  {
    title: 'Group',
    menu: {
      items: [
        { key: 'a', label: 'A' },
        { key: 'b', title: 'B' },
      ],
    },
  },
];

/** 挂到真实文档（axe 要求元素在文档里）。 */
const mountA11y = async (
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
) => {
  const wrapper = mount(Breadcrumb, { props, slots, attachTo: document.body });
  await nextTick();
  return wrapper;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Breadcrumb · role / ARIA 契约（L5）', () => {
  it('根是 `<nav>` 且**不加 `role`**（原生 landmark 已经够用）', async () => {
    const w = await mountA11y({ items: ITEMS });

    expect(w.element.tagName).toBe('NAV');
    expect(w.attributes('role')).toBeUndefined();
    // 也**没有** aria-label —— 上游不强制给导航起名
    expect(w.attributes('aria-label')).toBeUndefined();
    w.unmount();
  });

  it('列表是原生 `<ol>` + `<li>`（不靠 `role="list"` 模拟）', async () => {
    const w = await mountA11y({ items: ITEMS });

    const ol = w.find('ol');
    expect(ol.exists()).toBe(true);
    expect(ol.attributes('role')).toBeUndefined();
    expect(ol.element.parentElement).toBe(w.element);

    const lis = w.findAll('li');
    // 3 个 item + **2** 个分隔符（最后一项没有分隔符）
    expect(lis).toHaveLength(5);
    for (const li of lis) {
      expect(li.attributes('role')).toBeUndefined();
    }
    w.unmount();
  });

  it('🚨 有 `href` 的项是**真 `<a href>`**；没有的是 `<span>`（都不加 `role`）', async () => {
    const w = await mountA11y({ items: ITEMS });

    const anchors = w.findAll(`a.${P}-link`);
    expect(anchors).toHaveLength(2);
    expect(anchors[0]?.attributes('href')).toBe('#/home');
    expect(anchors[0]?.attributes('role')).toBeUndefined();

    const spans = w.findAll(`span.${P}-link`);
    expect(spans).toHaveLength(1);
    expect(spans[0]?.text()).toBe('Detail');
    expect(spans[0]?.attributes('role')).toBeUndefined();
    expect(spans[0]?.attributes('tabindex')).toBeUndefined();
    w.unmount();
  });

  it('🚨 分隔符是 `<li aria-hidden="true">`（组件**唯一**的 `aria-*`）', async () => {
    const w = await mountA11y({ items: ITEMS });

    const separators = w.findAll(`.${P}-separator`);
    // 3 个 item ⇒ 2 个分隔符（最后一项后面没有）
    expect(separators).toHaveLength(2);
    expect(separators[0]?.element.tagName).toBe('LI');
    expect(separators[0]?.attributes('aria-hidden')).toBe('true');
    w.unmount();
  });

  it('🚨 全树只有分隔符上的那一个 `aria-hidden`，**没有别的 `aria-*`**', async () => {
    const w = await mountA11y({ items: ITEMS });

    const html = w.html();
    const ariaAttrs = html.match(/aria-[a-z-]+/g) ?? [];
    expect(new Set(ariaAttrs)).toEqual(new Set(['aria-hidden']));
    // 每个分隔符恰好一个 ⇒ 与分隔符数量一致
    expect(ariaAttrs).toHaveLength(w.findAll(`.${P}-separator`).length);
    w.unmount();
  });

  it('`menu` 项的外层是 `<span class="-overlay-link">`（Dropdown 的触发元素，不加 `role`）', async () => {
    const w = await mountA11y({ items: MENU_ITEMS });
    await nextTick();

    const overlay = w.find(`.${P}-overlay-link`);
    expect(overlay.exists()).toBe(true);
    expect(overlay.element.tagName).toBe('SPAN');
    expect(overlay.attributes('role')).toBeUndefined();
    w.unmount();
  });

  it('`data-*` / `aria-*` 透传到链接元素上（`pickAttrs` 的白名单）', async () => {
    const w = await mountA11y({
      items: [{ title: 'A', href: '#/a', 'data-testid': 'x', 'aria-label': 'A 项' }],
    });

    const link = w.find(`.${P}-link`);
    expect(link.attributes('data-testid')).toBe('x');
    expect(link.attributes('aria-label')).toBe('A 项');
    w.unmount();
  });
});

describe('Breadcrumb · axe 扫描（真实配置）', () => {
  /**
   * ⚠️ `allow` 里的每一条都必须**可自证**。目前为空 ⇒ 期望「无 violation」。
   */
  const cases: Record<string, { props: Record<string, unknown>; allow?: string[] }> = {
    常规: { props: { items: ITEMS } },
    只有标题: { props: { items: [{ title: 'A' }, { title: 'B' }] } },
    'routes（废弃通道）': { props: { routes: ROUTES } },
    自定义分隔符: { props: { separator: '>', items: ITEMS } },
    'type: separator': {
      props: { items: [{ title: 'A' }, { type: 'separator', separator: '|' }, { title: 'B' }] },
    },
    带参数: { props: { params: { id: '7' }, items: [{ title: 'item-:id', path: 'a/:id' }] } },
    带下拉: { props: { items: MENU_ITEMS } },
    空列表: { props: { items: [] } },
    语义化: {
      props: {
        items: ITEMS,
        classNames: { root: 'r', item: 'i', separator: 's' },
        styles: { root: { background: '#fafafa' } },
      },
    },
  };

  for (const [name, { props, allow = [] }] of Object.entries(cases)) {
    it(`${name}：${allow.length ? `仅豁免 ${allow.join(', ')}` : '无 axe violation'}`, async () => {
      const w = await mountA11y(props);
      const results = await axe.run(w.element as Element, {
        runOnly: { type: 'tag', values: TAGS },
      });
      const violations = results.violations.map((v) => v.id).filter((id) => !allow.includes(id));
      expect(violations).toEqual([]);
      // 豁免项要**真的出现**（否则豁免会变成永久的假绿灯）
      for (const id of allow) {
        expect(results.violations.map((v) => v.id)).toContain(id);
      }
      w.unmount();
    });
  }

  it('`children` 通道（废弃的 `Breadcrumb.Item` / `Separator`）：无 violation', async () => {
    const w = await mountA11y(
      {},
      {
        default: () => [
          h(BreadcrumbItem, null, { default: () => 'A' }),
          h(BreadcrumbSeparator, null, { default: () => '|' }),
          h(BreadcrumbItem, null, { default: () => 'B' }),
        ],
      },
    );
    const results = await axe.run(w.element as Element, {
      runOnly: { type: 'tag', values: TAGS },
    });

    expect(results.violations.map((v) => v.id)).toEqual([]);
    w.unmount();
  });

  it('RTL（ConfigProvider direction）下同样无 violation', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Breadcrumb, { items: ITEMS }) },
      attachTo: document.body,
    });
    await nextTick();

    const results = await axe.run(w.element as Element, {
      runOnly: { type: 'tag', values: TAGS },
    });

    expect(results.violations.map((v) => v.id)).toEqual([]);
    w.unmount();
  });
});
