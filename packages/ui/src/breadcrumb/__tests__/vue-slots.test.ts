import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Breadcrumb, BreadcrumbItem } from '../index';
import type { BreadcrumbItemSlotProps } from '../interface';

it('F11: itemRender slot receives each route path and resolved href as one object', () => {
  const scope = vi.fn(({ route, paths, href, routes }: BreadcrumbItemSlotProps) =>
    h('a', { href, 'data-route-path': paths.join('/') }, `${String(route.title)}:${routes.length}`),
  );
  const w = mount(Breadcrumb, {
    props: {
      params: { id: 42 },
      items: [
        { path: 'apps', title: 'Apps' },
        { path: ':id', title: 'Detail' },
      ],
    },
    slots: { itemRender: scope },
  });
  const links = w.findAll('[data-route-path]');
  expect(links.map((link) => link.attributes('data-route-path'))).toEqual(['apps', 'apps/42']);
  expect(links.map((link) => link.attributes('href'))).toEqual(['#/apps', '#/apps/42']);
  expect(scope).toHaveBeenCalledTimes(2);
  expect(scope.mock.calls[0]).toHaveLength(1);
});

it('F11: conditional and empty item slots update and restore the default link renderer', async () => {
  const show = ref(false);
  const empty = ref(false);
  const label = ref('first');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Breadcrumb,
          { items: [{ title: 'fallback', href: '#/fallback' }] },
          show.value
            ? {
                itemRender: () => (empty.value ? [] : h('b', label.value)),
              }
            : {},
        ),
    }),
  );
  expect(w.get('a').text()).toBe('fallback');
  show.value = true;
  await nextTick();
  expect(w.get('b').text()).toBe('first');
  label.value = 'second';
  await nextTick();
  expect(w.get('b').text()).toBe('second');
  empty.value = true;
  await nextTick();
  expect(w.find('b').exists()).toBe(false);
  expect(w.find('a').exists()).toBe(false);
  show.value = false;
  await nextTick();
  expect(w.get('a').text()).toBe('fallback');
});

it('F11: native default children stay reactive and keyed inputs follow their item on reorder', async () => {
  const order = ref(['a', 'b']);
  const label = ref('first');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(Breadcrumb, null, {
          default: () =>
            order.value.map((key) =>
              h(
                BreadcrumbItem,
                { key },
                {
                  default: () => [
                    h('b', `${key}:${label.value}`),
                    h('input', { 'data-crumb': key, value: key }),
                  ],
                },
              ),
            ),
        }),
    }),
  );
  const first = w.get('input[data-crumb="a"]').element;
  label.value = 'second';
  order.value = ['b', 'a'];
  await nextTick();
  expect(w.findAll('b').map((node) => node.text())).toEqual(['b:second', 'a:second']);
  expect(w.get('input[data-crumb="a"]').element).toBe(first);
  expect(warn.mock.calls.flat().join(' ')).not.toMatch(/deprecated|outside of the render/);
  expect(error.mock.calls.flat().join(' ')).not.toMatch(/deprecated/);
  error.mockRestore();
  warn.mockRestore();
});
