/**
 * Tooltip · L1 单元（G5）。
 *
 * 判据：antd `components/tooltip/__tests__/tooltip.test.tsx` 的主行为 +
 * docs/analysis/tooltip.md §3 的行为契约。
 * ⚠️ jsdom 无布局（isVisible 恒 false）⇒ 几何对齐早退，定位断言不在此层；
 *    测试必须禁 VTU teleport-stub（会重建 slot 内容，见 _internal 冒烟的教训）。
 */
import { resetWarned } from '@apollo-design/utils';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import Tooltip from '../Tooltip';

/** 捕获 `console.error` 并返回拼接后的文本（`warning()` 走 error 通道）。 */
async function capturedWarningsText(run: () => unknown): Promise<string> {
  resetWarned();
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await run();
    await nextTick();
    return spy.mock.calls.map((args) => String(args[0])).join('\n');
  } finally {
    spy.mockRestore();
    resetWarned();
  }
}

const popup = () => document.querySelector<HTMLElement>('.apollo-tooltip');
const container = () => document.querySelector<HTMLElement>('.apollo-tooltip-container');
const triggerEl = () => document.querySelector<HTMLElement>('.tooltip-target');

function mountTooltip(props: Record<string, unknown>, content = 'tooltip content') {
  return mount(Tooltip, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { title: content, mouseLeaveDelay: 0, ...props },
    slots: { default: () => h('button', { class: 'tooltip-target' }, 'target') },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('Tooltip · L1 开合', () => {
  it('非受控：hover 打开（默认延迟 0.1s）⇒ portal 出现 role=tooltip 容器', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    mountTooltip({ title: 'tips', onOpenChange }, 'tips');
    expect(popup()).toBeNull();

    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(100);
    expect(container()).not.toBeNull();
    expect(container()!.getAttribute('role')).toBe('tooltip');
    expect(container()!.textContent).toContain('tips');
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('mouseleave ⇒ 关闭；removeOnLeave=false ⇒ -hidden 残骸', async () => {
    vi.useFakeTimers();
    mountTooltip({ mouseEnterDelay: 0 }, 'tips');
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(container()).not.toBeNull();

    await triggerEl()!.dispatchEvent(new Event('mouseleave'));
    await vi.runAllTimersAsync();
    await nextTick();
    expect(popup()!.className).toContain('apollo-tooltip-hidden');
  });

  it('受控 open：跟随 prop；onOpenChange 与 update:open 同时发出（C11）', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const wrapper = mountTooltip({ open: false, onOpenChange }, 'tips');
    await nextTick();
    expect(container()).toBeNull();

    await wrapper.setProps({ open: true });
    await vi.runAllTimersAsync();
    expect(container()).not.toBeNull();

    await triggerEl()!.dispatchEvent(new Event('mouseleave'));
    await vi.runAllTimersAsync();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
  });

  it('noTitle 抑制：title 为 undefined ⇒ 强制关且 onOpenChange 不触发；title=0 可开', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const wrapper = mountTooltip({ title: undefined, onOpenChange }, '');
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    await nextTick();
    expect(container()).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();

    await wrapper.setProps({ title: 0 });
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(container()).not.toBeNull();
  });

  it('-open 类：openClassName 可覆盖默认 {p}-open', async () => {
    vi.useFakeTimers();
    const wrapper = mountTooltip({ mouseEnterDelay: 0, openClassName: 'my-open' }, 'tips');
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(triggerEl()!.className).toContain('my-open');
    await wrapper.setProps({ open: false });
    await nextTick();
  });
});

describe('Tooltip · L1 aria 与结构', () => {
  it('aria-describedby：开 ⇒ 指向容器 id；关 ⇒ 移除', async () => {
    vi.useFakeTimers();
    const wrapper = mountTooltip({ mouseEnterDelay: 0, id: 'my-tip' }, 'tips');
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(triggerEl()!.getAttribute('aria-describedby')).toBe('my-tip');
    expect(container()!.id).toBe('my-tip');

    await wrapper.setProps({ open: false });
    await vi.runAllTimersAsync();
    expect(triggerEl()!.getAttribute('aria-describedby')).toBeNull();
  });

  it('placement / arrow：类名与箭头节点', async () => {
    mountTooltip({ open: true, placement: 'bottomRight' }, 'tips');
    await nextTick();
    expect(popup()!.className).toContain('apollo-tooltip-placement-bottomRight');
    expect(document.querySelector('.apollo-tooltip-arrow')).not.toBeNull();
    expect(document.querySelector('.apollo-tooltip-arrow-content')).not.toBeNull();
  });

  it('arrow=false ⇒ 无箭头节点', async () => {
    mountTooltip({ open: true, arrow: false }, 'tips');
    await nextTick();
    expect(document.querySelector('.apollo-tooltip-arrow')).toBeNull();
  });

  it('预设色 ⇒ {p}-{color} 类；自定义色 ⇒ 容器内联背景 + 亮字', async () => {
    mountTooltip({ open: true, color: 'blue' }, 'tips');
    await nextTick();
    expect(popup()!.className).toContain('apollo-tooltip-blue');
    expect(container()!.style.backgroundColor).toBe('');

    document.body.innerHTML = '';
    mountTooltip({ open: true, color: '#123456' }, 'tips');
    await nextTick();
    expect(popup()!.className).not.toContain('apollo-tooltip-blue');
    expect(container()!.style.background).toBe('rgb(18, 52, 86)');
    expect(container()!.style.getPropertyValue('--apollo-tooltip-overlay-color')).toBe('#FFF');
  });

  it('expose：forceAlign / nativeElement / popupElement', async () => {
    const wrapper = mountTooltip({ open: true }, 'tips');
    await nextTick();
    const exposed = wrapper.vm as unknown as {
      forceAlign: () => void;
      nativeElement: () => HTMLElement | null;
      popupElement: () => HTMLElement | null;
    };
    expect(exposed.nativeElement()).toBe(triggerEl());
    expect(exposed.popupElement()).toBe(popup());
    expect(() => exposed.forceAlign()).not.toThrow();
  });

  it('deprecated 告警 ×4（overlayStyle/overlayInnerStyle/overlayClassName/destroyTooltipOnHide）', async () => {
    const out = await capturedWarningsText(() =>
      mountTooltip(
        {
          open: true,
          overlayStyle: { color: 'red' },
          overlayInnerStyle: { padding: '1px' },
          overlayClassName: 'legacy-cls',
          destroyTooltipOnHide: true,
        },
        'tips',
      ),
    );
    expect(out).toContain('`overlayStyle` is deprecated');
    expect(out).toContain('`overlayInnerStyle` is deprecated');
    expect(out).toContain('`overlayClassName` is deprecated');
    expect(out).toContain('`destroyTooltipOnHide` is deprecated');
  });
});
