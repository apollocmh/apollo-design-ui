import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import Checkbox from '../Checkbox';
import Group from '../Group';

describe('Checkbox accepted native DOM state', () => {
  it('restores a rejected checked proposal after a real input click', async () => {
    const wrapper = mount(Checkbox, {
      props: { checked: false, indeterminate: true },
      attachTo: document.body,
    });
    const input = wrapper.get<HTMLInputElement>('input');
    input.element.click();
    await nextTick();
    expect(wrapper.emitted('update:checked')).toEqual([[true]]);
    expect(input.element.checked).toBe(false);
    expect(input.element.indeterminate).toBe(true);
    expect(wrapper.find('.apollo-checkbox-checked').exists()).toBe(false);
    wrapper.unmount();
  });
  it('restores group DOM without retaining rejected values on release', async () => {
    const wrapper = mount(Group, {
      props: { value: ['a'], options: ['a', 'b'] },
      attachTo: document.body,
    });
    const inputs = wrapper.findAll<HTMLInputElement>('input');
    inputs[1]?.element.click();
    await nextTick();
    expect(wrapper.emitted('update:value')).toEqual([[['a', 'b']]]);
    expect(inputs.map((input) => input.element.checked)).toEqual([true, false]);
    await wrapper.setProps({ value: undefined });
    expect(inputs.map((input) => input.element.checked)).toEqual([true, false]);
    wrapper.unmount();
  });
});
