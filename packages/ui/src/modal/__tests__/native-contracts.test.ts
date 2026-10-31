import { en_US as enUS, zh_CN as zhCN } from '@apollo-design/locale';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, mergeProps, nextTick, ref, shallowRef } from 'vue';
import type { ConfigProviderProps } from '../../config-provider';
import ConfigProvider from '../../config-provider';
import destroyFns from '../destroyFns';
import Modal from '../index';
import type { ModalHookInstance, ModalProps, ModalSlots } from '../interface';

const mounted: Array<{ unmount: () => void }> = [];
function host(component: Parameters<typeof mount>[0]) {
  const wrapper = mount(component, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  mounted.push(wrapper);
  return wrapper;
}
async function settle() {
  await nextTick();
  await vi.advanceTimersByTimeAsync(700);
  await nextTick();
}
afterEach(async () => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  Modal.destroyAll();
  await settle();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('Modal native contracts', () => {
  it('reads slots on each render and preserves zero', async () => {
    vi.useFakeTimers();
    const shown = ref(false);
    host(
      defineComponent({
        setup: () => () =>
          h(
            Modal,
            { open: true },
            shown.value
              ? {
                  title: () => 0,
                  default: () => 'new body',
                  footer: () => 0,
                }
              : { default: () => 'old body' },
          ),
      }),
    );
    await settle();
    shown.value = true;
    await nextTick();
    expect(document.querySelector('.apollo-modal-title')?.textContent).toBe('0');
    expect(document.querySelector('.apollo-modal-body')?.textContent).toBe('new body');
    expect(document.querySelector('.apollo-modal-footer')?.textContent).toBe('0');
  });

  it('preserves zero and explicit empty button text slots, then restores defaults after removal', async () => {
    vi.useFakeTimers();
    const supplied = ref(true);
    host(
      defineComponent({
        setup: () => () =>
          h(
            Modal,
            { open: true, okText: 'Prop OK', cancelText: 'Prop Cancel' },
            supplied.value
              ? {
                  okText: () => 0,
                  cancelText: () => null,
                }
              : {},
          ),
      }),
    );
    await settle();
    const buttons = () =>
      [...document.querySelectorAll('.apollo-modal-footer button')].map(
        (button) => button.textContent,
      );
    expect(buttons()).toEqual(['', '0']);
    supplied.value = false;
    await nextTick();
    expect(buttons()).toEqual(['Prop Cancel', 'Prop OK']);
  });

  it('lands native attrs on the actual panel and applies current component tokens', async () => {
    vi.useFakeTimers();
    const background = ref('tomato');
    host(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: { components: { Modal: { contentBg: background.value } } } },
            {
              default: () =>
                h(Modal, {
                  open: true,
                  id: 'native-modal',
                  title: 'Panel',
                  'aria-describedby': 'description',
                  class: ['first', { second: true }],
                  style: [{ color: 'red' }, { marginTop: '7px' }],
                }),
            },
          ),
      }),
    );
    await settle();
    const panel = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(panel?.id).toBe('native-modal');
    expect(panel?.getAttribute('aria-describedby')).toBe('description');
    expect(panel?.classList.contains('second')).toBe(true);
    expect(panel?.style.marginTop).toBe('7px');
    expect(panel?.style.getPropertyValue('--apollo-modal-content-bg')).toBe('tomato');
    background.value = 'gold';
    await nextTick();
    expect(panel?.style.getPropertyValue('--apollo-modal-content-bg')).toBe('gold');
  });

  it('mounts a setup-time hook command and resolves its confirmation result', async () => {
    vi.useFakeTimers();
    const result = vi.fn();
    host(
      defineComponent({
        setup() {
          const [api, holder] = Modal.useModal();
          const instance = api.confirm({ title: 'Before holder' });
          Promise.resolve(instance).then(result);
          return () => holder;
        },
      }),
    );
    await settle();
    const ok = document.querySelector<HTMLButtonElement>(
      '.apollo-modal-confirm .apollo-btn-primary',
    );
    expect(ok).not.toBeNull();
    ok?.click();
    await settle();
    expect(result).toHaveBeenCalledExactlyOnceWith(true);
    expect(destroyFns).toHaveLength(0);
  });

  it('cannot resurrect a destroyed static session through update', async () => {
    vi.useFakeTimers();
    const instance = Modal.confirm({ title: 'One session' });
    await settle();
    instance.destroy();
    await settle();
    const timers = vi.getTimerCount();
    instance.update({ title: 'Resurrected' });
    expect(vi.getTimerCount()).toBe(timers);
    await settle();
    expect(document.querySelector('.apollo-modal-confirm')).toBeNull();
    expect(destroyFns).toHaveLength(0);
  });

  it('updates imperative confirmLoading without clearing a pending business promise spinner', async () => {
    vi.useFakeTimers();
    let resolve: () => void = () => {};
    const service = vi.fn(
      () =>
        new Promise<void>((accept) => {
          resolve = accept;
        }),
    );
    const instance = Modal.confirm({ title: 'External loading', onOk: service });
    await settle();
    const ok = document.querySelector<HTMLButtonElement>(
      '.apollo-modal-confirm .apollo-btn-primary',
    );
    instance.update({ confirmLoading: true });
    await nextTick();
    expect(ok?.classList.contains('apollo-btn-loading')).toBe(true);
    ok?.click();
    expect(service).not.toHaveBeenCalled();
    instance.update({ confirmLoading: false });
    await nextTick();
    expect(ok?.classList.contains('apollo-btn-loading')).toBe(false);
    ok?.click();
    ok?.click();
    await nextTick();
    expect(service).toHaveBeenCalledTimes(1);
    expect(ok?.classList.contains('apollo-btn-loading')).toBe(true);
    instance.update({ confirmLoading: true });
    await nextTick();
    instance.update({ confirmLoading: false });
    await nextTick();
    expect(ok?.classList.contains('apollo-btn-loading')).toBe(true);
    resolve();
    await settle();
    expect(document.querySelector('.apollo-modal-confirm')).toBeNull();
  });

  it('consumes declared legacy button types through real Button props on both paths', async () => {
    vi.useFakeTimers();
    host(
      defineComponent({
        setup: () => () =>
          h(Modal, {
            open: true,
            okButtonProps: { type: 'danger', class: 'normal-danger-ok' },
            cancelButtonProps: { type: 'danger', class: 'normal-danger-cancel' },
          }),
      }),
    );
    const instance = Modal.confirm({
      title: 'Button configuration',
      okButtonProps: { type: 'danger', class: 'confirm-danger-ok' },
      cancelButtonProps: { type: 'danger', class: 'confirm-danger-cancel' },
    });
    await settle();
    for (const name of [
      'normal-danger-ok',
      'normal-danger-cancel',
      'confirm-danger-ok',
      'confirm-danger-cancel',
    ]) {
      expect(document.querySelector(`.${name}`)?.classList.contains('apollo-btn-dangerous')).toBe(
        true,
      );
    }
    instance.destroy();
    await settle();
  });

  it('uses the current Provider ShadowRoot container supported by Portal', async () => {
    vi.useFakeTimers();
    const target = document.createElement('div');
    document.body.append(target);
    const shadow = target.attachShadow({ mode: 'open' });
    const wrapper = host(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { getPopupContainer: () => shadow },
            {
              default: () => h(Modal, { open: true, title: 'Shadow dialog', id: 'shadow-modal' }),
            },
          ),
      }),
    );
    await settle();
    expect(shadow.querySelector('[role="dialog"]')?.id).toBe('shadow-modal');
    expect(document.querySelector('#shadow-modal')).toBeNull();
    wrapper.unmount();
    mounted.splice(mounted.indexOf(wrapper), 1);
    await settle();
    expect(shadow.querySelector('[role="dialog"]')).toBeNull();
  });

  it('emits Vue listeners once, keeps OK notification-only, and preserves a refused close on withdrawal', async () => {
    vi.useFakeTimers();
    const open = ref<boolean | undefined>(true);
    const first = vi.fn(),
      second = vi.fn(),
      once = vi.fn(),
      requested = vi.fn();
    host(
      defineComponent({
        setup: () => () =>
          h(
            Modal,
            mergeProps(
              {
                open: open.value,
                onOk: first,
                'onUpdate:open': requested,
              },
              { onOk: second, onOkOnce: once },
            ),
          ),
      }),
    );
    await settle();
    const panel = document.querySelector<HTMLElement>('[role="dialog"]');
    const ok = panel?.querySelector<HTMLButtonElement>('.apollo-btn-primary');
    ok?.click();
    ok?.click();
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(requested).not.toHaveBeenCalled();
    panel?.querySelector<HTMLButtonElement>('.apollo-modal-close')?.click();
    expect(requested).toHaveBeenCalledExactlyOnceWith(false);
    await settle();
    expect(panel?.closest<HTMLElement>('.apollo-modal-wrap')?.style.display).not.toBe('none');
    open.value = undefined;
    await settle();
    expect(panel?.closest<HTMLElement>('.apollo-modal-wrap')?.style.display).not.toBe('none');
    panel?.querySelector<HTMLButtonElement>('.apollo-modal-close')?.click();
    await settle();
    expect(panel?.closest<HTMLElement>('.apollo-modal-wrap')?.style.display).toBe('none');
  });

  it('provides stable scoped buttons and panel components across current content updates', async () => {
    vi.useFakeTimers();
    const text = ref('first');
    const ok = vi.fn();
    const slots: ModalSlots = {
      default: () => h('input', { value: text.value }),
      footer: ({ OkBtn, CancelBtn }) =>
        h('section', { class: 'scoped-footer' }, [h(CancelBtn), h(OkBtn)]),
      modalRender: ({ ModalPanel }) => h('section', { class: 'scoped-panel' }, [h(ModalPanel)]),
    };
    host(
      defineComponent({
        setup: () => () => h(Modal, { open: true, onOk: ok }, slots),
      }),
    );
    await settle();
    const input = document.querySelector('input');
    input?.focus();
    text.value = 'second';
    await nextTick();
    expect(document.querySelector('input')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input?.value).toBe('second');
    document.querySelector<HTMLButtonElement>('.scoped-footer .apollo-btn-primary')?.click();
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it('uses current provider semantics/locale and restores defaults after replacement/removal', async () => {
    vi.useFakeTimers();
    const loading = ref(false);
    const locale = shallowRef(enUS);
    const components = shallowRef<ConfigProviderProps['components']>({
      modal: {
        className: 'provider-root',
        classNames: ({ props }: { props: ModalProps }) => ({
          body: props.loading ? 'busy' : 'ready',
        }),
      },
    });
    host(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { locale: locale.value, components: components.value },
            {
              default: () => h(Modal, { open: true, loading: loading.value }),
            },
          ),
      }),
    );
    await settle();
    expect(document.querySelector('.apollo-modal-body')?.classList.contains('ready')).toBe(true);
    locale.value = zhCN;
    loading.value = true;
    await nextTick();
    expect(document.querySelector('.apollo-modal-body')?.classList.contains('busy')).toBe(true);
    loading.value = false;
    await nextTick();
    expect(document.querySelector('.apollo-btn-primary')?.textContent).toBe(zhCN.Modal?.okText);
    components.value = { modal: { className: 'replacement' } };
    await nextTick();
    expect(document.querySelector('.apollo-modal-root')?.classList.contains('provider-root')).toBe(
      false,
    );
    expect(document.querySelector('.apollo-modal-root')?.classList.contains('replacement')).toBe(
      true,
    );
    components.value = undefined;
    await nextTick();
    expect(document.querySelector('.apollo-modal-root')?.classList.contains('replacement')).toBe(
      false,
    );
  });

  it('keeps a rejected async service open and scopes later completion to its original session', async () => {
    vi.useFakeTimers();
    let instance: ModalHookInstance | undefined;
    let resolve: () => void = () => {};
    let reject: (error: Error) => void = () => {};
    const service = vi.fn(
      () =>
        new Promise<void>((accept, refuse) => {
          resolve = accept;
          reject = refuse;
        }),
    );
    host(
      defineComponent({
        setup() {
          const [api, holder] = Modal.useModal();
          instance = api.confirm({ title: 'Async session', onOk: service });
          Promise.resolve(instance);
          return () => holder;
        },
      }),
    );
    await settle();
    document.querySelector<HTMLButtonElement>('.apollo-btn-primary')?.click();
    await nextTick();
    expect(document.querySelector('.apollo-btn-loading')).not.toBeNull();
    reject(new Error('service rejected'));
    await settle();
    expect(document.querySelector('.apollo-modal-confirm')).not.toBeNull();
    expect(document.querySelector('.apollo-btn-loading')).toBeNull();
    document.querySelector<HTMLButtonElement>('.apollo-btn-primary')?.click();
    await nextTick();
    instance?.destroy();
    await settle();
    const newer = Modal.confirm({ title: 'New session' });
    await settle();
    resolve();
    await settle();
    expect(document.querySelector('.apollo-modal-confirm-title')?.textContent).toBe('New session');
    newer.destroy();
    await settle();
    expect(destroyFns).toHaveLength(0);
  });

  it('supports pre-holder updates/destruction and unregisters all sessions on owner unmount', async () => {
    vi.useFakeTimers();
    const afterClose = vi.fn();
    const result = vi.fn();
    const wrapper = host(
      defineComponent({
        setup() {
          const [api, holder] = Modal.useModal();
          expect(api.warn).toBe(api.warning);
          const hidden = api.confirm({ title: 'Never mounted', afterClose });
          hidden.destroy();
          hidden.update({ title: 'Cannot return' });
          const live = api.confirm({ title: 'Before' });
          live.update((previous) => ({ ...previous, title: 'After' }));
          Promise.resolve(live).then(result);
          return () => holder;
        },
      }),
    );
    await settle();
    expect(document.querySelectorAll('.apollo-modal-confirm')).toHaveLength(1);
    expect(document.querySelector('.apollo-modal-confirm-title')?.textContent).toBe('After');
    expect(afterClose).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    mounted.splice(mounted.indexOf(wrapper), 1);
    await settle();
    expect(result).toHaveBeenCalledExactlyOnceWith(false);
    expect(destroyFns).toHaveLength(0);
  });

  it('calls the latest static cancellation and close services once and cancels a pending mount', async () => {
    vi.useFakeTimers();
    const oldCancel = vi.fn(),
      cancel = vi.fn(),
      afterClose = vi.fn();
    const skipped = Modal.confirm({ title: 'Skipped', afterClose });
    skipped.destroy();
    await settle();
    expect(document.querySelector('.apollo-modal-confirm')).toBeNull();
    expect(afterClose).toHaveBeenCalledTimes(1);
    const live = Modal.confirm({
      title: 'Current',
      onCancel: oldCancel,
      closable: true,
      okType: 'danger',
    });
    await settle();
    expect(document.querySelector('.apollo-btn-dangerous')).not.toBeNull();
    live.update({ onCancel: cancel, afterClose });
    await nextTick();
    document.querySelector<HTMLButtonElement>('.apollo-modal-close')?.click();
    live.destroy();
    await settle();
    expect(oldCancel).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(afterClose).toHaveBeenCalledTimes(2);
    expect(destroyFns).toHaveLength(0);
  });

  it('consumes PurePanel content/title slots and text props using current native contracts', async () => {
    vi.useFakeTimers();
    const wrapper = host(
      defineComponent({
        setup: () => () =>
          h(
            Modal._InternalPanelDoNotUseOrYouWillBeFired,
            { type: 'confirm', title: 'Prop title', content: 'Prop body' },
            {
              title: () => 0,
              content: () => 0,
            },
          ),
      }),
    );
    await nextTick();
    expect(wrapper.find('.apollo-modal-confirm-title').text()).toBe('0');
    expect(wrapper.find('.apollo-modal-confirm-content').text()).toBe('0');
  });

  it('restores the trigger and releases its panel ref when an open instance unmounts', async () => {
    vi.useFakeTimers();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const shown = ref(true);
    const panel = shallowRef<HTMLElement | null>(null);
    host(
      defineComponent({
        setup: () => () => (shown.value ? h(Modal, { open: true, panelRef: panel }) : null),
      }),
    );
    await settle();
    const element = panel.value;
    expect(element?.getAttribute('role')).toBe('dialog');
    element?.focus();
    shown.value = false;
    await settle();
    expect(panel.value).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
