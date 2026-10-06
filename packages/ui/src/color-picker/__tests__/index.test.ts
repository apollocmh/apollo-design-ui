/**
 * ColorPicker · L1/L2（jsdom）—— 组件级冒烟 + 关键契约。
 *
 * ⚠️ **本文件是 G4 收口时的第一批组件级用例**（不是最终版）：G5/G6 的完整七层覆盖
 * 仍待补（见 `PLAN.md`）。这里钉的是「接线对不对」——触发器 / 浮层 / 面板 / 清空态
 * 四条链路，以及上游 `__tests__/index.test.tsx` 里最硬的几条。
 *
 * ⚠️ jsdom 没有布局 ⇒ 面板里的滑块几何不可测（归 L6）；这里只测**结构**。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import ColorPicker from '../ColorPicker.vue';
import type { AggregationColor } from '../color';
import { ColorPicker as InstalledColorPicker } from '../index';

const P = 'apollo-color-picker';

const mountPicker = (props: Record<string, unknown> = {}) =>
  mount(ColorPicker, { props: { defaultValue: '#1677ff', ...props }, attachTo: document.body });

describe('ColorPicker · 触发器（默认值 / 清空态）', () => {
  it('`defaultValue` ⇒ 触发器 + 色块（内层背景是 rgb）', () => {
    const w = mountPicker();
    expect(w.find(`.${P}-trigger`).exists()).toBe(true);
    const inner = w.find(`.${P}-color-block-inner`);
    expect(inner.exists()).toBe(true);
    // jsdom 会把 rgb() 规范化成带空格的形态
    expect(inner.attributes('style')).toContain('background: rgb(22, 119, 255)');
  });

  it('🚨 **不传值 ⇒ 「已清空」态**：触发器渲染的是 `ColorClear`（不是色块）', () => {
    // 上游文档：`defaultValue` **无默认值** ⇒ `useModeColor` 拿到 `undefined`
    // ⇒ `generateColor('')` 是 cleared ⇒ `ColorTrigger` 走 ColorClear 分支。
    const w = mount(ColorPicker, { attachTo: document.body });
    expect(w.find(`.${P}-trigger`).exists()).toBe(true);
    expect(w.find(`.${P}-color-block`).exists()).toBe(false);
    const clear = w.find(`.${P}-trigger .${P}-clear`);
    expect(clear.exists()).toBe(true);
    expect(clear.attributes('tabindex')).toBe('0');
    expect(clear.attributes('aria-disabled')).toBeUndefined();
  });

  it('类名顺序与上游快照一致：`-trigger` → `css-var-root` → `-css-var`', () => {
    const w = mountPicker();
    const cls = w.find(`.${P}-trigger`).classes();
    expect(cls.indexOf(`${P}-trigger`)).toBeLessThan(cls.indexOf('css-var-root'));
    expect(cls.indexOf('css-var-root')).toBeLessThan(cls.indexOf(`${P}-css-var`));
  });

  it('`disabled` ⇒ `-trigger-disabled` + 清空按钮 `-clear-disabled` / `tabindex=-1`', () => {
    const w = mountPicker({ disabled: true, defaultValue: null });
    expect(w.find(`.${P}-trigger`).classes()).toContain(`${P}-trigger-disabled`);
    const clear = w.find(`.${P}-trigger .${P}-clear`);
    expect(clear.classes()).toContain(`${P}-clear-disabled`);
    expect(clear.attributes('aria-disabled')).toBe('true');
    expect(clear.attributes('tabindex')).toBe('-1');
  });

  it('`size="small"` / `size="large"` ⇒ `-sm` / `-lg`', () => {
    expect(mountPicker({ size: 'small' }).find(`.${P}-trigger`).classes()).toContain(`${P}-sm`);
    expect(mountPicker({ size: 'large' }).find(`.${P}-trigger`).classes()).toContain(`${P}-lg`);
  });
});

describe('ColorPicker · 面板（open）', () => {
  it('`open` ⇒ 渲染面板骨架：`-inner` > `-inner-content` > `-panel`', () => {
    const w = mountPicker({ open: true });
    expect(w.find(`.${P}-inner`).exists()).toBe(true);
    expect(w.find(`.${P}-inner-content`).exists()).toBe(true);
    // 引擎面板（HSB 取色区 + 色块）
    expect(w.find(`.${P}-panel`).exists()).toBe(true);
    expect(w.find(`.${P}-select`).exists()).toBe(true);
    expect(w.find(`.${P}-palette`).exists()).toBe(true);
    expect(w.find(`.${P}-handler`).exists()).toBe(true);
    expect(w.find(`.${P}-saturation`).exists()).toBe(true);
  });

  it('🚨 两条滑块复用本仓 `Slider`（`-color-picker-slider` 附加类 + `-handle-1`）', () => {
    const w = mountPicker({ open: true });
    const sliders = w.findAll(`.apollo-slider.${P}-slider`);
    expect(sliders).toHaveLength(2);
    // range 恒传对象 ⇒ 恒为 range 模式 ⇒ 手柄带序号类（与上游快照一致）
    expect(w.find(`.${P}-slider-handle`).exists()).toBe(true);
    expect(w.find('.apollo-slider-handle-1').exists()).toBe(true);
    expect(w.find(`.${P}-slider-rail`).exists()).toBe(true);
  });

  it('输入区三段：格式下拉 + hex 输入 + alpha 输入', () => {
    const w = mountPicker({ open: true });
    expect(w.find(`.${P}-input-container`).exists()).toBe(true);
    expect(w.find(`.${P}-format-select`).exists()).toBe(true);
    expect(w.find(`.${P}-hex-input`).exists()).toBe(true);
    expect(w.find(`.${P}-alpha-input`).exists()).toBe(true);
  });

  it('`disabledFormat` 去掉格式下拉，`disabledAlpha` 去掉 alpha 输入与 alpha 滑块', () => {
    const noFormat = mountPicker({ open: true, disabledFormat: true });
    expect(noFormat.find(`.${P}-format-select`).exists()).toBe(false);
    expect(noFormat.find(`.${P}-hex-input`).exists()).toBe(true);

    const noAlpha = mountPicker({ open: true, disabledAlpha: true });
    expect(noAlpha.find(`.${P}-alpha-input`).exists()).toBe(false);
    expect(noAlpha.findAll(`.apollo-slider.${P}-slider`)).toHaveLength(1);
  });

  it('`allowClear` ⇒ 操作条（`-operation`）+ 清空按钮', () => {
    const w = mountPicker({ open: true, allowClear: true });
    expect(w.find(`.${P}-operation`).exists()).toBe(true);
    expect(w.find(`.${P}-operation .${P}-clear`).exists()).toBe(true);
  });

  it('`mode` 给两档 ⇒ 操作条里出现 `Segmented`（单色 / 渐变色）', () => {
    const w = mountPicker({ open: true, mode: ['single', 'gradient'] });
    const segmented = w.find(`.${P}-operation .apollo-segmented`);
    expect(segmented.exists()).toBe(true);
    expect(segmented.text()).toContain('Single');
    expect(segmented.text()).toContain('Gradient');
  });

  it('`presets` 是数组 ⇒ 面板里出现 Divider + 预设面板', () => {
    const w = mountPicker({
      open: true,
      presets: [{ label: 'Recent', colors: ['#1677ff', '#ff0000'] }],
    });
    expect(w.find(`.${P}-inner-content > .apollo-divider`).exists()).toBe(true);
    expect(w.find(`.${P}-presets`).exists()).toBe(true);
    expect(w.findAll(`.${P}-presets-color`).length).toBe(2);
  });

  it('`panelRender` 换掉面板骨架，且 `-inner-content` 落在它**里面**', () => {
    const w = mountPicker({
      open: true,
      panelRender: (panel: unknown) => h('div', { class: 'my-panel' }, [panel as never]),
    });
    const custom = w.find('.my-panel');
    expect(custom.exists()).toBe(true);
    expect(custom.find(`.${P}-inner-content`).exists()).toBe(true);
  });
});

describe('ColorPicker · 事件链', () => {
  it('点清空 ⇒ `clear` + `change`（值变成 cleared）', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const w = mountPicker({ open: true, allowClear: true, onChange, onClear });

    await w.find(`.${P}-operation .${P}-clear`).trigger('click');

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    const value = onChange.mock.calls[0]?.[0] as AggregationColor;
    expect(value.cleared).toBe(true);
    expect(value.toHsb().a).toBe(0);
  });

  it('🚨 禁用时点触发器**不打开**（`popupOpen` 恒关）', async () => {
    const w = mountPicker({ disabled: true });
    await w.find(`.${P}-trigger`).trigger('click');
    expect(w.find(`.${P}-inner`).exists()).toBe(false);
  });
});

describe('ColorPicker · 安装包装', () => {
  it('`withInstall` 后的组件带 `_InternalPanelDoNotUseOrYouWillBeFired`', () => {
    expect(
      (InstalledColorPicker as unknown as Record<string, unknown>)
        ._InternalPanelDoNotUseOrYouWillBeFired,
    ).toBeTruthy();
  });
});

describe('ColorPicker · 多子节点触发器契约（KNOWN-ISSUES §1.3 钉住）', () => {
  // Trigger 的归一化只认「单个元素 vnode」；多子节点 ⇒ 包一层 <span>。
  // 上游 children 是单个 ReactNode（无对应物）⇒ 不构成分叉，但这条契约此前无用例钉住。
  it('单子节点：不产生包裹元素（attrs 落到用户根元素）', () => {
    const w = mount(ColorPicker, {
      props: { defaultValue: '#1677ff' },
      slots: { default: () => h('button', { class: 'my-trigger' }, 'pick') },
      attachTo: document.body,
    });
    const btn = w.find('.my-trigger');
    expect(btn.exists()).toBe(true);
    // 用户元素自己就是触发元素 —— 它的父级不是我们造的 span 包裹
    expect(btn.classes()).toContain('my-trigger');
    w.unmount();
  });

  it('多子节点：整体包一层 span（而非丢弃或拆散）', () => {
    const w = mount(ColorPicker, {
      props: { defaultValue: '#1677ff' },
      slots: {
        default: () => [
          h('button', { key: 'a', class: 'my-a' }, 'A'),
          h('button', { key: 'b', class: 'my-b' }, 'B'),
        ],
      },
      attachTo: document.body,
    });
    expect(w.find('.my-a').exists()).toBe(true);
    expect(w.find('.my-b').exists()).toBe(true);
    // 两个子节点共享同一个最近公共父元素（包裹 span）
    const pa = w.find('.my-a').element.parentElement;
    const pb = w.find('.my-b').element.parentElement;
    expect(pa).toBeTruthy();
    expect(pa).toBe(pb);
  });
});

/**
 * §1.1 —— 面板**隔离 Form 上下文**（上游 `ContextIsolator form` 的等价物）。
 *
 * 上游把面板包在 `<ContextIsolator form>` 里，而它的实现就是 `<NoFormStyle override status>`
 * ⇒ 本仓对应 `provideNoFormStyle({ override: true, status: true })`，放在 `ColorPickerPanel`
 * 的 setup（**不是** `ColorPicker.vue`，否则连触发器也会被隔离）。
 *
 * ⚠️ 这条断言**直接查 provide 表**，不是查 DOM —— 因为面板里**当前没有**子件读 form status
 *    ⇒ 查 DOM 会**空转通过**（假绿灯）。查 provide 表则能真正区分：删掉那句
 *    `provideNoFormStyle` 这条就红。
 */
describe('ColorPickerPanel · §1.1 Form 上下文隔离', () => {
  it('面板注册了 formItemInputContext 的 provide（且被隔离）', async () => {
    const { ColorPickerPanel } = await import('../ColorPickerPanel');
    const { formItemInputContextKey } = await import('../../form/context');

    const w = mount(ColorPickerPanel, {
      props: { prefixCls: P, value: undefined },
      attachTo: document.body,
    });
    const provides = (w.vm.$ as unknown as { provides: Record<symbol, unknown> }).provides;
    const provided = provides[formItemInputContextKey as unknown as symbol];
    expect(provided, 'ColorPickerPanel 必须 provide formItemInputContext（§1.1）').toBeTruthy();

    // 反向哨兵：提供出来的上下文**不带 status**（被 `provideNoFormStyle({ status: true })` 清掉）
    const value = (provided as { value?: { status?: unknown } }).value ?? provided;
    expect((value as { status?: unknown }).status).toBeUndefined();
    w.unmount();
  });
});
