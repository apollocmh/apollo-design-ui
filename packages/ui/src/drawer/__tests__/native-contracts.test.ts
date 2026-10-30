import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Drawer from '../Drawer';
import DrawerPopup from '../engine/DrawerPopup';
import type { DrawerRef } from '../interface';
import PurePanel from '../PurePanel';

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.replaceChildren();
  vi.useRealTimers();
});

async function settle() {
  for (let index = 0; index < 6; index++) await nextTick();
}

describe('Drawer native contracts', () => {
  it('keeps a hidden force-rendered sibling out of the active Escape stack', async () => {
    const forced = ref(false);
    const close = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () => [
          h(Drawer, { open: true, getContainer: false, autoFocus: false, onClose: close }),
          h(Drawer, {
            open: false,
            forceRender: forced.value,
            getContainer: false,
            autoFocus: false,
          }),
        ],
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    forced.value = true;
    await settle();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    window.dispatchEvent(event);
    expect(close).toHaveBeenCalledExactlyOnceWith(event);
  });

  it('honors the explicit focus-return switch over provider defaults', async () => {
    vi.useFakeTimers();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const open = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { components: { drawer: { focusable: { focusTriggerAfterClose: true } } } },
            () =>
              h(Drawer, {
                open: open.value,
                getContainer: false,
                focusTriggerAfterClose: false,
                destroyOnHidden: true,
              }),
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await vi.runAllTimersAsync();
    expect(document.activeElement).not.toBe(trigger);
    open.value = false;
    await vi.runAllTimersAsync();
    expect(document.activeElement).not.toBe(trigger);
  });

  it('follows the current provider container without replacing content', async () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    const target = ref(first);
    const resolve = vi.fn((trigger?: HTMLElement) => {
      expect(trigger).toBe(document.body);
      return target.value;
    });
    const wrapper = mount(ConfigProvider, {
      props: { getPopupContainer: resolve },
      slots: {
        default: () =>
          h(Drawer, { open: true, autoFocus: false }, () =>
            h('input', { id: 'relocated-content' }),
          ),
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await settle();
    const input = first.querySelector('input');
    expect(input).not.toBeNull();
    target.value = second;
    await settle();
    expect(second.querySelector('input')).toBe(input);
    expect(first.querySelector('input')).toBeNull();
  });

  it('emits close requests exactly once with Vue listener arrays and once modifiers', async () => {
    const close = vi.fn();
    const once = vi.fn();
    const wrapper = mount(Drawer, {
      props: { open: true, getContainer: false, autoFocus: false, onCloseOnce: once },
      attrs: { onClose: [close] },
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await settle();
    const click = new MouseEvent('click', { bubbles: true });
    const mask = new MouseEvent('click', { bubbles: true });
    wrapper.get('.apollo-drawer-close').element.dispatchEvent(click);
    wrapper.get('.apollo-drawer-mask').element.dispatchEvent(mask);
    expect(close.mock.calls).toEqual([[click], [mask]]);
    expect(once).toHaveBeenCalledExactlyOnceWith(click);
    expect(wrapper.emitted('close')).toEqual([[click], [mask]]);
    expect(wrapper.get('.apollo-drawer').classes()).toContain('apollo-drawer-open');
  });

  it('receives real motion completion before destroying and restoring focus', async () => {
    vi.useFakeTimers();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const complete = vi.fn();
    const once = vi.fn();
    const wrapper = mount(Drawer, {
      props: {
        open: true,
        getContainer: false,
        destroyOnHidden: true,
        onAfterOpenChange: complete,
        onAfterOpenChangeOnce: once,
      },
      slots: { default: () => h('button', { class: 'inside' }, 'Inside') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await vi.runAllTimersAsync();
    expect(complete.mock.calls).toEqual([[true]]);
    expect(once).toHaveBeenCalledExactlyOnceWith(true);
    wrapper.get<HTMLButtonElement>('.inside').element.focus();
    await wrapper.setProps({ open: false });
    await vi.runAllTimersAsync();
    expect(complete.mock.calls).toEqual([[true], [false]]);
    expect(wrapper.emitted('afterOpenChange')).toEqual([[true], [false]]);
    expect(wrapper.find('.apollo-drawer').exists()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('routes native class/style, ordinary attrs and events to the root, and labels to the dialog', async () => {
    const click = vi.fn();
    const keydown = vi.fn();
    const wrapper = mount(Drawer, {
      props: {
        open: true,
        getContainer: false,
        autoFocus: false,
        classNames: { root: 'semantic-root', section: 'semantic-section' },
      },
      attrs: {
        class: ['native-array', { 'native-object': true }],
        style: 'color: red; --custom: 8px',
        id: 'drawer-dialog',
        'data-drawer': 'root',
        'aria-label': 'Drawer label',
        onClick: click,
        onKeydown: keydown,
      },
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await settle();
    const root = wrapper.get<HTMLElement>('.apollo-drawer');
    const dialog = wrapper.get('[role="dialog"]');
    expect(root.classes()).toEqual(
      expect.arrayContaining(['native-array', 'native-object', 'semantic-root']),
    );
    expect(root.element.style.color).toBe('red');
    expect(root.element.style.getPropertyValue('--custom')).toBe('8px');
    expect(root.attributes('data-drawer')).toBe('root');
    expect(dialog.attributes('id')).toBe('drawer-dialog');
    expect(dialog.attributes('aria-label')).toBe('Drawer label');
    expect(dialog.classes()).toContain('semantic-section');
    await dialog.trigger('click');
    await dialog.trigger('keydown', { key: 'ArrowRight' });
    expect(click).toHaveBeenCalledTimes(1);
    expect(keydown).toHaveBeenCalledTimes(1);
    const element = root.element;
    await wrapper.setProps({ class: { replacement: true }, style: [{ color: 'blue' }] });
    expect(wrapper.get('.apollo-drawer').element).toBe(element);
    expect(root.classes()).toContain('replacement');
    expect(root.classes()).not.toContain('native-array');
    expect(root.element.style.color).toBe('blue');
  });

  it('honors explicit focus traps in inline drawers and releases them when disabled', async () => {
    // jsdom has no layout; this supplies the visibility input used by focus-node discovery.
    const layout = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 0, 20, 20));
    const outside = document.createElement('button');
    document.body.append(outside);
    const wrapper = mount(Drawer, {
      props: { open: true, getContainer: false, focusable: { trap: true } },
      slots: { default: () => h('button', { class: 'last' }, 'Last') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await settle();
    const last = wrapper.get<HTMLButtonElement>('.last').element;
    last.focus();
    last.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(wrapper.get('.apollo-drawer-close').element);
    outside.focus();
    expect(wrapper.get('.apollo-drawer').element.contains(document.activeElement)).toBe(true);
    await wrapper.setProps({ focusable: { trap: false } });
    outside.focus();
    expect(document.activeElement).toBe(outside);
    layout.mockRestore();
  });

  it('preserves a parent push until every open sibling has closed or unmounted', async () => {
    const first = ref(true);
    const second = ref(true);
    const mounted = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Drawer,
            { open: true, getContainer: false, autoFocus: false, push: { distance: '25%' } },
            {
              default: () => [
                h(Drawer, { open: first.value, getContainer: false, autoFocus: false }),
                mounted.value
                  ? h(Drawer, { open: second.value, getContainer: false, autoFocus: false })
                  : null,
              ],
            },
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    const panel = wrapper.get<HTMLElement>('.apollo-drawer-content-wrapper').element;
    expect(panel.style.transform).toBe('translateX(calc(-1 * 25%))');
    first.value = false;
    await settle();
    expect(panel.style.transform).toBe('translateX(calc(-1 * 25%))');
    mounted.value = false;
    await settle();
    expect(panel.style.transform).toBe('');
    first.value = true;
    await settle();
    expect(panel.style.transform).toBe('translateX(calc(-1 * 25%))');
    second.value = false;
    mounted.value = true;
    await settle();
    expect(panel.style.transform).toBe('translateX(calc(-1 * 25%))');
  });

  it('preserves explicit size when a resize request is refused and follows accepted updates', async () => {
    const size = ref<number | undefined>(300);
    const accepted = ref(false);
    const resize = vi.fn((next: number) => {
      if (accepted.value) size.value = next;
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Drawer, {
            open: true,
            getContainer: false,
            autoFocus: false,
            resizable: true,
            size: size.value,
            onResize: resize,
          }),
      }),
      { global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    const panel = wrapper.get<HTMLElement>('.apollo-drawer-content-wrapper').element;
    await wrapper.get('.apollo-drawer-resizable-dragger').trigger('mousedown', { clientX: 500 });
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));
    await settle();
    expect(resize).toHaveBeenLastCalledWith(400);
    expect(panel.style.width).toBe('300px');
    document.dispatchEvent(new MouseEvent('mouseup'));
    size.value = undefined;
    await settle();
    expect(panel.style.width).toBe('300px');
    size.value = 300;
    accepted.value = true;
    await wrapper.get('.apollo-drawer-resizable-dragger').trigger('mousedown', { clientX: 500 });
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 450 }));
    await settle();
    expect(resize).toHaveBeenLastCalledWith(350);
    expect(panel.style.width).toBe('350px');
    size.value = undefined;
    await settle();
    expect(panel.style.width).toBe('350px');
  });

  it('resizes through the current handle configuration, bounds, direction and disabled state', async () => {
    const resize = vi.fn();
    const resizeOnce = vi.fn();
    const start = vi.fn();
    const end = vi.fn();
    const wrapper = mount(Drawer, {
      props: {
        open: true,
        getContainer: false,
        autoFocus: false,
        resizable: true,
        onResizeOnce: resizeOnce,
        onResizeStart: start,
        onResizeEnd: end,
        defaultSize: 300,
        maxSize: 340,
      },
      attrs: { onResize: [resize] },
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await settle();
    await wrapper.get('.apollo-drawer-resizable-dragger').trigger('mousedown', { clientX: 500 });
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 420 }));
    await settle();
    expect(resize).toHaveBeenLastCalledWith(340);
    expect(resizeOnce).toHaveBeenCalledExactlyOnceWith(340);
    expect(start).toHaveBeenCalledExactlyOnceWith(300);
    expect(wrapper.emitted('resize')).toEqual([[340]]);
    expect(wrapper.get<HTMLElement>('.apollo-drawer-content-wrapper').element.style.width).toBe(
      '340px',
    );
    expect(wrapper.get('.apollo-drawer-resizable-dragger').classes()).toContain(
      'apollo-drawer-resizable-dragger-dragging',
    );
    const layout = vi
      .spyOn(wrapper.get('.apollo-drawer-content-wrapper').element, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 0, 340, 300));
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(end).toHaveBeenCalledExactlyOnceWith(340);
    expect(wrapper.emitted('resizeEnd')).toEqual([[340]]);
    layout.mockRestore();
    await wrapper.setProps({
      placement: 'bottom',
      classNames: { dragger: 'current-handle' },
      styles: { dragger: { background: 'red' } },
    });
    expect(wrapper.get('.current-handle').classes()).toContain(
      'apollo-drawer-resizable-dragger-bottom',
    );
    expect(wrapper.get<HTMLElement>('.current-handle').element.style.background).toBe('red');
    await wrapper.get('.current-handle').trigger('mousedown', { clientY: 500 });
    await wrapper.setProps({ resizable: false });
    resize.mockClear();
    document.dispatchEvent(new MouseEvent('mousemove', { clientY: 100 }));
    expect(resize).not.toHaveBeenCalled();
  });

  it('consumes current provider styles, closable and four component tokens in both render modes', async () => {
    const configured = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: configured.value
                ? {
                    drawer: {
                      closable: false,
                      classNames: { root: 'provider-root', body: 'provider-body' },
                      styles: { body: { color: 'red', padding: '2px' } },
                    },
                  }
                : {},
              theme: configured.value
                ? {
                    token: { colorText: '#123456' },
                    components: {
                      Drawer: {
                        zIndexPopup: 1450,
                        footerPaddingBlock: 3,
                        footerPaddingInline: 7,
                        draggerSize: 6,
                      },
                    },
                  }
                : {},
            },
            () => [
              h(Drawer, {
                open: true,
                getContainer: false,
                autoFocus: false,
                styles: { body: { color: 'blue' } },
              }),
              h(PurePanel),
            ],
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    const roots = wrapper.findAll<HTMLElement>('.apollo-drawer');
    for (const root of roots) {
      expect(root.classes()).toContain('provider-root');
      expect(root.element.style.getPropertyValue('--apollo-drawer-z-index-popup')).toBe('1450');
      expect(root.element.style.getPropertyValue('--apollo-drawer-footer-padding-block')).toBe(
        '3px',
      );
      expect(root.element.style.getPropertyValue('--apollo-drawer-footer-padding-inline')).toBe(
        '7px',
      );
      expect(root.element.style.getPropertyValue('--apollo-drawer-dragger-size')).toBe('6px');
      expect(root.element.style.getPropertyValue('--apollo-color-text')).toBe('#123456');
    }
    expect(wrapper.findAll('.apollo-drawer-close')).toHaveLength(0);
    expect(wrapper.findAll('.provider-body')).toHaveLength(2);
    expect(wrapper.get<HTMLElement>('.apollo-drawer-body').element.style.color).toBe('blue');
    expect(wrapper.get<HTMLElement>('.apollo-drawer-body').element.style.padding).toBe('2px');
    configured.value = false;
    await settle();
    expect(wrapper.findAll('.provider-body')).toHaveLength(0);
    expect(wrapper.findAll('.apollo-drawer-close')).toHaveLength(2);
    for (const root of roots)
      expect(root.element.style.getPropertyValue('--apollo-drawer-dragger-size')).toBe('4px');
  });

  it('provides meaningful native refs instead of an unused panelRef callback', async () => {
    const exposed = ref<DrawerRef | null>(null);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Drawer, { ref: exposed, open: true, getContainer: false, autoFocus: false }),
      }),
      {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      },
    );
    wrappers.push(wrapper);
    await settle();
    expect(exposed.value?.nativeElement).toBe(wrapper.get('.apollo-drawer').element);
    exposed.value?.focus();
    expect(document.activeElement).toBe(exposed.value?.nativeElement);
    expect(wrapper.findComponent(DrawerPopup).exists()).toBe(true);
  });
});
