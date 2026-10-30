import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { PopoverRef } from '../interface';
import Popover from '../Popover';
import PurePanel from '../PurePanel';

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.replaceChildren();
  vi.useRealTimers();
});

async function settle() {
  await nextTick();
  await nextTick();
}

describe('Popover native contracts', () => {
  it('owns openChange and popupClick as Vue events, including once and listener arrays', async () => {
    vi.useFakeTimers();
    const opened = vi.fn();
    const popupClick = vi.fn();
    const popupOnce = vi.fn();
    const after = vi.fn();
    const wrapper = mount(Popover, {
      props: {
        title: 'Title',
        trigger: 'click',
        onOpenChangeOnce: opened,
        onPopupClickOnce: popupOnce,
        onAfterOpenChange: after,
      },
      attrs: { onPopupClick: [popupClick] },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    const container = document.querySelector('[role="tooltip"]');
    if (!container) throw Error('Missing Popover content');
    const first = new MouseEvent('click', { bubbles: true });
    const second = new MouseEvent('click', { bubbles: true });
    container.dispatchEvent(first);
    container.dispatchEvent(second);
    expect(popupClick.mock.calls).toEqual([[first], [second]]);
    expect(popupOnce).toHaveBeenCalledExactlyOnceWith(first);
    expect(wrapper.emitted('popupClick')).toEqual([[first], [second]]);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(opened).toHaveBeenCalledExactlyOnceWith(true);
    expect(wrapper.emitted('openChange')).toEqual([[true], [false]]);
    expect(wrapper.emitted('update:open')).toEqual([[true], [false]]);
    expect(after.mock.calls).toEqual([[true], [false]]);
  });

  it('preserves a controlled refusal and exposes current DOM elements after removal', async () => {
    vi.useFakeTimers();
    const popover = ref<PopoverRef | null>(null);
    const open = ref<boolean | undefined>(false);
    const changed = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Popover,
            {
              ref: popover,
              open: open.value,
              title: 'Title',
              trigger: 'click',
              onOpenChange: changed,
              destroyOnHidden: true,
            },
            () => h('button', 'Target'),
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(changed).toHaveBeenCalledExactlyOnceWith(true);
    expect(popover.value?.nativeElement).toBe(wrapper.get('button').element);
    expect(popover.value?.popupElement).toBeNull();
    open.value = undefined;
    await settle();
    expect(popover.value?.popupElement).toBeNull();
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(popover.value?.popupElement).toBe(document.querySelector('.apollo-popover'));
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(popover.value?.popupElement).toBeNull();
    expect(() => popover.value?.forceAlign()).not.toThrow();
  });

  it('consumes inherited Tooltip style and destroy aliases instead of discarding them', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Popover, {
      props: {
        open: true,
        title: 'Title',
        overlayClassName: 'legacy-root',
        overlayStyle: { padding: '9px' },
        overlayInnerStyle: { padding: '5px' },
        destroyTooltipOnHide: true,
      },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await vi.runAllTimersAsync();
    const popup = document.querySelector<HTMLElement>('.apollo-popover');
    expect(popup?.classList.contains('legacy-root')).toBe(true);
    expect(popup?.style.padding).toBe('9px');
    expect(popup?.querySelector<HTMLElement>('[role="tooltip"]')?.style.padding).toBe('5px');
    await wrapper.setProps({
      overlayClassName: undefined,
      overlayStyle: undefined,
      overlayInnerStyle: undefined,
    });
    expect(popup?.classList.contains('legacy-root')).toBe(false);
    expect(popup?.style.padding).toBe('');
    await wrapper.setProps({ open: false });
    await vi.runAllTimersAsync();
    expect(document.querySelector('.apollo-popover')).toBeNull();
  });

  it('keeps PurePanel color, native attrs and its own current Provider configuration effective', async () => {
    const config = ref({ className: 'configured', styles: { title: { marginTop: '3px' } } });
    const color = ref<string | undefined>('#123456');
    const wrapper = mount(
      () =>
        h(
          ConfigProvider,
          { components: { popover: config.value, tooltip: { className: 'foreign' } } },
          () =>
            h(PurePanel, {
              title: 'Title',
              content: 'Content',
              color: color.value,
              class: ['native', { active: true }],
              'data-panel': 'kept',
            }),
        ),
      { attachTo: document.body },
    );
    wrappers.push(wrapper);
    const panel = wrapper.get('.apollo-popover-pure');
    expect(panel.classes()).toContain('configured');
    expect(panel.classes()).toContain('active');
    expect(panel.classes()).not.toContain('foreign');
    expect(panel.attributes('data-panel')).toBe('kept');
    expect(panel.get<HTMLElement>('[role="tooltip"]').element.style.background).toBe(
      'rgb(18, 52, 86)',
    );
    expect(panel.get<HTMLElement>('.apollo-popover-title').element.style.marginTop).toBe('3px');
    config.value = { className: 'replacement', styles: { title: { marginTop: '7px' } } };
    color.value = 'blue';
    await settle();
    expect(panel.classes()).not.toContain('configured');
    expect(panel.classes()).toContain('replacement');
    expect(panel.classes()).toContain('apollo-popover-blue');
    expect(panel.get<HTMLElement>('[role="tooltip"]').element.style.background).toBe('');
    expect(panel.get<HTMLElement>('.apollo-popover-title').element.style.marginTop).toBe('7px');
    color.value = undefined;
    await settle();
    expect(panel.classes()).not.toContain('apollo-popover-blue');
  });
});
