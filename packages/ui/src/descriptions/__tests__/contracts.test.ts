import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Comment,
  createSSRApp,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import { Descriptions, DescriptionsItem } from '../index';
import type { DescriptionsConfig, DescriptionsProps, DescriptionsRef } from '../interface';
import { getCalcRows, normalizeItems } from '../items';

afterEach(() => vi.restoreAllMocks());

describe('Descriptions current public contracts', () => {
  it('D28 item semantic classes reach both regions in all four presentations', async () => {
    const w = mount(Descriptions, {
      props: {
        items: [
          {
            key: 'a',
            label: 'A',
            children: 'Alpha',
            classNames: { label: 'item-label', content: 'item-content' },
          },
        ],
      },
    });
    for (const layout of ['horizontal', 'vertical'] as const) {
      for (const bordered of [false, true]) {
        await w.setProps({ layout, bordered });
        expect(w.get('.apollo-descriptions-item-label').classes()).toContain('item-label');
        expect(w.get('.apollo-descriptions-item-content').classes()).toContain('item-content');
      }
    }
    w.unmount();
  });

  it('D28 Item has a complete label slot and native attrs on its own item', async () => {
    const click = vi.fn(),
      label = ref(true);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Descriptions, null, {
            default: () =>
              h(
                DescriptionsItem,
                {
                  label: 'Fallback',
                  id: 'own-item',
                  class: 'native-item',
                  style: 'padding: 7px',
                  'aria-label': 'Own field',
                  onClick: click,
                },
                {
                  label: () => (label.value ? [h('b', 'Rich'), h('i', ' label')] : []),
                  default: () => [h('button', { type: 'button' }, 'Edit'), ' tail'],
                },
              ),
          }),
      }),
    );
    expect(w.get('.apollo-descriptions-item-label').text()).toBe('Rich label');
    const item = w.get('#own-item');
    expect(item.classes()).toContain('native-item');
    expect(item.attributes('style')).toContain('padding: 7px');
    expect(item.attributes('aria-label')).toBe('Own field');
    await w.get('button').trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    label.value = false;
    await nextTick();
    expect(w.text()).not.toContain('Fallback');
    expect(w.text()).toContain('Edit tail');
    w.unmount();
  });

  it('D28 current Provider styles are consumed before component/item styles', async () => {
    const enabled = ref(true);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: enabled.value
                ? {
                    descriptions: {
                      className: 'provider-root',
                      style: { padding: '8px' },
                      classNames: { label: 'provider-label' },
                      styles: { label: { color: 'red', marginTop: '3px' } },
                    },
                  }
                : undefined,
            },
            () =>
              h(Descriptions, {
                styles: { label: { color: 'blue' } },
                items: [{ key: 'a', label: 'A', children: 'Alpha' }],
              }),
          ),
      }),
    );
    expect(w.get('.apollo-descriptions').attributes('style')).toContain('padding: 8px');
    expect(w.get('.apollo-descriptions-item-label').attributes('style')).toContain('color: blue');
    expect(w.get('.apollo-descriptions-item-label').attributes('style')).toContain(
      'margin-top: 3px',
    );
    enabled.value = false;
    await nextTick();
    expect(w.get('.apollo-descriptions').classes()).not.toContain('provider-root');
    expect(w.get('.apollo-descriptions').attributes('style') ?? '').not.toContain('padding');
    expect(w.get('.apollo-descriptions-item-label').classes()).not.toContain('provider-label');
    w.unmount();
  });

  it('D28 keyed content retains its instance, element, uncontrolled draft and focus through regrouping', async () => {
    let mounts = 0,
      unmounts = 0;
    const Editor = defineComponent({
      setup() {
        onMounted(() => mounts++);
        onUnmounted(() => unmounts++);
        return () => h('input', { 'aria-label': 'Draft', value: 'Initial' });
      },
    });
    const w = mount(Descriptions, {
      attachTo: document.body,
      props: {
        column: 3,
        items: [
          { key: 'a', label: 'A', children: 'Alpha' },
          { key: 'b', label: 'B', children: h(Editor) },
          { key: 'c', label: 'C', children: 'Gamma' },
        ],
      },
    });
    const original = w.get('input').element;
    original.value = 'Persistent draft';
    original.focus();
    for (const props of [
      { column: 1 },
      { column: 2, bordered: true },
      { layout: 'vertical' as const },
      { bordered: false },
      { layout: 'horizontal' as const, column: 3 },
    ]) {
      await w.setProps(props);
      expect(w.get('input').element).toBe(original);
      expect(original.value).toBe('Persistent draft');
      expect(document.activeElement).toBe(original);
      expect([mounts, unmounts]).toEqual([1, 0]);
    }
    w.unmount();
    expect([mounts, unmounts]).toEqual([1, 1]);
  });

  it('D28 current theme values reach all ten component variables and reset', async () => {
    const enabled = ref(true);
    const values = {
      labelBg: '#112233',
      labelColor: '#223344',
      titleColor: '#334455',
      titleMarginBottom: 31,
      itemPaddingBottom: 7,
      itemPaddingEnd: 9,
      colonMarginRight: 3,
      colonMarginLeft: 2,
      contentColor: '#445566',
      extraColor: '#556677',
    };
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: enabled.value ? { components: { Descriptions: values } } : undefined },
            () => h(Descriptions, { title: 'Title', items: [{ label: 'A', children: 'Alpha' }] }),
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    const root = w.get<HTMLDivElement>('.apollo-descriptions').element;
    expect(root.getAttribute('style')).toContain('--apollo-descriptions-label-color: #223344');
    for (const [key, value] of Object.entries(values)) {
      const name = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      expect(root.style.getPropertyValue(`--apollo-descriptions-${name}`)).toBe(
        typeof value === 'number' ? `${value}px` : value,
      );
    }
    enabled.value = false;
    await nextTick();
    await nextTick();
    expect(w.get('.apollo-descriptions').element).toBe(root);
    expect(root.style.getPropertyValue('--apollo-descriptions-label-color')).toBe('');
    w.unmount();
  });

  it('D28 empty text does not create header shells; zero remains visible', async () => {
    const w = mount(Descriptions, { props: { title: '' } });
    expect(w.find('.apollo-descriptions-header').exists()).toBe(false);
    w.unmount();
    const rich = mount(Descriptions, {
      slots: { title: () => [false, h('span', '0')], extra: () => [] },
    });
    expect(rich.get('.apollo-descriptions-title').text()).toBe('0');
    expect(rich.find('.apollo-descriptions-extra').exists()).toBe(false);
    rich.unmount();
  });

  it('D28 SSR uses native paired description semantics and hydrates the same content', async () => {
    const render = () =>
      h(
        Descriptions,
        { column: 2 },
        {
          default: () =>
            h(
              DescriptionsItem,
              { label: 'SSR' },
              {
                label: () => [h('b', 'Server'), ' label'],
                default: () => h('input', { value: 'Server draft', 'aria-label': 'Server draft' }),
              },
            ),
        },
      );
    const host = document.createElement('div');
    host.innerHTML = await renderToString(createSSRApp({ render }));
    document.body.append(host);
    const input = host.querySelector('input');
    expect(host.querySelector('dl dt')?.textContent).toBe('Server label');
    const warn = vi.spyOn(console, 'warn'),
      error = vi.spyOn(console, 'error');
    const app = createSSRApp({ render });
    try {
      app.mount(host);
      await nextTick();
      expect(host.querySelector('input')).toBe(input);
      expect(warn.mock.calls.flat().join(' ')).not.toMatch(/hydration|recursive/i);
      expect(error.mock.calls.flat().join(' ')).not.toMatch(/hydration|recursive/i);
    } finally {
      app.unmount();
      host.remove();
    }
  });

  it('D28 semantic callbacks receive current effective props and Provider/component/Item styles merge', async () => {
    const column = ref(2),
      size = ref<'large' | 'small'>('small');
    const config: DescriptionsConfig = {
      classNames: ({ props }) => ({ content: `provider-${props.column}` }),
      styles: ({ props }) => ({
        content: { color: props.size === 'small' ? 'red' : 'blue', padding: '1px' },
      }),
    };
    const semantic: DescriptionsProps['classNames'] = ({ props }) => ({
      content: `own-${props.column}-${props.size}`,
    });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { components: { descriptions: config }, componentSize: size.value },
            () =>
              h(Descriptions, {
                column: column.value,
                classNames: semantic,
                styles: { content: { color: 'green' } },
                items: [
                  {
                    key: 'a',
                    label: 'A',
                    children: 'Value',
                    styles: { content: { color: 'purple' } },
                    classNames: { content: 'item-content' },
                  },
                ],
              }),
          ),
      }),
    );
    expect(w.get('dd').classes()).toEqual(
      expect.arrayContaining(['provider-2', 'own-2-small', 'item-content']),
    );
    expect(w.get('dd').attributes('style')).toContain('color: purple');
    expect(w.get('dd').attributes('style')).toContain('padding: 1px');
    column.value = 1;
    size.value = 'large';
    await nextTick();
    expect(w.get('dd').classes()).toEqual(expect.arrayContaining(['provider-1', 'own-1-large']));
    expect(w.get('dd').classes()).not.toContain('own-2-small');
    w.unmount();
  });

  it('D28 full content handles nested Fragments, comments, 0, empty label slots and irrelevant children', () => {
    const w = mount(Descriptions, {
      slots: {
        title: () => [h(Comment), 0],
        default: () => [
          h('p', 'Ignored arbitrary element'),
          h(Comment),
          h(Fragment, null, [
            h(
              DescriptionsItem,
              { key: 'a', label: 'Suppressed' },
              { label: () => [], default: () => [h(Comment), h('b', 'Complete'), ' tail', 0] },
            ),
            h(DescriptionsItem, { key: 'b', label: 'Zero' }, () => 0),
          ]),
        ],
      },
    });
    expect(w.get('.apollo-descriptions-title').text()).toBe('0');
    expect(w.findAll('dl > div')).toHaveLength(2);
    expect(w.text()).not.toContain('Suppressed');
    expect(w.text()).not.toContain('Ignored');
    expect(w.findAll('dd').map((node) => node.text())).toEqual(['Complete tail0', '0']);
    expect(w.findAll('dt')[0]?.classes()).toContain('apollo-descriptions-item-no-label');
    w.unmount();
  });

  it('D28 native root style forms and events have one owner; exposed root clears on unmount', async () => {
    const click = vi.fn();
    const instance = ref<DescriptionsRef>();
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(Descriptions, {
            ref: instance,
            id: 'root-owner',
            onClick: click,
            style: ['padding: 6px', { width: '200px' }],
            items: [{ label: 'A', children: 'Value' }],
          }),
      }),
    );
    const root = w.get('#root-owner').element;
    expect(instance.value?.nativeElement).toBe(root);
    expect(w.get('#root-owner').attributes('style')).toContain('padding: 6px');
    await w.get('dd').trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    const exposed = instance.value;
    w.unmount();
    expect(exposed?.nativeElement).toBeNull();
  });

  it('D28 invalid numeric geometry stays finite, fills rows and does not mutate inputs', () => {
    const input = [
      { key: 'a', span: 0 },
      { key: 'b', span: -2 },
      { key: 'c', span: Infinity },
      { key: 'd', span: 1.9 },
    ];
    const normalized = normalizeItems(undefined, input, []);
    const [rows] = getCalcRows(normalized, NaN);
    expect(rows.map((row) => row.map((item) => item.span))).toEqual([[1, 1, 1], [3]]);
    expect(input.map((item) => item.span)).toEqual([0, -2, Infinity, 1.9]);
    expect(
      getCalcRows(
        normalizeItems({ md: true }, [{ span: { md: 2 } }, { span: 'filled' }, { span: 1 }], []),
        3,
      )[0].map((row) => row.map((item) => item.span)),
    ).toEqual([[2, 1], [3]]);
  });

  it('D28 current prefix, direction, size and colon reach root and Items without changing native identity', async () => {
    const prefix = ref('apollo'),
      rtl = ref(false),
      small = ref(false),
      colon = ref(true);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              prefixCls: prefix.value,
              direction: rtl.value ? 'rtl' : 'ltr',
              componentSize: small.value ? 'small' : 'large',
            },
            () => [
              h(Descriptions, { id: 'changing-prefix', colon: colon.value }, () =>
                h(DescriptionsItem, { key: 'field', label: 'Label' }, () => 'Value'),
              ),
              h(Descriptions, {
                id: 'fixed-prefix',
                prefixCls: 'fixed-descriptions',
                size: 'large',
                items: [{ label: 'Fixed', children: 'Value' }],
              }),
            ],
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    const original = w.get('#changing-prefix').element;
    const label = w.get('#changing-prefix').get('dt').element;
    prefix.value = 'current';
    rtl.value = true;
    small.value = true;
    colon.value = false;
    await nextTick();
    expect(w.get('#changing-prefix').element).toBe(original);
    expect(w.get('#changing-prefix').get('dt').element).toBe(label);
    expect(w.get('#changing-prefix').classes()).toEqual(
      expect.arrayContaining([
        'current-descriptions',
        'current-descriptions-small',
        'current-descriptions-rtl',
      ]),
    );
    expect(w.get('#changing-prefix').get('dt').classes()).toEqual(
      expect.arrayContaining([
        'current-descriptions-item-label',
        'current-descriptions-item-no-colon',
      ]),
    );
    expect(w.get('#fixed-prefix').classes()).toContain('fixed-descriptions');
    expect(w.get('#fixed-prefix').classes()).not.toContain('fixed-descriptions-small');
    w.unmount();
  });
});
