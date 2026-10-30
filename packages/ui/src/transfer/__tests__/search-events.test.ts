import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import Search from '../Search';

// The adapter boundary uses Input's native clear → input/change sequence. Its
// end-to-end counterpart runs with the actual Input in Transfer's interaction suite.
const NativeInput = defineComponent({
  props: { value: { type: String, default: undefined } },
  emits: {
    'update:value': (_value: string) => true,
    clear: (_event: MouseEvent) => true,
    change: (_event: Event) => true,
  },
  setup(props, { emit }) {
    const input = ref<HTMLInputElement>();
    return () =>
      h('section', [
        h('input', {
          ref: input,
          value: props.value,
          onInput: (event: Event) => emit('change', event),
        }),
        h(
          'button',
          {
            type: 'button',
            onClick: (event: MouseEvent) => {
              if (!input.value) throw new Error('Expected the real native input');
              input.value.value = '';
              emit('update:value', '');
              emit('clear', event);
              input.value.dispatchEvent(
                new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }),
              );
            },
          },
          'Clear',
        ),
      ]);
  },
});

describe('Transfer.Search native Input event bridge', () => {
  it('handles one clear action once and preserves later real input events', async () => {
    const clear = vi.fn();
    const change = vi.fn<(event: Event) => void>();
    const wrapper = mount(Search, {
      props: {
        prefixCls: 'apollo-transfer-list-search',
        value: 'draft',
        onClear: clear,
        onChange: change,
      },
      global: { stubs: { AInput: NativeInput } },
    });
    await wrapper.get('button').trigger('click');
    expect(clear).toHaveBeenCalledTimes(1);
    expect(change).not.toHaveBeenCalled();
    await wrapper.get('input').setValue('Next');
    expect(change).toHaveBeenCalledTimes(1);
    const event = change.mock.calls[0]?.[0];
    expect(event).toBeInstanceOf(Event);
    expect(event?.target).toBe(wrapper.get('input').element);
    expect(event?.type).toBe('input');
    wrapper.unmount();
  });
});

describe('Transfer.Search with the actual Input', () => {
  it('forwards ordinary native input events and consumes clear once', async () => {
    const change = vi.fn<(event: Event) => void>();
    const clear = vi.fn();
    const wrapper = mount(Search, {
      props: {
        prefixCls: 'apollo-transfer-list-search',
        value: 'Draft',
        onChange: change,
        onClear: clear,
      },
    });
    try {
      const input = wrapper.get('input');
      await input.setValue('Typed');
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0]?.[0].target).toBe(input.element);
      expect(change.mock.calls[0]?.[0]).toBeInstanceOf(Event);
      await wrapper.get('button[aria-label="Clear input"]').trigger('click');
      expect(clear).toHaveBeenCalledTimes(1);
      expect(change).toHaveBeenCalledTimes(1);
    } finally {
      wrapper.unmount();
    }
  });
});
