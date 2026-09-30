/**
 * L2 冒烟 —— DatePicker 的 **S1 范围**（值 / 开合 / 面板接线）。
 *
 * ⚠️ 这个文件**只覆盖 S1 已落地的部分**（受控值 / 开合 / 根类名 / 输入框结构 /
 * 清除按钮）。键入解析、掩码、键盘字段导航在 S2–S4 —— 那些的用例**故意不在这里**，
 * 所以 `index.test.ts` 保持 `describe.todo`（G5/G6 的完整判定表待补）。
 *
 * ── 覆盖的判据（全部来自 SSR 实测或 rc 源码，不是推测）──────────────────────
 *
 * | 组 | 判据 | 出处 |
 * |---|---|---|
 * | 根类名 | `apollo-picker` + **`apollo-picker-outlined`（默认就有）** | `generateSinglePicker.js` / 实测 |
 * | 输入框 | `aria-invalid="false"`（**`status=error` 也不改**）、`autocomplete="off"`、`size="12"` | 实测 |
 * | 后缀 | `-suffix` 存在且**带默认日历图标** | `useSuffixIcon.js` |
 * | 清除 | **无值时不渲染**；有值时有，且 `aria-label` 取 **`locale.clear`** | `SingleSelector:127` / `ClearIcon.js` |
 * | 开合 | 点根节点 ⇒ 浮层出现（`-dropdown`） | `PickerTrigger/index.js` |
 * | C11 | `update:value` 与 `change` **同时**发（点清除） | COMPATIBILITY §3 |
 *
 * ── 这个文件没有证明什么 ─────────────────────────────────────────────────────
 *   - jsdom **无布局** ⇒ 浮层定位 / `active-bar` 宽度 / `-input-active` 的真实几何测不到（靠 L6）
 *   - **面板内容的正确性**不在 S1（面板本身由 `@apollo-design/picker` 的 51 条纯函数测试
 *     与它自己的 L2/L4/L5 负责）
 */

import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';

describe('DatePicker · S1 冒烟（结构 / 受控值 / 开合 / 清除）', () => {
  it('根类名：`apollo-picker` + 默认就有 `-outlined`', () => {
    const w = mount(DatePicker);
    const root = w.find(`.${P}`);
    expect(root.exists()).toBe(true);
    // 🚨 「默认只有 `${prefixCls}`」是错的：默认 variant='outlined' ⇒ 一定会加这个类
    expect(root.classes()).toContain(`${P}-outlined`);
    w.unmount();
  });

  it('输入框的三个实测属性：aria-invalid / autocomplete / size', () => {
    const w = mount(DatePicker);
    const input = w.find(`.${P}-input input`);
    expect(input.exists()).toBe(true);
    // ⚠️ 实测：`status="error"` 也**不改**这里（恒 "false"）
    expect(input.attributes('aria-invalid')).toBe('false');
    expect(input.attributes('autocomplete')).toBe('off');
    // ⚠️ `size` = max(10, 'YYYY-MM-DD'.length=10) + 2 = 12
    expect(input.attributes('size')).toBe('12');
    w.unmount();
  });

  it('无值时**不渲染**清除按钮，但有后缀图标', () => {
    const w = mount(DatePicker);
    expect(w.find(`.${P}-suffix`).exists()).toBe(true);
    // 🚨 实测：无值时 SSR 字节与不传 allowClear **完全相同** ⇒ 清除按钮不存在
    expect(w.find(`.${P}-clear`).exists()).toBe(false);
    w.unmount();
  });

  it('有值时渲染清除按钮，且 aria-label 取 `locale.clear`（不是字面量 "Clear"）', () => {
    const w = mount(DatePicker, { props: { defaultValue: dayjs('2026-09-30') } });
    const clear = w.find(`.${P}-clear`);
    expect(clear.exists()).toBe(true);
    // 🚨 `ClearIcon.js` 里是 `"aria-label": locale.clear` ——
    //    SSR dump 里看到 `"Clear"` 只是因为语言包是 en_US
    expect(clear.attributes('aria-label')).toBe('Clear');
    w.unmount();
  });

  it('`allowClear={false}` ⇒ 即使有值也不渲染清除按钮', () => {
    const w = mount(DatePicker, {
      props: { defaultValue: dayjs('2026-09-30'), allowClear: false },
    });
    expect(w.find(`.${P}-clear`).exists()).toBe(false);
    w.unmount();
  });

  it('受控 `value` ⇒ 输入框显示格式化后的文本（含年份）', () => {
    const w = mount(DatePicker, { props: { value: dayjs('2026-09-30') } });
    const value = (w.find(`.${P}-input input`).element as HTMLInputElement).value;
    expect(value).not.toBe('');
    expect(value).toContain('2026');
    w.unmount();
  });

  it('`disabled` ⇒ 输入框带 disabled 属性，且不渲染清除按钮', () => {
    const w = mount(DatePicker, {
      props: { disabled: true, defaultValue: dayjs('2026-09-30') },
    });
    expect(w.find(`.${P}-input input`).attributes('disabled')).toBeDefined();
    // 🚨 上游 `showClear` 的第三条条件：`disabled` 时**不渲染**清除按钮
    expect(w.find(`.${P}-clear`).exists()).toBe(false);
    w.unmount();
  });

  it('点根节点 ⇒ 浮层出现（`-dropdown`），并发 `openChange` / `update:open`', async () => {
    const w = mount(DatePicker);
    expect(w.find(`.${P}-dropdown`).exists()).toBe(false);

    await w.find(`.${P}`).trigger('click');
    expect(w.find(`.${P}-dropdown`).exists()).toBe(true);
    expect(w.emitted('openChange')?.[0]).toEqual([true]);
    expect(w.emitted('update:open')?.[0]).toEqual([true]);
    w.unmount();
  });

  it('受控 `open` ⇒ 初始就是打开的（`defaultOpen` 同理）', () => {
    const w = mount(DatePicker, { props: { open: true } });
    expect(w.find(`.${P}-dropdown`).exists()).toBe(true);
    w.unmount();
  });

  it('C11：点清除 ⇒ `update:value` 与 `change` **同时**发（都是 null）', async () => {
    const w = mount(DatePicker, { props: { defaultValue: dayjs('2026-09-30') } });
    await w.find(`.${P}-clear`).trigger('click');

    expect(w.emitted('update:value')).toBeTruthy();
    expect(w.emitted('change')).toBeTruthy();
    // 清空 ⇒ 两个通道都给 `null`
    expect(w.emitted('update:value')?.[0]).toEqual([null]);
    expect(w.emitted('change')?.[0]?.[0]).toBeNull();
    w.unmount();
  });
});
