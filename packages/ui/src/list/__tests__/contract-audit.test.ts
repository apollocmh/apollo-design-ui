import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommentVNode, defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { ConfigProvider, type PaginationConfig, Spin, type SpinConfig } from '../../index';
import { List, ListItem, ListItemMeta } from '../index';
import type { ListItemSlotProps, ListProps } from '../interface';

const cleanup: Array<() => void> = [];
function track<T extends { unmount(): void }>(wrapper: T): T {
  cleanup.push(() => wrapper.unmount());
  return wrapper;
}
afterEach(() => {
  for (const dispose of cleanup.splice(0)) dispose();
  vi.restoreAllMocks();
});
async function settle() {
  await nextTick();
  await nextTick();
}
interface Row {
  id: number;
  name: string;
}
const rows: Row[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `Record ${index + 1}`,
}));
const item = ({ item: row }: ListItemSlotProps) =>
  h(ListItem, {}, () =>
    row !== null && typeof row === 'object' && 'name' in row ? String(row.name) : String(row),
  );
function input(selector: string) {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLInputElement)) throw new Error(`Missing native input ${selector}`);
  return node;
}
function paginated(initial: PaginationConfig | false) {
  const pagination = shallowRef<PaginationConfig | false>(initial);
  const data = ref(rows);
  const host = defineComponent(
    () => () =>
      h(
        List,
        {
          dataSource: data.value,
          pagination: pagination.value,
        },
        { item },
      ),
  );
  const wrapper = track(mount(host, { attachTo: document.body }));
  const names = () =>
    wrapper.findAll('.apollo-list-items > .apollo-list-item').map((node) => node.text());
  return { wrapper, pagination, data, names };
}

describe('List complete contract audit: configuration and content', () => {
  it('keeps explicit padding and recomputes bordered defaults through current theme and layout', async () => {
    const bordered = ref(false);
    const custom = ref(true);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              ConfigProvider,
              {
                theme: { components: { List: custom.value ? { itemPadding: '21px 23px' } : {} } },
              },
              () =>
                h(
                  List,
                  { bordered: bordered.value, dataSource: [1] },
                  {
                    item: () =>
                      h(ListItem, {}, () => h('input', { 'aria-label': 'Padding draft' })),
                  },
                ),
            ),
        ),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      ),
    );
    const editor = input('[aria-label="Padding draft"]');
    const padding = () => wrapper.get('.apollo-list').attributes('style');
    expect(padding()).toContain('--apollo-list-item-padding: 21px 23px');
    bordered.value = true;
    await settle();
    expect(padding()).toContain('--apollo-list-item-padding: 21px 23px');
    custom.value = false;
    await settle();
    expect(padding()).toContain('--apollo-list-item-padding: 12px 24px');
    bordered.value = false;
    await settle();
    expect(padding()).toContain('--apollo-list-item-padding: 12px 0');
    expect(input('[aria-label="Padding draft"]')).toBe(editor);
  });

  it('keeps keyed data actions and filters conditional empty entries without phantom separators', async () => {
    const reversed = ref(false);
    const host = defineComponent(() => () => {
      const actions = ['first', 'second'].map((key) => h('input', { key, 'aria-label': key }));
      return h(ListItem, {
        actions: [
          false,
          null,
          '',
          createCommentVNode('conditional'),
          ...(reversed.value ? actions.reverse() : actions),
          0,
        ],
      });
    });
    const wrapper = track(mount(host, { attachTo: document.body }));
    const editor = input('[aria-label="first"]');
    editor.value = 'Action draft';
    expect(wrapper.findAll('.apollo-list-item-action > li')).toHaveLength(3);
    expect(wrapper.findAll('.apollo-list-item-action-split')).toHaveLength(2);
    reversed.value = true;
    await settle();
    expect(wrapper.findAll('input').map((node) => node.attributes('aria-label'))).toEqual([
      'second',
      'first',
    ]);
    expect(input('[aria-label="first"]')).toBe(editor);
    expect(editor.value).toBe('Action draft');
    expect(wrapper.findAll('.apollo-list-item-action > li').at(-1)?.text()).toBe('0');
  });

  it('root extra slots take precedence even when conditional content is empty', async () => {
    const empty = ref(false);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              List,
              { extra: 'prop detail' },
              {
                extra: () => (empty.value ? [] : h('button', 'slot detail')),
              },
            ),
        ),
      ),
    );
    expect(wrapper.get('.apollo-list-extra button').text()).toBe('slot detail');
    empty.value = true;
    await settle();
    expect(wrapper.find('.apollo-list-extra').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('apollo-list-with-extra');
    expect(wrapper.text()).not.toContain('prop detail');
  });

  for (const value of [true, '']) {
    it(`does not create an empty heading/header for a raw ${String(value)} content value`, () => {
      const wrapper = track(
        mount(List, {
          props: { header: value, dataSource: rows.slice(0, 1) },
          slots: { item: () => h(ListItem, {}, () => h(ListItemMeta, { title: value })) },
        }),
      );
      expect(wrapper.find('.apollo-list-header').exists()).toBe(false);
      expect(wrapper.find('h4').exists()).toBe(false);
    });
  }
  it('renders the existing root extra without losing row editors when it is removed/restored', async () => {
    const show = ref(true);
    const host = defineComponent(
      () => () =>
        h(
          List,
          {
            dataSource: rows.slice(0, 1),
            extra: show.value
              ? h('button', { type: 'button', 'data-root-extra': '' }, 'Root detail')
              : undefined,
          },
          { item: () => h(ListItem, {}, () => h('input', { 'aria-label': 'Row draft' })) },
        ),
    );
    const wrapper = track(mount(host, { attachTo: document.body }));
    expect(wrapper.find('[data-root-extra]').exists()).toBe(true);
    const editor = input('[aria-label="Row draft"]');
    editor.value = 'Uncontrolled draft';
    editor.focus();
    show.value = false;
    await settle();
    expect(wrapper.find('[data-root-extra]').exists()).toBe(false);
    expect(input('[aria-label="Row draft"]')).toBe(editor);
    expect(editor.value).toBe('Uncontrolled draft');
    expect(document.activeElement).toBe(editor);
    show.value = true;
    await settle();
    expect(wrapper.find('[data-root-extra]').exists()).toBe(true);
    expect(input('[aria-label="Row draft"]')).toBe(editor);
  });

  for (const value of [0, '', false, null]) {
    it(`preserves an explicit locale.emptyText ${String(value)} instead of the Provider fallback`, () => {
      const fallback = vi.fn(() => 'Provider fallback');
      const wrapper = track(
        mount(
          defineComponent(
            () => () =>
              h(ConfigProvider, { renderEmpty: fallback }, () =>
                h(List, { locale: { emptyText: value } }),
              ),
          ),
        ),
      );
      expect(wrapper.find('.apollo-list-empty-text').text()).toBe(value === 0 ? '0' : '');
      expect(fallback).not.toHaveBeenCalled();
    });
  }

  it('honors an intentional empty Provider result without invoking the default empty view', () => {
    const wrapper = track(
      mount(
        defineComponent(() => () => h(ConfigProvider, { renderEmpty: () => null }, () => h(List))),
      ),
    );
    expect(wrapper.find('.apollo-empty').exists()).toBe(false);
    expect(wrapper.find('.apollo-list-empty-text').text()).toBe('');
  });

  it('uses the same active loading state as Spin when an options object omits spinning', () => {
    const wrapper = track(mount(List, { props: { loading: { description: 'Fetching records' } } }));
    expect(wrapper.findComponent(Spin).props('spinning')).toBe(true);
    expect(wrapper.classes()).toContain('apollo-list-loading');
    expect(wrapper.find('.apollo-list-empty-text').exists()).toBe(false);
    expect(wrapper.text()).toContain('Fetching records');
  });

  it('keeps List/Item/Meta local prefixes in one reactive hierarchy, with explicit child overrides', async () => {
    const prefix = ref('custom-list');
    const child = ref<string>();
    const host = defineComponent(
      () => () =>
        h(
          List,
          { prefixCls: prefix.value, dataSource: rows.slice(0, 1) },
          {
            item: () =>
              h(ListItem, { prefixCls: child.value }, () => h(ListItemMeta, { title: 'Title' })),
          },
        ),
    );
    const wrapper = track(mount(host));
    const meta = wrapper.findComponent(ListItemMeta).element;
    expect(wrapper.find('.custom-list-item').exists()).toBe(true);
    expect(wrapper.find('.custom-list-item-meta').exists()).toBe(true);
    prefix.value = 'next-list';
    await settle();
    expect(wrapper.find('.next-list-item-meta').element).toBe(meta);
    child.value = 'child-list';
    await settle();
    expect(wrapper.find('.child-list-item').exists()).toBe(true);
    expect(wrapper.find('.child-list-item-meta').element).toBe(meta);
    child.value = undefined;
    await settle();
    expect(wrapper.find('.next-list-item-meta').element).toBe(meta);
  });

  it('applies horizontal extra semantic classes/styles and preserves the body through layout/extra changes', async () => {
    const layout = ref<ListProps['itemLayout']>('horizontal');
    const show = ref(true);
    const host = defineComponent(
      () => () =>
        h(
          List,
          { itemLayout: layout.value, dataSource: rows.slice(0, 1) },
          {
            item: () =>
              h(
                ListItem,
                {
                  classNames: { extra: 'owned-extra' },
                  styles: { extra: { color: 'red' } },
                },
                {
                  default: () => h('input', { 'aria-label': 'Layout draft', key: 'draft' }),
                  ...(show.value ? { extra: () => h('span', 'Extra content') } : {}),
                },
              ),
          },
        ),
    );
    const wrapper = track(mount(host, { attachTo: document.body }));
    expect(wrapper.find('.owned-extra').attributes('style')).toContain('color: red');
    const editor = input('[aria-label="Layout draft"]');
    editor.value = 'Kept draft';
    editor.focus();
    for (const next of ['vertical', 'horizontal'] as const) {
      layout.value = next;
      await settle();
      expect(input('[aria-label="Layout draft"]')).toBe(editor);
      expect(editor.value).toBe('Kept draft');
      expect(document.activeElement).toBe(editor);
    }
    layout.value = 'vertical';
    await settle();
    show.value = false;
    await settle();
    expect(input('[aria-label="Layout draft"]')).toBe(editor);
    expect(wrapper.find('.owned-extra').exists()).toBe(false);
  });

  it('reads the current shared Spin Provider values through List loading', async () => {
    const config = shallowRef<SpinConfig>({
      className: 'spin-one',
      classNames: { root: 'semantic-one' },
      styles: { root: { color: 'red' } },
      indicator: h('span', { 'data-spin-marker': 'one' }, 'One'),
    });
    const direction = ref<'ltr' | 'rtl'>('ltr');
    const host = defineComponent(
      () => () =>
        h(ConfigProvider, { spin: config.value, direction: direction.value }, () =>
          h(List, { loading: true, dataSource: rows.slice(0, 1) }, { item }),
        ),
    );
    const wrapper = track(
      mount(host, { attachTo: document.body, global: { stubs: { teleport: false } } }),
    );
    const root = wrapper.find('.apollo-spin').element;
    const instance = wrapper.findComponent(Spin).vm.$.uid;
    const listInstance = wrapper.findComponent({ name: 'AList' }).vm.$.uid;
    const providerInstance = wrapper.findComponent(ConfigProvider).vm.$.uid;
    expect(wrapper.find('[data-spin-marker="one"]').exists()).toBe(true);
    config.value = {
      className: 'spin-two',
      classNames: { root: 'semantic-two' },
      styles: { root: { color: 'blue' } },
      indicator: h('span', { 'data-spin-marker': 'two' }, 'Two'),
    };
    direction.value = 'rtl';
    await settle();
    expect(wrapper.findComponent(ConfigProvider).vm.$.uid, 'Provider identity').toBe(
      providerInstance,
    );
    expect(wrapper.findComponent({ name: 'AList' }).vm.$.uid, 'List identity').toBe(listInstance);
    expect(wrapper.findComponent(Spin).vm.$.uid, 'Spin component identity').toBe(instance);
    expect(wrapper.find('.apollo-spin').element).toBe(root);
    expect(wrapper.find('.spin-two.semantic-two.apollo-spin-rtl').exists()).toBe(true);
    expect(wrapper.find('.apollo-spin').attributes('style')).toContain('color: blue');
    expect(wrapper.find('[data-spin-marker="two"]').exists()).toBe(true);
  });

  it('applies existing List component tokens from the source theme', () => {
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              ConfigProvider,
              {
                theme: {
                  components: {
                    List: {
                      itemPadding: '21px 23px',
                      descriptionFontSize: 19,
                      headerBg: 'rgb(1, 2, 3)',
                    },
                  },
                },
              },
              () => h(List, { dataSource: rows.slice(0, 1), header: 'Header' }, { item }),
            ),
        ),
      ),
    );
    const root = wrapper.find('.apollo-list').element;
    expect(root instanceof HTMLElement).toBe(true);
    expect(wrapper.find('.apollo-list').attributes('style')).toContain(
      '--apollo-list-item-padding: 21px 23px',
    );
    expect(wrapper.find('.apollo-list').attributes('style')).toContain(
      '--apollo-list-description-font-size: 19px',
    );
  });
});

describe('List complete contract audit: pagination ownership', () => {
  it('normalizes an uncontrolled page after shrinking data and does not revive it on regrowth', async () => {
    const change = vi.fn();
    const { data, names } = paginated({ defaultCurrent: 5, defaultPageSize: 2, onChange: change });
    expect(names()).toEqual(['Record 9', 'Record 10']);
    data.value = rows.slice(0, 3);
    await settle();
    expect(names()).toEqual(['Record 3']);
    data.value = rows;
    await settle();
    expect(names()).toEqual(['Record 3', 'Record 4']);
    expect(change).not.toHaveBeenCalled();
  });

  it('continues the latest controlled current and pageSize when control is removed without echo', async () => {
    const change = vi.fn();
    const { pagination, names } = paginated({ current: 2, pageSize: 2, onChange: change });
    expect(names()).toEqual(['Record 3', 'Record 4']);
    pagination.value = { current: 3, pageSize: 3, onChange: change };
    await settle();
    expect(names()).toEqual(['Record 7', 'Record 8', 'Record 9']);
    pagination.value = { onChange: change };
    await settle();
    expect(names()).toEqual(['Record 7', 'Record 8', 'Record 9']);
    expect(change).not.toHaveBeenCalled();
  });

  it('does not carry a declined controlled request into uncontrolled state', async () => {
    const change = vi.fn();
    const { wrapper, pagination, names } = paginated({ current: 2, pageSize: 2, onChange: change });
    await wrapper.get('.apollo-pagination-item-3').trigger('click');
    expect(change).toHaveBeenCalledExactlyOnceWith(3, 2);
    expect(names()).toEqual(['Record 3', 'Record 4']);
    pagination.value = { pageSize: 2, onChange: change };
    await settle();
    expect(names()).toEqual(['Record 3', 'Record 4']);
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('initializes defaults when pagination is first enabled and retains later state across toggles', async () => {
    const { wrapper, pagination, names } = paginated(false);
    pagination.value = { defaultCurrent: 2, defaultPageSize: 2 };
    await settle();
    expect(names()).toEqual(['Record 3', 'Record 4']);
    await wrapper.get('.apollo-pagination-item-3').trigger('click');
    expect(names()).toEqual(['Record 5', 'Record 6']);
    pagination.value = false;
    await settle();
    pagination.value = { defaultCurrent: 5, defaultPageSize: 3 };
    await settle();
    expect(names()).toEqual(['Record 5', 'Record 6']);
  });

  it('honors Pagination align and consumes List-only position before reaching native DOM', () => {
    const { wrapper } = paginated({ pageSize: 2, align: 'center', position: 'both' });
    const pagers = wrapper.findAll('.apollo-pagination');
    expect(pagers).toHaveLength(2);
    for (const pager of pagers) {
      expect(pager.classes()).toContain('apollo-pagination-center');
      expect(pager.attributes('position')).toBeUndefined();
    }
  });

  it('keeps server-page results when the declared total covers more records', () => {
    const wrapper = track(
      mount(List, {
        props: {
          dataSource: rows.slice(0, 2),
          pagination: { current: 4, pageSize: 2, total: 100 },
        },
        slots: { item },
      }),
    );
    expect(
      wrapper.findAll('.apollo-list-items > .apollo-list-item').map((node) => node.text()),
    ).toEqual(['Record 1', 'Record 2']);
  });
});
