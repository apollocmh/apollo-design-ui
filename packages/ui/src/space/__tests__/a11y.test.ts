/**
 * L5 · 无障碍测试
 *
 * ── Space 的无障碍面：**几乎为零，但不是零** ────────────────────────────────────
 *
 * 三个组件都不引入任何显式 ARIA 语义：
 *   - `Space` / `Space.Compact` / `Space.Addon` 的根都是裸 `<div>`
 *   - `-item` 包装也是裸 `<div>`
 *   - 没有 `role="list"` / `role="listitem"`（**这是上游行为**，见下）
 *   - 没有 `aria-*`、没有 `tabindex`、没有可聚焦元素
 *
 * 所以这一层的落点是三件事：
 *   1. axe 自动扫描（对全部 15 个 demo，0 violation）
 *   2. **断言「没有加语义」这件事本身** —— 凭空加 `role="list"` 或 `aria-label`
 *      会污染屏幕阅读器的结构导航（`Space` 是纯布局容器，它不承载语义）
 *   3. 断言 `separator` 里的 `Divider` 的 `role="separator"` **确实被保留**——
 *      这是 Space 里唯一一条会「传递」语义的路径，值得单独钉住
 *
 * ── 一处**上游观察**（不是我们的缺陷，也没有「修」）─────────────────────────────
 *
 * antd 的 `Space` 用 `<div>` 序列表达「一组相邻元素」，**没有**输出
 * `role="list"` / `role="listitem"`。屏幕阅读器因此读不到「这是一个 3 项的组」。
 * 从纯 ARIA 角度看，`role="list"` + `role="listitem"` 更贴切；但：
 *   - 它会让**所有**存量 Space 的读屏播报变化（上游不敢改）；
 *   - 我们的 L4 契约是**与 antd 的机械基线逐字比对**，单方面加 role 会让契约红。
 * 所以逐字对齐、不加。这条观察登记在 `README.md` §7，属于「上游可改进项」。
 *
 * ── 键盘可达性：**架构上不适用**，不是「没测」──────────────────────────────────
 *
 * `Space` 不引入任何可聚焦元素（不设 `tabindex`、不改 DOM 顺序、不拦截事件）。
 * 子节点自己的键盘行为与「是否被 Space 包裹」无关 —— 换句话说，
 * Space 对键盘路径的影响恒为「无」。所以没有键盘断言可写，
 * 而不是「写几个 `expect(...).toBe(true)` 把格子填上」（反模式 A1）。
 * `TESTING.md` §6.2 要求的键盘/焦点断言由**有交互面的组件**承担。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Divider } from '../../divider';
import { Space, SpaceAddon, SpaceCompact } from '../index';

const P = 'apollo-space';
const PC = 'apollo-space-compact';
const PA = 'apollo-space-addon';

a11yDemoTest('Space', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 15,
});

describe('Space · 不引入语义（「没有」也是断言）', () => {
  it('默认渲染：根是裸 div，无 role、无 aria-*、无 tabindex', () => {
    const w = mount(Space, { slots: { default: () => ['a', 'b'] } });
    expect(w.element.tagName).toBe('DIV');
    const attrs = Object.keys(w.attributes());
    expect(attrs.filter((name) => name.startsWith('aria-'))).toEqual([]);
    expect(attrs).not.toContain('role');
    expect(attrs).not.toContain('tabindex');
  });

  it('★ `-item` 包装也是裸 div（**没有** `role="listitem"`）', () => {
    // 这是上游行为：antd 的 `Item` 就是 `<div class="ant-space-item">{children}</div>`。
    // 加上 `role="listitem"` 会让所有存量 Space 的读屏播报变化，且与 L4 的机械基线冲突。
    const w = mount(Space, { slots: { default: () => ['a', 'b', 'c'] } });
    const items = w.findAll(`.${P}-item`);
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.element.tagName).toBe('DIV');
      expect(item.attributes('role')).toBeUndefined();
      expect(Object.keys(item.attributes()).filter((n) => n.startsWith('aria-'))).toEqual([]);
    }
  });

  it('★ 根上**没有** `role="list"`（「一组元素」的语义是缺省的）', () => {
    const w = mount(Space, { slots: { default: () => ['a', 'b'] } });
    expect(w.attributes('role')).toBeUndefined();
    // 连 `aria-orientation` 也没有 —— 方向只体现在 CSS 的 `flex-direction` 上。
    expect(w.attributes('aria-orientation')).toBeUndefined();
  });

  it('垂直 / 换行 / 带 separator 都不改变语义面', () => {
    const variants: Array<Record<string, unknown>> = [
      { orientation: 'vertical' },
      { wrap: true },
      { size: 'large' },
      { align: 'baseline' },
      { separator: '-' },
    ];
    for (const props of variants) {
      const w = mount(Space, { props, slots: { default: () => ['a', 'b'] } });
      const attrs = Object.keys(w.attributes());
      expect(attrs, JSON.stringify(props)).not.toContain('role');
      expect(
        attrs.filter((n) => n.startsWith('aria-')),
        JSON.stringify(props),
      ).toEqual([]);
    }
  });

  it('★ 分隔符是**纯装饰**：不输出 `role` / `aria-hidden`', () => {
    // ⚠️ 一条上游观察：`-item-separator` 是裸 `<span>`，没有 `aria-hidden="true"`。
    //    理想情况下装饰性分隔符应当对读屏隐藏（否则 `•` / `|` 会被逐个读出来）。
    //    但加 `aria-hidden` 会改变 DOM 契约，且上游没有加 —— 我们逐字对齐、不加。
    //    登记在 `COMPATIBILITY.md` §9.2.1 的 U6 与 `README.md` §6.1。
    const w = mount(Space, { props: { separator: '|' }, slots: { default: () => ['a', 'b'] } });
    const separator = w.find(`.${P}-item-separator`);
    expect(separator.exists()).toBe(true);
    expect(separator.attributes('role')).toBeUndefined();
    expect(separator.attributes('aria-hidden')).toBeUndefined();
  });
});

describe('Space.Compact / Space.Addon · 不引入语义', () => {
  it('Compact 的根是裸 div，无 role / aria-*', () => {
    const w = mount(SpaceCompact, { slots: { default: () => ['a', 'b'] } });
    expect(w.element.tagName).toBe('DIV');
    const attrs = Object.keys(w.attributes());
    expect(attrs).not.toContain('role');
    expect(attrs.filter((n) => n.startsWith('aria-'))).toEqual([]);
  });

  it('★ Compact **不包装子节点** —— 子元素是调用方给的，Compact 只注入上下文', () => {
    // 这条与 a11y 直接相关：Compact 不产中间层 ⇒ 不会破坏子组件自己的语义
    // （Button 仍是 button、Input 仍是 input，不会被套进一个裸 div 里）。
    const w = mount(SpaceCompact, {
      slots: {
        default: () => [h('button', { type: 'button' }, 'A'), h('input', { 'aria-label': 'B' })],
      },
    });
    expect(w.findAll('button')).toHaveLength(1);
    expect(w.findAll('input')).toHaveLength(1);
    // 根的直接子元素就是 button / input，中间没有包装 div。
    expect(w.element.children).toHaveLength(2);
    expect(w.element.children[0]?.tagName).toBe('BUTTON');
    expect(w.element.children[1]?.tagName).toBe('INPUT');
  });

  it('Addon 的根是裸 div，无 role / aria-*（`disabled` 也不加 `aria-disabled`）', () => {
    // ⚠️ 上游行为：`disabled` 只加 `-disabled` 类名（改文字色），不输出 `aria-disabled`。
    //    Addon 不是可交互控件，没有「禁用」的 ARIA 语义 —— 对齐 antd。
    //    登记在 `COMPATIBILITY.md` §9.2.1 的 U4（跟随的上游缺陷：对辅助技术不可见）。
    const w = mount(SpaceAddon, { props: { disabled: true }, slots: { default: () => 'x' } });
    expect(w.element.tagName).toBe('DIV');
    expect(w.attributes('role')).toBeUndefined();
    expect(w.attributes('aria-disabled')).toBeUndefined();
    expect(Object.keys(w.attributes()).filter((n) => n.startsWith('aria-'))).toEqual([]);
    expect(w.classes()).toContain(`${PA}-disabled`);
  });

  it('Addon 的 `status` 只产类名，不输出 `aria-invalid`', () => {
    const w = mount(SpaceAddon, { props: { status: 'error' }, slots: { default: () => 'x' } });
    expect(w.classes()).toContain(`${PA}-status-error`);
    expect(w.attributes('aria-invalid')).toBeUndefined();
  });
});

describe('Space · 语义传递（唯一一条会把语义带进来的路径）', () => {
  it('★ `#separator` 插槽传 `Divider` 时，`role="separator"` 被**保留**在分隔符上', () => {
    // C8-R2：富内容分隔符走插槽。`Space` 会把插槽的 vnode `cloneVNode` 后插进
    // `-item-separator` 里，
    // 所以 `Divider` 自己的 `role="separator"` 原样保留 —— 这是 Space 里唯一
    // 「外部组件的语义被透传进来」的路径，值得单独钉住（一旦有人改成只取 tagName 就红）。
    const w = mount(Space, {
      slots: {
        default: () => ['a', 'b'],
        separator: () => h(Divider, { orientation: 'vertical' }),
      },
    });
    const separator = w.find(`.${P}-item-separator`);
    expect(separator.exists()).toBe(true);
    expect(separator.find('[role="separator"]').exists()).toBe(true);
    // 且**只有**分隔符里有它 —— 根元素没有被污染。
    expect(w.attributes('role')).toBeUndefined();
  });

  it('`Compact` 不拦截子组件的 role（按钮的 button 角色原样保留）', () => {
    const w = mount(SpaceCompact, {
      slots: { default: () => [h('button', { type: 'button' }, 'A')] },
    });
    expect(w.find('button').element.tagName).toBe('BUTTON');
    expect(w.find('button').attributes('type')).toBe('button');
  });

  it('`PC` 的根类名不参与语义 —— 它只是个类名，没有对应的 ARIA 角色', () => {
    const w = mount(SpaceCompact, { props: { block: true }, slots: { default: () => ['a'] } });
    expect(w.classes()).toContain(PC);
    expect(w.classes()).toContain(`${PC}-block`);
    expect(w.attributes('role')).toBeUndefined();
  });
});
