import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import AsyncDemo from '../demo/async.vue';

afterEach(() => vi.useRealTimers());

it('the original async demo can cancel a pending operation and confirm after reopening', async () => {
  vi.useFakeTimers();
  const wrapper = mount(AsyncDemo, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  const buttons = () =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('.apollo-popconfirm-buttons button'));
  try {
    await wrapper.get('button').trigger('click');
    buttons().at(-1)?.click();
    await nextTick();
    expect(buttons().at(-1)?.getAttribute('aria-busy')).toBe('true');
    buttons()[0]?.click();
    await nextTick();
    await wrapper.get('button').trigger('click');
    expect(buttons().at(-1)?.getAttribute('aria-busy')).not.toBe('true');
    buttons().at(-1)?.click();
    await nextTick();
    expect(buttons().at(-1)?.getAttribute('aria-busy')).toBe('true');
  } finally {
    wrapper.unmount();
  }
});
