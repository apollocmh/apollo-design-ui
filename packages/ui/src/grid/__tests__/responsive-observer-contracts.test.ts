import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import {
  resetResponsiveObserverForTests,
  useResponsiveObserver,
} from '../../_internal/responsive-observer';
import { ConfigProvider } from '../../config-provider';
import { useBreakpoint } from '../hooks/use-breakpoint';

type MediaListener = (event: MediaQueryListEvent) => void;
const listeners = new Map<string, Set<MediaListener>>();
const listenerCount = () => [...listeners.values()].reduce((sum, group) => sum + group.size, 0);
beforeEach(() => {
  resetResponsiveObserverForTests();
  listeners.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const threshold = Number(query.match(/[\d.]+/)?.[0]);
      return {
        media: query,
        matches: query.includes('min-width') ? 620 >= threshold : 620 <= threshold,
        addEventListener: (_event: string, listener: MediaListener) => {
          const group = listeners.get(query) ?? new Set<MediaListener>();
          group.add(listener);
          listeners.set(query, group);
        },
        removeEventListener: (_event: string, listener: MediaListener) => {
          listeners.get(query)?.delete(listener);
        },
      };
    }),
  );
});
afterEach(() => {
  resetResponsiveObserverForTests();
  vi.unstubAllGlobals();
});
const Probe = defineComponent(() => {
  const screens = useBreakpoint();
  return () => h('output', String(screens.value?.sm));
});

it('distinct Provider breakpoint maps publish their own current viewport', async () => {
  const defaultMap = mount(Probe);
  const customMap = mount(ConfigProvider, {
    props: { theme: { token: { screenSMMin: 640, screenSM: 640 } } },
    slots: { default: () => h(Probe) },
    global: { stubs: { teleport: false } },
  });
  try {
    await nextTick();
    expect(defaultMap.text()).toBe('true');
    expect(customMap.text()).toBe('false');
  } finally {
    defaultMap.unmount();
    customMap.unmount();
  }
});

for (const customFirst of [false, true])
  it(`last unsubscriber removes active media maps, custom first=${customFirst}`, async () => {
    const defaultMap = mount(Probe);
    const customMap = mount(ConfigProvider, {
      props: { theme: { token: { screenSMMin: 640, screenSM: 640 } } },
      slots: { default: () => h(Probe) },
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    expect(listenerCount()).toBe(14);
    if (customFirst) {
      customMap.unmount();
      expect(listenerCount()).toBe(7);
      defaultMap.unmount();
    } else {
      defaultMap.unmount();
      expect(listenerCount()).toBe(7);
      customMap.unmount();
    }
    expect(listenerCount()).toBe(0);
  });

it('current Provider breakpoint replacement re-observes without a resize', async () => {
  const minimum = ref(600),
    color = ref('#1677ff');
  const w = mount(
    defineComponent(
      () => () =>
        h(
          ConfigProvider,
          {
            theme: {
              token: {
                screenSMMin: minimum.value,
                screenSM: minimum.value,
                colorPrimary: color.value,
              },
            },
          },
          () => h(Probe),
        ),
    ),
    { global: { stubs: { teleport: false } } },
  );
  await nextTick();
  expect(w.text()).toBe('true');
  const output = w.get('output').element;
  const calls = vi.mocked(window.matchMedia).mock.calls.length;
  color.value = '#722ed1';
  await nextTick();
  expect(vi.mocked(window.matchMedia).mock.calls.length).toBe(calls);
  minimum.value = 640;
  await nextTick();
  expect(w.get('output').element).toBe(output);
  expect(w.text()).toBe('false');
  expect(listenerCount()).toBe(7);
  w.unmount();
  expect(listenerCount()).toBe(0);
});

it('equal maps share listeners and duplicate release never removes another subscriber', async () => {
  const release: Array<() => void> = [],
    values: boolean[] = [];
  const TwoOwners = defineComponent(() => {
    const { subscribe } = useResponsiveObserver();
    const publish = (screens: { sm?: boolean }) => values.push(Boolean(screens.sm));
    release.push(subscribe(publish), subscribe(publish));
    return () => h('div');
  });
  const w = mount(TwoOwners),
    other = mount(Probe);
  await nextTick();
  expect(vi.mocked(window.matchMedia).mock.calls).toHaveLength(7);
  expect(listenerCount()).toBe(7);
  expect(values).toEqual([true, true]);
  release[0]?.();
  release[0]?.();
  const query = '(min-width: 576px)';
  for (const listener of listeners.get(query) ?? []) {
    listener(Object.assign(new Event('change'), { matches: false, media: query }));
  }
  await nextTick();
  expect(values).toEqual([true, true, false]);
  expect(other.text()).toBe('false');
  w.unmount();
  expect(listenerCount()).toBe(7);
  other.unmount();
  expect(listenerCount()).toBe(0);
  release[1]?.();
  expect(listenerCount()).toBe(0);
});
