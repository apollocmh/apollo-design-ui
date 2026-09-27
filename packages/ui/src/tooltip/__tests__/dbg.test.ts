import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import Tooltip from '../Tooltip';

describe('dbg', () => {
  it('slot title 0', async () => {
    vi.useFakeTimers();
    const w = mount(() =>
      h(
        Tooltip,
        { mouseLeaveDelay: 0, open: true },
        {
          default: () => h('button', { class: 'tooltip-target' }, 'target'),
          title: () => 0,
        },
      ),
    );
    await vi.runAllTimersAsync();
    console.log('BODY:', document.body.querySelector('.apollo-tooltip')?.outerHTML?.slice(0, 200));
    console.log('HTML:', w.html().slice(0, 150));
    vi.useRealTimers();
    expect(1).toBe(1);
  });
});
