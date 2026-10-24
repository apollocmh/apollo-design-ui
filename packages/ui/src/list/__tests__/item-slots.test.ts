import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  createCommentVNode,
  createSSRApp,
  createTextVNode,
  defineComponent,
  Fragment,
  h,
  nextTick,
  ref,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { List, ListItem, ListItemMeta } from '../index';

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  const calls = [...warn.mock.calls];
  warn.mockRestore();
  expect(calls).toEqual([]);
});

it('F11: Meta slots override props, update, and independently suppress empty wrappers', async () => {
  const show = ref(false);
  const empty = ref(false);
  const label = ref('first');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          ListItemMeta,
          {
            avatar: 'prop avatar',
            title: 'prop title',
            description: 'prop description',
          },
          show.value
            ? {
                avatar: () => (empty.value ? [] : h('img', { alt: label.value })),
                title: () => (empty.value ? [] : h('a', label.value)),
                description: () => (empty.value ? [] : h('p', label.value)),
              }
            : {},
        ),
    }),
  );
  const root = w.element;
  show.value = true;
  await nextTick();
  expect(w.get('h4 a').text()).toBe('first');
  expect(w.get('img').attributes('alt')).toBe('first');
  expect(w.get('.apollo-list-item-meta-description p').text()).toBe('first');
  expect(w.text()).not.toContain('prop');
  label.value = 'second';
  await nextTick();
  expect(w.get('h4 a').text()).toBe('second');
  empty.value = true;
  await nextTick();
  expect(w.find('.apollo-list-item-meta-avatar').exists()).toBe(false);
  expect(w.find('.apollo-list-item-meta-content').exists()).toBe(false);
  show.value = false;
  await nextTick();
  expect(w.get('h4').text()).toBe('prop title');
  expect(w.element).toBe(root);
});

it('F11: Meta preserves title heading semantics, description-only content and numeric zero', () => {
  const w = mount(ListItemMeta, {
    props: { title: 'fallback' },
    slots: { title: () => [], description: () => h('span', 'Description'), avatar: () => 0 },
  });
  expect(w.find('h4').exists()).toBe(false);
  expect(w.get('.apollo-list-item-meta-description').text()).toBe('Description');
  expect(w.get('.apollo-list-item-meta-avatar').text()).toBe('0');
});

it('F11: vertical extra slots drive layout and flex classes from current nonempty content', async () => {
  const show = ref(false);
  const empty = ref(false);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(List, { itemLayout: 'vertical' }, () =>
          h(
            ListItem,
            { extra: 'prop extra' },
            {
              default: () => h('input', { value: 'body' }),
              ...(show.value ? { extra: () => (empty.value ? [] : h('aside', 'slot extra')) } : {}),
            },
          ),
        ),
    }),
  );
  const input = w.get('input').element;
  show.value = true;
  await nextTick();
  expect(w.get('.apollo-list-item-extra aside').text()).toBe('slot extra');
  expect(w.get('input').element).toBe(input);
  expect(w.get('.apollo-list-item').classes()).not.toContain('apollo-list-item-no-flex');
  empty.value = true;
  await nextTick();
  expect(w.find('.apollo-list-item-extra').exists()).toBe(false);
  expect(w.find('.apollo-list-item-main').exists()).toBe(false);
  expect(w.get('.apollo-list-item').classes()).toContain('apollo-list-item-no-flex');
  expect(w.text()).not.toContain('prop extra');
  show.value = false;
  await nextTick();
  expect(w.get('.apollo-list-item-extra').text()).toBe('prop extra');
});

it('F11: horizontal extra remains a sibling and semantic styles apply to vertical slot wrappers', () => {
  const horizontal = mount(ListItem, {
    slots: { default: () => h('b', 'Body'), extra: () => h('aside', 'Extra') },
  });
  expect(horizontal.get('aside').element.parentElement).toBe(horizontal.element);
  const vertical = mount(
    defineComponent({
      setup: () => () =>
        h(List, { itemLayout: 'vertical' }, () =>
          h(
            ListItem,
            {
              classNames: { extra: 'custom-extra', actions: 'custom-actions' },
              styles: { extra: { color: 'red' } },
            },
            { extra: () => h('aside', 'Extra'), actions: () => h('button', 'Edit') },
          ),
        ),
    }),
  );
  expect(vertical.get('.custom-extra').attributes('style')).toContain('color: red');
  expect(vertical.get('.custom-actions > li button').text()).toBe('Edit');
});

it('F11: actions slots flatten fragments, skip empty/whitespace nodes and retain keyed controls on reorder', async () => {
  const reversed = ref(false);
  const ids = ref(['edit', 'more']);
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          ListItem,
          { actions: [h('a', 'fallback')] },
          {
            actions: () => [
              createCommentVNode('conditional'),
              createTextVNode(' '),
              h(
                Fragment,
                null,
                (reversed.value ? [...ids.value].reverse() : ids.value).map((id) =>
                  h('button', { key: id }, id),
                ),
              ),
            ],
          },
        ),
    }),
  );
  const edit = w.get('button').element;
  expect(w.findAll('.apollo-list-item-action > li')).toHaveLength(2);
  expect(w.findAll('.apollo-list-item-action-split')).toHaveLength(1);
  expect(w.text()).not.toContain('fallback');
  reversed.value = true;
  await nextTick();
  expect(w.findAll('button').map((n) => n.text())).toEqual(['more', 'edit']);
  expect(w.findAll('button')[1]?.element).toBe(edit);
  ids.value = [];
  await nextTick();
  expect(w.find('.apollo-list-item-action').exists()).toBe(false);
});

it('F11: default slot changes recompute no-flex and evaluate each slot once per render', async () => {
  const multiple = ref(false);
  const body = vi.fn(() => (multiple.value ? ['a', 'b'] : h('b', 'single')));
  const extra = vi.fn(() => h('aside', 'Extra'));
  const actions = vi.fn(() => h('button', 'Edit'));
  const w = mount(ListItem, { slots: { default: body, extra, actions } });
  expect(body).toHaveBeenCalledTimes(1);
  expect(extra).toHaveBeenCalledTimes(1);
  expect(actions).toHaveBeenCalledTimes(1);
  expect(w.classes()).not.toContain('apollo-list-item-no-flex');
  multiple.value = true;
  await nextTick();
  expect(w.classes()).toContain('apollo-list-item-no-flex');
  expect(body).toHaveBeenCalledTimes(2);
  expect(extra).toHaveBeenCalledTimes(2);
  expect(actions).toHaveBeenCalledTimes(2);
});

it('F11: Item/Meta native attrs update without changing component props', async () => {
  for (const component of [ListItem, ListItemMeta]) {
    const label = ref('first');
    const w = mount(
      defineComponent({
        setup: () => () => h(component, { class: label.value, 'aria-label': label.value }),
      }),
    );
    const root = w.element;
    label.value = 'second';
    await nextTick();
    expect(w.classes()).toContain('second');
    expect(w.classes()).not.toContain('first');
    expect(w.attributes('aria-label')).toBe('second');
    expect(w.element).toBe(root);
  }
});

it('F11: child slots hydrate and update with heading/control DOM preserved', async () => {
  const label = ref('first');
  const App = defineComponent({
    setup: () => () =>
      h(List, { grid: { column: 2 } }, () =>
        h(ListItem, null, {
          default: () =>
            h(ListItemMeta, null, {
              title: () => h('a', label.value),
              avatar: () => h('span', 'Avatar'),
              description: () => label.value,
            }),
          actions: () => h('button', label.value),
          extra: () => h('aside', label.value),
        }),
      ),
  });
  const container = document.createElement('div');
  container.innerHTML = await renderToString(createSSRApp(App));
  document.body.appendChild(container);
  expect(container.querySelector('h4 a')?.textContent).toBe('first');
  const heading = container.querySelector('h4');
  const button = container.querySelector('button');
  const app = createSSRApp(App);
  try {
    app.mount(container);
    label.value = 'second';
    await nextTick();
    expect(container.querySelector('h4')).toBe(heading);
    expect(container.querySelector('button')).toBe(button);
    expect(heading?.textContent).toBe('second');
    expect(button?.textContent).toBe('second');
  } finally {
    app.unmount();
    container.remove();
  }
});
