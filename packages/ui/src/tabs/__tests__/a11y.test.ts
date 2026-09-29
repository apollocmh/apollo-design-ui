/**
 * L5 无障碍 —— Tabs 的 role/ARIA 契约、键盘可达性与 axe 扫描。
 *
 * ── 判据（antd 6.6.4 = rc-tabs@1.13.0）────────────────────────────────────────
 *
 * | 项 | 判据 |
 * |---|---|
 * | 根 | `div`（**没有 role**；语义在 nav 上） |
 * | 导航区 | `div[role=tablist]` + `aria-orientation=horizontal\|vertical` |
 * | 页签 | `div[role=tab]` + `aria-selected` + **tabIndex 三态**（disabled ⇒ 无、active ⇒ 0、其余 ⇒ -1） |
 * | 面板 | `div[role=tabpanel]` + `aria-labelledby` + `aria-hidden=!active` + `tabIndex` 仅 active 且有内容时 0 |
 * | 溢出触发器 | `button[aria-haspopup=listbox]` + `aria-controls` + `aria-expanded` |
 * | 「+」按钮 | `button[aria-label]`（`locale.addAriaLabel || 'Add tab'`） |
 * | 删除按钮 | `button[aria-label]`（`locale.removeAriaLabel || 'remove'`） |
 * | 键盘 | ← → ↑ ↓ Home End Enter Space（**读 `e.code`**）；焦点只能落在**启用**页签上 |
 *
 * ── 关于 axe 的两条说明 ───────────────────────────────────────────────────────
 *
 * 1. **只扫真实配置**，不接 demo 维度 —— demo 要到 G11 才落地，现在挂 `a11yDemoTest`
 *    只会得到「占位 demo 也能跑」的假绿灯（与 pagination 同判）。
 * 2. `aria-controls` 指向的面板在**未 `forceRender` 时不进 DOM**（上游行为：面板按需渲染）
 *    ⇒ 若 axe 的 `aria-valid-attr-value` 报「引用了不存在的元素」，那是**上游同款**行为，
 *    会在 `allow` 里带原因登记（不是「把门禁调松」，而是「与上游一致地豁免」）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import Tabs from '../Tabs.vue';

const P = 'apollo-tabs';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const items = () => [
  { key: '1', label: 'Tab 1', children: 'Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Pane 2' },
  { key: '3', label: 'Tab 3', children: 'Pane 3', disabled: true },
];

/** 挂到真实文档（axe 与 `.focus()` 都要求元素在文档里）。 */
const mountA11y = (props: Record<string, unknown> = {}) =>
  mount(
    h(Tabs as never, { id: 'test', defaultActiveKey: '1', items: items(), ...props } as never),
    {
      attachTo: document.body,
    },
  );

describe('Tabs · axe 扫描（真实配置）', () => {
  /**
   * ⚠️ `allow` 里的每一条都必须**可自证**（不是「把门禁调松」）：
   *
   * `aria-required-children`（`div[role=tablist]` 里有 `<button>`）—— 这是**上游同款**行为：
   * rc 把「+」按钮（`AddButton`）放在 `-nav-list` 里（要和页签一起被测量/滚动），
   * 于是 `role=tablist` 的**可达子节点**里出现了 `role=tab` 之外的 `<button>`。
   * 实测 antd 6.6.4 自己的 DOM 报**同一条**（同一节点）：
   *   `node tests/visual/debug/probe-tabs-axe-antd.mjs`
   *   → `ANTD_VIOLATIONS: [{ id: 'aria-required-children', html: ['<div role="tablist" …'] }]`
   * 修掉它要动 DOM 结构（把 AddButton 挪出 tablist）⇒ 与上游的 DOM 契约不符。
   */
  const ADD_BUTTON_IN_TABLIST = ['aria-required-children'];

  const cases: Record<string, { props: Record<string, unknown>; allow?: string[] }> = {
    常规: { props: {} },
    卡片: { props: { type: 'card' } },
    可编辑卡片: { props: { type: 'editable-card' }, allow: ADD_BUTTON_IN_TABLIST },
    可编辑隐藏加号: {
      props: { type: 'editable-card', hideAdd: true },
      allow: ADD_BUTTON_IN_TABLIST,
    },
    居中卡片: { props: { type: 'card', centered: true } },
    纵向: { props: { tabPlacement: 'left' } },
    底部: { props: { tabPlacement: 'bottom' } },
    小尺寸: { props: { size: 'small' } },
    大尺寸: { props: { size: 'large' } },
    带额外内容: { props: { tabBarExtraContent: h('span', 'extra') } },
    两侧额外内容: { props: { tabBarExtraContent: { left: 'L', right: 'R' } } },
    自定义指示条: { props: { indicator: { align: 'start', size: 20 } } },
    页签间距: { props: { tabBarGutter: 24 } },
    强制渲染: {
      props: {
        items: [
          { key: '1', label: 'Tab 1', children: 'Pane 1' },
          { key: '2', label: 'Tab 2', children: 'Pane 2', forceRender: true },
        ],
      },
    },
    无内容页签: { props: { items: [{ key: '1', label: 'Empty' }] } },
  };

  for (const [name, { props, allow = [] }] of Object.entries(cases)) {
    it(`${name}：${allow.length ? `仅豁免 ${allow.join(', ')}` : '无 axe violation'}`, async () => {
      const w = mountA11y(props);
      await nextTick();
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

describe('Tabs · role / ARIA 契约（L5）', () => {
  it('根是 `div` 且**没有 role**（语义在导航区）；导航区是 `role=tablist`', () => {
    const w = mountA11y();
    expect(w.element.tagName).toBe('DIV');
    expect(w.attributes('role')).toBeUndefined();
    const nav = w.find(`.${P}-nav`);
    expect(nav.attributes('role')).toBe('tablist');
    expect(nav.attributes('aria-orientation')).toBe('horizontal');
    w.unmount();

    const vertical = mountA11y({ tabPlacement: 'left' });
    expect(vertical.find(`.${P}-nav`).attributes('aria-orientation')).toBe('vertical');
    vertical.unmount();
  });

  it('页签：`role=tab` + `aria-selected` + tabIndex 三态', () => {
    const w = mountA11y();
    const tabs = w.findAll('[role="tab"]');
    expect(tabs.length).toBe(3);
    expect(tabs[0]?.attributes('aria-selected')).toBe('true');
    expect(tabs[0]?.attributes('tabindex')).toBe('0');
    expect(tabs[1]?.attributes('aria-selected')).toBe('false');
    expect(tabs[1]?.attributes('tabindex')).toBe('-1');
    // disabled ⇒ **属性被移除**（不是 -1）
    expect(tabs[2]?.attributes('tabindex')).toBeUndefined();
    expect(tabs[2]?.attributes('aria-disabled')).toBe('true');
    w.unmount();
  });

  it('面板：`role=tabpanel` + aria 关联 + `aria-hidden` / `tabindex` 随 active 变', () => {
    const w = mountA11y();
    const panel = w.find('[role="tabpanel"]');
    expect(panel.attributes('id')).toBe('test-panel-1');
    expect(panel.attributes('aria-labelledby')).toBe('test-tab-1');
    expect(panel.attributes('aria-hidden')).toBe('false');
    expect(panel.attributes('tabindex')).toBe('0');
    w.unmount();
  });

  it('溢出触发器：`aria-haspopup=listbox` + `aria-controls` + `aria-expanded`', () => {
    const w = mountA11y();
    const more = w.find(`.${P}-nav-more`);
    expect(more.attributes('aria-haspopup')).toBe('listbox');
    expect(more.attributes('aria-controls')).toBe('test-more-popup');
    expect(more.attributes('aria-expanded')).toBe('false');
    expect(more.attributes('id')).toBe('test-more');
    w.unmount();
  });

  it('「+」与删除按钮都有可访问名（默认文案 + locale 可覆盖）', () => {
    const w = mountA11y({ type: 'editable-card' });
    expect(w.find(`.${P}-nav-add`).attributes('aria-label')).toBe('Add tab');
    expect(w.findAll(`.${P}-tab-remove`)[0]?.attributes('aria-label')).toBe('remove');
    w.unmount();

    const localized = mountA11y({
      type: 'editable-card',
      locale: { addAriaLabel: '添加页签', removeAriaLabel: '删除页签' },
    });
    expect(localized.find(`.${P}-nav-add`).attributes('aria-label')).toBe('添加页签');
    expect(localized.findAll(`.${P}-tab-remove`)[0]?.attributes('aria-label')).toBe('删除页签');
    localized.unmount();
  });

  it('focus 时才有 `aria-live` 播报（`Tab i of n`，n 是**启用**页签数）', async () => {
    const w = mountA11y();
    expect(w.find('[aria-live]').exists()).toBe(false);
    const second = w.findAll('[role="tab"]')[1];
    (second?.element as HTMLElement).focus();
    await nextTick();
    const live = w.find('[aria-live="polite"]');
    // ⚠️ 本组 items 里第 3 个是 disabled ⇒ **启用数只有 2**
    expect(live.text()).toBe('Tab 2 of 2');
    w.unmount();
  });
});

/** 导航区的键盘：组件读的是 `e.code`。 */
const fireKey = (el: Element, code: string): void => {
  el.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
};

/**
 * 溢出下拉的键盘：组件按 **rc 的写法读 `e.which`**（`@rc-component/util` 的 `KeyCode` 数字），
 * 而 jsdom 的 `which` / `keyCode` 是**只读 getter（恒 0）** ⇒ 必须 `defineProperty` 塞进去
 * （与 pagination 的 a11y 测试同一手法）。
 */
const fireWhichKey = (el: Element, which: number): void => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'which', { value: which });
  Object.defineProperty(event, 'keyCode', { value: which });
  el.dispatchEvent(event);
};

describe('Tabs · 键盘可达性（L5）', () => {
  it('★ 焦点只在**启用**的页签间移动（disabled 的 tabIndex 被移除）', async () => {
    const w = mountA11y();
    const first = w.findAll('[role="tab"]')[0];
    (first?.element as HTMLElement).focus();
    await nextTick();

    // '2' 是最后一个启用项 ⇒ ArrowRight 环形回到 '1'
    fireKey(first?.element as Element, 'ArrowRight');
    await nextTick();
    expect(document.activeElement).toBe(w.findAll('[role="tab"]')[1]?.element);

    fireKey(w.findAll('[role="tab"]')[1]?.element as Element, 'ArrowRight');
    await nextTick();
    // 跳过 disabled 的 '3'，环形回到 '1'
    expect(document.activeElement).toBe(w.findAll('[role="tab"]')[0]?.element);
    w.unmount();
  });

  it('Home / End 把焦点送到第一个 / 最后一个启用页签', async () => {
    const w = mountA11y();
    const first = w.findAll('[role="tab"]')[0];
    (first?.element as HTMLElement).focus();
    await nextTick();

    fireKey(first?.element as Element, 'End');
    await nextTick();
    // '3' 是 disabled ⇒ End 落到 '2'
    expect(document.activeElement).toBe(w.findAll('[role="tab"]')[1]?.element);

    fireKey(w.findAll('[role="tab"]')[1]?.element as Element, 'Home');
    await nextTick();
    expect(document.activeElement).toBe(w.findAll('[role="tab"]')[0]?.element);
    w.unmount();
  });

  it('Enter / Space 触发激活（焦点页签）', async () => {
    const w = mountA11y();
    const first = w.findAll('[role="tab"]')[0];
    (first?.element as HTMLElement).focus();
    await nextTick();
    fireKey(first?.element as Element, 'ArrowRight');
    await nextTick();
    fireKey(w.findAll('[role="tab"]')[1]?.element as Element, 'Enter');
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual(['2']);
    // ⚠️ 不要用 `[aria-selected=true]` 的 text 断言：`aria-live` 的播报也在同一个子树里
    expect(w.findAll(`.${P}-tab`)[1]?.classes()).toContain(`${P}-tab-active`);
    w.unmount();
  });

  it('纵向：↑ ↓ 才移动焦点', async () => {
    const w = mountA11y({ tabPlacement: 'left' });
    const first = w.findAll('[role="tab"]')[0];
    (first?.element as HTMLElement).focus();
    await nextTick();
    fireKey(first?.element as Element, 'ArrowDown');
    await nextTick();
    expect(document.activeElement).toBe(w.findAll('[role="tab"]')[1]?.element);
    w.unmount();
  });

  it('溢出下拉：关着时 ↓ / Space / Enter 打开（`aria-expanded` 变 true）', async () => {
    const w = mountA11y();
    const more = w.find(`.${P}-nav-more`);
    fireWhichKey(more.element, 40); // ↓
    await nextTick();
    expect(w.find(`.${P}-nav-more`).attributes('aria-expanded')).toBe('true');
    w.unmount();
  });
});

/**
 * ⚠️ demo 维度的 axe 扫描**留到 G11**（demo 落地后再接）——现在挂上去只会因为
 *    「占位 demo 也能渲染」而假绿。这里刻意**不调用** `a11yDemoTest`。
 */
void a11yDemoTest;
