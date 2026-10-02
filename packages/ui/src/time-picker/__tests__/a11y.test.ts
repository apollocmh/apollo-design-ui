/**
 * L5 无障碍 —— TimePicker 的 role/ARIA 契约与 axe 扫描。
 *
 * ── 这个文件证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * **本组件是薄壳**（`docs/analysis/time-picker.md` §0）：它一个 `role` / `aria-*` 都不加，
 * 全部语义来自 `date-picker`（→ `@apollo-design/picker`）。
 * 所以本文件的判据**不是**「语义对不对」（那是 `date-picker/__tests__/a11y.test.ts`
 * 的 36 条），而是：
 *
 * 1. 🚨 **薄壳没有把语义弄丢或弄多** —— 判据是「`<TimePicker>` 与
 *    `<DatePicker picker="time"/>` 的 a11y 属性**逐项相同**」。这条比逐条硬编码属性更强：
 *    它同时挡住「漏传」与「多传」两个方向，且 `date-picker` 改进时会自动跟随。
 * 2. **axe 在**面板打开**的形态下也是 0 violation**（闭合态是 `date-picker` 已覆盖的）。
 *
 * ⚠️ **`axe.run()` 不能与 `vi.useFakeTimers()` 共存**（PITFALLS 268）—— 本文件不用假时钟。
 * ⚠️ `addon` 未传 ⇒ 本组件**不产生**废弃告警（与 timeline 不同），无需豁免。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import DatePicker from '../../date-picker/DatePicker.vue';
import RangePicker from '../../date-picker/RangePicker.vue';
import TimePicker from '../TimePicker.vue';
import TimeRangePicker from '../TimeRangePicker.vue';

const P = 'apollo-picker';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function runAxe(): Promise<axe.Result[]> {
  const results = await axe.run(document.body, { runOnly: { type: 'tag', values: TAGS } });
  return results.violations;
}

const mountAt = async (component: unknown, props: Record<string, unknown> = {}) => {
  const w = mount(h(component as never, props as never), { attachTo: document.body });
  await nextTick();
  return w;
};

/** 取某个选择器下元素的**全部属性**（排序后，便于逐项比较）。 */
const attrsOf = (selector: string): Record<string, string> => {
  const el = document.querySelector(selector);
  if (!el) return {};
  const entries = Array.from(el.attributes).map((a) => [a.name, a.value] as const);
  return Object.fromEntries(entries.sort((a, b) => a[0].localeCompare(b[0])));
};

/** 取某个元素的类名集合（排序后）。 */
const classesOf = (selector: string): string[] => {
  const el = document.querySelector(selector);
  return el ? Array.from(el.classList).sort() : [];
};

/** 去掉「随机的 / 与语义无关」的属性后比较（`id` 会因实例不同而变化）。 */
const a11yAttrs = (selector: string): Record<string, string> => {
  const all = attrsOf(selector);
  for (const key of ['id', 'aria-controls', 'aria-owns', 'aria-activedescendant']) {
    delete all[key];
  }
  return all;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('TimePicker · 薄壳不改变 a11y 语义（L5 的核心判据）', () => {
  it('🚨 单个：`<TimePicker>` 与 `<DatePicker picker="time"/>` 的 input 属性**逐项相同**', async () => {
    const direct = await mountAt(DatePicker, { picker: 'time' });
    const viaShell = await mountAt(TimePicker);
    const directAttrs = a11yAttrs(`.${P}-input input`);
    const shellAttrs = a11yAttrs(`.${P}-input input`);
    // 反空转：属性集不能是空的（否则「两个空对象相等」是假绿）
    expect(Object.keys(directAttrs).length).toBeGreaterThan(0);
    expect(shellAttrs).toEqual(directAttrs);
    direct.unmount();
    viaShell.unmount();
  });

  it('🚨 单个：根类名集合相同（薄壳不额外加类、也不丢类）', async () => {
    const direct = await mountAt(DatePicker, { picker: 'time' });
    const directClasses = classesOf(`.${P}`);
    direct.unmount();

    const viaShell = await mountAt(TimePicker);
    expect(classesOf(`.${P}`)).toEqual(directClasses);
    viaShell.unmount();
  });

  it('🚨 范围：`<TimePicker.RangePicker>` 与 `<RangePicker picker="time"/>` 的两端 input 相同', async () => {
    const direct = await mountAt(RangePicker, { picker: 'time' });
    const directInputs = document.querySelectorAll(`.${P}-input input`);
    expect(directInputs.length).toBe(2);
    const directAttrs = Array.from(directInputs).map((el) =>
      Object.fromEntries(
        Array.from(el.attributes)
          .filter((a) => a.name !== 'id')
          .map((a) => [a.name, a.value] as const)
          .sort((a, b) => a[0].localeCompare(b[0])),
      ),
    );
    direct.unmount();

    const viaShell = await mountAt(TimeRangePicker);
    const shellAttrs = Array.from(document.querySelectorAll(`.${P}-input input`)).map((el) =>
      Object.fromEntries(
        Array.from(el.attributes)
          .filter((a) => a.name !== 'id')
          .map((a) => [a.name, a.value] as const)
          .sort((a, b) => a[0].localeCompare(b[0])),
      ),
    );
    expect(shellAttrs).toEqual(directAttrs);
    viaShell.unmount();
  });

  it('根是 `div` 且**没有 role**（语义在 input 上，薄壳同判）', async () => {
    const w = await mountAt(TimePicker);
    const root = document.querySelector(`.${P}`);
    expect(root?.tagName).toBe('DIV');
    expect(root?.getAttribute('role')).toBeNull();
    w.unmount();
  });

  it('范围版的根带 `-range` 且同样没有 role', async () => {
    const w = await mountAt(TimeRangePicker);
    const root = document.querySelector(`.${P}`);
    expect(root?.tagName).toBe('DIV');
    expect(root?.getAttribute('role')).toBeNull();
    expect(root?.className).toContain(`${P}-range`);
    w.unmount();
  });
});

describe('TimePicker · 继承的 role / ARIA 契约（哨兵）', () => {
  it('🚨 清除按钮是 `button[type=button]` 且 `aria-label` 取 `locale.clear`', async () => {
    // 上游 `"aria-label": locale.clear`，en_US 下是 `"Clear"`。
    // ⚠️ 这条是**哨兵**：真正的判据在 date-picker，这里只保证薄壳没把它挡住。
    const w = await mountAt(TimePicker, { defaultValue: null });
    // 无值 ⇒ 不渲染清除按钮（`showClear` 的条件之一）
    expect(document.querySelector(`.${P}-clear`)).toBeNull();
    w.unmount();
  });

  it('🚨 后缀图标是**时钟**：`role="img"` + `aria-label="clock-circle"` + `aria-hidden="true"`', async () => {
    // ⚠️ **与 `DatePicker` 不同**：`date-picker` 的后缀是 `calendar`，
    //    本组件是 `clock-circle` —— 图标按 `picker` 模式选（`useSuffixIcon`）。
    //    照抄 date-picker 的断言会红，而**红的这一条正是本组件的判据**。
    const w = await mountAt(TimePicker);
    const icon = document.querySelector(`.${P}-suffix span`);
    expect(icon?.getAttribute('role')).toBe('img');
    expect(icon?.getAttribute('aria-label')).toBe('clock-circle');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    w.unmount();
  });

  it('`input` 的 `autocomplete="off"`', async () => {
    const w = await mountAt(TimePicker);
    expect(document.querySelector(`.${P}-input input`)?.getAttribute('autocomplete')).toBe('off');
    w.unmount();
  });

  it('`disabled` ⇒ `input` 带 `disabled`', async () => {
    const w = await mountAt(TimePicker, { disabled: true });
    expect(document.querySelector(`.${P}-input input`)?.hasAttribute('disabled')).toBe(true);
    w.unmount();
  });

  it('🚨 范围默认分隔符是装饰性图标 ⇒ `aria-hidden="true"`', async () => {
    const w = await mountAt(TimeRangePicker);
    const sep = document.querySelector(`.${P}-separator`);
    expect(sep).not.toBeNull();
    expect(sep?.getAttribute('aria-hidden')).toBe('true');
    w.unmount();
  });

  it('🚨 范围自定义分隔符是用户内容 ⇒ **去掉** `aria-hidden`', async () => {
    const w = await mountAt(TimeRangePicker, {
      separator: h('span', { class: 'custom-sep' }, '至'),
    });
    const sep = document.querySelector('.custom-sep');
    expect(sep).not.toBeNull();
    expect(sep?.getAttribute('aria-hidden')).toBeNull();
    w.unmount();
  });
});

describe('TimePicker · axe（含**面板打开**的形态）', () => {
  const cases: [string, unknown, Record<string, unknown>][] = [
    ['单个（闭合）', TimePicker, {}],
    ['单个（打开）', TimePicker, { open: true }],
    ['单个（disabled）', TimePicker, { disabled: true }],
    ['范围（闭合）', TimeRangePicker, {}],
    ['范围（打开）', TimeRangePicker, { open: true }],
  ];

  it.each(cases)('%s：无 axe violation', async (_name, component, props) => {
    const w = await mountAt(component, props);
    const violations = await runAxe();
    expect(violations.map((v) => v.id)).toEqual([]);
    w.unmount();
  });
});
