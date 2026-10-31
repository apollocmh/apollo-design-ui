import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, provide } from 'vue';
import { resetDevWarned, useDevWarning, warningContextKey } from '../dev-warning';
import { removeCSS, updateCSS } from '../dom/update-css';
import { throttle } from '../throttle';
import { preMessage, resetPreMessage, resetWarned, warning, warningOnce } from '../warning';

afterEach(() => {
  resetPreMessage();
  resetWarned();
  resetDevWarned();
  removeCSS('native-container');
  document.body.innerHTML = '';
});

describe('declared utility service boundaries', () => {
  it('keeps an explicit falsy warning cancellation terminal in the preprocessing chain', () => {
    const output = vi.spyOn(console, 'error').mockImplementation(() => {});
    const later = vi.fn(() => 'unexpected revival');
    preMessage(() => null);
    preMessage(later);
    warning(false, 'Cancelled warning');
    expect(output).not.toHaveBeenCalled();
    expect(later).not.toHaveBeenCalled();
  });

  it('deduplicates arbitrary warning text without treating inherited object keys as existing warnings', () => {
    const output = vi.spyOn(console, 'error').mockImplementation(() => {});
    warningOnce(false, 'toString');
    warningOnce(false, 'toString');
    expect(output).toHaveBeenCalledExactlyOnceWith('Warning: toString');
  });

  it('moves the same keyed style to the explicitly supplied current container', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    const initial = updateCSS('body{overflow:hidden}', 'native-container', first);
    const moved = updateCSS('body{overflow:auto}', 'native-container', second);
    expect(moved).toBe(initial);
    expect(second.contains(moved)).toBe(true);
    expect(first.querySelector('style')).toBeNull();
    expect(moved?.textContent).toBe('body{overflow:auto}');
  });

  it('aggregates a legitimate component name without reading an inherited dictionary value', () => {
    const output = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Child = defineComponent({
      setup() {
        useDevWarning('constructor').deprecated(false, 'old', 'current');
        return () => h('div');
      },
    });
    const Parent = defineComponent({
      setup() {
        provide(warningContextKey, { strict: false });
        return () => h(Child);
      },
    });
    expect(() => mount(Parent)).not.toThrow();
    expect(output).toHaveBeenCalledWith(expect.any(String), {
      constructor: ['`old` is deprecated. Please use `current` instead.'],
    });
  });

  it('does not resurrect a permanently cancelled throttle through upcomingOnly cancellation', () => {
    const callback = vi.fn();
    const handler = throttle(0, callback);
    handler.cancel();
    handler.cancel({ upcomingOnly: true });
    handler();
    expect(callback).not.toHaveBeenCalled();
  });
});
