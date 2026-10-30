import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Steps } from '../index';

const items = [{ title: 'First' }, { title: 'Second' }, { title: 'Third', disabled: true }];

describe('Steps current model', () => {
  it('uses the model listener for pointer and keyboard actions without a change listener', async () => {
    const current = ref(0);
    const Host = defineComponent(
      () => () =>
        h(Steps, {
          items,
          current: current.value,
          'onUpdate:current': (value: number) => {
            current.value = value;
          },
        }),
    );
    const wrapper = mount(Host);
    try {
      expect(wrapper.get('.apollo-steps-item:nth-child(2)').attributes('role')).toBe('button');
      await wrapper.get('.apollo-steps-item:nth-child(2)').trigger('click');
      expect(current.value).toBe(1);
      expect(wrapper.get('.apollo-steps-item-process').text()).toContain('Second');
      await wrapper.get('.apollo-steps-item:nth-child(1)').trigger('keydown', { key: 'Enter' });
      expect(current.value).toBe(0);
      await wrapper.get('.apollo-steps-item:nth-child(3)').trigger('click');
      expect(current.value).toBe(0);
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps rejected requests controlled and follows listener withdrawal and replacement', async () => {
    const update = vi.fn<(value: number) => void>();
    const change = vi.fn<(value: number) => void>();
    const current = ref(0);
    const listenToModel = ref(true);
    const listenToChange = ref(true);
    const Host = defineComponent(
      () => () =>
        h(Steps, {
          items,
          current: current.value,
          ...(listenToModel.value ? { 'onUpdate:current': update } : {}),
          ...(listenToChange.value ? { onChange: change } : {}),
        }),
    );
    const wrapper = mount(Host);
    try {
      await wrapper.get('.apollo-steps-item:nth-child(2)').trigger('click');
      expect(update).toHaveBeenCalledExactlyOnceWith(1);
      expect(change).toHaveBeenCalledExactlyOnceWith(1);
      expect(wrapper.get('.apollo-steps-item-process').text()).toContain('First');
      current.value = 1;
      await nextTick();
      await wrapper.get('.apollo-steps-item:nth-child(2)').trigger('click');
      expect(update).toHaveBeenCalledTimes(1);
      listenToModel.value = false;
      listenToChange.value = false;
      await nextTick();
      expect(wrapper.getComponent(Steps).props('onChange')).toBeUndefined();
      expect(wrapper.getComponent(Steps).props('onUpdate:current')).toBeUndefined();
      expect(wrapper.get('.apollo-steps-item:nth-child(1)').attributes('role')).toBeUndefined();
      listenToModel.value = true;
      await nextTick();
      await wrapper.get('.apollo-steps-item:nth-child(1)').trigger('keydown', { key: ' ' });
      expect(update).toHaveBeenLastCalledWith(0);
      expect(change).toHaveBeenCalledTimes(1);
    } finally {
      wrapper.unmount();
    }
  });
});
