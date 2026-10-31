import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCommentVNode,
  defineAsyncComponent,
  defineComponent,
  Fragment,
  h,
  nextTick,
  ref,
  shallowRef,
} from 'vue';
import { ConfigProvider } from '../../config-provider';
import type { ComponentConfigLike } from '../../config-provider/interface';
import BorderBeam from '../BorderBeam';
import { borderSamplerSize } from '../border-sampler';
import NativeBorderBeam from './fixtures/NativeBorderBeam.vue';
import RefForBorderBeam from './fixtures/RefForBorderBeam.vue';

const realPortal = { stubs: { teleport: false } };
const settle = async () => {
  await nextTick();
  await nextTick();
};
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('BorderBeam native host contracts', () => {
  it('preserves actual template refs/focus and merges native host attrs separately from effect styles', async () => {
    const w = mount(NativeBorderBeam, { attachTo: document.body, global: realPortal });
    await settle();
    const host = w.get<HTMLButtonElement>('#compiled-host');
    expect(w.vm.hostElement).toBe(host.element);
    expect(host.classes()).toContain('outside-host');
    expect(host.element.style.color).toBe('red');
    expect(host.element.style.marginTop).toBe('3px');
    expect(host.findAll('.apollo-border-beam')).toHaveLength(2);
    expect(host.get<HTMLDivElement>('.apollo-border-beam').element.style.opacity).toBe('0.5');
    expect(Object.hasOwn(BorderBeam.props ?? {}, 'style')).toBe(false);
    expect(Object.hasOwn(BorderBeam.props ?? {}, 'className')).toBe(false);
    host.element.focus();
    w.vm.settings = { count: 3, duration: 9 };
    await settle();
    expect(w.vm.hostElement).toBe(host.element);
    expect(document.activeElement).toBe(host.element);
    expect(host.findAll('.apollo-border-beam')).toHaveLength(3);
    await host.trigger('click');
    await settle();
    expect(w.vm.count).toBe(1);
    expect(host.findAll('.apollo-border-beam')).toHaveLength(3);
    w.vm.count = 2;
    w.vm.settings = { count: 4, duration: 12 };
    await settle();
    expect(host.findAll('.apollo-border-beam')).toHaveLength(4);
    expect(w.vm.hostElement).toBe(host.element);
    expect(document.activeElement).toBe(host.element);
    w.vm.shown = false;
    await settle();
    expect(w.vm.hostElement).toBeNull();
    expect(borderSamplerSize()).toBe(0);
    w.unmount();
  });

  it('keeps compiled ref_for arrays and every keyed sibling when the slot becomes multi-root', async () => {
    const w = mount(RefForBorderBeam, { attachTo: document.body, global: realPortal });
    await settle();
    const first = w.get('button').element;
    expect(w.vm.elements).toEqual([first]);
    expect(first.querySelector('.apollo-border-beam')).not.toBeNull();
    w.vm.rows = ['one', 'two'];
    await settle();
    expect(w.findAll('button')).toHaveLength(2);
    expect(w.vm.elements).toEqual(w.findAll('button').map((node) => node.element));
    expect(w.vm.elements?.[0]).toBe(first);
    expect(w.find('.apollo-border-beam').exists()).toBe(false);
    expect(borderSamplerSize()).toBe(0);
    w.vm.rows = ['two'];
    await settle();
    expect(w.vm.elements).toEqual([w.get('button').element]);
    expect(w.get('button').element.querySelector('.apollo-border-beam')).not.toBeNull();
    w.unmount();
  });

  it('finds a conditional single root inside native Fragments while preserving all unsupported siblings/text', async () => {
    const w = mount(BorderBeam, {
      slots: {
        default: () => [
          createCommentVNode('condition'),
          h(Fragment, [h('button', { id: 'fragment-host' }, 'One')]),
        ],
      },
      attachTo: document.body,
      global: realPortal,
    });
    await settle();
    expect(w.get('#fragment-host').find('.apollo-border-beam').exists()).toBe(true);
    w.unmount();
    const multiple = mount(BorderBeam, {
      slots: { default: () => [h('section', 'First'), h('aside', 'Second'), 0] },
      attachTo: document.body,
      global: realPortal,
    });
    await settle();
    expect(multiple.text()).toBe('FirstSecond0');
    expect(multiple.find('.apollo-border-beam').exists()).toBe(false);
    expect(borderSamplerSize()).toBe(0);
    multiple.unmount();
  });

  it('follows nested component root changes through comments without polling an unavailable host', async () => {
    const mode = ref<'none' | 'one' | 'two'>('none');
    const Inner = defineComponent({
      setup: () => () =>
        mode.value === 'none'
          ? createCommentVNode('pending')
          : h(
              mode.value === 'one' ? 'button' : 'article',
              {
                id: `host-${mode.value}`,
                style: { border: `${mode.value === 'one' ? 2 : 4}px solid black` },
              },
              mode.value,
            ),
    });
    const Outer = defineComponent({ setup: () => () => h(Inner) });
    const w = mount(BorderBeam, {
      slots: { default: () => h(Outer) },
      attachTo: document.body,
      global: realPortal,
    });
    await settle();
    expect(borderSamplerSize()).toBe(0);
    mode.value = 'one';
    await settle();
    const first = w.get('#host-one').element;
    const beam = w.get('#host-one').get('.apollo-border-beam').element;
    mode.value = 'two';
    await settle();
    expect(w.get('#host-two').get('.apollo-border-beam').element).toBe(beam);
    expect(first.querySelector('.apollo-border-beam')).toBeNull();
    expect(w.get('#host-two').get('.apollo-border-beam').attributes('style')).toContain(
      '-4px -4px -4px -4px',
    );
    mode.value = 'none';
    await settle();
    expect(borderSamplerSize()).toBe(0);
    expect(w.find('.apollo-border-beam').exists()).toBe(false);
    mode.value = 'one';
    await settle();
    expect(w.get('#host-one').find('.apollo-border-beam').exists()).toBe(true);
    w.unmount();
    expect(borderSamplerSize()).toBe(0);
  });

  it('retains component instance refs, named slots, keys and existing VNode lifecycle hooks', async () => {
    const Host = defineComponent({
      setup(_, { slots, expose }) {
        expose({ identity: 'original' });
        return () => h('section', { id: 'component-host' }, [slots.header?.(), slots.default?.()]);
      },
    });
    const hostRef = shallowRef<InstanceType<typeof Host> | null>(null);
    const mounted = vi.fn(),
      updated = vi.fn(),
      unmounted = vi.fn(),
      clicks = vi.fn();
    const size = ref(20);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            BorderBeam,
            { size: size.value, onClick: clicks },
            {
              default: () =>
                h(
                  Host,
                  {
                    key: 'stable',
                    ref: hostRef,
                    onVnodeMounted: mounted,
                    onVnodeUpdated: updated,
                    onVnodeUnmounted: unmounted,
                  },
                  {
                    header: () => h('b', 'Title'),
                    default: () => h('button', { type: 'button' }, 'Action'),
                  },
                ),
            },
          ),
      }),
      { attachTo: document.body, global: realPortal },
    );
    await settle();
    const original = hostRef.value;
    const element = w.get('#component-host').element;
    expect(original?.$el).toBe(element);
    expect(mounted).toHaveBeenCalledOnce();
    size.value = 60;
    await settle();
    expect(hostRef.value).toBe(original);
    expect(w.get('#component-host').element).toBe(element);
    expect(w.get('b').text()).toBe('Title');
    expect(updated).toHaveBeenCalled();
    await w.get('button').trigger('click');
    expect(clicks).toHaveBeenCalledOnce();
    w.unmount();
    expect(hostRef.value).toBeNull();
    expect(unmounted).toHaveBeenCalledOnce();
  });

  it('reads current Provider presentation/prefix and separates native host style from effect overrides', async () => {
    const prefix = ref('first');
    const components = shallowRef<Record<string, ComponentConfigLike>>({
      borderBeam: {
        className: 'provider-flat',
        style: { opacity: 0.1, color: 'red' },
        classNames: { effect: 'provider-effect' },
        styles: { effect: { opacity: 0.2 } },
      },
    });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { prefixCls: prefix.value, components: components.value }, () =>
            h(
              BorderBeam,
              {
                duration: 8,
                count: 2,
                classNames: { effect: 'own-effect' },
                styles: { effect: { opacity: 0.8 } },
              },
              () =>
                h(
                  'button',
                  { id: 'provider-host', type: 'button', style: { position: 'relative' } },
                  'Host',
                ),
            ),
          ),
      }),
      { attachTo: document.body, global: realPortal },
    );
    await settle();
    const host = w.get('#provider-host').element;
    const effect = w.get<HTMLElement>('.first-border-beam');
    expect(effect.classes()).toEqual(
      expect.arrayContaining(['provider-flat', 'provider-effect', 'own-effect']),
    );
    expect(effect.element.style.opacity).toBe('0.8');
    expect(effect.element.style.color).toBe('red');
    expect(effect.element.style.getPropertyValue('--first-border-beam-duration')).toBe('8s');
    prefix.value = 'second';
    components.value = { borderBeam: { styles: { effect: { color: 'blue' } } } };
    await settle();
    const current = w.get<HTMLElement>('.second-border-beam');
    expect(w.get('#provider-host').element).toBe(host);
    expect(current.classes()).not.toContain('provider-flat');
    expect(current.element.style.color).toBe('blue');
    expect(current.element.style.getPropertyValue('--first-border-beam-duration')).toBe('');
    expect(current.element.style.getPropertyValue('--second-border-beam-duration')).toBe('8s');
    w.unmount();
    const explicit = mount(BorderBeam, {
      props: { prefixCls: 'custom-border-beam', duration: 5, count: 2 },
      slots: { default: () => h('div', 'Host') },
      global: realPortal,
    });
    await settle();
    expect(
      explicit
        .get<HTMLElement>('.custom-border-beam')
        .element.style.getPropertyValue('--custom-border-beam-duration'),
    ).toBe('5s');
    const effects = explicit.findAll<HTMLElement>('.custom-border-beam');
    expect(effects).toHaveLength(2);
    expect(effects[1]?.element.style.getPropertyValue('--custom-border-beam-delay')).toBe('-2.5s');
    explicit.unmount();
  });

  it('shares one clock while sampling each host document and transferring listeners after adoption', async () => {
    vi.useFakeTimers();
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const remote = frame.contentDocument;
    const view = frame.contentWindow;
    if (!remote || !view) throw new Error('The iframe must have its own document/view');
    let mainHidden = false,
      remoteHidden = false;
    const mainDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => mainHidden });
    Object.defineProperty(remote, 'hidden', { configurable: true, get: () => remoteHidden });
    const mainRead = vi.spyOn(window, 'getComputedStyle');
    const remoteRead = vi.spyOn(view, 'getComputedStyle');
    const addMain = vi.spyOn(document, 'addEventListener'),
      removeMain = vi.spyOn(document, 'removeEventListener');
    const addRemote = vi.spyOn(remote, 'addEventListener'),
      removeRemote = vi.spyOn(remote, 'removeEventListener');
    const interval = vi.spyOn(globalThis, 'setInterval'),
      clear = vi.spyOn(globalThis, 'clearInterval');
    const first = mount(BorderBeam, {
      slots: { default: () => h('div', { style: { border: '2px solid black' } }, 'Main') },
      attachTo: document.body,
      global: realPortal,
    });
    const second = mount(BorderBeam, {
      slots: {
        default: () =>
          h('div', { id: 'remote-host', style: { border: '4px solid black' } }, 'Remote'),
      },
      attachTo: remote.body,
      global: realPortal,
    });
    try {
      await settle();
      expect(borderSamplerSize()).toBe(2);
      expect(interval.mock.calls.filter((call) => call[1] === 500)).toHaveLength(1);
      expect(mainRead).toHaveBeenCalled();
      expect(remoteRead).toHaveBeenCalled();
      expect(
        second
          .get<HTMLElement>('.apollo-border-beam')
          .element.style.getPropertyValue('--apollo-border-beam-inset-offset'),
      ).toBe('-4px -4px -4px -4px');
      remoteHidden = true;
      mainRead.mockClear();
      remoteRead.mockClear();
      vi.advanceTimersByTime(500);
      expect(mainRead).toHaveBeenCalled();
      expect(remoteRead).not.toHaveBeenCalled();
      mainHidden = true;
      remoteHidden = false;
      remote.dispatchEvent(new Event('visibilitychange'));
      expect(remoteRead).toHaveBeenCalled();
      const host = second.get('#remote-host').element;
      document.body.append(document.adoptNode(host));
      mainRead.mockClear();
      remoteRead.mockClear();
      vi.advanceTimersByTime(500);
      expect(mainRead).not.toHaveBeenCalled();
      expect(remoteRead).not.toHaveBeenCalled();
      expect(removeRemote.mock.calls.filter((call) => call[0] === 'visibilitychange')).toHaveLength(
        1,
      );
      mainHidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
      expect(mainRead).toHaveBeenCalled();
      expect(addMain.mock.calls.filter((call) => call[0] === 'visibilitychange')).toHaveLength(1);
      expect(addRemote.mock.calls.filter((call) => call[0] === 'visibilitychange')).toHaveLength(1);
    } finally {
      first.unmount();
      second.unmount();
      expect(borderSamplerSize()).toBe(0);
      expect(clear).toHaveBeenCalled();
      expect(removeMain.mock.calls.filter((call) => call[0] === 'visibilitychange')).toHaveLength(
        1,
      );
      if (mainDescriptor) Object.defineProperty(document, 'hidden', mainDescriptor);
      else Reflect.deleteProperty(document, 'hidden');
      frame.remove();
    }
  });

  it('decorates a genuinely async single root after resolution without replacing its component instance', async () => {
    const LoadedHost = defineComponent({
      setup: () => () => h('div', { id: 'late-host' }, 'Loaded'),
    });
    let resolve: ((component: typeof LoadedHost) => void) | undefined;
    const loaded = new Promise<typeof LoadedHost>((done) => {
      resolve = done;
    });
    const AsyncHost = defineAsyncComponent({ loader: () => loaded, delay: 0 });
    const w = mount(BorderBeam, {
      slots: { default: () => h(AsyncHost) },
      attachTo: document.body,
      global: realPortal,
    });
    await settle();
    expect(borderSamplerSize()).toBe(0);
    resolve?.(LoadedHost);
    await flushPromises();
    await settle();
    expect(w.get('#late-host').find('.apollo-border-beam').exists()).toBe(true);
    w.unmount();
    expect(borderSamplerSize()).toBe(0);
  });
});
