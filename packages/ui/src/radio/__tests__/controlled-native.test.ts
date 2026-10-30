import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import Group from '../Group';
import Radio from '../Radio';

describe('Radio accepted native DOM state', () => {
  it('restores a rejected standalone checked proposal after real click', async () => {
    const wrapper = mount(Radio, { props: { checked: false }, attachTo: document.body });
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.click();
    await nextTick();
    expect(wrapper.emitted('update:checked')).toEqual([[true]]);
    expect(input.element.checked).toBe(false);
    wrapper.unmount();
  });
  it('restores the entire native name group when the parent rejects selecting B', async () => {
    const wrapper = mount(Group, {
      props: { value: 'a', options: ['a', 'b'], name: 'accepted-radio' },
      attachTo: document.body,
    });
    const inputs = wrapper.findAll<HTMLInputElement>('input');
    expect(inputs.map((input) => input.element.checked)).toEqual([true, false]);
    inputs[1]?.element.click();
    await nextTick();
    expect(wrapper.emitted('update:value')).toEqual([['b']]);
    expect(inputs.map((input) => input.element.checked)).toEqual([true, false]);
    await wrapper.setProps({ value: undefined });
    expect(inputs.map((input) => input.element.checked)).toEqual([true, false]);
    wrapper.unmount();
  });
  it('keeps accepted changes and releases member registration on unmount', async () => {
    const value = ref<string | undefined>('a');
    const shown = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        shown.value
          ? h(Group, {
              value: value.value,
              options: ['a', 'b'],
              name: 'accepted-radio-live',
              'onUpdate:value': (next) => {
                if (typeof next === 'string') value.value = next;
              },
            })
          : null,
    });
    const wrapper = mount(Host, { attachTo: document.body });
    wrapper.findAll<HTMLInputElement>('input')[1]?.element.click();
    await nextTick();
    expect(
      wrapper.findAll<HTMLInputElement>('input').map((input) => input.element.checked),
    ).toEqual([false, true]);
    shown.value = false;
    await nextTick();
    expect(wrapper.findAll('input')).toHaveLength(0);
    wrapper.unmount();
  });
});
