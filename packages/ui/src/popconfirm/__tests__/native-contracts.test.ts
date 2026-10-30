import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Popover from '../../popover/Popover';
import type { PopconfirmRef } from '../interface';
import Popconfirm from '../Popconfirm';
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

function action(root: ParentNode, name: 'ok' | 'cancel'): HTMLButtonElement {
  const buttons = root.querySelectorAll<HTMLButtonElement>('.apollo-popconfirm-buttons button');
  const button = name === 'ok' ? buttons.item(buttons.length - 1) : buttons.item(0);
  if (!button) throw Error(`Missing ${name} button`);
  return button;
}

describe('Popconfirm native contracts', () => {
  it('owns notification events with Vue once and listener-array semantics', async () => {
    vi.useFakeTimers();
    const opened = vi.fn();
    const changed = vi.fn();
    const clicked = vi.fn();
    const clickedOnce = vi.fn();
    const finished = vi.fn();
    const wrapper = mount(Popconfirm, {
      props: { title: 'Delete?', onOpenChangeOnce: opened, onPopupClickOnce: clickedOnce },
      attrs: { onOpenChange: [changed], onPopupClick: [clicked], onAfterOpenChange: [finished] },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    const body = document.querySelector('.apollo-popconfirm-inner-content');
    if (!body) throw Error('Missing confirmation body');
    const first = new MouseEvent('click', { bubbles: true });
    const second = new MouseEvent('click', { bubbles: true });
    body.dispatchEvent(first);
    body.dispatchEvent(second);
    expect(clicked.mock.calls).toEqual([[first], [second]]);
    expect(clickedOnce).toHaveBeenCalledExactlyOnceWith(first);
    expect(wrapper.emitted('popupClick')).toEqual([[first], [second]]);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(changed.mock.calls).toEqual([[true], [false]]);
    expect(opened).toHaveBeenCalledExactlyOnceWith(true);
    expect(wrapper.emitted('openChange')).toEqual([[true], [false]]);
    expect(wrapper.emitted('update:open')).toEqual([[true], [false]]);
    expect(finished.mock.calls).toEqual([[true], [false]]);
  });

  it('preserves a refused controlled value after removal and exposes current real elements', async () => {
    vi.useFakeTimers();
    const open = ref<boolean | undefined>(false);
    const popconfirm = ref<PopconfirmRef | null>(null);
    const changed = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Popconfirm,
            {
              ref: popconfirm,
              title: 'Delete?',
              open: open.value,
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
    expect(popconfirm.value?.popupElement).toBeNull();
    expect(popconfirm.value?.nativeElement).toBe(wrapper.get('button').element);
    open.value = undefined;
    await settle();
    expect(popconfirm.value?.popupElement).toBeNull();
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(popconfirm.value?.popupElement).toBe(document.querySelector('.apollo-popconfirm'));
    action(document, 'cancel').click();
    await vi.runAllTimersAsync();
    expect(popconfirm.value?.popupElement).toBeNull();
    expect(() => popconfirm.value?.forceAlign()).not.toThrow();
  });

  it('starts a fresh confirmation after accepted hiding without letting the previous Promise close it', async () => {
    vi.useFakeTimers();
    const requests: (() => void)[] = [];
    const confirm = vi.fn(() => new Promise<void>((resolve) => requests.push(resolve)));
    const wrapper = mount(Popconfirm, {
      props: { title: 'Delete?', onConfirm: confirm },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    action(document, 'ok').click();
    await settle();
    expect(action(document, 'ok').getAttribute('aria-busy')).toBe('true');
    action(document, 'cancel').click();
    await vi.runAllTimersAsync();
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(action(document, 'ok').getAttribute('aria-busy')).not.toBe('true');
    action(document, 'ok').click();
    await settle();
    expect(confirm).toHaveBeenCalledTimes(2);
    requests[0]?.();
    await vi.runAllTimersAsync();
    expect(wrapper.emitted('openChange')).toEqual([[true], [false], [true]]);
    expect(action(document, 'ok').getAttribute('aria-busy')).toBe('true');
    requests[1]?.();
    await vi.runAllTimersAsync();
    expect(wrapper.emitted('openChange')).toEqual([[true], [false], [true], [false]]);
  });

  it('does not notify closing when an unmounted confirmation Promise settles', async () => {
    vi.useFakeTimers();
    let resolve: (() => void) | undefined;
    const changed = vi.fn();
    const wrapper = mount(Popconfirm, {
      props: {
        title: 'Delete?',
        open: true,
        onOpenChange: changed,
        onConfirm: () => new Promise<void>((done) => (resolve = done)),
      },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await vi.runAllTimersAsync();
    action(document, 'ok').click();
    await settle();
    wrapper.unmount();
    resolve?.();
    await vi.runAllTimersAsync();
    expect(changed).not.toHaveBeenCalled();
  });

  it('does not invoke a static panel close callback after unmount', async () => {
    vi.useFakeTimers();
    let resolve: (() => void) | undefined;
    const close = vi.fn();
    const wrapper = mount(PurePanel, {
      props: {
        title: 'Delete?',
        close,
        onConfirm: () => new Promise<void>((done) => (resolve = done)),
      },
      attachTo: document.body,
    });
    action(wrapper.element, 'ok').click();
    await settle();
    wrapper.unmount();
    resolve?.();
    await vi.runAllTimersAsync();
    expect(close).not.toHaveBeenCalled();
  });

  it('routes a rejected confirmation through Vue and allows retry without closing', async () => {
    vi.useFakeTimers();
    let reject: ((reason: Error) => void) | undefined;
    const failure = new Error('Confirmation rejected');
    const captured = vi.fn();
    const confirm = vi.fn(() => new Promise<void>((_resolve, fail) => (reject = fail)));
    const wrapper = mount(Popconfirm, {
      props: { title: 'Delete?', defaultOpen: true, onConfirm: confirm },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false }, config: { errorHandler: captured } },
    });
    wrappers.push(wrapper);
    await vi.runAllTimersAsync();
    action(document, 'ok').click();
    await settle();
    reject?.(failure);
    await vi.runAllTimersAsync();
    expect(captured).toHaveBeenCalledTimes(1);
    expect(captured.mock.calls[0]?.[0]).toBe(failure);
    expect(wrapper.emitted('openChange')).toBeUndefined();
    expect(action(document, 'ok').getAttribute('aria-busy')).not.toBe('true');
    action(document, 'ok').click();
    await settle();
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(action(document, 'ok').getAttribute('aria-busy')).toBe('true');
  });

  it('uses current Popconfirm Provider styles in both popup and PurePanel while keeping nested Popover ownership', async () => {
    vi.useFakeTimers();
    const own = ref<{ className?: string; styles?: { title: { marginTop: string } } }>({
      className: 'own-config',
      styles: { title: { marginTop: '3px' } },
    });
    const wrapper = mount(
      () =>
        h(
          ConfigProvider,
          {
            components: {
              popconfirm: own.value,
              popover: { className: 'popover-config' },
              tooltip: { className: 'tooltip-config' },
            },
          },
          () => [
            h(
              Popconfirm,
              { title: 'Delete?', open: true },
              {
                default: () => h('button', 'Target'),
                description: () =>
                  h(Popover, { title: 'Nested', open: true }, () => h('button', 'Nested target')),
              },
            ),
            h(PurePanel, { title: 'Panel', class: 'static-panel', 'data-panel': 'kept' }),
          ],
        ),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await vi.runAllTimersAsync();
    const popup = document.querySelector<HTMLElement>('.apollo-popconfirm:not(.static-panel)');
    const panel = wrapper.get('.static-panel');
    expect(popup?.classList.contains('own-config')).toBe(true);
    expect(popup?.classList.contains('popover-config')).toBe(false);
    expect(popup?.classList.contains('tooltip-config')).toBe(false);
    expect(panel.classes()).toContain('own-config');
    expect(panel.classes()).not.toContain('popover-config');
    expect(panel.attributes('data-panel')).toBe('kept');
    expect(panel.get<HTMLElement>('.apollo-popconfirm-title').element.style.marginTop).toBe('3px');
    expect(document.querySelector('.popover-config:not(.apollo-popconfirm)')).not.toBeNull();
    own.value = { className: 'replaced-config', styles: { title: { marginTop: '7px' } } };
    await settle();
    expect(popup?.classList.contains('own-config')).toBe(false);
    expect(popup?.classList.contains('replaced-config')).toBe(true);
    expect(panel.classes()).toContain('replaced-config');
    expect(panel.get<HTMLElement>('.apollo-popconfirm-title').element.style.marginTop).toBe('7px');
    own.value = {};
    await settle();
    expect(panel.classes()).not.toContain('replaced-config');
    expect(panel.get<HTMLElement>('.apollo-popconfirm-title').element.style.marginTop).toBe('');
  });

  it('keeps a pending operation on a refused controlled close and reads the next callback after reopening', async () => {
    vi.useFakeTimers();
    let resolve: (() => void) | undefined;
    const first = vi.fn(() => new Promise<void>((done) => (resolve = done)));
    const next = vi.fn();
    const wrapper = mount(Popconfirm, {
      props: { title: 'Delete?', open: true, onConfirm: first },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await vi.runAllTimersAsync();
    const original = action(document, 'ok');
    original.click();
    await settle();
    action(document, 'cancel').click();
    await settle();
    expect(action(document, 'ok')).toBe(original);
    expect(original.getAttribute('aria-busy')).toBe('true');
    await wrapper.setProps({ onConfirm: next });
    original.click();
    expect(next).not.toHaveBeenCalled();
    resolve?.();
    await vi.runAllTimersAsync();
    expect(wrapper.emitted('openChange')).toEqual([[false], [false]]);
    await wrapper.setProps({ open: false });
    await vi.runAllTimersAsync();
    await wrapper.setProps({ open: true });
    await vi.runAllTimersAsync();
    action(document, 'ok').click();
    await settle();
    expect(first).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent));
  });

  it('owns PurePanel popupClick and keeps independent confirmation operations separate', async () => {
    vi.useFakeTimers();
    const clicked = vi.fn();
    const once = vi.fn();
    const confirm = vi.fn();
    const wrapper = mount(
      () => [
        h(PurePanel, {
          title: 'Static',
          class: 'static',
          onPopupClickOnce: once,
          onPopupClick: clicked,
        }),
        h(
          Popconfirm,
          { title: 'First', open: true, classNames: { root: 'first-confirm' }, onConfirm: confirm },
          () => h('button', 'First target'),
        ),
        h(
          Popconfirm,
          {
            title: 'Second',
            open: true,
            classNames: { root: 'second-confirm' },
            onConfirm: confirm,
          },
          () => h('button', 'Second target'),
        ),
      ],
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await vi.runAllTimersAsync();
    const body = wrapper.get('.static .apollo-popconfirm-inner-content');
    const event = new MouseEvent('click', { bubbles: true });
    body.element.dispatchEvent(event);
    body.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(once).toHaveBeenCalledExactlyOnceWith(event);
    expect(clicked).toHaveBeenCalledTimes(2);
    const firstRoot = document.querySelector('.first-confirm');
    const secondRoot = document.querySelector('.second-confirm');
    if (!firstRoot || !secondRoot) throw Error('Missing independent confirmations');
    action(firstRoot, 'ok').click();
    action(secondRoot, 'ok').click();
    await settle();
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('keeps keyboard focus on a refused close and returns it after accepted hiding', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Popconfirm, {
      props: { title: 'Delete?', open: true },
      slots: { default: () => h('button', 'Target') },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await vi.runAllTimersAsync();
    const ok = action(document, 'ok');
    ok.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(wrapper.emitted('openChange')).toEqual([[false]]);
    expect(document.activeElement).toBe(ok);
    await wrapper.setProps({ open: false });
    await vi.runAllTimersAsync();
    expect(document.activeElement).toBe(wrapper.get('button').element);
  });
});
