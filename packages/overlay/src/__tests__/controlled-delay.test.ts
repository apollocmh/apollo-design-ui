import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createDelayInvoker } from '../delay';
import { createEscStack } from '../esc-stack';
import { useOverlay } from '../use-overlay';

const wrappers: VueWrapper[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  vi.useRealTimers();
});

function rig(controlled = true) {
  const open = ref(true);
  const change = vi.fn();
  const delay = createDelayInvoker();
  const wrapper = mount(
    defineComponent({
      setup() {
        const api = useOverlay({
          open: controlled ? () => open.value : undefined,
          defaultOpen: true,
          onOpenChange: change,
          mouseEnterDelay: 0.15,
          mouseLeaveDelay: 0.1,
          delayInvoker: delay,
          escStack: createEscStack({ win: null }),
        });
        return () =>
          h('div', [
            h('button', { ref: api.targetRef, ...api.targetProps.value }, 'Trigger'),
            api.open.value
              ? h('div', { ref: api.popupRef, class: 'popup', ...api.popupProps.value }, 'Popup')
              : null,
          ]);
      },
    }),
  );
  wrappers.push(wrapper);
  return { wrapper, open, change, delay };
}

it('accepted controlled closing cancels a pending popup-enter reopen', async () => {
  const { wrapper, open, change, delay } = rig();
  await wrapper.get('.popup').trigger('mouseenter');
  expect(delay.pending).toBe(true);
  open.value = false;
  expect(delay.pending).toBe(false);
  await vi.advanceTimersByTimeAsync(200);
  expect(change).not.toHaveBeenCalled();
  expect(wrapper.find('.popup').exists()).toBe(false);
});

it('closing then reopening in one tick invalidates the earlier delayed hide', async () => {
  const { wrapper, open, change, delay } = rig();
  await wrapper.get('button').trigger('mouseleave');
  expect(delay.pending).toBe(true);
  open.value = false;
  open.value = true;
  expect(delay.pending).toBe(false);
  await vi.advanceTimersByTimeAsync(200);
  expect(change).not.toHaveBeenCalled();
  expect(wrapper.find('.popup').exists()).toBe(true);
});

it('external controlled updates only invalidate their own instance delay', async () => {
  const first = rig();
  const second = rig();
  await first.wrapper.get('.popup').trigger('mouseenter');
  await second.wrapper.get('button').trigger('mouseleave');
  first.open.value = false;
  expect(first.delay.pending).toBe(false);
  expect(second.delay.pending).toBe(true);
  await vi.advanceTimersByTimeAsync(200);
  expect(first.change).not.toHaveBeenCalled();
  expect(second.change).toHaveBeenCalledExactlyOnceWith(false);
});

it('uncontrolled delays and scope disposal retain their existing behavior', async () => {
  const { wrapper, change, delay } = rig(false);
  await wrapper.get('button').trigger('mouseleave');
  await vi.advanceTimersByTimeAsync(100);
  expect(change).toHaveBeenCalledExactlyOnceWith(false);
  await wrapper.get('button').trigger('mouseenter');
  expect(delay.pending).toBe(true);
  wrapper.unmount();
  expect(delay.pending).toBe(false);
  await vi.advanceTimersByTimeAsync(200);
  expect(change).toHaveBeenCalledTimes(1);
  await nextTick();
});
