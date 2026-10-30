import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type CSSProperties, defineComponent, h, mergeProps, nextTick, ref, shallowRef } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { ConfigProviderThemeConfig } from '../../config-provider/hooks/use-theme';
import type { MenuProps } from '../../menu/interface';
import Dropdown from '../Dropdown';
import DropdownButton from '../DropdownButton';
import type { DropdownButtonRef, DropdownRef } from '../interface';
import PurePanel from '../PurePanel';

const menu = {
  items: [
    { key: 'one', label: 'One', icon: h('span', 'I') },
    { key: 'sub', label: 'Submenu', children: [{ key: 'two', label: 'Two' }] },
  ],
};
const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const settle = async () => {
  await nextTick();
  await nextTick();
};
function popup(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.apollo-dropdown');
  if (!element) throw new Error('Expected actual Dropdown popup');
  return element;
}
const live = () => !!document.querySelector('.apollo-dropdown:not(.apollo-dropdown-hidden)');
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };

describe('Dropdown owned notifications and target', () => {
  it('owns openChange/update and motion notifications with current listeners and once semantics', async () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();
    const once = vi.fn();
    const after = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Dropdown,
            mergeProps(
              { menu, trigger: ['click'], onOpenChange: first },
              { onOpenChange: second, onOpenChangeOnce: once, onAfterOpenChange: after },
            ),
            () => h('button', { id: 'owned-trigger' }, 'Open'),
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await vi.runAllTimersAsync();
    expect(first).toHaveBeenCalledExactlyOnceWith(true, { source: 'trigger' });
    expect(second).toHaveBeenCalledExactlyOnceWith(true, { source: 'trigger' });
    expect(once).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledExactlyOnceWith(true);
    popup().querySelector<HTMLElement>('[role="menuitem"]')?.click();
    await vi.runAllTimersAsync();
    expect(first).toHaveBeenLastCalledWith(false, { source: 'menu' });
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenLastCalledWith(false);
    const component = wrapper.getComponent(Dropdown);
    expect(component.emitted('openChange')).toEqual([
      [true, { source: 'trigger' }],
      [false, { source: 'menu' }],
    ]);
    expect(component.emitted('update:open')).toEqual([[true], [false]]);
  });

  it('a rejected controlled menu close does not contaminate withdrawal', async () => {
    const onOpenChange = vi.fn();
    const wrapper = mount(Dropdown, {
      ...options,
      props: { open: true, menu, onOpenChange },
      slots: { default: () => h('button', 'Controlled') },
    });
    wrappers.push(wrapper);
    await settle();
    popup().querySelector<HTMLElement>('[role="menuitem"]')?.click();
    await settle();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false, { source: 'menu' });
    expect(live()).toBe(true);
    await wrapper.setProps({ open: undefined });
    expect(live()).toBe(true);
  });

  it('exposes its actual current trigger and popup through existing method-shaped refs', async () => {
    const instance = shallowRef<DropdownRef | null>(null);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Dropdown, { ref: instance, open: true, menu }, () => h('button', 'Referenced')),
      }),
      options,
    );
    wrappers.push(wrapper);
    await settle();
    expect(instance.value?.nativeElement()).toBe(wrapper.get('button').element);
    expect(instance.value?.popupElement()).toBe(popup());
    instance.value?.forceAlign();
    wrapper.unmount();
    expect(instance.value).toBeNull();
  });

  it('routes native attrs to the stable trigger and semantic root styles to the actual popup', async () => {
    const nativeClick = vi.fn();
    const wrapper = mount(Dropdown, {
      ...options,
      props: {
        open: true,
        menu,
        class: 'native-trigger',
        onClick: nativeClick,
        style: { padding: '3px' },
        classNames: { root: 'owned-popup' },
        styles: { root: { minWidth: '240px' } },
        id: 'dropdown-popup',
      },
      slots: { default: () => h('button', 'Native target') },
    });
    wrappers.push(wrapper);
    await settle();
    const button = wrapper.get('button').element;
    expect(button.classList.contains('native-trigger')).toBe(true);
    expect(button.style.padding).toBe('3px');
    expect(popup().classList.contains('owned-popup')).toBe(true);
    expect(popup().style.minWidth).toBe('240px');
    expect(button.id).toBe('dropdown-popup');
    await wrapper.get('button').trigger('click');
    expect(nativeClick).toHaveBeenCalledOnce();
    await wrapper.setProps({ class: 'replaced-trigger', style: 'padding:5px' });
    expect(wrapper.get('button').element).toBe(button);
    expect(button.classList.contains('replaced-trigger')).toBe(true);
    expect(button.classList.contains('native-trigger')).toBe(false);
    expect(button.style.padding).toBe('5px');
  });

  it('forwards item semantics to the actual composed Menu', async () => {
    const css: CSSProperties = { color: 'rgb(1, 2, 3)', '--dropdown-item': 'current' };
    const wrapper = mount(Dropdown, {
      ...options,
      props: {
        open: true,
        menu,
        classNames: {
          item: 'owned-item',
          itemTitle: 'owned-title',
          itemIcon: 'owned-icon',
          itemContent: 'owned-content',
        },
        styles: { item: css, itemTitle: css, itemIcon: css, itemContent: css },
      },
      slots: { default: () => h('button', 'Menu semantics') },
    });
    wrappers.push(wrapper);
    await settle();
    for (const selector of ['.owned-item', '.owned-title', '.owned-icon', '.owned-content']) {
      const node = popup().querySelector<HTMLElement>(selector);
      expect(node?.style.color).toBe('rgb(1, 2, 3)');
      expect(node?.style.getPropertyValue('--dropdown-item')).toBe('current');
    }
  });

  it('uses the current composed Menu selection configuration and keyboard listener', async () => {
    const selected = vi.fn();
    const previousKey = vi.fn();
    const currentKey = vi.fn();
    const selectable = ref(true);
    const changed = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Dropdown,
            {
              open: true,
              menu: {
                items: [
                  { key: 'one', label: 'One' },
                  { key: 'two', label: 'Two' },
                ],
                selectable: selectable.value,
                multiple: true,
                onSelect: selected,
                onKeydown: changed.value ? currentKey : previousKey,
              },
            },
            () => h('button', 'Current Menu'),
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    await settle();
    const list = popup().querySelector('ul');
    popup().querySelector<HTMLElement>('[role="menuitem"]')?.click();
    expect(selected).toHaveBeenCalledOnce();
    list?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
    expect(previousKey).toHaveBeenCalledOnce();
    selectable.value = false;
    changed.value = true;
    await settle();
    popup().querySelectorAll<HTMLElement>('[role="menuitem"]')[1]?.click();
    expect.soft(selected).toHaveBeenCalledOnce();
    list?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
    expect.soft(currentKey).toHaveBeenCalledOnce();
    expect(previousKey).toHaveBeenCalledOnce();
  });
});

describe('Dropdown current Provider and CSS values', () => {
  it('evaluates semantic functions against current effective open state', async () => {
    const wrapper = mount(Dropdown, {
      ...options,
      props: {
        menu,
        trigger: ['click'],
        classNames: ({ props }) => ({ root: props.open ? 'opened-style' : 'closed-style' }),
        styles: ({ props }) => ({ root: { padding: props.open ? '7px' : '3px' } }),
      },
      slots: { default: () => h('button', 'Function styles') },
    });
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await settle();
    expect(popup().classList.contains('opened-style')).toBe(true);
    expect(popup().style.padding).toBe('7px');
    await wrapper.get('button').trigger('click');
    await settle();
    expect(popup().classList.contains('closed-style')).toBe(true);
    expect(popup().style.padding).toBe('3px');
  });

  it('projects all seven existing component CSS fields, including zero, and removes overrides', async () => {
    const fields = {
      zIndexPopup: 0,
      paddingBlock: 0,
      arrowOffsetHorizontal: 3,
      arrowOffsetVertical: 4,
      arrowShadowWidth: 5,
      arrowPath: 'path("M 0 0 L 4 4")',
      arrowPolygon: 'polygon(0 0, 100% 100%)',
    };
    const theme = ref<ConfigProviderThemeConfig | undefined>({ components: { Dropdown: fields } });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { theme: theme.value }, () =>
            h(Dropdown, { open: true, menu }, () => h('button', 'All CSS fields')),
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    await settle();
    const expected = {
      '--apollo-dropdown-z-index-popup': '0',
      '--apollo-dropdown-padding-block': '0px',
      '--apollo-dropdown-arrow-offset-horizontal': '3px',
      '--apollo-dropdown-arrow-offset-vertical': '4px',
      '--apollo-dropdown-arrow-shadow-width': '5px',
      '--apollo-dropdown-arrow-path': fields.arrowPath,
      '--apollo-dropdown-arrow-polygon': fields.arrowPolygon,
    };
    for (const [field, value] of Object.entries(expected))
      expect(popup().style.getPropertyValue(field)).toBe(value);
    expect(popup().style.zIndex).toBe('0');
    theme.value = undefined;
    await settle();
    for (const field of Object.keys(expected))
      expect(popup().style.getPropertyValue(field)).toBe('');
    expect(popup().style.zIndex).toBe('1050');
  });

  it('uses current Provider defaults, semantic styles and global/owned Token values', async () => {
    const next = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: {
                dropdown: {
                  trigger: ['click'],
                  arrow: true,
                  className: next.value ? 'next-config' : 'current-config',
                  styles: { root: { padding: next.value ? '9px' : '7px' } },
                },
              },
              theme: {
                token: { marginXXS: next.value ? 10 : 8, sizePopupArrow: next.value ? 20 : 18 },
                components: {
                  Dropdown: {
                    zIndexPopup: next.value ? 2600 : 2500,
                    paddingBlock: next.value ? 11 : 9,
                  },
                },
              },
            },
            () => h(Dropdown, { menu }, () => h('button', 'Configured')),
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    await wrapper.get('button').trigger('click');
    await settle();
    expect(live()).toBe(true);
    expect(popup().classList.contains('current-config')).toBe(true);
    expect(popup().style.padding).toBe('7px');
    expect(popup().style.zIndex).toBe('2500');
    expect(popup().style.getPropertyValue('--apollo-dropdown-padding-block')).toBe('9px');
    expect(popup().style.getPropertyValue('--apollo-size-popup-arrow')).toBe('18px');
    expect(popup().querySelector('.apollo-dropdown-arrow')).not.toBeNull();
    const target = wrapper.get('button').element;
    next.value = true;
    await settle();
    expect(wrapper.get('button').element).toBe(target);
    expect(popup().classList.contains('next-config')).toBe(true);
    expect(popup().style.zIndex).toBe('2600');
    expect(popup().style.getPropertyValue('--apollo-dropdown-padding-block')).toBe('11px');
    expect(popup().style.getPropertyValue('--apollo-size-popup-arrow')).toBe('20px');
  });

  it('keeps the composed menu and current RTL arrow when Provider direction changes', async () => {
    const direction = ref<'ltr' | 'rtl'>('ltr');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { direction: direction.value }, () =>
            h(Dropdown, { menu, open: true }, () => h('button', 'Direction')),
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    await settle();
    const item = popup().querySelector('[role="menuitem"]');
    expect(
      popup().querySelector('.apollo-dropdown-menu-submenu-arrow-icon')?.getAttribute('aria-label'),
    ).toBe('right');
    direction.value = 'rtl';
    await settle();
    expect(popup().querySelector('[role="menuitem"]')).toBe(item);
    expect(
      popup().querySelector('.apollo-dropdown-menu-submenu-arrow-icon')?.getAttribute('aria-label'),
    ).toBe('left');
  });

  it('updates a current custom prefix without replacing the composed menu or focused item', async () => {
    const prefix = ref('first-dropdown');
    const groupedMenu: MenuProps = {
      items: [
        ...menu.items,
        {
          type: 'group',
          key: 'group',
          label: 'Group',
          children: [{ key: 'three', label: 'Three' }],
        },
      ],
    };
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Dropdown, { prefixCls: prefix.value, menu: groupedMenu, open: true }, () =>
            h('button', 'Prefix'),
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    await settle();
    const list = document.querySelector<HTMLElement>('.first-dropdown-menu');
    const item = list?.querySelector<HTMLElement>('[role="menuitem"]');
    const group = document.querySelector('.first-dropdown-menu-item-group-title');
    item?.focus();
    prefix.value = 'next-dropdown';
    await settle();
    expect(document.querySelector('.next-dropdown-menu')).toBe(list);
    expect(document.querySelector('.next-dropdown-menu-item')).toBe(item);
    expect(document.querySelector('.next-dropdown-menu-item-group-title')).toBe(group);
    expect(document.activeElement).toBe(item);
  });

  it('observes global disabled context and an explicit enabled override', async () => {
    const disabled = ref(true);
    const override = ref<boolean>();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { componentDisabled: disabled.value }, () =>
            h(Dropdown, { menu, trigger: ['click'], disabled: override.value }, () =>
              h('button', 'Disabled'),
            ),
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    await wrapper.get('button').trigger('click');
    expect(live()).toBe(false);
    override.value = false;
    await settle();
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined();
    await wrapper.get('button').trigger('click');
    await settle();
    expect(live()).toBe(true);
  });
});

describe('DropdownButton and PurePanel native composition', () => {
  it('reads complete current icon slots and respects a deliberately empty icon slot', async () => {
    const phase = ref(0);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            DropdownButton,
            { split: true },
            {
              default: () => 'Action',
              ...(phase.value
                ? { icon: () => (phase.value === 1 ? [h('i', 'A'), h('b', 'B')] : []) }
                : {}),
            },
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    expect(wrapper.findAll('button')[1]?.find('[aria-label="ellipsis"]').exists()).toBe(true);
    phase.value = 1;
    await settle();
    expect(wrapper.findAll('button')[1]?.text()).toBe('AB');
    phase.value = 2;
    await settle();
    expect(wrapper.findAll('button')[1]?.find('[aria-label="ellipsis"]').exists()).toBe(false);
    phase.value = 0;
    await settle();
    expect(wrapper.findAll('button')[1]?.find('[aria-label="ellipsis"]').exists()).toBe(true);
  });

  it('owns its main click and open notifications and puts link target on the main link', async () => {
    const clicked = vi.fn((event: MouseEvent) => event.preventDefault());
    const wrapper = mount(DropdownButton, {
      ...options,
      props: {
        split: true,
        menu,
        trigger: ['click'],
        href: '#details',
        target: '_blank',
        onClick: clicked,
      },
      slots: { default: () => 'Main action' },
    });
    wrappers.push(wrapper);
    await wrapper.get('a').trigger('click');
    expect(clicked).toHaveBeenCalledOnce();
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.get('a').attributes('target')).toBe('_blank');
    expect(live()).toBe(false);
    await wrapper.get('button').trigger('click');
    await settle();
    expect(wrapper.emitted('openChange')).toEqual([[true, { source: 'trigger' }]]);
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
  });

  it('keeps click.once on the main button, and exposes the actual Dropdown trigger', async () => {
    const once = vi.fn();
    const clicked = vi.fn();
    const instance = shallowRef<DropdownButtonRef | null>(null);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            DropdownButton,
            {
              ref: instance,
              split: true,
              menu,
              trigger: ['click'],
              onClick: clicked,
              onClickOnce: once,
            },
            () => 'Main action',
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    const [main, arrow] = wrapper.findAll('button');
    if (!main || !arrow) throw new Error('Expected split main and trigger buttons');
    await arrow.trigger('click');
    expect(once).not.toHaveBeenCalled();
    expect(clicked).not.toHaveBeenCalled();
    expect(instance.value?.nativeElement()).toBe(arrow.element);
    await main.trigger('click');
    await main.trigger('click');
    expect(clicked).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledOnce();
  });

  it('PurePanel merges native string/array styles with semantic CSS and current theme', async () => {
    const style = ref<string | (string | CSSProperties)[]>('padding: 7px; --panel-value:first');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { theme: { components: { Dropdown: { paddingBlock: 9 } } } }, () =>
            h(PurePanel, { menu, style: style.value, styles: { root: { marginTop: '3px' } } }),
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    expect(popup().style.padding).toBe('7px');
    expect(popup().style.marginTop).toBe('3px');
    expect(popup().style.getPropertyValue('--panel-value')).toBe('first');
    expect(popup().style.getPropertyValue('--apollo-dropdown-padding-block')).toBe('9px');
    style.value = ['padding: 11px', { '--panel-value': 'next' }];
    await settle();
    expect(popup().style.padding).toBe('11px');
    expect(popup().style.getPropertyValue('--panel-value')).toBe('next');
  });
});
