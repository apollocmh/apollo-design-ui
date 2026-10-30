import type { ThemeConfig } from '@apollo-design/theme';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef, type VNodeChild } from 'vue';
import { ConfigProvider } from '../../config-provider';
import type { ConfigProviderProps } from '../../config-provider/interface';
import type { TreeSelectDataNode, TreeSelectProps } from '../interface';
import TreeSelect from '../TreeSelect';
import NativeContracts from './fixtures/NativeContracts.vue';

const data = [
  { value: 'parent', title: 'Parent', children: [{ value: 0, title: 'Zero' }] },
  { value: 'other', title: 'Other', isLeaf: true },
];
const settle = async () => {
  await nextTick();
  await nextTick();
};
const clickNode = async (text: string) => {
  const node = Array.from(document.querySelectorAll<HTMLElement>('.apollo-tree-select-title'))
    .find((item) => item.textContent === text)
    ?.closest<HTMLElement>('.apollo-tree-select-node-content-wrapper');
  expect(node).toBeTruthy();
  node?.click();
  await settle();
};

afterEach(() => {
  document.body.innerHTML = '';
});

it('owned notifications use emits once; change listeners never alter model values', async () => {
  const change = vi.fn();
  const options = {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { treeData: data, treeCheckable: true, defaultOpen: true, treeDefaultExpandAll: true },
  };
  const plain = mount(TreeSelect, options);
  await settle();
  document.querySelector<HTMLElement>('[role="checkbox"]')?.click();
  await settle();
  expect(plain.emitted('update:value')).toEqual([[[0]]]);
  expect(plain.emitted('change')).toHaveLength(1);
  plain.unmount();
  const listened = mount(TreeSelect, { ...options, attrs: { onChange: change } });
  await settle();
  document.querySelector<HTMLElement>('[role="checkbox"]')?.click();
  await settle();
  expect(listened.emitted('update:value')).toEqual([[[0]]]);
  expect(listened.emitted('change')).toHaveLength(1);
  expect(change).toHaveBeenCalledTimes(1);
  expect(change.mock.calls[0]?.[2].preValue).toEqual([]);
  listened.unmount();
});

it('search object algorithms, initial keyboard activation and numeric zero are consumed', async () => {
  const filter = vi.fn((input: string, node: { title?: unknown }) => node.title === input);
  const wrapper = mount(TreeSelect, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      treeData: data,
      defaultOpen: true,
      treeDefaultExpandAll: true,
      showSearch: { filterTreeNode: filter, autoClearSearchValue: false },
    },
  });
  await settle();
  await wrapper.get('input').setValue('Zero');
  await settle();
  expect(filter).toHaveBeenCalled();
  expect(document.querySelectorAll('[role="treeitem"]')).toHaveLength(2);
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  expect(wrapper.emitted('update:value')).toEqual([[0]]);
  expect(wrapper.emitted('update:searchValue')).toEqual([['Zero']]);
  wrapper.unmount();
});

it('controlled keyboard requests are emitted once and composition never selects', async () => {
  const keydown = vi.fn();
  const wrapper = mount(TreeSelect, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { treeData: [{ value: 0, title: 'Zero' }], open: true },
    attrs: { onKeydown: keydown },
  });
  await settle();
  await wrapper.get('input').trigger('keydown', { key: 'Enter', isComposing: true });
  expect(wrapper.emitted('update:value')).toBeUndefined();
  await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  expect(wrapper.emitted('update:value')).toEqual([[0]]);
  expect(wrapper.emitted('openChange')).toEqual([[false]]);
  expect(wrapper.emitted('update:open')).toEqual([[false]]);
  expect(keydown).toHaveBeenCalledTimes(2);
  wrapper.unmount();
});

it('standalone Tree presentation configuration stays outside the TreeSelect popup', async () => {
  const wrapper = mount(ConfigProvider, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { components: { tree: { className: 'standalone-tree-config' } } },
    slots: { default: () => h(TreeSelect, { treeData: data, open: true }) },
  });
  await settle();
  expect(
    document
      .querySelector('[role="tree"]')
      ?.parentElement?.classList.contains('standalone-tree-config'),
  ).toBe(false);
  wrapper.unmount();
});

it('slots, native attrs and Provider replacement stay current; the real ref is exposed', async () => {
  const currentClass = ref('first-native');
  const currentStyle = ref('color: red');
  const content = ref(true);
  const components = ref<ConfigProviderProps['components']>({
    treeSelect: { className: 'provided' },
  });
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { components: components.value }, () =>
          h(
            TreeSelect,
            {
              treeData: data,
              defaultOpen: true,
              treeDefaultExpandAll: true,
              class: [currentClass.value, { objectClass: true }],
              style: currentStyle.value,
              'data-native': 'root',
              'aria-label': 'Choose node',
            },
            {
              treeTitleRender: ({ node }: { node: { value?: string | number } }) =>
                content.value ? h('b', { class: 'native-title' }, String(node.value)) : 0,
              suffixIcon: () =>
                content.value ? h('span', { class: 'native-suffix' }, 'Suffix') : [],
              notFoundContent: () => 0,
            },
          ),
        ),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  await settle();
  const root = wrapper.get('.apollo-tree-select');
  const input = wrapper.get<HTMLInputElement>('input').element;
  expect(root.classes()).toContain('provided');
  expect(root.classes()).toContain('objectClass');
  expect(document.querySelector('.native-title')).toBeTruthy();
  expect(wrapper.find('.native-suffix').exists()).toBe(true);
  currentClass.value = 'second-native';
  currentStyle.value = 'color: blue';
  components.value = { treeSelect: { className: 'replacement' } };
  content.value = false;
  await settle();
  expect(root.classes()).not.toContain('first-native');
  expect(root.classes()).toContain('second-native');
  expect(root.classes()).toContain('replacement');
  expect(root.attributes('style')).toContain('blue');
  expect(wrapper.get('input').element).toBe(input);
  expect(wrapper.find('.native-suffix').exists()).toBe(false);
  expect(document.querySelector('.apollo-tree-select-title')?.textContent).toBe('0');
  const instance = wrapper.getComponent(TreeSelect).vm;
  expect(instance.nativeElement).toBe(root.element);
  instance.focus({ preventScroll: true });
  expect(document.activeElement).toBe(input);
  instance.blur();
  wrapper.unmount();
});

it('single controlled selection rejection keeps the accepted display and reports one proposal', async () => {
  const wrapper = mount(TreeSelect, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { treeData: data, value: 'other', open: true, treeDefaultExpandAll: true },
  });
  await settle();
  await clickNode('Zero');
  expect(wrapper.emitted('update:value')).toEqual([[0]]);
  expect(wrapper.emitted('change')).toHaveLength(1);
  expect(wrapper.emitted('select')).toEqual([[0, expect.objectContaining({ value: 0 })]]);
  expect(wrapper.get('.apollo-tree-select-content').text()).toBe('Other');
  await wrapper.setProps({ value: 0 });
  expect(wrapper.get('.apollo-tree-select-content').text()).toBe('Zero');
  await wrapper.setProps({ value: undefined });
  expect(wrapper.get('.apollo-tree-select-content').text()).toBe('Zero');
  wrapper.unmount();
});

it('retains data-title callbacks for both selected labels and current tree nodes', async () => {
  const title = vi.fn((node: TreeSelectDataNode) =>
    h('b', { class: 'data-title' }, String(node.value)),
  );
  const wrapper = mount(TreeSelect, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { treeData: [{ value: 0, title }], value: 0, open: true },
  });
  await settle();
  expect(wrapper.get('.apollo-tree-select-content .data-title').text()).toBe('0');
  expect(document.querySelector('.apollo-tree-select-title .data-title')?.textContent).toBe('0');
  expect(title.mock.calls.every(([node]) => node.value === 0)).toBe(true);
  wrapper.unmount();
});

it('mapped numeric zero enters the raw-value chain and keeps its label when data is removed', async () => {
  const wrapper = mount(TreeSelect, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      treeData: [{ code: 0, name: 'Mapped zero' }],
      fieldNames: { value: 'code', label: 'name' },
      defaultOpen: true,
    },
  });
  await settle();
  await clickNode('Mapped zero');
  expect(wrapper.emitted('update:value')).toEqual([[0]]);
  expect(wrapper.get('.apollo-tree-select-content').text()).toBe('Mapped zero');
  await wrapper.setProps({ treeData: [] });
  expect(wrapper.get('.apollo-tree-select-content').text()).toBe('Mapped zero');
  wrapper.unmount();
});

it('the raw trigger keeps complete arrays and numeric zero in the same native host', async () => {
  const content = shallowRef<VNodeChild>([h('b', 'First'), 0, h('i', 'Last')]);
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(TreeSelect, { class: 'complete-raw', treeData: data }, { default: () => content.value }),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  const host = wrapper.get('.complete-raw').element;
  expect(host.textContent).toBe('First0Last');
  content.value = 0;
  await settle();
  expect(wrapper.get('.complete-raw').element).toBe(host);
  expect(host.textContent).toBe('0');
  const instance = wrapper.getComponent(TreeSelect).vm;
  expect(instance.nativeElement).toBe(host);
  instance.focus();
  expect(document.activeElement).toBe(host);
  await wrapper.get('.complete-raw').trigger('click');
  await settle();
  expect(document.querySelector('[role="tree"]')).toBeTruthy();
  wrapper.unmount();
});

it('semantic functions see current public props; shared token and Provider removal update both hosts', async () => {
  const seen: unknown[] = [];
  const currentValue = ref('other');
  const components = ref<ConfigProviderProps['components']>({
    treeSelect: {
      className: 'provider-current',
      allowClear: true,
      showSearch: true,
      styles: ({ props }: { props: Readonly<TreeSelectProps> }) => {
        seen.push(props.value);
        return { input: { color: 'red' } };
      },
    },
  });
  const theme = ref<ThemeConfig>({
    token: { controlHeight: 44 },
    components: { Tree: { titleHeight: 32 }, Select: { zIndexPopup: 0 } },
  });
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { components: components.value, theme: theme.value }, () =>
          h(TreeSelect, {
            treeData: data,
            value: currentValue.value,
            defaultOpen: true,
            styles: { root: { color: 'blue' } },
          }),
        ),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  await settle();
  expect(seen.length).toBeGreaterThan(0);
  expect(seen.every((value) => value === 'other')).toBe(true);
  const initialCalls = seen.length;
  const root = wrapper.get<HTMLElement>('.apollo-tree-select').element;
  const input = wrapper.get<HTMLInputElement>('input').element;
  expect(root.style.color).toBe('blue');
  expect(root.style.getPropertyValue('--apollo-control-height')).toBe('44px');
  expect(input.style.color).toBe('red');
  expect(wrapper.find('.apollo-tree-select-clear').exists()).toBe(true);
  const popup = document.querySelector<HTMLElement>('.apollo-tree-select-dropdown');
  expect(popup?.style.getPropertyValue('--apollo-tree-title-height')).toBe('32px');
  expect(popup?.style.zIndex).toBe('0');
  currentValue.value = 'parent';
  await settle();
  expect(seen.slice(initialCalls)).toEqual(['parent']);
  components.value = {};
  theme.value = { components: { Tree: { titleHeight: 36 }, Select: { zIndexPopup: 1600 } } };
  await settle();
  expect(root.classList.contains('provider-current')).toBe(false);
  expect(input.style.color).toBe('');
  expect(wrapper.find('.apollo-tree-select-clear').exists()).toBe(false);
  expect(popup?.style.getPropertyValue('--apollo-tree-title-height')).toBe('36px');
  expect(popup?.style.zIndex).toBe('1600');
  expect(wrapper.get('input').element).toBe(input);
  wrapper.unmount();
});

it('async load and expansion use model proposals, stable Tree nodes, and current loaded children', async () => {
  let resolveLoad: (() => void) | undefined;
  const nodes = shallowRef<TreeSelectDataNode[]>([{ value: 'parent', title: 'Parent' }]);
  const expanded = ref<(string | number)[]>([]);
  const loaded = ref<(string | number)[]>([]);
  const load = vi.fn(
    (_node: TreeSelectDataNode) =>
      new Promise<void>((resolve) => {
        resolveLoad = resolve;
      }),
  );
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(TreeSelect, {
          treeData: nodes.value,
          defaultOpen: true,
          treeExpandedKeys: expanded.value,
          treeLoadedKeys: loaded.value,
          loadData: load,
          'onUpdate:treeExpandedKeys': (keys) => {
            expanded.value = keys;
          },
          'onUpdate:treeLoadedKeys': (keys) => {
            loaded.value = keys;
          },
        }),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  await settle();
  const tree = document.querySelector('[role="tree"]');
  document.querySelector<HTMLElement>('.apollo-tree-select-switcher')?.click();
  await settle();
  expect(load).toHaveBeenCalledTimes(1);
  expect(load).toHaveBeenCalledWith(nodes.value[0]);
  expect(loaded.value).toEqual([]);
  nodes.value = [
    {
      value: 'parent',
      title: 'Parent',
      children: [{ value: 0, title: 'Loaded zero', isLeaf: true }],
    },
  ];
  resolveLoad?.();
  await flushPromises();
  await settle();
  expect(loaded.value).toEqual(['parent']);
  expect(expanded.value).toEqual(['parent']);
  expect(document.querySelector('[role="tree"]')).toBe(tree);
  expect(document.querySelectorAll('[role="treeitem"]')).toHaveLength(2);
  const instance = wrapper.getComponent(TreeSelect);
  expect(instance.emitted('treeLoad')).toEqual([[['parent']]]);
  expect(instance.emitted('treeExpand')).toEqual([[['parent']]]);
  wrapper.unmount();
});

it('reports the real non-bubbling popup scroll once', async () => {
  const wrapper = mount(TreeSelect, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { treeData: data, open: true, treeDefaultExpandAll: true },
  });
  await settle();
  const event = new Event('scroll', { bubbles: false });
  const holder = document.querySelector('.apollo-tree-select-list-holder');
  if (!holder) throw new Error('Expected the real popup scroll holder');
  holder.dispatchEvent(event);
  expect(wrapper.emitted('popupScroll')).toEqual([[event]]);
  wrapper.unmount();
});

it('strict checks preserve halfChecked metadata and do not announce a rejected maxCount selection', async () => {
  const wrapper = mount(TreeSelect, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      treeData: data,
      treeCheckable: true,
      treeCheckStrictly: true,
      defaultOpen: true,
      defaultValue: [{ value: 'parent', halfChecked: true }],
      maxCount: 1,
      treeDefaultExpandAll: true,
    },
  });
  await settle();
  await clickNode('Zero');
  expect(wrapper.emitted('update:value')?.[0]?.[0]).toEqual([
    { value: 0, label: 'Zero', halfChecked: undefined, disabled: undefined },
    { value: 'parent', label: 'Parent', halfChecked: true, disabled: undefined },
  ]);
  await clickNode('Other');
  expect(wrapper.emitted('update:value')).toHaveLength(1);
  expect(wrapper.emitted('select')).toHaveLength(1);
  wrapper.unmount();
});

it('the documented raw trigger slot and actual public SFC constructor are usable', async () => {
  const raw = mount(TreeSelect, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { treeData: data },
    attrs: { class: 'raw-native', style: 'color:red' },
    slots: { default: () => h('button', { type: 'button', class: 'raw-trigger' }, 'Choose') },
  });
  expect(raw.find('input').exists()).toBe(false);
  expect(raw.get('button').classes()).toContain('raw-native');
  expect(raw.get('button').attributes('style')).toContain('red');
  await raw.get('button').trigger('click');
  await settle();
  expect(raw.emitted('openChange')).toEqual([[true]]);
  expect(document.querySelector('[role="tree"]')).toBeTruthy();
  raw.unmount();
  const fixture = mount(NativeContracts, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  await settle();
  expect(fixture.get('input').attributes('aria-label')).toBe('TreeSelect contract');
  fixture.unmount();
});
