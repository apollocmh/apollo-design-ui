/**
 * L5 无障碍 —— Masonry 的 role/ARIA 契约与 axe 扫描。
 *
 * ── 判据（antd 6.6.4）────────────────────────────────────────────────────────
 *
 * | 项 | 判据 | 出处 |
 * |---|---|---|
 * | 根 | `div`，**没有 `role`**（纯布局容器） | `Masonry.tsx:237-253` 的 div 只挂 class/style/ref |
 * | 条目 | `div`，**没有 `role`** | `MasonryItem.tsx:36` |
 * | 键盘 | **没有** `tabIndex` —— 本组件不接收焦点，导航全靠条目内部自己的元素 | 同上 |
 *
 * ⚠️ **为什么这几条必须钉**：Masonry 是**纯布局**组件 —— 它不该给容器加任何
 * 语义角色（加了反而会把内部的真实内容藏进一个错误的 role 里）。
 * 上游零 ARIA 是**有意**的，不是遗漏；把它钉住才能防止后来者「顺手加个 role="list"」。
 *
 * ── 与浮层组件不同的一点 ─────────────────────────────────────────────────────
 *
 * 本组件**没有浮层**，所以不存在「SSR 下浮层不渲染」的问题：jsdom 挂载后
 * `onMounted` 会填上 `mergedItems`，条目**真的在 DOM 里** ⇒ axe 扫的是完整结构 ✓
 * （L4 的 SSR 契约里条目为空，那是上游行为，见 `semantic.test.ts` 的说明）。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import Masonry from '../Masonry.vue';

const P = 'apollo-masonry';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const HEIGHTS = [150, 30, 90, 70, 110];

const buildItems = (heights = HEIGHTS) =>
  heights.map((height, index) => ({ key: `item-${index}`, data: height }));

const Bamboo = defineComponent({
  name: 'Bamboo',
  props: { height: { type: Number, required: true } },
  setup(props) {
    return () =>
      h('div', { class: 'bamboo', style: { height: `${props.height}px` } }, String(props.height));
  },
});

/**
 * 挂到真实文档（axe 与 `.focus()` 都要求元素在文档里）。
 *
 * 🚨 **这里不能用 `vi.useFakeTimers()`** —— `axe.run()` 内部靠 `setTimeout`/rAF 推进，
 * 定时器被 mock 之后它**永不完成**，下一次 `axe.run()` 会抛
 * 「Axe is already running. Use `await axe.run()` to wait for the previous run」。
 * 本文件只 `await nextTick()`：条目由 `mergedItems` 驱动渲染（**不依赖** raf 去抖的量测），
 * 所以两拍之后结构就齐了 ✓
 * （2026-10-01 实测：带假定时器时 11 条 axe 用例全红，去掉即绿。）
 */
const mountA11y = async (props: Record<string, unknown> = {}) => {
  const wrapper = mount(Masonry, {
    props: {
      items: buildItems(),
      itemRender: ({ data }: { data: unknown }) => h(Bamboo, { height: Number(data) }),
      ...props,
    },
    attachTo: document.body,
  });
  // 跑完「一拍延迟」：`onMounted` 里赋值 `mergedItems` ⇒ 下一拍重渲染出条目
  await nextTick();
  await nextTick();
  return wrapper;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Masonry · role / ARIA 契约（L5）', () => {
  it('根是 `div` 且**没有 `role`**（纯布局容器，上游零 ARIA）', async () => {
    const w = await mountA11y();
    const root = w.find(`.${P}`);

    expect(root.element.tagName).toBe('DIV');
    expect(root.attributes('role')).toBeUndefined();
    w.unmount();
  });

  it('条目是 `div` 且**没有 `role`**，也不接收焦点（无 `tabindex`）', async () => {
    const w = await mountA11y();
    const items = w.findAll(`.${P}-item`);

    expect(items).toHaveLength(HEIGHTS.length);
    for (const item of items) {
      expect(item.element.tagName).toBe('DIV');
      expect(item.attributes('role')).toBeUndefined();
      expect(item.attributes('tabindex')).toBeUndefined();
    }
    w.unmount();
  });

  it('组件自身不产生任何 `aria-*`（语义完全由 `itemRender` 的内容负责）', async () => {
    const w = await mountA11y();
    const html = w.html();

    // 容器与条目上都不该出现 aria-* —— 一旦出现就是「顺手加的语义」
    const containerAria = [...w.findAll(`.${P}, .${P}-item`)].flatMap((node) =>
      Object.keys(node.attributes()).filter((name) => name.startsWith('aria-')),
    );
    expect(containerAria).toEqual([]);
    expect(html).not.toContain('aria-');
    w.unmount();
  });

  it('`rtl` 只加类名，不引入 `dir` 之外的可访问性语义', async () => {
    const w = await mountA11y({ prefixCls: 'apollo-masonry', style: { width: '400px' } });
    // 这里只断言「加了 rtl 类之后仍然没有 role / aria-*」——具体 rtl 类由 L2 钉
    expect(w.find(`.${P}`).attributes('role')).toBeUndefined();
    w.unmount();
  });
});

describe('Masonry · axe 扫描（真实配置）', () => {
  /**
   * ⚠️ `allow` 里的每一条都必须**可自证**（做法与 tabs / date-picker 相同）。
   * 目前为空 ⇒ 期望「无 violation」。
   */
  const cases: Record<string, { props: Record<string, unknown>; allow?: string[] }> = {
    常规: { props: {} },
    单列: { props: { columns: 1 } },
    四列: { props: { columns: 4 } },
    响应式列数: { props: { columns: { xs: 1, sm: 2, md: 3 } } },
    数字间距: { props: { gutter: 16 } },
    数组间距: { props: { gutter: [8, 16] } },
    响应式间距: { props: { gutter: { sm: 8, md: 16 } } },
    新鲜模式: { props: { fresh: true } },
    空列表: { props: { items: [] } },
    自定义语义类名: { props: { classNames: { root: 'r', item: 'i' } } },
    自定义语义样式: { props: { styles: { root: { border: '1px solid red' } } } },
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
});
