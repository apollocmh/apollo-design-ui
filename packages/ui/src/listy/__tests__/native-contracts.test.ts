import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { MockResizeObserver } from '../../../../../vitest.setup';
import ConfigProvider from '../../config-provider/ConfigProvider';
import { Listy, toTaggedKey } from '../index';
import type { ListyRef } from '../interface';

interface Row {
  id: string | number;
  label: string;
  group: string;
}
const rows: Row[] = [
  { id: 1, label: 'number', group: 'a' },
  { id: '1', label: 'string', group: 'b' },
];
const rectangle = (top: number, height: number): DOMRect => ({
  x: 0,
  y: top,
  left: 0,
  right: 200,
  top,
  bottom: top + height,
  width: 200,
  height,
  toJSON: () => ({}),
});

describe('Listy current native contracts', () => {
  it('preserves primitive identity in item and group tags without namespace collisions', () => {
    expect(toTaggedKey(1, 'item')).not.toBe(toTaggedKey('1', 'item'));
    expect(toTaggedKey(1, 'group')).not.toBe(toTaggedKey('1', 'group'));
    expect(toTaggedKey('number:1', 'item')).not.toBe(toTaggedKey(1, 'item'));
    expect(toTaggedKey('a', 'group')).not.toBe(toTaggedKey('a', 'item'));
  });

  it('owns one real native scroll notification', async () => {
    const onScroll = vi.fn();
    const wrapper = mount(Listy<Row>, {
      props: { items: rows, rowKey: 'id', onScroll },
      slots: { default: ({ item }: { item: Row }) => item.label },
    });
    expect(wrapper.vm.$options.emits).toContain('scroll');
    expect(Object.hasOwn(wrapper.props(), 'onScroll')).toBe(false);
    const event = new Event('scroll', { bubbles: false });
    wrapper.get('.apollo-listy').element.dispatchEvent(event);
    await nextTick();
    expect(wrapper.emitted('scroll')).toEqual([[event]]);
    expect(onScroll).toHaveBeenCalledExactlyOnceWith(event);
    wrapper.unmount();
  });

  it('keeps a row and its focused editor alive across same-key replacement, reorder and regrouping', async () => {
    const items = ref<Row[]>(rows.map((item) => ({ ...item })));
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Listy<Row>,
            {
              items: items.value,
              rowKey: 'id',
              group: { key: (item: Row) => item.group },
            },
            {
              default: ({ item }: { item: Row }) =>
                h('input', { 'aria-label': item.label, value: item.label }),
            },
          ),
      }),
      { attachTo: document.body },
    );
    const original = wrapper.findAll<HTMLInputElement>('input')[0]?.element;
    original?.focus();
    items.value = [
      { ...rows[1], id: '1', label: 'string', group: 'b' },
      { ...rows[0], id: 1, label: 'updated', group: 'b' },
    ];
    await nextTick();
    expect(wrapper.get('input[aria-label="updated"]').element).toBe(original);
    expect(document.activeElement).toBe(original);
    wrapper.unmount();
  });

  it('scrolls only its own holder and targets the correct primitive key', async () => {
    const list = ref<ListyRef | null>(null);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Listy<Row>,
            { ref: list, items: rows, rowKey: 'id', height: 100 },
            { default: ({ item }: { item: Row }) => item.label },
          ),
      }),
    );
    const holder = wrapper.get<HTMLElement>('.apollo-listy').element;
    holder.getBoundingClientRect = () => rectangle(100, 100);
    Object.defineProperty(holder, 'clientHeight', { value: 100, configurable: true });
    holder.scrollTop = 10;
    const targets = wrapper.findAll<HTMLElement>('.apollo-listy-item');
    for (const target of targets) target.element.getBoundingClientRect = () => rectangle(200, 20);
    const scrollNumber = vi.fn();
    const scrollString = vi.fn();
    Object.defineProperty(targets[0]?.element, 'scrollIntoView', {
      value: scrollNumber,
      configurable: true,
    });
    Object.defineProperty(targets[1]?.element, 'scrollIntoView', {
      value: scrollString,
      configurable: true,
    });
    list.value?.scrollTo({ key: '1', align: 'top', offset: 5 });
    expect(holder.scrollTop).toBe(105);
    expect(scrollNumber).not.toHaveBeenCalled();
    expect(scrollString).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('uses the current Listy component tokens and CSSProperties on actual roots', async () => {
    const configured = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              virtual: false,
              components: configured.value
                ? { listy: { styles: { root: { color: 'red', margin: undefined } } } }
                : {},
              theme: configured.value
                ? { components: { Listy: { itemPaddingBlock: 24, itemPaddingInline: '2rem' } } }
                : {},
            },
            {
              default: () =>
                h(
                  Listy<Row>,
                  { items: rows, rowKey: 'id', style: ['padding: 2px', { marginTop: '7px' }] },
                  { default: ({ item }: { item: Row }) => item.label },
                ),
            },
          ),
      }),
    );
    const root = wrapper.get<HTMLElement>('.apollo-listy');
    expect(root.element.style.getPropertyValue('--apollo-listy-item-padding-block')).toBe('24px');
    expect(root.element.style.getPropertyValue('--apollo-listy-item-padding-inline')).toBe('2rem');
    expect(root.element.style.padding).toBe('2px');
    expect(root.element.style.marginTop).toBe('7px');
    configured.value = false;
    await nextTick();
    expect(root.element.style.getPropertyValue('--apollo-listy-item-padding-block')).toBe('12px');
    expect(root.element.style.color).toBe('');
    wrapper.unmount();
  });
  it.each([false, true])(
    'keeps row identity in the %s branch when groups and ordering change',
    async (virtual) => {
      const items = ref([
        { id: 1, label: 'first', group: 'a' },
        { id: 2, label: 'second', group: 'b' },
      ]);
      const wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(
              Listy<Row>,
              {
                items: items.value,
                rowKey: 'id',
                virtual,
                height: 300,
                group: { key: (item) => item.group },
              },
              { default: ({ item }: { item: Row }) => h('input', { 'aria-label': item.label }) },
            ),
        }),
        { attachTo: document.body },
      );
      await nextTick();
      const original = wrapper.get<HTMLInputElement>('input[aria-label="first"]').element;
      original.focus();
      original.value = 'draft';
      items.value = [
        { id: 2, label: 'second', group: 'b' },
        { id: 1, label: 'updated', group: 'b' },
      ];
      await nextTick();
      await nextTick();
      expect(wrapper.get<HTMLInputElement>('input[aria-label="updated"]').element).toBe(original);
      expect(original.value).toBe('draft');
      expect(document.activeElement).toBe(original);
      wrapper.unmount();
    },
  );

  it.each([false, true])(
    'renders zero, empty and array slot content in branch %s',
    async (virtual) => {
      const show = ref(true);
      const wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(
              Listy<number, number>,
              {
                items: [0, 1, 2],
                rowKey: (item) => item,
                group: { key: (item) => item },
                virtual,
                height: 500,
              },
              show.value
                ? {
                    default: ({ item }: { item: number }) =>
                      item === 0 ? 0 : item === 1 ? [] : [h('b', 'two'), h('i', 'more')],
                    groupHeader: ({ groupKey }: { groupKey: number }) => (groupKey === 0 ? 0 : []),
                  }
                : { default: () => null },
            ),
        }),
      );
      await nextTick();
      await nextTick();
      expect(wrapper.get('[data-key="item:number:0"]').text()).toBe('0');
      expect(wrapper.get('[data-key="item:number:1"]').text()).toBe('');
      expect(wrapper.get('[data-key="item:number:2"]').text()).toBe('twomore');
      expect(wrapper.get('[data-key="group:number:0"]').text()).toBe('0');
      expect(wrapper.get('[data-key="group:number:1"]').text()).toBe('');
      show.value = false;
      await nextTick();
      expect(wrapper.get('[data-key="group:number:0"]').text()).toBe('0');
      expect(wrapper.get('[data-key="group:number:1"]').text()).toBe('1');
      expect(wrapper.get('[data-key="item:number:2"]').text()).toBe('');
      wrapper.unmount();
    },
  );

  it('accepts actual numeric and symbol row-key fields without object index signatures', () => {
    const symbol = Symbol('id');
    interface FieldRow {
      0: number;
      [symbol]: string;
      label: string;
    }
    const items: FieldRow[] = [{ 0: 1, [symbol]: 'one', label: 'One' }];
    const numeric = mount(Listy<FieldRow>, { props: { items, rowKey: 0 } });
    const symbolic = mount(Listy<FieldRow>, { props: { items, rowKey: symbol } });
    expect(numeric.get('.apollo-listy-item').attributes('data-key')).toBe('item:number:1');
    expect(symbolic.get('.apollo-listy-item').attributes('data-key')).toBe('item:string:one');
    numeric.unmount();
    symbolic.unmount();
  });

  it('routes virtual native focus and keyboard attrs to its actual holder exactly once', async () => {
    const focus = vi.fn();
    const keydown = vi.fn((event: KeyboardEvent) => event.preventDefault());
    const wrapper = mount(Listy<Row>, {
      props: { items: rows, rowKey: 'id', virtual: true, height: 100 },
      attrs: {
        tabindex: 0,
        role: 'listbox',
        'aria-label': 'Rows',
        onFocus: focus,
        onKeydown: keydown,
      },
      attachTo: document.body,
    });
    const holder = wrapper.get<HTMLElement>('.apollo-listy-holder').element;
    holder.focus();
    expect(document.activeElement).toBe(holder);
    expect(focus).toHaveBeenCalledTimes(1);
    const event = new KeyboardEvent('keydown', {
      key: 'PageDown',
      bubbles: true,
      cancelable: true,
    });
    holder.dispatchEvent(event);
    expect(keydown).toHaveBeenCalledExactlyOnceWith(event);
    expect(event.defaultPrevented).toBe(true);
    expect(holder.getAttribute('role')).toBe('listbox');
    expect(holder.getAttribute('aria-label')).toBe('Rows');
    expect(wrapper.get('.apollo-listy').attributes('tabindex')).toBeUndefined();
    wrapper.unmount();
  });

  it('reacts to provider virtual, prefix, semantic styles, height and local withdrawal', async () => {
    const inherited = ref(false);
    const local = ref<boolean | undefined>(undefined);
    const prefix = ref('apollo');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              virtual: inherited.value,
              prefixCls: prefix.value,
              components: {
                listy: { classNames: { item: 'provided' }, styles: { item: { color: 'red' } } },
              },
            },
            {
              default: () =>
                h(
                  Listy<Row>,
                  {
                    items: rows,
                    rowKey: 'id',
                    virtual: local.value,
                    height: 100,
                    styles: { item: { color: 'blue' } },
                  },
                  { default: ({ item }: { item: Row }) => item.label },
                ),
            },
          ),
      }),
    );
    expect(wrapper.find('.apollo-listy-holder').exists()).toBe(false);
    inherited.value = true;
    await nextTick();
    expect(wrapper.get('.apollo-listy-holder').attributes('style')).toContain('max-height: 100px');
    expect(wrapper.get<HTMLElement>('.apollo-listy-item').element.style.color).toBe('blue');
    expect(wrapper.get('.apollo-listy-item').classes()).toContain('provided');
    local.value = false;
    await nextTick();
    expect(wrapper.find('.apollo-listy-holder').exists()).toBe(false);
    prefix.value = 'custom';
    local.value = undefined;
    await nextTick();
    expect(wrapper.find('.custom-listy-holder').exists()).toBe(true);
    wrapper.unmount();
  });
  it('releases only its own measured nodes, listeners and pending frame on disable and unmount', async () => {
    const frame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(73);
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame');
    const addScroll = vi.spyOn(document, 'addEventListener');
    const removeScroll = vi.spyOn(document, 'removeEventListener');
    const addWindow = vi.spyOn(window, 'addEventListener');
    const removeWindow = vi.spyOn(window, 'removeEventListener');
    const sticky = ref(true);
    const mountOne = () =>
      mount(
        defineComponent({
          setup: () => () =>
            h(
              Listy<Row>,
              {
                items: rows,
                rowKey: 'id',
                group: { key: (item) => item.group },
                sticky: sticky.value,
              },
              { default: ({ item }: { item: Row }) => item.label },
            ),
        }),
      );
    const first = mountOne();
    const second = mountOne();
    const observed = () =>
      [...MockResizeObserver.instances].flatMap((observer) => [...observer.targets]);
    expect(observed()).toHaveLength(12);
    first.unmount();
    expect(observed()).toHaveLength(6);
    sticky.value = false;
    await nextTick();
    expect(observed()).toHaveLength(0);
    sticky.value = true;
    await nextTick();
    expect(observed()).toHaveLength(6);
    const framesBeforeUnmount = frame.mock.calls.length;
    second.unmount();
    expect(observed()).toHaveLength(0);
    expect(frame.mock.calls).toHaveLength(framesBeforeUnmount);
    expect(cancel).toHaveBeenCalledWith(73);
    for (const [event, callback, options] of addScroll.mock.calls.filter(
      ([event]) => event === 'scroll',
    )) {
      expect(removeScroll).toHaveBeenCalledWith(event, callback, options);
    }
    for (const [event, callback] of addWindow.mock.calls.filter(([event]) => event === 'resize')) {
      expect(removeWindow).toHaveBeenCalledWith(event, callback);
    }
    frame.mockRestore();
    cancel.mockRestore();
    addScroll.mockRestore();
    removeScroll.mockRestore();
    addWindow.mockRestore();
    removeWindow.mockRestore();
  });
});
