import { useZIndex, ZINDEX_KEY } from '@apollo-design/portal';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { computed, defineComponent, h, inject, nextTick, provide, ref, type VNode } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { ConfigProviderThemeConfig } from '../../config-provider/hooks/use-theme';
import DatePicker from '../../date-picker/DatePicker.vue';
import RangePicker from '../../date-picker/RangePicker.vue';
import Dropdown from '../../dropdown/Dropdown';
import Preview from '../../image/Preview';
import Mentions from '../../mentions/Mentions';
import TreeSelect from '../../tree-select/TreeSelect';

const Probe = defineComponent({
  setup() {
    const parent = inject(ZINDEX_KEY, null);
    const child = useZIndex('Tooltip');
    return () =>
      h(
        'span',
        {
          'data-parent-z': parent?.value,
          'data-child-z': child.value,
        },
        'Nested layer',
      );
  },
});

interface ConsumerCase {
  name: string;
  popup: string;
  base: number;
  offset: number;
  render: (custom?: number | string) => VNode;
  activate?: (wrapper: VueWrapper) => Promise<void>;
}

const consumers: ConsumerCase[] = [
  {
    name: 'Dropdown',
    popup: '.apollo-dropdown',
    base: 1050,
    offset: 50,
    render: (zIndex) =>
      h(
        Dropdown,
        { open: true, zIndex: typeof zIndex === 'number' ? zIndex : undefined },
        {
          default: () => h('button', 'Dropdown'),
          popupRender: () => h(Probe),
        },
      ),
  },
  {
    name: 'DatePicker',
    popup: '.apollo-picker-dropdown',
    base: 1050,
    offset: 50,
    render: (zIndex) =>
      h(
        DatePicker,
        {
          open: true,
          styles: { popup: { root: { zIndex } } },
        },
        { extraFooter: () => h(Probe) },
      ),
  },
  {
    name: 'RangePicker',
    popup: '.apollo-picker-dropdown',
    base: 1050,
    offset: 50,
    render: (zIndex) =>
      h(
        RangePicker,
        {
          open: true,
          styles: { popup: { root: { zIndex } } },
        },
        { extraFooter: () => h(Probe) },
      ),
  },
  {
    name: 'TreeSelect',
    popup: '.apollo-tree-select-dropdown',
    base: 1050,
    offset: 50,
    render: (zIndex) =>
      h(TreeSelect, {
        open: true,
        treeData: [],
        popupStyle: zIndex === undefined ? {} : { zIndex },
        notFoundContent: h(Probe),
      }),
  },
  {
    name: 'Mentions',
    popup: '.apollo-mentions-dropdown',
    base: 1050,
    offset: 50,
    render: (zIndex) =>
      h(Mentions, {
        options: [],
        styles: { popup: { zIndex } },
        notFoundContent: h(Probe),
      }),
    activate: async (wrapper) => {
      const textarea = wrapper.get('textarea');
      await textarea.setValue('@');
      textarea.element.setSelectionRange(1, 1);
      await textarea.trigger('keyup', { key: '@' });
    },
  },
  {
    name: 'ImagePreview',
    popup: '.apollo-image-preview',
    base: 1080,
    offset: 1,
    render: (zIndex) =>
      h(
        Preview,
        {
          open: true,
          prefixCls: 'apollo-image-preview',
          styles: { root: zIndex === undefined ? {} : { zIndex } },
        },
        { previewImage: () => h(Probe) },
      ),
  },
];

const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
});
const settle = async () => {
  await nextTick();
  await nextTick();
};
function layer(consumer: ConsumerCase, expected: number) {
  const popup = document.querySelector<HTMLElement>(consumer.popup);
  if (!popup) throw new Error(`Expected actual ${consumer.name} popup`);
  expect(popup.style.zIndex).toBe(String(expected));
  const probe = popup.querySelector('[data-parent-z]');
  expect(probe?.getAttribute('data-parent-z')).toBe(String(expected));
  expect(probe?.getAttribute('data-child-z')).toBe(String(expected + 100));
}

describe.each(consumers)('$name numeric visual and descendant context', (consumer) => {
  it('uses its actual top-level CSS base and follows explicit zero, replacement and removal', async () => {
    const custom = ref<number>();
    const Host = defineComponent({ setup: () => () => consumer.render(custom.value) });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await consumer.activate?.(wrapper);
    await settle();
    layer(consumer, consumer.base);
    custom.value = 0;
    await settle();
    layer(consumer, 0);
    custom.value = 2060;
    await settle();
    layer(consumer, 2060);
    custom.value = undefined;
    await settle();
    layer(consumer, consumer.base);
  });

  it('inherits a zero parent and current parent without adding the top-level CSS base', async () => {
    const parent = ref(0);
    const custom = ref<number>();
    const Host = defineComponent({
      setup() {
        provide(
          ZINDEX_KEY,
          computed(() => parent.value),
        );
        return () => consumer.render(custom.value);
      },
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await consumer.activate?.(wrapper);
    await settle();
    layer(consumer, consumer.offset);
    parent.value = 1800;
    await settle();
    layer(consumer, 1800 + consumer.offset);
    custom.value = 0;
    await settle();
    layer(consumer, 0);
    custom.value = undefined;
    await settle();
    layer(consumer, 1800 + consumer.offset);
  });
});

it.each(consumers.filter(({ name }) => name === 'Mentions' || name === 'ImagePreview'))(
  '$name uses the same current component Token for CSS and numeric context',
  async (consumer) => {
    const theme = ref<ConfigProviderThemeConfig>({
      components: { Mentions: { zIndexPopup: '3060' }, Image: { zIndexPopup: 3080 } },
    });
    const Host = defineComponent({
      setup: () => () => h(ConfigProvider, { theme: theme.value }, () => consumer.render()),
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await consumer.activate?.(wrapper);
    await settle();
    layer(consumer, consumer.name === 'Mentions' ? 3060 : 3080);
    theme.value = {
      components: { Mentions: { zIndexPopup: '4060' }, Image: { zIndexPopup: 4080 } },
    };
    await settle();
    layer(consumer, consumer.name === 'Mentions' ? 4060 : 4080);
    theme.value = { token: { zIndexPopupBase: 4000 } };
    await settle();
    layer(consumer, consumer.name === 'Mentions' ? 4050 : 4080);
    theme.value = {};
    await settle();
    layer(consumer, consumer.base);
  },
);

it.each(consumers.filter(({ name }) => name !== 'Dropdown'))(
  '$name shares an explicit numeric CSS string with descendants',
  async (consumer) => {
    const wrapper = mount(defineComponent({ setup: () => () => consumer.render('2060') }), {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await consumer.activate?.(wrapper);
    await settle();
    layer(consumer, 2060);
  },
);

it('TreeSelect semantic popup style enters the same numeric context', async () => {
  const wrapper = mount(TreeSelect, {
    attachTo: document.body,
    props: {
      open: true,
      treeData: [],
      styles: { popup: { root: { zIndex: 2060 } } },
      notFoundContent: h(Probe),
    },
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  await settle();
  const consumer = consumers.find(({ name }) => name === 'TreeSelect');
  if (!consumer) throw new Error('Expected TreeSelect case');
  layer(consumer, 2060);
});

it('Mentions preserves CSS expressions without throwing or replacing them with a numeric default', async () => {
  const explicit = ref<string>();
  const Host = defineComponent({
    setup: () => () =>
      h(
        ConfigProvider,
        {
          theme: { components: { Mentions: { zIndexPopup: 'var(--consumer-layer)' } } },
        },
        () =>
          h(Mentions, {
            options: [],
            styles: { popup: { zIndex: explicit.value } },
            notFoundContent: h(Probe),
          }),
      ),
  });
  const wrapper = mount(Host, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  const consumer = consumers.find(({ name }) => name === 'Mentions');
  if (!consumer) throw new Error('Expected Mentions case');
  await consumer.activate?.(wrapper);
  await settle();
  const popup = document.querySelector<HTMLElement>('.apollo-mentions-dropdown');
  if (!popup) throw new Error('Expected Mentions popup');
  expect(popup.style.getPropertyValue('--apollo-mentions-z-index-popup')).toBe(
    'var(--consumer-layer)',
  );
  expect(popup.style.zIndex).toBe('');
  explicit.value = 'var(--semantic-layer)';
  await settle();
  expect(popup.style.zIndex).toBe('var(--semantic-layer)');
});
