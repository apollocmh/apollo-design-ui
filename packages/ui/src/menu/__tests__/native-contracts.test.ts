import { ZINDEX_KEY } from '@apollo-design/portal';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  computed,
  createSSRApp,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  provide,
  ref,
  shallowRef,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Tooltip from '../../tooltip/Tooltip';
import type { ItemType, MenuRef } from '../interface';
import Menu from '../Menu';
import PopupTrigger from '../PopupTrigger';

const wrappers: VueWrapper[] = [];
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };
const settle = async () => {
  await nextTick();
  await nextTick();
};
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount();
  vi.useRealTimers();
});
const items: ItemType[] = [
  { key: 'off', label: 'Disabled', disabled: true },
  { key: "a'[]", label: 'One' },
  { key: 'sub', label: 'Submenu', children: [{ key: 'two', label: 'Two' }] },
];

describe('Menu current native contracts', () => {
  it('owns business notifications including listener arrays and once, without single-select deselection', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const once = vi.fn();
    const deselect = vi.fn();
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Menu,
            mergeProps(
              { items, onClick: first },
              { onClick: second, onClickOnce: once, onDeselect: deselect },
            ),
          ),
      }),
      options,
    );
    wrappers.push(w);
    const item = w.get<HTMLElement>('[data-menu-id$="-a\'[]"]');
    await item.trigger('click');
    await item.trigger('click');
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(deselect).not.toHaveBeenCalled();
    expect(w.getComponent(Menu).emitted('click')).toHaveLength(2);
    expect(w.getComponent(Menu).emitted('select')).toHaveLength(2);
  });

  it.each(['vertical', 'horizontal'] as const)(
    '%s preserves full native attrs/styles and real refs',
    async (mode) => {
      const instance = shallowRef<MenuRef | null>(null);
      const key = vi.fn();
      const w = mount(
        defineComponent({
          setup: () => () =>
            h(Menu, {
              ref: instance,
              items: mode === 'horizontal' ? items.slice(1) : items,
              mode,
              'data-owned-menu': mode,
              title: 'Native menu',
              tabindex: -1,
              class: ['first', { second: true }],
              style: ['width: 312px', { '--owned': 'yes' }],
              onKeydown: key,
            }),
        }),
        options,
      );
      wrappers.push(w);
      await settle();
      const list = w.get<HTMLUListElement>('ul[data-menu-list]');
      expect(list.attributes('data-owned-menu')).toBe(mode);
      expect(list.attributes('title')).toBe('Native menu');
      expect(list.attributes('tabindex')).toBe('-1');
      expect(list.classes()).toEqual(expect.arrayContaining(['first', 'second']));
      expect(list.element.style.width).toBe('312px');
      expect(list.element.style.getPropertyValue('--owned')).toBe('yes');
      expect(instance.value?.list).toBe(list.element);
      expect(instance.value?.findItem({ key: "a'[]" })?.textContent).toContain('One');
      instance.value?.focus();
      expect(document.activeElement?.textContent).toContain('One');
      await list.trigger('keydown', { key: 'x' });
      expect(key).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps rejected controlled proposals out of withdrawn local models', async () => {
    const w = mount(Menu, {
      ...options,
      props: { items, selectedKeys: ["a'[]"], openKeys: ['sub'], mode: 'inline' },
    });
    wrappers.push(w);
    await w.get('[data-menu-id$="-two"]').trigger('click');
    await w.get('.apollo-menu-submenu-title').trigger('click');
    await w.setProps({ selectedKeys: undefined, openKeys: undefined });
    expect(w.get<HTMLElement>('[data-menu-id$="-a\'[]"]').classes()).toContain(
      'apollo-menu-item-selected',
    );
    expect(w.get('.apollo-menu-submenu').classes()).toContain('apollo-menu-submenu-open');
  });

  it('consumes current Provider class/style/semantics and disabled, including withdrawal', async () => {
    const changed = ref(false);
    const click = vi.fn();
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              componentDisabled: !changed.value,
              components: changed.value
                ? {}
                : {
                    menu: {
                      className: 'provided',
                      style: { letterSpacing: '2px' },
                      classNames: { item: 'provided-item' },
                      styles: { item: { color: 'rgb(1, 2, 3)' } },
                    },
                  },
            },
            () => h(Menu, { items, onClick: click }),
          ),
      }),
      options,
    );
    wrappers.push(w);
    const item = () => w.get<HTMLElement>('[data-menu-id$="-a\'[]"]');
    expect(w.get('ul').classes()).toContain('provided');
    expect(item().classes()).toContain('provided-item');
    expect(item().element.style.color).toBe('rgb(1, 2, 3)');
    await item().trigger('click');
    expect(click).not.toHaveBeenCalled();
    changed.value = true;
    await settle();
    expect(item().classes()).not.toContain('provided-item');
    await item().trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('projects current Menu token into root and real teleported popup, then removes it', async () => {
    const changed = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              theme: changed.value
                ? {}
                : {
                    components: {
                      Menu: { dropdownWidth: 222, zIndexPopup: 2800, itemBorderRadius: 12 },
                    },
                  },
            },
            () => h(Menu, { items, openKeys: ['sub'] }),
          ),
      }),
      options,
    );
    wrappers.push(w);
    await settle();
    const root = w.get<HTMLUListElement>('ul[data-menu-list]');
    const popup = document.querySelector<HTMLElement>('.apollo-menu-submenu-popup');
    expect(root.element.style.getPropertyValue('--apollo-menu-item-border-radius')).toBe('12px');
    expect(popup?.style.getPropertyValue('--apollo-menu-dropdown-width')).toBe('222px');
    expect(popup?.querySelector('ul')?.style.getPropertyValue('--apollo-menu-dropdown-width')).toBe(
      '222px',
    );
    expect(popup?.style.zIndex).toBe('2800');
    changed.value = true;
    await settle();
    expect(root.element.style.getPropertyValue('--apollo-menu-item-border-radius')).toBe('8px');
    expect(popup?.style.getPropertyValue('--apollo-menu-dropdown-width')).toBe('160px');
  });

  it('forwards data notifications and honors current scoped expandIcon, including an intentionally empty slot', async () => {
    const title = vi.fn();
    const hover = vi.fn();
    const changed = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Menu,
            {
              items: [
                {
                  key: 'sub',
                  label: 'Submenu',
                  children: [{ key: 'child', label: 'Child' }],
                  onTitleClick: title,
                  onTitleMouseEnter: hover,
                },
              ],
              mode: 'inline',
            },
            {
              expandIcon: ({ isOpen }: { isOpen?: boolean }) =>
                changed.value ? [] : [h('b', isOpen ? 'Open' : 'Closed'), h('i', 'Tail')],
            },
          ),
      }),
      options,
    );
    wrappers.push(w);
    const head = w.get('.apollo-menu-submenu-title');
    expect(head.text()).toContain('ClosedTail');
    await head.trigger('mouseenter');
    expect(hover).toHaveBeenCalledTimes(1);
    await head.trigger('click');
    expect(title).toHaveBeenCalledTimes(1);
    expect(head.text()).toContain('OpenTail');
    changed.value = true;
    await settle();
    expect(head.find('.apollo-menu-submenu-arrow').exists()).toBe(false);
    expect(head.text()).toBe('Submenu');
  });
});

it('keeps item and submenu data render functions live and applies nested semantics/theme', async () => {
  const changed = ref(false);
  const dataClick = vi.fn();
  const select = vi.fn();
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Menu,
          {
            mode: 'inline',
            multiple: true,
            onSelect: select,
            defaultOpenKeys: ['s'],
            styles: {
              subMenu: { itemTitle: { letterSpacing: '3px' }, list: { paddingInline: '7px' } },
            },
            items: [
              {
                key: 's',
                label: 'Scope',
                theme: 'dark',
                onClick: dataClick,
                expandIcon: ({ isOpen }) => h('b', isOpen ? 'data-open' : 'data-closed'),
                children: [
                  {
                    key: 'c',
                    label: changed.value ? 'New' : 'Current',
                    icon: ({ isSelected }) => [
                      h('b', isSelected ? 'Selected' : 'Ready'),
                      h('i', 'Icon'),
                    ],
                  },
                ],
              },
            ],
          },
          { expandIcon: () => h('b', 'top-level') },
        ),
    }),
    options,
  );
  wrappers.push(w);
  expect(w.get('.apollo-menu-submenu-title').text()).toContain('data-open');
  expect(w.get<HTMLElement>('.apollo-menu-submenu-title').element.style.letterSpacing).toBe('3px');
  expect(w.get<HTMLUListElement>('.apollo-menu-sub').element.style.paddingInline).toBe('7px');
  await w.get('[data-menu-id$="-c"]').trigger('click');
  expect(dataClick).toHaveBeenCalledTimes(1);
  expect(select).toHaveBeenCalledTimes(1);
  expect(w.get('[data-menu-id$="-c"] .apollo-menu-item-icon').text()).toBe('SelectedIcon');
  changed.value = true;
  await settle();
  expect(w.get('[data-menu-id$="-c"]').text()).toContain('New');
});

it('clears a pending submenu open when disabled and on unmount', async () => {
  vi.useFakeTimers();
  const open = vi.fn();
  const w = mount(Menu, { ...options, props: { items, subMenuOpenDelay: 1, onOpenChange: open } });
  wrappers.push(w);
  await w.get('.apollo-menu-submenu-title').trigger('mouseenter');
  await w.setProps({ disabled: true });
  await vi.advanceTimersByTimeAsync(1100);
  expect(open).not.toHaveBeenCalled();
  await w.setProps({ disabled: false });
  await w.get('.apollo-menu-submenu-title').trigger('mouseenter');
  w.unmount();
  await vi.advanceTimersByTimeAsync(1100);
  expect(open).not.toHaveBeenCalled();
});

it('keeps native keyboard arrays/once and cancellation on the real root', async () => {
  const first = vi.fn((event: KeyboardEvent) => event.preventDefault());
  const second = vi.fn();
  const once = vi.fn();
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Menu,
          mergeProps({ items, onKeydown: first }, { onKeydown: second, onKeydownOnce: once }),
        ),
    }),
    options,
  );
  wrappers.push(w);
  const target = w.get<HTMLElement>('[data-menu-id$="-a\'[]"]');
  target.element.focus();
  await target.trigger('keydown', { key: 'ArrowDown' });
  await target.trigger('keydown', { key: 'ArrowDown' });
  expect(first).toHaveBeenCalledTimes(2);
  expect(second).toHaveBeenCalledTimes(2);
  expect(once).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(target.element);
});

it('keeps controlled activeKey authoritative and retains the accepted key on withdrawal', async () => {
  const w = mount(Menu, { ...options, props: { items, activeKey: "a'[]" } });
  wrappers.push(w);
  await w.get('.apollo-menu-submenu-title').trigger('mouseenter');
  expect(w.get<HTMLElement>('[data-menu-id$="-a\'[]"]').classes()).toContain(
    'apollo-menu-item-active',
  );
  await w.setProps({ activeKey: 'sub' });
  await w.setProps({ activeKey: undefined });
  expect(w.get('.apollo-menu-submenu').classes()).toContain('apollo-menu-submenu-active');
});

it('keeps explicit zero and nonnumeric popup styles without replacing expressions', async () => {
  const layer = ref<number | string>(0);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(Menu, {
          openKeys: ['s'],
          items: [
            {
              key: 's',
              label: 'Layer',
              popupClassName: 'owned-layer',
              popupStyle: { zIndex: layer.value },
              children: [
                {
                  key: 'tooltip',
                  label: h(
                    Tooltip,
                    { open: true, title: 'Child', classNames: { root: 'layer-child' } },
                    () => h('button', 'Target'),
                  ),
                },
              ],
            },
          ],
        }),
    }),
    options,
  );
  wrappers.push(w);
  await settle();
  expect(document.querySelector<HTMLElement>('.owned-layer')?.style.zIndex).toBe('0');
  expect(document.querySelector<HTMLElement>('.layer-child')?.style.zIndex).toBe('100');
  layer.value = 'var(--menu-layer)';
  await settle();
  expect(document.querySelector<HTMLElement>('.owned-layer')?.style.zIndex).toBe(
    'var(--menu-layer)',
  );
});

it('uses stable menu ids for independent SSR renders', async () => {
  const render = () =>
    renderToString(
      createSSRApp({ render: () => h(Menu, { items: [{ key: 'one', label: 'One' }] }) }),
    );
  const first = await render();
  const second = await render();
  expect(first).toBe(second);
  expect(first).toContain('data-menu-id="apollo-menu-');
});

it.each([undefined, 2000])(
  'inline lists preserve the actual parent numeric layer (%s)',
  async (parent) => {
    const w = mount(
      defineComponent({
        setup() {
          if (parent !== undefined)
            provide(
              ZINDEX_KEY,
              computed(() => parent),
            );
          return () =>
            h(Menu, {
              mode: 'inline',
              openKeys: ['s'],
              items: [
                {
                  key: 's',
                  label: 'Inline',
                  children: [
                    {
                      key: 'tooltip',
                      label: h(
                        Tooltip,
                        {
                          open: true,
                          title: 'Inline child',
                          classNames: { root: 'inline-layer-child' },
                        },
                        () => h('button', 'Target'),
                      ),
                    },
                  ],
                },
              ],
            });
        },
      }),
      options,
    );
    wrappers.push(w);
    await settle();
    expect(document.querySelector<HTMLElement>('.inline-layer-child')?.style.zIndex).toBe(
      parent === undefined ? '' : '2100',
    );
  },
);

it('accepts the public numeric offset pair and forwards both coordinates without a Vue prop warning', async () => {
  const warn = vi.spyOn(console, 'warn');
  try {
    const w = mount(Menu, {
      ...options,
      props: {
        openKeys: ['s'],
        items: [
          {
            key: 's',
            label: 'Offset',
            popupOffset: [3, 4],
            children: [{ key: 'one', label: 'One' }],
          },
        ],
      },
    });
    wrappers.push(w);
    await settle();
    expect(w.getComponent(PopupTrigger).props('popupAlign')).toEqual({ offset: [3, 4] });
    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});
