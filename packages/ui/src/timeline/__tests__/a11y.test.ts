/**
 * L5 无障碍 —— Timeline 的 role/ARIA 契约与 axe 扫描。
 *
 * ── 判据（antd 6.6.4）────────────────────────────────────────────────────────
 *
 * | 项 | 判据 | 出处 |
 * |---|---|---|
 * | 根 | **`<ol>`**（由 `InternalContext.rootComponent` 覆盖 Steps 的 `div`） | `Timeline.tsx:19-22` |
 * | 项 | **`<li>`**（由 `itemComponent` 覆盖） | 同上 |
 * | 图标 | 圆点是 `<span role="img">`，**无可访问名** | rc-steps 的 `StepIcon`（上游同判） |
 * | 文本 | `title` / `content` 都是普通文本节点 | — |
 *
 * ⚠️ **本组件最重要的 a11y 事实**：它把 Steps 从 `<div>` 改造成**真 `<ol>` + `<li>`**
 * ⇒ **列表语义由原生元素承担**，组件自己一个 `role` / `aria-*` 都不加。
 * 钉住它才能防止后来者「顺手加个 `role="list"`」而改变读屏行为。
 *
 * ⚠️ **本组件的废弃告警有 7 条**（挂载即发）⇒ 统一 spy 掉 `console.error`。
 * ⚠️ **`axe.run()` 不能与 `vi.useFakeTimers()` 共存**（PITFALLS 268）。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Timeline } from '../index';
import type { TimelineItemType } from '../interface';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function runAxe(): Promise<axe.Result[]> {
  const results = await axe.run(document.body, { runOnly: { type: 'tag', values: TAGS } });
  return results.violations;
}

const ITEMS: TimelineItemType[] = [
  { key: 'a', title: 'A', content: 'content A' },
  { key: 'b', title: 'B', content: 'content B' },
];

const mountA11y = async (props: Record<string, unknown> = {}): Promise<VueWrapper> => {
  const wrapper = mount(Timeline, { props: { items: ITEMS, ...props }, attachTo: document.body });
  await nextTick();
  return wrapper;
};

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  document.body.innerHTML = '';
  errorSpy.mockRestore();
});

describe('Timeline · role / ARIA 契约（L5）', () => {
  it('🚨 根是**真 `<ol>`**（列表语义由原生元素承担，不是 `role="list"`）', async () => {
    const w = await mountA11y();
    expect(w.element.tagName).toBe('OL');
    expect(w.element.getAttribute('role')).toBeNull();
  });

  it('项是**真 `<li>`**', async () => {
    const w = await mountA11y();
    const items = w.findAll('li.apollo-timeline-item');
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.element.getAttribute('role')).toBeNull();
    }
  });

  it('🚨 Timeline **自己**不加任何 `aria-*`（带 `apollo-timeline` 类的元素上为零）', async () => {
    const w = await mountA11y({ titleSpan: 100, reverse: true });
    const root = w.element as HTMLElement;
    const own: HTMLElement[] = [
      root,
      ...Array.from(root.querySelectorAll<HTMLElement>('*')),
    ].filter((el) => Array.from(el.classList).some((c) => c.startsWith('apollo-timeline')));
    expect(own.length).toBeGreaterThan(3);
    for (const el of own) {
      expect(
        el.getAttributeNames().filter((n: string) => n.startsWith('aria-')),
        `${el.className} 不应带 aria-*`,
      ).toEqual([]);
    }
  });

  it('`title` / `content` 都是普通文本（可被读屏按列表项读出）', async () => {
    const w = await mountA11y();
    expect(w.find('.apollo-timeline-item-title').text()).toBe('A');
    expect(w.find('.apollo-timeline-item-content').text()).toBe('content A');
  });

  it('`Timeline.Item` 是空壳 ⇒ 渲染成注释节点、不产生可聚焦元素', async () => {
    const w = await mountA11y({ pending: 'pending' });
    // `pending` 追加的一项**没有** placement 类（上游同判）
    expect(w.findAll('li.apollo-timeline-item')).toHaveLength(3);
    expect(w.findAll('button, a[href], input').length).toBe(0);
  });
});

/** 扫描用例。⚠️ 必须**显式标注类型**（`it.each` 直接推断会得到隐式 any 的返回类型）。 */
interface A11yScanCase {
  name: string;
  props: Record<string, unknown>;
}

const SCAN_CASES: A11yScanCase[] = [
  { name: 'basic（纵向 + 交错）', props: {} },
  { name: '纵向单侧（无 title ⇒ 不交错）', props: { items: [{ key: 'a', content: 'c' }] } },
  { name: '横向', props: { orientation: 'horizontal' } },
  { name: 'alternate', props: { mode: 'alternate', items: [ITEMS[0], ITEMS[1], ITEMS[0]] } },
  { name: 'titleSpan', props: { titleSpan: '30%' } },
  {
    name: '自定义颜色（预设 + 任意色值）',
    props: { items: [{ key: 'a', title: 'A', color: '#00f' }] },
  },
  { name: 'loading', props: { items: [{ key: 'a', title: 'A', loading: true }] } },
  { name: 'pending', props: { pending: 'pending node' } },
  { name: 'reverse', props: { reverse: true } },
  { name: '空 items', props: { items: [] } },
];

describe('Timeline · axe 扫描（L5）', () => {
  it.each(SCAN_CASES)('$name 无 axe violation', async ({ props }) => {
    const w = await mountA11y(props);

    const violations = await runAxe();
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.length}`),
      `axe 违规（${w.html().slice(0, 240)}…）`,
    ).toEqual([]);
  });
});
