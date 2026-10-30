import { VirtualList, type VirtualListExposed } from '@apollo-design/virtual-list';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  computed,
  createSSRApp,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  ref,
  shallowRef,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import type { ColumnsType, TableProps, TableRef, TableRowSelection } from '../interface';
import Table from '../Table';

interface User {
  id: string;
  name: string;
  age: number;
  alt?: string;
  children?: User[];
}
const rows: User[] = [
  { id: 'a', name: 'Alpha', age: 20 },
  { id: 'b', name: 'Beta', age: 10 },
  { id: 'c', name: 'Gamma', age: 30 },
];
const columns: ColumnsType<User> = [{ key: 'name', dataIndex: 'name', title: 'Name', width: 200 }];
const wrappers: VueWrapper[] = [];
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };
const settle = async () => {
  await nextTick();
  await nextTick();
};
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  vi.restoreAllMocks();
});

describe('Table native data and engine boundaries', () => {
  it('renders native slots on the server without resolving a browser-only sticky container', async () => {
    const container = vi.fn(() => {
      throw new Error('sticky container read during SSR');
    });
    const app = createSSRApp({
      render: () =>
        h(
          Table<User>,
          {
            rowKey: 'id',
            columns,
            dataSource: rows.slice(0, 1),
            pagination: false,
            sticky: { getContainer: container },
          },
          {
            title: ({ data }: import('../interface').TableDataSlotProps<User>) =>
              h('span', `${data[0]?.name}:0`),
          },
        ),
    });
    const html = await renderToString(app);
    expect(html).toContain('Alpha:0');
    expect(html).toContain('data-row-key="a"');
    expect(container).not.toHaveBeenCalled();
  });
  it('memoizes only data render work while native slots track current records and their own dependencies', async () => {
    const data = shallowRef(rows.slice(0, 1));
    const phase = ref(0);
    const render = vi.fn((_value: unknown, record: User) => record.name);
    const cols = shallowRef<ColumnsType<User>>([
      { ...columns[0], render, shouldCellUpdate: () => false },
    ]);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Table<User>,
            { rowKey: 'id', columns: cols.value, dataSource: data.value, pagination: false },
            {
              bodyCell: ({
                record,
                originNode,
              }: {
                record: User;
                originNode: import('vue').VNodeChild;
              }) => h('span', [`${record.name}:${phase.value}:`, originNode]),
            },
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    expect(wrapper.get('tbody').text()).toBe('Alpha:0:Alpha');
    phase.value = 1;
    await settle();
    expect(wrapper.get('tbody').text()).toBe('Alpha:1:Alpha');
    expect(render).toHaveBeenCalledTimes(1);
    data.value = [{ id: 'a', name: 'New Alpha', age: 21 }];
    await settle();
    expect(wrapper.get('tbody').text()).toBe('New Alpha:1:Alpha');
    expect(render).toHaveBeenCalledTimes(1);
    cols.value = [{ ...cols.value[0], render: (_value, record) => record.name.toUpperCase() }];
    await settle();
    expect(wrapper.get('tbody').text()).toBe('New Alpha:1:NEW ALPHA');
  });
  it('reports proposed controlled sort data and resumes from the accepted order when control is withdrawn', async () => {
    const change = vi.fn();
    const controlled: ColumnsType<User> = [
      { ...columns[0], sorter: (a, b) => a.age - b.age, sortOrder: null },
    ];
    const wrapper = mount(Table<User>, {
      ...options,
      props: {
        rowKey: 'id',
        columns: controlled,
        dataSource: rows,
        pagination: false,
        onChange: change,
      },
    });
    wrappers.push(wrapper);
    await wrapper.get('.apollo-table-column-has-sorters').trigger('click');
    expect(
      wrapper.findAll('tbody tr[data-row-key]').map((row) => row.attributes('data-row-key')),
    ).toEqual(['a', 'b', 'c']);
    expect(change.mock.calls[0]?.[3].currentDataSource.map((row: User) => row.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
    await wrapper.setProps({ columns: [{ ...columns[0], sorter: (a, b) => a.age - b.age }] });
    expect(
      wrapper.findAll('tbody tr[data-row-key]').map((row) => row.attributes('data-row-key')),
    ).toEqual(['a', 'b', 'c']);
    await wrapper.get('.apollo-table-column-has-sorters').trigger('click');
    expect(
      wrapper.findAll('tbody tr[data-row-key]').map((row) => row.attributes('data-row-key')),
    ).toEqual(['b', 'a', 'c']);
  });
  it('does not mount header slot controls or duplicate filter owners inside width measurement cells', async () => {
    const wrapper = mount(Table<User>, {
      ...options,
      props: {
        rowKey: 'id',
        columns: [{ ...columns[0], filters: [{ text: 'Alpha', value: 'a' }] }],
        dataSource: rows,
        pagination: false,
        scroll: { x: 500, y: 100 },
      },
      slots: {
        headerCell: ({ title }: import('../interface').TableHeaderCellSlotProps<User>) =>
          h('span', [h('button', { 'data-header-control': 'yes' }, 'Header action'), title]),
      },
    });
    wrappers.push(wrapper);
    await settle();
    expect(wrapper.findAll('.apollo-table-filter-trigger')).toHaveLength(1);
    expect(wrapper.findAll('[data-header-control]')).toHaveLength(1);
    expect(
      wrapper.find('.apollo-table-measure-row button, .apollo-table-measure-row input').exists(),
    ).toBe(false);
  });
  it('uses current filter configuration and reports a rejected filter proposal without changing accepted rows', async () => {
    const change = vi.fn();
    const closed = vi.fn();
    const custom: NonNullable<ColumnsType<User>[number]['filterDropdown']> = ({
      setSelectedKeys,
      confirm,
      clearFilters,
      close,
    }: import('../interface').FilterDropdownProps<User>) =>
      h('div', [
        h(
          'button',
          {
            'data-apply-filter': 'yes',
            onClick: () => {
              setSelectedKeys(['Alpha']);
              confirm({ closeDropdown: false });
            },
          },
          'Apply',
        ),
        h(
          'button',
          { 'data-reset-filter': 'yes', onClick: () => clearFilters?.({ confirm: true }) },
          'Reset',
        ),
        h('button', { 'data-close-filter': 'yes', onClick: close }, 'Close'),
      ]);
    const config = (controlled: boolean): ColumnsType<User> => [
      {
        ...columns[0],
        filterDropdown: custom,
        onFilter: (value, record) => record.name === value,
        ...(controlled ? { filteredValue: null } : {}),
        defaultFilteredValue: controlled ? ['Alpha'] : ['Beta'],
        filterResetToDefaultFilteredValue: !controlled,
        filterDropdownProps: { open: true, onOpenChange: closed },
      },
    ];
    const wrapper = mount(Table<User>, {
      ...options,
      props: {
        rowKey: 'id',
        columns: config(true),
        dataSource: rows,
        pagination: false,
        onChange: change,
      },
    });
    wrappers.push(wrapper);
    await settle();
    document.querySelector<HTMLButtonElement>('[data-apply-filter]')?.click();
    await settle();
    expect(change.mock.calls[0]?.[3].currentDataSource.map((row: User) => row.id)).toEqual(['a']);
    expect(wrapper.findAll('tbody tr[data-row-key]')).toHaveLength(3);
    await wrapper.setProps({ columns: config(false) });
    await settle();
    document.querySelector<HTMLButtonElement>('[data-reset-filter]')?.click();
    await settle();
    expect(change.mock.calls.at(-1)?.[3].currentDataSource.map((row: User) => row.id)).toEqual([
      'b',
    ]);
    expect(
      wrapper.findAll('tbody tr[data-row-key]').map((row) => row.attributes('data-row-key')),
    ).toEqual(['b']);
    document.querySelector<HTMLButtonElement>('[data-close-filter]')?.click();
    await settle();
    expect(closed).toHaveBeenLastCalledWith(false, { source: 'menu' });
    expect(document.querySelector('[data-close-filter]')).not.toBeNull();
  });
  it('replaces a current comparator without losing its accepted sort order', async () => {
    const wrapper = mount(Table<User>, {
      ...options,
      props: {
        rowKey: 'id',
        columns: [{ ...columns[0], sorter: (a, b) => a.age - b.age, defaultSortOrder: 'ascend' }],
        dataSource: rows,
        pagination: false,
      },
    });
    wrappers.push(wrapper);
    expect(
      wrapper.findAll('tbody tr[data-row-key]').map((row) => row.attributes('data-row-key')),
    ).toEqual(['b', 'a', 'c']);
    await wrapper.setProps({ columns: [{ ...columns[0], sorter: (a, b) => b.age - a.age }] });
    expect(
      wrapper.findAll('tbody tr[data-row-key]').map((row) => row.attributes('data-row-key')),
    ).toEqual(['c', 'a', 'b']);
  });
  it('preserves native header listeners and cancellation with Enter/Space sorting', async () => {
    const change = vi.fn();
    const first = vi.fn();
    const second = vi.fn();
    const once = vi.fn();
    const col: ColumnsType<User> = [
      {
        ...columns[0],
        sorter: (a, b) => a.age - b.age,
        onHeaderCell: () =>
          mergeProps(
            { onKeydown: first, onClick: (event: Event) => event.preventDefault() },
            { onKeydown: second, onKeydownOnce: once },
          ),
      },
    ];
    const wrapper = mount(Table<User>, {
      ...options,
      props: { rowKey: 'id', columns: col, dataSource: rows, pagination: false, onChange: change },
    });
    wrappers.push(wrapper);
    const header = wrapper.get('th');
    await header.trigger('click');
    expect(change).not.toHaveBeenCalled();
    await header.trigger('keydown', { key: 'Enter' });
    await header.trigger('keydown', { key: ' ' });
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(2);
  });
  it('renders fixed top and bottom summary content in the actual corresponding holder', async () => {
    const fixed = ref<'top' | 'bottom'>('top');
    const showHeader = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Table<User>,
            {
              rowKey: 'id',
              columns,
              dataSource: rows,
              pagination: false,
              scroll: { x: 200, y: 100 },
              showHeader: showHeader.value,
            },
            {
              summary: () =>
                h(Table.Summary, { fixed: fixed.value }, () =>
                  h(Table.Summary.Row, null, () =>
                    h(Table.Summary.Cell, { index: 0 }, () => 'Current summary'),
                  ),
                ),
            },
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    await settle();
    expect(wrapper.get('.apollo-table-header tfoot').text()).toBe('Current summary');
    expect(wrapper.findAll('tfoot')).toHaveLength(1);
    showHeader.value = false;
    await settle();
    expect(wrapper.get('.apollo-table-header tfoot').text()).toBe('Current summary');
    expect(wrapper.find('thead').exists()).toBe(false);
    fixed.value = 'bottom';
    await settle();
    expect(wrapper.find('.apollo-table-header').exists()).toBe(false);
    expect(wrapper.get('.apollo-table-summary tfoot').text()).toBe('Current summary');
    expect(wrapper.findAll('tfoot')).toHaveLength(1);
  });
  it('keeps hidden expand columns, unavailable icons and cancelled row expansion inert', async () => {
    const expanded = vi.fn();
    const wrapper = mount(Table<User>, {
      ...options,
      props: {
        rowKey: 'id',
        columns: [Table.EXPAND_COLUMN, ...columns],
        dataSource: rows,
        pagination: false,
        expandable: {
          showExpandColumn: false,
          expandRowByClick: true,
          onExpandedRowsChange: expanded,
        },
        onRow: () => ({ onClick: (event: Event) => event.preventDefault() }),
      },
      slots: { expandedRow: () => h('p', 'Details') },
    });
    wrappers.push(wrapper);
    expect(wrapper.find('.apollo-table-row-expand-icon').exists()).toBe(false);
    await wrapper.get('tr[data-row-key=a]').trigger('click');
    expect(expanded).not.toHaveBeenCalled();
    await wrapper.setProps({
      expandable: { rowExpandable: () => false, onExpandedRowsChange: expanded },
      onRow: undefined,
    });
    const icon = wrapper.get<HTMLElement>('.apollo-table-row-expand-icon');
    expect(icon.element.tagName).toBe('SPAN');
    expect(icon.attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('button.apollo-table-row-expand-icon').exists()).toBe(false);
    icon.element.click();
    expect(expanded).not.toHaveBeenCalled();
  });
  it('treats empty children as leaves and gives a present empty slot precedence over locale content', async () => {
    const expanded = vi.fn();
    const data: User[] = [
      { id: 'p', name: 'Parent', age: 1, children: [{ id: 'a', name: 'Alpha', age: 20 }] },
      { id: 'leaf', name: 'Leaf', age: 2, children: [] },
    ];
    const wrapper = mount(Table<User>, {
      ...options,
      props: {
        rowKey: 'id',
        columns,
        dataSource: data,
        pagination: false,
        expandable: { expandRowByClick: true, onExpandedRowsChange: expanded },
      },
    });
    wrappers.push(wrapper);
    expect(
      wrapper.get('[data-row-key=leaf] .apollo-table-row-expand-icon').attributes('aria-hidden'),
    ).toBe('true');
    expect(wrapper.find('[data-row-key=leaf] button.apollo-table-row-expand-icon').exists()).toBe(
      false,
    );
    await wrapper.get('[data-row-key=leaf]').trigger('click');
    expect(expanded).not.toHaveBeenCalled();
    const empty = mount(Table<User>, {
      ...options,
      props: { columns, dataSource: [], pagination: false, locale: { emptyText: 'Fallback' } },
      slots: { emptyText: () => null },
    });
    wrappers.push(empty);
    expect(empty.text()).not.toContain('Fallback');
  });
  it('preserves accepted selected records across data replacement without leaking undefined rows or rejected proposals', async () => {
    const data = shallowRef(rows.slice(0, 1));
    const keys = ref<string[] | undefined>(['a']);
    const change = vi.fn();
    const selection = computed<TableRowSelection<User>>(() => ({
      selectedRowKeys: keys.value,
      preserveSelectedRowKeys: true,
      onChange: change,
    }));
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Table<User>, {
            rowKey: 'id',
            columns,
            dataSource: data.value,
            rowSelection: selection.value,
            pagination: false,
          }),
      }),
      options,
    );
    wrappers.push(wrapper);
    data.value = rows.slice(1, 2);
    await settle();
    wrapper.get<HTMLInputElement>('tbody input[type=checkbox]').element.click();
    await settle();
    expect(change.mock.calls[0]?.[0]).toEqual(['a', 'b']);
    expect(change.mock.calls[0]?.[1]).toEqual([rows[0], rows[1]]);
    expect(wrapper.get<HTMLInputElement>('tbody input[type=checkbox]').element.checked).toBe(false);
    keys.value = undefined;
    data.value = rows.slice(2);
    await settle();
    wrapper.get<HTMLInputElement>('tbody input[type=checkbox]').element.click();
    await settle();
    expect(change.mock.calls[1]?.[0]).toEqual(['a', 'c']);
    expect(change.mock.calls[1]?.[1]).toEqual([rows[0], rows[2]]);
  });
  it('supports shift range deselection through real native input clicks', async () => {
    const change = vi.fn();
    const wrapper = mount(Table<User>, {
      ...options,
      props: {
        rowKey: 'id',
        columns,
        dataSource: rows,
        pagination: false,
        rowSelection: { defaultSelectedRowKeys: ['a', 'b', 'c'], onChange: change },
      },
    });
    wrappers.push(wrapper);
    wrapper.get<HTMLInputElement>('[data-row-key=a] input').element.click();
    await settle();
    wrapper.get<HTMLInputElement>('[data-row-key=a] input').element.click();
    await settle();
    wrapper
      .get<HTMLInputElement>('[data-row-key=c] input')
      .element.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    await settle();
    expect(change.mock.calls.at(-1)?.[0]).toEqual([]);
    expect(
      wrapper.findAll<HTMLInputElement>('tbody input').every((input) => !input.element.checked),
    ).toBe(true);
  });
  it('uses the current row key source for expansion', async () => {
    const key = ref<'id' | 'alt'>('id');
    const change = vi.fn();
    const data: User[] = [{ id: 'a', name: 'Alpha', age: 20, alt: 'new-a' }];
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Table<User>,
            {
              rowKey: key.value,
              columns,
              dataSource: data,
              pagination: false,
              expandable: { onExpandedRowsChange: change },
            },
            { expandedRow: () => h('p', 'Details') },
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    key.value = 'alt';
    await settle();
    await wrapper.get('.apollo-table-row-expand-icon').trigger('click');
    expect(change).toHaveBeenLastCalledWith(['new-a']);
    expect(wrapper.get('[data-row-key="new-a"]').attributes('data-row-key')).toBe('new-a');
  });
  it.each([false, true])(
    'owns real native scroll events with arrays/once and the actual current container (virtual=%s)',
    async (virtual) => {
      const first = vi.fn();
      const second = vi.fn();
      const once = vi.fn();
      const wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(
              Table<User>,
              mergeProps(
                {
                  rowKey: 'id',
                  columns,
                  dataSource: rows,
                  pagination: false,
                  virtual,
                  scroll: { x: 200, y: 120 },
                  onScroll: first,
                },
                { onScroll: second, onScrollOnce: once },
              ),
            ),
        }),
        options,
      );
      wrappers.push(wrapper);
      await settle();
      const holder = wrapper.get<HTMLElement>(
        virtual ? '.apollo-table-tbody-virtual-holder' : '.apollo-table-body',
      );
      holder.element.scrollTop = 15;
      const event = new Event('scroll');
      holder.element.dispatchEvent(event);
      await settle();
      holder.element.dispatchEvent(new Event('scroll'));
      await settle();
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(2);
      expect(once).toHaveBeenCalledTimes(1);
      expect(first.mock.calls[0]?.[0]).toBe(event);
      expect(event.target).toBe(holder.element);
    },
  );
  it('keeps a custom body service, current native body ref and quoted row keys usable by the public expose', async () => {
    const instance = shallowRef<TableRef | null>(null);
    const mode = ref(false);
    const scroll = vi.fn();
    const bodyScrollTo = vi.fn();
    const into = vi.fn();
    const service: NonNullable<TableProps<User>['components']>['body'] = (data, info) =>
      h(
        'div',
        { ref: info.ref, onScroll: info.onScroll, 'data-custom-body': 'yes' },
        data.map((record) => h('section', { 'data-row-key': record.id }, record.name)),
      );
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Table<User>, {
            ref: instance,
            rowKey: 'id',
            columns,
            dataSource: [{ id: 'a"b', name: 'Quoted', age: 10 }],
            pagination: false,
            scroll: { x: 200, y: 100 },
            components: mode.value ? { body: service } : undefined,
            onScroll: scroll,
          }),
      }),
      options,
    );
    wrappers.push(wrapper);
    await settle();
    const row = wrapper.get<HTMLElement>('[data-row-key]').element;
    row.scrollIntoView = into;
    instance.value?.scrollTo({ key: 'a"b' });
    expect(into).toHaveBeenCalledTimes(1);
    mode.value = true;
    await settle();
    const body = wrapper.get<HTMLElement>('[data-custom-body]').element;
    body.scrollTo = bodyScrollTo;
    body.dispatchEvent(new Event('scroll'));
    expect(scroll).toHaveBeenCalledTimes(1);
    instance.value?.scrollTo({ top: 12 });
    expect(bodyScrollTo).toHaveBeenLastCalledWith({ top: 12 });
    expect(instance.value?.nativeElement()).toBe(wrapper.get('.apollo-table').element);
  });
  it('uses actual custom wrapper/row/cell Vue components without fallback or native attribute duplication', async () => {
    const warn = vi.spyOn(console, 'warn');
    const part = (tag: string, label: string) =>
      defineComponent({
        inheritAttrs: false,
        setup:
          (_props, { attrs, slots }) =>
          () =>
            h(tag, { ...attrs, [`data-${label}`]: 'yes' }, slots.default?.()),
      });
    const wrapper = mount(Table<User>, {
      ...options,
      props: {
        rowKey: 'id',
        columns,
        dataSource: rows.slice(0, 1),
        pagination: false,
        components: {
          table: part('table', 'table'),
          header: {
            wrapper: part('thead', 'head'),
            row: part('tr', 'header-row'),
            cell: part('th', 'header-cell'),
          },
          body: {
            wrapper: part('tbody', 'body'),
            row: part('tr', 'row'),
            cell: part('td', 'cell'),
          },
        },
      },
    });
    wrappers.push(wrapper);
    await settle();
    for (const label of ['table', 'head', 'header-row', 'header-cell', 'body', 'row', 'cell'])
      expect(wrapper.find(`[data-${label}=yes]`).exists()).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });
  it('measures actual Vue item roots so scrollTo terminates from measured heights', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.isConnected ? document.body : null;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.hasAttribute('data-height-item') ? 30 : 50;
    });
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(50);
    const error = vi.spyOn(console, 'error');
    const instance = shallowRef<VirtualListExposed | null>(null);
    const Item = defineComponent({
      props: { value: { type: Number, required: true } },
      setup: (props) => () =>
        h(
          'div',
          { 'data-height-item': props.value, style: { height: '30px' } },
          String(props.value),
        ),
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            VirtualList,
            {
              ref: instance,
              data: [0, 1, 2],
              itemKey: (item: unknown) => String(item),
              height: 50,
              itemHeight: 20,
            },
            { default: ({ item }: { item: unknown }) => h(Item, { value: Number(item) }) },
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    await settle();
    instance.value?.scrollTo({ index: 2, align: 'bottom' });
    for (let tick = 0; tick < 15; tick++) {
      await nextTick();
      await Promise.resolve();
    }
    expect(error).not.toHaveBeenCalled();
    expect(instance.value?.nativeElement?.scrollTop).toBe(40);
  });
  it('rebinds a Vue VirtualList holder after its component replaces the native root', async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const unobserve = vi.spyOn(ResizeObserver.prototype, 'unobserve');
    const instance = shallowRef<VirtualListExposed | null>(null);
    const tag = ref(false);
    const scroll = vi.fn();
    const holder = defineComponent({
      inheritAttrs: false,
      setup:
        (_props, { attrs, slots }) =>
        () =>
          h(tag.value ? 'section' : 'div', attrs, slots.default?.()),
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            VirtualList,
            {
              ref: instance,
              component: holder,
              data: Array.from({ length: 20 }, (_unused, index) => index),
              itemKey: (item: unknown) => String(item),
              height: 60,
              itemHeight: 20,
              onScroll: scroll,
            },
            { default: ({ item }: { item: unknown }) => h('div', String(item)) },
          ),
      }),
      options,
    );
    wrappers.push(wrapper);
    await settle();
    const first = instance.value?.nativeElement;
    expect(first?.tagName).toBe('DIV');
    instance.value?.scrollTo(12);
    tag.value = true;
    await settle();
    const second = instance.value?.nativeElement;
    expect(second?.tagName).toBe('SECTION');
    expect(second).not.toBe(first);
    expect(second?.scrollTop).toBe(12);
    expect(unobserve).toHaveBeenCalledWith(first);
    expect(observe).toHaveBeenCalledWith(second);
    second?.dispatchEvent(new Event('scroll'));
    expect(scroll).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    wrappers.splice(wrappers.indexOf(wrapper), 1);
    expect(instance.value).toBe(null);
    expect(first?.isConnected).toBe(false);
    expect(second?.isConnected).toBe(false);
    expect(unobserve).toHaveBeenCalledWith(second);
  });
});
