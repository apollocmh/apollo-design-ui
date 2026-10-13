/**
 * L1/L2 —— **Issue #6 的已交付项回归**。
 *
 * | # | 判据 | 修复前的红灯表现 |
 * |---|---|---|
 * | 6.1 | `TimePickerExpose` 真的可用（`focus` / `blur` / `nativeElement`） | 薄壳没有 `defineExpose`，内层 `DatePicker` 也没有 ⇒ 三个键全是 `undefined` |
 * | 6.3 | `ok` 的载荷是**单个** `Dayjs`（单值 picker），且 `ok` **真的发得出来** | ① 恒给 `dates.filter(Boolean)` 的数组；② `ok` **从不发出**（`triggerOk` 无调用点） |
 *
 * ⚠️ **#6.2（顶层时间配置）与 #6.5（`defaultOpenValue`）不在本文件** ——
 *    它们需要「面板真的渲染出时间列」才能证伪，而本仓**纯 `picker: 'time'` 的面板
 *    在 jsdom 里渲染为空**（`.apollo-picker-time-panel > .apollo-picker-content` 零列，
 *    给 `open` + `defaultValue` 也一样）⇒ 拿不到可证伪的断言。
 *    已连同现场登记在 `docs/KNOWN-ISSUES.md` §1.4，**不在此处用弱断言充数**。
 *
 * ── 🚨 两条踩过的坑 ────────────────────────────────────────────────────────
 *
 * 1. **断言要查 `document`，不要查 `wrapper.find`**：浮层走 `Portal`（`<Teleport>`），
 *    必须 `attachTo: document.body` + `document.querySelector`（与本目录其余用例同判）。
 * 2. **同一条用例里连续 `mount` 会互相污染**（`afterEach` 清 `document.body` 之前，
 *    上一个实例的 teleport 内容还在）⇒ 一个用例只挂一个实例。
 */

import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DatePicker from '../../date-picker/DatePicker.vue';
import TimePicker from '../TimePicker.vue';
import TimeRangePicker from '../TimeRangePicker.vue';

const P = 'apollo-picker';
const D = (s: string) => dayjs(s);

afterEach(() => {
  document.body.innerHTML = '';
});

const mountTimePicker = (props: Record<string, unknown> = {}) =>
  mount(TimePicker, { props, attachTo: document.body });

const mountRange = (props: Record<string, unknown> = {}) =>
  mount(TimeRangePicker, { props, attachTo: document.body });

// ===========================================================================
// 6.1 · 命令面（expose）
// ===========================================================================

describe('TimePicker · 命令面（Issue #6.1）', () => {
  it('★ `focus()` 把焦点交给 combobox input；`blur()` 交还', async () => {
    const w = mountTimePicker();
    await w.vm.$nextTick();

    const input = document.querySelector(`.${P}-input input`) as HTMLInputElement;
    expect(input).not.toBeNull();

    w.vm.focus();
    expect(document.activeElement).toBe(input);

    w.vm.blur();
    expect(document.activeElement).not.toBe(input);
    w.unmount();
  });

  it('★ `nativeElement` 是**选择器根**（且是 getter ⇒ 每次访问都取最新的）', async () => {
    const w = mountTimePicker();
    await w.vm.$nextTick();

    const el = w.vm.nativeElement as HTMLElement | null;
    expect(el).not.toBeNull();
    expect(el?.classList.contains(P)).toBe(true);
    // 🚨 与 `document` 里的那一个是同一个节点（不是 setup 期定格的 null）
    expect(el).toBe(document.querySelector(`.${P}`));
    w.unmount();
  });

  it('★ `TimeRangePicker` 额外暴露 `startInput` / `endInput`，`focus(1)` 聚焦第二端', async () => {
    const w = mountRange({ defaultValue: [D('2026-09-15 10:00:00'), D('2026-09-16 11:00:00')] });
    await w.vm.$nextTick();

    const startInput = w.vm.startInput as HTMLInputElement | null;
    const endInput = w.vm.endInput as HTMLInputElement | null;
    expect(startInput).not.toBeNull();
    expect(endInput).not.toBeNull();
    expect(startInput).not.toBe(endInput);

    w.vm.focus(1);
    expect(document.activeElement).toBe(endInput);

    w.vm.focus(0);
    expect(document.activeElement).toBe(startInput);
    w.unmount();
  });

  it('`DatePicker` 自己也暴露同一组（薄壳只是转发）', async () => {
    const w = mount(DatePicker, { props: { picker: 'time' }, attachTo: document.body });
    await w.vm.$nextTick();

    expect(typeof w.vm.focus).toBe('function');
    expect(typeof w.vm.blur).toBe('function');
    expect((w.vm.nativeElement as HTMLElement | null)?.classList.contains(P)).toBe(true);
    w.unmount();
  });
});

// ===========================================================================
// 6.3 · `ok` 的载荷
// ===========================================================================

describe('TimePicker · `ok` 的载荷与发出（Issue #6.3）', () => {
  const okButton = () =>
    [...document.querySelectorAll(`.${P}-footer button`)].at(-1) as HTMLButtonElement | undefined;

  it('★ 点 `OK` ⇒ `onOk` **真的被调到**，载荷是**单个 Dayjs**', async () => {
    // 🚨 用 `onOk` 而不是 `w.emitted('ok')`：**薄壳不声明 `defineEmits`**（见 TimePicker.vue
    //    文件头第 5 条）⇒ 内层的 `emit('ok')` 走的是转发下去的 `onOk`，不会记在外层实例上。
    const onOk = vi.fn();
    const w = mountTimePicker({
      open: true,
      needConfirm: true,
      defaultValue: D('2016-11-22 12:30:45'),
      onOk,
    });
    await w.vm.$nextTick();

    const ok = okButton();
    expect(ok?.textContent).toBe('OK');
    ok?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await w.vm.$nextTick();

    // 🚨 修复前 `onOk` 一次都不会被调（`triggerOk` 在本仓没有任何调用点 ⇒ `ok` 从不发出）
    expect(onOk).toHaveBeenCalled();
    const payload = onOk.mock.calls.at(-1)?.[0];
    expect(Array.isArray(payload)).toBe(false);
    expect(dayjs.isDayjs(payload)).toBe(true);
    expect((payload as dayjs.Dayjs).hour()).toBe(12);
    w.unmount();
  });

  it('★ `TimeRangePicker` 的 `ok` 载荷是**槽位列表**（范围约定不同）', async () => {
    const onOk = vi.fn();
    const w = mountRange({
      open: true,
      needConfirm: true,
      defaultValue: [D('2016-11-22 12:30:45'), D('2016-11-22 13:45:00')],
      onOk,
    });
    await w.vm.$nextTick();

    okButton()?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await w.vm.$nextTick();

    expect(onOk).toHaveBeenCalled();
    const payload = onOk.mock.calls.at(-1)?.[0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(2);
    expect(dayjs.isDayjs((payload as unknown[])[0])).toBe(true);
    w.unmount();
  });
});
