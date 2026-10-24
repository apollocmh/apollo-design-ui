import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import Drawer, { DrawerPurePanel } from '../index';

async function settle() {
  for (let i = 0; i < 6; i++) await nextTick();
}

it('F11: one title snapshot supplies both panel content and aria-labelledby', async () => {
  const title = vi.fn(() => h('b', 'Slot title'));
  const w = mount(Drawer, {
    global: { stubs: { teleport: false } },
    props: { open: true, getContainer: false, autoFocus: false, title: 'fallback' },
    slots: { title, default: () => h('input', { value: 'body' }) },
  });
  await settle();
  title.mockClear();
  await w.setProps({ title: 'changed fallback' });
  await settle();
  expect(title).toHaveBeenCalledTimes(1);
  const heading = w.get('.apollo-drawer-title');
  expect(heading.text()).toBe('Slot title');
  expect(w.get('[role="dialog"]').attributes('aria-labelledby')).toBe(heading.attributes('id'));
});

it('F11: conditional and empty Drawer slots update content and remove dangling title ARIA', async () => {
  const show = ref(false);
  const empty = ref(false);
  const text = ref('first');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Drawer,
          {
            open: true,
            getContainer: false,
            autoFocus: false,
            title: 'fallback',
          },
          {
            default: () => h('input', { value: 'typed' }),
            ...(show.value
              ? {
                  title: () => (empty.value ? [] : h('b', text.value)),
                  footer: () => (empty.value ? [] : h('small', text.value)),
                  extra: () => (empty.value ? [] : h('aside', text.value)),
                  closeIcon: () => (empty.value ? [] : h('i', 'Close icon')),
                }
              : {}),
          },
        ),
    }),
    { global: { stubs: { teleport: false } } },
  );
  await settle();
  const input = w.get('input').element;
  show.value = true;
  await settle();
  expect(w.get('input').element, 'slot appearance must retain body').toBe(input);
  expect(w.get('.apollo-drawer-title b').text()).toBe('first');
  expect(w.get('.apollo-drawer-footer small').text()).toBe('first');
  expect(w.get('.apollo-drawer-extra aside').text()).toBe('first');
  text.value = 'second';
  await settle();
  expect(w.get('input').element, 'slot text update must retain body').toBe(input);
  expect(w.get('.apollo-drawer-title b').text()).toBe('second');
  expect(w.get('.apollo-drawer-footer').text()).toBe('second');
  empty.value = true;
  await settle();
  expect(w.get('input').element, 'empty slots must retain body').toBe(input);
  expect(w.find('.apollo-drawer-title').exists()).toBe(false);
  expect(w.find('.apollo-drawer-footer').exists()).toBe(false);
  expect(w.find('.apollo-drawer-extra').exists()).toBe(false);
  expect(w.get('[role="dialog"]').attributes('aria-labelledby')).toBeUndefined();
  show.value = false;
  await settle();
  expect(w.get('.apollo-drawer-title').text()).toBe('fallback');
  expect(w.get('[role="dialog"]').attributes('aria-labelledby')).toBe(
    w.get('.apollo-drawer-title').attributes('id'),
  );
  expect(w.get('input').element).toBe(input);
});

it('F11: an explicit external accessible label remains valid with an empty title slot', async () => {
  const w = mount(Drawer, {
    global: { stubs: { teleport: false } },
    props: {
      open: true,
      getContainer: false,
      autoFocus: false,
      title: 'fallback',
    },
    attrs: { 'aria-labelledby': 'external-heading' },
    slots: { title: () => [] },
  });
  await settle();
  expect(w.find('.apollo-drawer-title').exists()).toBe(false);
  expect(w.get('[role="dialog"]').attributes('aria-labelledby')).toBe('external-heading');
});

it('F11: PurePanel forwards native string styles and attrs without React-shaped prop interception', async () => {
  const hit = vi.fn();
  const w = mount(DrawerPurePanel, {
    attrs: { class: 'first', style: 'color:red', id: 'native-panel', onClick: hit },
  });
  const root = w.element;
  expect(w.attributes('id')).toBe('native-panel');
  expect(w.attributes('style')).toContain('color: red');
  await w.trigger('click');
  expect(hit).toHaveBeenCalledTimes(1);
  await w.setProps({ class: 'second', style: 'color:blue' });
  expect(w.element).toBe(root);
  expect(w.classes()).toContain('second');
  expect(w.classes()).not.toContain('first');
  expect(w.attributes('style')).toContain('color: blue');
});
