/**
 * L2 —— 多选模式（S5 · 单值壳的 `multiple`）。
 *
 * 契约来源：`@rc-component/picker` 的 `PickerInput/Selector/SingleSelector/index.js`
 * （`selectorNode` 的 multiple 分支）+ `SingleSelector/MultipleDates.js`（77 行）。
 *
 * ── 结构（多选**没有** `-input` 包裹层）──────────────────────────────────────
 *
 * ```
 * <div class="apollo-picker apollo-picker-multiple ...">        ← 根（`-multiple` 排第 1）
 *   <div class="apollo-picker-selector">                        ← MultipleDates 的根
 *     <div class="apollo-picker-selection-overflow">            ← Overflow
 *       <div class="...-overflow-item"><span class="-selection-item">…</span></div>
 *       <div class="...-overflow-item-rest">+ N ...</div>
 *     </div>
 *     <span class="apollo-picker-selection-placeholder">…</span>  ← 仅无值时
 *   </div>
 *   <input class="apollo-picker-multiple-input" readonly />      ← 只为表单/无障碍保留
 *   <span class="apollo-picker-suffix">…</span>
 *   <button class="apollo-picker-clear">…</button>               ← 有值时
 * </div>
 * ```
 *
 * ── 🚨 三条判据 ────────────────────────────────────────────────────────────
 *
 * 1. **删除图标的 `mousedown` 被 `preventDefault`**（`MultipleDates.js:26-30`）——
 *    否则点删除会让输入框失焦（面板会跟着关）。
 * 2. **`maxTagCount` 是数字时**：只渲染前 N 个 + 一个 `+ M ...` 的 rest 节点。
 * 3. **`disabled` 时不渲染删除图标**（`!disabled && onClose` 才渲染）。
 */

import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import DatePicker from '../DatePicker.vue';
import type { CustomTagProps } from '../interface';

const P = 'apollo-picker';
const TWO = [dayjs('2026-09-30'), dayjs('2026-10-01')];

const items = (w: ReturnType<typeof mount>) => w.findAll(`.${P}-selection-item`);

describe('DatePicker · 多选（S5）', () => {
  it('`multiple` ⇒ 根加 `-multiple`，并渲染 `-selector` + 标签 + `-multiple-input`', async () => {
    const w = mount(DatePicker, { props: { multiple: true, defaultValue: TWO } });

    expect(w.find(`.${P}`).classes()).toContain(`${P}-multiple`);
    expect(w.find(`.${P}-selector`).exists()).toBe(true);
    expect(w.find(`.${P}-multiple-input`).exists()).toBe(true);
    // 🚨 多选**没有** `-input` 包裹层（那是单值/范围才有的结构）
    expect(w.find(`.${P}-input`).exists()).toBe(false);

    expect(items(w)).toHaveLength(2);
    expect(items(w)[0]?.text()).toContain('2026-09-30');
    expect(items(w)[1]?.text()).toContain('2026-10-01');
    w.unmount();
  });

  it('反向哨兵：**非**多选 ⇒ 不渲染 `-selector` / `-multiple-input`', async () => {
    const w = mount(DatePicker, { props: { defaultValue: dayjs('2026-09-30') } });
    expect(w.find(`.${P}-selector`).exists()).toBe(false);
    expect(w.find(`.${P}-multiple-input`).exists()).toBe(false);
    expect(w.find(`.${P}-input`).exists()).toBe(true);
    w.unmount();
  });

  it('无值时渲染 `-selection-placeholder`（取 `placeholder`）', async () => {
    const w = mount(DatePicker, { props: { multiple: true, placeholder: '请选择' } });
    const ph = w.find(`.${P}-selection-placeholder`);
    expect(ph.exists()).toBe(true);
    expect(ph.text()).toBe('请选择');
    expect(items(w)).toHaveLength(0);
    w.unmount();
  });

  it('`-multiple-input` 的值是各标签文本用 `,` 连接，且**只读**', async () => {
    const w = mount(DatePicker, { props: { multiple: true, defaultValue: TWO } });
    const input = w.find(`.${P}-multiple-input`).element as HTMLInputElement;
    expect(input.value).toBe('2026-09-30,2026-10-01');
    expect(input.readOnly).toBe(true);
    w.unmount();
  });

  it('🚨 点标签的删除图标 ⇒ 该标签被移除（关浮层时走 `remove` 来源 ⇒ **最终**提交）', async () => {
    const w = mount(DatePicker, { props: { multiple: true, defaultValue: TWO } });

    await items(w)[0]?.find(`.${P}-selection-item-remove`).trigger('click');

    // `remove` 是唯一「即使不允许为空也要提交」的来源 ⇒ 直接发 `change`
    expect(w.emitted('change')?.at(-1)?.[0]).toHaveLength(1);
    expect(items(w)).toHaveLength(1);
    expect(items(w)[0]?.text()).toContain('2026-10-01');
    w.unmount();
  });

  it('🚨 删除图标的 `mousedown` 被 `preventDefault`（不抢焦点）', async () => {
    const w = mount(DatePicker, { props: { multiple: true, defaultValue: TWO } });
    const remove = items(w)[0]?.find(`.${P}-selection-item-remove`);
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    remove?.element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    w.unmount();
  });

  it('`maxTagCount` 是数字 ⇒ 只渲染前 N 个 + 一个 `+ M ...` 的 rest 节点', async () => {
    const w = mount(DatePicker, {
      props: { multiple: true, defaultValue: TWO, maxTagCount: 1 },
    });

    expect(items(w)).toHaveLength(1);
    expect(items(w)[0]?.text()).toContain('2026-09-30');
    const rest = w.find(`.${P}-selection-overflow-item-rest`);
    expect(rest.exists()).toBe(true);
    expect(rest.text()).toBe('+ 1 ...');
    w.unmount();
  });

  it('`tagRender` ⇒ 自定义标签（拿到 label / value / closable / onClose）', async () => {
    const w = mount(DatePicker, {
      props: {
        multiple: true,
        defaultValue: TWO,
        // ⚠️ `label` 的类型是 `VNodeChild`（不是 `string`）—— 上游 `CustomTagProps`
        tagRender: (info: CustomTagProps) => `【${String(info.label)}】`,
      },
    });

    // 自定义标签替换掉默认的 `-selection-item`
    expect(items(w)).toHaveLength(0);
    expect(w.find(`.${P}-selector`).text()).toContain('【2026-09-30】');
    w.unmount();
  });

  it('🚨 `disabled` ⇒ 不渲染删除图标', async () => {
    const w = mount(DatePicker, {
      props: { multiple: true, defaultValue: TWO, disabled: true },
    });
    expect(items(w)).toHaveLength(2);
    expect(w.find(`.${P}-selection-item-remove`).exists()).toBe(false);
    w.unmount();
  });
});
