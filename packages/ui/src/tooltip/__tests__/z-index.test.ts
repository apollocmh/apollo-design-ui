import { ZINDEX_KEY } from '@apollo-design/portal';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type CSSProperties,
  defineComponent,
  h,
  inject,
  nextTick,
  reactive,
  ref,
  type StyleValue,
  type VNode,
} from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Popconfirm from '../../popconfirm/Popconfirm';
import Popover from '../../popover/Popover';
import Tooltip from '../Tooltip';

interface LayerProps {
  zIndex?: number;
  styles?: { root?: CSSProperties };
  overlayStyle?: CSSProperties;
  style?: StyleValue;
  classNames: { root: string };
}

const consumers: {
  name: string;
  key: 'tooltip' | 'popover' | 'popconfirm';
  defaultContext: number;
  render: (props: LayerProps, content: () => VNode) => VNode;
}[] = [
  {
    name: 'Tooltip',
    key: 'tooltip',
    defaultContext: 1170,
    render: (props, content) =>
      h(
        Tooltip,
        { ...props, open: true },
        {
          default: () => h('button', 'Outer target'),
          title: content,
        },
      ),
  },
  {
    name: 'Popover',
    key: 'popover',
    defaultContext: 1130,
    render: (props, content) =>
      h(
        Popover,
        { ...props, open: true, title: 'Parent' },
        {
          default: () => h('button', 'Outer target'),
          content,
        },
      ),
  },
  {
    name: 'Popconfirm',
    key: 'popconfirm',
    defaultContext: 1160,
    render: (props, content) =>
      h(
        Popconfirm,
        { ...props, open: true, title: 'Confirm' },
        {
          default: () => h('button', 'Outer target'),
          description: content,
        },
      ),
  },
];

const Probe = defineComponent({
  setup() {
    const layer = inject(ZINDEX_KEY, null);
    return () => h('span', { 'data-inherited-layer': layer?.value }, 'Parent layer');
  },
});

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function settle() {
  await nextTick();
  await nextTick();
}

function popup(className: string): HTMLElement {
  const node = document.querySelector<HTMLElement>(`.${className}`);
  if (!node) throw new Error(`Missing actual popup ${className}`);
  return node;
}

function content(name: string) {
  return () =>
    h('div', [
      h(Probe),
      h(Tooltip, { open: true, title: 'Child hint', classNames: { root: `${name}-child` } }, () =>
        h('button', 'Nested target'),
      ),
    ]);
}

function expectLayer(
  name: string,
  visual: number | undefined,
  provided: number,
  child = provided + 100,
) {
  const parent = popup(name);
  expect(parent.style.zIndex).toBe(visual === undefined ? '' : String(visual));
  expect(parent.querySelector('[data-inherited-layer]')?.getAttribute('data-inherited-layer')).toBe(
    String(provided),
  );
  expect(popup(`${name}-child`).style.zIndex).toBe(String(child));
}

describe.each(consumers)('$name actual numeric root layer', (consumer) => {
  it('provides the numeric semantic root to its actual child Tooltip', async () => {
    const wrapper = mount(
      () =>
        consumer.render(
          { styles: { root: { zIndex: 2500 } }, classNames: { root: 'parent' } },
          content('parent'),
        ),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    expectLayer('parent', 2500, 2500);
  });

  it('tracks actual native/alias/semantic/Provider precedence and removal without sharing instances', async () => {
    const warning = vi.spyOn(console, 'warn');
    const provider = ref<{
      style?: CSSProperties;
      styles?: { root?: CSSProperties };
    }>({ style: { zIndex: 1500 }, styles: { root: { zIndex: 1400 } } });
    const explicit = ref<number | undefined>(1300);
    const semantic = ref<{ root?: CSSProperties }>({ root: { zIndex: 1700 } });
    const overlay = ref<CSSProperties | undefined>({ zIndex: 1800 });
    const native = ref<StyleValue>(['padding: 2px; z-index: 1900', { color: 'red' }]);
    const objectStyle = reactive<CSSProperties>({ zIndex: 2100, padding: '3px' });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { components: { [consumer.key]: provider.value } }, () => [
            consumer.render(
              {
                zIndex: explicit.value,
                styles: semantic.value,
                overlayStyle: overlay.value,
                style: native.value,
                classNames: { root: 'current' },
              },
              content('current'),
            ),
            consumer.render(
              { style: { zIndex: 4400 }, classNames: { root: 'independent' } },
              content('independent'),
            ),
          ]),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    const original = popup('current');
    const originalChild = popup('current-child');
    // A component-wide Tooltip style also applies explicitly to the child
    // Tooltip itself; Popover/Popconfirm-specific configuration does not.
    let configuredChild = consumer.key === 'tooltip' ? 1500 : undefined;
    const current = (value: number | undefined, provided: number) =>
      expectLayer('current', value, provided, configuredChild ?? provided + 100);
    current(1900, 1900);
    expectLayer('independent', 4400, 4400, configuredChild ?? 4500);
    native.value = ['color: blue', { zIndex: 2000 }];
    await settle();
    current(2000, 2000);
    native.value = objectStyle;
    await settle();
    current(2100, 2100);
    delete objectStyle.zIndex;
    await settle();
    current(1800, 1800);
    native.value = undefined;
    await settle();
    current(1800, 1800);
    native.value = false;
    await settle();
    current(1800, 1800);
    native.value = null;
    await settle();
    current(1800, 1800);
    expect(warning.mock.calls.flat().map(String).join(' ')).not.toContain(
      'Invalid prop: type check failed for prop "style"',
    );
    overlay.value = undefined;
    await settle();
    current(1700, 1700);
    semantic.value = { root: { zIndex: 0 } };
    await settle();
    current(0, 0);
    semantic.value = {};
    await settle();
    current(1500, 1500);
    provider.value = { styles: { root: { zIndex: 1400 } } };
    configuredChild = consumer.key === 'tooltip' ? 1400 : undefined;
    await settle();
    current(1400, 1400);
    provider.value = {};
    configuredChild = undefined;
    await settle();
    current(1300, 1300);
    explicit.value = 0;
    await settle();
    current(0, 0);
    explicit.value = undefined;
    await settle();
    current(undefined, consumer.defaultContext);
    expectLayer('independent', 4400, 4400);
    expect(popup('current')).toBe(original);
    expect(popup('current-child')).toBe(originalChild);
  });

  it('keeps nonnumeric CSS expressions on the existing numeric prop path', async () => {
    const wrapper = mount(
      () =>
        consumer.render(
          {
            zIndex: 1800,
            styles: { root: { zIndex: 'var(--deferred-layer)' } },
            classNames: { root: 'expression' },
          },
          content('expression'),
        ),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    expect(popup('expression').style.zIndex).toBe('var(--deferred-layer)');
    expect(
      popup('expression')
        .querySelector('[data-inherited-layer]')
        ?.getAttribute('data-inherited-layer'),
    ).toBe('1800');
    expect(popup('expression-child').style.zIndex).toBe('1900');
  });

  it.each([
    { label: 'undefined', value: undefined },
    { label: 'empty string', value: '' },
  ])(
    'withdraws a conditional $label root layer without erasing the generated fallback',
    async ({ value }) => {
      const layer = ref<CSSProperties['zIndex']>(value);
      const explicit = ref<number | undefined>(1800);
      const wrapper = mount(
        () =>
          consumer.render(
            {
              zIndex: explicit.value,
              styles: { root: { zIndex: layer.value } },
              classNames: { root: 'conditional' },
            },
            content('conditional'),
          ),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      );
      wrappers.push(wrapper);
      await settle();
      expectLayer('conditional', 1800, 1800);
      layer.value = 2500;
      await settle();
      expectLayer('conditional', 2500, 2500);
      layer.value = value;
      await settle();
      expectLayer('conditional', 1800, 1800);
      explicit.value = 0;
      await settle();
      expectLayer('conditional', 0, 0);
      explicit.value = undefined;
      await settle();
      expectLayer('conditional', undefined, consumer.defaultContext);
    },
  );

  it('follows the final native camel/hyphen property write order', async () => {
    const native = ref<StyleValue>([{ zIndex: 2500 }, 'z-index: 2600']);
    const wrapper = mount(
      () =>
        consumer.render(
          {
            styles: { root: { zIndex: 1400 } },
            style: native.value,
            classNames: { root: 'aliases' },
          },
          content('aliases'),
        ),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    expectLayer('aliases', 2600, 2600);
    // Vue's final normalized object keeps the earlier camel key in its original
    // position; the later hyphen key is the actual last DOM property write.
    native.value = ['z-index: 2700', { zIndex: 2800 }];
    await settle();
    expectLayer('aliases', 2700, 2700);
    native.value = 'z-index: 0';
    await settle();
    expectLayer('aliases', 0, 0);
    native.value = undefined;
    await settle();
    expectLayer('aliases', 1400, 1400);
  });
});

it('keeps a Popover → Popconfirm → Tooltip chain aligned after conditional root withdrawal', async () => {
  const layer = ref<CSSProperties['zIndex']>(2500);
  const wrapper = mount(
    () =>
      h(
        Popover,
        {
          open: true,
          styles: { root: { zIndex: layer.value } },
          classNames: { root: 'combo-popover' },
        },
        {
          default: () => h('button', 'Outer'),
          content: () =>
            h(
              Popconfirm,
              {
                open: true,
                title: 'Confirm',
                styles: { root: { zIndex: undefined } },
                classNames: { root: 'combo-confirm' },
              },
              {
                default: () => h('button', 'Confirm target'),
                description: content('combo-confirm'),
              },
            ),
        },
      ),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  wrappers.push(wrapper);
  await settle();
  expectLayer('combo-confirm', 2600, 2600);
  layer.value = 0;
  await settle();
  expectLayer('combo-confirm', 100, 100);
  layer.value = undefined;
  await settle();
  expectLayer('combo-confirm', 1230, 1230);
});
