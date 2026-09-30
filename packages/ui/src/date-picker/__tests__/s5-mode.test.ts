/**
 * L2 —— 面板粒度的**受控化**与「打开即重置」（S5 · README §5.5(d)）。
 *
 * 契约来源：`@rc-component/picker` 的
 * `PickerInput/SinglePicker.js:214-222`（`triggerModeChange`）+
 * `:451-456`（`Reset for every active`）+ `:366`（`mode: mergedMode`）。
 *
 * ── 上游的三条判据 ──────────────────────────────────────────────────────────
 *
 * 1. **面板的 `mode` 是受控的**（`mode: mergedMode`）—— 粒度变化全部走
 *    `onPanelChange` 回灌，面板自己的内部状态不生效。
 * 2. **每次打开浮层都把粒度重置回 `picker`**：
 *    ```js
 *    useLayoutEffect(() => {
 *      if (mergedOpen && activeIndex !== undefined) { triggerModeChange(null, picker, false); }
 *    }, [mergedOpen, activeIndex, picker]);
 *    ```
 *    ⚠️ `triggerEvent = false` ⇒ **不**发 `onPanelChange`。
 * 3. **受控的 `props.mode` 不重置**（`setMode` 在受控时不写内部状态）。
 *
 * ── 🚨 为什么第 2 条是必须的 ────────────────────────────────────────────────
 *
 * 本仓的浮层关闭**不卸载**（`Trigger` 的 `removeOnLeave: false`，与 antd 一致）
 * ⇒ 面板的粒度会**跨开合保留**。不重置的话：下钻到年面板 → 关闭 → 再打开
 * **仍停在年面板**，与 antd 不一致。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';

const hasPanel = (w: ReturnType<typeof mount>, name: string) =>
  w.find(`.${P}-${name}-panel`).exists();

describe('DatePicker · 面板粒度的受控化与「打开即重置」（S5）', () => {
  it('点年份按钮 ⇒ 下钻到**年面板**（`onPanelChange` 回灌 `mode`）', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    expect(hasPanel(w, 'date')).toBe(true);

    await w.find(`.${P}-year-btn`).trigger('click');
    await nextTick();

    expect(hasPanel(w, 'year')).toBe(true);
    expect(hasPanel(w, 'date')).toBe(false);
    // 上游 `triggerModeChange` 会**同时**发 `onPanelChange`
    expect(w.emitted('panelChange')?.at(-1)?.[1]).toBe('year');
    w.unmount();
  });

  it('🚨 **关闭再打开 ⇒ 粒度重置回 `picker`**（`Reset for every active`）', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    await w.find(`.${P}-year-btn`).trigger('click');
    await nextTick();
    expect(hasPanel(w, 'year')).toBe(true);

    // 关 → 开（受控 open；浮层**不卸载**，所以粒度会跨开合保留 —— 必须靠重置）
    await w.setProps({ open: false });
    await nextTick();
    await w.setProps({ open: true });
    await nextTick();

    expect(hasPanel(w, 'date')).toBe(true);
    expect(hasPanel(w, 'year')).toBe(false);
    w.unmount();
  });

  it('🚨 重置**不**发 `onPanelChange`（上游 `triggerEvent = false`）', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    await w.find(`.${P}-year-btn`).trigger('click');
    await nextTick();
    const countAfterDrill = w.emitted('panelChange')?.length ?? 0;

    await w.setProps({ open: false });
    await nextTick();
    await w.setProps({ open: true });
    await nextTick();

    expect(w.emitted('panelChange')?.length ?? 0).toBe(countAfterDrill);
    w.unmount();
  });

  it('⚠️ **受控 `mode`** ⇒ 打开时不重置（上游 `setMode` 在受控时不写内部状态）', async () => {
    const w = mount(DatePicker, { props: { open: true, mode: 'year' } });
    expect(hasPanel(w, 'year')).toBe(true);

    await w.setProps({ open: false });
    await nextTick();
    await w.setProps({ open: true });
    await nextTick();

    // 受控 ⇒ 仍是 year
    expect(hasPanel(w, 'year')).toBe(true);
    w.unmount();
  });

  it('下钻链：年 → 月（点年面板的一格 ⇒ 回灌下一档粒度）', async () => {
    const w = mount(DatePicker, { props: { open: true } });
    await w.find(`.${P}-year-btn`).trigger('click');
    await nextTick();

    // 年面板里点一格 ⇒ `onPanelValueSelect`：先 `onSelect`，再 `triggerModeChange('month')`
    const cell = w.findAll(`.${P}-cell`).find((c) => !c.classes().includes(`${P}-cell-disabled`));
    await cell?.trigger('click');
    await nextTick();

    expect(hasPanel(w, 'month')).toBe(true);
    w.unmount();
  });
});
