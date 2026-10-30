import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type ComponentPublicInstance,
  createSSRApp,
  defineComponent,
  effectScope,
  h,
  nextTick,
  ref,
  watchEffect,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import type { UseRovingFocusOptions } from '../index';
import {
  moveRovingIndex,
  NO_ACTIVE_INDEX,
  nextRovingIndex,
  useLiveRegion,
  useRovingFocus,
  useTypeahead,
} from '../index';

const scopes: ReturnType<typeof effectScope>[] = [];

function roving(options: UseRovingFocusOptions) {
  const scope = effectScope();
  scopes.push(scope);
  const api = scope.run(() => useRovingFocus(options));
  if (!api) throw new Error('The test scope must be active');
  return api;
}

function buttons() {
  const items = Array.from({ length: 3 }, () => document.createElement('button'));
  document.body.append(...items);
  items[0]?.focus();
  return items;
}

function key(value: string, init: KeyboardEventInit = {}) {
  return new KeyboardEvent('keydown', { key: value, cancelable: true, ...init });
}

afterEach(() => {
  for (const scope of scopes) scope.stop();
  scopes.length = 0;
  document.body.replaceChildren();
});

describe('a11y · native Vue contracts', () => {
  it('keeps rejected controlled movement out of the state and focus, including withdrawal', async () => {
    const active = ref<number | undefined>(0);
    const items = buttons();
    const change = vi.fn();
    const api = roving({
      count: 3,
      activeIndex: active,
      getItem: (index) => items[index] ?? null,
      onChange: change,
    });

    api.setActive(2);
    expect(change).toHaveBeenLastCalledWith(2);
    expect(api.activeIndex.value).toBe(0);
    expect(document.activeElement).toBe(items[0]);
    active.value = undefined;
    await nextTick();
    expect(api.activeIndex.value).toBe(0);
    api.move(1);
    expect(api.activeIndex.value).toBe(1);
    expect(document.activeElement).toBe(items[1]);
  });

  it('moves focus once a requested controlled index is accepted on the next tick', async () => {
    const active = ref(0);
    const items = buttons();
    const api = roving({
      count: 3,
      activeIndex: active,
      getItem: (index) => items[index] ?? null,
    });

    api.move(1);
    expect(document.activeElement).toBe(items[0]);
    active.value = 1;
    await nextTick();
    expect(api.activeIndex.value).toBe(1);
    expect(document.activeElement).toBe(items[1]);
  });

  it('waits for a newly rendered Vue item before completing an accepted focus request', async () => {
    const Host = defineComponent({
      setup() {
        const count = ref(1);
        const active = ref(0);
        const elements = new Map<number, HTMLElement>();
        const api = useRovingFocus({
          count,
          activeIndex: active,
          getItem: (i) => elements.get(i) ?? null,
        });
        return () =>
          h('div', [
            h(
              'button',
              {
                'data-add': '',
                onClick: () => {
                  count.value = 3;
                  api.setActive(2);
                  active.value = 2;
                },
              },
              'Add and activate',
            ),
            h(
              'div',
              { onKeydown: api.onKeyDown },
              Array.from({ length: count.value }, (_, index) =>
                h(
                  'button',
                  {
                    key: index,
                    'data-index': index,
                    tabindex: api.getTabIndex(index),
                    ref: (element: Element | ComponentPublicInstance | null) => {
                      if (element instanceof HTMLElement) elements.set(index, element);
                      else elements.delete(index);
                    },
                  },
                  String(index),
                ),
              ),
            ),
          ]);
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    try {
      await wrapper.get('[data-add]').trigger('click');
      expect(wrapper.get('[data-index="2"]').attributes('tabindex')).toBe('0');
      expect(document.activeElement).toBe(wrapper.get('[data-index="2"]').element);
    } finally {
      wrapper.unmount();
    }
  });

  it('uses the same update request when its public activeIndex ref is written', () => {
    const change = vi.fn();
    const api = roving({ count: 3, activeIndex: 0, onChange: change });
    api.activeIndex.value = 1;
    expect(change).toHaveBeenCalledExactlyOnceWith(1);
    expect(api.activeIndex.value).toBe(0);
  });

  it('does not replay an old focus request after a different external index or disposal', async () => {
    const active = ref(0);
    const items = buttons();
    const scope = effectScope();
    scopes.push(scope);
    const api = scope.run(() =>
      useRovingFocus({ count: 3, activeIndex: active, getItem: (index) => items[index] ?? null }),
    );
    if (!api) throw new Error('The test scope must be active');
    api.setActive(2);
    active.value = 1;
    await nextTick();
    active.value = 2;
    await nextTick();
    expect(document.activeElement).toBe(items[0]);

    api.setActive(1);
    scope.stop();
    active.value = 1;
    await nextTick();
    expect(document.activeElement).toBe(items[0]);
  });

  it('keeps an uncontrolled active item and its Tab stop within a shrinking list', async () => {
    const count = ref(5);
    const api = roving({ count });
    api.setActive(4, false);
    count.value = 2;
    await nextTick();
    expect(api.activeIndex.value).toBe(1);
    expect(api.getTabIndex(1)).toBe(0);
    count.value = 0;
    await nextTick();
    expect(api.activeIndex.value).toBe(NO_ACTIVE_INDEX);
    expect(api.getTabIndex(0)).toBe(-1);
    const event = key('ArrowDown');
    expect(api.onKeyDown(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it('treats offset zero as a no-op before any item is active', () => {
    expect(nextRovingIndex(NO_ACTIVE_INDEX, 0, 3)).toBe(NO_ACTIVE_INDEX);
    expect(moveRovingIndex(NO_ACTIVE_INDEX, 0, 3, false)).toBe(NO_ACTIVE_INDEX);
    const change = vi.fn();
    const api = roving({ count: 3, onChange: change });
    api.move(0);
    expect(api.activeIndex.value).toBe(NO_ACTIVE_INDEX);
    expect(change).not.toHaveBeenCalled();
  });

  it('prevents the browser default for Home and End as it does for arrows', () => {
    const api = roving({ count: 3 });
    api.setActive(1, false);
    for (const name of ['Home', 'End']) {
      const event = key(name);
      expect(api.onKeyDown(event)).toBe(true);
      expect(event.defaultPrevented).toBe(true);
    }
  });

  it('leaves already handled or composing navigation to the owning control', () => {
    const api = roving({ count: 3 });
    api.setActive(1, false);
    const handled = key('ArrowDown');
    handled.preventDefault();
    expect(api.onKeyDown(handled)).toBe(false);
    expect(api.onKeyDown(key('ArrowDown', { isComposing: true }))).toBe(false);
    expect(api.activeIndex.value).toBe(1);
  });

  it('does not type ahead from an IME candidate or an already handled character', () => {
    const match = vi.fn();
    const api = useTypeahead({ labels: ['Apple', 'Bee'], onMatch: match });
    expect(api.onKeyDown(key('b', { isComposing: true }))).toBe(false);
    const handled = key('b');
    handled.preventDefault();
    expect(api.onKeyDown(handled)).toBe(false);
    expect(api.buffer.value).toBe('');
    expect(match).not.toHaveBeenCalled();
  });

  it('reads a replaced clock callback for its next typeahead input', () => {
    const options = { labels: ['Apple'], now: () => 0 };
    const api = useTypeahead(options);
    expect(api.onKeyDown(key('a'))).toBe(true);
    options.now = () => 600;
    expect(api.onKeyDown(key('p'))).toBe(false);
    expect(api.buffer.value).toBe('p');
  });

  it('retains the current setup watch announcement until its own region mounts', async () => {
    const values = ref([{ label: 'First' }]);
    const Host = defineComponent({
      setup() {
        const region = useLiveRegion();
        watchEffect(() => region.announceValues(values.value));
        return () => h('div');
      },
    });
    const wrapper = mount(Host);
    try {
      const region = document.body.querySelector('[aria-live]');
      expect(region?.textContent).toBe('First');
      values.value = [{ label: 'Second' }];
      await nextTick();
      expect(document.body.querySelector('[aria-live]')).toBe(region);
      expect(region?.textContent).toBe('Second');
    } finally {
      wrapper.unmount();
    }
    expect(document.body.querySelector('[aria-live]')).toBeNull();
  });

  it('keeps setup announcements local during concurrent SSR without creating DOM', async () => {
    const app = (message: string) =>
      createSSRApp(
        defineComponent({
          setup() {
            useLiveRegion().announce(message);
            return () => h('p', message);
          },
        }),
      );
    const html = await Promise.all([renderToString(app('First')), renderToString(app('Second'))]);
    expect(html).toEqual(['<p>First</p>', '<p>Second</p>']);
    expect(document.body.querySelector('[aria-live]')).toBeNull();
  });
});
