import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { defineComponent, h, nextTick, shallowRef } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Popover from '../../popover/Popover';

it('retains the open editor and its focus when provider styles change', async () => {
  const padding = shallowRef('2px');
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          { components: { popover: { styles: { container: { padding: padding.value } } } } },
          {
            default: () =>
              h(
                Popover,
                { open: true },
                {
                  default: () => h('button', 'Open'),
                  content: () => h('input', { 'data-provider-editor': '' }),
                },
              ),
          },
        ),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  try {
    await nextTick();
    const input = document.querySelector<HTMLInputElement>('[data-provider-editor]');
    if (!input) throw new Error('Missing open editor');
    input.focus();
    input.value = 'draft';
    padding.value = '8px';
    await nextTick();
    await nextTick();
    expect(document.querySelector('[data-provider-editor]')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('draft');
  } finally {
    wrapper.unmount();
  }
});
