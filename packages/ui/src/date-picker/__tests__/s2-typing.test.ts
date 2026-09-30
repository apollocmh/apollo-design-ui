/**
 * L2 —— **键入接线**（S2 的一半：解析 → `invalid` 状态）。
 *
 * ── 覆盖的判据（全部来自 rc 源码，不是推测）──────────────────────────────────
 *
 * | 组 | 判据 | 出处 |
 * |---|---|---|
 * | invalid | 非空且解析不出 ⇒ `aria-invalid="true"` + 根类名 `-invalid` + 发 `invalid(true)` | `useInputProps.js:122-134` |
 * | invalid | 解析得出 ⇒ 回 `"false"` + 发 `invalid(false)` | 同上 |
 * | invalid | 🚨 **空串算合法**（`onInvalid(!!text)`）⇒ 清空后回 `"false"` | 同上 |
 * | invalid | 🚨 **与 `status` 无关** —— `status="error"` 时 `aria-invalid` 仍是 `"false"` | S1 实测 |
 * | 键盘 | `Escape` ⇒ 关浮层；`Enter` 浮层**关闭**时开、**已开时不变**（**不提交**） | `useInputProps.js:140-162` |
 *
 * ── 🚨 这些用例**必须显式传 `format`** —— 原因是一个**已知缺口** ────────────────
 *
 * 本仓的 `mergeFormat` 只从 **locale** 取默认格式（`getRowFormat` 读 `locale.fieldDateFormat`），
 * 而实测（2026-09-30）：
 *
 * | 事实 | 证据 |
 * |---|---|
 * | 本仓 `en_US` 的 `DatePicker.lang` **没有** `fieldDateFormat` | `packages/locale/src/locales/en_US.ts` |
 * | **antd 的 `locale.lang` 也没有**（`field*` 键为空） | `Object.keys(require('antd/lib/date-picker/locale/en_US').default.lang).filter(k => k.startsWith('field'))` ⇒ `[]` |
 * | 上游 `getRowFormat` 与本仓**逐字一致**（同样读 `fieldDateFormat`） | `@rc-component/picker/lib/utils/miscUtil.js:46-67` |
 *
 * ⇒ 上游的 `format` **不是从 locale 来的**，而是 `useFilledProps` 里经 `showTime` /
 * `getTimeProps` 推导出来的那一层（本仓尚未实现）。
 * **后果**：`props.format` 未传时 `formatList` 恒为 `[]` ⇒ **键入永远解析不出** ⇒ `invalid` 恒 `true`。
 *
 * 所以本文件**显式传 `format`** 来验证「接线本身是对的」，
 * 并单独用一条用例**钉住这个缺口**（诚实记录，而不是让它藏在绿里）。
 *
 * ── 这个文件**没有**证明什么 ──────────────────────────────────────────────────
 *
 * **落值 + 提交时机**（`onChange` 那一半）**不在本轮**：它依赖 `useRangeValue` 的
 * `triggerChange` 语义（`needConfirm` / `changeOnBlur` / `preserveInvalidOnBlur` 三者交互）
 * ⇒ 留到 S2 的下一轮。所以这里**不断言**「键入合法后值变了」。
 */

import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';

/** 显式格式 —— 见文件头「已知缺口」。 */
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

  it('🚨 **已知缺口**：不传 `format` 时 `formatList` 为空 ⇒ 连合法日期也判非法', async () => {
    // ⚠️ 这条**不是**在断言「正确行为」，而是在**钉住一个缺口**（避免它藏在绿里）。
    //    根因见文件头：默认 `format` 的推导（上游 `useFilledProps` 那一层）本仓未实现。
    //    ⚠️ 缺口补上后**这条会红** —— 那时应当把它改成「合法日期 ⇒ false」并更新文件头。
    const w = mount(DatePicker);
    await input(w).setValue('2026-09-30');
    expect(input(w).attributes('aria-invalid')).toBe('true');
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

  it('🚨 `Enter`（浮层**已开**）⇒ **不变**（不提交、不发 openChange）', async () => {
    // 上游只在 `!open` 时开浮层；「回车提交」是多数输入框的习惯，这里**不是**那样
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).trigger('keydown', { key: 'Enter' });

    expect(w.emitted('openChange')).toBeUndefined();
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
