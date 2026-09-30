/**
 * L2 —— 掩码模式的交互（S3）。
 *
 * 契约来源：`@rc-component/picker` 的 `PickerInput/Selector/Input.js`（360 行）里
 * `format` 存在时才生效的那一半；掩码对象本身由 `mask-format.test.ts`（18 条）覆盖。
 *
 * ── 这个文件钉住的三件事 ────────────────────────────────────────────────────
 *
 * 1. **DOM 不变**：还是**一个 `<input>`**，「分段」只体现在 `setSelectionRange` 上。
 * 2. **键入走 `keydown`**：掩码模式下原生 `input` 事件是**空实现**
 *    （上游 `Input.js` 的 `onInternalChange` 的 `if (!format)`）。
 * 3. **「按了不生效的键」必须被打回**：Vue 不像 React 那样每次渲染都写回受控 `value`
 *    ⇒ 组件必须主动「打一拍」强制重渲染，否则原生字符会留在输入框里。
 *
 * ⚠️ jsdom **无布局** ⇒ `selectionStart/End` 能读能设（`setSelectionRange` 是纯数据），
 * 但**光标视觉位置**测不到（靠 L6）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';
const input = (w: ReturnType<typeof mount>) => w.find(`.${P}-input input`);
const el = (w: ReturnType<typeof mount>) => input(w).element as HTMLInputElement;

/** 掩码模式：`format` 写成对象并给 `type: 'mask'`。 */
const MASK = { format: { format: 'YYYY-MM-DD', type: 'mask' } } as const;
/** 普通模式（反向哨兵用）。 */
const PLAIN = { format: 'YYYY-MM-DD' } as const;

describe('DatePicker · 掩码模式（S3）', () => {
  it('🚨 掩码模式下，聚焦后输入框显示**模板**（`YYYY-MM-DD`）', async () => {
    // 上游 `Input.js:311-334`：聚焦时 `!maskFormat.match(inputValue)` ⇒ 重置成 `format`
    const w = mount(DatePicker, { props: { open: true, ...MASK } });
    expect(el(w).value).toBe('');

    await input(w).trigger('focus');
    await nextTick();

    expect(el(w).value).toBe('YYYY-MM-DD');
    w.unmount();
  });

  it('反向哨兵：**非**掩码模式聚焦后不显示模板（值仍是空）', async () => {
    const w = mount(DatePicker, { props: { open: true, ...PLAIN } });
    await input(w).trigger('focus');
    await nextTick();

    expect(el(w).value).toBe('');
    w.unmount();
  });

  it('🚨 键入数字 ⇒ **补零到当前字段**（`leftPad`）：`2` ⇒ `0002-MM-DD`', async () => {
    const w = mount(DatePicker, { props: { open: true, ...MASK } });
    await input(w).trigger('focus');

    await input(w).trigger('keydown', { key: '2' });

    expect(el(w).value).toBe('0002-MM-DD');
    w.unmount();
  });

  it('`ArrowRight` / `ArrowLeft` 在字段间移动选择区间（`[start, end)`）', async () => {
    const w = mount(DatePicker, { props: { open: true, ...MASK } });
    await input(w).trigger('focus');
    // 聚焦时选择区间对到第 0 个字段
    expect([el(w).selectionStart, el(w).selectionEnd]).toEqual([0, 4]);

    await input(w).trigger('keydown', { key: 'ArrowRight' });
    await nextTick();
    expect([el(w).selectionStart, el(w).selectionEnd]).toEqual([5, 7]);

    await input(w).trigger('keydown', { key: 'ArrowLeft' });
    await nextTick();
    expect([el(w).selectionStart, el(w).selectionEnd]).toEqual([0, 4]);
    w.unmount();
  });

  it('🚨 `ArrowUp` 在 `MM` 上 ⇒ 变成 `01`（`offsetCellValue` 的环绕）', async () => {
    const w = mount(DatePicker, { props: { open: true, ...MASK } });
    await input(w).trigger('focus');
    await input(w).trigger('keydown', { key: 'ArrowRight' }); // 移到 MM

    await input(w).trigger('keydown', { key: 'ArrowUp' });

    expect(el(w).value).toBe('YYYY-01-DD');
    w.unmount();
  });

  it('🚨 `Backspace` / `Delete` **一样**：清空当前字段并回填字段模板', async () => {
    for (const key of ['Backspace', 'Delete'] as const) {
      const w = mount(DatePicker, { props: { open: true, ...MASK } });
      await input(w).trigger('focus');
      await input(w).trigger('keydown', { key: '2' }); // 0002-MM-DD
      await input(w).trigger('keydown', { key: 'ArrowRight' }); // 移到 MM

      await input(w).trigger('keydown', { key });

      // MM 被回填成模板本身（不是空）
      expect(el(w).value).toBe('0002-MM-DD');
      w.unmount();
    }
  });

  it('🚨 按「不生效的键」（字母）⇒ 文本不变，且**DOM 里的原生字符被打回**', async () => {
    const w = mount(DatePicker, { props: { open: true, ...MASK } });
    await input(w).trigger('focus');
    const before = el(w).value;

    // 模拟浏览器的原生行为：字符先落进 DOM
    el(w).value = `${before}x`;
    await input(w).trigger('keydown', { key: 'x' });
    await nextTick();

    // 组件主动「打一拍」⇒ `value` 被重新 patch 回 DOM
    expect(el(w).value).toBe(before);
    w.unmount();
  });

  it('⚠️ 空格键**不被过滤**，且空格会**留在文本里**（`leftPad` 只补零不补空格）', async () => {
    // 判据是 `!isNaN(Number(key))` ⇒ `Number(' ') === 0` 通过；
    // 随后 `leftPad(' ', 4)` 把它补成 `'000 '`（4 字符，**空格在末位**）
    // ⇒ 替换 [0,4) 之后得到 `'000 -MM-DD'`。这是上游形态，**不是** bug。
    const w = mount(DatePicker, { props: { open: true, ...MASK } });
    await input(w).trigger('focus');

    await input(w).trigger('keydown', { key: ' ' });

    expect(el(w).value).toBe('000 -MM-DD');
    w.unmount();
  });

  it('✅ 粘贴合法文本 ⇒ 落到输入框（掩码模式的合法输入通道之一）', async () => {
    const w = mount(DatePicker, { props: { open: true, ...MASK } });
    await input(w).trigger('focus');

    const paste = new Event('paste', { bubbles: true }) as Event & {
      clipboardData: { getData: (type: string) => string };
    };
    paste.clipboardData = { getData: () => '2026-09-30' };
    input(w).element.dispatchEvent(paste);
    await nextTick();

    expect(el(w).value).toBe('2026-09-30');
    w.unmount();
  });

  it('🚨 粘贴**非法**文本 ⇒ 不落值（`validateFormat` 挡在前面）', async () => {
    const w = mount(DatePicker, { props: { open: true, ...MASK } });
    await input(w).trigger('focus');
    const before = el(w).value;

    const paste = new Event('paste', { bubbles: true }) as Event & {
      clipboardData: { getData: (type: string) => string };
    };
    paste.clipboardData = { getData: () => '完全不是日期' };
    input(w).element.dispatchEvent(paste);
    await nextTick();

    expect(el(w).value).toBe(before);
    w.unmount();
  });

  it('🚨 掩码模式下原生 `input` 事件**不改状态**，但会把 DOM 值写回去（PLATFORM 差异）', async () => {
    // 上游 `Input.js:117-124`：`if (!format) { … onChange(text) }` ⇒ 有 format 时**不**把
    // 原生输入当成用户输入。⚠️ 但 React 会在事件后 `restoreControlledState` 把 DOM 值强制
    // 还原，**Vue 没有这个机制** ⇒ 本仓在 `onInput` 里主动打一拍把值写回去
    // （否则浏览器在 keydown 之后落进 DOM 的原生字符会留在输入框里）。
    const w = mount(DatePicker, { props: { open: true, ...MASK } });
    await input(w).trigger('focus');
    const before = el(w).value;

    el(w).value = '2026-09-30';
    await input(w).trigger('input');
    await nextTick();

    // ① 状态没被这次「输入」改动（`invalid` 不变 —— 它没走 `applyInputText`）
    expect(input(w).attributes('aria-invalid')).toBe('false');
    expect(w.emitted('change')).toBeUndefined();
    // ② DOM 值被写回（PLATFORM 差异的落点）
    expect(el(w).value).toBe(before);
    w.unmount();
  });
});
