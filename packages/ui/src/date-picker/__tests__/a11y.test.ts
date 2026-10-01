/**
 * L5 无障碍 —— DatePicker 的 role/ARIA 契约与 axe 扫描（单值 + 范围）。
 *
 * ── 判据（antd 6.6.4 = rc-picker@1.12.2）──────────────────────────────────────
 *
 * | 项 | 判据 | 出处 |
 * |---|---|---|
 * | 根 | `div`（**没有 role**） | `SingleSelector` 的根 |
 * | 输入框 | `input[aria-invalid="false"]` —— 🚨 **`status="error"` 也不改**（实测） | SSR dump |
 * | 清除按钮 | `button[type="button"]` + `aria-label`（取 **`locale.clear`**，en_US 是 `"Clear"`） | `ClearIcon.js` |
 * | 后缀图标 | `span[role="img"][aria-label="calendar"][aria-hidden="true"]` | `create-icon` + `useSuffixIcon` |
 * | 🚨 分隔符 | **默认**（图标）带 `aria-hidden="true"`；**自定义**（文本）**去掉**它 | `RangeSelector` 的 `separator` 分支 |
 *
 * ── 为什么这些必须进 L5（而不是只看 L4）────────────────────────────────────────
 *
 * L4 钉的是**静态 DOM 逐字**；L5 钉的是**可访问性语义**（axe 的可达性树判定）。
 * 两者的失败模式不同：L4 会因「少一个类名」红，L5 会因「引用了不存在的 id」、
 * 「交互元素不可达」红。**两条都跑才算钉住**。
 *
 * ── 范围版（S5 已补）─────────────────────────────────────────────────────────
 *
 * 含**上游两条专门的 separator a11y 测试**（默认带 `aria-hidden` / 自定义去掉它）。
 * 🚨 这两条**只能进 L5 不能只进 L4**：`aria-hidden` 是**可访问性**语义 ——
 * 默认分隔符是个装饰性图标，对读屏器必须隐藏；用户给了文本（如 `→`、`至`）时
 * 那是**有意义的内容**，必须让 AT 读到。判据来自上游 `RangeSelector` 的分支。
 *
 * - 浮层内（面板）的 role/ARIA 由 `@apollo-design/picker` 的 L5 负责 ——
 *   SSR 下浮层不渲染，本文件不重复钉。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import DatePicker from '../DatePicker.vue';
import RangePicker from '../RangePicker.vue';

const P = 'apollo-picker';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** 挂到真实文档（axe 与 `.focus()` 都要求元素在文档里）。 */
const mountA11y = (props: Record<string, unknown> = {}) =>
  mount(h(DatePicker as never, props as never), { attachTo: document.body });

/** 范围版同上。 */
const mountRangeA11y = (props: Record<string, unknown> = {}) =>
  mount(h(RangePicker as never, props as never), { attachTo: document.body });

describe('DatePicker · role / ARIA 契约（L5）', () => {
  it('根是 `div` 且**没有 role**（语义在 input 上）', () => {
    const w = mount(DatePicker);
    const root = w.find(`.${P}`);
    expect(root.element.tagName).toBe('DIV');
    expect(root.attributes('role')).toBeUndefined();
    w.unmount();
  });

  it('🚨 `input[aria-invalid="false"]` —— `status="error"` **也不改**它', () => {
    // 实测：`status` 只加根类名 `-status-error`，不动 `aria-invalid`
    // ⚠️ 用 `as const` 让三个值保持**字面量**类型（`undefined | 'error' | 'warning'`
    //    正好是 `DatePickerStatus | undefined`）；写成对象数组的 `as const` 会引入
    //    `readonly`，与 `mount` 的 props 类型不兼容（TS2322）。
    for (const status of [undefined, 'error', 'warning'] as const) {
      const w = mount(DatePicker, { props: { status } });
      expect(w.find(`.${P}-input input`).attributes('aria-invalid')).toBe('false');
      w.unmount();
    }
  });

  it('清除按钮是 `button[type=button]` 且 `aria-label` 取 **`locale.clear`**', () => {
    const w = mount(DatePicker, { props: { defaultValue: dayjs('2026-09-30') } });
    const clear = w.find(`.${P}-clear`);
    expect(clear.element.tagName).toBe('BUTTON');
    expect(clear.attributes('type')).toBe('button');
    // 🚨 上游是 `"aria-label": locale.clear` —— en_US 默认语言包下是 `"Clear"`。
    //    写成字面量 `"Clear"` 会在换语言包时静默不一致（这正是它进 L5 的理由）。
    expect(clear.attributes('aria-label')).toBe('Clear');
    w.unmount();
  });

  it('无值时**没有**清除按钮（`showClear` 的三条条件之一）', () => {
    const w = mount(DatePicker);
    expect(w.find(`.${P}-clear`).exists()).toBe(false);
    w.unmount();
  });

  it('后缀图标：`role="img"` + `aria-label="calendar"` + `aria-hidden="true"`', () => {
    // ⚠️ 这两个属性看着矛盾（既有可访问名又对 AT 隐藏），但那是**上游逐字产物**
    //    （`useSuffixIcon` 传 `aria-hidden`，`create-icon` 给 `role=img` + `aria-label`）。
    const w = mount(DatePicker);
    const icon = w.find(`.${P}-suffix span`);
    expect(icon.attributes('role')).toBe('img');
    expect(icon.attributes('aria-label')).toBe('calendar');
    expect(icon.attributes('aria-hidden')).toBe('true');
    w.unmount();
  });

  it('`disabled` ⇒ `input` 带 `disabled`（且不渲染清除按钮）', () => {
    const w = mount(DatePicker, { props: { disabled: true, defaultValue: dayjs('2026-09-30') } });
    expect(w.find(`.${P}-input input`).attributes('disabled')).toBeDefined();
    expect(w.find(`.${P}-clear`).exists()).toBe(false);
    w.unmount();
  });

  it('`input` 的 `autocomplete="off"`（上游实测，避免浏览器自动填充干扰）', () => {
    const w = mount(DatePicker);
    expect(w.find(`.${P}-input input`).attributes('autocomplete')).toBe('off');
    w.unmount();
  });
});

describe('DatePicker · axe 扫描（真实配置）', () => {
  /**
   * ⚠️ `allow` 里的每一条都必须**可自证** —— 做法与 tabs 相同：
   * 用对照脚本跑 **antd 自己的 DOM**，确认是**上游同款**行为而不是我方缺陷。
   *
   * 目前为空 ⇒ 期望「无 violation」。若某条配置红，先做对照实验再决定
   * （是修实现还是登记豁免）。
   */
  const cases: Record<string, { props: Record<string, unknown>; allow?: string[] }> = {
    常规: { props: {} },
    有值: { props: { defaultValue: dayjs('2026-09-30') } },
    小尺寸: { props: { size: 'small' } },
    大尺寸: { props: { size: 'large' } },
    填充变体: { props: { variant: 'filled' } },
    无边框变体: { props: { variant: 'borderless' } },
    下划线变体: { props: { variant: 'underlined' } },
    错误状态: { props: { status: 'error' } },
    警告状态: { props: { status: 'warning' } },
    禁用: { props: { disabled: true } },
    禁用且有值: { props: { disabled: true, defaultValue: dayjs('2026-09-30') } },
    禁止清除: { props: { allowClear: false, defaultValue: dayjs('2026-09-30') } },
    前缀: { props: { prefix: 'P' } },
    无后缀图标: { props: { suffixIcon: null } },
    带时间: { props: { showTime: true } },
    月份粒度: { props: { picker: 'month' } },
    自定义占位符: { props: { placeholder: '自定义' } },
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

describe('DatePicker · 范围（RangePicker）的 role / ARIA 契约（L5）', () => {
  it('根是 `div` 且**没有 role**，并带 `-range` 类', () => {
    const w = mount(RangePicker);
    const root = w.find(`.${P}`);
    expect(root.element.tagName).toBe('DIV');
    expect(root.attributes('role')).toBeUndefined();
    expect(root.classes()).toContain(`${P}-range`);
    w.unmount();
  });

  it('两个输入框都在，且各自 `aria-invalid="false"` + `date-range` 标记', () => {
    const w = mount(RangePicker);
    const start = w.find(`.${P}-input-start input`);
    const end = w.find(`.${P}-input-end input`);
    expect(start.exists()).toBe(true);
    expect(end.exists()).toBe(true);
    expect(start.attributes('aria-invalid')).toBe('false');
    expect(end.attributes('aria-invalid')).toBe('false');
    // 上游实测：两端靠 `date-range` 属性区分（不是靠 id）
    expect(start.attributes('date-range')).toBe('start');
    expect(end.attributes('date-range')).toBe('end');
    w.unmount();
  });

  it('🚨 **默认**分隔符是装饰性图标 ⇒ 带 `aria-hidden="true"`（对 AT 隐藏）', () => {
    // 判据来自上游 `RangeSelector` 的 `separator` 分支：默认值是一个图标，
    // 它只是视觉装饰（「从…到…」靠两个 placeholder 表达）⇒ 必须对读屏器隐藏。
    const w = mount(RangePicker);
    const sep = w.find(`.${P}-separator`);
    expect(sep.exists()).toBe(true);
    expect(sep.attributes('aria-hidden')).toBe('true');
    // 里面确实是那个图标（`role="img"` + `aria-label="swap-right"`）
    expect(sep.find('[role="img"]').attributes('aria-label')).toBe('swap-right');
    w.unmount();
  });

  it('🚨 **自定义**分隔符是用户内容 ⇒ **去掉** `aria-hidden`（让 AT 读到）', () => {
    // 用户给 `separator="→"` / `"至"` 时那是有意义的内容（「9月1日至9月30日」），
    // 藏掉它会让读屏器听到「Start date, End date」而丢掉中间的连接词。
    const w = mount(RangePicker, { props: { separator: '→' } });
    const sep = w.find(`.${P}-separator`);
    expect(sep.exists()).toBe(true);
    expect(sep.attributes('aria-hidden')).toBeUndefined();
    expect(sep.text()).toBe('→');
    // 反向哨兵：自定义时**不该**再渲染那个图标
    expect(sep.find('[role="img"]').exists()).toBe(false);
    w.unmount();
  });

  it('清除按钮的 `aria-label` 与单值同源（`locale.clear`）', () => {
    const w = mount(RangePicker, {
      props: { defaultValue: [dayjs('2026-09-01'), dayjs('2026-09-30')] },
    });
    const clear = w.find(`.${P}-clear`);
    expect(clear.element.tagName).toBe('BUTTON');
    expect(clear.attributes('aria-label')).toBe('Clear');
    w.unmount();
  });

  it('🚨 `disabled` 的两端形态：`true` ⇒ 两框都禁；`[true, false]` ⇒ 只第一框', () => {
    const all = mount(RangePicker, { props: { disabled: true } });
    expect(all.find(`.${P}-input-start input`).attributes('disabled')).toBeDefined();
    expect(all.find(`.${P}-input-end input`).attributes('disabled')).toBeDefined();
    expect(all.find(`.${P}`).classes()).toContain(`${P}-disabled`);
    all.unmount();

    const one = mount(RangePicker, { props: { disabled: [true, false] } });
    expect(one.find(`.${P}-input-start input`).attributes('disabled')).toBeDefined();
    expect(one.find(`.${P}-input-end input`).attributes('disabled')).toBeUndefined();
    // 🚨 根类名的判据是 `every()` ⇒ 只禁一端时**不该**有 `-disabled`
    expect(one.find(`.${P}`).classes()).not.toContain(`${P}-disabled`);
    one.unmount();
  });
});

describe('RangePicker · axe 扫描（真实配置）', () => {
  const rangeCases: Record<string, { props: Record<string, unknown> }> = {
    范围常规: { props: {} },
    范围有值: { props: { defaultValue: [dayjs('2026-09-01'), dayjs('2026-09-30')] } },
    范围自定义分隔符: { props: { separator: '→' } },
    范围只禁一端: {
      props: { disabled: [true, false], defaultValue: [dayjs('2026-09-01'), dayjs('2026-09-30')] },
    },
    范围两端都禁: { props: { disabled: true } },
    范围带时间: { props: { showTime: true } },
  };

  for (const [name, { props }] of Object.entries(rangeCases)) {
    it(`${name}：无 axe violation`, async () => {
      const w = mountRangeA11y(props);
      await nextTick();
      const results = await axe.run(w.element as Element, {
        runOnly: { type: 'tag', values: TAGS },
      });
      expect(results.violations.map((v) => v.id)).toEqual([]);
      w.unmount();
    });
  }
});
