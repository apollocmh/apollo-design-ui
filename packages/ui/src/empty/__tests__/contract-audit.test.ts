import { en_US, zh_CN } from '@apollo-design/locale';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCommentVNode,
  defineComponent,
  Fragment,
  h,
  nextTick,
  reactive,
  ref,
  shallowRef,
} from 'vue';
import { ConfigProvider } from '../../config-provider';
import { DefaultRenderEmpty } from '../../config-provider/default-render-empty';
import {
  Empty,
  type EmptyConfig,
  type EmptyImage,
  PRESENTED_IMAGE_DEFAULT,
  PRESENTED_IMAGE_SIMPLE,
} from '../index';

afterEach(() => vi.restoreAllMocks());

describe('Empty complete native contracts', () => {
  it.each([{ image: false }, { image: true }, { image: null }, { image: '' }, { image: [] }])(
    'treats explicit empty image data $image as empty without Vue warnings',
    ({ image }) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const w = mount(Empty, { props: { image } });
      expect(w.find('.apollo-empty-image').exists()).toBe(false);
      expect(w.get('.apollo-empty-description').text()).toBe('No data');
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it('retains numeric image zero as native content', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const w = mount(Empty, { props: { image: 0 } });
    expect(w.get('.apollo-empty-image').text()).toBe('0');
    expect(warn).not.toHaveBeenCalled();
  });

  it('renders complete image arrays and preserves caller VNode props', () => {
    const node = h('strong', { class: 'business-tail', 'data-owned': 'caller' }, 'Tail');
    const w = mount(Empty, {
      props: { image: [createCommentVNode('lead'), h('span', 'Image'), node, 0] },
    });
    expect(w.get('.apollo-empty-image').text()).toBe('ImageTail0');
    expect(node.props).toEqual({ class: 'business-tail', 'data-owned': 'caller' });
    expect(w.get('.business-tail').attributes('data-owned')).toBe('caller');
  });

  it('renders valid component definitions from ordinary reactive data without warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const picture = reactive(
      defineComponent({ setup: () => () => h('svg', { 'aria-label': 'Business picture' }) }),
    );
    const w = mount(Empty, { props: { image: picture } });
    expect(w.get('svg').attributes('aria-label')).toBe('Business picture');
    expect(warn).not.toHaveBeenCalled();
  });

  it('recognizes a VNode of the actual built-in simple component', () => {
    const w = mount(Empty, { props: { image: h(PRESENTED_IMAGE_SIMPLE) } });
    expect(w.classes()).toContain('apollo-empty-normal');
  });

  it('keeps complete existing Fragment image data', () => {
    const w = mount(Empty, {
      props: { image: h(Fragment, null, [h('span', 'Image'), h('strong', 'Tail'), 0]) },
    });
    expect(w.get('.apollo-empty-image').text()).toBe('ImageTail0');
  });

  it.each([
    { description: true },
    { description: [] },
    { description: [false, createCommentVNode('empty')] },
  ])('omits empty description data $description', ({ description }) => {
    const w = mount(Empty, { props: { description } });
    expect(w.find('.apollo-empty-description').exists()).toBe(false);
  });

  it.each(['image', 'description', 'default'])(
    'evaluates the complete %s slot once per render',
    (name) => {
      const slot = vi.fn(() => [
        createCommentVNode('lead'),
        h('span', 'First'),
        h('strong', 'Tail'),
        0,
      ]);
      const w = mount(Empty, { slots: { [name]: slot } });
      const part = name === 'default' ? 'footer' : name;
      expect(w.get(`.apollo-empty-${part}`).text()).toBe('FirstTail0');
      expect(slot).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['image', 'description', 'default'])(
    'keeps an intentionally empty %s slot empty',
    (name) => {
      const w = mount(Empty, {
        props: { description: 'Fallback' },
        slots: { [name]: () => [createCommentVNode('empty')] },
      });
      const part = name === 'default' ? 'footer' : name;
      expect(w.find(`.apollo-empty-${part}`).exists()).toBe(false);
    },
  );

  it('reads conditional captured footer VNodes during the current render', async () => {
    const show = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () => {
          const nodes = show.value ? [h('button', { key: 'create' }, 'Create')] : [];
          return h(Empty, null, { default: () => nodes });
        },
      }),
    );
    expect(w.find('.apollo-empty-footer').exists()).toBe(false);
    show.value = true;
    await nextTick();
    expect(w.get('.apollo-empty-footer button').text()).toBe('Create');
    show.value = false;
    await nextTick();
    expect(w.find('.apollo-empty-footer').exists()).toBe(false);
  });

  it('image slots own their complete business subtree and suppress the data fallback', async () => {
    const fallback = vi.fn(() => h('svg', { 'aria-label': 'Fallback' }));
    const image = shallowRef<EmptyImage>(fallback);
    const label = ref('First');
    const draft = ref('Initial');
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Empty,
            { image: image.value, description: label.value },
            {
              image: () => [
                createCommentVNode('lead'),
                h('label', [
                  'Draft',
                  h('input', {
                    'aria-label': 'Image draft',
                    value: draft.value,
                    onInput: (event: Event) => {
                      if (event.target instanceof HTMLInputElement)
                        draft.value = event.target.value;
                    },
                  }),
                ]),
                h('strong', 'Tail'),
                0,
              ],
            },
          ),
      }),
      { attachTo: document.body },
    );
    try {
      const input = w.get('input');
      await input.setValue('Saved business draft');
      input.element.focus();
      const original = input.element;
      image.value = PRESENTED_IMAGE_SIMPLE;
      label.value = 'Second';
      await nextTick();
      expect(w.get('input').element).toBe(original);
      expect(w.get('input').element.value).toBe('Saved business draft');
      expect(document.activeElement).toBe(original);
      expect(w.get('.apollo-empty-image').text()).toContain('Tail0');
      expect(w.classes()).not.toContain('apollo-empty-normal');
      expect(fallback).not.toHaveBeenCalled();
    } finally {
      w.unmount();
    }
  });

  const cases: {
    name: string;
    initial: EmptyConfig;
    next: EmptyConfig;
    read: (w: VueWrapper) => unknown;
    expected: unknown;
    fallback: unknown;
  }[] = [
    {
      name: 'className',
      initial: { className: 'first' },
      next: { className: 'second' },
      read: (w) =>
        w
          .get('.apollo-empty')
          .classes()
          .filter((c) => c === 'first' || c === 'second'),
      expected: ['second'],
      fallback: [],
    },
    {
      name: 'style',
      initial: { style: { color: 'red' } },
      next: { style: { color: 'blue' } },
      read: (w) => w.get<HTMLDivElement>('.apollo-empty').element.style.color,
      expected: 'blue',
      fallback: '',
    },
    {
      name: 'classNames',
      initial: { classNames: { description: 'first' } },
      next: { classNames: { description: 'second' } },
      read: (w) =>
        w
          .get('.apollo-empty-description')
          .classes()
          .filter((c) => c === 'first' || c === 'second'),
      expected: ['second'],
      fallback: [],
    },
    {
      name: 'styles',
      initial: { styles: { description: { color: 'red' } } },
      next: { styles: { description: { color: 'blue' } } },
      read: (w) => w.get<HTMLDivElement>('.apollo-empty-description').element.style.color,
      expected: 'blue',
      fallback: '',
    },
    {
      name: 'image',
      initial: { image: PRESENTED_IMAGE_SIMPLE },
      next: { image: PRESENTED_IMAGE_DEFAULT },
      read: (w) => w.get('.apollo-empty').classes().includes('apollo-empty-normal'),
      expected: false,
      fallback: false,
    },
  ];
  it.each(cases)(
    'consumes current Provider $name and removes stale configuration',
    async ({ initial, next, read, expected, fallback }) => {
      const config = shallowRef(initial);
      const w = mount(
        defineComponent({
          setup: () => () =>
            h(ConfigProvider, { components: { empty: config.value } }, () => h(Empty)),
        }),
        { global: { stubs: { teleport: false } } },
      );
      const original = w.get('.apollo-empty').element;
      config.value = next;
      await nextTick();
      expect(read(w)).toEqual(expected);
      expect(w.get('.apollo-empty').element).toBe(original);
      config.value = {};
      await nextTick();
      expect(read(w)).toEqual(fallback);
    },
  );

  it('updates native attrs/style/listeners without replacing the actual root', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const attrs = shallowRef({
      id: 'first',
      class: 'first',
      style: 'padding-inline:11px',
      'data-phase': 'first',
      onClick: first,
    });
    const w = mount(defineComponent({ setup: () => () => h(Empty, attrs.value) }));
    const root = w.get('.apollo-empty').element;
    attrs.value = {
      id: 'second',
      class: 'second',
      style: 'padding-inline:19px',
      'data-phase': 'second',
      onClick: second,
    };
    await nextTick();
    expect(w.get('.apollo-empty').attributes('id')).toBe('second');
    expect(w.get('.apollo-empty').classes()).toContain('second');
    expect(w.get('.apollo-empty').attributes('data-phase')).toBe('second');
    expect(w.get<HTMLDivElement>('.apollo-empty').element.style.paddingInline).toBe('19px');
    await w.get('.apollo-empty').trigger('click');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(w.get('.apollo-empty').element).toBe(root);
  });

  it('uses current direction and honors an explicit native override', async () => {
    const direction = ref<'ltr' | 'rtl'>('ltr');
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { direction: direction.value }, () => [
            h(Empty),
            h(Empty, { dir: 'ltr' }),
          ]),
      }),
      { global: { stubs: { teleport: false } } },
    );
    direction.value = 'rtl';
    await nextTick();
    const roots = w.findAll('.apollo-empty');
    expect(roots[0]?.classes()).toContain('apollo-empty-rtl');
    expect(roots[0]?.attributes('dir')).toBe('rtl');
    expect(roots[1]?.attributes('dir')).toBe('ltr');
  });

  it('updates both public artwork titles and the visible description with the current locale', async () => {
    const locale = shallowRef(en_US);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { locale: locale.value }, () => [h(Empty), h(PRESENTED_IMAGE_SIMPLE)]),
      }),
      { global: { stubs: { teleport: false } } },
    );
    locale.value = zh_CN;
    await nextTick();
    expect(w.get('.apollo-empty-description').text()).toBe('暂无数据');
    expect(w.findAll('svg title').map((n) => n.text())).toEqual(['暂无数据', '暂无数据']);
  });

  it('uses the current localized URL alternative for non-string descriptions', async () => {
    const locale = shallowRef(en_US);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { locale: locale.value }, () =>
            h(Empty, {
              image: 'data:image/svg+xml,<svg/>',
              description: h('strong', 'Custom description'),
            }),
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    expect(w.get('img').attributes('alt')).toBe('No data');
    locale.value = zh_CN;
    await nextTick();
    expect(w.get('img').attributes('alt')).toBe('暂无数据');
  });

  it('keeps fully transparent artwork source colors finite', async () => {
    const w = mount(ConfigProvider, {
      global: { stubs: { teleport: false } },
      props: {
        theme: {
          token: {
            colorBgContainer: 'rgba(0,0,0,0)',
            colorFill: 'rgba(0,0,0,0)',
            colorFillSecondary: 'rgba(0,0,0,0)',
            colorFillTertiary: 'rgba(0,0,0,0)',
            colorFillQuaternary: 'rgba(0,0,0,0)',
            colorTextQuaternary: 'rgba(0,0,0,0)',
          },
        },
      },
      slots: { default: () => [h(PRESENTED_IMAGE_DEFAULT), h(PRESENTED_IMAGE_SIMPLE)] },
    });
    await nextTick();
    const fills = w.findAll('[fill]').map((n) => n.attributes('fill'));
    expect(fills.some((v) => v?.includes('NaN'))).toBe(false);
    expect(fills.some((v) => v === 'rgba(0,0,0,0)' || v === '#00000000')).toBe(true);
  });

  it.each([
    'Table',
    'List',
    'Select',
    'TreeSelect',
    'Cascader',
    'Transfer',
    'Mentions',
    'Table.filter',
  ] as const)('preserves the accepted DefaultRenderEmpty %s dispatch', (componentName) => {
    const w = mount(DefaultRenderEmpty, { props: { componentName } });
    if (componentName === 'Table.filter') expect(w.find('.apollo-empty').exists()).toBe(false);
    else {
      expect(w.get('.apollo-empty').classes()).toContain('apollo-empty-normal');
      expect(w.get('.apollo-empty').classes().includes('apollo-empty-small')).toBe(
        !['Table', 'List'].includes(componentName),
      );
    }
  });
});

describe('Empty instance and content boundaries', () => {
  it('keeps nearest Provider configuration isolated across adjacent instances', async () => {
    const outer = ref('Outer'),
      inner = ref('Inner');
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { components: { empty: { className: outer.value } } }, () => [
            h(Empty, { id: 'outer-empty' }),
            h(ConfigProvider, { components: { empty: { className: inner.value } } }, () =>
              h(Empty, { id: 'inner-empty' }),
            ),
          ]),
      }),
      { global: { stubs: { teleport: false } } },
    );
    const a = w.get('#outer-empty').element,
      b = w.get('#inner-empty').element;
    outer.value = 'NextOuter';
    inner.value = 'NextInner';
    await nextTick();
    expect(w.get('#outer-empty').classes()).toContain('NextOuter');
    expect(w.get('#outer-empty').classes()).not.toContain('NextInner');
    expect(w.get('#inner-empty').classes()).toContain('NextInner');
    expect(w.get('#inner-empty').classes()).not.toContain('NextOuter');
    expect(w.get('#outer-empty').element).toBe(a);
    expect(w.get('#inner-empty').element).toBe(b);
    w.unmount();
  });

  it('restores fallback after removing a conditional image slot without changing the root', async () => {
    const stage = ref(0);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Empty,
            { image: PRESENTED_IMAGE_SIMPLE },
            stage.value === 2
              ? {}
              : {
                  image: () =>
                    stage.value === 0
                      ? [h('strong', 'Business'), 0]
                      : [createCommentVNode('empty')],
                },
          ),
      }),
    );
    const root = w.element;
    expect(w.get('.apollo-empty-image-content').text()).toBe('Business0');
    expect(w.classes()).not.toContain('apollo-empty-normal');
    stage.value = 1;
    await nextTick();
    expect(w.find('.apollo-empty-image').exists()).toBe(false);
    stage.value = 2;
    await nextTick();
    expect(w.classes()).toContain('apollo-empty-normal');
    expect(w.get('svg').attributes('viewBox')).toBe('0 0 64 41');
    stage.value = 0;
    await nextTick();
    expect(w.get('.apollo-empty-image-content').text()).toBe('Business0');
    expect(w.element).toBe(root);
    w.unmount();
  });

  it('clears the actual exposed element on unmount and provides a fresh instance on remount', async () => {
    const shown = ref(true);
    const instance = shallowRef<import('../index').EmptyRef | null>(null);
    const w = mount(
      defineComponent({
        setup: () => () => (shown.value ? h(Empty, { ref: instance }) : null),
      }),
    );
    const original = instance.value;
    expect(original?.nativeElement).toBe(w.element);
    shown.value = false;
    await nextTick();
    expect(instance.value).toBeNull();
    expect(original?.nativeElement).toBeNull();
    shown.value = true;
    await nextTick();
    expect(instance.value?.nativeElement).toBe(w.element);
    expect(instance.value).not.toBe(original);
    w.unmount();
  });

  it('renders reused complete VNode data in multiple instances without changing caller attributes', async () => {
    const node = h('strong', { class: 'owned', 'data-owner': 'business' }, 'Tail');
    const label = ref('First');
    const image = [h('span', 'Image'), node, 0];
    const w = mount(
      defineComponent({
        setup: () => () =>
          h('main', [h(Empty, { image, description: label.value }), h(Empty, { image })]),
      }),
    );
    expect(w.findAll('.apollo-empty-image').map((n) => n.text())).toEqual([
      'ImageTail0',
      'ImageTail0',
    ]);
    const originals = w.findAll('.owned').map((n) => n.element);
    label.value = 'Second';
    await nextTick();
    expect(w.findAll('.owned').map((n) => n.element)).toEqual(originals);
    expect(originals[0]).not.toBe(originals[1]);
    expect(node.props).toEqual({ class: 'owned', 'data-owner': 'business' });
    w.unmount();
  });
});
