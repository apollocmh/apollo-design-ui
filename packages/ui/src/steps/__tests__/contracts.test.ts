import type { ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ConfigProvider from '../../config-provider';
import type { StepsItemRenderSlotProps } from '../interface';
import Steps from '../Steps';

const items = [
  { key: 'a', title: 'Alpha' },
  { key: 'b', title: 'Beta' },
];

describe('Steps native event ownership', () => {
  it('uses a once-only listener to enable interaction without consuming a native change', async () => {
    const once = vi.fn();
    const wrapper = mount(Steps, { props: { items }, attrs: { onChangeOnce: once } });
    await wrapper.trigger('change');
    expect(once).not.toHaveBeenCalled();
    const target = wrapper.findAll('.apollo-steps-item')[1];
    expect(target?.attributes('role')).toBe('button');
    await target?.trigger('click');
    await target?.trigger('click');
    expect(once).toHaveBeenCalledExactlyOnceWith(1);
    expect(wrapper.emitted('change')).toEqual([[1], [1]]);
    expect(wrapper.find('.apollo-steps-item-process').text()).toContain('Alpha');
    wrapper.unmount();
  });

  it('delivers listener arrays once each and keeps click events at their native root', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const itemClick = vi.fn();
    const rootClick = vi.fn();
    const wrapper = mount(Steps, {
      props: { items: [items[0] ?? {}, { ...items[1], onClick: itemClick }] },
      attrs: { onChange: [first, second], onClick: rootClick },
    });
    await wrapper.findAll('.apollo-steps-item')[1]?.trigger('click');
    expect(first).toHaveBeenCalledExactlyOnceWith(1);
    expect(second).toHaveBeenCalledExactlyOnceWith(1);
    expect(itemClick).toHaveBeenCalledOnce();
    expect(itemClick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    expect(rootClick).toHaveBeenCalledOnce();
    expect(rootClick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    wrapper.unmount();
  });

  it('tracks listener addition and removal and preserves keyboard/disabled/current mapping', async () => {
    const enabled = ref(false);
    const change = vi.fn();
    const wrapper = mount(
      defineComponent(
        () => () =>
          h(Steps, {
            items: [{ title: 'Alpha' }, { title: 'Beta' }, { title: 'Disabled', disabled: true }],
            initial: 3,
            current: 3,
            onChangeOnce: enabled.value ? change : undefined,
          }),
      ),
    );
    expect(wrapper.find('[role="button"]').exists()).toBe(false);
    enabled.value = true;
    await nextTick();
    const nodes = wrapper.findAll('.apollo-steps-item');
    expect(nodes[1]?.attributes('tabindex')).toBe('0');
    expect(nodes[2]?.attributes('role')).toBeUndefined();
    await nodes[0]?.trigger('click');
    await nodes[2]?.trigger('click');
    expect(change).not.toHaveBeenCalled();
    await nodes[1]?.trigger('keydown', { key: 'Enter' });
    expect(change).toHaveBeenCalledExactlyOnceWith(4);
    enabled.value = false;
    await nextTick();
    expect(wrapper.find('[role="button"]').exists()).toBe(false);
    wrapper.unmount();
  });
});

describe('Steps current theme and configuration', () => {
  it('projects all nine consumed component tokens and their replacements', async () => {
    const theme = ref<ThemeConfig>({
      components: {
        Steps: {
          descriptionMaxWidth: 220,
          customIconFontSize: 30,
          iconSize: 40,
          iconFontSize: 18,
          dotSize: 12,
          dotCurrentSize: 16,
          navArrowColor: 'rebeccapurple',
          navContentMaxWidth: '24rem',
          iconSizeSM: '1.5rem',
        },
      },
    });
    const wrapper = mount(
      defineComponent(
        () => () =>
          h(
            ConfigProvider,
            { theme: theme.value },
            {
              default: () => h(Steps, { items }),
            },
          ),
      ),
    );
    const root = wrapper.find<HTMLElement>('.apollo-steps').element;
    const expected = {
      'description-max-width': '220px',
      'custom-icon-font-size': '30px',
      'icon-size': '40px',
      'icon-font-size': '18px',
      'dot-size': '12px',
      'dot-current-size': '16px',
      'nav-arrow-color': 'rebeccapurple',
      'nav-content-max-width': '24rem',
      'icon-size-sm': '1.5rem',
    };
    for (const [name, value] of Object.entries(expected)) {
      expect(root.style.getPropertyValue(`--apollo-steps-${name}`)).toBe(value);
    }
    theme.value = { components: { Steps: { iconSize: 0, navContentMaxWidth: 180 } } };
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-steps-icon-size')).toBe('0px');
    expect(root.style.getPropertyValue('--apollo-steps-nav-content-max-width')).toBe('180px');
    expect(root.style.getPropertyValue('--apollo-steps-description-max-width')).toBe('');
    expect(root.style.getPropertyValue('--apollo-steps-custom-icon-font-size')).toBe('24px');
    expect(root.style.getPropertyValue('--apollo-steps-icon-top')).toBe('');
    wrapper.unmount();
  });

  it('consumes current component tokens and removes replaced overrides without remounting content', async () => {
    const theme = ref<ThemeConfig>({ components: { Steps: { iconSize: 40, dotSize: 12 } } });
    const wrapper = mount(
      defineComponent(
        () => () =>
          h(
            ConfigProvider,
            { theme: theme.value },
            {
              default: () =>
                h(
                  Steps,
                  { items },
                  {
                    itemRender: ({ itemNode }: StepsItemRenderSlotProps) =>
                      h('section', [h('input', { 'aria-label': 'Step note' }), itemNode]),
                  },
                ),
            },
          ),
      ),
    );
    const root = wrapper.find<HTMLElement>('.apollo-steps');
    const input = wrapper.find('input');
    await input.setValue('kept');
    expect(root.element.style.getPropertyValue('--apollo-steps-icon-size')).toBe('40px');
    expect(root.element.style.getPropertyValue('--apollo-steps-dot-size')).toBe('12px');
    theme.value = { token: { controlHeight: 36 }, components: { Steps: { iconSize: 44 } } };
    await nextTick();
    expect(root.element.style.getPropertyValue('--apollo-steps-icon-size')).toBe('44px');
    expect(root.element.style.getPropertyValue('--apollo-steps-dot-size')).toBe('9px');
    expect(wrapper.find('input').element).toBe(input.element);
    expect(input.element.value).toBe('kept');
    wrapper.unmount();
  });

  it('keeps nested themes isolated and explicit root styles above theme variables', () => {
    const wrapper = mount(ConfigProvider, {
      props: { theme: { components: { Steps: { iconSize: 40, dotSize: 11 } } } },
      slots: {
        default: () => [
          h(Steps, { items, 'data-steps': 'outer', style: '--apollo-steps-icon-size: 50px' }),
          h(
            ConfigProvider,
            { theme: { components: { Steps: { iconSize: 42 } } } },
            {
              default: () =>
                h(Steps, {
                  items,
                  'data-steps': 'inner',
                  styles: { root: { '--apollo-steps-icon-size': '52px' } },
                }),
            },
          ),
        ],
      },
    });
    expect(
      wrapper
        .find<HTMLElement>('[data-steps="outer"]')
        .element.style.getPropertyValue('--apollo-steps-icon-size'),
    ).toBe('50px');
    expect(
      wrapper
        .find<HTMLElement>('[data-steps="inner"]')
        .element.style.getPropertyValue('--apollo-steps-icon-size'),
    ).toBe('52px');
    expect(
      wrapper
        .find<HTMLElement>('[data-steps="inner"]')
        .element.style.getPropertyValue('--apollo-steps-dot-size'),
    ).toBe('11px');
    wrapper.unmount();
  });

  it('writes component variables in SSR without browser-only effects', async () => {
    const html = await renderToString(
      h(
        ConfigProvider,
        {
          theme: { components: { Steps: { iconSize: 46, navContentMaxWidth: '20rem' } } },
        },
        { default: () => h(Steps, { items }) },
      ),
    );
    expect(html).toContain('--apollo-steps-icon-size:46px');
    expect(html).toContain('--apollo-steps-nav-content-max-width:20rem');
  });

  it('keeps provider replacement, removal and attrs on the same native roots', async () => {
    const variant = ref(false);
    const wrapper = mount(
      defineComponent(
        () => () =>
          h(
            ConfigProvider,
            {
              components: {
                steps: variant.value
                  ? {
                      className: 'new-provider',
                      classNames: { itemIcon: 'new-icon' },
                      styles: { itemTitle: { color: 'blue' } },
                    }
                  : {
                      className: 'old-provider',
                      classNames: { itemIcon: 'old-icon' },
                      styles: { itemTitle: { color: 'red' } },
                    },
              },
              componentSize: variant.value ? 'small' : 'large',
              direction: variant.value ? 'rtl' : 'ltr',
            },
            { default: () => h(Steps, { items, id: variant.value ? 'new-root' : 'old-root' }) },
          ),
      ),
    );
    const root = wrapper.find('.apollo-steps').element;
    const icon = wrapper.find('.apollo-steps-item-icon').element;
    expect(wrapper.find('.apollo-steps').classes()).toContain('old-provider');
    expect(wrapper.find('.apollo-steps-item-icon').classes()).toContain('old-icon');
    variant.value = true;
    await nextTick();
    expect(wrapper.find('.apollo-steps').element).toBe(root);
    expect(wrapper.find('.apollo-steps-item-icon').element).toBe(icon);
    expect(wrapper.find('.apollo-steps').classes()).toEqual(
      expect.arrayContaining(['new-provider', 'apollo-steps-small', 'apollo-steps-rtl']),
    );
    expect(wrapper.find('.apollo-steps').classes()).not.toContain('old-provider');
    expect(wrapper.find('.apollo-steps-item-icon').classes()).not.toContain('old-icon');
    expect(wrapper.find('.apollo-steps-item-title').attributes('style')).toContain('color: blue');
    expect(wrapper.find('.apollo-steps').attributes('id')).toBe('new-root');
    wrapper.unmount();
  });
});

it('renders explicit scalar icon data instead of replacing it with a step number', async () => {
  const wrapper = mount(Steps, { props: { items: [{ title: 'Alpha', icon: 0 }] } });
  const icon = wrapper.find('.apollo-steps-item-icon');
  expect(icon.text()).toBe('0');
  expect(wrapper.find('.apollo-steps-item-custom').exists()).toBe(true);
  for (const value of [false, '']) {
    await wrapper.setProps({ items: [{ title: 'Alpha', icon: value }] });
    expect(wrapper.find('.apollo-steps-item-icon').text()).toBe('');
    expect(wrapper.find('.apollo-steps-item-icon-number').exists()).toBe(false);
  }
  await wrapper.setProps({ items: [{ title: 'Alpha' }] });
  expect(wrapper.find('.apollo-steps-item-icon-number').text()).toBe('1');
  wrapper.unmount();
});
