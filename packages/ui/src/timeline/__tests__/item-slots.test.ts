import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Timeline } from '../index';
import type { TimelineItemSlotProps } from '../interface';

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

it('native item title/content/icon slots receive one current item scope and override data content', () => {
  const w = mount(Timeline, {
    props: {
      items: [
        { key: 'a', title: 'Fallback title', content: 'Fallback content', icon: 'Fallback icon' },
      ],
    },
    slots: {
      itemTitle: ({ item, index }: TimelineItemSlotProps) => h('b', `${String(item.key)}:${index}`),
      itemContent: ({ item }: TimelineItemSlotProps) =>
        h('input', { 'aria-label': String(item.key) }),
      itemIcon: () => h('i', 'Native icon'),
    },
  });
  expect(w.get('.apollo-timeline-item-title b').text()).toBe('a:0');
  expect(w.get('input').attributes('aria-label')).toBe('a');
  expect(w.get('.apollo-timeline-item-icon i').text()).toBe('Native icon');
  expect(w.text()).not.toContain('Fallback');
  expect(console.error).not.toHaveBeenCalled();
});

it('conditional/current/empty item slots override fallback and restore it on removal', async () => {
  const show = ref(false);
  const empty = ref(false);
  const label = ref('first');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Timeline,
          {
            items: [
              {
                key: 'a',
                title: 'Fallback title',
                content: 'Fallback content',
                icon: 'Fallback icon',
              },
            ],
          },
          show.value
            ? {
                itemTitle: () => (empty.value ? [] : h('b', label.value)),
                itemContent: () => (empty.value ? [] : h('i', label.value)),
                itemIcon: () => (empty.value ? [] : h('strong', label.value)),
              }
            : {},
        ),
    }),
  );
  expect(w.text()).toContain('Fallback content');
  show.value = true;
  await nextTick();
  expect(w.get('b').text()).toBe('first');
  label.value = 'second';
  await nextTick();
  expect(w.get('i').text()).toBe('second');
  empty.value = true;
  await nextTick();
  expect(w.text()).not.toContain('Fallback');
  expect(w.find('b').exists()).toBe(false);
  expect(w.find('strong').exists()).toBe(false);
  expect(w.classes()).not.toContain('apollo-timeline-layout-alternate');
  show.value = false;
  await nextTick();
  expect(w.text()).toContain('Fallback title');
  expect(w.text()).toContain('Fallback content');
});

it('scoped content input survives data replacements and reverse with current display indices', async () => {
  const reverse = ref(false);
  const rows = ref([
    { key: 'a', title: 'Alpha' },
    { key: 'b', title: 'Beta' },
  ]);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Timeline,
          { items: rows.value, reverse: reverse.value },
          {
            itemContent: ({ item, index }: TimelineItemSlotProps) =>
              h('div', [
                h('b', `${String(item.title)}:${index}`),
                h('input', { 'data-row': item.key }),
              ]),
          },
        ),
    }),
  );
  const input = w.get('input[data-row="a"]');
  const node = input.element;
  await input.setValue('kept');
  rows.value = [
    { key: 'a', title: 'Alpha updated' },
    { key: 'b', title: 'Beta updated' },
  ];
  reverse.value = true;
  await nextTick();
  expect(w.findAll('.apollo-timeline-item-content b').map((node) => node.text())).toEqual([
    'Beta updated:0',
    'Alpha updated:1',
  ]);
  expect(w.get('input[data-row="a"]').element).toBe(node);
  expect(w.get<HTMLInputElement>('input[data-row="a"]').element.value).toBe('kept');
});

it('renders native item slots during SSR', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(
          Timeline,
          { items: [{ key: 'a', content: 'Fallback' }] },
          {
            itemTitle: ({ index }: TimelineItemSlotProps) => h('b', `Title ${index}`),
            itemContent: ({ item }: TimelineItemSlotProps) => h('article', String(item.key)),
          },
        ),
    }),
  );
  expect(html).toContain('<b>Title 0</b>');
  expect(html).toContain('<article>a</article>');
  expect(html).not.toContain('Fallback');
});
