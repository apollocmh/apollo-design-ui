/**
 * L5 无障碍 —— ColorPicker 的 role/ARIA 契约与 axe 扫描。
 *
 * ── 判据（antd 6.6.4）────────────────────────────────────────────────────────
 *
 * | 项 | 判据 | 出处 |
 * |---|---|---|
 * | 清空按钮 | `<div role="button" aria-label="Clear color">` —— **硬编码英文**，不进 locale | `components/ColorClear.tsx:44` |
 * | 清空按钮 · 禁用 | `aria-disabled` **只在禁用时出现**（`disabled \|\| undefined`，不是 `"false"`） | 同上 |
 * | 清空按钮 · 焦点 | `tabindex` **恒为** `-1 \| 0`（禁用 `-1`，否则 `0`） | 同上 |
 * | 清空按钮 · 键盘 | `Enter` / `Space` 触发清空（`preventDefault` + 走 click 路径） | 同上 |
 * | 触发器 | `<div class="{p}-trigger">` —— **不加 `role` / `tabindex`** | `components/ColorTrigger.tsx:110` |
 * | 面板输入 | `InputNumber`（数字）/ `Select`（格式）的 a11y 由**被复用组件**承担 | — |
 *
 * ⚠️ **为什么这几条必须钉**：ColorPicker 的**唯一**自有 a11y 面就是清空按钮
 * （触发器是纯 `div`，面板里的交互件全部复用 `InputNumber` / `Select` / `Slider`）。
 * 钉住清空按钮的三条属性与键盘路径，就覆盖了本组件的自有契约 —— 不去重复测
 * 别人的契约（`InputNumber` / `Select` 各自的 L5 已覆盖）。
 *
 * ⚠️ **面板在 Popover 浮层里**：`open` 受控为 `true` 才渲染，且走 Teleport 到
 * `document.body` ⇒ axe 必须扫 `document.body`（只扫触发器拿不到面板）。
 *
 * ⚠️ **`axe.run()` 不能与 `vi.useFakeTimers()` 共存**（PITFALLS 268）——
 * 本文件**不用**假定时器。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import ColorPicker from '../ColorPicker.vue';

const P = 'apollo-color-picker';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** 挂到真实文档（axe 要求元素在文档里；浮层走 Teleport 到 body）。 */
const mountA11y = async (props: Record<string, unknown> = {}) => {
  const wrapper = mount(ColorPicker, { props, attachTo: document.body });
  await nextTick();
  await nextTick();
  return wrapper;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ColorPicker · role / ARIA 契约（L5）', () => {
  it('🚨 清空按钮：`role="button"` + **硬编码英文** `aria-label="Clear color"`', async () => {
    // 不传值 ⇒ cleared ⇒ 触发器渲染 ColorClear（`.{p}-clear`）
    const w = await mountA11y();
    const clear = w.find(`.${P}-trigger .${P}-clear`);

    expect(clear.exists()).toBe(true);
    expect(clear.attributes('role')).toBe('button');
    expect(clear.attributes('aria-label')).toBe('Clear color');
    w.unmount();
  });

  it('🚨 `aria-disabled` **只在禁用时出现**（不是 `aria-disabled="false"`）', async () => {
    const enabled = await mountA11y();
    expect(enabled.find(`.${P}-trigger .${P}-clear`).attributes('aria-disabled')).toBeUndefined();
    enabled.unmount();

    const disabled = await mountA11y({ disabled: true });
    const clear = disabled.find(`.${P}-trigger .${P}-clear`);
    expect(clear.attributes('aria-disabled')).toBe('true');
    expect(clear.classes()).toContain(`${P}-clear-disabled`);
    disabled.unmount();
  });

  it('🚨 `tabindex` 恒存在且恒为 `-1 | 0`', async () => {
    const enabled = await mountA11y();
    expect(enabled.find(`.${P}-trigger .${P}-clear`).attributes('tabindex')).toBe('0');
    enabled.unmount();

    const disabled = await mountA11y({ disabled: true });
    expect(disabled.find(`.${P}-trigger .${P}-clear`).attributes('tabindex')).toBe('-1');
    disabled.unmount();
  });

  it('触发器本身是纯 `div`（不加 `role` / `tabindex` —— 上游如此）', async () => {
    const w = await mountA11y({ defaultValue: '#1677ff' });
    const trigger = w.find(`.${P}-trigger`);

    expect(trigger.element.tagName).toBe('DIV');
    expect(trigger.attributes('role')).toBeUndefined();
    expect(trigger.attributes('tabindex')).toBeUndefined();
    w.unmount();
  });

  it('面板里的数字输入（InputNumber）与格式下拉（Select）**存在且可聚焦**', async () => {
    const w = await mountA11y({ defaultValue: '#1677ff', open: true });

    // 数字输入（alpha 输入是 InputNumber 的薄壳）：存在、可聚焦、未禁用
    const alpha = w.find(`.${P}-alpha-input`);
    expect(alpha.exists()).toBe(true);
    const alphaInput = alpha.find('input');
    expect(alphaInput.exists()).toBe(true);
    expect((alphaInput.element as HTMLInputElement).tabIndex).toBeGreaterThanOrEqual(0);
    expect((alphaInput.element as HTMLInputElement).disabled).toBe(false);

    // 格式下拉（Select）：存在、内部 combobox 可聚焦
    const select = w.find(`.${P}-format-select`);
    expect(select.exists()).toBe(true);
    const combobox = select.find('input[role="combobox"]');
    expect(combobox.exists()).toBe(true);
    expect((combobox.element as HTMLInputElement).tabIndex).toBeGreaterThanOrEqual(0);
    w.unmount();
  });

  it('🚨 清空按钮的 `Enter` / `Space` 触发清空', async () => {
    const enter = await mountA11y({ defaultValue: '#1677ff', open: true, allowClear: true });
    const enterClear = enter.find(`.${P}-operation .${P}-clear`);
    expect(enterClear.exists()).toBe(true);

    await enterClear.trigger('keydown', { key: 'Enter' });
    expect(enter.emitted('clear')).toHaveLength(1);
    expect(enter.emitted('change')).toHaveLength(1);
    enter.unmount();

    const space = await mountA11y({ defaultValue: '#1677ff', open: true, allowClear: true });
    await space.find(`.${P}-operation .${P}-clear`).trigger('keydown', { key: ' ' });
    expect(space.emitted('clear')).toHaveLength(1);
    expect(space.emitted('change')).toHaveLength(1);
    space.unmount();
  });
});

describe('ColorPicker · axe 扫描（真实配置）', () => {
  /**
   * 面板展开后，axe 命中的两条规则**全部来自被复用组件**，不是 ColorPicker 自有问题：
   *
   * - `aria-input-field-name`：两条滑块复用 `Slider`，未传 `ariaLabelForHandle`
   *   ⇒ `role="slider"` 没有可访问名。Slider 的 L5 已豁免同一条
   *   （UPSTREAM **U13**：上游不给把手编默认名，由使用方按语义命名）。
   * - `label`：格式下拉（`Select` 的 combobox，**U14**）/ hex 输入（`Input`）/
   *   数字输入（`InputNumber`，**U12**）都没有关联 `<label>` —— 上游同样不绑，
   *   可访问名由使用方提供；三者各自的 L5 已登记同款豁免。
   *
   * 两者都与 antd 6.6.4 逐字一致 ⇒ 按 R13（不低于 antd）放行。
   * ⚠️ 豁免**可自证**：下面的循环会断言它们**真的出现**（否则红）。
   */
  const PANEL_ALLOW = ['aria-input-field-name', 'label'];

  /** ⚠️ 未展开面板的形态**不应**出现任何 violation（豁免只在 open 形态成立）。 */
  const cases: Record<string, { props: Record<string, unknown>; allow?: string[] }> = {
    '默认（cleared）': { props: {} },
    有值: { props: { defaultValue: '#1677ff' } },
    禁用: { props: { defaultValue: '#1677ff', disabled: true } },
    open: { props: { defaultValue: '#1677ff', open: true }, allow: PANEL_ALLOW },
    allowClear: {
      props: { defaultValue: '#1677ff', open: true, allowClear: true },
      allow: PANEL_ALLOW,
    },
    presets: {
      props: {
        defaultValue: '#1677ff',
        open: true,
        presets: [{ label: 'Recent', colors: ['#1677ff', '#ff0000', '#00ff00'] }],
      },
      allow: PANEL_ALLOW,
    },
    '渐变色（双模式）': {
      props: {
        open: true,
        mode: ['single', 'gradient'],
        defaultValue: [
          { color: '#1677ff', percent: 0 },
          { color: '#ff0000', percent: 100 },
        ],
      },
      allow: PANEL_ALLOW,
    },
    'showText + size': {
      props: { defaultValue: '#1677ff', open: true, showText: true, size: 'large' },
      allow: PANEL_ALLOW,
    },
    语义化槽: {
      props: {
        defaultValue: '#1677ff',
        open: true,
        classNames: {
          root: 'r',
          body: 'b',
          content: 'c',
          description: 'd',
          popup: { root: 'p' },
        },
        styles: {
          root: { outline: '1px solid #cccccc' },
          popupOverlayInner: { padding: '1px' },
        },
      },
      allow: PANEL_ALLOW,
    },
  };

  for (const [name, { props, allow = [] }] of Object.entries(cases)) {
    it(`${name}：${allow.length ? `仅豁免 ${allow.join(', ')}` : '无 axe violation'}`, async () => {
      const w = await mountA11y(props);
      const results = await axe.run(document.body, {
        runOnly: { type: 'tag', values: TAGS },
      });
      const violations = results.violations.map((v) => v.id).filter((id) => !allow.includes(id));

      expect(violations).toEqual([]);
      // 豁免项要**真的出现**（否则豁免会变成永久的假绿灯）
      for (const id of allow) {
        expect(results.violations.map((v) => v.id)).toContain(id);
      }
      w.unmount();
    });
  }
});
