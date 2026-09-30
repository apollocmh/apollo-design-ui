/**
 * L2 —— **键入接线**（S2：解析 → `invalid` 状态）。
 *
 * ── 覆盖的判据（全部来自 rc 源码，不是推测）──────────────────────────────────
 *
 * | 组 | 判据 | 出处 |
 * |---|---|---|
 * | invalid | 非空且解析不出 ⇒ `aria-invalid="true"` + 根类名 `-invalid` + 发 `invalid(true)` | `useInputProps.js:122-134` |
 * | invalid | 解析得出 ⇒ 回 `"false"` + 发 `invalid(false)` | 同上 |
 * | invalid | 🚨 **空串算合法**（`onInvalid(!!text)`）⇒ 清空后回 `"false"` | 同上 |
 * | invalid | 🚨 **与 `status` 无关** —— `status="error"` 时 `aria-invalid` 仍是 `"false"` | S1 实测 |
 * | 键盘 | `Escape` ⇒ 关浮层；`Enter` **文本合法 ⇒ 提交并关浮层**、空/非法 ⇒ 只在关闭时开浮层 | `Input.js:182-187` + `useInputProps.js:140-162` |
 *
 * ── ✅ 曾经的「已知缺口」已闭合（2026-10-01）────────────────────────────────
 *
 * 此前 `props.format` 未传时 `formatList` 恒为 `[]` ⇒ **键入任何内容都判非法**。
 * 根因不是「locale 缺字段」本身，而是**缺了 rc 的补齐层**：
 *
 * | 层 | 内容 | 本轮之前 |
 * |---|---|---|
 * | ① 用户 `props.format` | 直接用 | ✅ |
 * | ② 语言包 `locale.fieldXxxFormat` | `getRowFormat` 读它 | ✅（但**本仓与 antd 的语言包都没有这些键**） |
 * | ③ **rc 的硬编码兜底** | `useLocale` → `fillLocale`（`fieldDateFormat \|\| 'YYYY-MM-DD'`） | ❌ **缺这一层** |
 *
 * 已按上游 `useFilledProps.js:72-76` 补上（`hooks/picker-filled.ts`）⇒
 * 现在**不传 `format` 也能解析**（见本文件最后两条用例）。
 * 证据：`es/hooks/useLocale.js:59`；本仓 `en_US.lang` 与 antd `en_US.lang`
 * 的 `field*` 键实测都为空 ⇒ 默认格式**不可能**来自语言包。
 *
 * ── 这个文件**没有**证明什么 ──────────────────────────────────────────────────
 *
 * **落值 + 提交时机**（`onChange` 那一半）不在这里 —— 那是
 * `s2-commit.test.ts`（关浮层 / Tab / Enter / 面板点选）与
 * `picker-value-change.test.ts`（状态机本身）的事。
 * 本文件只钉「解析 → `invalid` 状态」与「按键 → 浮层」这两条**局部**契约。
 */

import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';

/** 显式格式 —— 用来验证「用户给了 format 时它**优先于**补齐的默认值」。 */
const F = { format: 'YYYY-MM-DD' };

const input = (w: ReturnType<typeof mount>) => w.find(`.${P}-input input`);

describe('DatePicker · 键入接线（S2 · invalid 状态）', () => {
  it('非空且解析不出 ⇒ `aria-invalid="true"` + 根类名 `-invalid` + 发 `invalid(true)`', async () => {
    const w = mount(DatePicker, { props: F });
    expect(input(w).attributes('aria-invalid')).toBe('false');

    await input(w).setValue('完全不是日期');

    expect(input(w).attributes('aria-invalid')).toBe('true');
    expect(w.find(`.${P}`).classes()).toContain(`${P}-invalid`);
    expect(w.emitted('invalid')?.[0]).toEqual([true]);
    w.unmount();
  });

  it('解析得出 ⇒ 回 `"false"` 并去掉 `-invalid`，发 `invalid(false)`', async () => {
    const w = mount(DatePicker, { props: F });
    await input(w).setValue('乱写');
    expect(input(w).attributes('aria-invalid')).toBe('true');

    await input(w).setValue('2026-09-30');

    expect(input(w).attributes('aria-invalid')).toBe('false');
    expect(w.find(`.${P}`).classes()).not.toContain(`${P}-invalid`);
    expect(w.emitted('invalid')?.at(-1)).toEqual([false]);
    w.unmount();
  });

  it('🚨 **空串算合法**：清空输入框后回到 `"false"`（上游 `onInvalid(!!text)`）', async () => {
    const w = mount(DatePicker, { props: F });
    await input(w).setValue('乱写');
    expect(input(w).attributes('aria-invalid')).toBe('true');

    await input(w).setValue('');

    expect(input(w).attributes('aria-invalid')).toBe('false');
    expect(w.emitted('invalid')?.at(-1)).toEqual([false]);
    w.unmount();
  });

  it('`format` 传**数组**时第二套也能命中（这才是「传数组」的意义）', async () => {
    const w = mount(DatePicker, { props: { format: ['YYYY-MM-DD', 'YYYY/MM/DD'] } });
    await input(w).setValue('2026/09/30');
    expect(input(w).attributes('aria-invalid')).toBe('false');
    w.unmount();
  });

  it('🚨 **`invalid` 与 `status` 无关**：`status="error"` 时 `aria-invalid` 仍是 `"false"`', async () => {
    const w = mount(DatePicker, { props: { ...F, status: 'error' } });
    expect(input(w).attributes('aria-invalid')).toBe('false');
    expect(w.find(`.${P}`).classes()).toContain(`${P}-status-error`);

    // 键入非法后**两者同时存在**（互不干扰）
    await input(w).setValue('乱写');
    expect(input(w).attributes('aria-invalid')).toBe('true');
    expect(w.find(`.${P}`).classes()).toContain(`${P}-status-error`);
    expect(w.find(`.${P}`).classes()).toContain(`${P}-invalid`);
    w.unmount();
  });

  it('受控 `value` 时键入非法 ⇒ 值**不变**（本轮不接落值），但 `invalid` 照发', async () => {
    const w = mount(DatePicker, { props: { ...F, value: dayjs('2026-09-30') } });
    await input(w).setValue('乱写');
    expect(w.emitted('invalid')?.[0]).toEqual([true]);
    // ⚠️ 明确断言「本轮不落值」—— 免得后人误以为已经接好了
    expect(w.emitted('update:value')).toBeUndefined();
    w.unmount();
  });

  it('✅ **不传 `format` 也能解析**（默认格式由补齐层给出 `YYYY-MM-DD`）', async () => {
    // ⚠️ 这条在 2026-10-01 之前断言的是**相反**的行为（`'true'`）——
    //    当时它钉的是一个已知缺口。补齐层落地后它按计划翻了过来（见文件头）。
    const w = mount(DatePicker);
    await input(w).setValue('2026-09-30');
    expect(input(w).attributes('aria-invalid')).toBe('false');
    w.unmount();
  });

  it('✅ **不传 `format` 时非法值仍判非法**（补齐的是默认值，不是「永不非法」）', async () => {
    // 反向哨兵：防止「补齐层」被误改成「恒不非法」
    const w = mount(DatePicker);
    await input(w).setValue('完全不是日期');
    expect(input(w).attributes('aria-invalid')).toBe('true');
    w.unmount();
  });

  it('`showTime` 时默认字段串是 `YYYY-MM-DD HH:mm:ss`（补齐层按 show 标志推时间格式）', async () => {
    // ⚠️ 补齐用的时间格式是 `fillTimeFormat(showHour, showMinute, showSecond, …)`
    //    **推出来的**，**不是** `showTime.format` —— 上游 `useLocale.js:55`。
    //    这里 `showTime` 是 `true`（无 format）⇒ 默认三段全开。
    const w = mount(DatePicker, { props: { showTime: true } });
    await input(w).setValue('2026-09-30 12:34:56');
    expect(input(w).attributes('aria-invalid')).toBe('false');
    w.unmount();
  });

  it('`showTime={{ format }}` 只决定面板列，**不**改字段串（字段串按 show 标志推）', async () => {
    // 上游判据 1（见 `hooks/picker-filled.ts` 文件头）：补齐用的是
    // `fillTimeFormat(showHour, showMinute, showSecond, …)` **推出来的**串，
    // **不是** `showTime.format`。
    //
    // 判别式：`showTime.format` 是 `'HH:mm'`（**没有日期部分**）。
    //   - 若字段串取了 `showTime.format` ⇒ 带日期的输入**解析不出**；
    //   - 实际字段串是 `YYYY-MM-DD HH:mm:ss` ⇒ 带日期的输入**解析得出**。
    // ⇒ 「带日期的完整输入能过」这一条就足以证伪「字段串 = showTime.format」。
    const w = mount(DatePicker, { props: { showTime: { format: 'HH:mm' } } });
    await input(w).setValue('2026-09-30 12:34:56');
    expect(input(w).attributes('aria-invalid')).toBe('false');
    w.unmount();
  });
});

describe('DatePicker · 键入接线（S2 · 键盘）', () => {
  it('`Escape` ⇒ 关浮层', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    expect(w.find(`.${P}-dropdown`).exists()).toBe(true);

    await input(w).trigger('keydown', { key: 'Escape' });

    expect(w.emitted('openChange')?.at(-1)).toEqual([false]);
    w.unmount();
  });

  it('`Enter`（浮层**关闭**时）⇒ 开浮层', async () => {
    const w = mount(DatePicker);
    expect(w.find(`.${P}-dropdown`).exists()).toBe(false);

    await input(w).trigger('keydown', { key: 'Enter' });

    expect(w.emitted('openChange')?.at(-1)).toEqual([true]);
    w.unmount();
  });

  it('🚨 `Enter`（**空文本**、浮层已开）⇒ 不动 —— 合法文本才提交（见下一条）', async () => {
    // ⚠️ 这条**只**对空/非法文本成立：`Input.onSharedKeyDown` 的判据是
    //    `key === 'Enter' && validateFormat(inputValue)`，空串解析不出 ⇒ 不提交。
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).trigger('keydown', { key: 'Enter' });

    expect(w.emitted('openChange')).toBeUndefined();
    expect(w.emitted('change')).toBeUndefined();
    w.unmount();
  });

  it('🚨 **`Enter` + 合法文本 ⇒ 提交**（`keyboard-submit`）并关浮层', async () => {
    // 出处：`Input.js:182-183` 的 `onSharedKeyDown` ——
    //   `if (event.key === 'Enter' && validateFormat(inputValue)) onSubmit();`
    // 而 `onSubmit` 一路接到 `SinglePicker` 的 `triggerConfirm('keyboard-submit')`。
    // ⚠️ 这条**推翻了**本仓 2026-10-01 之前「Enter 一律不提交」的注释。
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).setValue('2026-09-30');

    await input(w).trigger('keydown', { key: 'Enter' });

    expect(w.emitted('change')).toBeTruthy();
    expect(w.emitted('openChange')?.at(-1)).toEqual([false]);
    w.unmount();
  });

  it('其它按键（如字母）⇒ 不动浮层', async () => {
    const w = mount(DatePicker);
    await input(w).trigger('keydown', { key: 'a' });
    expect(w.emitted('openChange')).toBeUndefined();
    w.unmount();
  });

  it('`keydown` 事件始终发（deprecated 的 `onKeyDown` 通道，第二参是 `preventDefault`）', async () => {
    const w = mount(DatePicker);
    await input(w).trigger('keydown', { key: 'a' });

    const first = w.emitted('keydown')?.[0];
    expect(first).toBeTruthy();
    // 载荷是 `[event, preventDefault]` —— 第二个必须是**函数**（调用方常写 `(e, pd) => pd()`）
    expect(typeof first?.[1]).toBe('function');
    w.unmount();
  });
});
