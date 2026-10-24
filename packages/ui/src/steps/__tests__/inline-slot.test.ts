import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { h, type VNodeChild } from 'vue';
import { Steps } from '../index';

it('inline native itemRender can render its origin node with content without recursive Tooltip mounting', () => {
  const w = mount(Steps, {
    props: { type: 'inline', items: [{ key: 'a', title: 'Alpha', content: 'Details' }] },
    slots: {
      itemRender: ({ itemNode }: { itemNode: VNodeChild }) =>
        h('section', { 'data-native-step': '' }, [itemNode]),
    },
    global: { stubs: { teleport: false } },
  });
  expect(w.findAll('[data-native-step]')).toHaveLength(1);
  expect(w.text()).toContain('Alpha');
});

it('inline native itemRender shows rich Tooltip title through its native slot', async () => {
  const w = mount(Steps, {
    props: {
      type: 'inline',
      items: [
        {
          key: 'a',
          title: 'Alpha',
          content: h('strong', { 'data-inline-rich': '' }, 'Rich details'),
        },
      ],
    },
    slots: {
      itemRender: ({ itemNode }: { itemNode: VNodeChild }) =>
        h('section', { 'data-native-step': '' }, [itemNode]),
    },
    global: { stubs: { teleport: false } },
    attachTo: document.body,
  });
  await w.get('.apollo-steps-item').trigger('mouseenter');
  await vi.waitFor(() => {
    expect(document.body.querySelector('[role="tooltip"] [data-inline-rich]')?.textContent).toBe(
      'Rich details',
    );
  });
  expect(w.findAll('[data-native-step]')).toHaveLength(1);
});

it('inline data content opens a Tooltip when no itemRender slot is supplied', async () => {
  const w = mount(Steps, {
    props: {
      type: 'inline',
      items: [{ key: 'a', title: 'Alpha', content: 'Default inline details' }],
    },
    global: { stubs: { teleport: false } },
    attachTo: document.body,
  });
  await w.get('.apollo-steps-item').trigger('mouseenter');
  await vi.waitFor(() => {
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Default inline details',
    );
  });
});
