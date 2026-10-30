import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  provide,
  reactive,
  ref,
  type VNodeChild,
} from 'vue';
import { type ConfigContextValue, configContextKey } from '../../config-provider/context';
import { disabledContextKey } from '../../config-provider/disabled-context';
import { type SizeType, sizeContextKey } from '../../config-provider/size-context';
import type { RateRef, StarRenderInfo } from '../interface';
import Rate from '../Rate';
import RateContracts from './fixtures/RateContracts.vue';

describe('Rate · Vue contracts', () => {
  it('mounts the typed template against the real runtime component', async () => {
    const wrapper = mount(RateContracts, { attachTo: document.body });
    try {
      expect(wrapper.findAll('[role="radio"]')).toHaveLength(5);
      await wrapper.findAll('[role="radio"]')[2]?.trigger('click');
      expect(wrapper.get('output').text()).toContain('3 / 3');
      await wrapper.get('button').trigger('click');
      expect(document.activeElement).toBe(wrapper.findAll('[role="radio"]')[2]?.element);
    } finally {
      wrapper.unmount();
    }
  });

  it('declares change/hover-change events and honors template .once listeners', async () => {
    const change = vi.fn();
    const hover = vi.fn();
    const w = mount(
      defineComponent({
        components: { Rate },
        setup: () => ({ change, hover }),
        template: '<Rate @change.once="change" @hover-change.once="hover" />',
      }),
    );
    const rate = w.getComponent(Rate);
    const radios = w.findAll('[role="radio"]');
    await radios[1]!.trigger('mousemove');
    await radios[2]!.trigger('mousemove');
    await radios[1]!.trigger('click');
    await radios[2]!.trigger('click');
    expect(change.mock.calls).toEqual([[2]]);
    expect(hover.mock.calls).toEqual([[2]]);
    expect(rate.emitted('change')).toEqual([[2], [3]]);
    expect(rate.emitted('update:value')).toEqual([[2], [3]]);
    expect(rate.emitted('hoverChange')?.slice(0, 2)).toEqual([[2], [3]]);
    w.unmount();
  });

  it('passes native FocusEvent payloads through focus/blur and supports .once', async () => {
    const focus = vi.fn();
    const focusOnce = vi.fn();
    const blur = vi.fn();
    const w = mount(Rate, { attrs: { onFocus: focus, onFocusOnce: focusOnce, onBlur: blur } });
    await w.trigger('focusin');
    await w.trigger('focusout');
    await w.trigger('focusin');
    expect(focus).toHaveBeenCalledTimes(2);
    expect(focusOnce).toHaveBeenCalledTimes(1);
    expect(blur).toHaveBeenCalledTimes(1);
    expect(focus.mock.calls[0]?.[0]).toBeInstanceOf(FocusEvent);
    expect(focus.mock.calls[0]?.[0].target).toBe(w.element);
    expect(blur.mock.calls[0]?.[0]).toBeInstanceOf(FocusEvent);
    w.unmount();
  });

  it('gives #character the displayed hover value and keeps intentional empty slots empty', async () => {
    const empty = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Rate,
            { value: 2 },
            {
              character: (info: StarRenderInfo) => (empty.value ? [] : String(info.value)),
            },
          ),
      }),
    );
    const character = () => w.get('.apollo-rate-star-second');
    expect(character().text()).toBe('2');
    await w.findAll('[role="radio"]')[3]!.trigger('mousemove');
    expect(character().text()).toBe('4');
    await w.get('ul').trigger('mouseleave');
    expect(character().text()).toBe('2');
    empty.value = true;
    await nextTick();
    expect(character().text()).toBe('');
    expect(character().find('svg').exists()).toBe(false);
    w.unmount();
  });

  it('reads current li geometry after #characterRender changes the star wrapper', async () => {
    const wrapped = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Rate,
            { allowHalf: true },
            {
              characterRender: ({ node }: { node: VNodeChild }) =>
                wrapped.value ? h('div', [node]) : node,
            },
          ),
      }),
    );
    const oldStar = w.findAll('li')[1]!.element;
    Object.defineProperty(oldStar, 'clientWidth', { value: 20 });
    vi.spyOn(oldStar, 'getBoundingClientRect').mockReturnValue(new DOMRect(50, 0, 20, 20));
    wrapped.value = true;
    await nextTick();
    const currentStar = w.findAll('li')[1]!.element;
    expect(currentStar).not.toBe(oldStar);
    Object.defineProperty(currentStar, 'clientWidth', { value: 20 });
    vi.spyOn(currentStar, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 0, 20, 20));
    const event = new MouseEvent('click', { bubbles: true, clientX: 105 });
    currentStar.querySelector('[role="radio"]')!.dispatchEvent(event);
    await nextTick();
    expect(w.getComponent(Rate).emitted('update:value')).toEqual([[1.5]]);
    w.unmount();
  });

  it('preserves the focused star when tooltip content is added, replaced and removed', async () => {
    const w = mount(Rate, { props: { defaultValue: 2 }, attachTo: document.body });
    const radio = w.findAll('[role="radio"]')[1]!.element;
    w.vm.focus();
    await nextTick();
    for (const tooltips of [['one', 'two'], ['first', 'second'], undefined]) {
      await w.setProps({ tooltips });
      expect(w.findAll('[role="radio"]')[1]!.element).toBe(radio);
      expect(document.activeElement).toBe(radio);
    }
    expect(w.emitted('focus')).toHaveLength(1);
    expect(w.emitted('blur')).toBeUndefined();
    w.unmount();
  });

  it('uses KeyboardEvent.key and selects a full star on Enter when allowHalf is enabled', async () => {
    const w = mount(Rate, { props: { allowHalf: true } });
    const star = w.findAll('li')[1]!;
    Object.defineProperty(star.element, 'clientWidth', { value: 20 });
    vi.spyOn(star.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 0, 20, 20));
    await star.get('[role="radio"]').trigger('keydown', { key: 'Enter' });
    await w.trigger('keydown', { key: 'ArrowRight' });
    expect(w.emitted('update:value')).toEqual([[2], [2.5]]);
    w.unmount();
  });

  it('retains the last accepted controlled value when control is removed after a rejected request', async () => {
    const w = mount(Rate, { props: { value: 2 } });
    await w.trigger('keydown', { key: 'ArrowRight', keyCode: 39 });
    expect(w.findAll('.apollo-rate-star-full')).toHaveLength(2);
    await w.setProps({ value: 3 });
    await w.trigger('keydown', { key: 'ArrowRight', keyCode: 39 });
    await w.setProps({ value: undefined });
    expect(w.findAll('.apollo-rate-star-full')).toHaveLength(3);
    await w.trigger('keydown', { key: 'ArrowRight', keyCode: 39 });
    expect(w.emitted('update:value')).toEqual([[3], [4], [4]]);
    expect(w.findAll('.apollo-rate-star-full')).toHaveLength(4);
    w.unmount();
  });

  it('exposes a single radio entry and announces only the accepted rating during hover', async () => {
    const w = mount(Rate, { props: { value: 2.5, allowHalf: true } });
    expect(w.attributes('role')).toBe('radiogroup');
    expect(w.attributes('tabindex')).toBe('-1');
    const radios = w.findAll('[role="radio"]');
    expect(radios.map((radio) => radio.attributes('aria-checked'))).toEqual([
      'false',
      'false',
      'true',
      'false',
      'false',
    ]);
    expect(radios.map((radio) => radio.attributes('tabindex'))).toEqual([
      '-1',
      '-1',
      '0',
      '-1',
      '-1',
    ]);
    expect(radios[2]!.attributes('aria-label')).toBe('2.5');
    await radios[4]!.trigger('mousemove');
    expect(w.findAll('.apollo-rate-star-full')).toHaveLength(5);
    expect(w.findAll('[aria-checked="true"]').map((radio) => radio.element)).toEqual([
      radios[2]!.element,
    ]);
    await w.setProps({ disabled: true });
    expect(w.attributes('aria-disabled')).toBe('true');
    expect(w.findAll('.apollo-rate-star-half')).toHaveLength(1);
    expect(w.findAll('[tabindex="0"]')).toHaveLength(0);
    w.unmount();
  });

  it('focus/blur methods and arrow keys move actual focus without repeating group entry events', async () => {
    const rate = ref<RateRef | null>(null);
    const focus = vi.fn();
    const blur = vi.fn();
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h(Rate, { ref: rate, defaultValue: 2, onFocus: focus, onBlur: blur }),
            h('button', { type: 'button' }, 'Outside'),
          ]),
      }),
      { attachTo: document.body },
    );
    rate.value?.focus();
    await nextTick();
    const radios = w.findAll('[role="radio"]');
    expect(document.activeElement).toBe(radios[1]!.element);
    expect(focus).toHaveBeenCalledTimes(1);
    await radios[1]!.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[2]!.element);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(blur).not.toHaveBeenCalled();
    rate.value?.blur();
    await nextTick();
    expect(document.activeElement).toBe(document.body);
    expect(blur).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('reads current Provider replacements and local disabled/size overrides', async () => {
    const config = reactive<ConfigContextValue>({
      getPrefixCls: (suffix, custom) => custom ?? `first-${suffix}`,
      iconPrefixCls: 'icon',
      direction: 'ltr',
      components: { rate: { className: 'before', style: { color: 'red' } } },
    });
    const disabled = ref(false);
    const size = ref<SizeType>('small');
    const localDisabled = ref<boolean>();
    const localSize = ref<'large' | 'small' | 'middle'>();
    const w = mount(
      defineComponent({
        setup() {
          provide(configContextKey, config);
          provide(
            disabledContextKey,
            computed(() => disabled.value),
          );
          provide(
            sizeContextKey,
            computed(() => size.value),
          );
          return () => h(Rate, { disabled: localDisabled.value, size: localSize.value });
        },
      }),
    );
    expect(w.classes()).toContain('first-rate-small');
    expect(w.classes()).toContain('before');
    config.getPrefixCls = (suffix, custom) => custom ?? `second-${suffix}`;
    config.components = { rate: { className: 'after', style: { color: 'blue' } } };
    config.direction = 'rtl';
    disabled.value = true;
    size.value = 'large';
    await nextTick();
    expect(w.classes()).toEqual(
      expect.arrayContaining([
        'second-rate',
        'second-rate-large',
        'second-rate-rtl',
        'second-rate-disabled',
        'after',
      ]),
    );
    expect(w.classes()).not.toContain('before');
    expect(w.attributes('style')).toContain('color: blue');
    expect(w.findAll('[tabindex="0"]')).toHaveLength(0);
    localDisabled.value = false;
    localSize.value = 'small';
    await nextTick();
    expect(w.classes()).not.toContain('second-rate-disabled');
    expect(w.classes()).toContain('second-rate-small');
    expect(w.findAll('[tabindex="0"]')).toHaveLength(1);
    localDisabled.value = undefined;
    localSize.value = undefined;
    config.components = {};
    await nextTick();
    expect(w.classes()).toContain('second-rate-disabled');
    expect(w.classes()).toContain('second-rate-large');
    expect(w.classes()).not.toContain('after');
    expect(w.attributes('style') ?? '').not.toContain('color');
    w.unmount();
  });
});
