import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { SliderHandleInfo, SliderRef } from '../interface';
import Slider from '../Slider.vue';

const rect: DOMRect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 200,
  bottom: 20,
  width: 200,
  height: 20,
  toJSON: () => ({}),
};
const key = (name: string, type: 'keydown' | 'keyup' = 'keydown', extra: KeyboardEventInit = {}) =>
  new KeyboardEvent(type, { key: name, bubbles: true, cancelable: true, ...extra });
const touch = (type: string, x: number) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const points = type === 'touchcancel' ? [] : [{ identifier: 1, pageX: x, pageY: 10 }];
  Object.defineProperty(event, 'targetTouches', { value: points });
  Object.defineProperty(event, 'touches', { value: points });
  return event;
};

describe('Slider current native contracts', () => {
  it('uses native key names and preserves the rejected proposal in completion without contaminating withdrawal', async () => {
    const wrapper = mount(Slider, { props: { value: 30, tooltip: { open: false } } });
    const handle = wrapper.get('[role="slider"]');
    handle.element.dispatchEvent(key('ArrowRight'));
    await nextTick();
    expect(wrapper.emitted('beforeChange')).toEqual([[31]]);
    expect(wrapper.emitted('update:value')).toEqual([[31]]);
    expect(handle.attributes('aria-valuenow')).toBe('30');
    handle.element.dispatchEvent(key('ArrowRight', 'keyup'));
    await nextTick();
    expect(wrapper.emitted('changeComplete')).toEqual([[31]]);
    await wrapper.setProps({ value: undefined });
    expect(handle.attributes('aria-valuenow')).toBe('30');
    wrapper.unmount();
  });

  it('does not invent completion for keyup, disabled, composing, unchanged or cancelled input', async () => {
    const wrapper = mount(Slider, {
      props: { defaultValue: 100, tooltip: { open: false } },
      attrs: { onKeydown: (event: KeyboardEvent) => event.preventDefault() },
    });
    const handle = wrapper.get('[role="slider"]');
    handle.element.dispatchEvent(key('ArrowRight', 'keyup', { keyCode: 39 }));
    handle.element.dispatchEvent(key('ArrowLeft', 'keydown', { keyCode: 37 }));
    handle.element.dispatchEvent(key('ArrowLeft', 'keyup', { keyCode: 37 }));
    handle.element.dispatchEvent(key('ArrowLeft', 'keydown', { isComposing: true, keyCode: 37 }));
    handle.element.dispatchEvent(key('ArrowLeft', 'keyup', { isComposing: true, keyCode: 37 }));
    await nextTick();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('changeComplete')).toBeUndefined();
    await wrapper.setProps({ disabled: true });
    handle.element.dispatchEvent(key('End', 'keyup', { keyCode: 35 }));
    await nextTick();
    expect(wrapper.emitted('changeComplete')).toBeUndefined();
    wrapper.unmount();
  });

  it('keeps custom handle native bindings, real references and per-handle accessible attrs', async () => {
    const slider = ref<SliderRef | null>(null);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Slider,
            {
              ref: slider,
              defaultValue: 30,
              tooltip: { open: false },
              tabindex: -1,
              'aria-label': 'Volume',
              'aria-describedby': 'hint',
              style: ['color: red', { marginTop: '7px' }],
            },
            {
              handle: (info: SliderHandleInfo) =>
                h('div', {
                  ...info.nodeProps,
                  class: [info.className, 'custom'],
                  style: info.style,
                }),
            },
          ),
      }),
      { attachTo: document.body },
    );
    const handle = wrapper.get('[role="slider"]');
    slider.value?.focus();
    expect(document.activeElement).toBe(handle.element);
    expect(handle.attributes('aria-label')).toBe('Volume');
    expect(handle.attributes('aria-describedby')).toBe('hint');
    expect(handle.attributes('tabindex')).toBe('-1');
    expect(wrapper.get('.apollo-slider').attributes('tabindex')).toBeUndefined();
    expect(wrapper.get('.apollo-slider').attributes('style')).toContain('color: red');
    expect(wrapper.get('.apollo-slider').attributes('style')).toContain('margin-top: 7px');
    slider.value?.blur();
    expect(document.activeElement).not.toBe(handle.element);
    wrapper.unmount();
    expect(slider.value).toBeNull();
  });

  it('withdraws disabled into the current Provider instead of retaining the first local value', async () => {
    const local = ref<boolean | undefined>(true);
    const global = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { componentDisabled: global.value },
            {
              default: () =>
                h(Slider, { disabled: local.value, defaultValue: 20, tooltip: { open: false } }),
            },
          ),
      }),
    );
    expect(wrapper.get('[role="slider"]').attributes('aria-disabled')).toBe('true');
    local.value = undefined;
    await nextTick();
    expect(wrapper.get('[role="slider"]').attributes('aria-disabled')).toBe('false');
    global.value = true;
    await nextTick();
    expect(wrapper.get('[role="slider"]').attributes('aria-disabled')).toBe('true');
    wrapper.unmount();
  });

  it('shows the range active tooltip and consumes tooltip.formatter', async () => {
    const wrapper = mount(Slider, {
      props: {
        range: true,
        defaultValue: [20, 60],
        ariaLabelForHandle: ['Start', 'End'],
        tooltip: { formatter: (value) => `amount:${value}` },
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrapper.findAll<HTMLElement>('[role="slider"]')[1]?.element.focus();
    await nextTick();
    await nextTick();
    await vi.waitFor(() => expect(document.body.textContent).toContain('amount:60'));
    wrapper.unmount();
  });

  it('cancels touch and configuration-invalidated drags without stale completion or listeners', async () => {
    const wrapper = mount(Slider, {
      props: { defaultValue: 30, tooltip: { open: false } },
      attachTo: document.body,
    });
    wrapper.element.getBoundingClientRect = () => rect;
    const handle = wrapper.get('[role="slider"]');
    handle.element.dispatchEvent(touch('touchstart', 60));
    await nextTick();
    expect(wrapper.classes()).toContain('apollo-slider-lock');
    handle.element.dispatchEvent(touch('touchcancel', 60));
    await nextTick();
    expect(wrapper.classes()).not.toContain('apollo-slider-lock');
    expect(wrapper.emitted('changeComplete')).toBeUndefined();
    handle.element.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 60, clientY: 10, bubbles: true }),
    );
    await wrapper.setProps({ disabled: true });
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 120, clientY: 10, bubbles: true }),
    );
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();
    expect(wrapper.classes()).not.toContain('apollo-slider-lock');
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('changeComplete')).toBeUndefined();
    wrapper.unmount();
  });

  it('reads current Provider styles and all current theme token values on the actual root', async () => {
    const configured = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: configured.value
                ? { slider: { className: 'provided', styles: { handle: { opacity: 0.5 } } } }
                : {},
              theme: configured.value
                ? { components: { Slider: { handleSize: 18, trackBg: '#123456' } } }
                : {},
            },
            { default: () => h(Slider, { defaultValue: 30, tooltip: { open: false } }) },
          ),
      }),
    );
    const root = wrapper.get<HTMLElement>('.apollo-slider');
    expect(root.element.style.getPropertyValue('--apollo-slider-handle-size')).toBe('18px');
    expect(root.element.style.getPropertyValue('--apollo-slider-track-bg')).toBe('#123456');
    expect(wrapper.get('[role="slider"]').attributes('style')).toContain('opacity: 0.5');
    configured.value = false;
    await nextTick();
    expect(root.classes()).not.toContain('provided');
    expect(root.element.style.getPropertyValue('--apollo-slider-handle-size')).toBe('10px');
    wrapper.unmount();
  });
  it('keeps accepted range values, native nodes and focus correct when handles cross', async () => {
    const value = ref<number | number[]>([20, 30]);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Slider, {
            range: true,
            value: value.value,
            ariaLabelForHandle: ['Start', 'End'],
            tooltip: { open: false },
            'onUpdate:value': (next) => {
              value.value = next;
            },
          }),
      }),
      { attachTo: document.body },
    );
    const slider = wrapper.getComponent(Slider);
    const handles = wrapper.findAll<HTMLElement>('[role="slider"]');
    const first = handles[0]?.element;
    const second = handles[1]?.element;
    first?.focus();
    first?.dispatchEvent(key('End'));
    await nextTick();
    expect(value.value).toEqual([30, 100]);
    expect(wrapper.findAll('[role="slider"]').map((handle) => handle.element)).toEqual([
      first,
      second,
    ]);
    expect(document.activeElement).toBe(second);
    second?.dispatchEvent(key('End', 'keyup'));
    await nextTick();
    expect(slider.emitted('beforeChange')).toEqual([[[30, 100]]]);
    expect(slider.emitted('changeComplete')).toEqual([[[30, 100]]]);
    second?.dispatchEvent(key('End'));
    second?.dispatchEvent(key('End', 'keyup'));
    await nextTick();
    expect(slider.emitted('changeComplete')).toHaveLength(1);
    wrapper.unmount();
  });

  it('retains actual handle identity through single/range and tooltip configuration changes', async () => {
    let active: SliderHandleInfo | undefined;
    const wrapper = mount(Slider, {
      props: { range: true, defaultValue: [20, 60], ariaLabelForHandle: ['Start', 'End'] },
      slots: {
        activeHandle: (info: SliderHandleInfo) => {
          active = info;
          return h('div', { ...info.nodeProps, class: info.className, style: info.style });
        },
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const controls = wrapper.findAll<HTMLElement>('[role="slider"]');
    const second = controls[1]?.element;
    second?.focus();
    await nextTick();
    expect(active?.index).toBe(1);
    expect(active?.value).toBe(60);
    expect(active?.nodeProps.role).toBeUndefined();
    expect(active?.nodeProps['aria-hidden']).toBe(true);
    await wrapper.setProps({ tooltip: { open: true } });
    expect(wrapper.findAll('[role="slider"]')[1]?.element).toBe(second);
    expect(document.activeElement).toBe(second);
    const first = controls[0]?.element;
    await wrapper.setProps({ range: false, tooltip: { open: false } });
    expect(wrapper.get('[role="slider"]').element).toBe(first);
    await wrapper.setProps({ range: true });
    expect(wrapper.findAll('[role="slider"]')[0]?.element).toBe(first);
    wrapper.unmount();
  });

  it('owns track gestures and completes with the final proposal while the controller rejects', async () => {
    const wrapper = mount(Slider, {
      props: { range: { draggableTrack: true }, value: [20, 60], tooltip: { open: false } },
      attachTo: document.body,
    });
    wrapper.element.getBoundingClientRect = () => rect;
    wrapper
      .get('.apollo-slider-track')
      .element.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 80, clientY: 10, bubbles: true }),
      );
    await nextTick();
    expect(wrapper.classes()).toContain('apollo-slider-lock');
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 100, clientY: 10, bubbles: true }),
    );
    await nextTick();
    expect(wrapper.emitted('beforeChange')).toEqual([[[30, 70]]]);
    expect(
      wrapper.findAll('[role="slider"]').map((handle) => handle.attributes('aria-valuenow')),
    ).toEqual(['20', '60']);
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 120, clientY: 10, bubbles: true }),
    );
    await nextTick();
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('beforeChange')).toHaveLength(1);
    expect(wrapper.emitted('changeComplete')).toEqual([[[40, 80]]]);
    expect(wrapper.classes()).not.toContain('apollo-slider-lock');
    await wrapper.setProps({ value: undefined });
    expect(
      wrapper.findAll('[role="slider"]').map((handle) => handle.attributes('aria-valuenow')),
    ).toEqual(['20', '60']);
    wrapper.unmount();
  });

  it('honours editable limits for empty ranges and invalidates an input session when marks change', async () => {
    const wrapper = mount(Slider, {
      props: { range: { editable: true, maxCount: 0 }, defaultValue: [], tooltip: { open: false } },
    });
    wrapper.element.getBoundingClientRect = () => rect;
    const clickRail = () =>
      wrapper
        .get('.apollo-slider-rail')
        .element.dispatchEvent(
          new MouseEvent('mousedown', { clientX: 40, clientY: 10, bubbles: true }),
        );
    clickRail();
    await nextTick();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.findAll('[role="slider"]')).toHaveLength(0);
    await wrapper.setProps({ range: { editable: true, maxCount: 1 } });
    clickRail();
    await nextTick();
    expect(wrapper.findAll('[role="slider"]')).toHaveLength(1);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('changeComplete')).toEqual([[[20]]]);
    wrapper.get('[role="slider"]').element.dispatchEvent(key('ArrowRight'));
    await nextTick();
    await wrapper.setProps({
      step: null,
      marks: { 0: 'zero', 50: h('strong', 'half'), 100: 'full' },
    });
    wrapper.get('[role="slider"]').element.dispatchEvent(key('ArrowRight', 'keyup'));
    await nextTick();
    expect(wrapper.emitted('changeComplete')).toHaveLength(1);
    expect(wrapper.get('strong').text()).toBe('half');
    wrapper.unmount();
  });

  it('releases its owner document listeners on unmount without dispatching completion', async () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const wrapper = mount(Slider, { props: { defaultValue: 30, tooltip: { open: false } } });
    wrapper.element.getBoundingClientRect = () => rect;
    wrapper
      .get('[role="slider"]')
      .element.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 60, clientY: 10, bubbles: true }),
      );
    await nextTick();
    const listener = add.mock.calls.findLast(([name]) => name === 'mousemove')?.[1];
    expect(listener).toBeDefined();
    wrapper.unmount();
    expect(
      remove.mock.calls.some(([name, callback]) => name === 'mousemove' && callback === listener),
    ).toBe(true);
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 100, clientY: 10, bubbles: true }),
    );
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('changeComplete')).toBeUndefined();
    add.mockRestore();
    remove.mockRestore();
  });

  it('does not reinterpret a disabled handle press as a rail request for an enabled sibling', async () => {
    const wrapper = mount(Slider, {
      props: {
        range: true,
        defaultValue: [20, 60],
        disabled: [true, false],
        tooltip: { open: false },
      },
    });
    wrapper.element.getBoundingClientRect = () => rect;
    wrapper
      .findAll('[role="slider"]')[0]
      ?.element.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 40, clientY: 10, bubbles: true }),
      );
    await nextTick();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.classes()).not.toContain('apollo-slider-lock');
    expect(
      wrapper.findAll('[role="slider"]').map((handle) => handle.attributes('aria-valuenow')),
    ).toEqual(['20', '60']);
    wrapper.unmount();
  });

  it('delegates the default popup container to current Tooltip configuration and preserves explicit semantic options', async () => {
    const configured = document.createElement('div');
    const explicit = document.createElement('div');
    document.body.append(configured, explicit);
    const local = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { getPopupContainer: () => configured },
            {
              default: () =>
                h(Slider, {
                  defaultValue: 30,
                  tooltip: {
                    open: true,
                    getPopupContainer: local.value ? () => explicit : undefined,
                    classNames: () => ({ root: 'configured-popup', container: 'configured-body' }),
                  },
                }),
            },
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    await vi.waitFor(() => expect(configured.querySelector('.configured-popup')).not.toBeNull());
    expect(configured.querySelector('.configured-body')?.textContent).toBe('30');
    local.value = true;
    await nextTick();
    await vi.waitFor(() => expect(explicit.querySelector('.configured-popup')).not.toBeNull());
    expect(
      explicit.querySelector('.configured-popup')?.classList.contains('apollo-slider-tooltip'),
    ).toBe(true);
    wrapper.unmount();
    configured.remove();
    explicit.remove();
  });
});
