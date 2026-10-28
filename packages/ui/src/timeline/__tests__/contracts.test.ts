import {
  compactAlgorithm,
  darkAlgorithm,
  getDesignToken,
  type ThemeConfig,
} from '@apollo-design/theme';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  ref,
  shallowRef,
  Teleport,
  type VNodeChild,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import { Timeline } from '../index';
import type { TimelineItemType, TimelineRef } from '../interface';
import { useItems } from '../use-items';

afterEach(() => vi.restoreAllMocks());

describe('Timeline current data contracts (2026-10-28)', () => {
  it('normalizes legacy item positions and lets current placement win', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = mount(Timeline, {
      props: {
        items: [
          { key: 'left', position: 'left', content: 'Left' },
          { key: 'right', position: 'right', content: 'Right' },
          { key: 'current', placement: 'end', position: 'left', content: 'Current' },
        ],
      },
    });
    const items = w.findAll('li');
    expect(items[0]?.classes()).toContain('apollo-timeline-item-placement-start');
    expect(items[1]?.classes()).toContain('apollo-timeline-item-placement-end');
    expect(items[2]?.classes()).toContain('apollo-timeline-item-placement-end');
    expect(w.find('[class*="placement-left"], [class*="placement-right"]').exists()).toBe(false);
  });

  it('keeps explicit empty and zero icon data ahead of loading and alias fallback', () => {
    for (const icon of [0, false, ''] satisfies VNodeChild[]) {
      const result = useItems(
        { prefixCls: 'apollo-timeline', rootPrefixCls: 'apollo', mode: 'start' },
        [{ icon, dot: 'Fallback', loading: true }],
      );
      expect(result[0]?.icon).toBe(icon);
      const w = mount(Timeline, { props: { items: [{ key: 'item', icon, loading: true }] } });
      expect(w.find('.apollo-icon-spin').exists()).toBe(false);
      expect(w.get('.apollo-timeline-item-icon').text()).toBe(icon === 0 ? '0' : '');
      expect(w.get('li').classes()).toContain('apollo-steps-item-custom');
    }
  });

  it('renders pending zero and preserves the keyed item when pending toggles with reverse', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = mount(Timeline, {
      props: { pending: 0, reverse: true, items: [{ key: 'a', content: h('input') }] },
    });
    expect(w.findAll('li')).toHaveLength(2);
    expect(w.findAll('.apollo-timeline-item-content').map((n) => n.text())).toEqual(['0', '']);
    const input = w.get('input');
    await input.setValue('kept');
    await w.setProps({ pending: false });
    expect(w.findAll('li')).toHaveLength(1);
    expect(w.get('input').element).toBe(input.element);
    await w.setProps({ pending: 'Working' });
    expect(w.get('input').element).toBe(input.element);
    expect(w.get<HTMLInputElement>('input').element.value).toBe('kept');
  });

  it('routes native change to the root once with the DOM event and keeps passive list items', async () => {
    const change = vi.fn();
    const click = vi.fn();
    const w = mount(Timeline, {
      props: { items: [{ key: 'a', content: h('input', { 'aria-label': 'Note' }) }] },
      attrs: {
        id: 'native-timeline',
        'aria-label': 'History',
        tabindex: 0,
        onChange: change,
        onClick: click,
      },
    });
    expect(w.get('li').attributes('role')).toBeUndefined();
    expect(w.get('li').attributes('tabindex')).toBeUndefined();
    expect(w.attributes('aria-label')).toBe('History');
    expect(w.attributes('tabindex')).toBe('0');
    await w.get('input').trigger('change');
    expect(change).toHaveBeenCalledOnce();
    expect(change.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    expect(change.mock.calls[0]?.[0].target).toBe(w.get('input').element);
    await w.get('input').trigger('click');
    expect(click).toHaveBeenCalledOnce();
  });

  it('replaces and removes current native listeners and honors the once event modifier', async () => {
    const first = vi.fn(),
      second = vi.fn(),
      once = vi.fn();
    const stage = ref(0);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Timeline, {
            items: [{ key: 'a', content: h('input') }],
            ...(stage.value < 2 ? { onChange: stage.value === 0 ? first : second } : {}),
            onChangeOnce: once,
          }),
      }),
    );
    const input = w.get('input');
    await input.trigger('change');
    await input.trigger('change');
    expect(first).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledOnce();
    stage.value = 1;
    await nextTick();
    await input.trigger('change');
    expect(second).toHaveBeenCalledOnce();
    expect(first).toHaveBeenCalledTimes(2);
    stage.value = 2;
    await nextTick();
    await input.trigger('change');
    expect(second).toHaveBeenCalledOnce();
    expect(once).toHaveBeenCalledOnce();
    expect(w.get('li').attributes('role')).toBeUndefined();
  });

  it('keeps nativeElement current through updates, unmount and remount', async () => {
    const api = shallowRef<TimelineRef | null>(null);
    const show = ref(true),
      horizontal = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          show.value
            ? h(Timeline, {
                ref: api,
                orientation: horizontal.value ? 'horizontal' : 'vertical',
                items: [{ content: 'Current' }],
              })
            : null,
      }),
    );
    await nextTick();
    const first = api.value?.nativeElement;
    expect(first).toBe(w.get('ol').element);
    horizontal.value = true;
    await nextTick();
    expect(api.value?.nativeElement).toBe(first);
    show.value = false;
    await nextTick();
    expect(api.value).toBeNull();
    show.value = true;
    await nextTick();
    expect(api.value?.nativeElement).toBe(w.get('ol').element);
    expect(api.value?.nativeElement).not.toBe(first);
  });

  it('uses a distinct pending key even beside numeric and reserved-looking user keys', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const w: VueWrapper = mount(Timeline, {
      props: {
        reverse: true,
        items: [
          { key: 0, content: h('input', { 'data-owner': 'zero' }) },
          { key: 'apollo-timeline-pending', content: h('input', { 'data-owner': 'reserved' }) },
        ],
        pending: 'Pending',
      },
    });
    const zero = w.get('[data-owner="zero"]');
    const reserved = w.get('[data-owner="reserved"]');
    await zero.setValue('zero kept');
    await reserved.setValue('reserved kept');
    for (const pending of [false, '', 0, 'Again', null, true]) {
      await w.setProps({ pending });
      expect(w.get('[data-owner="zero"]').element).toBe(zero.element);
      expect(w.get('[data-owner="reserved"]').element).toBe(reserved.element);
    }
  });

  it('keeps full scalar and fragment content with current alias precedence', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const rows = shallowRef<TimelineItemType[]>([
      { key: 'a', title: 0, label: 'label', content: 0, children: 'children' },
    ]);
    const w = mount(defineComponent({ setup: () => () => h(Timeline, { items: rows.value }) }));
    expect(w.get('.apollo-timeline-item-title').text()).toBe('0');
    expect(w.get('.apollo-timeline-item-content').text()).toBe('0');
    rows.value = [{ key: 'a', content: [h('span', 'A'), ' ', h('strong', 'B')] }];
    await nextTick();
    expect(w.get('.apollo-timeline-item-content').text()).toBe('A B');
  });

  it('renders fragments, stateful components and Teleport without remounting on item updates', async () => {
    const target = document.createElement('div');
    target.id = 'timeline-contract-portal';
    document.body.append(target);
    let mounts = 0;
    const Child = defineComponent({
      setup() {
        mounts += 1;
        return () => h('input', { 'aria-label': 'Stateful note' });
      },
    });
    const updated = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Timeline,
            { items: [{ key: 'a', title: updated.value ? 'Updated' : 'Initial' }] },
            {
              itemContent: () => [
                0,
                ' ',
                h(Child),
                h(Teleport, { to: '#timeline-contract-portal' }, [
                  h('strong', updated.value ? 'Current portal' : 'Initial portal'),
                ]),
              ],
            },
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    const input = w.get('input');
    await input.setValue('kept');
    expect(w.get('.apollo-timeline-item-content').text()).toBe('0');
    expect(target.textContent).toBe('Initial portal');
    updated.value = true;
    await nextTick();
    expect(w.get('input').element).toBe(input.element);
    expect(w.get<HTMLInputElement>('input').element.value).toBe('kept');
    expect(target.textContent).toBe('Current portal');
    expect(mounts).toBe(1);
    w.unmount();
    expect(target.textContent).toBe('');
  });
});

describe('Timeline current six-token theme contracts (2026-10-28)', () => {
  for (const [name, algorithm] of Object.entries({
    default: undefined,
    dark: darkAlgorithm,
    compact: compactAlgorithm,
    both: [darkAlgorithm, compactAlgorithm],
  })) {
    it(`resolves current source defaults, all six overrides, zero and removal (${name})`, async () => {
      const current = ref<ThemeConfig>({ algorithm, token: {} });
      const w = mount(
        defineComponent({
          setup: () => () =>
            h(
              ConfigProvider,
              { theme: current.value },
              {
                default: () =>
                  h(Timeline, { id: 'theme-timeline', items: [{ key: 'a', content: 'Current' }] }),
              },
            ),
        }),
        { global: { stubs: { teleport: false } } },
      );
      await nextTick();
      const root = w.get<HTMLOListElement>('ol');
      const value = (name: string) =>
        root.element.style.getPropertyValue(`--apollo-timeline-${name}`);
      const base = getDesignToken({ algorithm });
      expect(value('tail-color')).toBe(base.colorSplit);
      expect(value('item-padding-bottom')).toBe(`${base.padding * 1.25}px`);
      expect(value('dot-size')).toBe('');
      expect(value('dot-bg')).toBe('');
      current.value = {
        algorithm,
        components: {
          Timeline: {
            tailColor: '#123456',
            tailWidth: 7,
            dotBorderWidth: 3,
            dotSize: 18,
            dotBg: '#abcdef',
            itemPaddingBottom: 31,
          },
        },
      };
      await nextTick();
      expect(root.element).toBe(w.get('ol').element);
      expect(
        [
          'tail-color',
          'tail-width',
          'dot-border-width',
          'dot-size',
          'dot-bg',
          'item-padding-bottom',
        ].map(value),
      ).toEqual(['#123456', '7px', '3px', '18px', '#abcdef', '31px']);
      current.value = {
        algorithm,
        components: {
          Timeline: { tailWidth: 0, dotBorderWidth: 0, dotSize: 0, itemPaddingBottom: 0 },
        },
      };
      await nextTick();
      expect(
        ['tail-width', 'dot-border-width', 'dot-size', 'item-padding-bottom'].map(value),
      ).toEqual(['0px', '0px', '0px', '0px']);
      expect(value('dot-bg')).toBe('');
      current.value = { algorithm, token: {} };
      await nextTick();
      expect(value('dot-size')).toBe('');
      expect(value('tail-width')).toBe(`${base.lineWidthBold}px`);
      expect(root.element).toBe(w.get('ol').element);
    });
  }

  it('SSR resolves the current theme and native styles above component defaults', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ConfigProvider,
            {
              theme: {
                algorithm: darkAlgorithm,
                components: { Timeline: { dotSize: 18, tailWidth: 7 } },
              },
              components: { timeline: { style: { '--apollo-timeline-tail-width': '8px' } } },
            },
            {
              default: () =>
                h(Timeline, {
                  style: '--apollo-timeline-tail-width:9px',
                  items: [{ content: 'SSR' }],
                }),
            },
          ),
      }),
    );
    const host = document.createElement('div');
    host.innerHTML = html;
    expect(host.querySelector('ol')?.style.getPropertyValue('--apollo-timeline-dot-size')).toBe(
      '18px',
    );
    expect(host.querySelector('ol')?.style.getPropertyValue('--apollo-timeline-tail-width')).toBe(
      '9px',
    );
  });
});
