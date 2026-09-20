/**
 * L5 · 无障碍测试
 *
 * ── Typography 的无障碍面在哪 ─────────────────────────────────────────────────
 *
 * Typography 是**文字**组件，所以它的大部分无障碍属性由语义化标签天然带来
 * （`Text`→`span`、`Paragraph`→`div`、`Title`→`h1..h5`、`Link`→`a[href]`）。
 * 真正需要断言的是**它自己加的那几个 aria 属性**，以及**它加的操作按钮**：
 *
 *   1. `copyable` / `editable` / `expandable` 渲染的是**真 `<button type="button">`**，
 *      而不是带 `onClick` 的 `span`。这决定了键盘可达性与「Enter/Space 能触发」。
 *   2. `Title` 渲染 `<h1>`…`<h5>` —— 屏幕阅读器的标题导航靠它。非法 `level` 退回 `h1`
 *      （不是不渲染）也在这条契约里：`h6` 会让标题层级出现空洞。
 *   3. `Link` 渲染 `<a href>` —— 没有 `href` 的 `<a>` 不在 Tab 序列里（`role` 也不是 link）。
 *   4. **省略号路径**：走 CSS 时浏览器负责可访问名，我们**不加**任何 aria 属性；
 *      走 JS 测量时根元素挂 `aria-label`（完整文本）、被截断的内容包一层
 *      `aria-hidden`（避免屏幕阅读器把截断后的文字再读一遍）。
 *      后者需要布局打桩才可达（jsdom 没有布局引擎），由 L1/L2 的
 *      `index.test.ts` 用同一套打桩断言 —— 本层不重复造那套桩，
 *      只断言**不需要布局的那一半**（CSS 路径下 aria 属性「不存在」）。
 *      **展开按钮**（`-expand` / `-collapse`）同理：它只在测量判定「需要省略」
 *      之后才渲染，所以「它是真 `<button type="button">`」这条断言也落在
 *      `index.test.ts` 的 `expandable` 用例里（那里已经有桩）。
 *
 * ── 两处**上游观察**（不是我们的缺陷，也没有「修」）───────────────────────────
 *
 *   1. **`disabled` 只加类名，不加 `aria-disabled`**。antd 6.6.4 的 `Base` 里
 *      `disabled` 只参与类名与样式（`-disabled`），没有任何 ARIA 语义。
 *      我们逐字对齐 —— 加 `aria-disabled` 会让 L4 的 DOM 契约红。
 *      影响：屏幕阅读器**不知道**这段文字是禁用的（它本来也是不可交互的文字，
 *      危害有限）。登记在 README §7。
 *   2. **`<span role="button">` 嵌套在 `<button>` 里**（编辑图标）。图标组件自己带
 *      `role="button"`（antd 的 `EditOutlined role="button"`），于是出现嵌套的
 *      交互角色。这也是逐字对齐的结果，L4 契约里能看到同样的结构。
 *
 * ── 这个测试没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**对比度**：axe 在 jsdom 下不做布局与绘制，`color-contrast` 落到
 *     `incomplete` 而**不是** `violation`。对比度由 theme 层与 L6 承担。
 *   - 没证明 JS 省略号路径的 `aria-label` / `aria-hidden`（需要布局，见上）。
 *   - 没证明真实浏览器里的焦点行为（jsdom 的 `focus()` 语义与浏览器有差异）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Link, Text, Title } from '../index';

const P = 'apollo-typography';

a11yDemoTest('Typography', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Typography · 操作按钮的键盘可达性', () => {
  it('★ `copyable` 渲染真 `<button type="button">`（不是带 onClick 的 span）', () => {
    const w = mount(Text, { props: { copyable: true }, slots: { default: () => 'x' } });
    const button = w.find(`.${P}-copy`);
    expect(button.element.tagName).toBe('BUTTON');
    // `type="button"`：少了它，按钮在 `<form>` 里会变成 submit（回车即提交表单）
    expect(button.attributes('type')).toBe('button');
    // 默认不写 tabindex ⇒ 走浏览器自然 Tab 序列
    expect(button.attributes('tabindex')).toBeUndefined();
  });

  it('★ `editable` 渲染真 `<button type="button">` 且默认在自然 Tab 序列里', () => {
    const w = mount(Text, { props: { editable: true }, slots: { default: () => 'x' } });
    const button = w.find(`.${P}-edit`);
    expect(button.element.tagName).toBe('BUTTON');
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('tabindex')).toBeUndefined();
  });

  it('`editable.tabIndex` 显式落到按钮上（用户想把它移出 Tab 序列时可以传 -1）', () => {
    const w = mount(Text, { props: { editable: { tabIndex: 3 } }, slots: { default: () => 'x' } });
    expect(w.find(`.${P}-edit`).attributes('tabindex')).toBe('3');
  });

  it('★ 两个操作按钮都有**非空**的 `aria-label`（纯图标按钮没有可见文本）', () => {
    const w = mount(Text, {
      props: { copyable: true, editable: true },
      slots: { default: () => 'x' },
    });
    for (const suffix of ['copy', 'edit']) {
      const label = w.find(`.${P}-${suffix}`).attributes('aria-label');
      expect(label, suffix).toBeTruthy();
      expect((label ?? '').trim().length, suffix).toBeGreaterThan(0);
    }
  });
});

describe('Typography · 语义标签', () => {
  it('★ `Title` 的 `level` 决定标题层级，且非法值退回 `h1`（不是 `h6`、不是不渲染）', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const w = mount(Title, { props: { level }, slots: { default: () => 'T' } });
      expect(w.element.tagName, `level=${level}`).toBe(`H${level}`);
    }
    // 非法 ⇒ h1：h6 会让标题层级出现空洞（跳级是 axe 的 `heading-order` 关注点）。
    // `level: 6` 类型上就非法 —— 断言「非法值被拒绝」只能显式越界。
    const invalid = mount(Title, {
      props: { level: 6 as never },
      slots: { default: () => 'T' },
    });
    expect(invalid.element.tagName).toBe('H1');
  });

  it('★ `Link` 渲染带 `href` 的 `<a>`（无 `href` 的 `a` 不在 Tab 序列里）', () => {
    const w = mount(Link, {
      props: { href: 'https://example.com' },
      slots: { default: () => 'L' },
    });
    expect(w.element.tagName).toBe('A');
    expect(w.attributes('href')).toBe('https://example.com');
  });

  it('`target="_blank"` 时补 `rel`，避免 `window.opener` 劫持', () => {
    const w = mount(Link, {
      props: { href: 'https://example.com', target: '_blank' },
      slots: { default: () => 'L' },
    });
    expect(w.attributes('rel')).toBe('noopener noreferrer');
  });

  it('★ 用户显式传 `rel=""` 时不补 —— 这是**允许**的（用户自己承担风险）', () => {
    // 判据是 `rel === undefined` 而不是真值。把它写成真值判断会让「显式关闭」失效。
    const w = mount(Link, {
      props: { href: 'https://example.com', target: '_blank', rel: '' },
      slots: { default: () => 'L' },
    });
    expect(w.attributes('rel')).toBe('');
  });
});

describe('Typography · aria 属性「该有的有、不该有的没有」', () => {
  it('★ 走 CSS 省略号时**不加**任何 aria 属性（可访问名交给浏览器）', () => {
    const w = mount(Text, { props: { ellipsis: true }, slots: { default: () => 'long text' } });
    expect(w.attributes('aria-label')).toBeUndefined();
    expect(w.findAll('[aria-hidden="true"]').length).toBe(0);
  });

  it('★ 不带省略号时正文不被 `aria-hidden` 包住（否则屏幕阅读器读不到）', () => {
    const w = mount(Text, { slots: { default: () => 'readable' } });
    expect(w.find('[aria-hidden="true"]').exists()).toBe(false);
  });

  it('★ 上游观察：`disabled` **只加类名**，不加 `aria-disabled`（逐字对齐 antd）', () => {
    const w = mount(Text, { props: { disabled: true }, slots: { default: () => 'x' } });
    expect(w.classes()).toContain(`${P}-disabled`);
    // 这不是「我们漏了」：antd 6.6.4 的 `Base` 里 `disabled` 只参与类名与样式。
    // 单方面补 `aria-disabled` 会让 L4 的 DOM 契约与机械基线不等。
    expect(w.attributes('aria-disabled')).toBeUndefined();
  });

  it('`rootClassName` / `className` 不会顺手带上 aria-*（属性透传是白名单式的）', () => {
    const w = mount(Text, {
      props: { className: 'a', rootClassName: 'b', id: 'x' },
      slots: { default: () => 'x' },
    });
    expect(Object.keys(w.attributes()).filter((name) => name.startsWith('aria-'))).toEqual([]);
  });
});
