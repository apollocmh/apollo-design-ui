import type { ThemeConfig } from '@apollo-design/theme';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref, type StyleValue, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import Form from '../../form/Form.vue';
import { Card, CardGrid, CardMeta } from '../index';
import type { CardMetaProps, CardProps } from '../interface';

const mounted: VueWrapper[] = [];
afterEach(() => {
  mounted.forEach((wrapper) => {
    wrapper.unmount();
  });
  mounted.length = 0;
  document.body.innerHTML = '';
});

const tabs = [
  { key: 'a', label: 'Alpha' },
  { key: 'b', label: 'Beta' },
];

describe('native Card ownership', () => {
  it('renders current themed content and Meta fallback through the SSR renderer', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ConfigProvider,
            { theme: { components: { Card: { bodyPadding: 37 } } } },
            {
              default: () =>
                h(
                  Card,
                  { title: 'Server card' },
                  { default: () => h(CardMeta, {}, { default: () => 'Server description' }) },
                ),
            },
          ),
      }),
    );
    expect(html).toContain('Server card');
    expect(html).toContain('Server description');
    expect(html).toContain('--apollo-card-body-padding:37px');
  });
  it('owns the model proposal and tabChange once while the parent retains control', async () => {
    const changed = vi.fn();
    const updated = vi.fn();
    const wrapper = mount(Card, {
      props: {
        tabList: tabs,
        activeTabKey: 'a',
        onTabChange: changed,
        'onUpdate:activeTabKey': updated,
      },
    });
    mounted.push(wrapper);
    await wrapper.get('[data-node-key="b"] [role="tab"]').trigger('click');
    expect(updated).toHaveBeenCalledExactlyOnceWith('b');
    expect(changed).toHaveBeenCalledExactlyOnceWith('b');
    expect(wrapper.emitted('update:activeTabKey')).toEqual([['b']]);
    expect(wrapper.emitted('tabChange')).toEqual([['b']]);
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Alpha');
    await wrapper.setProps({ activeTabKey: undefined });
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Alpha');
    await wrapper.get('[data-node-key="b"] [role="tab"]').trigger('click');
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Beta');
  });

  it('keeps the Card active/default keys authoritative over nested tabProps', () => {
    const wrapper = mount(Card, {
      props: {
        tabList: tabs,
        defaultActiveTabKey: 'b',
        tabProps: { activeKey: 'a', defaultActiveKey: 'a' },
      },
    });
    mounted.push(wrapper);
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Beta');
  });

  it('reads conditional title/extra slots on each render and empty slots suppress data', async () => {
    const shown = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Card,
            {},
            {
              default: () => h('input', { 'aria-label': 'body editor' }),
              ...(shown.value
                ? { title: () => 'Current title', extra: () => 'Current extra' }
                : {}),
            },
          ),
      }),
    );
    mounted.push(wrapper);
    const input = wrapper.get('input').element;
    shown.value = true;
    await nextTick();
    expect(wrapper.get('.apollo-card-head-title').text()).toBe('Current title');
    shown.value = false;
    await nextTick();
    expect(wrapper.find('.apollo-card-head').exists()).toBe(false);
    expect(wrapper.get('input').element).toBe(input);
    const empty = mount(Card, {
      props: { title: 'Old title', extra: 'Old extra', cover: 'Old cover' },
      slots: { title: () => [], extra: () => [], cover: () => [] },
    });
    mounted.push(empty);
    expect(empty.text()).not.toContain('Old');
  });

  it('gives the existing actions list a current named slot and preserves keyed action identity', async () => {
    const reverse = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Card,
            { actions: ['Old action'] },
            {
              actions: () =>
                (reverse.value ? ['b', 'a'] : ['a', 'b']).map((key) =>
                  h('input', { key, 'aria-label': key }),
                ),
            },
          ),
      }),
      { attachTo: document.body },
    );
    mounted.push(wrapper);
    const input = wrapper.get<HTMLInputElement>('input[aria-label="a"]');
    await input.setValue('retained');
    input.element.focus();
    reverse.value = true;
    await nextTick();
    expect(wrapper.text()).not.toContain('Old action');
    expect(wrapper.findAll('.apollo-card-actions > li')).toHaveLength(2);
    expect(wrapper.get('input[aria-label="a"]').element).toBe(input.element);
    expect(document.activeElement).toBe(input.element);
  });

  it('keeps the extra editor when a title enters the same header', async () => {
    const shown = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Card,
            {},
            {
              extra: () => h('input', { 'aria-label': 'extra editor' }),
              ...(shown.value ? { title: () => 'Title' } : {}),
            },
          ),
      }),
      { attachTo: document.body },
    );
    mounted.push(wrapper);
    const input = wrapper.get('input');
    await input.setValue('retained');
    input.element.focus();
    shown.value = true;
    await nextTick();
    expect(wrapper.get('input').element).toBe(input.element);
    expect(document.activeElement).toBe(input.element);
  });

  it('forwards current native attrs on Card and Meta without replacing their root', async () => {
    for (const component of [Card, CardMeta]) {
      const attrs = shallowRef<{
        'data-current': string;
        class: Record<string, boolean>;
        style: StyleValue;
      }>({
        'data-current': 'first',
        class: { first: true },
        style: { paddingTop: '2px' },
      });
      const wrapper = mount(
        defineComponent({
          setup: () => () => h(component, { title: 'Title', ...attrs.value }),
        }),
      );
      mounted.push(wrapper);
      const root = wrapper.element;
      attrs.value = {
        'data-current': 'second',
        class: { second: true },
        style: [{ paddingTop: '3px' }, { paddingTop: '7px' }],
      };
      await nextTick();
      expect(wrapper.attributes('data-current')).toBe('second');
      expect(wrapper.classes()).toContain('second');
      expect(wrapper.classes()).not.toContain('first');
      expect(wrapper.attributes('style')).toContain('padding-top: 7px');
      expect(wrapper.element).toBe(root);
    }
  });

  it('semantic functions read current Card/Meta props', async () => {
    const wrapper = mount(Card, {
      props: {
        size: 'small',
        classNames: ({ props }: { props: CardProps }) => ({ root: `size-${props.size}` }),
      },
    });
    const meta = mount(CardMeta, {
      props: {
        title: 'first',
        classNames: ({ props }: { props: CardMetaProps }) => ({ root: `title-${props.title}` }),
      },
    });
    mounted.push(wrapper, meta);
    await wrapper.setProps({ size: 'medium' });
    await meta.setProps({ title: 'second' });
    expect(wrapper.classes()).toContain('size-medium');
    expect(meta.classes()).toContain('title-second');
  });

  it('uses legal Card size/variant values rather than the Form input variant', () => {
    const wrapper = mount(ConfigProvider, {
      props: { componentSize: 'large' },
      slots: {
        default: () =>
          h(
            Form,
            { variant: 'borderless' },
            {
              default: () =>
                h(Card, {
                  classNames: ({ props }: { props: CardProps }) => ({
                    root: `size-${props.size} variant-${props.variant}`,
                  }),
                }),
            },
          ),
      },
      global: { stubs: { teleport: false } },
    });
    mounted.push(wrapper);
    expect(wrapper.get('.apollo-card').classes()).toEqual(
      expect.arrayContaining(['size-medium', 'variant-outlined', 'apollo-card-bordered']),
    );
  });

  it('uses current Card component tokens and releases removed overrides', async () => {
    const theme = shallowRef<ThemeConfig | undefined>({
      components: { Card: { bodyPadding: 37, headerHeight: 73, actionsBg: 'rgb(20, 30, 40)' } },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: theme.value },
            {
              default: () =>
                h(Card, { title: 'Theme', actions: ['Action'] }, { default: () => 'Body' }),
            },
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    mounted.push(wrapper);
    expect(wrapper.get('.apollo-card').attributes('style')).toContain(
      '--apollo-card-body-padding: 37px',
    );
    theme.value = { components: { Card: { bodyPadding: 19 } } };
    await nextTick();
    expect(wrapper.get('.apollo-card').attributes('style')).toContain(
      '--apollo-card-body-padding: 19px',
    );
    expect(wrapper.get('.apollo-card').attributes('style')).not.toContain('73px');
    theme.value = undefined;
    await nextTick();
    expect(wrapper.get('.apollo-card').attributes('style') ?? '').not.toContain(
      '--apollo-card-body-padding:',
    );
  });

  it('uses Skeleton while loading and evaluates the body slot once when shown', async () => {
    const body = vi.fn(() => h(CardGrid, {}, { default: () => 'Grid content' }));
    const wrapper = mount(Card, { props: { loading: true }, slots: { default: body } });
    mounted.push(wrapper);
    expect(body).not.toHaveBeenCalled();
    expect(wrapper.findAll('.apollo-skeleton-paragraph li')).toHaveLength(4);
    expect(wrapper.classes()).not.toContain('apollo-card-contain-grid');
    await wrapper.setProps({ loading: false });
    expect(body).toHaveBeenCalledTimes(1);
    expect(wrapper.classes()).toContain('apollo-card-contain-grid');
  });
});

describe('native Card.Meta content', () => {
  it('renders conditional named regions with the same current slot priority', async () => {
    const shown = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            CardMeta,
            {},
            shown.value
              ? { avatar: () => 'Avatar', title: () => 'Title', description: () => 'Description' }
              : {},
          ),
      }),
    );
    mounted.push(wrapper);
    shown.value = true;
    await nextTick();
    expect(wrapper.get('.apollo-card-meta-avatar').text()).toBe('Avatar');
    expect(wrapper.get('.apollo-card-meta-description').text()).toBe('Description');
    shown.value = false;
    await nextTick();
    expect(wrapper.find('.apollo-card-meta-section').exists()).toBe(false);
    expect(wrapper.find('.apollo-card-meta-avatar').exists()).toBe(false);
  });

  it('uses default as a description fallback and preserves explicit 0/null/false and empty description slots', async () => {
    const wrapper = mount(CardMeta, { slots: { default: () => 'Default description' } });
    mounted.push(wrapper);
    expect(wrapper.get('.apollo-card-meta-description').text()).toBe('Default description');
    await wrapper.setProps({ description: 0 });
    expect(wrapper.get('.apollo-card-meta-description').text()).toBe('0');
    await wrapper.setProps({ description: null });
    expect(wrapper.text()).not.toContain('Default description');
    await wrapper.setProps({ description: false });
    expect(wrapper.text()).not.toContain('Default description');
    const empty = mount(CardMeta, {
      props: { description: 'Data description' },
      slots: { default: () => 'Default description', description: () => [] },
    });
    mounted.push(empty);
    expect(empty.text()).not.toContain('description');
  });
});
