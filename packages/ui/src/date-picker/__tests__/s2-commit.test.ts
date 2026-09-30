/**
 * L2 —— **提交时机**的接线（S2 收口）。
 *
 * 契约来源：`@rc-component/picker` 的 `PickerInput/SinglePicker.js` +
 * `hooks/useRangeValueChange.js`（状态机本身由 `picker-value-change.test.ts` 的 36 条
 * 纯用例覆盖，**本文件只测「谁在什么时候调它」**）。
 *
 * ── 🚨 本文件最重要的一条判据：**键入本身不提交** ────────────────────────────
 *
 * `input` 解析出的日期只走 `modify` —— **只写临时日历值，不发 `change`**。
 * 提交发生在**后续的另一个事件**上（关浮层 / Tab / 确定）。这与直觉相反
 * （多数输入框是「改完即提交」），也与上游被废弃的 `changeOnBlur` 注释
 * 「Value will always be update if user type correct date type」读起来的印象不同 ——
 * 那条说的是**用户视角**（敲完离开时值就更新了），机制上仍是「关浮层时提交」。
 *
 * 出处：`useInputProps.js:114-135`（两处都是 `'input'`）+
 * `useRangeValueChange.js` 的 `resolveAction`（`'input'` ⇒ `'modify'`）。
 *
 * ── 怎么在 jsdom 里触发「关浮层」────────────────────────────────────────────
 *
 * 真实路径是「焦点离开 ⇒ `useFocusEvents` 关浮层 ⇒ `popupClose`」。
 * jsdom 里模拟焦点转移很脆 ⇒ 本文件改用**受控 `open` 从 true 变 false**
 * 来驱动同一个 `watch`（生产代码里两者走的是**同一条** `mergedOpen` 变化）。
 *
 * ⚠️ 关浮层是**异步**的（离场动效结束才卸载）⇒ 断言 DOM 卸载必须**轮询**（PITFALLS 179）。
 */

import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';

const input = (w: ReturnType<typeof mount>) => w.find(`.${P}-input input`);

/** 取最近一次 `change` 的**第一个载荷**并格式化成 `YYYY-MM-DD`（`null` 原样）。 */
const lastChangeText = (w: ReturnType<typeof mount>): string => {
  const payload = w.emitted('change')?.at(-1)?.[0];
  if (payload === null) {
    return 'null';
  }
  return payload && typeof payload === 'object' && 'format' in payload
    ? (payload as dayjs.Dayjs).format('YYYY-MM-DD')
    : String(payload);
};

describe('DatePicker · 键入的提交时机（S2 收口）', () => {
  it('🚨 **键入本身不提交** —— 只写临时日历值，不发 `change`', async () => {
    const w = mount(DatePicker);
    await input(w).setValue('2026-09-30');

    // 解析成功（`invalid` 回 false）但**没有** `change`
    expect(input(w).attributes('aria-invalid')).toBe('false');
    expect(w.emitted('change')).toBeUndefined();
    expect(w.emitted('update:value')).toBeUndefined();
    w.unmount();
  });

  it('✅ 关浮层（`popupClose`）⇒ 提交：发 `change` + `update:value`（C11 双发）', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).setValue('2026-09-30');
    expect(w.emitted('change')).toBeUndefined();

    // 受控 open: true → false ⇒ 与「焦点离开后关浮层」走同一条 `mergedOpen` watch
    await w.setProps({ open: false });

    expect(lastChangeText(w)).toBe('2026-09-30');
    expect(w.emitted('update:value')?.at(-1)?.[0]).toBeTruthy();
    w.unmount();
  });

  it('✅ `Tab`（`keyboard-submit-weak`）⇒ **局部提交**：发 `change` 且关浮层', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).setValue('2026-09-30');

    await input(w).trigger('keydown', { key: 'Tab' });

    expect(lastChangeText(w)).toBe('2026-09-30');
    expect(w.emitted('openChange')?.at(-1)).toEqual([false]);
    w.unmount();
  });

  it('🚨 键入**非法**后关浮层 ⇒ 丢弃临时值（`resetAll`），不发 `change`', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).setValue('完全不是日期');
    expect(input(w).attributes('aria-invalid')).toBe('true');

    await w.setProps({ open: false });

    expect(w.emitted('change')).toBeUndefined();
    w.unmount();
  });

  it('🚨 键入**合法**后按 `Escape`（`esc`）⇒ **回滚**，不发 `change`', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).setValue('2026-09-30');

    await input(w).trigger('keydown', { key: 'Escape' });

    // `esc` ⇒ `resetAll`：丢弃临时值 + 关浮层，**不提交**
    expect(w.emitted('change')).toBeUndefined();
    expect(w.emitted('openChange')?.at(-1)).toEqual([false]);
    w.unmount();
  });

  it('🚨 `Escape` 的回滚是**回滚到根值**（受控值下临时值被丢弃）', async () => {
    const w = mount(DatePicker, {
      props: { open: true, value: dayjs('2026-01-01') },
    });
    await input(w).setValue('2026-09-30');

    await input(w).trigger('keydown', { key: 'Escape' });

    // 输入框回到受控值（不是刚键入的 2026-09-30）
    expect((input(w).element as HTMLInputElement).value).toBe('2026-01-01');
    expect(w.emitted('change')).toBeUndefined();
    w.unmount();
  });

  it('受控 `value` + 关浮层提交 ⇒ 发 `change`（载荷是解析出的日期）', async () => {
    const w = mount(DatePicker, { props: { open: true, value: dayjs('2026-01-01') } });
    await input(w).setValue('2026-09-30');

    await w.setProps({ open: false });

    expect(lastChangeText(w)).toBe('2026-09-30');
    w.unmount();
  });
});

describe('DatePicker · 面板点选的提交时机（S2 收口）', () => {
  /** 第一个**非禁用**的格子（禁用格的 click 被面板自己拦掉）。 */
  const firstEnabledCell = (w: ReturnType<typeof mount>) =>
    w.findAll(`.${P}-cell`).find((cell) => !cell.classes().includes(`${P}-cell-disabled`));

  it('无 `showTime` ⇒ `panel-final`：点一格**立即提交**并关浮层', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    const cell = firstEnabledCell(w);
    expect(cell).toBeTruthy();

    await cell?.trigger('click');

    expect(w.emitted('change')).toBeTruthy();
    expect(w.emitted('openChange')?.at(-1)).toEqual([false]);
    w.unmount();
  });

  it('带 `showTime` ⇒ `panel-intermediate`：点一格**只改日历值**，等「确定」才提交', async () => {
    // `complexPicker` 为真（`datetime`）⇒ `panelFinished` 为假
    const w = mount(DatePicker, { props: { open: true, showTime: true } });
    const cell = firstEnabledCell(w);
    expect(cell).toBeTruthy();

    await cell?.trigger('click');

    expect(w.emitted('change')).toBeUndefined();
    w.unmount();
  });

  it('🚨 **年面板**里点一格 ⇒ `panel-intermediate`（面板粒度 ≠ 组件粒度）—— 不提交', async () => {
    // 这条钉住 `panelFinished = !complexPicker && internalPicker === internalMode`
    // 的后半段：下钻到年面板后点一格**不该**把值提交掉。
    const w = mount(DatePicker, { props: { open: true, mode: 'year' } });
    const cell = firstEnabledCell(w);
    expect(cell).toBeTruthy();

    await cell?.trigger('click');

    expect(w.emitted('change')).toBeUndefined();
    w.unmount();
  });
});

describe('DatePicker · 清除的完整链（S2 收口）', () => {
  it('点清除 ⇒ `clear` 事件 + 空值提交 + 关浮层', async () => {
    const w = mount(DatePicker, { props: { defaultValue: dayjs('2026-09-30') } });

    await w.find(`.${P}-clear`).trigger('click');

    // 上游 `onSelectorClear` 的第 5 步：`onClear?.()`
    expect(w.emitted('clear')).toHaveLength(1);
    expect(lastChangeText(w)).toBe('null');
    w.unmount();
  });

  it('🚨 清除会**结束本轮交互的簿记**（`resetSingleValueChange`）—— 之后关浮层不再重复提交', async () => {
    const w = mount(DatePicker, { props: { defaultValue: dayjs('2026-09-30'), open: true } });

    await w.find(`.${P}-clear`).trigger('click');
    const changesAfterClear = w.emitted('change')?.length ?? 0;

    await w.setProps({ open: false });

    // 簿记已清 ⇒ 关浮层走 `resetAll`（`currentIndex` 为 null），**不**再发 change
    expect(w.emitted('change')?.length ?? 0).toBe(changesAfterClear);
    w.unmount();
  });
});
