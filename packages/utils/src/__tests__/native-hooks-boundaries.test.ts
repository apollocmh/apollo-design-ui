import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref, watch } from 'vue';
import { useControlledValue } from '../hooks/use-controlled-value';
import { useDelayState } from '../hooks/use-delay-state';
import { useSafeState } from '../hooks/use-safe-state';
import { useUpdateEffect } from '../hooks/use-update-effect';

describe('actual hook value and cleanup boundaries', () => {
  it('keeps the generic SafeState payload and its nested Vue refs intact', () => {
    const count = ref(1);
    const payload = { count };
    const [value, set] = useSafeState(payload);
    expect(value.value).toBe(payload);
    expect(value.value?.count).toBe(count);
    set((current) => ({ count: current.count }));
    expect(value.value?.count).toBe(count);
  });

  it('keeps the generic delayed payload intact when applied synchronously', () => {
    const count = ref(1);
    const payload = { count };
    const [value, set] = useDelayState(payload);
    expect(value.value).toBe(payload);
    set({ count }, true);
    expect(value.value.count).toBe(count);
  });

  it('keeps the generic controlled model payload intact without altering rejection or release', () => {
    const count = ref(1);
    const payload = { count };
    const [value, set] = useControlledValue({ defaultValue: payload, getValue: () => undefined });
    expect(value.value).toBe(payload);
    set((current) => ({ count: current.count }));
    expect(value.value.count).toBe(count);
  });

  it('cleans an update effect once even when its next callback throws', async () => {
    const dependency = ref(0);
    const cleanup = vi.fn();
    const failure = new Error('Expected effect callback failure');
    const captured: unknown[] = [];
    const wrapper = mount(
      defineComponent({
        setup() {
          useUpdateEffect(() => {
            if (dependency.value === 2) throw failure;
            return cleanup;
          }, [dependency]);
          return () => h('div');
        },
      }),
      {
        global: {
          config: {
            errorHandler: (error) => {
              captured.push(error);
            },
          },
        },
      },
    );
    dependency.value = 1;
    await nextTick();
    dependency.value = 2;
    await nextTick();
    expect(captured).toEqual([failure]);
    expect(cleanup).toHaveBeenCalledOnce();
    wrapper.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('retains the reactivity already owned by an accepted reactive object', async () => {
    const payload = reactive({ count: 1 });
    const [value] = useControlledValue({ defaultValue: payload, getValue: () => undefined });
    const observed = vi.fn();
    const stop = watch(() => value.value.count, observed);
    expect(value.value).toBe(payload);
    payload.count = 2;
    await nextTick();
    expect(observed).toHaveBeenCalledExactlyOnceWith(2, 1, expect.any(Function));
    stop();
  });
});
