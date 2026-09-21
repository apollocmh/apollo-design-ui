/**
 * L5 · 无障碍测试
 *
 * ── Skeleton 的 a11y 面很特殊：**上游什么都没做** ─────────────────────────────
 *
 * 实测 antd 6.6.4 的 `es/skeleton/{Skeleton,Element,Image,Node}.js`：
 * **`aria-*` 与 `role` 的出现次数是 0**（`grep -c "aria\|role=" ` 全为 0）。
 * 骨架屏既没有 `aria-busy`、也没有 `aria-hidden`、也没有 `role="status"`。
 *
 * ⇒ 本文件的大部分断言是**「确认我们也没有凭空加」** —— 因为 L4 的 DOM 契约是与
 *    antd 的机械基线**逐字比对**，单方面加属性会让契约红。这与 Button 的
 *    `loading` 不设 `aria-busy` 是同一条纪律（见 `button/__tests__/a11y.test.ts`）。
 *
 * ── ⚠️ 一处**我们比上游更严格**的地方（已登记，不是疏忽）────────────────────────
 *
 * `Skeleton.Image` 的 `<svg>` 上我们加了 `aria-hidden="true"` + `focusable="false"`
 * （`Image.vue`），**antd 的 `Image.js` 没有**。这是有意为之的改进（装饰性占位图
 * 对读屏器无意义），但它确实是**超出上游**的行为 ⇒ 登记在 `README.md` §7，
 * 由本文件的 `Skeleton.Image` 一节钉住，避免将来被「对齐上游」时静默删掉。
 *
 * ── 这个文件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**对比度**：axe 在 jsdom 下不做布局与绘制，`color-contrast` 会静默跳过。
 *   - 没证明**真实浏览器一致**：jsdom 缺少的 API 会让相关规则静默跳过。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import Image from '../Image.vue';
import Node from '../Node.vue';
import Skeleton from '../Skeleton.vue';

const P = 'apollo-skeleton';

// ---------------------------------------------------------------------------
// 1. axe 自动扫描
//
// ⚠️ 走标准的 `demos`（`import.meta.glob('../demo/*.vue')`），与其它组件一致 ——
//    `demo/` 目录落地后就不再需要 `render` 工厂。
//    ⚠️ `import.meta.glob` 是**编译期**静态分析，模式串必须是字面量，
//    且相对路径以**包含该调用的文件**为基准（`test-utils` 无法替我们 glob）。
// ---------------------------------------------------------------------------

a11yDemoTest('Skeleton', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

// ---------------------------------------------------------------------------
// 2. 主组件：不凭空加任何 ARIA（对齐上游）
// ---------------------------------------------------------------------------

describe('Skeleton · 不凭空加 ARIA（上游就是 0）', () => {
  const rootAriaAttrs = (el: Element) =>
    el.getAttributeNames().filter((n) => n === 'role' || n.startsWith('aria-'));

  it.each([
    ['默认', {}],
    ['三块全开', { avatar: true, title: true, paragraph: true }],
    ['active', { active: true }],
    ['round', { round: true }],
  ])('%s：根元素没有任何 `aria-*` / `role`', (_label, props) => {
    const w = mount(Skeleton, { props });
    expect(rootAriaAttrs(w.element)).toEqual([]);
  });

  it('子元素也不带 ARIA（`-header` / `-section` / `-title` / `-paragraph` / `-avatar`）', () => {
    const w = mount(Skeleton, { avatar: true });
    for (const sel of [
      `.${P}-header`,
      `.${P}-section`,
      `.${P}-title`,
      `.${P}-paragraph`,
      `.${P}-avatar`,
    ]) {
      const el = w.find(sel);
      if (el.exists()) expect(rootAriaAttrs(el.element)).toEqual([]);
    }
  });

  it('⚠️ `loading` 不产出 `aria-busy` / `aria-live`（上游缺口，如实登记不擅自补）', () => {
    const w = mount(Skeleton, { loading: true });
    const el = w.element as Element;
    expect(el.getAttribute('aria-busy')).toBeNull();
    expect(el.getAttribute('aria-live')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. 骨架屏不是交互元素
// ---------------------------------------------------------------------------

describe('Skeleton · 不进入 Tab 序列', () => {
  it('没有任何可聚焦元素（`tabindex` / `a[href]` / 表单控件）', () => {
    const w = mount(Skeleton, { avatar: true, active: true });
    expect(
      w.element.querySelectorAll('[tabindex], a[href], button, input, select, textarea'),
    ).toHaveLength(0);
  });

  it('根元素自身没有 `tabindex`', () => {
    const w = mount(Skeleton, { avatar: true });
    expect((w.element as Element).getAttribute('tabindex')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Skeleton.Image —— ⚠️ 我们比上游更严格的一处（已登记）
// ---------------------------------------------------------------------------

describe('Skeleton.Image · ⚠️ 超出上游的 aria-hidden（有意，已登记）', () => {
  it('`<svg>` 上是 `aria-hidden="true"` + `focusable="false"`', () => {
    const w = mount(Image);
    const svg = w.element.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    // `focusable="false"` 是 IE/旧 Edge 的 svg 可聚焦问题，现代浏览器无害但保持
    expect(svg?.getAttribute('focusable')).toBe('false');
  });

  it('`aria-hidden` 的元素仍在 DOM 里（不是删掉了），只是对读屏器隐藏', () => {
    const w = mount(Image);
    expect(w.element.querySelector('svg')).not.toBeNull();
    expect(w.element.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('根元素本身**不带** ARIA（只有内部的 svg 带）', () => {
    const w = mount(Image);
    expect((w.element as Element).getAttributeNames().filter((n) => n.startsWith('aria-'))).toEqual(
      [],
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Skeleton.Node —— 插槽内容原样渲染，不加包裹语义
// ---------------------------------------------------------------------------

describe('Skeleton.Node · 插槽内容原样渲染', () => {
  it('Node 根元素不带 ARIA，插槽内容原样落地', () => {
    const w = mount(Node, {
      slots: { default: () => h('span', { class: 'probe' }, 'X') },
    });
    expect((w.element as Element).getAttributeNames().filter((n) => n.startsWith('aria-'))).toEqual(
      [],
    );
    expect(w.find('.probe').exists()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. loading=false 时不残留任何骨架结构
// ---------------------------------------------------------------------------

describe('Skeleton · loading=false 的可访问树', () => {
  it('只渲染 children，没有 `-section` / `-header` 残留', () => {
    const w = mount(Skeleton, {
      props: { loading: false },
      slots: { default: () => h('span', { class: 'real' }, '内容') },
    });
    expect(w.find(`.${P}-section`).exists()).toBe(false);
    expect(w.find(`.${P}-header`).exists()).toBe(false);
    expect(w.find('.real').text()).toBe('内容');
  });
});
