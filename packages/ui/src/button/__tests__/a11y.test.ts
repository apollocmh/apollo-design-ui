/**
 * L5 · 无障碍测试
 *
 * ── Button 的无障碍面是**真**的，不是走过场 ───────────────────────────────────
 *
 * 它是全库第一个「可聚焦 + 可禁用」的组件，所以第一次把 `TESTING.md` §6.2 的
 * 键盘与焦点断言跑起来。落点：
 *
 *   1. axe 自动扫描（对全部 12 个 demo，0 violation）
 *   2. ★ `<button>` 与 `<a>` 两分支的 disabled 表达**不对称**（上游真实行为）
 *   3. `tabindex` 随 disabled 在 `0` / `-1` 之间切换（`<a>` 分支）
 *   4. icon-only 按钮的**可访问名**必须由使用方给（我们不像上游那样凭空加 `aria-label`）
 *   5. `loading` 不产出任何 ARIA 反馈 —— 这是**上游缺口**，如实登记，不擅自补
 *
 * ── 三处「上游观察」（不是我们的缺陷，也没有「修」）─────────────────────────────
 *
 * 1. **`loading` 没有 `aria-busy` / `aria-live`**。屏幕阅读器不会播报「正在加载」。
 *    antd 6.6.4 **没有**输出它，我们逐字对齐 —— 因为 L4 的 DOM 契约是与 antd 的
 *    机械基线逐字比对，单方面加属性会让契约红。登记在 `README.md` §7。
 * 2. **icon-only 按钮没有默认的可访问名**。`<Button :icon="X" />` 渲染出来是
 *    `<button><span class="-icon"><svg/></span></button>`，可访问名为空。
 *    axe 的 `button-name` 规则会报（见下面「icon-only 的例外」一节，那里给了理由与
 *    我们的处置：**在文档里要求使用方传 `aria-label`**，而不是在组件里猜一个）。
 * 3. **`<a>` 分支恒有 `tabindex`**（`0` / `-1`）。原生 `<a href>` 本就可聚焦，
 *    显式写 `0` 是上游行为；我们不改。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Button } from '../index';

const P = 'apollo-btn';

a11yDemoTest('Button', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

const mountBtn = (props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) =>
  mount(Button, { props, ...(slots ? { slots } : {}) });

describe('Button · 原生语义', () => {
  it('默认就是 `<button>`：浏览器自带的可聚焦与 Enter/Space 激活都成立', () => {
    const w = mountBtn();
    expect(w.element.tagName).toBe('BUTTON');
    // 不设 `role`：`<button>` 的隐式 role 就是 button，加了反而冗余。
    expect(w.attributes('role')).toBeUndefined();
  });

  it('★ `<button>` 分支的禁用是**原生 `disabled`**（浏览器会移出 Tab 序列）', () => {
    const w = mountBtn({ disabled: true });
    expect(w.attributes('disabled')).toBe('');
    // ⚠️ 不加 `aria-disabled`：原生 `disabled` 已经表达了同一件事，
    //    两个都写会让屏幕阅读器重复播报（这也是上游行为）。
    expect(w.attributes('aria-disabled')).toBeUndefined();
  });

  it('未禁用时不输出 `disabled`（`disabled=""` 与「没有该属性」在 HTML 里等价，但我们按 Vue 的渲染结果断言）', () => {
    expect(mountBtn().attributes('disabled')).toBeUndefined();
  });
});

describe('Button · `<a>` 分支的可达性', () => {
  it('★ 可聚焦：tabindex="0" + aria-disabled="false"', () => {
    const w = mountBtn({ href: 'https://example.com' });
    expect(w.element.tagName).toBe('A');
    expect(w.attributes('tabindex')).toBe('0');
    expect(w.attributes('aria-disabled')).toBe('false');
  });

  it('★ 禁用时移出 Tab 序列：tabindex="-1" + aria-disabled="true" + 移除 href', () => {
    const w = mountBtn({ href: 'https://example.com', disabled: true });
    // `<a>` 没有原生 `disabled`，所以只能靠这三条组合表达。
    // 少了 `tabindex=-1`，键盘用户仍能 Tab 到一个点不动的链接。
    expect(w.attributes('tabindex')).toBe('-1');
    expect(w.attributes('aria-disabled')).toBe('true');
    expect(w.attributes('href')).toBeUndefined();
  });

  it('`aria-disabled` 恒为**字符串**（"true" / "false"，不是布尔）', () => {
    // HTML 属性只有字符串形态；Vue 对 `false` 会渲染成 `"false"`（不是移除属性），
    // 与 React 的 `aria-disabled={false}` → `aria-disabled="false"` 一致。
    expect(mountBtn({ href: '#' }).attributes('aria-disabled')).toBe('false');
    expect(mountBtn({ href: '#', disabled: true }).attributes('aria-disabled')).toBe('true');
  });
});

describe('Button · 键盘与焦点', () => {
  // ⚠️ 焦点断言必须 `attachTo: document.body`：VTU 默认挂在**游离**的容器上，
  //    而游离元素 `.focus()` 不会成为 `document.activeElement`（`afterEach` 里
  //    `document.body.innerHTML = ''` 会回收，所以挂上去是安全的）。
  const mountAttached = (props: Record<string, unknown> = {}) =>
    mount(Button, { props, attachTo: document.body });

  it('★ 未被禁用时元素在 Tab 序列里（`<button>` 天生可聚焦，`<a href>` 也是）', () => {
    const btn = mountAttached();
    btn.element.focus();
    expect(document.activeElement).toBe(btn.element);

    const link = mountAttached({ href: '#' });
    link.element.focus();
    expect(document.activeElement).toBe(link.element);
  });

  it('原生 `disabled` 的 `<button>` **不可**聚焦（浏览器行为，不是我们实现的）', () => {
    const w = mountAttached({ disabled: true });
    const enabled = mountAttached();
    enabled.element.focus();
    expect(document.activeElement, '先证明「能聚焦」这条路径在本环境可观测').toBe(enabled.element);
    (w.element as HTMLButtonElement).focus();
    // jsdom 忠实实现了「disabled 元素不可聚焦」。
    expect(document.activeElement).not.toBe(w.element);
  });

  it('`expose` 的 `nativeElement` 让调用方能自己管焦点（`focus` / `blur`）', () => {
    const w = mountAttached();
    const exposed = w.vm as unknown as { nativeElement: HTMLButtonElement | null };
    exposed.nativeElement?.focus();
    expect(document.activeElement).toBe(w.element);
    exposed.nativeElement?.blur();
    expect(document.activeElement).not.toBe(w.element);
  });

  it('★ loading 时不设 `aria-busy`：如实对齐上游（缺口登记在 README §7）', () => {
    const w = mountBtn({ loading: true });
    expect(w.attributes('aria-busy')).toBeUndefined();
    expect(w.attributes('aria-live')).toBeUndefined();
  });
});

describe('Button · 图标按钮的可访问名', () => {
  it('★ 只有图标时**没有**可访问名 ⇒ 使用方必须自己给 `aria-label`', () => {
    const bare = mountBtn({ icon: h('i', { class: 'my-icon' }) });
    expect(bare.classes()).toContain(`${P}-icon-only`);
    // 「没有」也是断言：凭空猜一个 `aria-label`（比如读图标名）会产出
    // 与界面语言不一致的播报，比不给更糟。
    expect(bare.attributes('aria-label')).toBeUndefined();
  });

  it('★ 给了 `aria-label` 就落到根元素上（`$attrs` 透传）', () => {
    const w = mountBtn({ icon: h('i'), 'aria-label': '搜索' });
    expect(w.attributes('aria-label')).toBe('搜索');
  });

  it('有文字内容时，内容本身就是可访问名（不需要额外的 aria-*）', () => {
    const w = mountBtn({}, { default: () => '保存' });
    expect(w.text()).toBe('保存');
    expect(w.attributes('aria-label')).toBeUndefined();
  });
});

describe('Button · 除 disabled/aria-disabled 外不凭空加 aria-*', () => {
  it('`<button>` 分支：没有任何 `aria-*`', () => {
    const keys = Object.keys(mountBtn({}, { default: () => 'Text' }).attributes()).filter((n) =>
      n.startsWith('aria-'),
    );
    expect(keys).toEqual([]);
  });

  it('`<a>` 分支：只有 `aria-disabled`', () => {
    const keys = Object.keys(
      mountBtn({ href: '#' }, { default: () => 'Text' }).attributes(),
    ).filter((n) => n.startsWith('aria-'));
    expect(keys).toEqual(['aria-disabled']);
  });
});
