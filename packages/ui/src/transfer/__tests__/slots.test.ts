/** F06 / D03: Transfer exposes typed Vue slots instead of content-rendering props. */
import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Transfer } from '../index';
import type {
  TransferFooterSlotProps,
  TransferItem,
  TransferItemSlotProps,
  TransferKey,
  TransferListSlotProps,
  TransferSelectAllLabelSlotProps,
} from '../interface';

const data: TransferItem[] = [
  { key: 'a', title: 'Alpha' },
  { key: 'b', title: 'Beta', disabled: true },
  { key: 'c', title: 'Gamma' },
];

it('F06: item and footer slots receive current direction, selection and disabled state', async () => {
  const change = vi.fn();
  const w = mount(Transfer, {
    props: { dataSource: data, targetKeys: ['c'], onSelectChange: change },
    slots: {
      item: ({ item, direction, selected, disabled }: TransferItemSlotProps) =>
        h('b', `${direction}:${item.title}:${selected}:${disabled}`),
      footer: ({ direction, selectedKeys, totalCount }: TransferFooterSlotProps) =>
        h('small', `${direction}:${selectedKeys.join(',')}:${totalCount}`),
    },
  });
  expect(w.findAll('b').map((n) => n.text())).toEqual([
    'left:Alpha:false:false',
    'left:Beta:false:true',
    'right:Gamma:false:false',
  ]);
  await w.get('.apollo-transfer-list-content-item').trigger('click');
  expect(w.get('b').text()).toBe('left:Alpha:true:false');
  expect(w.get('small').text()).toBe('left:a:2');
  expect(change).toHaveBeenCalledTimes(1);
  await w.setProps({ disabled: true });
  expect(w.get('b').text()).toBe('left:Alpha:true:true');
  w.unmount();
});

it('F06: conditionally added and removed item/footer/list slots update without remounting', async () => {
  const show = ref(false);
  const text = ref('first');
  const custom = ref(false);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Transfer,
          { dataSource: data },
          show.value
            ? {
                item: () => h('b', text.value),
                footer: () => h('small', text.value),
                ...(custom.value
                  ? {
                      list: ({ direction }: { direction: 'left' | 'right' }) =>
                        h('article', `${direction}:${text.value}`),
                    }
                  : {}),
              }
            : {},
        ),
    }),
  );
  const root = w.get('.apollo-transfer').element;
  expect(w.get('.apollo-transfer-list-content-item-text').text()).toBe('Alpha');
  show.value = true;
  await nextTick();
  expect(w.get('b').text()).toBe('first');
  custom.value = true;
  await nextTick();
  expect(w.findAll('article').map((n) => n.text())).toEqual(['left:first', 'right:first']);
  expect(w.get('small').text()).toBe('first');
  text.value = 'second';
  await nextTick();
  expect(w.get('article').text()).toBe('left:second');
  custom.value = false;
  await nextTick();
  expect(w.get('b').text()).toBe('second');
  show.value = false;
  await nextTick();
  expect(w.find('article').exists()).toBe(false);
  expect(w.find('small').exists()).toBe(false);
  expect(w.get('.apollo-transfer').element).toBe(root);
  expect(w.get('.apollo-transfer-list-content-item-text').text()).toBe('Alpha');
  w.unmount();
});

it('F06: empty slots stay empty; custom lists disable internal pagination', () => {
  const w = mount(Transfer, {
    props: { dataSource: data, pagination: { pageSize: 1 } },
    slots: { list: () => [], footer: () => [] },
  });
  expect(w.findAll('.apollo-transfer-list-body-customize-wrapper')).toHaveLength(2);
  expect(w.find('.apollo-pagination').exists()).toBe(false);
  expect(w.find('.apollo-transfer-list-content').exists()).toBe(false);
  expect(w.findAll('.apollo-transfer-list-footer')).toHaveLength(2);
  w.unmount();
  const emptyItem = mount(Transfer, { props: { dataSource: data }, slots: { item: () => [] } });
  expect(emptyItem.get('.apollo-transfer-list-content-item-text').text()).toBe('');
  emptyItem.unmount();
});

it('F06: list slot selection works with controlled keys, moving, search and scroll', async () => {
  const selected = ref<TransferKey[]>([]);
  const target = ref<TransferKey[]>([]);
  const scroll = vi.fn();
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Transfer,
          {
            dataSource: data,
            selectedKeys: selected.value,
            targetKeys: target.value,
            showSearch: true,
            onSelectChange: (left, right) => {
              selected.value = [...left, ...right];
            },
            onChange: (keys) => {
              target.value = keys;
            },
            onScroll: scroll,
          },
          {
            list: ({
              direction,
              filteredItems,
              selectedKeys,
              onItemSelect,
              onScroll,
            }: TransferListSlotProps) =>
              h(
                'div',
                { class: `custom-${direction}`, onScroll },
                filteredItems.map((item) =>
                  h(
                    'button',
                    {
                      disabled: !!item.disabled,
                      onClick: () => onItemSelect(item.key, !selectedKeys.includes(item.key)),
                    },
                    String(item.title),
                  ),
                ),
              ),
          },
        ),
    }),
  );
  await w.get('.custom-left button').trigger('click');
  expect(selected.value).toEqual(['a']);
  await w.findAll('.apollo-transfer-actions button')[0]?.trigger('click');
  expect(target.value).toEqual(['a']);
  expect(w.get('.custom-right').text()).toBe('Alpha');
  await w.get('.custom-left').trigger('scroll');
  expect(scroll).toHaveBeenCalledTimes(1);
  const input = w.get('.apollo-transfer-list-search input');
  await input.setValue('Beta');
  expect(w.get('.custom-left').text()).toBe('Beta');
  w.unmount();
});

it('F06: SSR renders slot content, footer and selection labels', async () => {
  const html = await renderToString(
    h(
      Transfer,
      { dataSource: data, selectedKeys: ['a'] },
      {
        item: ({ item }: TransferItemSlotProps) => h('b', String(item.title)),
        footer: ({ direction }: TransferFooterSlotProps) => h('small', direction),
        selectAllLabel: ({ selectedCount, totalCount }: TransferSelectAllLabelSlotProps) =>
          `${selectedCount}/${totalCount}`,
      },
    ),
  );
  expect(html).toContain('<b>Alpha</b>');
  expect(html).toContain('<small>left</small>');
  expect(html).toContain('1/3');
});
