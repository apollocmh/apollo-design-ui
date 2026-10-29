import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref, shallowRef } from 'vue';
import { Input, InputOTP, InputPassword, InputSearch, TextArea } from '../index';
import type { InputRef } from '../interface';

describe('Input current Vue contracts', () => {
  for (const Component of [Input, TextArea, InputPassword, InputSearch]) {
    it(`${Component.name}: an unobserved uncontrolled draft survives a parent update`, async () => {
      const wrapper = mount(Component, { props: { defaultValue: 'initial' } });
      await wrapper.get('input,textarea').setValue('edited draft');
      await wrapper.setProps({ size: 'large' });
      expect(wrapper.get('input,textarea').element).toHaveProperty('value', 'edited draft');
      wrapper.unmount();
    });

    it(`${Component.name}: real events, listener arrays and once`, async () => {
      const change = vi.fn((event: Event) => {
        expect(event.bubbles).toBe(true);
        expect(event.target).toBe(editor);
        event.preventDefault();
      });
      const inputA = vi.fn();
      const inputB = vi.fn();
      const once = vi.fn();
      const wrapper = mount(Component, {
        attrs: { onInput: [inputA, inputB], onChange: change, onChangeOnce: once },
      });
      const editor = wrapper.get('input,textarea').element;
      await wrapper.get('input,textarea').setValue('one');
      await wrapper.get('input,textarea').setValue('two');
      expect(change).toHaveBeenCalledTimes(2);
      expect(once).toHaveBeenCalledTimes(1);
      expect(inputA).toHaveBeenCalledTimes(2);
      expect(inputB).toHaveBeenCalledTimes(2);
      wrapper.unmount();
    });

    it(`${Component.name}: adornment toggles preserve the editor and selection`, async () => {
      const wrapper = mount(Component, {
        props: { defaultValue: 'saved draft' },
        attachTo: document.body,
      });
      const editor = wrapper.get('input,textarea').element;
      if (!(editor instanceof HTMLInputElement || editor instanceof HTMLTextAreaElement))
        throw Error('Missing editor');
      editor.focus();
      editor.setSelectionRange(2, 6);
      await wrapper.setProps({ allowClear: true });
      expect(wrapper.get('input,textarea').element).toBe(editor);
      expect(document.activeElement).toBe(editor);
      expect([editor.selectionStart, editor.selectionEnd]).toEqual([2, 6]);
      await wrapper.setProps({ allowClear: false });
      expect(wrapper.get('input,textarea').element).toBe(editor);
      wrapper.unmount();
    });

    it(`${Component.name}: IME settles once and suppresses business Enter`, async () => {
      const change = vi.fn();
      const enter = vi.fn();
      const wrapper = mount(Component, { attrs: { onChange: change, onPressEnter: enter } });
      const editor = wrapper.get('input,textarea');
      await editor.trigger('compositionstart');
      await editor.setValue('中文');
      await editor.trigger('keydown', { key: 'Enter' });
      expect(change).not.toHaveBeenCalled();
      expect(enter).not.toHaveBeenCalled();
      await editor.trigger('compositionend');
      await editor.trigger('input');
      expect(change).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    });
  }

  it('empty and conditional slots are read on each render', async () => {
    const enabled = ref(false);
    const Host = {
      setup: () => () =>
        h(
          Input,
          { suffix: 'fallback' },
          {
            suffix: () => [],
            prefix: enabled.value ? () => 'current' : undefined,
          },
        ),
    };
    const wrapper = mount(Host);
    const editor = wrapper.get('input').element;
    expect(wrapper.text()).not.toContain('fallback');
    enabled.value = true;
    await nextTick();
    expect(wrapper.text()).toContain('current');
    expect(wrapper.get('input').element).toBe(editor);
    wrapper.unmount();
  });

  it('clear supplies the model before clear and a real owned input event afterwards', async () => {
    const order: string[] = [];
    const wrapper = mount(Input, {
      props: { defaultValue: 'draft', allowClear: true },
      attrs: {
        'onUpdate:value': (value: string) => order.push(`model:${value}`),
        onClear: (event: MouseEvent) => {
          expect(event).toBeInstanceOf(MouseEvent);
          order.push('clear');
        },
        onChange: (event: Event) => {
          expect(event.target).toBe(wrapper.get('input').element);
          expect(event.type).toBe('input');
          order.push('change');
        },
      },
    });
    await wrapper.get('.apollo-input-clear-icon').trigger('click');
    expect(order).toEqual(['model:', 'clear', 'change']);
    expect(wrapper.get('.apollo-input-clear-icon').attributes('aria-label')).toBeTruthy();
    wrapper.unmount();
  });

  it('Search honors type and exposes the Compact root', () => {
    const search = shallowRef<InputRef | null>(null);
    const wrapper = mount(() => h(InputSearch, { type: 'email', ref: search }));
    expect(wrapper.get('input').attributes('type')).toBe('email');
    expect(search.value?.nativeElement).toBe(wrapper.get('.apollo-input-search').element);
    wrapper.unmount();
  });

  it.each([
    { name: 'array', enterButton: [h('strong', 'Search'), 0] },
    { name: 'VNode content', enterButton: h('strong', 'Search') },
    { name: 'zero', enterButton: 0 },
  ])(
    'Search renders supported content in a keyboard accessible button: $name',
    ({ enterButton }) => {
      const wrapper = mount(InputSearch, { props: { enterButton } });
      expect(wrapper.find('button.apollo-input-search-btn').exists()).toBe(true);
      expect(wrapper.get('.apollo-input-search').classes()).toContain(
        'apollo-input-search-with-button',
      );
      wrapper.unmount();
    },
  );

  it('Password exposes its native icon button and a visible scoped slot', async () => {
    const wrapper = mount(InputPassword, {
      slots: { icon: ({ visible }: { visible: boolean }) => String(visible) },
    });
    const button = wrapper.get('.apollo-input-password-icon');
    expect(button.element.tagName).toBe('BUTTON');
    expect(button.text()).toBe('false');
    await button.trigger('click');
    expect(button.text()).toBe('true');
    wrapper.unmount();
  });

  it('OTP emits partial models while change remains a completion event', async () => {
    const wrapper = mount(InputOTP, { props: { length: 4, separator: 0 } });
    await wrapper.get('input').setValue('1');
    expect(wrapper.emitted('update:value')?.at(-1)).toEqual(['1']);
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.findAll('.apollo-otp-separator')).toHaveLength(3);
    await wrapper.get('input').setValue('1234');
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['1234']);
    wrapper.unmount();
  });

  it('OTP respects rejected controlled values after edits', async () => {
    const wrapper = mount(InputOTP, { props: { length: 4, value: '1234' } });
    await wrapper.get('input').setValue('9');
    expect(
      wrapper
        .findAll('input')
        .map((node) => node.element.value)
        .join(''),
    ).toBe('1234');
    wrapper.unmount();
  });
});
