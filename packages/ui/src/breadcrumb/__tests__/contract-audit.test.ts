import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, Fragment, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import Dropdown from '../../dropdown/Dropdown';
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from '../index';
import type { BreadcrumbProps } from '../interface';

afterEach(() => {
  document.body.replaceChildren();
});

describe('Breadcrumb 2026-10-28 complete contract regressions', () => {
  it.each(['missing title', 'empty title', 'empty item slot'])(
    'B17: %s with a menu retains its named native menu button',
    (content) => {
      const wrapper = mount(Breadcrumb, {
        props: {
          items: [
            {
              ...(content === 'missing title'
                ? {}
                : { title: content === 'empty title' ? '' : 'Slot fallback' }),
              menu: { items: [{ key: 'child', label: 'Child page' }] },
            },
          ],
        },
        slots: content === 'empty item slot' ? { itemRender: () => null } : {},
      });
      const button = wrapper.get('button[aria-haspopup="menu"]');
      expect(button.attributes('type')).toBe('button');
      expect(button.attributes('aria-label')).toBe('Open breadcrumb menu');
      expect(wrapper.findAll('.apollo-breadcrumb-item')).toHaveLength(1);
      expect(wrapper.text()).not.toContain('Slot fallback');
      wrapper.unmount();
    },
  );

  it('B01: title keeps arrays, fragments, numeric zero and nested VNodes', () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: [
          { title: [h('i', 'icon'), h('strong', 'Array')] },
          { title: h(Fragment, [h('b', 'Fragment')]) },
          { title: 0 },
        ],
      },
    });
    expect(wrapper.get('strong').text()).toBe('Array');
    expect(wrapper.get('b').text()).toBe('Fragment');
    expect(wrapper.text()).not.toContain('[object Object]');
    expect(wrapper.findAll('.apollo-breadcrumb-link').at(-1)?.text()).toBe('0');
    wrapper.unmount();
  });

  it('B02: complete parameter names are literal, repeated and preserve zero/empty values', () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        params: { id: 0, id2: 42, 'a+': 'literal', empty: '' },
        items: [
          {
            title: ':id/:id2/:id/:a+/:empty/:missing',
            path: ':id/:id2/:id/:a+/:empty/:missing',
          },
        ],
      },
    });
    expect(wrapper.get('a').text()).toBe('0/42/0/literal//:missing');
    expect(wrapper.get('a').attributes('href')).toBe('#/0/42/0/literal//:missing');
    wrapper.unmount();
  });

  it('B03: provided empty items still own the data channel and never evaluate default content', () => {
    const content = vi.fn(() => h(BreadcrumbItem, null, () => 'unexpected'));
    const wrapper = mount(Breadcrumb, { props: { items: [] }, slots: { default: content } });
    expect(content).not.toHaveBeenCalled();
    expect(wrapper.findAll('li')).toHaveLength(0);
    wrapper.unmount();
  });

  it('B04: current empty content slots suppress their prop fallbacks and restore dynamically', async () => {
    const custom = ref(true);
    const empty = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Breadcrumb,
            { items: [{ title: 'A' }, { title: 'B' }], separator: '/' },
            custom.value ? { separator: () => (empty.value ? [] : h('b', '|')) } : {},
          ),
      }),
    );
    expect(wrapper.get('.apollo-breadcrumb-separator b').text()).toBe('|');
    empty.value = true;
    await nextTick();
    expect(wrapper.find('.apollo-breadcrumb-separator').exists()).toBe(false);
    custom.value = false;
    await nextTick();
    expect(wrapper.get('.apollo-breadcrumb-separator').text()).toBe('/');
    wrapper.unmount();
  });

  it('B05: native Item attrs belong to its li and native listeners fire once', async () => {
    const click = vi.fn();
    const enter = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(Breadcrumb, {
      slots: {
        default: () => [
          h(
            BreadcrumbItem,
            {
              id: 'owned-item',
              class: ['native', { active: true }],
              style: ['color: red', { paddingLeft: '6px' }],
              'aria-label': 'Owned item',
              onClick: click,
              onMouseenter: enter,
              href: '#owned',
            },
            () => 'Owned',
          ),
          h(BreadcrumbItem, null, () => 'Last'),
        ],
      },
    });
    const li = wrapper.get('li#owned-item');
    expect(li.classes()).toEqual(expect.arrayContaining(['native', 'active']));
    expect(li.attributes('style')).toContain('padding-left: 6px');
    expect(li.attributes('aria-label')).toBe('Owned item');
    await li.get('a').trigger('click');
    await li.trigger('mouseenter');
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    expect(enter).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/Extraneous|Invalid prop/);
    wrapper.unmount();
    warn.mockRestore();
  });

  it('B06: data item style is consumed on its default content element', () => {
    const wrapper = mount(Breadcrumb, {
      props: { items: [{ title: 'A', className: 'data-class', style: { color: 'red' } }] },
    });
    expect(wrapper.get('.apollo-breadcrumb-link').attributes('style')).toContain('color: red');
    expect(wrapper.get('.apollo-breadcrumb-link').classes()).toContain('data-class');
    wrapper.unmount();
  });

  it('B07: all owned children consume the current Breadcrumb prefix, separator and dropdown icon', async () => {
    const prefix = ref('first');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Breadcrumb,
            { prefixCls: prefix.value, dropdownIcon: h('i', { 'data-arrow': '' }, 'v') },
            () => [
              h(BreadcrumbItem, { menu: { items: [] } }, () => 'A'),
              h(BreadcrumbSeparator, null, () => '|'),
              h(BreadcrumbItem, null, () => 'B'),
            ],
          ),
      }),
    );
    expect(wrapper.findAll('.first-item')).toHaveLength(2);
    expect(wrapper.findAll('.first-separator')).toHaveLength(2);
    expect(wrapper.find('[data-arrow]').exists()).toBe(true);
    prefix.value = 'second';
    await nextTick();
    expect(wrapper.findAll('.second-item')).toHaveLength(2);
    expect(wrapper.findAll('.second-separator')).toHaveLength(2);
    expect(wrapper.find('[class^="first"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('B08: present empty Separator slot suppresses slash and attrs cannot expose decorative content', () => {
    const wrapper = mount(BreadcrumbSeparator, {
      attrs: { id: 'separator', 'aria-hidden': 'false', class: 'native-separator' },
      slots: { default: () => [] },
    });
    expect(wrapper.text()).toBe('');
    expect(wrapper.attributes('id')).toBe('separator');
    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.classes()).toContain('native-separator');
    wrapper.unmount();
  });

  it('B09: semantic functions see current merged props without freezing input snapshots', async () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: [{ title: 'A' }, { title: 'B' }],
        params: { id: 1 },
        separator: '/',
        classNames: ({ props }: { props: BreadcrumbProps }) => ({
          root: `route-${String(props.params?.id)}`,
        }),
        styles: ({ props }: { props: BreadcrumbProps }) => ({
          item: { opacity: props.separator === '/' ? '0.8' : '0.6' },
        }),
      },
    });
    await wrapper.setProps({ params: { id: 2 }, separator: '|' });
    expect(wrapper.classes()).toContain('route-2');
    expect(wrapper.get('.apollo-breadcrumb-item').attributes('style')).toContain('0.6');
    wrapper.unmount();
  });

  it('B10: menu items honor explicit href, relative path and absent base href', () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: [
          {
            title: 'A',
            menu: {
              items: [
                { key: 0, title: 'Relative', path: '/relative' },
                { key: 'x', title: 'Explicit', href: '/explicit', path: '/ignored' },
              ],
            },
          },
        ],
      },
    });
    const labels = wrapper.getComponent(Dropdown).props('menu')?.items;
    expect(labels).toHaveLength(2);
    const markup = wrapper.html();
    expect(markup).not.toContain('undefined/');
    const popupItems = wrapper.getComponent(Dropdown).props('menu')?.items;
    const first = popupItems?.[0];
    const second = popupItems?.[1];
    expect(first && 'label' in first && first.label).toMatchObject({
      type: 'a',
      props: { href: '/relative' },
    });
    expect(second && 'label' in second && second.label).toMatchObject({
      type: 'a',
      props: { href: '/explicit' },
    });
    wrapper.unmount();
  });

  it('B11: menu toggles keep existing content identity and use a separate native button', async () => {
    const menu = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Breadcrumb,
            {
              items: [{ key: 'stable', title: 'A', menu: menu.value ? { items: [] } : undefined }],
            },
            { itemRender: () => h('input', { 'aria-label': 'Stable content' }) },
          ),
      }),
    );
    const input = wrapper.get('input').element;
    menu.value = true;
    await nextTick();
    expect(wrapper.get('input').element).toBe(input);
    const button = wrapper.get('button');
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-haspopup')).toBe('menu');
    expect(button.attributes('aria-label')).toBeTruthy();
    expect(button.find('a,input').exists()).toBe(false);
    menu.value = false;
    await nextTick();
    expect(wrapper.get('input').element).toBe(input);
    wrapper.unmount();
  });

  it('B12: every current component token reaches the root and native styles keep priority', async () => {
    const wrapper = mount(ConfigProvider, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        theme: {
          components: {
            Breadcrumb: {
              itemColor: 'red',
              lastItemColor: 'blue',
              linkColor: 'green',
              linkHoverColor: 'purple',
              separatorColor: 'orange',
              separatorMargin: 15,
              iconFontSize: 21,
            },
          },
        },
      },
      slots: {
        default: () =>
          h(Breadcrumb, {
            items: [{ title: 'A', href: '#a' }, { title: 'B' }],
            style: { '--apollo-breadcrumb-item-color': 'brown' },
          }),
      },
    });
    await nextTick();
    const style = wrapper.get('nav').element.style;
    expect(style.getPropertyValue('--apollo-breadcrumb-item-color')).toBe('brown');
    expect(style.getPropertyValue('--apollo-breadcrumb-last-item-color')).toBe('blue');
    expect(style.getPropertyValue('--apollo-breadcrumb-link-color')).toBe('green');
    expect(style.getPropertyValue('--apollo-breadcrumb-link-hover-color')).toBe('purple');
    expect(style.getPropertyValue('--apollo-breadcrumb-separator-color')).toBe('orange');
    expect(style.getPropertyValue('--apollo-breadcrumb-separator-margin')).toBe('15px');
    expect(style.getPropertyValue('--apollo-breadcrumb-icon-font-size')).toBe('21px');
    await wrapper.setProps({ theme: { components: { Breadcrumb: { separatorMargin: 18 } } } });
    expect(
      wrapper.get('nav').element.style.getPropertyValue('--apollo-breadcrumb-separator-margin'),
    ).toBe('18px');
    expect(
      wrapper.get('nav').element.style.getPropertyValue('--apollo-breadcrumb-last-item-color'),
    ).not.toBe('blue');
    wrapper.unmount();
  });

  it('B13: SSR uses complete content and current instance theme without browser effects', async () => {
    const render = (color: string) =>
      renderToString(
        h(ConfigProvider, { theme: { components: { Breadcrumb: { linkColor: color } } } }, () =>
          h(Breadcrumb, { items: [{ title: [h('b', 'SSR')], href: '#ssr' }] }),
        ),
      );
    const first = await render('red');
    const second = await render('blue');
    expect(first).toContain('<b>SSR</b>');
    expect(first).toContain('--apollo-breadcrumb-link-color:red');
    expect(second).toContain('--apollo-breadcrumb-link-color:blue');
    expect(second).not.toContain('--apollo-breadcrumb-link-color:red');
  });
  it('B14: a data action without href owns a native keyboard button and one MouseEvent', async () => {
    const click = vi.fn();
    const wrapper = mount(Breadcrumb, {
      props: { items: [{ title: 'Choose route', onClick: click }] },
    });
    const button = wrapper.get('button.apollo-breadcrumb-link');
    expect(button.attributes('type')).toBe('button');
    await button.trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    wrapper.unmount();
  });

  it('B15: current Provider component configuration updates native and data consumers independently', async () => {
    const config = ref({
      separator: '/',
      classNames: { item: 'first' },
      dropdownIcon: h('i', 'first icon'),
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { components: { breadcrumb: config.value } }, () =>
            h(Breadcrumb, { items: [{ title: 'A', menu: { items: [] } }, { title: 'B' }] }),
          ),
      }),
    );
    expect(wrapper.get('.apollo-breadcrumb-separator').text()).toBe('/');
    config.value = {
      separator: '>',
      classNames: { item: 'second' },
      dropdownIcon: h('i', 'second icon'),
    };
    await nextTick();
    expect(wrapper.get('.apollo-breadcrumb-separator').text()).toBe('>');
    expect(wrapper.get('.apollo-breadcrumb-item').classes()).toContain('second');
    expect(wrapper.get('button i').text()).toBe('second icon');
    wrapper.unmount();
  });

  it('B16: native Item slots override local props including empty content, with no trailing separator', async () => {
    const empty = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Breadcrumb, null, () => [
            h(
              BreadcrumbItem,
              { separator: '/', menu: { items: [] }, dropdownIcon: 'fallback' },
              {
                default: () => 'A',
                separator: () => (empty.value ? [] : '|'),
                dropdownIcon: () => (empty.value ? [] : h('b', 'local icon')),
              },
            ),
            h(BreadcrumbItem, null, { default: () => 'B', separator: () => 'must not trail' }),
          ]),
      }),
    );
    expect(wrapper.get('.apollo-breadcrumb-separator').text()).toBe('|');
    expect(wrapper.get('button b').text()).toBe('local icon');
    empty.value = true;
    await nextTick();
    expect(wrapper.find('.apollo-breadcrumb-separator').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('fallback');
    wrapper.unmount();
  });
});
