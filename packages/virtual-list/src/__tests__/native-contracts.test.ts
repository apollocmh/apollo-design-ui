import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  createCommentVNode,
  createStaticVNode,
  defineComponent,
  effectScope,
  Fragment,
  h,
  nextTick,
  ref,
  type VNode,
} from 'vue';
import { MockResizeObserver } from '../../../../vitest.setup';
import { CacheMap } from '../cache';
import { Filler } from '../filler';
import type { ExtraRenderInfo, GetSize } from '../types';
import { useHeights } from '../use-heights';
import { VirtualList, type VirtualListExposed } from '../virtual-list';
import NativeStaticVirtualList from './fixtures/NativeStaticVirtualList.vue';

interface Row {
  id: string | number;
  text: string;
}
const data: Row[] = Array.from({ length: 100 }, (_, index) => ({
  id: `row-${index}`,
  text: `Row ${index}`,
}));
async function settle() {
  for (let index = 0; index < 8; index++) await nextTick();
}
function measurable(vnode: VNode) {
  if (!(vnode.el instanceof HTMLElement)) throw new Error('Expected a real native row');
  Object.defineProperties(vnode.el, {
    offsetParent: { value: document.body, configurable: true },
    offsetHeight: { value: 20, configurable: true },
  });
}
function mountList() {
  const api = ref<VirtualListExposed | null>(null);
  const items = ref([...data]);
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          VirtualList<Row>,
          {
            ref: api,
            data: items.value,
            itemKey: 'id',
            height: 100,
            itemHeight: 20,
          },
          {
            default: ({ item }: { item: Row }) =>
              h('div', { onVnodeMounted: measurable }, item.text),
          },
        ),
    }),
    { attachTo: document.body },
  );
  const holder = wrapper.get<HTMLElement>('.apollo-virtual-list-holder').element;
  Object.defineProperty(holder, 'clientHeight', { value: 100, configurable: true });
  return { api, items, wrapper, holder };
}

describe('VirtualList native contract deltas', () => {
  it('separates numeric and string height-cache keys, including prototype-looking strings', () => {
    const cache = new CacheMap<number>();
    cache.set(1, 20);
    cache.set('1', 80);
    cache.set('__proto__', 30);
    expect(cache.get(1)).toBe(20);
    expect(cache.get('1')).toBe(80);
    expect(cache.get('__proto__')).toBe(30);
  });

  it('owns native scroll, virtualScroll and visibleChange notifications', async () => {
    const scroll = vi.fn();
    const virtualScroll = vi.fn();
    const visibleChange = vi.fn();
    const wrapper = mount(VirtualList<Row>, {
      props: {
        data,
        itemKey: 'id',
        height: 100,
        itemHeight: 20,
        onScroll: scroll,
        onVirtualScroll: virtualScroll,
        onVisibleChange: visibleChange,
      },
      slots: { default: ({ item }: { item: Row }) => h('div', item.text) },
    });
    expect(wrapper.vm.$options.emits).toEqual(
      expect.arrayContaining(['scroll', 'virtualScroll', 'visibleChange']),
    );
    expect(wrapper.emitted('visibleChange')?.[0]?.[1]).toBe(wrapper.props('data'));
    const holder = wrapper.get<HTMLElement>('.apollo-virtual-list-holder').element;
    holder.scrollTop = 60;
    const event = new Event('scroll');
    holder.dispatchEvent(event);
    await settle();
    expect(scroll).toHaveBeenCalledExactlyOnceWith(event);
    expect(wrapper.emitted('scroll')).toEqual([[event]]);
    expect(virtualScroll).toHaveBeenCalledExactlyOnceWith({ x: 0, y: 60 });
    wrapper.unmount();
  });

  it('owns Filler innerResize while preserving the actual size notification', () => {
    const wrapper = mount(Filler);
    expect(wrapper.vm.$options.emits).toContain('innerResize');
    wrapper.unmount();
  });

  it('preserves the consumer native ref while measuring the same row element', async () => {
    const row = ref<HTMLElement | null>(null);
    const wrapper = mount(VirtualList<Row>, {
      props: {
        data: [data[0]].filter((item) => item !== undefined),
        itemKey: 'id',
        height: 100,
        itemHeight: 20,
      },
      slots: {
        default: () =>
          h('div', { ref: row, 'data-row': 'actual', onVnodeMounted: measurable }, 'Actual'),
      },
    });
    await settle();
    expect(row.value).toBe(wrapper.get('[data-row="actual"]').element);
    wrapper.unmount();
    expect(row.value).toBeNull();
  });

  it('a newer direct scroll cancels an older pending item scroll', async () => {
    const rig = mountList();
    await settle();
    rig.api.value?.scrollTo({ key: 'row-25', align: 'top' });
    rig.api.value?.scrollTo(40);
    await settle();
    expect(rig.holder.scrollTop).toBe(40);
    expect(rig.api.value?.getScrollInfo().y).toBe(40);
    rig.wrapper.unmount();
  });

  it('tracks the requested key through data reordering during item-scroll iteration', async () => {
    const rig = mountList();
    await settle();
    rig.api.value?.scrollTo({ key: 'row-25', align: 'top' });
    rig.items.value = [...rig.items.value].reverse();
    await settle();
    expect(rig.holder.scrollTop).toBe(74 * 20);
    expect(rig.wrapper.text()).toContain('Row 25');
    rig.wrapper.unmount();
  });

  it('clamps accepted state when data becomes shorter', async () => {
    const rig = mountList();
    await settle();
    rig.api.value?.scrollTo(1800);
    rig.items.value = rig.items.value.slice(0, 3);
    await settle();
    expect(rig.holder.scrollTop).toBe(0);
    expect(rig.api.value?.getScrollInfo().y).toBe(0);
    expect(rig.wrapper.text()).toContain('Row 0');
    rig.wrapper.unmount();
  });

  it('never schedules or measures new nodes through a disposed height service', async () => {
    const scope = effectScope();
    const api = scope.run(() => useHeights<string>((item) => item));
    if (!api) throw new Error('Expected an active Vue effect scope');
    scope.stop();
    const element = document.createElement('div');
    Object.defineProperties(element, {
      offsetParent: { value: document.body },
      offsetHeight: { value: 20 },
    });
    api.setInstanceRef('late', element);
    api.collectHeight(true);
    api.collectHeight();
    await settle();
    expect(api.heights.get('late')).toBeUndefined();
    expect(api.updatedMark.value).toBe(0);
  });
  it('routes changing native accessible and keyboard attrs to exactly one actual holder', async () => {
    const id = ref('first-holder');
    const focus = vi.fn();
    const keydown = vi.fn((event: KeyboardEvent) => event.preventDefault());
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            VirtualList<Row>,
            {
              data: data.slice(0, 2),
              itemKey: 'id',
              height: 100,
              itemHeight: 20,
              id: id.value,
              role: 'listbox',
              tabindex: 0,
              'aria-label': 'Rows',
              'data-root': 'root',
              class: 'custom',
              style: ['color: red', { marginTop: '3px' }],
              onFocus: focus,
              onKeydown: keydown,
            },
            { default: ({ item }: { item: Row }) => h('div', item.text) },
          ),
      }),
      { attachTo: document.body },
    );
    const holder = wrapper.get<HTMLElement>('.apollo-virtual-list-holder').element;
    holder.focus();
    expect(focus).toHaveBeenCalledTimes(1);
    const event = new KeyboardEvent('keydown', {
      key: 'PageDown',
      bubbles: true,
      cancelable: true,
      isComposing: true,
    });
    holder.dispatchEvent(event);
    expect(keydown).toHaveBeenCalledExactlyOnceWith(event);
    expect(event.defaultPrevented).toBe(true);
    const root = wrapper.get<HTMLElement>('.apollo-virtual-list');
    expect(root.attributes('id')).toBeUndefined();
    expect(root.attributes('role')).toBeUndefined();
    expect(root.attributes('aria-label')).toBeUndefined();
    expect(root.attributes('tabindex')).toBeUndefined();
    expect(root.attributes('data-root')).toBe('root');
    expect(root.classes()).toContain('custom');
    expect(root.element.style.color).toBe('red');
    expect(root.element.style.marginTop).toBe('3px');
    expect(holder.id).toBe('first-holder');
    expect(holder.getAttribute('role')).toBe('listbox');
    expect(holder.getAttribute('aria-label')).toBe('Rows');
    id.value = 'second-holder';
    await settle();
    expect(wrapper.get('.apollo-virtual-list-holder').element).toBe(holder);
    expect(document.getElementById('first-holder')).toBeNull();
    expect(document.getElementById('second-holder')).toBe(holder);
    wrapper.unmount();
  });

  it('unwraps a single element inside native fragments and rejects multiple actual roots', async () => {
    const multiple = ref(false);
    const warning = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            VirtualList<number>,
            {
              data: [1],
              itemKey: (item) => item,
            },
            {
              default: () =>
                multiple.value
                  ? [h('div', { 'data-first': '' }), h('div', { 'data-second': '' })]
                  : [
                      h(Fragment, null, [
                        createCommentVNode('condition'),
                        h('div', { 'data-only': '' }, 'One'),
                      ]),
                    ],
            },
          ),
      }),
    );
    expect(wrapper.get('[data-only]').text()).toBe('One');
    multiple.value = true;
    await settle();
    expect(wrapper.find('[data-first]').exists()).toBe(false);
    expect(wrapper.find('[data-second]').exists()).toBe(false);
    expect(warning.mock.calls.flat().join(' ')).toContain('exactly one element');
    wrapper.unmount();
    warning.mockRestore();
  });

  it('reports typed current data after an in-place replacement without replaying unchanged scroll', async () => {
    const items = ref([...data]);
    let getSize: GetSize = () => ({ top: 0, bottom: 0 });
    const visible = vi.fn();
    const position = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            VirtualList<Row>,
            {
              data: items.value,
              itemKey: 'id',
              height: 100,
              itemHeight: 20,
              onVisibleChange: visible,
              onVirtualScroll: position,
            },
            {
              default: ({ item }: { item: Row }) => h('div', item.text),
              extra: (info: ExtraRenderInfo) => {
                getSize = info.getSize;
                return null;
              },
            },
          ),
      }),
    );
    expect(getSize('row-0')).toEqual({ top: 0, bottom: 20 });
    visible.mockClear();
    items.value.splice(0, 1, { id: 'replacement', text: 'Replacement' });
    await settle();
    expect(visible).toHaveBeenCalledTimes(1);
    expect(visible.mock.calls[0]?.[0]?.[0]?.id).toBe('replacement');
    expect(visible.mock.calls[0]?.[1]).toBe(items.value);
    expect(position).not.toHaveBeenCalled();
    expect(getSize('replacement')).toEqual({ top: 0, bottom: 20 });
    wrapper.unmount();
  });

  it('refreshes an item component when its own real root changes, and releases every observer', async () => {
    const section = ref(false);
    let size = 0;
    const Item = defineComponent({
      setup: () => () =>
        h(
          section.value ? 'section' : 'div',
          {
            'data-native-row': '',
            onVnodeMounted: (node: VNode) => {
              if (!(node.el instanceof HTMLElement)) throw new Error('Expected the row root');
              Object.defineProperties(node.el, {
                offsetParent: { value: document.body, configurable: true },
                offsetHeight: { value: section.value ? 60 : 20, configurable: true },
              });
            },
          },
          'Row',
        ),
    });
    const wrapper = mount(VirtualList<string>, {
      props: { data: ['key'], itemKey: (item) => item, height: 100, itemHeight: 20 },
      slots: {
        default: () => h(Item),
        extra: (info: ExtraRenderInfo) => {
          size = info.getSize('key').bottom;
          return null;
        },
      },
      attachTo: document.body,
    });
    await settle();
    expect(size).toBe(20);
    const previous = wrapper.get('[data-native-row]').element;
    section.value = true;
    await settle();
    const current = wrapper.get('[data-native-row]').element;
    expect(current.tagName).toBe('SECTION');
    expect(current).not.toBe(previous);
    expect(size).toBe(60);
    const targets = () =>
      [...MockResizeObserver.instances].flatMap((observer) => [...observer.targets]);
    expect(targets()).toContain(current);
    expect(targets()).not.toContain(previous);
    wrapper.unmount();
    expect(targets()).toHaveLength(0);
  });

  it('cancels pending item work and retains live null refs after unmount', async () => {
    const rig = mountList();
    await settle();
    const exposed = rig.api.value;
    if (!exposed) throw new Error('Expected a real exposed instance');
    rig.api.value?.scrollTo({ key: 'missing', align: 'top' });
    const warning = vi.spyOn(console, 'error');
    rig.wrapper.unmount();
    await settle();
    expect(exposed.nativeElement).toBeNull();
    expect(exposed.containerElement).toBeNull();
    expect(() => exposed.scrollTo({ key: 'later' })).not.toThrow();
    expect(warning).not.toHaveBeenCalled();
    warning.mockRestore();
  });
  it('measures legitimate compiled SFC and static single roots without private VNode fields', async () => {
    const error = vi.spyOn(console, 'error');
    const compiled = mount(NativeStaticVirtualList, { attachTo: document.body });
    expect(compiled.get('[data-static-single]').findAll('span')).toHaveLength(20);
    await settle();
    expect(
      [...MockResizeObserver.instances].some((observer) =>
        observer.targets.has(compiled.get('[data-static-single]').element),
      ),
    ).toBe(true);
    compiled.unmount();
    const staticList = mount(VirtualList<number>, {
      props: { data: [1], itemKey: (item) => item },
      slots: { default: () => createStaticVNode('<div data-static-root>Single</div>', 1) },
      attachTo: document.body,
    });
    await settle();
    const root = staticList.get('[data-static-root]').element;
    expect([...MockResizeObserver.instances].some((observer) => observer.targets.has(root))).toBe(
      true,
    );
    expect(error).not.toHaveBeenCalled();
    staticList.unmount();
    error.mockRestore();
  });

  it('rejects measuring a static block that spans multiple actual DOM roots', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(VirtualList<number>, {
      props: { data: [1], itemKey: (item) => item },
      slots: {
        default: () =>
          createStaticVNode('<div data-static-invalid>First</div><div>Second</div>', 2),
      },
      attachTo: document.body,
    });
    await settle();
    const first = wrapper.get('[data-static-invalid]').element;
    expect(
      [...MockResizeObserver.instances].every((observer) => !observer.targets.has(first)),
    ).toBe(true);
    expect(error.mock.calls.flat().join(' ')).toContain('exactly one HTMLElement root');
    wrapper.unmount();
    error.mockRestore();
  });
});
