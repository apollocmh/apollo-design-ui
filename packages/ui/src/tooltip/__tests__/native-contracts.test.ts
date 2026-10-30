import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { TooltipRef } from '../interface';
import Tooltip from '../Tooltip';

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
  vi.useRealTimers();
});

async function settle() {
  await nextTick();
  await nextTick();
}

describe('Tooltip native contracts', () => {
  it('exposes the current trigger and popup elements through a real component ref', async () => {
    vi.useFakeTimers();
    const tooltip = ref<TooltipRef | null>(null);
    const open = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Tooltip, { ref: tooltip, title: 'Hint', open: open.value, destroyOnHidden: true }, () =>
            h('button', 'Target'),
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    await vi.runAllTimersAsync();
    const trigger = wrapper.get('button').element;
    const popup = document.querySelector('.apollo-tooltip');
    expect(tooltip.value?.nativeElement).toBe(trigger);
    expect(tooltip.value?.popupElement).toBe(popup);
    expect(() => tooltip.value?.forceAlign()).not.toThrow();
    open.value = false;
    await settle();
    await vi.runAllTimersAsync();
    expect(tooltip.value?.nativeElement).toBe(trigger);
    expect(tooltip.value?.popupElement).toBeNull();
  });

  it('routes current native class/style to the popup root, with semantic restoration', async () => {
    const wrapper = mount(Tooltip, {
      props: {
        title: 'Hint',
        open: true,
        styles: { root: { padding: '6px', '--native-hint': 'semantic' } },
      },
      attrs: {
        class: ['native-popup', { 'native-active': true }],
        style: ['padding: 20px', { '--native-hint': 'native' }],
        'data-trigger': 'kept',
      },
      slots: { default: () => h('button', { class: 'target' }, 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await settle();
    const popup = document.querySelector<HTMLElement>('.apollo-tooltip');
    if (!popup) throw Error('Missing popup');
    const trigger = wrapper.get('button');
    expect(popup.classList.contains('native-popup')).toBe(true);
    expect(popup.classList.contains('native-active')).toBe(true);
    expect(popup.style.padding).toBe('20px');
    expect(popup.style.getPropertyValue('--native-hint')).toBe('native');
    expect(trigger.classes()).not.toContain('native-popup');
    expect(trigger.attributes('style')).toBeUndefined();
    expect(trigger.attributes('data-trigger')).toBe('kept');
    await wrapper.setProps({ class: 'replacement-popup', style: undefined });
    expect(document.querySelector('.apollo-tooltip')).toBe(popup);
    expect(popup.classList.contains('native-popup')).toBe(false);
    expect(popup.classList.contains('replacement-popup')).toBe(true);
    expect(popup.style.padding).toBe('6px');
    expect(popup.style.getPropertyValue('--native-hint')).toBe('semantic');
  });

  it('reads replacement and removal of Provider and legacy root styles', async () => {
    const provider = ref({ style: { color: 'red' } });
    const overlay = ref<{ padding: string } | undefined>({ padding: '5px' });
    const wrapper = mount(
      () =>
        h(ConfigProvider, { components: { tooltip: provider.value } }, () =>
          h(Tooltip, { title: 'Hint', open: true, overlayStyle: overlay.value }, () =>
            h('button', 'Target'),
          ),
        ),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    const popup = document.querySelector<HTMLElement>('.apollo-tooltip');
    if (!popup) throw Error('Missing popup');
    provider.value = { style: { color: 'blue' } };
    overlay.value = { padding: '9px' };
    await settle();
    expect(popup.style.color).toBe('blue');
    expect(popup.style.padding).toBe('9px');
    provider.value = { style: { color: '' } };
    overlay.value = undefined;
    await settle();
    expect(popup.style.color).toBe('');
    expect(popup.style.padding).toBe('');
  });

  it('emits one openChange and update:open proposal without accepting a controlled refusal', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const onUpdate = vi.fn();
    const wrapper = mount(Tooltip, {
      props: {
        title: 'Hint',
        open: false,
        trigger: 'click',
        onOpenChange,
        'onUpdate:open': onUpdate,
      },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(true);
    expect(wrapper.emitted('openChange')).toEqual([[true]]);
    await wrapper.setProps({ open: undefined });
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('supports Vue once listeners and reports actual popup clicks and motion completion', async () => {
    vi.useFakeTimers();
    const onOpenChangeOnce = vi.fn();
    const onAfterOpenChange = vi.fn();
    const onPopupClick = vi.fn();
    const wrapper = mount(Tooltip, {
      props: {
        title: 'Hint',
        trigger: 'click',
        onOpenChangeOnce,
        onAfterOpenChange,
        onPopupClick,
      },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    const container = document.querySelector<HTMLElement>('[role="tooltip"]');
    if (!container) throw Error('Missing tooltip content');
    const click = new MouseEvent('click', { bubbles: true });
    container.dispatchEvent(click);
    await settle();
    expect(onPopupClick).toHaveBeenCalledExactlyOnceWith(click);
    expect(wrapper.emitted('popupClick')).toEqual([[click]]);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(onOpenChangeOnce).toHaveBeenCalledExactlyOnceWith(true);
    expect(wrapper.emitted('openChange')).toEqual([[true], [false]]);
    expect(onAfterOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(wrapper.emitted('afterOpenChange')).toEqual([[true], [false]]);
    expect(wrapper.get('button').attributes('onOpenChangeOnce')).toBeUndefined();
  });
});
