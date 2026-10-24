import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import { Timeline } from '../index';

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

it('updates data and keyed order while retaining a user-edited input', async () => {
  const field = () => h('input', { 'data-timeline-input': 'a' });
  const w = mount(Timeline, {
    props: {
      items: [
        { key: 'a', title: 'Alpha', content: field() },
        { key: 'b', title: 'Beta' },
      ],
    },
  });
  const input = w.get('input');
  await input.setValue('kept');
  const node = input.element;
  await w.setProps({
    items: [
      { key: 'b', title: 'Beta updated' },
      { key: 'a', title: 'Alpha updated', content: field() },
    ],
  });
  expect(w.findAll('.apollo-timeline-item-title').map((tile) => tile.text())).toEqual([
    'Beta updated',
    'Alpha updated',
  ]);
  expect(w.get('input').element).toBe(node);
  expect(w.get<HTMLInputElement>('input').element.value).toBe('kept');
});

it('updates reverse, orientation, mode and derived placements', async () => {
  const w = mount(Timeline, {
    props: {
      items: [
        { key: 'a', content: 'Alpha' },
        { key: 'b', content: 'Beta' },
      ],
    },
  });
  expect(w.findAll('.apollo-timeline-item-placement-start')).toHaveLength(2);
  await w.setProps({ reverse: true, orientation: 'horizontal', mode: 'end' });
  expect(w.classes()).toContain('apollo-timeline-horizontal');
  expect(w.findAll('.apollo-timeline-item-content').map((tile) => tile.text())).toEqual([
    'Beta',
    'Alpha',
  ]);
  expect(w.findAll('.apollo-timeline-item-placement-end')).toHaveLength(2);
});

it('updates titleSpan and removes it in alternate mode', async () => {
  const w = mount(Timeline, { props: { items: [{ key: 'a', content: 'Alpha' }], titleSpan: 6 } });
  expect(w.attributes('style')).toContain('--apollo-timeline-head-span: 6');
  await w.setProps({ titleSpan: '35%' });
  expect(w.attributes('style')).toContain('--apollo-timeline-head-span-ptg: 35%');
  expect(w.attributes('style')).not.toContain('--apollo-timeline-head-span:');
  await w.setProps({ mode: 'alternate' });
  expect(w.attributes('style') ?? '').not.toContain('--apollo-timeline-head-span');
});

it('updates native class/style/id without replacing the root', async () => {
  const updated = ref(false);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(Timeline, {
          items: [{ key: 'a', content: 'Alpha' }],
          id: updated.value ? 'second' : 'first',
          class: updated.value ? ['second', { active: true }] : 'first',
          style: { color: updated.value ? 'blue' : 'red' },
        }),
    }),
  );
  const root = w.element;
  updated.value = true;
  await nextTick();
  expect(w.attributes('id')).toBe('second');
  expect(w.classes()).toContain('second');
  expect(w.classes()).not.toContain('first');
  expect(w.attributes('style')).toContain('color: blue');
  expect(w.element).toBe(root);
});

it('updates the timeline prefix and every semantic item class', async () => {
  const w = mount(Timeline, {
    props: { prefixCls: 'first-timeline', items: [{ key: 'a', title: 'Alpha', content: 'Body' }] },
  });
  expect(w.find('.first-timeline-item-title').exists()).toBe(true);
  await w.setProps({ prefixCls: 'second-timeline' });
  expect(w.classes()).toContain('second-timeline');
  expect(w.find('.second-timeline-item-title').exists()).toBe(true);
  expect(w.find('.first-timeline-item-title').exists()).toBe(false);
});

it('SSR accepts native string styles and CSS custom properties', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Timeline, {
          items: [{ key: 'a', content: 'Alpha' }],
          style: 'color: red; --timeline-accent: blue',
        }),
    }),
  );
  const container = document.createElement('div');
  container.innerHTML = html;
  const root = container.querySelector('ol');
  expect(root?.style.color).toBe('red');
  expect(root?.style.getPropertyValue('--timeline-accent')).toBe('blue');
});

it('updates ConfigProvider direction and component style defaults', async () => {
  const rtl = ref(false);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            direction: rtl.value ? 'rtl' : 'ltr',
            components: {
              timeline: {
                className: rtl.value ? 'configured-new' : 'configured-old',
                style: { color: rtl.value ? 'blue' : 'red' },
              },
            },
          },
          { default: () => h(Timeline, { items: [{ key: 'a', content: 'Alpha' }] }) },
        ),
    }),
  );
  expect(w.find('ol').classes()).toContain('configured-old');
  rtl.value = true;
  await nextTick();
  expect(w.find('ol').classes()).toContain('apollo-timeline-rtl');
  expect(w.find('ol').classes()).toContain('configured-new');
  expect(w.find('ol').classes()).not.toContain('configured-old');
  expect(w.find('ol').attributes('style')).toContain('color: blue');
});

it('keeps native root styles above semantic root styles across updates', async () => {
  const w = mount(Timeline, {
    props: { items: [{ key: 'a', content: 'Alpha' }], styles: { root: { color: 'red' } } },
    attrs: { style: 'color: blue' },
  });
  expect(w.attributes('style')).toContain('color: blue');
  await w.setProps({ style: 'color: green' });
  expect(w.attributes('style')).toContain('color: green');
});
