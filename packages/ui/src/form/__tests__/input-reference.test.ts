import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { Form, FormItem, useForm } from '../index';
import InputReference from './fixtures/InputReference.vue';

const ModelOnly = defineComponent({
  props: { value: String },
  emits: { 'update:value': (_value: string) => true },
  setup(props, { emit }) {
    return () =>
      h('input', {
        value: props.value,
        onInput(event: Event) {
          if (event.target instanceof HTMLInputElement) emit('update:value', event.target.value);
        },
      });
  },
});

function mountModelOnly(changed: (value: unknown) => void, validator: () => Promise<void>) {
  return mount(
    defineComponent({
      setup() {
        const [form] = useForm();
        return () =>
          h(
            Form,
            { form, initialValues: { name: 'Initial' }, onValuesChange: changed },
            {
              default: () =>
                h(
                  FormItem,
                  { name: 'name', rules: [{ validator }] },
                  { default: () => h(ModelOnly) },
                ),
            },
          );
      },
    }),
  );
}

describe('Form to Input Vue VNode ownership', () => {
  it('merges listener arrays/once and commits and validates one edit once', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const getValueFromEvent = vi.fn((event: Event) => {
      if (!(event.target instanceof HTMLInputElement))
        throw new Error('Expected the owned native input event');
      return event.target.value;
    });
    const wrapper = mount(InputReference, { props: { getValueFromEvent } });
    wrapper.vm.handlers.change = [first, second];
    await nextTick();
    await wrapper.get('input').setValue('First');
    for (let index = 0; index < 8; index += 1)
      await new Promise((resolve) => setTimeout(resolve, 0));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('change')).toHaveLength(1);
    expect(wrapper.emitted('once')).toHaveLength(1);
    expect(wrapper.emitted('values')).toHaveLength(1);
    expect(wrapper.vm.validationCalls).toBe(1);
    expect(getValueFromEvent).toHaveBeenCalledTimes(1);
    expect(getValueFromEvent.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    await wrapper.get('input').setValue('Second');
    for (let index = 0; index < 8; index += 1)
      await new Promise((resolve) => setTimeout(resolve, 0));
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted('once')).toHaveLength(1);
    expect(wrapper.emitted('values')).toHaveLength(2);
    expect(wrapper.vm.validationCalls).toBe(2);
    expect(getValueFromEvent).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('retains updates and validation for model-only Vue controls', async () => {
    const changed = vi.fn();
    const validator = vi.fn(async () => {});
    const wrapper = mountModelOnly(changed, validator);
    expect(wrapper.get('input').element.value).toBe('Initial');
    await wrapper.get('input').setValue('Model only');
    for (let index = 0; index < 8; index += 1)
      await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.get('input').element.value).toBe('Model only');
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0]?.[0]).toEqual({ name: 'Model only' });
    expect(validator).toHaveBeenCalledTimes(1);
    wrapper.getComponent(ModelOnly).vm.$emit('update:value', 'First synchronous edit');
    wrapper.getComponent(ModelOnly).vm.$emit('update:value', 'Last synchronous edit');
    for (let index = 0; index < 8; index += 1)
      await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.get('input').element.value).toBe('Last synchronous edit');
    expect(changed).toHaveBeenCalledTimes(3);
    expect(changed.mock.calls.slice(1).map((call) => call[0])).toEqual([
      { name: 'First synchronous edit' },
      { name: 'Last synchronous edit' },
    ]);
    expect(validator).toHaveBeenCalledTimes(3);
    wrapper.unmount();
  });

  it('cancels pending model-only collection when the field unmounts', async () => {
    const changed = vi.fn();
    const validator = vi.fn(async () => {});
    const wrapper = mountModelOnly(changed, validator);
    wrapper.getComponent(ModelOnly).vm.$emit('update:value', 'Pending');
    wrapper.unmount();
    for (let index = 0; index < 8; index += 1)
      await new Promise((resolve) => setTimeout(resolve, 0));
    expect(changed).not.toHaveBeenCalled();
    expect(validator).not.toHaveBeenCalled();
  });

  it('preserves template refs, directives, dynamic field attrs and single events across remounts', async () => {
    const wrapper = mount(InputReference, { attachTo: document.body });
    const control = wrapper.vm.control;
    expect(control).not.toBeNull();
    if (!control?.input) throw new Error('The original Input template ref must belong to its SFC');
    const native = control.input;
    control.focus({ cursor: 'all' });
    expect(document.activeElement).toBe(native);
    expect([native.selectionStart, native.selectionEnd]).toEqual([0, 6]);
    expect(wrapper.get('[data-field-marker]').attributes('data-field-marker')).toBe('initial');
    expect(wrapper.get('[data-field-marker]').attributes('data-directive-owner')).toBe(
      'FormInputReferenceFixture',
    );
    expect(native.id).toBe('initial-reference_name');
    await wrapper.get('input').setValue('Edited');
    expect(wrapper.vm.model.name).toBe('Edited');
    expect(wrapper.emitted('change')).toHaveLength(1);
    expect(wrapper.emitted('change')?.[0]?.[0]).toBeInstanceOf(Event);
    wrapper.vm.formName = 'updated-reference';
    wrapper.vm.marker = 'updated';
    wrapper.vm.status = 'error';
    await nextTick();
    expect(wrapper.vm.control?.input).toBe(native);
    expect(native.id).toBe('updated-reference_name');
    expect(wrapper.get('[data-field-marker]').attributes('data-field-marker')).toBe('updated');
    expect(wrapper.find('.apollo-input-status-error').exists()).toBe(true);
    const label = wrapper.get('label').element;
    expect(label).toHaveProperty('control', native);
    wrapper.vm.visible = false;
    await nextTick();
    expect(wrapper.vm.control).toBeNull();
    wrapper.vm.visible = true;
    await nextTick();
    const replacement = wrapper.vm.control;
    expect(replacement?.input).toBeInstanceOf(HTMLInputElement);
    expect(replacement?.input).not.toBe(native);
    replacement?.focus();
    expect(document.activeElement).toBe(replacement?.input);
    expect(replacement?.input?.value).toBe('Edited');
    await wrapper.get('input').setValue('Again');
    expect(wrapper.emitted('change')).toHaveLength(2);
    wrapper.unmount();
  });
});
