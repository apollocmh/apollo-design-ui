import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommentVNode, defineComponent, Fragment, h, nextTick, ref, shallowRef } from 'vue';
import * as scrollUtils from '../../_internal/scroll-to';
import { ConfigProvider } from '../../config-provider';
import BackTop from '../BackTop';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('BackTop · Vue contracts', () => {
  it('keeps all text, siblings and fragments in the default slot', async () => {
    const wrapper = mount(BackTop, {
      props: { visibilityHeight: 0 },
      slots: {
        default: () => [
          'Top ',
          h('span', { class: 'first' }, 'first'),
          h(Fragment, null, [h('span', { class: 'second' }, 'second'), ' end']),
        ],
      },
    });
    await nextTick();
    expect(wrapper.text()).toBe('Top firstsecond end');
    expect(wrapper.find('.first').exists()).toBe(true);
    expect(wrapper.find('.second').exists()).toBe(true);
    wrapper.unmount();
  });

  it('updates slot presence and hides an explicitly empty slot', async () => {
    const state = ref<'absent' | 'empty' | 'content'>('absent');
    const Host = defineComponent({
      setup: () => () =>
        h(
          BackTop,
          { visibilityHeight: 0 },
          state.value === 'absent'
            ? undefined
            : {
                default: () =>
                  state.value === 'empty' ? createCommentVNode() : ['Top', h('b', ' now')],
              },
        ),
    });
    const wrapper = mount(Host);
    await nextTick();
    expect(wrapper.find('.apollo-back-top-icon').exists()).toBe(true);
    state.value = 'empty';
    await nextTick();
    expect(wrapper.get('.apollo-back-top').attributes('hidden')).toBeDefined();
    state.value = 'content';
    await nextTick();
    expect(wrapper.get('.apollo-back-top').attributes('hidden')).toBeUndefined();
    expect(wrapper.text()).toBe('Top now');
    state.value = 'absent';
    await nextTick();
    expect(wrapper.find('.apollo-back-top-icon').exists()).toBe(true);
    wrapper.unmount();
  });

  it('uses one named native button, exposes it, and emits click after scrolling', async () => {
    const target = document.createElement('div');
    target.scrollTop = 500;
    const once = vi.fn();
    const click = vi.fn((event: MouseEvent) => {
      expect(target.scrollTop).toBe(0);
      expect(event).toBeInstanceOf(MouseEvent);
    });
    const exposed = shallowRef<InstanceType<typeof BackTop> | null>(null);
    const Host = defineComponent({
      setup: () => () =>
        h(BackTop, {
          ref: exposed,
          visibilityHeight: 0,
          target: () => target,
          duration: 0,
          onClick: click,
          onClickOnce: once,
        }),
    });
    const wrapper = mount(Host);
    await nextTick();
    const button = wrapper.get('button');
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Back to top');
    const instance = exposed.value;
    expect(instance?.nativeElement).toBe(button.element);
    await button.trigger('click');
    await button.trigger('click');
    expect(click).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(wrapper.findComponent(BackTop).emitted('click')).toHaveLength(2);
    wrapper.unmount();
    expect(instance?.nativeElement).toBeNull();
    expect(exposed.value).toBeNull();
  });

  it('rebinds a stable target getter when its reactive element changes', async () => {
    const low = document.createElement('div');
    const high = document.createElement('div');
    high.scrollTop = 700;
    const add = vi.spyOn(high, 'addEventListener');
    const lowAdd = vi.spyOn(low, 'addEventListener');
    const remove = vi.spyOn(low, 'removeEventListener');
    const target = shallowRef(low);
    const wrapper = mount(BackTop, { props: { target: () => target.value } });
    await nextTick();
    expect(wrapper.find('.apollo-back-top-content').exists()).toBe(false);
    target.value = high;
    await nextTick();
    await nextTick();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(wrapper.attributes('hidden')).toBeUndefined();
    wrapper.unmount();
    lowAdd.mockClear();
    target.value = low;
    await nextTick();
    expect(lowAdd).not.toHaveBeenCalled();
  });

  it('replaces the active animation on repeated clicks and releases the last one on unmount', async () => {
    const firstCancel = vi.fn();
    const lastCancel = vi.fn();
    vi.spyOn(scrollUtils, 'scrollTo')
      .mockReturnValueOnce(firstCancel)
      .mockReturnValueOnce(lastCancel);
    const wrapper = mount(BackTop, { props: { visibilityHeight: 0 } });
    await nextTick();
    await wrapper.trigger('click');
    expect(firstCancel).not.toHaveBeenCalled();
    await wrapper.trigger('click');
    expect(firstCancel).toHaveBeenCalledTimes(1);
    expect(lastCancel).not.toHaveBeenCalled();
    wrapper.unmount();
    expect(lastCancel).toHaveBeenCalledTimes(1);
  });

  it('honors the current theme motion preference for scrolling', async () => {
    const target = document.createElement('div');
    target.scrollTop = 500;
    const wrapper = mount(ConfigProvider, {
      props: { theme: { token: { motion: false } } },
      slots: {
        default: () => h(BackTop, { visibilityHeight: 0, target: () => target, duration: 450 }),
      },
    });
    await nextTick();
    await wrapper.get('button').trigger('click');
    expect(target.scrollTop).toBe(0);
    wrapper.unmount();
  });

  it('stops an active scroll animation when the component is unmounted', async () => {
    vi.useFakeTimers();
    const target = document.createElement('div');
    target.scrollTop = 800;
    const wrapper = mount(BackTop, {
      props: { visibilityHeight: 0, target: () => target, duration: 450 },
    });
    await nextTick();
    await wrapper.trigger('click');
    await vi.advanceTimersByTimeAsync(32);
    expect(target.scrollTop).toBeLessThan(800);
    const stoppedAt = target.scrollTop;
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(600);
    expect(target.scrollTop).toBe(stoppedAt);
  });

  it('cancels old-container animation and queued scroll work on a target change', async () => {
    vi.useFakeTimers();
    const oldTarget = document.createElement('div');
    oldTarget.scrollTop = 800;
    const newTarget = document.createElement('div');
    const target = shallowRef(oldTarget);
    const wrapper = mount(BackTop, { props: { target: () => target.value, duration: 450 } });
    await nextTick();
    await wrapper.trigger('click');
    await vi.advanceTimersByTimeAsync(32);
    const stoppedAt = oldTarget.scrollTop;
    oldTarget.dispatchEvent(new Event('scroll'));
    target.value = newTarget;
    await nextTick();
    await vi.advanceTimersByTimeAsync(600);
    expect(oldTarget.scrollTop).toBe(stoppedAt);
    expect(wrapper.attributes('hidden')).toBeDefined();
    wrapper.unmount();
  });

  it('tracks template refs from null through mount and removal', async () => {
    const target = shallowRef<HTMLElement | null>(null);
    const enabled = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h('section', [
          enabled.value ? h('div', { ref: target, class: 'scroll-target' }) : null,
          h(BackTop, { target: () => target.value, visibilityHeight: 0, duration: 0 }),
        ]),
    });
    const wrapper = mount(Host);
    await nextTick();
    const element = wrapper.get('.scroll-target').element;
    expect(element).toBe(target.value);
    const remove = vi.spyOn(element, 'removeEventListener');
    enabled.value = false;
    await nextTick();
    await nextTick();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    await wrapper.get('button').trigger('click');
    expect(wrapper.findComponent(BackTop).emitted('click')).toHaveLength(1);
    wrapper.unmount();
  });

  it('projects current token values and restores their fallback when an override is removed', async () => {
    const override = ref<number | undefined>(1234);
    const base = ref(50);
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            theme: {
              token: { zIndexBase: base.value },
              components:
                override.value === undefined ? {} : { BackTop: { zIndexPopup: override.value } },
            },
          },
          () => h(BackTop, { visibilityHeight: 0 }),
        ),
    });
    const wrapper = mount(Host);
    await nextTick();
    const root = wrapper.get('.apollo-back-top');
    expect(root.attributes('style')).toContain('--apollo-back-top-z-index-popup: 1234');
    override.value = undefined;
    base.value = 70;
    await nextTick();
    expect(root.attributes('style')).toContain('--apollo-back-top-z-index-popup: 80');
    wrapper.unmount();
  });

  it('uses current Provider classes, native style priority and BackTop token values', async () => {
    const components = ref({ 'back-top': { className: 'first-config', style: { color: 'red' } } });
    const zIndex = ref(1234);
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: components.value,
            theme: { components: { BackTop: { zIndexPopup: zIndex.value } } },
          },
          () =>
            h(BackTop, {
              visibilityHeight: 0,
              class: ['user-class'],
              style: ['color: blue', { '--apollo-back-top-z-index-popup': '4321' }],
              'data-probe': 'root',
            }),
        ),
    });
    const wrapper = mount(Host);
    await nextTick();
    const root = wrapper.get('.apollo-back-top');
    expect(root.classes()).toContain('first-config');
    expect(root.classes()).toContain('user-class');
    expect(root.attributes('data-probe')).toBe('root');
    expect(root.element.getAttribute('style')).toContain('color: blue');
    expect(root.element.getAttribute('style')).toContain('--apollo-back-top-z-index-popup: 4321');
    components.value = { 'back-top': { className: 'second-config', style: { color: 'green' } } };
    zIndex.value = 5678;
    await nextTick();
    expect(root.classes()).toContain('second-config');
    expect(root.classes()).not.toContain('first-config');
    expect(root.element.getAttribute('style')).toContain('--apollo-back-top-z-index-popup: 4321');
    wrapper.unmount();
  });
});
