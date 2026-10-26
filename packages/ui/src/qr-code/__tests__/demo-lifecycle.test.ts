import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import StatusDemo from '../demo/status.vue';
import { QrCode } from '../index';

it('the actual status demo rearms each refresh and disposes pending expiry on unmount', async () => {
  vi.useFakeTimers();
  const wrapper = mount(StatusDemo);
  try {
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.find('.apollo-qrcode-expired').exists()).toBe(true);
    for (let cycle = 0; cycle < 2; cycle++) {
      wrapper.getComponent(QrCode).vm.$emit('refresh');
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(1000);
      expect(wrapper.find('.apollo-qrcode-expired').exists()).toBe(true);
    }
    wrapper.getComponent(QrCode).vm.$emit('refresh');
    expect(vi.getTimerCount()).toBe(1);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    wrapper.unmount();
    vi.clearAllTimers();
    vi.useRealTimers();
  }
});
