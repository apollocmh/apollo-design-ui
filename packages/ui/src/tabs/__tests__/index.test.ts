/**
 * L2 —— Tabs 的结构 / 状态机 / 事件 / 键盘 / 面板（**挂组件**的那一层）。
 *
 * ⚠️ 纯函数（几何与配置）在 `pure.test.ts` —— 与「几十处组件挂载」放同一个文件会让
 *    vitest 的 worker 起不来（pagination 的 224 行判定表踩过这条）。
 *
 * ── 覆盖的判据（对应 `docs/analysis/tabs.md`）──────────────────────────────────
 *
 * | 组 | 判据 | 出处 |
 * |---|---|---|
 * | 结构 | 根类名、`role=tablist` 的 `aria-orientation`、`-ink-bar` 在 `-nav-list` **内部**、`-nav-operations` 在**外部** | §4.7 |
 * | ARIA | btn 的 tabIndex 三态、remove 的 tabIndex 用 **active**、`aria-live` 仅 focus 时、`data-node-key` | §4.8 |
 * | id | **异步生成**：首帧没有 `aria-controls`，挂载后有 | §3.2 / R3 |
 * | 状态机 | `activeKey` 受控 / 自动重置（删末尾 / 删中间 / 删光） | §3.1 / R4 |
 * | 事件 | `change` **只在真的变了**时发、`tabClick` **每次都发**、`update:activeKey` 与 `change` 同发（C11） | §3.4 |
 * | 键盘 | `ArrowLeft/Right`（横向）、`ArrowUp/Down`（纵向 + preventDefault）、`Home/End`、`Enter/Space` | §5 |
 * | editable | `onEdit` 载荷改写（**add 传事件 / remove 传 key**）、`hideAdd`、remove 按钮 | R7 |
 * | 面板 | `forceRender` ⇒ 渲染但 `aria-hidden`；`destroyOnHidden` ⇒ 离场后卸载（**轮询**，PITFALLS 179） | R10 |
 * | ConfigProvider | `size` / `more.icon` / `indicator.align` / `removeIcon` 的合并 | R9 |
 * | 语义槽 | `classNames`/`styles` 落点 + **popup 是嵌套形状但要展平** | R6 |
 * | 插槽 | `#extra`（带 position）/ `#tabBar`（替代 `renderTabBar`） | §10 |
 *
 * ── 这个文件没有证明什么 ───────────────────────────────────────────────────────
 *   - jsdom 无布局、也没有 `ResizeObserver` ⇒ **测量 / 滚动 / 溢出下拉真的出现**这条线
 *     测不到（只能靠 L6 视觉，分析 §R2）；这里只断言「不报错 + 结构类名」
 *   - 没证明逐节点 DOM 一致（L4）与像素一致（L6）
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { computed, h, nextTick } from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { sizeContextKey } from '../../config-provider/size-context';
import Tabs from '../Tabs.vue';

const P = 'apollo-tabs';

/** 取第 index 项（`noUncheckedIndexedAccess` 下的显式化；越界**抛错**）。 */
const at = <T>(list: T[], index: number): T => {
  const item = list[index];
  if (item === undefined) {
    throw new Error(`期望至少有 ${index + 1} 个元素，实际 ${list.length} 个`);
  }
  return item;
};

const baseItems = () => [
  { key: '1', label: 'Tab 1', children: 'P1' },
  { key: '2', label: 'Tab 2', children: 'P2' },
  { key: '3', label: 'Tab 3', children: 'P3' },
];

const mountTabs = (
  props: Record<string, unknown> = {},
  options: { slots?: Record<string, unknown>; provide?: Record<symbol, unknown> } = {},
) =>
  mount(h(Tabs as never, { defaultActiveKey: '1', items: baseItems(), ...props } as never), {
    attachTo: document.body,
    slots: options.slots as never,
    global: { provide: options.provide ?? {} },
  });

const keysOf = (w: ReturnType<typeof mountTabs>): string[] =>
  w.findAll(`.${P}-tab`).map((n) => n.attributes('data-node-key') ?? '');

// ---------------------------------------------------------------------------
// 结构
// ---------------------------------------------------------------------------

describe('Tabs · 结构与类名', () => {
  it('根类名：`{p}` + `{p}-{placement}`（默认 top）', () => {
    const w = mountTabs();
    expect(w.classes()).toContain(P);
    expect(w.classes()).toContain(`${P}-top`);
    w.unmount();
  });

  it('type / centered / size 的类名', () => {
    const card = mountTabs({ type: 'card', centered: true, size: 'small' });
    expect(card.classes()).toEqual(
      expect.arrayContaining([`${P}-card`, `${P}-centered`, `${P}-small`]),
    );
    card.unmount();

    const editable = mountTabs({ type: 'editable-card' });
    // editable-card 同时带 `-card` / `-editable-card` / `-editable`（rc 的根类）
    expect(editable.classes()).toEqual(
      expect.arrayContaining([`${P}-card`, `${P}-editable-card`, `${P}-editable`]),
    );
    editable.unmount();
  });

  it('tabPlacement 的映射 + 纵向的 `aria-orientation`', () => {
    const left = mountTabs({ tabPlacement: 'left' });
    expect(left.classes()).toContain(`${P}-left`);
    expect(left.find('[role="tablist"]').attributes('aria-orientation')).toBe('vertical');
    left.unmount();

    // `start` 在 LTR 下映射成 `left`、`end` 映射成 `right`
    const start = mountTabs({ tabPlacement: 'start' });
    expect(start.classes()).toContain(`${P}-left`);
    start.unmount();

    const end = mountTabs({ tabPlacement: 'end' });
    expect(end.classes()).toContain(`${P}-right`);
    end.unmount();

    // 废弃的 tabPosition 仍然生效
    const legacy = mountTabs({ tabPosition: 'bottom' });
    expect(legacy.classes()).toContain(`${P}-bottom`);
    legacy.unmount();
  });

  it('★ `-ink-bar` 在 `-nav-list` **内部**、`-nav-operations` 在**外部**（兄弟）', () => {
    const w = mountTabs();
    expect(w.find(`.${P}-nav-list`).find(`.${P}-ink-bar`).exists()).toBe(true);
    const operations = w.find(`.${P}-nav-operations`);
    expect(operations.exists()).toBe(true);
    expect(operations.element.parentElement?.className ?? '').toContain(`${P}-nav`);
    expect(w.find(`.${P}-nav-wrap`).find(`.${P}-nav-operations`).exists()).toBe(false);
    w.unmount();
  });

  it('没有隐藏页签时 operations 带 `-hidden`；`-nav-more` 带 `visibility:hidden` + `order:1`', () => {
    const w = mountTabs();
    expect(w.find(`.${P}-nav-operations`).classes()).toContain(`${P}-nav-operations-hidden`);
    const style = w.find(`.${P}-nav-more`).attributes('style') ?? '';
    expect(style).toContain('visibility: hidden');
    expect(style).toContain('order: 1');
    w.unmount();
  });

  it('页签节点：`data-node-key` + `-active` / `-disabled`', () => {
    const w = mountTabs({
      items: [
        { key: '1', label: 'A', children: 'a' },
        { key: '2', label: 'B', children: 'b', disabled: true },
      ],
    });
    expect(keysOf(w)).toEqual(['1', '2']);
    expect(at(w.findAll(`.${P}-tab`), 0).classes()).toContain(`${P}-tab-active`);
    expect(at(w.findAll(`.${P}-tab`), 1).classes()).toContain(`${P}-tab-disabled`);
    w.unmount();
  });

  it('★ `data-node-key` 里的 `"` 变成 `TABS_DQ`（属性选择器的转义）', () => {
    const w = mountTabs({ items: [{ key: 'a"b', label: 'Q', children: 'q' }] });
    expect(keysOf(w)).toEqual(['aTABS_DQb']);
    w.unmount();
  });

  it('tabBarGutter ⇒ 首项**不带** gutter、其余带 marginInlineStart', () => {
    const w = mountTabs({ tabBarGutter: 24 });
    const tabs = w.findAll(`.${P}-tab`);
    expect(at(tabs, 0).attributes('style') ?? '').not.toContain('margin');
    expect(at(tabs, 1).attributes('style') ?? '').toContain('24px');
    w.unmount();
  });

  it('根上的其余属性照常透传', () => {
    const w = mountTabs({ 'data-testid': 'x' });
    expect(w.attributes('data-testid')).toBe('x');
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// ARIA / id
// ---------------------------------------------------------------------------

describe('Tabs · ARIA 与异步 id', () => {
  it('btn 的 tabIndex 三态 + `aria-selected` + `aria-disabled`', () => {
    const w = mountTabs({
      items: [
        { key: '1', label: 'A', children: 'a' },
        { key: '2', label: 'B', children: 'b' },
        { key: '3', label: 'C', children: 'c', disabled: true },
      ],
    });
    const btns = w.findAll(`.${P}-tab-btn`);
    expect(at(btns, 0).attributes('tabindex')).toBe('0'); // active
    expect(at(btns, 1).attributes('tabindex')).toBe('-1');
    expect(at(btns, 2).attributes('tabindex')).toBeUndefined(); // disabled ⇒ 移除属性
    expect(at(btns, 0).attributes('aria-selected')).toBe('true');
    expect(at(btns, 2).attributes('aria-disabled')).toBe('true');
    w.unmount();
  });

  it('显式 `id` ⇒ 立刻有 `aria-controls` / `aria-labelledby` / `id`', () => {
    const w = mountTabs({ id: 'test' });
    const btn = at(w.findAll(`.${P}-tab-btn`), 0);
    expect(btn.attributes('id')).toBe('test-tab-1');
    expect(btn.attributes('aria-controls')).toBe('test-panel-1');
    const panel = at(w.findAll('[role="tabpanel"]'), 0);
    expect(panel.attributes('id')).toBe('test-panel-1');
    expect(panel.attributes('aria-labelledby')).toBe('test-tab-1');
    w.unmount();
  });

  it('★ 不给 `id` 时 id **异步生成**：首帧没有 aria，挂载后才有', async () => {
    const w = mount(h(Tabs as never, { defaultActiveKey: '1', items: baseItems() } as never), {
      attachTo: document.body,
    });
    // 首帧：`innerId` 还是 null ⇒ 三个属性都不渲染
    expect(at(w.findAll(`.${P}-tab-btn`), 0).attributes('id')).toBeUndefined();
    expect(at(w.findAll('[role="tabpanel"]'), 0).attributes('id')).toBeUndefined();
    await nextTick();
    // 挂载后补上（前缀是 `apollo-tabs-`；上游是 `rc-tabs-`，见 README §2）
    const btn = at(w.findAll(`.${P}-tab-btn`), 0);
    expect(btn.attributes('id')).toMatch(/^apollo-tabs-\d+-tab-1$/);
    expect(btn.attributes('aria-controls')).toMatch(/^apollo-tabs-\d+-panel-1$/);
    w.unmount();
  });

  it('面板：`role=tabpanel` + `aria-hidden` + active 面板 tabIndex 0', () => {
    const w = mountTabs();
    const panels = w.findAll('[role="tabpanel"]');
    expect(at(panels, 0).attributes('aria-hidden')).toBe('false');
    expect(at(panels, 0).attributes('tabindex')).toBe('0');
    expect(at(panels, 0).classes()).toContain(`${P}-content-active`);
    w.unmount();
  });

  it('focus 时才渲染 `aria-live` 播报（文本 `Tab i of n`）', async () => {
    const w = mountTabs();
    expect(w.find('[aria-live="polite"]').exists()).toBe(false);
    await at(w.findAll(`.${P}-tab-btn`), 1).trigger('focus');
    await nextTick();
    const live = w.find('[aria-live="polite"]');
    expect(live.exists()).toBe(true);
    // ⚠️ tabCount 是**启用**页签数、currentPosition 是 1-based
    expect(live.text()).toBe('Tab 2 of 3');
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 状态机
// ---------------------------------------------------------------------------

describe('Tabs · activeKey 与自动重置', () => {
  it('非受控：点页签发 `update:activeKey` + `change`（C11 同发）', async () => {
    const w = mountTabs();
    await at(w.findAll(`.${P}-tab-btn`), 1).trigger('click');
    await nextTick();
    expect(w.emitted('update:activeKey')?.[0]).toEqual(['2']);
    expect(w.emitted('change')?.[0]).toEqual(['2']);
    expect(at(w.findAll(`.${P}-tab`), 1).classes()).toContain(`${P}-tab-active`);
    w.unmount();
  });

  it('受控：不改内部激活项（等 props 更新）', async () => {
    const w = mountTabs({ activeKey: '1' });
    await at(w.findAll(`.${P}-tab-btn`), 1).trigger('click');
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual(['2']);
    expect(at(w.findAll(`.${P}-tab`), 0).classes()).toContain(`${P}-tab-active`);
    w.unmount();
  });

  it('★ 自动重置：删掉**当前**页签 ⇒ 用**旧索引**夹到新长度', async () => {
    const items = baseItems();
    const w = mountTabs({ items, defaultActiveKey: '3' });
    // 删掉最后一个（当前激活的 '3'）⇒ 旧索引 2 夹到新长度 2 ⇒ 取下标 1（'2'）
    await w.setProps({ items: items.slice(0, 2) });
    await nextTick();
    expect(at(w.findAll(`.${P}-tab`), 1).classes()).toContain(`${P}-tab-active`);
    w.unmount();
  });

  it('★ 自动重置：删中间的 ⇒ 旧索引直接命中「后一个」', async () => {
    const items = baseItems();
    const w = mountTabs({ items, defaultActiveKey: '2' });
    // 删掉 '2'（旧索引 1）⇒ 新数组 ['1','3'] 的下标 1 是 '3'
    await w.setProps({ items: [at(items, 0), at(items, 2)] });
    await nextTick();
    expect(at(w.findAll(`.${P}-tab`), 1).classes()).toContain(`${P}-tab-active`);
    w.unmount();
  });

  it('★ 自动重置：删光 ⇒ 一个页签都不剩（`tabs[0]?.key` 是 undefined）', async () => {
    const w = mountTabs({ defaultActiveKey: '1' });
    await w.setProps({ items: [] });
    await nextTick();
    expect(w.findAll(`.${P}-tab-btn`).length).toBe(0);
    w.unmount();
  });

  it('`filterItems`：items 里的非法项被丢掉（不产生 key=undefined 的页签）', () => {
    const w = mountTabs({
      items: [null, 'x', { key: 'ok', label: 'OK', children: 'o' }] as never,
    });
    expect(keysOf(w)).toEqual(['ok']);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 事件
// ---------------------------------------------------------------------------

describe('Tabs · 事件分流', () => {
  it('★ `change` 只在**真的变了**时发；`tabClick` **每次都发**', async () => {
    const w = mountTabs();
    await at(w.findAll(`.${P}-tab-btn`), 0).trigger('click'); // 已激活
    await nextTick();
    expect(w.emitted('tabClick')?.length).toBe(1);
    expect(w.emitted('change')).toBeFalsy();
    expect(w.emitted('update:activeKey')).toBeFalsy();

    await at(w.findAll(`.${P}-tab-btn`), 1).trigger('click');
    await nextTick();
    expect(w.emitted('tabClick')?.length).toBe(2);
    expect(w.emitted('change')?.length).toBe(1);
    w.unmount();
  });

  it('点击 disabled 页签什么都不发', async () => {
    const w = mountTabs({
      items: [
        { key: '1', label: 'A', children: 'a' },
        { key: '2', label: 'B', children: 'b', disabled: true },
      ],
    });
    await at(w.findAll(`.${P}-tab-btn`), 1).trigger('click');
    await nextTick();
    expect(w.emitted('tabClick')).toBeFalsy();
    w.unmount();
  });

  it('`onTabClick` prop 与 emit 都会触发', async () => {
    const onTabClick = vi.fn();
    const w = mountTabs({ onTabClick });
    await at(w.findAll(`.${P}-tab-btn`), 1).trigger('click');
    await nextTick();
    expect(onTabClick).toHaveBeenCalledTimes(1);
    expect(onTabClick.mock.calls[0]?.[0]).toBe('2');
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 键盘
// ---------------------------------------------------------------------------

/** 组件读的是 `e.code`（不是 keyCode）⇒ 用 `code` 构造。 */
const fireKey = (el: Element, code: string): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
};

describe('Tabs · 键盘表', () => {
  it('横向：ArrowRight 在**启用**页签间移动并真的聚焦', async () => {
    const w = mountTabs();
    const first = at(w.findAll(`.${P}-tab-btn`), 0);
    (first.element as HTMLElement).focus();
    await nextTick();
    fireKey(first.element, 'ArrowRight');
    await nextTick();
    expect(at(w.findAll(`.${P}-tab`), 1).classes()).toContain(`${P}-tab-focus`);
    expect(document.activeElement).toBe(at(w.findAll(`.${P}-tab-btn`), 1).element);
    w.unmount();
  });

  it('横向：ArrowLeft 从第 1 项**环形**到最后一项（跳过 disabled）', async () => {
    const w = mountTabs({
      items: [
        { key: '1', label: 'A', children: 'a' },
        { key: '2', label: 'B', children: 'b', disabled: true },
        { key: '3', label: 'C', children: 'c' },
      ],
    });
    const first = at(w.findAll(`.${P}-tab-btn`), 0);
    (first.element as HTMLElement).focus();
    await nextTick();
    fireKey(first.element, 'ArrowLeft');
    await nextTick();
    // 启用列表是 ['1','3']，index 0 − 1 + 2 = 1 ⇒ '3'
    expect(at(w.findAll(`.${P}-tab`), 2).classes()).toContain(`${P}-tab-focus`);
    w.unmount();
  });

  it('★ 纵向：只有 ArrowUp / ArrowDown 动，且**先 preventDefault**；ArrowLeft 什么都不做', async () => {
    const w = mountTabs({ tabPlacement: 'left' });
    const first = at(w.findAll(`.${P}-tab-btn`), 0);
    (first.element as HTMLElement).focus();
    await nextTick();

    const leftEvent = fireKey(first.element, 'ArrowLeft');
    await nextTick();
    expect(leftEvent.defaultPrevented).toBe(false);
    expect(at(w.findAll(`.${P}-tab`), 1).classes()).not.toContain(`${P}-tab-focus`);

    const downEvent = fireKey(first.element, 'ArrowDown');
    await nextTick();
    expect(downEvent.defaultPrevented).toBe(true);
    expect(at(w.findAll(`.${P}-tab`), 1).classes()).toContain(`${P}-tab-focus`);
    w.unmount();
  });

  it('Home / End 跳到第一个 / 最后一个**启用**页签', async () => {
    const w = mountTabs({
      items: [
        { key: '1', label: 'A', children: 'a' },
        { key: '2', label: 'B', children: 'b' },
        { key: '3', label: 'C', children: 'c', disabled: true },
      ],
    });
    const first = at(w.findAll(`.${P}-tab-btn`), 0);
    fireKey(first.element, 'End');
    await nextTick();
    // 最后一个**启用**的是 '2'（'3' 是 disabled）
    expect(at(w.findAll(`.${P}-tab`), 1).classes()).toContain(`${P}-tab-focus`);

    fireKey(first.element, 'Home');
    await nextTick();
    expect(at(w.findAll(`.${P}-tab`), 0).classes()).toContain(`${P}-tab-focus`);
    w.unmount();
  });

  it('Enter / Space 用 `focusKey ?? activeKey` 触发点击', async () => {
    const w = mountTabs();
    const first = at(w.findAll(`.${P}-tab-btn`), 0);
    // 没有 focusKey ⇒ 回落到 activeKey（'1'，已激活）⇒ 只发 tabClick
    fireKey(first.element, 'Enter');
    await nextTick();
    expect(w.emitted('tabClick')?.length).toBe(1);
    expect(w.emitted('change')).toBeFalsy();

    fireKey(first.element, 'ArrowRight');
    await nextTick();
    fireKey(first.element, 'Space');
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual(['2']);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// editable-card
// ---------------------------------------------------------------------------

describe('Tabs · editable-card', () => {
  const mountEditable = (props: Record<string, unknown> = {}) =>
    mountTabs({
      type: 'editable-card',
      items: [
        { key: '1', label: 'A', children: 'a' },
        { key: '2', label: 'B', children: 'b' },
      ],
      ...props,
    });

  it('★ `onEdit` 的载荷被改写：**remove 传 key、add 传事件**', async () => {
    const onEdit = vi.fn();
    const w = mountEditable({ onEdit });
    await at(w.findAll(`.${P}-tab-remove`), 0).trigger('click');
    await nextTick();
    expect(onEdit.mock.calls[0]?.[0]).toBe('1'); // ← key（字符串）
    expect(onEdit.mock.calls[0]?.[1]).toBe('remove');

    await w.find(`.${P}-nav-add`).trigger('click');
    await nextTick();
    const addCall = onEdit.mock.calls[1];
    expect(addCall?.[1]).toBe('add');
    expect(typeof addCall?.[0]).toBe('object'); // ← 事件对象（不是 key）
    expect(addCall?.[0]).toHaveProperty('type', 'click');
    w.unmount();
  });

  it('`hideAdd` ⇒ 不渲染「+」按钮；remove 按钮的 tabIndex 用 **active** 判据', () => {
    const hidden = mountEditable({ hideAdd: true });
    expect(hidden.find(`.${P}-nav-add`).exists()).toBe(false);
    hidden.unmount();

    const w = mountEditable();
    expect(w.find(`.${P}-nav-add`).exists()).toBe(true);
    const removes = w.findAll(`.${P}-tab-remove`);
    expect(at(removes, 0).attributes('tabindex')).toBe('0'); // active
    expect(at(removes, 1).attributes('tabindex')).toBe('-1');
    w.unmount();
  });

  it('`closable: false` 的项不带删除按钮；`-with-remove` 只在可删时出现', () => {
    const w = mountEditable({
      items: [
        { key: '1', label: 'A', children: 'a', closable: false },
        { key: '2', label: 'B', children: 'b' },
      ],
    });
    expect(at(w.findAll(`.${P}-tab`), 0).classes()).not.toContain(`${P}-tab-with-remove`);
    expect(at(w.findAll(`.${P}-tab`), 1).classes()).toContain(`${P}-tab-with-remove`);
    expect(w.findAll(`.${P}-tab-remove`).length).toBe(1);
    w.unmount();
  });

  it('非 editable-card 时没有删除按钮（即使 item 传了 closable）', () => {
    const w = mountTabs({ items: [{ key: '1', label: 'A', children: 'a', closable: true }] });
    expect(w.findAll(`.${P}-tab-remove`).length).toBe(0);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 面板
// ---------------------------------------------------------------------------

describe('Tabs · 面板的渲染与卸载', () => {
  it('`forceRender` ⇒ 未激活也渲染，但 `aria-hidden=true` 且 `tabindex=-1`', () => {
    const w = mountTabs({
      items: [
        { key: '1', label: 'A', children: 'a' },
        { key: '2', label: 'B', children: 'b', forceRender: true },
      ],
    });
    const panels = w.findAll('[role="tabpanel"]');
    expect(panels.length).toBe(2);
    expect(at(panels, 1).attributes('aria-hidden')).toBe('true');
    expect(at(panels, 1).attributes('tabindex')).toBe('-1');
    expect(at(panels, 1).text()).toBe('b');
    w.unmount();
  });

  it('未 `forceRender` 的未激活面板不进 DOM', () => {
    const w = mountTabs();
    expect(w.findAll('[role="tabpanel"]').length).toBe(1);
    w.unmount();
  });

  it('★ `destroyOnHidden` ⇒ 离场后**卸载**（轮询，PITFALLS 179）', async () => {
    const w = mountTabs({ destroyOnHidden: true });
    expect(w.findAll('[role="tabpanel"]').length).toBe(1);
    await at(w.findAll(`.${P}-tab-btn`), 1).trigger('click');
    await nextTick();
    // 离场动效结束后才卸载 ⇒ 必须轮询，不能数 tick
    await vi.waitFor(() => {
      const texts = w.findAll('[role="tabpanel"]').map((n) => n.text());
      expect(texts).toContain('P2');
      expect(texts).not.toContain('P1');
    });
    w.unmount();
  });

  it('不传 `destroyOnHidden` ⇒ 离场面板留在 DOM（`-content-hidden` 残骸）', async () => {
    const w = mountTabs();
    await at(w.findAll(`.${P}-tab-btn`), 1).trigger('click');
    await nextTick();
    const texts = w.findAll('[role="tabpanel"]').map((n) => n.text());
    expect(texts).toContain('P1');
    expect(texts).toContain('P2');
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// ConfigProvider
// ---------------------------------------------------------------------------

describe('Tabs · ConfigProvider 合并', () => {
  const withConfig = (
    tabsConfig: Record<string, unknown>,
    props: Record<string, unknown> = {},
    extraProvide: Record<symbol, unknown> = {},
  ) =>
    mountTabs(props, {
      provide: {
        [configContextKey as symbol]: {
          ...DEFAULT_CONFIG_CONTEXT,
          components: { tabs: tabsConfig },
        },
        ...extraProvide,
      } as unknown as Record<symbol, unknown>,
    });

  it('★ `size` 走的是 **SizeContext**（不是 `components.tabs` 分片）；props 优先', () => {
    // ⚠️ antd 的 `useSize` 读的是 `SizeContext`（`componentSize`），
    //    `components.tabs.size` **不参与** —— 与 `more.icon` 等通道不同（避免测错对象）
    const fromCtx = withConfig(
      {},
      {},
      { [sizeContextKey as symbol]: computed(() => 'large' as const) },
    );
    expect(fromCtx.classes()).toContain(`${P}-large`);
    fromCtx.unmount();

    const overridden = withConfig(
      {},
      { size: 'small' },
      { [sizeContextKey as symbol]: computed(() => 'large' as const) },
    );
    expect(overridden.classes()).toContain(`${P}-small`);
    expect(overridden.classes()).not.toContain(`${P}-large`);
    overridden.unmount();
  });

  it('★ `more.icon` 的四级优先：`props.more.icon` > `context.more.icon` > `context.moreIcon` > `props.moreIcon`', () => {
    // ⚠️ 注意优先级方向（antd 逐字）：**context 在 deprecated 的 `moreIcon` prop 之前**
    //    —— 写成「prop 优先」是错的（L2 的这条用例就是那条判据的哨兵）。
    const fromCtx = withConfig({ more: { icon: h('i', { class: 'ctx-more' }) } });
    expect(fromCtx.find(`.${P}-nav-more .ctx-more`).exists()).toBe(true);
    fromCtx.unmount();

    // context.more.icon 胜过 props.moreIcon（后者是 deprecated 通道）
    const ctxWins = withConfig(
      { more: { icon: h('i', { class: 'ctx-more' }) } },
      { moreIcon: h('i', { class: 'prop-more' }) },
    );
    expect(ctxWins.find(`.${P}-nav-more .ctx-more`).exists()).toBe(true);
    expect(ctxWins.find(`.${P}-nav-more .prop-more`).exists()).toBe(false);
    ctxWins.unmount();

    // `props.more.icon` 最高（它在展开时覆盖前面算出的 icon）
    const propMore = withConfig(
      { more: { icon: h('i', { class: 'ctx-more' }) } },
      { more: { icon: h('i', { class: 'prop-more' }) } },
    );
    expect(propMore.find(`.${P}-nav-more .prop-more`).exists()).toBe(true);
    expect(propMore.find(`.${P}-nav-more .ctx-more`).exists()).toBe(false);
    propMore.unmount();
  });

  it('`indicator.align` 来自 context（`start` 时**不加** transform）', () => {
    const w = withConfig({ indicator: { align: 'start' } });
    const style = w.find(`.${P}-ink-bar`).attributes('style') ?? '';
    expect(style).not.toContain('translateX');
    w.unmount();
  });

  it('`removeIcon` 来自 context', () => {
    const w = withConfig(
      { removeIcon: h('i', { class: 'ctx-remove' }) },
      { type: 'editable-card' },
    );
    expect(w.find(`.${P}-tab-remove .ctx-remove`).exists()).toBe(true);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 语义槽与插槽
// ---------------------------------------------------------------------------

describe('Tabs · 语义槽与插槽', () => {
  it('`classNames` 落到 root / item / indicator / body / content', () => {
    const w = mountTabs({
      classNames: {
        root: 'c-root',
        item: 'c-item',
        indicator: 'c-indicator',
        body: 'c-body',
        content: 'c-content',
      },
    });
    expect(w.classes()).toContain('c-root');
    expect(at(w.findAll(`.${P}-tab`), 0).classes()).toContain('c-item');
    expect(w.find(`.${P}-ink-bar`).classes()).toContain('c-indicator');
    expect(w.find(`.${P}-body`).classes()).toContain('c-body');
    expect(w.find(`.${P}-content`).classes()).toContain('c-content');
    w.unmount();
  });

  it('★ `classNames.popup` 是**嵌套形状**（`{ root }`），但传给内部时**展平**', () => {
    const w = mountTabs({ classNames: { popup: { root: 'c-popup' } } });
    // 展平失败最典型的症状是「把对象当类名用」⇒ 出现 `[object Object]`
    expect(w.html()).not.toContain('[object Object]');
    expect(w.find(`.${P}-nav-operations`).exists()).toBe(true);
    w.unmount();
  });

  it('`styles.header` 落到 `-nav` 的内联 style', () => {
    const w = mountTabs({ styles: { header: { background: 'rgb(1, 2, 3)' } } });
    expect(w.find(`.${P}-nav`).attributes('style') ?? '').toContain('rgb(1, 2, 3)');
    w.unmount();
  });

  it('`#extra` 槽按 position 参数分别渲染左右两侧', () => {
    const w = mountTabs(
      {},
      {
        slots: {
          extra: ({ position }: { position: string }) =>
            h('b', { class: `extra-${position}` }, position),
        },
      },
    );
    expect(w.findAll(`.${P}-extra-content`).length).toBe(2);
    expect(w.find('.extra-left').exists()).toBe(true);
    expect(w.find('.extra-right').exists()).toBe(true);
    w.unmount();
  });

  it('`tabBarExtraContent` 两形态：单节点 ⇒ 右侧；`{left,right}` ⇒ 两侧', () => {
    const single = mountTabs({ tabBarExtraContent: h('i', { class: 'only-right' }) });
    expect(single.find(`.${P}-extra-content`).html()).toContain('only-right');
    single.unmount();

    const split = mountTabs({
      tabBarExtraContent: { left: h('i', { class: 'L' }), right: h('i', { class: 'R' }) },
    });
    expect(split.find('.L').exists()).toBe(true);
    expect(split.find('.R').exists()).toBe(true);
    split.unmount();
  });

  it('`#tabBar` 槽替代整个导航区（内置 nav 不再渲染，面板区仍在）', () => {
    const w = mountTabs(
      {},
      {
        slots: {
          tabBar: (props: { activeKey?: string }) =>
            h('div', { class: 'custom-bar' }, `active=${props.activeKey ?? ''}`),
        },
      },
    );
    expect(w.find('.custom-bar').text()).toBe('active=1');
    expect(w.find(`.${P}-nav`).exists()).toBe(false);
    expect(w.find('[role="tabpanel"]').exists()).toBe(true);
    w.unmount();
  });
});
