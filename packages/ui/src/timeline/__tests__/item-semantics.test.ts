import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Timeline } from '../index';
import type { TimelineItemType } from '../interface';
import { useItems } from '../use-items';

it('preserves item semantic objects through the pure data conversion', () => {
  const classNames = { root: 'item-root', content: 'item-content' };
  const styles = { root: { minHeight: '80px' }, content: { opacity: 0.45 } };
  const result = useItems(
    { rootPrefixCls: 'apollo', prefixCls: 'apollo-timeline', mode: 'start' },
    [{ key: 'a', content: 'Alpha', classNames, styles }],
  );
  expect(result[0]?.classNames).toBe(classNames);
  expect(result[0]?.styles).toBe(styles);
});

it('renders current item semantic classes/styles with native content slots and existing priorities', async () => {
  const items: TimelineItemType[] = [
    {
      key: 'a',
      title: 'Alpha',
      content: 'Body',
      classNames: { root: 'item-root', content: 'item-content' },
      styles: {
        root: { minHeight: '80px', color: 'red' },
        content: { opacity: 0.45 },
        rail: { borderStyle: 'dashed' },
      },
      style: { color: 'blue' },
    },
    { key: 'b', content: 'Beta' },
  ];
  const w = mount(Timeline, {
    props: { items },
    slots: { itemContent: () => h('input', { 'aria-label': 'Semantic item input' }) },
  });
  const root = w.get('.item-root');
  const input = root.get('input');
  await input.setValue('kept');
  const node = input.element;
  expect(root.attributes('style')).toContain('min-height: 80px');
  expect(root.attributes('style')).toContain('color: blue');
  expect(root.get('.item-content').attributes('style')).toContain('opacity: 0.45');
  expect(root.get('.apollo-timeline-item-rail').attributes('style')).toContain(
    'border-style: dashed',
  );
  await w.setProps({
    items: [
      {
        ...items[0],
        key: 'a',
        classNames: { root: 'item-new', content: 'content-new' },
        styles: { root: { minHeight: '100px' }, content: { opacity: 0.7 } },
        content: 'Body updated',
      },
      { key: 'b', content: 'Beta' },
    ],
  });
  expect(w.find('.item-root').exists()).toBe(false);
  expect(w.get('.item-new').attributes('style')).toContain('min-height: 100px');
  expect(w.get('.content-new').attributes('style')).toContain('opacity: 0.7');
  expect(w.get('.item-new input').element).toBe(node);
  expect(w.get<HTMLInputElement>('.item-new input').element.value).toBe('kept');
});

it('SSR preserves item root/content semantic classes and styles', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Timeline, {
          items: [
            {
              key: 'a',
              content: 'Alpha',
              classNames: { root: 'ssr-item' },
              styles: { content: { opacity: 0.45 } },
            },
          ],
        }),
    }),
  );
  const container = document.createElement('div');
  container.innerHTML = html;
  expect(container.querySelector('.ssr-item')).not.toBeNull();
  expect(container.querySelector('.apollo-timeline-item-content')?.getAttribute('style')).toContain(
    'opacity:0.45',
  );
});
