/** F08: rows are derived from this render's children, without publishing render state. */
import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Descriptions, DescriptionsItem } from '../index';
import type { DescriptionsItemType } from '../interface';

it('F08: the items channel, including [], does not evaluate ignored option children', async () => {
  const children = vi.fn(() => h(DescriptionsItem, { label: 'Ignored' }, () => 'Ignored content'));
  const w = mount(Descriptions, {
    props: { items: [{ key: 'data', label: 'Data', children: 'Value' }] },
    slots: { default: children },
  });
  expect(w.text()).toContain('Data');
  expect(w.text()).not.toContain('Ignored');
  expect(children).not.toHaveBeenCalled();
  await w.setProps({ items: [] });
  expect(w.find('td').exists()).toBe(false);
  expect(children).not.toHaveBeenCalled();
  await w.setProps({ items: undefined });
  expect(w.text()).toContain('Ignored content');
  expect(children).toHaveBeenCalledTimes(1);
  w.unmount();
});

it('F08: slot row insertion/removal, filled spans and unrelated attrs update once', async () => {
  const count = ref(1);
  const marker = ref('first');
  let updates = 0;
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Descriptions,
          {
            column: 3,
            'data-marker': marker.value,
            onVnodeUpdated: () => {
              updates += 1;
            },
          },
          {
            default: () =>
              Array.from({ length: count.value }, (_, i) =>
                h(DescriptionsItem, { key: i, label: `Label ${i}` }, () => `Content ${i}`),
              ),
          },
        ),
    }),
  );
  const cells = () => w.findAll('td').map((cell) => cell.attributes('colspan'));
  expect(cells()).toEqual(['3']);
  count.value = 4;
  await nextTick();
  expect(cells()).toEqual(['1', '1', '1', '3']);
  count.value = 1;
  await nextTick();
  expect(cells()).toEqual(['3']);
  const before = updates;
  marker.value = 'second';
  await nextTick();
  await nextTick();
  expect(w.get('.apollo-descriptions').attributes('data-marker')).toBe('second');
  expect(updates - before).toBe(1);
  w.unmount();
});

it('F08: data rows remain reactive for merged cells and layout changes', async () => {
  const items: DescriptionsItemType[] = [
    { key: 'a', label: 'A', children: 'Alpha', span: 'filled' },
    { key: 'b', label: 'B', children: 'Beta' },
  ];
  const w = mount(Descriptions, { props: { items, column: 3, bordered: true } });
  expect(w.findAll('td').map((cell) => cell.attributes('colspan'))).toEqual(['5', '5']);
  await w.setProps({
    items: [{ key: 'c', label: 'C', children: 'Gamma' }],
    column: 2,
    layout: 'vertical',
  });
  expect(w.findAll('td').map((cell) => cell.attributes('colspan'))).toEqual(['2']);
  expect(w.text()).toContain('Gamma');
  expect(w.text()).not.toContain('Alpha');
  w.unmount();
});

it('F08: slot rows hydrate without mismatch or replacing the table', async () => {
  const render = () =>
    h(
      Descriptions,
      { column: 2 },
      { default: () => h(DescriptionsItem, { label: 'SSR' }, () => h('strong', 'Content')) },
    );
  const container = document.createElement('div');
  container.innerHTML = await renderToString(createSSRApp({ render }));
  document.body.append(container);
  const table = container.querySelector('table');
  const warn = vi.spyOn(console, 'warn');
  const error = vi.spyOn(console, 'error');
  const app = createSSRApp({ render });
  try {
    app.mount(container);
    await nextTick();
    expect(container.querySelector('table')).toBe(table);
    expect(container.querySelector('strong')?.textContent).toBe('Content');
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/hydration|recursive/i);
    expect(error.mock.calls.flat().join(' ')).not.toMatch(/hydration|recursive/i);
  } finally {
    app.unmount();
    container.remove();
    warn.mockRestore();
    error.mockRestore();
  }
});
