/**
 * L5 无障碍 —— Slider 的 role/ARIA 契约、焦点管理与 axe 扫描。
 *
 * ── 判据（antd 6.6.4 = rc-slider@1.1.1 的 `Handles/Handle.js`）─────────────────
 *
 * | 项 | 判据 |
 * |---|---|
 * | 把手语义 | `div[role=slider]` + `aria-valuemin/max/now` + `aria-orientation`（随方向） |
 * | 状态 | 禁用把手 `aria-disabled=true` 且**不可聚焦**（tabindex 移除） |
 * | 名字 | `aria-label` / `aria-labelledby` / `aria-required` / `aria-valuetext`（**逐把手**，数组或单值） |
 * | 键盘 | 方向键 / Home / End / PageUp / PageDown 改值；**有位移时**才 `preventDefault` |
 * | 焦点 | 键盘改值后焦点**仍在同一个把手**上（rc 的「改完 focus(valueIndex)」语义） |
 * | 禁用 | 禁用时键盘与指针都不改值 |
 *
 * ── 关于 axe 的适用范围 ───────────────────────────────────────────────────────
 *
 * 两层扫描都在：**demo 维度**用 `a11yDemoTest`（13 个 demo 逐个跑 axe），
 * **真实配置维度**用下面的 `cases` 表（单把手 / range / 纵向 / marks / 禁用 / tooltip 常开）——
 * 后者覆盖的是 demo 未必碰到的参数组合。
 *
 * ⚠️ axe 在 jsdom 下不做布局与绘制：`color-contrast` 会落到 `incomplete` 而非 `violation`
 * （对比度由 L7 的 token 断言 + L6 像素比对兜底）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import Slider from '../Slider.vue';

const P = 'apollo-slider';

/**
 * 取第 `index` 项（`noUncheckedIndexedAccess` 下的显式化）。
 *
 * ⚠️ 不用 `!`（本仓 `noNonNullAssertion` 会报警）；这里**主动抛错**而不是塞 `undefined`，
 *    这样「用例少建了一个节点」会以清晰的消息失败，而不是在后面某行以 `undefined` 报错。
 */
const at = <T>(list: T[], index: number): T => {
  const item = list[index];
  if (item === undefined) {
    throw new Error(`期望至少有 ${index + 1} 个元素，实际 ${list.length} 个`);
  }
  return item;
};

a11yDemoTest('Slider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  // ⚠️ demo 里的 `<Slider />` 不传 `ariaLabelForHandle` ⇒ `aria-input-field-name`。
  //    与 antd 逐字一致（上游同样不给默认名），见 COMPATIBILITY 的 **U13**。
  allow: [
    {
      rule: 'aria-input-field-name',
      reason:
        'demo 未给把手取名，`role="slider"` 因此没有可访问名 —— 与 antd 6.6.4 一致（上游也不编默认名，见 U13）。组件提供 ariaLabelForHandle / ariaLabelledByForHandle 由使用方按语义命名。',
    },
  ],
});

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** 挂到真实文档（axe 与 `.focus()` 都要求元素在文档里）。 */
const mountA11y = (props: Record<string, unknown> = {}) =>
  mount(h(Slider as never, { ...props } as never), { attachTo: document.body });

const fireKey = (el: Element, keyCode: number, type: 'keydown' | 'keyup' = 'keydown'): void => {
  const ev = new KeyboardEvent(type, { keyCode, bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'which', { value: keyCode });
  el.dispatchEvent(ev);
};

describe('Slider · axe 扫描（真实配置，0 violation）', () => {
  const cases: Record<string, Record<string, unknown>> = {
    // ⚠️ 每个用例都带 `ariaLabelForHandle`：`role="slider"` 需要可访问名，
    //    而组件**不会**替用户发明一个（与 antd 一致，见文件末尾那条钉「上游同样的缺口」的用例）。
    单把手: { defaultValue: 30, ariaLabelForHandle: '音量' },
    带标签: { defaultValue: 30, ariaLabelForHandle: '音量' },
    range: { range: true, defaultValue: [20, 60], ariaLabelForHandle: ['起', '止'] },
    纵向: { orientation: 'vertical', defaultValue: 40, ariaLabelForHandle: '高度' },
    带刻度: {
      defaultValue: 30,
      marks: { 0: '0', 50: '半数', 100: '满' },
      ariaLabelForHandle: '量',
    },
    禁用: { defaultValue: 30, disabled: true, ariaLabelForHandle: '量' },
    tooltip常开: { defaultValue: 30, tooltip: { open: true }, ariaLabelForHandle: '量' },
  };

  for (const [name, props] of Object.entries(cases)) {
    it(`${name}：无 axe violation`, async () => {
      const w = mountA11y(props);
      await nextTick();
      const results = await axe.run(w.element as Element, {
        runOnly: { type: 'tag', values: TAGS },
      });
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      w.unmount();
    });
  }
});

describe('Slider · role / ARIA 契约（L5）', () => {
  it('把手是 role=slider 且带 valuemin/max/now', () => {
    const w = mountA11y({ defaultValue: 30 });
    const el = w.find(`.${P}-handle`);
    expect(el.attributes('role')).toBe('slider');
    expect(el.attributes('aria-valuemin')).toBe('0');
    expect(el.attributes('aria-valuemax')).toBe('100');
    expect(el.attributes('aria-valuenow')).toBe('30');
    w.unmount();
  });

  it('aria-orientation 随方向变化', () => {
    const horizontal = mountA11y({ defaultValue: 30 });
    expect(horizontal.find(`.${P}-handle`).attributes('aria-orientation')).toBe('horizontal');
    horizontal.unmount();

    const vertical = mountA11y({ orientation: 'vertical', defaultValue: 30 });
    expect(vertical.find(`.${P}-handle`).attributes('aria-orientation')).toBe('vertical');
    vertical.unmount();
  });

  it('逐把手取名：aria-label / aria-required / aria-valuetext', () => {
    const w = mountA11y({
      range: true,
      defaultValue: [20, 60],
      ariaLabelForHandle: ['起始', '结束'],
      ariaRequired: true,
      ariaValueTextFormatterForHandle: [(v: number) => `起 ${v}`, (v: number) => `止 ${v}`],
    });
    const first = at(w.findAll(`.${P}-handle`), 0);
    const second = at(w.findAll(`.${P}-handle`), 1);
    expect(first.attributes('aria-label')).toBe('起始');
    expect(second.attributes('aria-label')).toBe('结束');
    expect(first.attributes('aria-required')).toBe('true');
    expect(second.attributes('aria-valuetext')).toBe('止 60');
    w.unmount();
  });

  it('aria-labelledby 也支持数组形态', () => {
    const w = mountA11y({
      range: true,
      defaultValue: [20, 60],
      ariaLabelledByForHandle: ['label-a', 'label-b'],
    });
    const first = at(w.findAll(`.${P}-handle`), 0);
    const second = at(w.findAll(`.${P}-handle`), 1);
    expect(first.attributes('aria-labelledby')).toBe('label-a');
    expect(second.attributes('aria-labelledby')).toBe('label-b');
    w.unmount();
  });

  it('禁用把手 aria-disabled=true 且不可聚焦', () => {
    const w = mountA11y({ range: true, defaultValue: [20, 60], disabled: [true, false] });
    const first = at(w.findAll(`.${P}-handle`), 0);
    const second = at(w.findAll(`.${P}-handle`), 1);
    expect(first.attributes('aria-disabled')).toBe('true');
    expect(first.attributes('tabindex')).toBeUndefined();
    expect(second.attributes('aria-disabled')).toBe('false');
    expect(second.attributes('tabindex')).toBe('0');
    w.unmount();
  });

  it('tabIndex 数组形态逐把手生效（可只留一个 Tab 入口）', () => {
    const w = mountA11y({ range: true, defaultValue: [20, 60], tabIndex: [0, -1] });
    const first = at(w.findAll(`.${P}-handle`), 0);
    const second = at(w.findAll(`.${P}-handle`), 1);
    expect(first.attributes('tabindex')).toBe('0');
    expect(second.attributes('tabindex')).toBe('-1');
    w.unmount();
  });
});

describe('Slider · 键盘与焦点管理（L5）', () => {
  it('方向键改值后焦点仍在该把手上（连续按不丢焦点）', async () => {
    const w = mountA11y({ defaultValue: 30 });
    const el = w.find(`.${P}-handle`).element as HTMLElement;
    el.focus();
    expect(document.activeElement).toBe(el);

    fireKey(el, 39);
    await nextTick();
    fireKey(el, 39, 'keyup');
    await nextTick();
    const active = document.activeElement as HTMLElement | null;
    expect(active?.classList.contains(`${P}-handle`)).toBe(true);
    expect(active?.getAttribute('aria-valuenow')).toBe('31');
    w.unmount();
  });

  it('range：键盘改的是「当前聚焦的那个把手」', async () => {
    const w = mountA11y({ range: true, defaultValue: [20, 60] });
    const second = at(w.findAll(`.${P}-handle`), 1).element as HTMLElement;
    second.focus();
    fireKey(second, 39);
    await nextTick();
    expect(w.emitted('change')?.at(-1)).toEqual([[20, 61]]);
    w.unmount();
  });

  it('有位移时 preventDefault（避免页面跟着方向键滚动）', () => {
    const w = mountA11y({ defaultValue: 30 });
    const ev = new KeyboardEvent('keydown', { keyCode: 39, bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'which', { value: 39 });
    w.find(`.${P}-handle`).element.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    w.unmount();
  });

  it('禁用把手上按方向键：不 preventDefault、也不改值', () => {
    const w = mountA11y({ defaultValue: 30, disabled: true });
    const ev = new KeyboardEvent('keydown', { keyCode: 39, bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'which', { value: 39 });
    w.find(`.${P}-handle`).element.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(w.emitted('change')).toBeFalsy();
    w.unmount();
  });

  it('expose 的 focus()/blur() 可用于程序化焦点管理', async () => {
    const w = mountA11y({ defaultValue: 30 });
    (w.vm as unknown as { focus: () => void }).focus();
    await nextTick();
    expect(document.activeElement?.classList.contains(`${P}-handle`)).toBe(true);
    (w.vm as unknown as { blur: () => void }).blur();
    await nextTick();
    expect(document.activeElement?.classList.contains(`${P}-handle`)).toBe(false);
    w.unmount();
  });
});

describe('Slider · 上游同样的缺口（登记而非掩盖）', () => {
  /**
   * 裸 `<Slider />` 没有可访问名 ⇒ axe 的 `aria-input-field-name` 会报 violation。
   *
   * ⚠️ 这不是本仓的实现缺陷：antd 6.6.4 的裸 Slider 完全一样（`role="slider"` 是 rc 加的，
   *    antd 不传 `aria-label`）；组件也没有「合理默认名」可用（值域是 0..100，语义由使用场景
   *    决定，猜一个反而更糟）。所以这里**把这条期待钉下来**，并在文档里写明「要给名字」。
   */
  it('未传 ariaLabelForHandle ⇒ 与 antd 一致地没有可访问名（axe 报 aria-input-field-name）', async () => {
    const w = mountA11y({ defaultValue: 30 });
    await nextTick();
    const results = await axe.run(w.element as Element, {
      runOnly: { type: 'tag', values: TAGS },
    });
    const ids = results.violations.map((v) => v.id);
    expect(ids).toContain('aria-input-field-name');
    // 反过来：一旦给了名字，这条就不再出现（上一条 describe 已逐配置验证）
    w.unmount();
  });
});
