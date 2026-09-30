/**
 * L2 —— 焦点语义与 `-focused` 根类名（S4 · 单值部分）。
 *
 * 契约来源：`@rc-component/picker` 的
 * `PickerInput/hooks/useFocusEvents.js`（55 行）+ `SingleSelector/index.js:150-172`。
 *
 * ── 🚨 本文件最重要的一条：**失焦 ≠ 关浮层** ────────────────────────────────
 *
 * 上游 `onFieldBlur` 的判据是
 * `if (!isInternalElement(event.relatedTarget)) { setFocusedIndex(null); onConfirmedBlur?.(); }`
 * —— 只有「新焦点**既不在选择器根、也不在浮层里**」才算**确认离开**。
 *
 * 为什么这条是**必须**的：面板根是 `tabindex="0"` 的 div（`picker-panel.ts` 的
 * `tabIndex` 默认 `0`）⇒ 点格子时焦点落到**面板**上、`relatedTarget` 在浮层里
 * ⇒ 不算离开 ⇒ 浮层不关。写成「一 blur 就关」会让 `showTime` 的确认制直接废掉
 * （点第一个日期就把浮层关了）。
 *
 * ── 覆盖范围 ────────────────────────────────────────────────────────────────
 *
 * 单值可达的部分：`-focused` 类名、`focus`/`blur` 事件、确认离开才关浮层、类名顺序。
 * ⚠️ **范围专属**的两项**不在这里**（本仓还没有 RangePicker）：
 *   - `-input-active`（`Input.js` 的 `active = activeIndex === index` ——
 *     上游 `SinglePicker` **不传** `activeIndex` 给 `SingleSelector` ⇒ 单值恒不加）；
 *   - `useFocusLock` 的强切换聚焦（`forceFocus` 在单值下恒为 `false`，
 *     因为 `submitField` 一定 `allFieldsTriggered` ⇒ `reset()` 把它抹掉）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';
const input = (w: ReturnType<typeof mount>) => w.find(`.${P}-input input`);
const rootClasses = (w: ReturnType<typeof mount>) => w.find(`.${P}`).classes();

describe('DatePicker · 焦点语义（S4）', () => {
  it('聚焦 ⇒ 根加 `-focused`，发 `focus` 事件，并打开浮层', async () => {
    const w = mount(DatePicker);
    expect(rootClasses(w)).not.toContain(`${P}-focused`);

    await input(w).trigger('focus');

    expect(rootClasses(w)).toContain(`${P}-focused`);
    expect(w.emitted('focus')).toHaveLength(1);
    expect(w.emitted('openChange')?.at(-1)).toEqual([true]);
    w.unmount();
  });

  it('🚨 失焦到**浮层里的元素**（面板根）⇒ **不**清焦点、**不**关浮层', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).trigger('focus');
    expect(rootClasses(w)).toContain(`${P}-focused`);

    // 面板根是 `tabindex="0"` 的 div ⇒ 点格子时它就是 `relatedTarget`
    const panel = w.find(`.${P}-panel`);
    expect(panel.exists()).toBe(true);

    await input(w).trigger('blur', { relatedTarget: panel.element });

    expect(rootClasses(w)).toContain(`${P}-focused`);
    // ⚠️ `focus` 本身会发一次 `openChange(true)` ⇒ 断言的是「**没有** false」，
    //    不是「一次都没发过」。
    expect(w.emitted('openChange')?.at(-1)).toEqual([true]);
    w.unmount();
  });

  it('🚨 失焦到**外部** ⇒ 清 `-focused`、发 `blur`、**关浮层**（确认离开）', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).trigger('focus');

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    await input(w).trigger('blur', { relatedTarget: outside });

    expect(rootClasses(w)).not.toContain(`${P}-focused`);
    expect(w.emitted('blur')).toHaveLength(1);
    expect(w.emitted('openChange')?.at(-1)).toEqual([false]);
    w.unmount();
    outside.remove();
  });

  it('⚠️ `relatedTarget` 为 `null`（焦点掉到 body）也算**确认离开**', async () => {
    // 上游 `isTargetInContainers(null, …)` 恒为 false
    const w = mount(DatePicker, { props: { open: true } });
    await input(w).trigger('focus');

    await input(w).trigger('blur');

    expect(rootClasses(w)).not.toContain(`${P}-focused`);
    expect(w.emitted('openChange')?.at(-1)).toEqual([false]);
    w.unmount();
  });

  it('反复聚焦 / 失焦 ⇒ `-focused` 可逆（不会粘住）', async () => {
    const w = mount(DatePicker);
    await input(w).trigger('focus');
    expect(rootClasses(w)).toContain(`${P}-focused`);

    await input(w).trigger('blur');
    expect(rootClasses(w)).not.toContain(`${P}-focused`);

    await input(w).trigger('focus');
    expect(rootClasses(w)).toContain(`${P}-focused`);
    w.unmount();
  });
});
