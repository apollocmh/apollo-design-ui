/**
 * L4 · 浮层外壳（`-panel-container` / `-panel-layout`）—— DatePicker
 *
 * 契约来源（**读源码得到**）：`@rc-component/picker@1.12.2` 的
 * `es/PickerInput/Popup/index.js:120-163`。浮层的完整结构是：
 *
 * ```
 * div.{prefixCls}-dropdown
 *   └─ div.{prefixCls}-panel-container.{prefixCls}-{internalMode}-panel-container
 *       └─ div.{prefixCls}-panel-layout
 *           ├─ PresetPanel            ← S5 未落地
 *           └─ div
 *               ├─ PickerPanel        ← 面板本体（在 @apollo-design/picker）
 *               └─ Footer             ← S5 未落地（`Today` 按钮）
 * ```
 *
 * ── 🚨 为什么这两层必须单独钉住（2026-10-01 实测）────────────────────────────
 *
 * 这两层**看起来像纯包装**，其实是三条关键行为的**唯一宿主**：
 *
 * | # | 行为 | 挂在哪 |
 * |---|---|---|
 * | 1 | 把浮层根的 `pointer-events: none` **重置成 `auto`** | `-panel-container` |
 * | 2 | `box-shadow` / `border-radius` / `overflow: hidden` | `-panel-container` |
 * | 3 | 语义槽 `classNames.popup.container` / `styles.popup.container` | `-panel-container` |
 *
 * 缺了它 ⇒ **面板在真实浏览器里完全点不动**（第 1 条）。而 jsdom 里
 * `trigger()` / `dispatchEvent` **绕过 `pointer-events`** ⇒ 本层能全绿，
 * 只有 L6（真浏览器）才暴露 —— 这就是本文件存在的理由：把「层在不在」这件事
 * 在 L4 钉死，别每次都等 L6。
 *
 * ⚠️ 与 `@apollo-design/picker` 的分工：**面板内部**（`-header` / `-body` /
 * `-content` / 各粒度面板）由 picker 包自己的 L4 负责；本文件只管**外壳这三层**。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DatePicker from '../DatePicker.vue';

const P = 'apollo-picker';

/** 浮层只有 `open: true` 时才渲染。 */
const mountOpen = (props: Record<string, unknown> = {}) =>
  mount(DatePicker, { props: { open: true, ...props } });

describe('DatePicker · 浮层外壳（`-panel-container` / `-panel-layout`）', () => {
  it('逐层对应上游：dropdown > panel-container > panel-layout > panel', () => {
    const w = mountOpen();
    const dropdown = w.find(`.${P}-dropdown`);
    expect(dropdown.exists()).toBe(true);

    // ① container 是 dropdown 的**直接**子元素（上游中间没有别的层）
    const container = dropdown.find(`.${P}-panel-container`);
    expect(container.exists()).toBe(true);
    expect(container.element.parentElement).toBe(dropdown.element);

    // ② layout 在 container 里
    const layout = container.find(`.${P}-panel-layout`);
    expect(layout.exists()).toBe(true);

    // ③ 面板在 layout 的**后代**里（上游那一层无类名的 div：同层还放 Footer）
    expect(layout.find(`.${P}-panel`).exists()).toBe(true);

    w.unmount();
  });

  it('容器后缀取 `internalMode`（`showTime` ⇒ `datetime`，不是面板当前粒度）', () => {
    // 上游 `Popup/index.js:150`：`${prefixCls}-${internalMode}-panel-container`
    const plain = mountOpen();
    expect(plain.find(`.${P}-panel-container`).classes()).toContain(`${P}-date-panel-container`);
    plain.unmount();

    const withTime = mountOpen({ showTime: true });
    expect(withTime.find(`.${P}-panel-container`).classes()).toContain(
      `${P}-datetime-panel-container`,
    );
    withTime.unmount();
  });

  it('`classNames.popup.container` / `styles.popup.container` 落到容器上', () => {
    const w = mountOpen({
      classNames: { popup: { container: 'c-container' } },
      styles: { popup: { container: { backgroundColor: 'red' } } },
    });
    const container = w.find(`.${P}-panel-container`);
    expect(container.classes()).toContain('c-container');
    expect(container.attributes('style')).toContain('background-color: red');
    w.unmount();
  });

  it('🚨 新 API `classNames.popup.root` 也落到浮层（不只是 deprecated `popupClassName`）', () => {
    // 上游 `SinglePicker.js:464`：`popupClassName: clsx(rootClassName, mergedClassNames.popup.root)`
    // ⇒ **合并后的** `popup.root` 才是落点；`popupClassName` 只是被 `fillPopupClassName`
    //   并进它的一个来源。此前本仓传的是原始 deprecated prop ⇒ 新 API 静默无效。
    for (const classNames of [{ popup: 'c-popup' }, { popup: { root: 'c-popup' } }] as const) {
      const w = mountOpen({ classNames });
      expect(w.find(`.${P}-dropdown`).classes()).toContain('c-popup');
      w.unmount();
    }
  });
});
