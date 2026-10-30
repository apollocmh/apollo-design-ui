import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef, withModifiers } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Radio, RadioButton, RadioGroup } from '../index';
import type { RadioOptionItem, RadioRef, RadioValue } from '../interface';

describe('Radio native contracts', () => {
  it('owns the real change event and preserves the proposed checked snapshot after rejection', async () => {
    const change = vi.fn();
    const parentChange = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('div', { onChange: parentChange }, [
            h(Radio, { checked: false, onChange: withModifiers(change, ['stop']) }),
          ]),
      }),
      { attachTo: document.body },
    );
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.click();
    await nextTick();
    expect(change).toHaveBeenCalledTimes(1);
    expect(change.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    expect(change.mock.calls[0]?.[0].target).toBe(input.element);
    expect(change.mock.calls[0]?.[1]).toBe(true);
    expect(input.element.checked).toBe(false);
    expect(parentChange).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('uses the accepted checked state for the wrapper and semantic styles', async () => {
    const wrapper = mount(Radio, {
      props: {
        defaultChecked: true,
        styles: ({ props }) => ({ label: { opacity: props.checked ? 1 : 0.4 } }),
      },
      slots: { default: () => 0 },
    });
    expect(wrapper.classes()).toContain('apollo-radio-wrapper-checked');
    expect(wrapper.get('.apollo-radio-label').attributes('style')).toContain('opacity: 1');
    await wrapper.setProps({ checked: false });
    expect(wrapper.classes()).not.toContain('apollo-radio-wrapper-checked');
    await wrapper.setProps({ checked: undefined });
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(false);
    wrapper.unmount();
  });

  it('forwards Button models, native notifications and actual references once', async () => {
    const radio = ref<RadioRef | null>(null);
    const change = vi.fn();
    const update = vi.fn();
    const keydown = vi.fn();
    const shown = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          shown.value
            ? h(
                RadioButton,
                {
                  ref: radio,
                  'onUpdate:checked': update,
                  onChange: change,
                  onKeydown: keydown,
                  style: ['color: red', { paddingInline: '7px' }],
                },
                { default: () => 'Button' },
              )
            : null,
      }),
      { attachTo: document.body },
    );
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.click();
    await nextTick();
    expect(update).toHaveBeenCalledExactlyOnceWith(true);
    expect(change).toHaveBeenCalledExactlyOnceWith(expect.any(Event), true);
    expect(radio.value?.input).toBe(input.element);
    expect(radio.value?.nativeElement).toBe(wrapper.get('.apollo-radio-button').element);
    radio.value?.focus();
    expect(document.activeElement).toBe(input.element);
    await input.trigger('keydown', { key: 'ArrowRight' });
    expect(keydown).toHaveBeenCalledTimes(1);
    expect(wrapper.get('label').attributes('style')).toContain('color: red');
    expect(wrapper.get('label').attributes('style')).toContain('padding-inline: 7px');
    shown.value = false;
    await nextTick();
    expect(radio.value).toBeNull();
    wrapper.unmount();
  });

  it('preserves scalar option values and emits the value with the same native event', async () => {
    const optionChange = vi.fn();
    const groupChange = vi.fn();
    const value = ref<RadioValue>(1);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(RadioGroup, {
            value: value.value,
            disabled: true,
            options: [
              { value: 1, label: 'number' },
              { value: '1', label: 'string', disabled: false, onChange: optionChange },
              { value: false, label: 'boolean', disabled: false },
            ],
            onChange: groupChange,
            'onUpdate:value': (next) => {
              value.value = next;
            },
          }),
      }),
      { attachTo: document.body },
    );
    const inputs = wrapper.findAll<HTMLInputElement>('input');
    expect(inputs.map((input) => input.element.disabled)).toEqual([true, false, false]);
    inputs[1]?.element.click();
    await nextTick();
    expect(value.value).toBe('1');
    expect(optionChange).toHaveBeenCalledExactlyOnceWith(expect.any(Event), true);
    expect(groupChange).toHaveBeenCalledExactlyOnceWith('1', optionChange.mock.calls[0]?.[0]);
    inputs[2]?.element.click();
    await nextTick();
    expect(value.value).toBe(false);
    expect(groupChange).toHaveBeenLastCalledWith(false, expect.any(Event));
    expect(inputs.map((input) => input.element.checked)).toEqual([false, false, true]);
    wrapper.unmount();
  });

  it('routes Group native attrs and string/array styles to the root', () => {
    const wrapper = mount(RadioGroup, {
      props: { options: ['a'] },
      attrs: {
        title: 'group title',
        tabindex: 2,
        dir: 'rtl',
        style: ['color: red', { marginTop: '7px' }],
      },
    });
    expect(wrapper.attributes('title')).toBe('group title');
    expect(wrapper.attributes('tabindex')).toBe('2');
    expect(wrapper.attributes('dir')).toBe('rtl');
    expect(wrapper.attributes('style')).toContain('color: red');
    expect(wrapper.attributes('style')).toContain('margin-top: 7px');
    expect(wrapper.get('input').attributes('title')).toBeUndefined();
    wrapper.unmount();
  });

  it('preserves native capture listeners alongside Group focus and blur notifications', () => {
    const focus = vi.fn();
    const blur = vi.fn();
    const capturedFocus = vi.fn();
    const capturedBlur = vi.fn();
    const wrapper = mount(RadioGroup, {
      props: { options: ['a'], onFocus: focus, onBlur: blur },
      attrs: { onFocusCapture: capturedFocus, onBlurCapture: capturedBlur },
      attachTo: document.body,
    });
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.focus();
    input.element.blur();
    expect(focus).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent));
    expect(blur).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent));
    expect(capturedFocus).toHaveBeenCalledExactlyOnceWith(focus.mock.calls[0]?.[0]);
    expect(capturedBlur).toHaveBeenCalledExactlyOnceWith(blur.mock.calls[0]?.[0]);
    wrapper.unmount();
  });

  it('keeps option identity, focus and current group metadata through reorder and withdrawal', async () => {
    const options = shallowRef<RadioOptionItem[]>([
      { value: 1, label: 'number' },
      { value: '1', label: 'string' },
    ]);
    const name = ref<string | undefined>('first-name');
    const disabled = ref<boolean | undefined>(true);
    const button = ref(false);
    const focus = vi.fn();
    const blur = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(RadioGroup, {
            options: options.value,
            name: name.value,
            disabled: disabled.value,
            optionType: button.value ? 'button' : 'default',
            value: '1',
            onFocus: focus,
            onBlur: blur,
          }),
      }),
      { attachTo: document.body },
    );
    const stringInput = wrapper.findAll<HTMLInputElement>('input')[1]?.element;
    expect(stringInput).toBeDefined();
    disabled.value = false;
    await nextTick();
    stringInput?.focus();
    expect(focus).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent));
    options.value = [
      { value: '1', label: 'string changed' },
      { value: 1, label: 'number changed' },
    ];
    name.value = undefined;
    await nextTick();
    expect(wrapper.get('input').element).toBe(stringInput);
    expect(document.activeElement).toBe(stringInput);
    expect(wrapper.get('input').attributes('name')).not.toBe('first-name');
    expect(wrapper.get('input').attributes('name')).toBeTruthy();
    expect(wrapper.get('label').text()).toBe('string changed');
    expect(
      wrapper.findAll<HTMLInputElement>('input').map((input) => input.element.checked),
    ).toEqual([true, false]);
    button.value = true;
    await nextTick();
    expect(wrapper.get('input').element).toBe(stringInput);
    expect(wrapper.get('label').classes()).toContain('apollo-radio-button-wrapper');
    blur.mockClear();
    stringInput?.blur();
    expect(blur).toHaveBeenCalledExactlyOnceWith(expect.any(FocusEvent));
    options.value = [{ value: 1, label: 'only number' }];
    await nextTick();
    expect(wrapper.findAll('input')).toHaveLength(1);
    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(false);
    wrapper.unmount();
  });

  it('keeps generated names independent and reads complete default slots during render', async () => {
    const text = ref<false | number | string>(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('div', [
            h(Radio, { 'aria-label': 'standalone' }, { default: () => text.value }),
            h(RadioGroup, { defaultValue: 'a', options: ['a', 'b'] }),
            h(
              RadioGroup,
              { defaultValue: 'a' },
              {
                default: () => [
                  h(RadioButton, { value: 'a' }, { default: () => ['A', h('strong', 'text')] }),
                  h(RadioButton, { value: 'b' }, { default: () => 'B' }),
                ],
              },
            ),
          ]),
      }),
      { attachTo: document.body },
    );
    expect(wrapper.get('label').find('.apollo-radio-label').exists()).toBe(false);
    text.value = 0;
    await nextTick();
    expect(wrapper.get('label').text()).toBe('0');
    text.value = 'changed';
    await nextTick();
    expect(wrapper.get('label').text()).toBe('changed');
    text.value = false;
    await nextTick();
    expect(wrapper.get('label').find('.apollo-radio-label').exists()).toBe(false);
    const groups = wrapper.findAllComponents(RadioGroup);
    const first = groups[0];
    const second = groups[1];
    expect(first?.get('input').attributes('name')).not.toBe(
      second?.get('input').attributes('name'),
    );
    second?.findAll<HTMLInputElement>('input')[1]?.element.click();
    await nextTick();
    expect(first?.findAll<HTMLInputElement>('input').map((input) => input.element.checked)).toEqual(
      [true, false],
    );
    expect(
      second?.findAll<HTMLInputElement>('input').map((input) => input.element.checked),
    ).toEqual([false, true]);
    expect(second?.find('strong').text()).toBe('text');
    wrapper.unmount();
  });

  it('lets native click cancellation prevent selection and ignores disabled changes', async () => {
    const wrapper = mount(Radio, {
      props: { onClick: (event) => event.preventDefault() },
      attachTo: document.body,
    });
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.click();
    await nextTick();
    expect(input.element.checked).toBe(false);
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('update:checked')).toBeUndefined();
    await wrapper.setProps({ disabled: true });
    input.element.click();
    await nextTick();
    expect(input.element.checked).toBe(false);
    input.element.checked = true;
    input.element.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    expect(input.element.checked).toBe(false);
    expect(wrapper.emitted('change')).toBeUndefined();
    wrapper.unmount();
  });

  it('consumes the current Provider semantic configuration and Radio tokens, then withdraws them', async () => {
    const configured = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: configured.value
                ? {
                    radio: {
                      className: 'provider-radio',
                      style: { marginTop: '3px' },
                      classNames: { icon: 'provider-icon' },
                      styles: { label: { color: 'red' } },
                    },
                  }
                : {},
              theme: configured.value
                ? {
                    token: { fontSizeLG: 24, wireframe: true },
                    components: { Radio: { buttonPaddingInline: 21 } },
                  }
                : {},
            },
            { default: () => h(Radio, null, { default: () => 'Text' }) },
          ),
      }),
    );
    const label = wrapper.get<HTMLLabelElement>('label');
    expect(wrapper.get('.apollo-radio').classes()).toContain('provider-icon');
    expect(wrapper.get('.apollo-radio-label').attributes('style')).toContain('color: red');
    expect(label.element.style.getPropertyValue('--apollo-radio-radio-size')).toBe('24');
    expect(label.element.style.getPropertyValue('--apollo-radio-dot-size')).toBe('16');
    expect(label.element.style.getPropertyValue('--apollo-radio-button-padding-inline')).toBe(
      '21px',
    );
    configured.value = false;
    await nextTick();
    expect(wrapper.get('.apollo-radio').classes()).not.toContain('provider-icon');
    expect(label.classes()).not.toContain('provider-radio');
    expect(label.element.style.marginTop).toBe('');
    expect(label.element.style.getPropertyValue('--apollo-radio-radio-size')).toBe('16');
    expect(label.element.style.getPropertyValue('--apollo-radio-dot-size')).toBe('6');
    wrapper.unmount();
  });
});
