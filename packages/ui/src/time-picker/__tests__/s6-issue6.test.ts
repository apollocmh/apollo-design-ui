/**
 * L1/L2 —— **Issue #6 的五项回归**（先复现再修，逐条钉住）。
 *
 * | # | 判据 | 修复前的红灯表现 |
 * |---|---|---|
 * | 6.1 | `TimePickerExpose` / `TimeRangePickerExpose` 真的可用 | 薄壳没有 `defineExpose`，内层 `DatePicker` / `RangePicker` 也没有 ⇒ 三个键全是 `undefined` |
 * | 6.2 | 顶层时间配置（`use12Hours` / `hourStep` / `minuteStep` / `disabledTime` / `hideDisabledOptions`）作用到面板 | 这些键**没被声明成 prop**（落进 `attrs`）⇒ `getTimeProps` 取不到 ⇒ 静默失效（面板恒 3 列 24 格） |
 * | 6.3 | `ok` / `onSelect` 的载荷是**单个** `Dayjs`（单值 picker），且 `ok` 真的发得出来 | ① 恒给 `dates.filter(Boolean)` 的数组；② `ok` **从不发出**（`triggerOk` 无调用点） |
 * | 6.5 | 无值 + `defaultOpenValue` ⇒ 面板锚定到它，且「确定」可点 | 面板回退到 `getNow()`；`disableSubmit` 恒 `true`（空的时间 picker 点不了确定） |
 *
 * ── 🚨 四条踩过的坑（全都付过代价）─────────────────────────────────────────
 *
 * 1. **浮层断言一律查 `wrapper.element`，不要查 `document`。**
 *    `attachTo: document.body` + `document.querySelector('.apollo-picker-time-panel')`
 *    会**串到上一个实例残留的节点**上 ⇒ 我据此误判「纯时间面板在 jsdom 里渲染为空」，
 *    白白绕了一大圈（见 `KNOWN-ISSUES` §1.4 的订正）。
 * 2. **同一条用例里连续 `mount` 会互相污染** ⇒ `afterEach` 清 `document.body`，
 *    且一个用例只挂一个实例（`probe()` 这种批量辅助只适合探针，不适合断言）。
 * 3. 🚨 **新加的 Boolean prop 必须配 `withDefaults(…, { x: undefined })`**：
 *    `showHour?: boolean` 这类键在**未传时**会被 Vue 强制成 `false`，而
 *    `getTimeProps` 的 `existShowConfig`（`.some(show => show !== undefined)`）
 *    把「显式 `false`」当成「用户关了这三列」⇒ 面板**一列都不渲染**
 *    （实测：24h 从 3 列变 0 列）。**薄壳也要加** —— 它整包转发 `props`，
 *    不加就把 `false` 显式喂给内层（PLAN.md 避坑清单第 5 条）。
 * 4. **`hourStep` 的档位数由 `generateUnits(0, 23, step)` 决定** ——
 *    上界是 `23`（`i <= end`）⇒ `hourStep: 15` 只出 `[00, 15]`（**两项**，不是四项）。
 *    这是上游语义，别按「0/15/30/45」写断言。
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

/** 时间列（**查 `w.element`**，见文件头第 1 条）。 */
const columns = (w: { element: HTMLElement }) =>
  w.element.querySelectorAll(`.${P}-time-panel-column`);

const cellsOf = (w: { element: HTMLElement }, index: number) => [
  ...(columns(w)[index]?.querySelectorAll(`.${P}-time-panel-cell`) ?? []),
];

const labelsOf = (w: { element: HTMLElement }, index: number) =>
  cellsOf(w, index).map((c) => c.textContent?.trim() ?? '');

/** 面板里带 `-selected` 的格子文本（三列：时 / 分 / 秒）。 */
const selectedLabels = (w: { element: HTMLElement }) =>
  [...w.element.querySelectorAll(`.${P}-time-panel-cell-selected`)].map(
    (c) => c.textContent?.trim() ?? '',
  );

const okButton = (w: { element: HTMLElement }) =>
  [...w.element.querySelectorAll(`.${P}-footer button`)].at(-1) as HTMLButtonElement | undefined;

// ===========================================================================
// 6.1 · 命令面（expose）
// ===========================================================================

describe('TimePicker · 命令面（Issue #6.1）', () => {
  it('★ `focus()` 把焦点交给 combobox input；`blur()` 交还', async () => {
    const w = mountTimePicker();
    await w.vm.$nextTick();

    const input = w.element.querySelector(`.${P}-input input`) as HTMLInputElement;
    expect(input).not.toBeNull();

    w.vm.focus();
    expect(document.activeElement).toBe(input);

    w.vm.blur();
    expect(document.activeElement).not.toBe(input);
    w.unmount();
  });

  it('★ `nativeElement` 是**选择器根**（getter ⇒ 每次访问都取最新的）', async () => {
    const w = mountTimePicker();
    await w.vm.$nextTick();

    const el = w.vm.nativeElement as HTMLElement | null;
    expect(el).not.toBeNull();
    expect(el?.classList.contains(P)).toBe(true);
    // 🚨 与 wrapper 里的是同一个节点（不是 setup 期定格的 null）
    expect(el).toBe(w.element.querySelector(`.${P}`));
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
// 6.2 · 顶层时间配置贯通到面板
// ===========================================================================

describe('TimePicker · 顶层时间配置贯通到面板（Issue #6.2）', () => {
  const VALUE = D('2016-11-22 12:30:45');
  const mk = (props: Record<string, unknown> = {}) =>
    mountTimePicker({ open: true, defaultValue: VALUE, ...props });

  it('★ 基线：不传 ⇒ 3 列 24 / 60 / 60（这条必须先绿，否则下面的对比没有意义）', () => {
    const w = mk();
    expect(columns(w)).toHaveLength(3);
    expect(labelsOf(w, 0)).toHaveLength(24);
    expect(labelsOf(w, 1)).toHaveLength(60);
    expect(labelsOf(w, 2)).toHaveLength(60);
    w.unmount();
  });

  it('★ `use12Hours` ⇒ 4 列：小时列 12 项 + 上午下午列 2 项', () => {
    const w = mk({ use12Hours: true });
    expect(columns(w)).toHaveLength(4);
    expect(labelsOf(w, 0)).toHaveLength(12);
    expect(labelsOf(w, 3)).toEqual(['AM', 'PM']);
    w.unmount();
  });

  it('★ `hourStep: 15` ⇒ 小时列只剩 `[00, 15]`（上界 23，见文件头第 4 条）', () => {
    const w = mk({ hourStep: 15 });
    // 🚨 **不是 4 项** —— `generateUnits(0, 23, 15)` 只出 00 / 15
    expect(labelsOf(w, 0)).toEqual(['00', '15']);
    w.unmount();
  });

  it('★ `minuteStep: 30` ⇒ 分钟列 `[00, 30]`', () => {
    const w = mk({ minuteStep: 30 });
    expect(labelsOf(w, 1)).toEqual(['00', '30']);
    w.unmount();
  });

  it('★ `disabledTime` ⇒ 那些档位被禁用（**格数不变**：这是禁用不是跳过）', () => {
    const w = mk({ disabledTime: () => ({ disabledHours: () => [0, 1, 2] }) });
    expect(cellsOf(w, 0)).toHaveLength(24);
    expect(
      cellsOf(w, 0).filter((c) => c.classList.contains(`${P}-time-panel-cell-disabled`)),
    ).toHaveLength(3);
    w.unmount();
  });

  it('★ `hideDisabledOptions` ⇒ 直接**跳过**禁用档位（格数变少）', () => {
    const w = mk({
      hideDisabledOptions: true,
      disabledTime: () => ({ disabledHours: () => [0, 1, 2] }),
    });
    expect(cellsOf(w, 0)).toHaveLength(21);
    w.unmount();
  });

  it('★ `showHour: false` ⇒ 小时列消失（**显式关**要真的关得掉）', () => {
    const w = mk({ showHour: false });
    // 显式关掉一列之后只剩分 / 秒（`fillShowConfig` 的 `existFalse` 分支）
    expect(labelsOf(w, 0)).toHaveLength(60);
    expect(columns(w)).toHaveLength(2);
    w.unmount();
  });

  it('★ 深层透传：`TimePicker` → `DatePicker` 这条链不能把键吃掉', () => {
    // 这两条一起给，验证的是「多键共存」而不是单键
    const w = mk({ use12Hours: true, minuteStep: 30 });
    expect(columns(w)).toHaveLength(4);
    expect(labelsOf(w, 1)).toEqual(['00', '30']);
    w.unmount();
  });

  it('`TimeRangePicker` 同样吃到顶层配置（另一条合并路径）', () => {
    const w = mountRange({
      open: true,
      use12Hours: true,
      defaultValue: [D('2016-11-22 12:30:45'), D('2016-11-22 13:45:00')],
    });
    expect(columns(w)).toHaveLength(4);
    w.unmount();
  });
});

// ===========================================================================
// 6.3 · `onSelect` / `ok` 的载荷
// ===========================================================================

describe('TimePicker · `onSelect` / `ok` 的载荷与发出（Issue #6.3）', () => {
  // 🚨 用 `onSelect` / `onOk` 而不是 `w.emitted('x')`：**薄壳不声明 `defineEmits`**
  //    （见 TimePicker.vue 文件头第 5 条）⇒ 内层的 emit 走的是转发下去的 `onXxx`，
  //    不会记在外层实例上。
  const hourCell = (w: { element: HTMLElement }, label: string) =>
    cellsOf(w, 0).find((c) => c.textContent?.trim() === label);

  it('★ 点小时格 ⇒ `onSelect` 收到**单个 Dayjs**（不是数组）', async () => {
    const onSelect = vi.fn();
    const w = mountTimePicker({
      open: true,
      defaultValue: D('2016-11-22 12:30:45'),
      onSelect,
    });
    await w.vm.$nextTick();

    hourCell(w, '08')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await w.vm.$nextTick();

    expect(onSelect).toHaveBeenCalled();
    const payload = onSelect.mock.calls.at(-1)?.[0];
    // 🚨 修复前是 `[Dayjs]`（数组）—— 与 `TimePickerProps['onSelect'] = (v: Dayjs) => void` 相反
    expect(Array.isArray(payload)).toBe(false);
    expect(dayjs.isDayjs(payload)).toBe(true);
    expect((payload as dayjs.Dayjs).hour()).toBe(8);
    w.unmount();
  });

  it('★ 点 `OK` ⇒ `onOk` **真的被调到**，载荷是**单个 Dayjs**', async () => {
    const onOk = vi.fn();
    const w = mountTimePicker({
      open: true,
      needConfirm: true,
      defaultValue: D('2016-11-22 12:30:45'),
      onOk,
    });
    await w.vm.$nextTick();

    okButton(w)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await w.vm.$nextTick();

    // 🚨 修复前 `onOk` 一次都不会被调（`triggerOk` 在本仓没有任何调用点）
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

    okButton(w)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await w.vm.$nextTick();

    expect(onOk).toHaveBeenCalled();
    const payload = onOk.mock.calls.at(-1)?.[0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(2);
    expect(dayjs.isDayjs((payload as unknown[])[0])).toBe(true);
    w.unmount();
  });
});

// ===========================================================================
// 6.5 · defaultOpenValue 锚定面板
// ===========================================================================

describe('TimePicker · `defaultOpenValue` 锚定面板（Issue #6.5）', () => {
  it('★ 无值 + `defaultOpenValue` ⇒ 三列都停在它那一刻（而不是 `getNow()`）', () => {
    const w = mountTimePicker({ open: true, defaultOpenValue: D('2016-11-22 00:00:00') });
    expect(selectedLabels(w)).toEqual(['00', '00', '00']);
    w.unmount();
  });

  it('★ 锚定**不写入**值：不发 `change`，输入框仍为空', () => {
    const w = mountTimePicker({ open: true, defaultOpenValue: D('2016-11-22 00:00:00') });
    expect(w.emitted('change')).toBeUndefined();
    expect((w.element.querySelector(`.${P}-input input`) as HTMLInputElement).value).toBe('');
    w.unmount();
  });

  it('反向哨兵：有值时 `defaultOpenValue` **不生效**（面板跟随值）', () => {
    const w = mountTimePicker({
      open: true,
      defaultValue: D('2016-11-22 07:08:09'),
      defaultOpenValue: D('2016-11-22 00:00:00'),
    });
    expect(selectedLabels(w)).toEqual(['07', '08', '09']);
    w.unmount();
  });

  it('★ 无值 + `defaultOpenValue` ⇒ 「确定」**可点**（`footerSubmitValue` 的同一条分支）', () => {
    const w = mountTimePicker({
      open: true,
      needConfirm: true,
      defaultOpenValue: D('2016-11-22 00:00:00'),
    });
    expect(okButton(w)?.disabled).toBe(false);
    w.unmount();
  });

  it('★ 点「确定」⇒ 落到 `defaultOpenValue`（上游 `onFooterSubmit` 的第一步）', async () => {
    const onOk = vi.fn();
    const w = mountTimePicker({
      open: true,
      needConfirm: true,
      defaultOpenValue: D('2016-11-22 06:07:08'),
      onOk,
    });
    await w.vm.$nextTick();

    okButton(w)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await w.vm.$nextTick();

    expect(onOk).toHaveBeenCalled();
    const payload = onOk.mock.calls.at(-1)?.[0] as dayjs.Dayjs | null;
    expect(dayjs.isDayjs(payload)).toBe(true);
    expect(payload?.hour()).toBe(6);
    expect(payload?.minute()).toBe(7);
    w.unmount();
  });

  it('反向哨兵：**没有** `defaultOpenValue` 的空值 picker ⇒ 确定按钮禁用', () => {
    const w = mountTimePicker({ open: true, needConfirm: true });
    expect(okButton(w)?.disabled).toBe(true);
    w.unmount();
  });
});
