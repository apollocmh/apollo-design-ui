/**
 * L5 · 无障碍测试
 *
 * ── Spin 的无障碍面：**加载态声明** + **进度语义** ────────────────────────────
 *
 * 与 Divider（只有一个 `role="separator"`）不同，Spin 有两条**真实的** ARIA 语义：
 *
 *   1. `aria-live="polite"` + `aria-busy` —— 根元素是一个**活动区域**（live region），
 *      加载态变化时屏幕阅读器会**主动播报**。`aria-busy` 跟着内部延迟态走，
 *      所以 `delay` 期间它是 `false`（那段时间本来就还没在加载）。
 *   2. `role="progressbar"` + `aria-valuemin/max/now` —— 有 `percent` 时的进度环。
 *
 * ⚠️ 一处需要明示的**风险**：`aria-live="polite"` 会让根元素里的**任何**变化都被播报，
 *    嵌套用法下 children 的内容更新也在其中。这是 antd 的行为（它把 `aria-live`
 *    写在根元素上），逐字保留，登记在 README §7。
 *
 * ⚠️ 这个测试**没有**证明键盘可达性 —— Spin 没有任何可聚焦元素，也没有键盘交互，
 *    这是「架构上不适用」而不是「没测」（与 Divider 同理，但理由不同：
 *    Divider 是纯展示，Spin 是**状态指示**，状态由 prop 驱动而非用户操作驱动）。
 */

import { a11yDemoTest, flushAll } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Spin } from '../index';

const P = 'apollo-spin';

a11yDemoTest('Spin', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Spin · live region', () => {
  it('根元素是活动区域：aria-live="polite" 且 aria-busy 跟着加载态', () => {
    const spinning = mount(Spin);
    expect(spinning.attributes('aria-live')).toBe('polite');
    expect(spinning.attributes('aria-busy')).toBe('true');

    const idle = mount(Spin, { props: { spinning: false } });
    expect(idle.attributes('aria-live')).toBe('polite');
    expect(idle.attributes('aria-busy')).toBe('false');
  });

  it('★ delay 期间 aria-busy 仍是 false（那时确实还没在加载）', () => {
    const w = mount(Spin, { props: { spinning: true, delay: 5000 } });
    expect(w.attributes('aria-busy')).toBe('false');
  });

  it('所有形态下 aria-live 都不丢', () => {
    const variants: Array<Record<string, unknown>> = [
      {},
      { size: 'small' },
      { size: 'large' },
      { fullscreen: true },
      { description: 'Loading...' },
      { percent: 50 },
      { percent: 'auto' },
      { indicator: h('span') },
    ];
    for (const props of variants) {
      expect(mount(Spin, { props }).attributes('aria-live'), JSON.stringify(props)).toBe('polite');
    }
  });

  it('★ 用户传的 aria-live / aria-busy **会**覆盖组件的值（antd 的展开顺序）', () => {
    // 这不是「bug 复刻」而是**可访问性上的必要逃生口**：
    // 嵌套用法下如果不允许用户关掉 live region，children 的每次更新都会被播报。
    const w = mount(Spin, { attrs: { 'aria-live': 'off' } });
    expect(w.attributes('aria-live')).toBe('off');
  });
});

describe('Spin · 进度语义', () => {
  it('有 percent 时进度环是 role="progressbar"，且三件套齐全', async () => {
    const w = mount(Spin, { props: { percent: 42 } });
    // 进度环在挂载后的第二帧才出现（`flush: 'post'`，与 React 的 useLayoutEffect 同构）
    await flushAll();
    const bar = w.find('[role="progressbar"]');
    expect(bar.exists()).toBe(true);
    expect(bar.attributes('aria-valuemin')).toBe('0');
    expect(bar.attributes('aria-valuemax')).toBe('100');
    expect(bar.attributes('aria-valuenow')).toBe('42');
  });

  it('★ aria-valuenow 被钳到 [0, 100]：负数不会输出成 -50', async () => {
    const w = mount(Spin, { props: { percent: -50 } });
    await flushAll();
    expect(w.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0');
  });

  it('percent=0 时**不**输出 progressbar（不制造一个「0% 完成」的假声明）', async () => {
    const w = mount(Spin, { props: { percent: 0 } });
    await flushAll();
    expect(w.find('[role="progressbar"]').exists()).toBe(false);
  });

  it('装饰性的四点与 svg 都不抢焦点：没有 tabindex，没有 aria-hidden 之外的角色', () => {
    const w = mount(Spin);
    for (const el of w.findAll('*')) {
      expect(el.attributes('tabindex')).toBeUndefined();
    }
    // 四点本身是纯装饰，但 antd **没有**给它们 `aria-hidden`；
    // 逐字对齐（L4 会红），登记在 README §7。
    expect(w.find(`.${P}-dot-holder`).attributes('aria-hidden')).toBeUndefined();
  });
});

describe('Spin · 文案', () => {
  it('description 是纯文本节点，没有额外的 role（靠 live region 播报）', () => {
    const w = mount(Spin, { props: { description: 'Loading...' } });
    const desc = w.find(`.${P}-description`);
    expect(desc.text()).toBe('Loading...');
    expect(desc.attributes('role')).toBeUndefined();
  });

  it('★ 结构上是 div（不是 span / output）—— 与 antd 一致，不假装是 landmark', () => {
    const w = mount(Spin, { slots: { default: () => 'content' } });
    expect(w.element.tagName).toBe('DIV');
    expect(w.attributes('role')).toBeUndefined();
  });
});
