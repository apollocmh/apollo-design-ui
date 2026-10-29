import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchDemo from '../demo/search.vue';
import SearchLoadingDemo from '../demo/search-input-loading.vue';

const mounted: { unmount(): void }[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Input.Search original demo event bindings', () => {
  it('updates the original search result from a real Enter event', async () => {
    const wrapper = mount(SearchDemo);
    mounted.push(wrapper);
    const input = wrapper.get('input');
    await input.setValue('Apollo');
    await input.trigger('keydown', { key: 'Enter' });
    await input.trigger('keyup', { key: 'Enter' });
    expect(wrapper.text()).toContain('last search: Apollo');
  });

  it('runs one loading search, retains input and clears the next request on unmount', async () => {
    vi.useFakeTimers();
    const setTimer = vi.spyOn(window, 'setTimeout');
    const clearTimer = vi.spyOn(window, 'clearTimeout');
    // Input also schedules password-attribute cleanup; count the demo's own 1200ms requests.
    const requests = () =>
      setTimer.mock.calls.flatMap(([, delay], index) => {
        const result = setTimer.mock.results[index];
        return delay === 1200 && result?.type === 'return' ? [result.value] : [];
      });
    const wrapper = mount(SearchLoadingDemo);
    mounted.push(wrapper);
    const input = wrapper.get<HTMLInputElement>('input');
    await input.setValue('Apollo');
    await input.trigger('keydown', { key: 'Enter' });
    await input.trigger('keyup', { key: 'Enter' });
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true');
    expect(requests()).toHaveLength(1);
    await input.trigger('keydown', { key: 'Enter' });
    await input.trigger('keyup', { key: 'Enter' });
    expect(requests()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1200);
    expect(wrapper.text()).toContain('找到 3 条与「Apollo」相关的结果');
    expect(input.element.value).toBe('Apollo');
    await input.trigger('keydown', { key: 'Enter' });
    await input.trigger('keyup', { key: 'Enter' });
    expect(requests()).toHaveLength(2);
    wrapper.unmount();
    mounted.pop();
    expect(clearTimer).toHaveBeenCalledWith(requests()[1]);
  });
});
