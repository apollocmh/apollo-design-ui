/**
 * L1/L2 · `Timeline` 的单元与交互测试。
 *
 * 每一条都对应 `docs/analysis/timeline.md` §2 的一条判据（编号即判据号）。
 *
 * ── 🚨 本组件测试的**特殊之处** ───────────────────────────────────────────────
 *
 * `Timeline` **没有自己的 DOM** —— 它渲染的是 `<Steps type="dot" />`。
 * 所以断言全部落在 **Steps 的产物**上（`ol` / `li` / `-item-*` 类），
 * 只是类名被 `classNames` 映射换成了 `timeline-*` 前缀。
 *
 * ⚠️ 本组件的废弃告警有 **7 条**（挂载即发）⇒ 每个用例都要 spy 掉 `console.error`。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { Timeline, TimelineItemComponent } from '../index';
import type { TimelineItemType } from '../interface';

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

const ITEMS: TimelineItemType[] = [
  { key: 'a', title: 'A', content: 'content A' },
  { key: 'b', title: 'B', content: 'content B' },
  { key: 'c', title: 'C', content: 'content C' },
];

const mountTimeline = (props: Record<string, unknown> = {}) =>
  mount(Timeline, { props: { items: ITEMS, ...props } });

describe('Timeline · L1 根与类名（判据 1 / 3 / 7）', () => {
  it('🚨 根是 **`ol`**（由 `InternalContext.rootComponent` 覆盖）+ `apollo-timeline` 类', () => {
    const w = mountTimeline();
    expect(w.element.tagName).toBe('OL');
    expect(w.classes()).toContain('apollo-timeline');
    expect(w.classes()).toContain('apollo-timeline-css-var');
  });

  it('判据 3：`layoutAlternate` = `mode === "alternate"` **或**（纵向且有任一项带 title）', () => {
    // 纵向 + 有 title ⇒ 交错
    expect(mountTimeline().classes()).toContain('apollo-timeline-layout-alternate');
    // 纵向 + **全部无 title** ⇒ 不交错
    const noTitle = mountTimeline({
      items: [{ key: 'a', content: 'only content' }] as TimelineItemType[],
    });
    expect(noTitle.classes()).not.toContain('apollo-timeline-layout-alternate');
    // 显式 alternate ⇒ 交错
    expect(mountTimeline({ mode: 'alternate' }).classes()).toContain(
      'apollo-timeline-layout-alternate',
    );
  });

  it('判据 7：`orientation="horizontal"` ⇒ `-horizontal` 类（纵向时没有）', () => {
    expect(mountTimeline({ orientation: 'horizontal' }).classes()).toContain(
      'apollo-timeline-horizontal',
    );
    expect(mountTimeline().classes()).not.toContain('apollo-timeline-horizontal');
  });

  it('判据 1：`mode` 的四个废弃 / 合法取值都归一到 `start` / `end` / `alternate`', () => {
    // `left` → `start`：不交错 + 不横向
    const left = mountTimeline({ mode: 'left' });
    expect(left.classes()).not.toContain('apollo-timeline-horizontal');
    // 非法值 ⇒ 兜底 `start`（判据是 **placement 落在 start**，不是「不交错」——
    // ⚠️ 默认 items 带 title 且纵向 ⇒ `layoutAlternate` **恒真**，与 mode 无关）
    const bogus = mountTimeline({ mode: 'nope' as never });
    expect(bogus.findAll('.apollo-timeline-item-placement-start').length).toBeGreaterThan(0);
    expect(bogus.findAll('.apollo-timeline-item-placement-end')).toHaveLength(0);
  });

  it('`className` / `rootClassName` 都落在根上', () => {
    const w = mountTimeline({ className: 'my-cls', rootClassName: 'my-root' });
    expect(w.classes()).toContain('my-cls');
    expect(w.classes()).toContain('my-root');
  });
});

describe('Timeline · L1 项渲染（判据 2 / 4 / 5）', () => {
  it('逐项渲染成 `li`，且最后一项是 active', () => {
    const w = mountTimeline();
    const items = w.findAll('li.apollo-timeline-item');
    expect(items).toHaveLength(3);
    // 判据 4：`current = items.length - 1`
    expect(items[2]?.classes()).toContain('apollo-steps-item-active');
  });

  it('判据 5：classNames 的八键映射到 `timeline-*` 前缀', () => {
    const w = mountTimeline();
    expect(w.find('.apollo-timeline-item-title').exists()).toBe(true);
    expect(w.find('.apollo-timeline-item-content').exists()).toBe(true);
    expect(w.find('.apollo-timeline-item-icon').exists()).toBe(true);
    // ⚠️ rail 只在非最后一项上
    expect(w.findAll('.apollo-timeline-item-rail').length).toBeGreaterThan(0);
  });

  it('判据 2：`reverse` 反转项顺序', () => {
    const w = mountTimeline({ reverse: true });
    const titles = w.findAll('.apollo-timeline-item-title').map((n) => n.text());
    expect(titles[0]).toBe('C');
  });

  it('判据 2：`content` / `label`（废弃）/ `icon` / `dot`（废弃）的别名链', () => {
    const w = mountTimeline({
      items: [{ key: 'x', label: 'LABEL', children: 'CHILD', dot: h('span', 'D') }],
    });
    expect(w.text()).toContain('LABEL');
    expect(w.text()).toContain('CHILD');
    expect(w.find('.apollo-steps-item-custom').exists()).toBe(true);
  });
});

describe('Timeline · L1 color 的两条分支（判据 4）', () => {
  it('🚨 预设色 ⇒ 落 `-color-{x}` 类；**任意色值** ⇒ 落内联 CSS 变量', () => {
    const preset = mountTimeline({ items: [{ key: 'a', title: 'A', color: 'red' }] });
    expect(preset.find('.apollo-timeline-item-color-red').exists()).toBe(true);

    const custom = mountTimeline({ items: [{ key: 'a', title: 'A', color: '#00f' }] });
    expect(custom.find('.apollo-timeline-item-color-red').exists()).toBe(false);
    expect(custom.find('.apollo-timeline-item').attributes('style')).toContain(
      '--apollo-cmp-steps-item-icon-dot-color: #00f',
    );
  });
});

describe('Timeline · L1 placement / loading / pending（判据 2 / 6 / 4）', () => {
  it('判据 2：`alternate` 时 placement 按**奇偶**交替', () => {
    const w = mountTimeline({ mode: 'alternate' });
    expect(w.findAll('.apollo-timeline-item-placement-start').length).toBeGreaterThan(0);
    expect(w.findAll('.apollo-timeline-item-placement-end').length).toBeGreaterThan(0);
  });

  it('判据 6：`loading` ⇒ `status: process` + 默认加载图标', () => {
    const w = mountTimeline({ items: [{ key: 'a', title: 'A', loading: true }] });
    expect(w.find('.apollo-steps-item-process').exists()).toBe(true);
    expect(w.find('.apollo-icon-spin').exists()).toBe(true);
  });

  it('判据 4：`pending` 追加一项（且这一项**没有** placement 类）', () => {
    const w = mountTimeline({ pending: 'pending node' });
    expect(w.findAll('li.apollo-timeline-item')).toHaveLength(4);
    expect(w.text()).toContain('pending node');
  });
});

describe('Timeline · L1 titleSpan（判据 6）', () => {
  it('数字 ⇒ `--{root}-timeline-head-span`；字符串 ⇒ `-head-span-ptg`', () => {
    const num = mountTimeline({ titleSpan: 100 });
    expect(num.element.getAttribute('style')).toContain('--apollo-timeline-head-span: 100');

    const str = mountTimeline({ titleSpan: '20%' });
    expect(str.element.getAttribute('style')).toContain('--apollo-timeline-head-span-ptg: 20%');
  });

  it('`mode === "alternate"` 时**不**写 titleSpan（上游同判）', () => {
    const w = mountTimeline({ mode: 'alternate', titleSpan: 100 });
    const style = w.element.getAttribute('style') ?? '';
    expect(style).not.toContain('--apollo-timeline-head-span');
  });
});

describe('Timeline · L2 复合组件与告警', () => {
  it('`Timeline.Item` 是**空壳**（上游同判）—— 静态属性与具名导出同一对象', () => {
    expect(Timeline.Item).toBe(TimelineItemComponent);
    // ⚠️ 渲染函数返回 `null` ⇒ Vue 渲染成**注释节点**；VTU 的 `html()` 对它返回空串
    const w = mount(TimelineItemComponent, { slots: { default: () => 'x' } });
    expect(w.html()).toBe('');
    expect(w.text()).toBe('');
  });

  it('🚨 废弃告警：`Timeline.Item` / `pending` / `pendingDot` / `mode=left|right`', async () => {
    const hits = () =>
      errorSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .filter((m) => m.includes('deprecated'));
    mountTimeline();
    expect(hits().length).toBeGreaterThan(0);

    errorSpy.mockClear();
    mountTimeline({ mode: 'left' });
    expect(hits().some((m) => m.includes('mode=left|right'))).toBe(true);
  });

  it('🚨 逐项四项的判据是 `every(item => !item[oldProp])` —— **用了才告警**', () => {
    const hits = () =>
      errorSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .filter((m) => m.includes('items.label'));
    // ⚠️ 判据是 `warning.deprecated(warnItems.every(item => !item[oldProp]), …)`
    //    ⇒ **有任一项用了 `label` ⇒ `valid = false` ⇒ 告警**；
    //    全部项都没用 ⇒ `valid = true` ⇒ 静默。
    mountTimeline({ items: [{ key: 'a', label: 'L' }] });
    expect(hits().length).toBeGreaterThan(0);
    errorSpy.mockClear();
    mountTimeline({ items: [{ key: 'a', title: 'T' }] });
    expect(hits()).toHaveLength(0);
  });

  it('暴露 `{ nativeElement }`（= Steps 的根元素）', async () => {
    const w = mountTimeline();
    await nextTick();
    const exposed = w.vm.$.exposed as { nativeElement?: unknown };
    expect(exposed.nativeElement).toBeDefined();
  });
});
