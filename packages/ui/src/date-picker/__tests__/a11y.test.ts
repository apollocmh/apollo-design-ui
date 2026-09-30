/**
 * L5 无障碍 —— DatePicker 的 role/ARIA 契约与 axe 扫描（**S1 范围：单值**）。
 *
 * ── 判据（antd 6.6.4 = rc-picker@1.12.2）──────────────────────────────────────
 *
 * | 项 | 判据 | 出处 |
 * |---|---|---|
 * | 根 | `div`（**没有 role**） | `SingleSelector` 的根 |
 * | 输入框 | `input[aria-invalid="false"]` —— 🚨 **`status="error"` 也不改**（实测） | SSR dump |
 * | 清除按钮 | `button[type="button"]` + `aria-label`（取 **`locale.clear`**，en_US 是 `"Clear"`） | `ClearIcon.js` |
 * | 后缀图标 | `span[role="img"][aria-label="calendar"][aria-hidden="true"]` | `create-icon` + `useSuffixIcon` |
 *
 * ── 为什么这些必须进 L5（而不是只看 L4）────────────────────────────────────────
 *
 * L4 钉的是**静态 DOM 逐字**；L5 钉的是**可访问性语义**（axe 的可达性树判定）。
 * 两者的失败模式不同：L4 会因「少一个类名」红，L5 会因「引用了不存在的 id」、
 * 「交互元素不可达」红。**两条都跑才算钉住**。
 *
 * ── 范围版与浮层留到 S5 / picker 包 ───────────────────────────────────────────
 *
 * - 范围版（含**上游两条专门的 separator a11y 测试**：默认分隔符带 `aria-hidden`、
 *   自定义分隔符**去掉**它）⇒ S5 与 `RangePicker.vue` 同批。
 * - 浮层内（面板）的 role/ARIA 由 `@apollo-design/picker` 的 L5 负责 ——
 *   SSR 下浮层不渲染，本文件不重复钉。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** 挂到真实文档（axe 与 `.focus()` 都要求元素在文档里）。 */
const mountA11y = (props: Record<string, unknown> = {}) =>
  mount(h(DatePicker as never, props as never), { attachTo: document.body });

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
