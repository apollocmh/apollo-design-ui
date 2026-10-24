import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { resetResponsiveObserverForTests } from '../../_internal/responsive-observer';
import { Avatar } from '../../avatar';
import { List, ListItem } from '../../list';
import { Steps } from '../../steps';
import { useBreakpoint } from '../index';

const listeners = new Map<string, (event: MediaQueryListEvent) => void>();
beforeEach(() => {
  resetResponsiveObserverForTests();
  listeners.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.set(query, listener);
      },
      removeEventListener: () => {
        listeners.delete(query);
      },
    })),
  );
});
afterEach(() => {
  resetResponsiveObserverForTests();
  vi.unstubAllGlobals();
});

it('Steps enables responsive orientation immediately at the current narrow viewport', async () => {
  const w = mount(Steps, {
    props: { responsive: false, items: [{ title: 'Alpha' }, { title: 'Beta' }] },
  });
  expect(w.classes()).toContain('apollo-steps-horizontal');
  await w.setProps({ responsive: true });
  expect(w.classes()).toContain('apollo-steps-vertical');
  await w.setProps({ responsive: false });
  expect(w.classes()).toContain('apollo-steps-horizontal');
});

it('useBreakpoint getter publishes the current mounted snapshot on enable without a resize', async () => {
  const enabled = ref(false);
  const w = mount(
    defineComponent({
      setup() {
        const screens = useBreakpoint(() => enabled.value, null);
        return () =>
          h('output', screens.value === null ? 'paused' : screens.value.xs ? 'xs' : 'wide');
      },
    }),
  );
  expect(w.text()).toBe('paused');
  enabled.value = true;
  await nextTick();
  expect(w.text()).toBe('xs');
});

it('resuming breakpoint updates publishes media changes received while paused', async () => {
  const enabled = ref(true);
  const w = mount(
    defineComponent({
      setup() {
        const screens = useBreakpoint(() => enabled.value);
        return () => h('output', screens.value?.xs ? 'xs' : 'wide');
      },
    }),
  );
  await nextTick();
  expect(w.text()).toBe('xs');
  enabled.value = false;
  await nextTick();
  const query = [...listeners.keys()].find((query) => query.includes('max-width'));
  if (!query) throw new Error('The fixture must subscribe to the xs media query');
  listeners.get(query)?.(Object.assign(new Event('change'), { matches: false, media: query }));
  await nextTick();
  expect(w.text()).toBe('xs');
  enabled.value = true;
  await nextTick();
  expect(w.text()).toBe('wide');
});

it('SSR keeps defaultScreens without observing browser media', async () => {
  const Probe = defineComponent({
    setup() {
      const screens = useBreakpoint(() => true, null);
      return () => h('output', screens.value === null ? 'server default' : 'observed');
    },
  });
  expect(await renderToString(createSSRApp(Probe))).toBe('<output>server default</output>');
  expect(window.matchMedia).not.toHaveBeenCalled();
});

it('unmount disposes shared media listeners even when updates are paused', async () => {
  const enabled = ref(false);
  const w = mount(
    defineComponent({
      setup() {
        useBreakpoint(() => enabled.value);
        return () => h('div');
      },
    }),
  );
  expect(listeners.size).toBeGreaterThan(0);
  w.unmount();
  expect(listeners.size).toBe(0);
  enabled.value = true;
  await nextTick();
  expect(listeners.size).toBe(0);
});

it('Avatar switches numeric size to the current responsive size without a resize', async () => {
  const w = mount(Avatar, { props: { size: 32 } });
  expect(w.get<HTMLElement>('span.apollo-avatar').element.style.width).toBe('32px');
  await w.setProps({ size: { xs: 24, sm: 48 } });
  expect(w.get<HTMLElement>('span.apollo-avatar').element.style.width).toBe('24px');
});

it('List switches static grid to current responsive columns while preserving input state', async () => {
  const w = mount(List, {
    props: { dataSource: ['Alpha', 'Beta'], grid: { column: 1 } },
    slots: {
      item: ({ item }: { item: unknown }) =>
        h(ListItem, {}, { default: () => h('input', { 'aria-label': String(item) }) }),
    },
  });
  expect(w.get<HTMLElement>('.apollo-row > div').element.style.width).toBe('100%');
  const input = w.get('input[aria-label="Alpha"]');
  const node = input.element;
  await input.setValue('kept');
  await w.setProps({ grid: { xs: 2, sm: 3 } });
  expect(w.get<HTMLElement>('.apollo-row > div').element.style.width).toBe('50%');
  expect(w.get('input[aria-label="Alpha"]').element).toBe(node);
  expect(w.get<HTMLInputElement>('input[aria-label="Alpha"]').element.value).toBe('kept');
});
