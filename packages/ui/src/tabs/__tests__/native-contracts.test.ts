import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref, type StyleValue, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ConfigProvider from '../../config-provider';
import { useTouchMove } from '../hooks/use-touch-move';
import Tabs from '../index';
import type { TabsItem, TabsProps, TabsRef } from '../interface';
import OperationNode from '../OperationNode';

const itemA: TabsItem = { key: 'a', label: 'A', children: 'Pane A' };
const itemB: TabsItem = { key: 'b', label: 'B', children: 'Pane B' };
const itemC: TabsItem = { key: 'c', label: 'C', children: 'Pane C' };
const items: TabsItem[] = [itemA, itemB, itemC];

const keydown = (element: Element, key: string) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
};

async function settle() {
  for (let i = 0; i < 6; i += 1) await nextTick();
}

describe('Tabs current Vue contracts', () => {
  it('keeps the last accepted controlled value when control is removed', async () => {
    const w = mount(Tabs, { props: { items, activeKey: 'b', defaultActiveKey: 'a' } });
    await w.get('[data-node-key="c"] [role="tab"]').trigger('click');
    expect(w.emitted('change')).toEqual([['c']]);
    await w.setProps({ activeKey: undefined });
    expect(w.get('[aria-selected="true"]').text()).toBe('B');
    await w.setProps({ activeKey: 'c' });
    await w.setProps({ activeKey: undefined });
    expect(w.get('[aria-selected="true"]').text()).toBe('C');
    w.unmount();
  });

  it('retains a mounted pane and its local input when keyed items move', async () => {
    const panes: TabsItem[] = [
      { key: 'a', label: 'A', children: 'A' },
      { key: 'b', label: 'B', children: h('input', { 'aria-label': 'Pane state' }) },
    ];
    const w = mount(Tabs, { props: { items: panes, defaultActiveKey: 'b' } });
    const input = w.get('input').element;
    input.value = 'keep me';
    await w.setProps({ items: panes.toReversed() });
    expect(w.get('input').element).toBe(input);
    expect(w.get('input').element.value).toBe('keep me');
    w.unmount();
  });

  it('lets an item override the component destroyOnHidden default in either direction', async () => {
    const keep = mount(Tabs, {
      props: { destroyOnHidden: true, items: [{ ...itemA, destroyOnHidden: false }, itemB] },
    });
    await keep.get('[data-node-key="b"] [role="tab"]').trigger('click');
    await settle();
    expect(keep.findAll('[role="tabpanel"]').map((panel) => panel.text())).toContain('Pane A');
    keep.unmount();
    const remove = mount(Tabs, {
      props: { destroyOnHidden: false, items: [{ ...itemA, destroyOnHidden: true }, itemB] },
    });
    await remove.get('[data-node-key="b"] [role="tab"]').trigger('click');
    await vi.waitFor(() => {
      expect(remove.findAll('[role="tabpanel"]').map((panel) => panel.text())).not.toContain(
        'Pane A',
      );
    });
    remove.unmount();
  });

  it('preserves numeric zero in labels, extra content and pane content', () => {
    const w = mount(Tabs, {
      props: { items: [{ key: 'zero', label: 0, children: [0] }], tabBarExtraContent: 0 },
    });
    expect(w.get('[role="tab"]').text()).toBe('0');
    expect(w.get('.apollo-tabs-extra-content').text()).toBe('0');
    expect(w.get('[role="tabpanel"]').attributes('tabindex')).toBe('0');
    w.unmount();
  });

  it('exposes the actual root and normalizes current native styles and semantic props', async () => {
    const handle = ref<TabsRef | null>(null);
    const style = shallowRef<StyleValue>([{ color: 'red' }, 'padding-top: 7px']);
    const type = ref<TabsProps['type']>('card');
    const click = vi.fn();
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Tabs, {
            ref: handle,
            items,
            type: type.value,
            style: style.value,
            class: ['consumer', { current: true }],
            'data-owner': 'tabs',
            onClick: click,
            classNames: ({ props }) => ({ root: `semantic-${props.type}` }),
          }),
      }),
    );
    expect(handle.value?.nativeElement).toBe(w.element);
    expect(w.classes()).toContain('semantic-card');
    expect(w.get('.apollo-tabs').element.getAttribute('style')).toContain('padding-top: 7px');
    expect(w.attributes('data-owner')).toBe('tabs');
    await w.get('[data-node-key="b"] [role="tab"]').trigger('click');
    // Tab clicks belong to the component; a native root click still has its own one-time landing.
    await w.trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
    style.value = 'padding-top: 11px; color: blue';
    type.value = 'line';
    await settle();
    expect(w.classes()).toContain('semantic-line');
    expect(w.get('.apollo-tabs').element.getAttribute('style')).toContain('padding-top: 11px');
    w.unmount();
    expect(handle.value).toBeNull();
  });

  it('uses key-based navigation, prevents handled scrolling and respects removability', async () => {
    const edit = vi.fn();
    const w = mount(Tabs, {
      attachTo: document.body,
      props: {
        type: 'editable-card',
        items: [{ key: 'a', label: 'A', closeIcon: false }, itemB, itemC],
        onEdit: edit,
      },
    });
    const first = w.get<HTMLElement>('[data-node-key="a"] [role="tab"]');
    first.element.focus();
    await settle();
    keydown(first.element, 'Delete');
    expect(edit).not.toHaveBeenCalled();
    const arrow = keydown(first.element, 'ArrowRight');
    await settle();
    expect(arrow.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(w.get('[data-node-key="b"] [role="tab"]').element);
    const enter = keydown(w.get('[data-node-key="b"] [role="tab"]').element, 'Enter');
    await settle();
    expect(enter.defaultPrevented).toBe(true);
    expect(w.emitted('change')).toEqual([['b']]);
    w.unmount();
  });

  it('keeps an enabled Tab entry when the controlled active tab is disabled', async () => {
    const w = mount(Tabs, {
      props: { items: [{ key: 'a', label: 'Disabled', disabled: true }, itemB], activeKey: 'a' },
    });
    expect(w.get('[data-node-key="b"] [role="tab"]').attributes('tabindex')).toBe('0');
    keydown(w.get('[data-node-key="a"] [role="tab"]').element, 'Enter');
    await settle();
    expect(w.emitted('tabClick')).toBeUndefined();
    w.unmount();
  });

  it('keeps add, remove and extra controls outside the tablist ownership', () => {
    const w = mount(Tabs, {
      props: { items, type: 'editable-card', tabBarExtraContent: h('button', 'Extra') },
    });
    const tablist = w.get('[role="tablist"]');
    expect(tablist.find('.apollo-tabs-nav-add').exists()).toBe(false);
    expect(tablist.find('.apollo-tabs-nav-more').exists()).toBe(false);
    expect(tablist.find('.apollo-tabs-extra-content').exists()).toBe(false);
    expect(tablist.attributes('aria-owns')?.split(' ')).toEqual(
      w.findAll('[role="tab"]').map((tab) => tab.attributes('id')),
    );
    w.unmount();
  });

  it('lands tabBarStyle on the navigation without copying its width to operations', () => {
    const w = mount(Tabs, { props: { items, tabBarStyle: { width: '240px' } } });
    expect(w.get<HTMLElement>('.apollo-tabs-nav').element.style.width).toBe('240px');
    expect(w.get<HTMLElement>('.apollo-tabs-nav-operations').element.style.width).toBe('');
    w.unmount();
  });

  it('handles overflow keys without legacy keyCode, selects once, closes and restores focus', async () => {
    const click = vi.fn();
    const w = mount(OperationNode, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        prefixCls: 'apollo-tabs',
        id: 'overflow',
        tabs: [itemA, { key: 'disabled', label: 'Disabled', disabled: true }, itemB],
        onTabClick: click,
      },
    });
    const button = w.get<HTMLButtonElement>('.apollo-tabs-nav-more');
    button.element.focus();
    keydown(button.element, 'ArrowDown');
    await settle();
    expect(button.attributes('aria-expanded')).toBe('true');
    const listbox = document.getElementById('overflow-more-popup');
    expect(listbox).not.toBeNull();
    if (!listbox) throw new Error('The opened overflow listbox is missing');
    expect(listbox.getAttribute('aria-activedescendant')).toBe('overflow-more-popup-a');
    keydown(listbox, 'ArrowDown');
    await settle();
    expect(listbox.getAttribute('aria-activedescendant')).toBe('overflow-more-popup-b');
    const enter = keydown(listbox, 'Enter');
    await settle();
    expect(enter.defaultPrevented).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0]?.[0]).toBe('b');
    expect(button.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button.element);
    w.unmount();
  });

  it('declares unique deterministic tab/panel associations during SSR', async () => {
    const app = () =>
      createSSRApp({ render: () => h('main', [h(Tabs, { items }), h(Tabs, { items })]) });
    const html = await renderToString(app());
    const repeated = await renderToString(app());
    expect(repeated).toBe(html);
    const document = new DOMParser().parseFromString(html, 'text/html');
    const ids = Array.from(document.querySelectorAll('[role="tab"]'), (node) => node.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    for (const panel of document.querySelectorAll('[role="tabpanel"]')) {
      expect(document.getElementById(panel.getAttribute('aria-labelledby') ?? '')).not.toBeNull();
    }
  });

  it('encodes data-key ID segments without changing event keys', async () => {
    const key = 'a /"\t%';
    const w = mount(Tabs, { props: { items: [{ key, label: 'Special', children: 'Panel' }] } });
    const tab = w.get('[role="tab"]');
    const panel = w.get('[role="tabpanel"]');
    expect(tab.attributes('id')).not.toMatch(/\s/);
    expect(w.get('[role="tablist"]').attributes('aria-owns')).toBe(tab.attributes('id'));
    expect(tab.attributes('aria-controls')).toBe(panel.attributes('id'));
    expect(panel.attributes('aria-labelledby')).toBe(tab.attributes('id'));
    await tab.trigger('click');
    expect(w.emitted('tabClick')?.[0]?.[0]).toBe(key);
    w.unmount();
  });

  it('reads current nested component theme values and removes withdrawn overrides', async () => {
    const token = ref({ colorPrimary: '#551188', fontSize: 17 });
    const override = ref<Record<string, string | number>>({
      inkBarColor: '#123456',
      titleFontSize: 19,
      cardHeight: 54,
      zIndexPopup: 1800,
    });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              theme: { token: token.value, components: { Tabs: override.value } },
            },
            { default: () => h(Tabs, { items }) },
          ),
      }),
    );
    const style = w.get<HTMLElement>('.apollo-tabs').element.style;
    expect(style.getPropertyValue('--apollo-tabs-ink-bar-color')).toBe('#123456');
    expect(style.getPropertyValue('--apollo-tabs-title-font-size')).toBe('19px');
    expect(style.getPropertyValue('--apollo-tabs-z-index-popup')).toBe('1800');
    expect(style.getPropertyValue('--apollo-tabs-card-height')).toBe('54px');
    // The current alias generator rounds fontSize 17 to fontHeight 25:
    // cardPadding = (54 - 25) / 2 - lineWidth 1.
    expect(style.getPropertyValue('--apollo-tabs-card-padding')).toBe('13.5px 16px');
    override.value = {};
    token.value = { colorPrimary: '#116633', fontSize: 15 };
    await settle();
    expect(style.getPropertyValue('--apollo-tabs-ink-bar-color')).toBe('#116633');
    expect(style.getPropertyValue('--apollo-tabs-title-font-size')).toBe('15px');
    override.value = { zIndexPopup: -1, horizontalItemGutter: -2 };
    await settle();
    expect(style.getPropertyValue('--apollo-tabs-z-index-popup')).toBe('-1');
    expect(style.getPropertyValue('--apollo-tabs-horizontal-item-gutter')).toBe('-2px');
    w.unmount();
  });

  it('starts inertia from the first timed movement and clears it on cancel and unmount', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    const target = ref<HTMLElement | null>(null);
    const offset = vi.fn(() => true);
    const w = mount(
      defineComponent({
        setup() {
          useTouchMove(target, offset);
          return () => h('div', { ref: target });
        },
      }),
    );
    const touch = (type: string, x: number) => {
      const event = new Event(type);
      Object.defineProperty(event, 'touches', { value: [{ screenX: x, screenY: 0 }] });
      w.element.dispatchEvent(event);
    };
    try {
      await nextTick();
      touch('touchstart', 0);
      vi.advanceTimersByTime(10);
      touch('touchmove', 30);
      touch('touchend', 30);
      vi.advanceTimersByTime(20);
      expect(offset).toHaveBeenCalledTimes(2);
      touch('touchcancel', 30);
      expect(vi.getTimerCount()).toBe(0);
      touch('touchstart', 0);
      vi.advanceTimersByTime(10);
      touch('touchmove', 30);
      touch('touchend', 30);
      expect(vi.getTimerCount()).toBe(1);
      w.unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      w.unmount();
      vi.useRealTimers();
    }
  });
});
