import {
  compactAlgorithm,
  darkAlgorithm,
  getDesignToken,
  ThemeProvider,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  createApp,
  createTextVNode,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  ref,
  type VNodeChild,
} from 'vue';
import { Button } from '../../button';
import { Cascader } from '../../cascader';
import { ColorPicker } from '../../color-picker';
import { ConfigProvider } from '../../config-provider';
import type { SizeType } from '../../config-provider/size-context';
import { DatePicker, RangePicker } from '../../date-picker';
import { Input, InputSearch, TextArea } from '../../input';
import { InputNumber } from '../../input-number';
import { Select } from '../../select';
import { TreeSelect } from '../../tree-select';
import {
  NoCompactStyle,
  Space,
  SpaceAddon,
  SpaceCompact,
  type SpaceConfig,
  useSpaceContext,
} from '../index';

describe('Space contracts · current render and Provider (SPACE-01/02)', () => {
  it('adds, replaces and removes the default slot after an empty first render', async () => {
    const mode = ref(0);
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(
            Space,
            null,
            mode.value === 0
              ? {}
              : {
                  default: (() => {
                    const text = `current-${mode.value}`;
                    return () => [h('b', text), 0];
                  })(),
                },
          ),
      }),
    );
    expect(host.find('.apollo-space').exists()).toBe(false);
    for (const value of [1, 2, 0, 3]) {
      mode.value = value;
      await nextTick();
      expect(host.find('.apollo-space').exists()).toBe(value !== 0);
      if (value) expect(host.text()).toBe(`current-${value}0`);
    }
    host.unmount();
  });

  it('reads conditional separator slots during render, including intentionally empty slots', async () => {
    const mode = ref(0);
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(
            Space,
            { separator: 'fallback' },
            {
              default: () => ['a', 'b'],
              ...(mode.value === 0
                ? {}
                : { separator: () => (mode.value === 2 ? [] : [h('b', 'rich'), 0]) }),
            },
          ),
      }),
    );
    expect(host.get('.apollo-space-item-separator').text()).toBe('fallback');
    for (const value of [1, 2, 0, 1]) {
      mode.value = value;
      await nextTick();
      expect(host.findAll('.apollo-space-item-separator')).toHaveLength(value === 2 ? 0 : 1);
      if (value !== 2)
        expect(host.get('.apollo-space-item-separator').text()).toBe(value ? 'rich0' : 'fallback');
    }
    host.unmount();
  });

  it('retains valid VNode separator/split data and numeric zero without evaluating callbacks', async () => {
    const host = mount(Space, {
      props: { separator: [h('strong', 'Data'), 0] },
      slots: { default: () => ['a', 'b', 'c'] },
    });
    expect(host.findAll('.apollo-space-item-separator strong')).toHaveLength(2);
    expect(host.get('.apollo-space-item-separator').text()).toBe('Data0');
    await host.setProps({ separator: 0 });
    expect(host.findAll('.apollo-space-item-separator')).toHaveLength(2);
    expect(host.get('.apollo-space-item-separator').text()).toBe('0');
    await host.setProps({ separator: false });
    expect(host.findAll('.apollo-space-item-separator')).toHaveLength(0);
    host.unmount();
  });

  it('replaces/removes all configured root and semantic fields without recreating business inputs', async () => {
    const config = ref<SpaceConfig | undefined>({
      size: 'large',
      className: 'provider-old',
      style: { color: 'red' },
      classNames: { item: 'item-old', separator: 'separator-old' },
      styles: { item: { padding: '3px' }, separator: { color: 'red' } },
    });
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { components: config.value ? { space: config.value } : {} }, () =>
            h(Space, { separator: '|', class: 'native', style: { marginTop: '2px' } }, () => [
              h('input', { 'aria-label': 'Draft' }),
              'b',
            ]),
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    const input = host.get<HTMLInputElement>('input');
    await input.setValue('Saved draft');
    input.element.focus();
    config.value = {
      size: 12,
      className: 'provider-new',
      style: { color: 'blue' },
      classNames: { item: 'item-new', separator: 'separator-new' },
      styles: { item: { padding: '5px' }, separator: { color: 'blue' } },
    };
    await nextTick();
    const root = host.get<HTMLElement>('.apollo-space');
    expect(root.classes()).toContain('provider-new');
    expect(root.classes()).not.toContain('provider-old');
    expect(root.element.style.color).toBe('blue');
    expect(root.element.style.columnGap).toBe('12px');
    expect(root.classes()).toContain('native');
    expect(host.get('.apollo-space-item').classes()).toContain('item-new');
    expect(host.get<HTMLElement>('.apollo-space-item').element.style.padding).toBe('5px');
    expect(host.get('.apollo-space-item-separator').classes()).toContain('separator-new');
    config.value = undefined;
    await nextTick();
    expect(root.classes()).not.toContain('provider-new');
    expect(root.element.style.color).toBe('');
    expect(host.get<HTMLElement>('.apollo-space-item').element.style.padding).toBe('');
    expect(root.classes()).toContain('apollo-space-gap-row-small');
    expect(host.get('input').element).toBe(input.element);
    expect(input.element.value).toBe('Saved draft');
    expect(document.activeElement).toBe(input.element);
    host.unmount();
  });
});

describe('Space and Compact · stable identity (SPACE-03)', () => {
  for (const component of [Space, SpaceCompact]) {
    it(`${component.name}: appearance changes preserve an unkeyed editor`, async () => {
      const mounts = vi.fn();
      const Editor = defineComponent({
        setup() {
          onMounted(mounts);
          return () => h('input', { 'aria-label': 'Editor' });
        },
      });
      const prefix = ref<string>();
      const active = ref(false);
      const host = mount(
        defineComponent({
          setup: () => () =>
            h(
              component,
              {
                prefixCls: prefix.value,
                ...(component === Space
                  ? { classNames: { item: active.value ? 'updated' : 'initial' } }
                  : {}),
              },
              () => [h(Editor), h('span', 'tail')],
            ),
        }),
        { attachTo: document.body },
      );
      const input = host.get<HTMLInputElement>('input');
      await input.setValue('Saved draft');
      input.element.focus();
      active.value = true;
      await nextTick();
      prefix.value = 'custom-space';
      await nextTick();
      expect(host.get('input').element).toBe(input.element);
      expect(input.element.value).toBe('Saved draft');
      expect(document.activeElement).toBe(input.element);
      expect(mounts).toHaveBeenCalledTimes(1);
      host.unmount();
    });

    it(`${component.name}: Symbol keys preserve editors through reorder`, async () => {
      const keys = [Symbol('a'), Symbol('b')];
      const reverse = ref(false);
      const host = mount(
        defineComponent({
          setup: () => () =>
            h(component, null, () => {
              const nodes = keys.map((key, index) =>
                h('input', { key, 'aria-label': `Draft ${index}` }),
              );
              return reverse.value ? nodes.reverse() : nodes;
            }),
        }),
        { attachTo: document.body },
      );
      const input = host.get<HTMLInputElement>('[aria-label="Draft 0"]');
      await input.setValue('Saved keyed draft');
      input.element.focus();
      reverse.value = true;
      await nextTick();
      expect(host.get('[aria-label="Draft 0"]').element).toBe(input.element);
      expect(input.element.value).toBe('Saved keyed draft');
      expect(document.activeElement).toBe(input.element);
      host.unmount();
    });

    it(`${component.name}: keyed Fragment scopes preserve nested editors through reorder`, async () => {
      const reverse = ref(false);
      const keys = [Symbol('group-a'), Symbol('group-b')];
      const host = mount(
        defineComponent({
          setup: () => () =>
            h(component, null, () => {
              const groups = keys.map((key, index) =>
                h(Fragment, { key }, [
                  h('input', { key: 'shared-child-key', 'aria-label': `Group ${index}` }),
                ]),
              );
              return reverse.value ? groups.reverse() : groups;
            }),
        }),
        { attachTo: document.body },
      );
      const input = host.get<HTMLInputElement>('[aria-label="Group 0"]');
      await input.setValue('Fragment draft');
      reverse.value = true;
      await nextTick();
      expect(host.get('[aria-label="Group 0"]').element).toBe(input.element);
      expect(input.element.value).toBe('Fragment draft');
      host.unmount();
    });
  }

  it('Compact ignores empty text when assigning real control edge classes', () => {
    const host = mount(SpaceCompact, {
      slots: {
        default: () => [createTextVNode(''), h(Input, { 'aria-label': 'Only control' }), ''],
      },
    });
    expect(host.get('input').classes()).toContain('apollo-input-compact-first-item');
    expect(host.get('input').classes()).toContain('apollo-input-compact-last-item');
    host.unmount();
  });

  it('keeps public install names and static component aliases', () => {
    const app = createApp(() => null);
    app.use(Space);
    app.use(SpaceCompact);
    app.use(SpaceAddon);
    expect(app.component('ASpace')).toBe(Space);
    expect(app.component('ASpaceCompact')).toBe(Space.Compact);
    expect(app.component('ASpaceAddon')).toBe(Space.Addon);
  });

  it('keeps the public latestIndex context current for dynamic content', async () => {
    const count = ref(3);
    const Probe = defineComponent({
      setup() {
        const context = useSpaceContext();
        return () => h('output', String(context.value.latestIndex));
      },
    });
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(Space, { separator: '|' }, () => [
            h(Probe, { key: 'probe' }),
            ...Array.from({ length: count.value }, (_, i) => h('span', { key: i }, i)),
            null,
          ]),
      }),
    );
    expect(host.get('output').text()).toBe('3');
    count.value = 0;
    await nextTick();
    expect(host.get('output').text()).toBe('0');
    expect(host.findAll('.apollo-space-item-separator')).toHaveLength(0);
    host.unmount();
  });
});

describe('Space family · scoped aliases and real consumers (SPACE-04/05)', () => {
  it('writes current scoped alias values to Space and Addon and removes stale overrides', async () => {
    const mode = ref(true);
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(
            ThemeProvider,
            {
              theme: mode.value
                ? {
                    algorithm: [darkAlgorithm, compactAlgorithm],
                    token: { paddingXS: 17, colorBorder: '#345678' },
                  }
                : undefined,
            },
            () => [h(Space, null, () => ['a', 'b']), h(SpaceAddon, null, () => 'Addon')],
          ),
      }),
    );
    for (const selector of ['.apollo-space', '.apollo-space-addon']) {
      const node = host.get<HTMLElement>(selector).element;
      expect(node.style.getPropertyValue('--apollo-padding-xs')).toBe('17px');
      expect(node.style.getPropertyValue('--apollo-color-border')).toBe('#345678');
    }
    mode.value = false;
    await nextTick();
    // A mounted ThemeProvider remains an explicit source when its config becomes empty.
    const defaults = getDesignToken();
    for (const selector of ['.apollo-space', '.apollo-space-addon']) {
      const node = host.get<HTMLElement>(selector).element;
      expect(node.style.getPropertyValue('--apollo-padding-xs')).toBe(`${defaults.paddingXS}px`);
      expect(node.style.getPropertyValue('--apollo-color-border')).toBe(defaults.colorBorder);
    }
    mode.value = true;
    await nextTick();
    for (const selector of ['.apollo-space', '.apollo-space-addon']) {
      const node = host.get<HTMLElement>(selector).element;
      expect(node.style.getPropertyValue('--apollo-padding-xs')).toBe('17px');
      expect(node.style.getPropertyValue('--apollo-color-border')).toBe('#345678');
    }
    host.unmount();
  });

  it('keeps Space and Addon free of projected aliases under a ConfigProvider without a theme', () => {
    const host = mount(ConfigProvider, {
      slots: {
        default: () => [h(Space, null, () => ['a', 'b']), h(SpaceAddon, null, () => 'Addon')],
      },
    });
    for (const selector of ['.apollo-space', '.apollo-space-addon']) {
      const node = host.get<HTMLElement>(selector).element;
      expect(node.style.getPropertyValue('--apollo-padding-xs')).toBe('');
      expect(node.style.getPropertyValue('--apollo-color-border')).toBe('');
    }
    host.unmount();
  });

  const consumers: Array<{
    name: string;
    render: () => VNodeChild;
    root: string;
    small: string;
    large: string;
  }> = [
    {
      name: 'Button',
      render: () => h(Button, null, () => 'Action'),
      root: '.apollo-btn',
      small: 'apollo-btn-sm',
      large: 'apollo-btn-lg',
    },
    {
      name: 'Input',
      render: () => h(Input, { 'aria-label': 'Input' }),
      root: '.apollo-input',
      small: 'apollo-input-sm',
      large: 'apollo-input-lg',
    },
    {
      name: 'TextArea',
      render: () => h(TextArea, { 'aria-label': 'TextArea' }),
      root: '.apollo-input',
      small: 'apollo-input-sm',
      large: 'apollo-input-lg',
    },
    {
      name: 'Search',
      render: () => h(InputSearch, { 'aria-label': 'Search' }),
      root: '.apollo-input',
      small: 'apollo-input-sm',
      large: 'apollo-input-lg',
    },
    {
      name: 'InputNumber',
      render: () => h(InputNumber, { 'aria-label': 'Number' }),
      root: '.apollo-input-number',
      small: 'apollo-input-number-sm',
      large: 'apollo-input-number-lg',
    },
    {
      name: 'Select',
      render: () => h(Select, { options: [{ value: 'a', label: 'A' }], 'aria-label': 'Select' }),
      root: '.apollo-select',
      small: 'apollo-select-sm',
      large: 'apollo-select-lg',
    },
    {
      name: 'Cascader',
      render: () => h(Cascader, { options: [] }),
      root: '.apollo-cascader',
      small: 'apollo-cascader-sm',
      large: 'apollo-cascader-lg',
    },
    {
      name: 'TreeSelect',
      render: () => h(TreeSelect, { treeData: [] }),
      root: '.apollo-tree-select',
      small: 'apollo-tree-select-sm',
      large: 'apollo-tree-select-lg',
    },
    {
      name: 'DatePicker',
      render: () => h(DatePicker),
      root: '.apollo-picker',
      small: 'apollo-picker-small',
      large: 'apollo-picker-large',
    },
    {
      name: 'RangePicker',
      render: () => h(RangePicker),
      root: '.apollo-picker',
      small: 'apollo-picker-small',
      large: 'apollo-picker-large',
    },
    {
      name: 'ColorPicker',
      render: () => h(ColorPicker),
      root: '.apollo-color-picker-trigger',
      small: 'apollo-color-picker-sm',
      large: 'apollo-color-picker-lg',
    },
    {
      name: 'Addon',
      render: () => h(SpaceAddon, null, () => 'unit'),
      root: '.apollo-space-addon',
      small: 'apollo-space-addon-small',
      large: 'apollo-space-addon-large',
    },
  ];
  it.each(consumers)(
    '$name consumes current compact sizes without remounting',
    async ({ render, root, small, large }) => {
      const size = ref<SizeType>('small');
      const host = mount(
        defineComponent({ setup: () => () => h(SpaceCompact, { size: size.value }, render) }),
      );
      const element = host.get(root).element;
      expect(host.get(root).classes()).toContain(small);
      size.value = 'large';
      await nextTick();
      expect(host.get(root).element).toBe(element);
      expect(host.get(root).classes()).toContain(large);
      host.unmount();
    },
  );

  it('NoCompactStyle isolates real controls while sibling groups update independently', async () => {
    const size = ref<SizeType>('small');
    const host = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { componentSize: 'large' }, () => [
            h(SpaceCompact, { size: size.value }, () => [
              h(Input, { 'aria-label': 'Grouped' }),
              h(NoCompactStyle, null, () => h(Input, { 'aria-label': 'Isolated' })),
            ]),
            h(SpaceCompact, { size: 'small' }, () => h(Input, { 'aria-label': 'Sibling' })),
          ]),
      }),
    );
    expect(host.get('[aria-label="Grouped"]').classes()).toContain(
      'apollo-input-compact-first-item',
    );
    expect(host.get('[aria-label="Isolated"]').classes()).toContain('apollo-input-lg');
    expect(host.get('[aria-label="Isolated"]').classes()).not.toContain(
      'apollo-input-compact-item',
    );
    size.value = 'large';
    await nextTick();
    expect(host.get('[aria-label="Grouped"]').classes()).toContain('apollo-input-lg');
    expect(host.get('[aria-label="Sibling"]').classes()).toContain('apollo-input-sm');
    host.unmount();
  });
});
