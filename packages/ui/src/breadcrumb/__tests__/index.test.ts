/**
 * Breadcrumb · L1/L2（jsdom）。
 *
 * ── 为什么这里能钉住大部分契约 ────────────────────────────────────────────────
 *
 * jsdom **没有布局**（`getBoundingClientRect` 全 0）—— 但 Breadcrumb 的可见形态
 * 几乎全在**结构**上（`<nav>` / `<ol>` / `li` / `<a>` / `<span>` 的层序与类名），
 * 所以 L1 能钉住绝大部分行为契约。像素归 **L6**。
 *
 * 上游测试 667 行 / 5 个文件（`Breadcrumb.test.tsx` 462 + `router.test.tsx` 115 +
 * `semantic.test.tsx` 57 + `itemRender.test.tsx` 30 + `demo-semantic.test.tsx` 3）。
 * 本文件钉**最容易写错的那批**：分隔符的存在性（最后一项不渲染）、
 * `items` / `routes` / `children` 三条通道、`path` 累加、`:param` 替换、
 * `itemRender` 的实参个数、语义化三槽、`-rtl` 的位置、`expose` 的形状。
 *
 * ⚠️ **`BreadcrumbSeparator` 的 `prefixCls` 取自 `ConfigContext`**（不接 prop）——
 * 默认前缀是 `apollo`，所以多数用例不用包 `ConfigProvider`；
 * 但**需要 RTL 的用例必须包**（`direction` 只能从 context 来，PITFALLS 272 同族）。
 */

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Breadcrumb } from '../Breadcrumb';
import { BreadcrumbItem } from '../BreadcrumbItem';
import { BreadcrumbSeparator } from '../BreadcrumbSeparator';
import type { BreadcrumbItemInput } from '../interface';

const P = 'apollo-breadcrumb';

const mountBreadcrumb = (
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
) => mount(Breadcrumb, { props, slots, attachTo: document.body });

/** 取所有 `li` 的类名列表（断言「顺序 + 谁被渲染」最直观）。 */
const liClasses = (w: ReturnType<typeof mountBreadcrumb>): string[] =>
  w.findAll('li').map((n) => n.classes().join(' '));

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('Breadcrumb · 结构与分隔符', () => {
  it('根是 `<nav class="apollo-breadcrumb …">` + 唯一子元素 `<ol>`', () => {
    const w = mountBreadcrumb({ items: [{ title: 'A' }] });

    expect(w.element.tagName).toBe('NAV');
    expect(w.find(`.${P}`).exists()).toBe(true);
    expect(w.findAll('ol')).toHaveLength(1);
    expect(w.find('ol').element.parentElement).toBe(w.element);
    w.unmount();
  });

  it('🚨 **最后一项不渲染分隔符 `<li>`**（`separator=""` ⇒ `isRenderable` 为假）', () => {
    const w = mountBreadcrumb({ items: [{ title: 'A' }, { title: 'B' }] });

    // A 的 li + A 的分隔符 li + B 的 li = 3（B 后面**没有**分隔符）
    expect(w.findAll('li')).toHaveLength(3);
    expect(liClasses(w)).toEqual([`${P}-item`, `${P}-separator`, `${P}-item`]);
    expect(w.findAll(`.${P}-separator`)).toHaveLength(1);
    w.unmount();
  });

  it('分隔符默认是 `/`，且 `aria-hidden` 是字符串 `"true"`', () => {
    const w = mountBreadcrumb({ items: [{ title: 'A' }, { title: 'B' }] });

    const sep = w.find(`.${P}-separator`);
    expect(sep.text()).toBe('/');
    expect(sep.attributes('aria-hidden')).toBe('true');
    w.unmount();
  });

  it('`separator` prop 覆盖默认值（三级兜底的第一级）', () => {
    const w = mountBreadcrumb({ separator: '>', items: [{ title: 'A' }, { title: 'B' }] });

    expect(w.find(`.${P}-separator`).text()).toBe('>');
    w.unmount();
  });

  it('`items` 里的 `type: "separator"` 渲染成独立分隔符（不走 item 分支）', () => {
    const items: BreadcrumbItemInput[] = [
      { title: 'A' },
      { type: 'separator', separator: '|' },
      { title: 'B' },
    ];
    const w = mountBreadcrumb({ items });

    expect(liClasses(w)).toEqual([`${P}-item`, `${P}-separator`, `${P}-separator`, `${P}-item`]);
    // 顺序：A 的**注入**分隔符（`/`）→ `type:'separator'` 的显式分隔符（`|`）
    expect(w.findAll(`.${P}-separator`).map((n) => n.text())).toEqual(['/', '|']);
    w.unmount();
  });
});

describe('Breadcrumb · 三条数据通道', () => {
  it('`items` 优先于 `routes`', () => {
    const w = mountBreadcrumb({
      items: [{ title: 'from-items' }],
      routes: [{ title: 'from-routes' }],
    });

    expect(w.text()).toContain('from-items');
    expect(w.text()).not.toContain('from-routes');
    w.unmount();
  });

  it('`routes` 的 `breadcrumbName` → `title`（父级 `title` 赢、子级 `breadcrumbName` 赢）', () => {
    const w = mountBreadcrumb({
      routes: [
        // 父级：`title` 在 `...rest` **之后** ⇒ 传了 title 就以 title 为准
        { breadcrumbName: 'ignored', title: 'parent-title' },
        // 子级：`title` 在 `...itemProps` **之前** ⇒ 传了 breadcrumbName 就以它为准
        {
          breadcrumbName: 'child',
          children: [{ breadcrumbName: 'child-name', title: 'ignored-child-title' }],
        },
      ],
    });

    expect(w.text()).toContain('parent-title');
    expect(w.text()).not.toContain('ignored');
    expect(w.findAll(`.${P}-item`)).toHaveLength(2);
    w.unmount();
  });

  it('`children` 通道：接受 `BreadcrumbItem`，并注入 `separator`（最后一项是 `""`）', () => {
    const w = mountBreadcrumb(
      {},
      {
        default: () => [
          h(BreadcrumbItem, null, { default: () => 'A' }),
          h(BreadcrumbItem, null, { default: () => 'B' }),
        ],
      },
    );

    expect(liClasses(w)).toEqual([`${P}-item`, `${P}-separator`, `${P}-item`]);
    w.unmount();
  });

  it('`children` 通道：`BreadcrumbSeparator` 直接作为子项也能渲染', () => {
    const w = mountBreadcrumb(
      {},
      {
        default: () => [
          h(BreadcrumbItem, null, { default: () => 'A' }),
          h(BreadcrumbSeparator, null, { default: () => '|' }),
          h(BreadcrumbItem, null, { default: () => 'B' }),
        ],
      },
    );

    // A 的注入分隔符（`/`）→ 显式 Separator（`|`）→ B 是最后一项（无分隔符）
    expect(w.findAll(`.${P}-separator`).map((n) => n.text())).toEqual(['/', '|']);
    w.unmount();
  });

  it('`children` 里的非 `Item` / `Separator` 会发 usage 告警', async () => {
    // ⚠️ rc-util 的 `warning()` 走 **`console.error`**（不是 `console.warn`）——
    //    本仓的 `useDevWarning` 在它之上只加组件名前缀，不改通道。
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = mountBreadcrumb({}, { default: () => [h('div', null, 'nope')] });
    await nextTick();

    const text = error.mock.calls.flat().join(' ');
    expect(text).toContain('Only accepts Breadcrumb.Item and Breadcrumb.Separator');
    error.mockRestore();
    w.unmount();
  });
});

describe('Breadcrumb · path / params / href', () => {
  it('`path` 逐级累加 ⇒ 第 n 项是 `#/<前 n 个 path 拼起来>`', () => {
    const w = mountBreadcrumb({
      items: [
        { title: 'A', path: 'a' },
        { title: 'B', path: 'b' },
      ],
    });

    const links = w.findAll(`a.${P}-link`);
    expect(links).toHaveLength(2);
    expect(links[0]?.attributes('href')).toBe('#/a');
    // ⚠️ 累加：第 2 项是 `#/a/b`（不是 `#/b`）
    expect(links[1]?.attributes('href')).toBe('#/a/b');
    w.unmount();
  });

  it('`params` 把 `path` 里的 `:id` 替换成实际值（`getPath`）', () => {
    const w = mountBreadcrumb({
      params: { id: '7' },
      items: [{ title: 'A', path: 'a/:id' }],
    });

    expect(w.find(`a.${P}-link`).attributes('href')).toBe('#/a/7');
    w.unmount();
  });

  it('`title` 里的 `:param` 也会被替换', () => {
    const w = mountBreadcrumb({
      params: { id: '7' },
      items: [{ title: 'item-:id' }],
    });

    expect(w.find(`.${P}-link`).text()).toBe('item-7');
    w.unmount();
  });

  it('`path` 开头的 `/` 被剥掉（`replace(/^\\//, "")`）', () => {
    const w = mountBreadcrumb({ items: [{ title: 'A', path: '/a' }] });

    expect(w.find(`a.${P}-link`).attributes('href')).toBe('#/a');
    w.unmount();
  });

  it('没有 `path` 时用 item 自己的 `href`', () => {
    const w = mountBreadcrumb({ items: [{ title: 'A', href: 'https://x.dev' }] });

    expect(w.find(`a.${P}-link`).attributes('href')).toBe('https://x.dev');
    w.unmount();
  });

  it('既没有 `href` 也没有 `path` ⇒ 渲染 `<span class="…-link">`（不是 `<a>`）', () => {
    const w = mountBreadcrumb({ items: [{ title: 'A' }] });

    expect(w.find(`a.${P}-link`).exists()).toBe(false);
    expect(w.find(`span.${P}-link`).exists()).toBe(true);
    w.unmount();
  });
});

describe('Breadcrumb · itemRender / 语义化 / rtl / expose', () => {
  it('🚨 自定义 `itemRender` **只收 4 个实参**（没有 `href`）', () => {
    const itemRender = vi.fn(() => 'X');
    const w = mountBreadcrumb({
      items: [{ title: 'A', path: 'a' }],
      itemRender,
    });

    expect(itemRender).toHaveBeenCalledTimes(1);
    expect(itemRender.mock.calls[0]).toHaveLength(4);
    // ⚠️ 自定义渲染**不走** `renderItem` ⇒ 没有 `-link` 元素，内容直接进 `<li>`
    expect(w.find(`.${P}-item`).text()).toBe('X');
    expect(w.find(`.${P}-link`).exists()).toBe(false);
    w.unmount();
  });

  it('语义化三槽落到 root / item / separator', () => {
    const w = mountBreadcrumb({
      items: [{ title: 'A' }, { title: 'B' }],
      classNames: { root: 'r', item: 'i', separator: 's' },
      styles: { root: { color: 'red' }, item: { opacity: '0.5' }, separator: { color: 'blue' } },
    });

    expect(w.find(`.${P}`).classes()).toContain('r');
    expect(w.find(`.${P}-item`).classes()).toContain('i');
    expect(w.find(`.${P}-separator`).classes()).toContain('s');
    expect(w.find(`.${P}-item`).attributes('style')).toContain('opacity');
    expect(w.find(`.${P}-separator`).attributes('style')).toContain('blue');
    w.unmount();
  });

  it('`classNames` 支持**函数形态**（`info.props.separator` 是**解析后**的值）', () => {
    const w = mountBreadcrumb({
      separator: '>',
      items: [{ title: 'A' }],
      classNames: (info: { props: { separator?: unknown } }) => ({
        root: `sep-${String(info.props.separator)}`,
      }),
    });

    expect(w.find(`.${P}`).classes()).toContain('sep->');
    w.unmount();
  });

  it('🚨 `-rtl` 落在根 `<nav>` 上（不在 `ol` / `li` 上）', () => {
    const w = mount(
      {
        render: () =>
          h(
            ConfigProvider,
            { direction: 'rtl' },
            { default: () => h(Breadcrumb, { items: [{ title: 'A' }] }) },
          ),
      },
      { attachTo: document.body },
    );

    const nav = w.find(`nav.${P}`);
    expect(nav.classes()).toContain(`${P}-rtl`);
    expect(w.find(`ol.${P}-rtl`).exists()).toBe(false);
    w.unmount();
  });

  it('`expose` 出的是 `{ nativeElement }`（**不是**元素本身）', () => {
    const w = mountBreadcrumb({ items: [{ title: 'A' }] });

    const vm = w.vm as unknown as { nativeElement: HTMLElement | null };
    expect(vm.nativeElement).toBe(w.element);
    w.unmount();
  });

  it('`title` 为空串的项**整项不渲染**（`isRenderable` 在 `renderItem` 里拦下）', () => {
    const w = mountBreadcrumb({ items: [{ title: '' }, { title: 'B' }] });

    expect(w.findAll(`.${P}-item`)).toHaveLength(1);
    expect(w.text()).toContain('B');
    w.unmount();
  });
});
