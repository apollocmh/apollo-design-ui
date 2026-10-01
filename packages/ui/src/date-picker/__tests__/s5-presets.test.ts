/**
 * L2 / L4 · 预设与悬停预览（S5）—— DatePicker（单值）
 *
 * 契约来源（**读源码得到**）：`@rc-component/picker@1.12.2` 的
 *   - `es/PickerInput/Popup/PresetPanel.js`（31 行）
 *   - `es/PickerInput/hooks/usePresets.js`（16 行）
 *   - `es/PickerInput/Popup/index.js:97-140`（`-panel-layout` 的三段布局）
 *   - `es/PickerInput/SinglePicker.js:264-303`（`hoverValues` / `selectorValues` /
 *     `onPresetHover` / `onPresetSubmit` / `onNow`）
 *   - `es/PickerInput/Popup/PopupPanel.js:34-44`（`onCellDblClick` / `hideHeader`）
 *   - `es/PickerInput/Selector/hooks/useInputProps.js`（`helped`）
 *   - `es/PickerInput/Selector/Input.js:344-347`（`-input-placeholder`）
 *
 * ── 六条判据（每一条都对应一个「想当然会写错」的地方）────────────────────────
 *
 * 1. 🚨 **空列表整块不渲染**（`PresetPanel` 返回 `null`，不是空 `<div>`）——
 *    浮层里连 `-presets` 这个类名都没有。
 * 2. 🚨 **`value` 每次用都重新求值**（`executeValue`）：`onMouseEnter` 与 `onClick`
 *    **各求值一次**，不是求值一次缓存起来。
 * 3. 🚨 **单值的 `activeHelp` 单独不生效**：上游判据是
 *    `helped = allHelp || (activeHelp && activeIndex === index)`，而单值的
 *    `activeIndex` 是 `undefined` ⇒ 只有 `allHelp`（悬停**预设**）能让输入框
 *    进入 `-input-placeholder` 态。
 * 4. 🚨 **输入框显示的是 `selectorValues`**（悬停时**就是**悬停值本身，
 *    不含已选值），不是 `calendarValue`。
 * 5. 🚨 **`previewValue: false` 时整条悬停预览关掉**（`onSetHover` 直接返回）——
 *    但 `presets` 仍然可点。
 * 6. 🚨 **`onCellDblClick` 只在 `needConfirm` 时提交**（否则双击什么都不做）。
 */

import { mount } from '@vue/test-utils';
import dayjs, { type Dayjs } from 'dayjs';
import { describe, expect, it } from 'vitest';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';
const D = (s: string) => dayjs(s);

/** 浮层只有 `open: true` 时才渲染。 */
const mountOpen = (props: Record<string, unknown> = {}) =>
  mount(DatePicker, { props: { open: true, ...props } });

const presetItems = (w: ReturnType<typeof mount>) => w.findAll(`.${P}-presets li`);
const inputValue = (w: ReturnType<typeof mount>) =>
  (w.find(`.${P}-input input`).element as HTMLInputElement).value;
const inputClasses = (w: ReturnType<typeof mount>) => w.find(`.${P}-input`).classes();
const isHelped = (w: ReturnType<typeof mount>) =>
  inputClasses(w).includes(`${P}-input-placeholder`);

describe('DatePicker · 预设列表（S5）', () => {
  it('🚨 没给 `presets` ⇒ **连 `-presets` 节点都没有**（空列表整块不渲染）', () => {
    const w = mountOpen();
    expect(w.find(`.${P}-presets`).exists()).toBe(false);
    w.unmount();
  });

  it('🚨 `presets: []` ⇒ 同样**不渲染**（`.length` 判空，不是 `undefined` 判空）', () => {
    const w = mountOpen({ presets: [] });
    expect(w.find(`.${P}-presets`).exists()).toBe(false);
    w.unmount();
  });

  it('`presets` 非空 ⇒ `-presets > ul > li`，`li` 的文本 = `label`', () => {
    const w = mountOpen({
      presets: [
        { label: '上周', value: D('2026-09-24') },
        { label: '本周', value: D('2026-10-01') },
      ],
    });
    expect(w.find(`.${P}-presets`).exists()).toBe(true);
    const items = presetItems(w);
    expect(items).toHaveLength(2);
    expect(items.map((li) => li.text())).toEqual(['上周', '本周']);
    // ⚠️ 预设列表与「面板 + 页脚」那一层**并列**，都在 `-panel-layout` 里
    const layout = w.find(`.${P}-panel-layout`);
    expect(layout.find(`.${P}-presets`).exists()).toBe(true);
    expect(layout.find(`.${P}-panel`).exists()).toBe(true);
    w.unmount();
  });

  it('点一个预设 ⇒ 发 `change`（值是预设值）并**关闭浮层**', async () => {
    const w = mountOpen({ presets: [{ label: 'A', value: D('2026-09-10') }] });
    await presetItems(w)[0]!.trigger('click');

    const emitted = w.emitted('change');
    expect(emitted).toBeTruthy();
    expect((emitted![0]![0] as Dayjs).format('YYYY-MM-DD')).toBe('2026-09-10');
    // 上游 `onPresetSubmit`：`passed && !multiple` ⇒ `triggerOpen(false, { force: true })`
    expect(w.emitted('openChange')?.at(-1)?.[0]).toBe(false);
    w.unmount();
  });

  it('🚨 函数形态的 `value` **每次用都重新求值**，但 `mouseleave` **不**求值', async () => {
    let calls = 0;
    const value = () => {
      calls += 1;
      return D('2026-09-10');
    };
    const w = mountOpen({ presets: [{ label: 'A', value }] });
    const li = presetItems(w)[0]!;

    await li.trigger('mouseenter');
    expect(calls).toBe(1);
    /**
     * 🚨 上游 `PresetPanel.js` 的 `onMouseLeave: () => { onHover(null); }` ——
     * **不调 `executeValue`**（它传的是 `null`）。所以离开**不**产生新的求值。
     */
    await li.trigger('mouseleave');
    expect(calls).toBe(1);

    await li.trigger('click');
    expect(calls).toBe(2);
    w.unmount();
  });
});

describe('DatePicker · 悬停即预览（S5）', () => {
  it('🚨 悬停预设 ⇒ 输入框显示**预览值**且转成 `-input-placeholder` 态', async () => {
    const w = mountOpen({
      defaultValue: D('2026-09-01'),
      presets: [{ label: 'A', value: D('2026-09-10') }],
    });
    // 预览前：显示已选值，且不是 placeholder 态
    expect(inputValue(w)).toBe('2026-09-01');
    expect(isHelped(w)).toBe(false);

    await presetItems(w)[0]!.trigger('mouseenter');
    expect(inputValue(w)).toBe('2026-09-10');
    expect(isHelped(w)).toBe(true);
    w.unmount();
  });

  it('离开预设 ⇒ 预览清除，文本与类名都回到已选值', async () => {
    const w = mountOpen({
      defaultValue: D('2026-09-01'),
      presets: [{ label: 'A', value: D('2026-09-10') }],
    });
    const li = presetItems(w)[0]!;
    await li.trigger('mouseenter');
    await li.trigger('mouseleave');

    expect(inputValue(w)).toBe('2026-09-01');
    expect(isHelped(w)).toBe(false);
    w.unmount();
  });

  it('🚨 悬停面板格子会预览文本，但**不**进 `-input-placeholder` 态（单值的 `activeHelp` 单独不生效）', async () => {
    const w = mountOpen({
      defaultValue: D('2026-09-10'),
      defaultPickerValue: D('2026-09-01'),
    });
    expect(inputValue(w)).toBe('2026-09-10');

    const cell = w.findAll(`.${P}-cell-in-view`).find((c) => c.text() === '15');
    expect(cell).toBeTruthy();
    await cell!.trigger('mouseenter');

    // `selectorValues` 那一支生效：输入框换成了悬停值……
    expect(inputValue(w)).toBe('2026-09-15');
    // ……但 `helped = allHelp || (activeHelp && activeIndex === index)`，
    //    单值的 `activeIndex` 是 `undefined` ⇒ 第二个分句恒假 ⇒ 类名**不该**出现。
    expect(isHelped(w)).toBe(false);
    w.unmount();
  });

  it('🚨 `previewValue: false` ⇒ 悬停**不**预览（文本与类名都不动）', async () => {
    const w = mountOpen({
      previewValue: false,
      defaultValue: D('2026-09-01'),
      presets: [{ label: 'A', value: D('2026-09-10') }],
    });
    await presetItems(w)[0]!.trigger('mouseenter');

    expect(inputValue(w)).toBe('2026-09-01');
    expect(isHelped(w)).toBe(false);
    w.unmount();
  });

  it('悬停预设 ⇒ 面板对应格子带 `-cell-hover`（`hoverValue` 真的传下去了）', async () => {
    const w = mountOpen({
      defaultPickerValue: D('2026-09-01'),
      presets: [{ label: 'A', value: D('2026-09-10') }],
    });
    expect(w.findAll(`.${P}-cell-hover`)).toHaveLength(0);

    await presetItems(w)[0]!.trigger('mouseenter');
    const hovered = w.findAll(`.${P}-cell-hover`);
    expect(hovered).toHaveLength(1);
    expect(hovered[0]!.text()).toBe('10');
    w.unmount();
  });

  it('关闭浮层时清掉预览值（上游 `SinglePicker.js:288-292` 的 effect）', async () => {
    const w = mount(DatePicker, {
      props: {
        open: true,
        defaultValue: D('2026-09-01'),
        presets: [{ label: 'A', value: D('2026-09-10') }],
      },
    });
    await presetItems(w)[0]!.trigger('mouseenter');
    expect(isHelped(w)).toBe(true);

    await w.setProps({ open: false });
    await w.setProps({ open: true });
    expect(inputValue(w)).toBe('2026-09-01');
    expect(isHelped(w)).toBe(false);
    w.unmount();
  });
});

describe('DatePicker · 面板的两个 hack 面（S5）', () => {
  it("🚨 `picker: time` ⇒ 面板**没有表头**（`hideHeader = picker === 'time'`）", () => {
    const w = mountOpen({ picker: 'time' });
    expect(w.find(`.${P}-header`).exists()).toBe(false);
    w.unmount();
  });

  it('`picker: date` ⇒ 有表头（反向哨兵：别把 `hideHeader` 写成恒真）', () => {
    const w = mountOpen();
    expect(w.find(`.${P}-header`).exists()).toBe(true);
    w.unmount();
  });

  it('🚨 `needConfirm` 时双击格子 ⇒ 提交（发 `change`）并关浮层', async () => {
    const w = mountOpen({
      needConfirm: true,
      defaultValue: D('2026-09-10'),
      defaultPickerValue: D('2026-09-01'),
    });
    expect(w.emitted('change')).toBeUndefined();

    /**
     * ⚠️ 真实浏览器里一次双击 = `click` ×2 + `dblclick`，这里照实派发：
     *   - 两个 `click` ⇒ `onSelect` ⇒ `panel-final` + `needConfirm` ⇒ **只改临时值**（`modify`）；
     *   - `dblclick` ⇒ `onCellDblClick` ⇒ `confirm` ⇒ `switchNext` ⇒ `flushSubmit` ⇒ 提交。
     * 只派发 `dblclick` 的话「临时值 = 已提交值」⇒ 提交后值没变 ⇒ `onChange` **不该**发。
     */
    const cell = w
      .findAll(`.${P}-cell-in-view`)
      .find((c) => c.text() === '15' && !c.classes().includes(`${P}-cell-disabled`));
    expect(cell).toBeTruthy();
    await cell!.trigger('click');
    await cell!.trigger('click');
    await cell!.trigger('dblclick');

    const emitted = w.emitted('change');
    expect(emitted).toBeTruthy();
    expect((emitted![0]![0] as Dayjs).format('YYYY-MM-DD')).toBe('2026-09-15');
    expect(w.emitted('openChange')?.at(-1)?.[0]).toBe(false);
    w.unmount();
  });

  it('🚨 **没有** `needConfirm` 时 `dblclick` 是空操作（`onCellDblClick` 内部先判 `needConfirm`）', async () => {
    const w = mountOpen({
      defaultValue: D('2026-09-10'),
      defaultPickerValue: D('2026-09-01'),
    });
    const cell = w.findAll(`.${P}-cell-in-view`).find((c) => c.text() === '15');
    expect(cell).toBeTruthy();
    // ⚠️ 只派发 `dblclick`（不派发前置的 `click`）⇒ 命中的只可能是 `onCellDblClick`
    await cell!.trigger('dblclick');

    expect(w.emitted('change')).toBeUndefined();
    // 反向哨兵：也**没有**顺手关浮层
    expect(w.emitted('openChange')).toBeUndefined();
    w.unmount();
  });
});
