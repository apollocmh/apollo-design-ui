/**
 * L5 无障碍 —— Anchor 的 role/ARIA 契约与 axe 扫描。
 *
 * ── 判据（antd 6.6.4）────────────────────────────────────────────────────────
 *
 * | 项 | 判据 | 出处 |
 * |---|---|---|
 * | 根 wrapper | `div`，**没有 `role`**（纯布局容器） | `Anchor.tsx:393` |
 * | 内层 `.{p}` | `div`，**没有 `role`** | 同上 `:394` |
 * | 链接 | **真 `<a href="#…">`**（原生锚点 —— 键盘/读屏天然可用） | `AnchorLink.tsx:113` |
 * | ink | `span`，**没有 `aria-*`**（纯装饰，且内容为空） | `Anchor.tsx:395` |
 *
 * ⚠️ **为什么这几条必须钉**：Anchor 的语义完全由**原生 `<a href>`** 承担 ——
 * 组件不该再叠 `role="navigation"` / `aria-current` 之类（上游没有）。
 * 把它钉住才能防止后来者「顺手加个 role」而改变读屏行为。
 *
 * ── 与浮层组件不同的一点 ─────────────────────────────────────────────────────
 *
 * 本组件**没有浮层** ⇒ 不存在「SSR 下浮层不渲染」的问题。
 * ⚠️ 但**当前锚点相关的一切**（`-link-active` / `-ink-visible` / `aria-current` 之类）
 * 都来自**滚动侦测**，jsdom 里要靠 mock rect + 手动派发 `scroll` 才会出现
 * ⇒ 本文件只扫「初始/静态」形态；**带 active 的形态**由 L6 真浏览器覆盖。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Anchor } from '../Anchor';
import type { AnchorLinkItemProps } from '../interface';

const P = 'apollo-anchor';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const ITEMS: AnchorLinkItemProps[] = [
  { key: 'a', href: '#section-a', title: 'Section A' },
  { key: 'b', href: '#section-b', title: 'Section B' },
  { key: 'c', href: '#section-c', title: 'Section C' },
];

const NESTED: AnchorLinkItemProps[] = [
  {
    key: 'a',
    href: '#section-a',
    title: 'Section A',
    children: [{ key: 'a1', href: '#section-a1', title: 'Section A1' }],
  },
];

/** 挂到真实文档（axe 要求元素在文档里）。 */
const mountA11y = async (props: Record<string, unknown> = {}) => {
  const wrapper = mount(Anchor, {
    props: { items: ITEMS, affix: false, ...props },
    attachTo: document.body,
  });
  await nextTick();
  return wrapper;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Anchor · role / ARIA 契约（L5）', () => {
  it('根 wrapper 与内层 `.{p}` 都是 `div` 且**没有 `role`**（纯布局容器）', async () => {
    const w = await mountA11y();
    const wrapper = w.find(`.${P}-wrapper`);
    const inner = w.find(`.${P}`);

    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.attributes('role')).toBeUndefined();
    expect(inner.element.tagName).toBe('DIV');
    expect(inner.attributes('role')).toBeUndefined();
    w.unmount();
  });

  it('🚨 链接是**真 `<a href>`**（键盘/读屏天然可用，不靠 role 模拟）', async () => {
    const w = await mountA11y();
    const anchors = w.findAll(`.${P}-link-title`);

    expect(anchors).toHaveLength(ITEMS.length);
    for (const [index, anchor] of anchors.entries()) {
      expect(anchor.element.tagName).toBe('A');
      expect(anchor.attributes('href')).toBe(ITEMS[index]?.href);
      // 上游不加 role —— `<a href>` 本身就是 link
      expect(anchor.attributes('role')).toBeUndefined();
    }
    w.unmount();
  });

  it('ink 是 `span` 且**没有 `aria-*`**（纯装饰，内容为空）', async () => {
    const w = await mountA11y();
    const ink = w.find(`.${P}-ink`);

    expect(ink.element.tagName).toBe('SPAN');
    expect(Object.keys(ink.attributes()).filter((n) => n.startsWith('aria-'))).toEqual([]);
    expect(ink.text()).toBe('');
    w.unmount();
  });

  it('🚨 组件不产生**任何** `aria-*`（语义完全交给原生 `<a>`）', async () => {
    const w = await mountA11y();

    expect(w.html()).not.toContain('aria-');
    w.unmount();
  });

  it('`title` 属性只在 title 是**字符串**时出现（vnode 当不了 tooltip）', async () => {
    const w = await mountA11y({
      items: [
        { key: 'a', href: '#section-a', title: 'Text' },
        { key: 'b', href: '#section-b', title: h('span', null, 'VNode') },
      ],
    });
    const anchors = w.findAll(`.${P}-link-title`);

    expect(anchors[0]?.attributes('title')).toBe('Text');
    expect(anchors[1]?.attributes('title')).toBeUndefined();
    w.unmount();
  });
});

describe('Anchor · axe 扫描（真实配置）', () => {
  /**
   * ⚠️ `allow` 里的每一条都必须**可自证**。目前为空 ⇒ 期望「无 violation」。
   */
  const cases: Record<string, { props: Record<string, unknown>; allow?: string[] }> = {
    常规: { props: {} },
    默认固钉: { props: { affix: true } },
    '显示 ink': { props: { affix: false, showInkInFixed: true } },
    水平: { props: { direction: 'horizontal' } },
    嵌套: { props: { items: NESTED } },
    空列表: { props: { items: [] } },
    带偏移: { props: { offsetTop: 80, targetOffset: 60, bounds: 20 } },
    语义化: {
      props: {
        classNames: { root: 'r', item: 'i', itemTitle: 'it', indicator: 'ind' },
        styles: { root: { background: '#fafafa' } },
      },
    },
    '废弃 children': {
      props: { items: undefined },
      allow: [],
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

  it('RTL（ConfigProvider direction）下同样无 violation', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Anchor, { items: ITEMS, affix: false }) },
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
