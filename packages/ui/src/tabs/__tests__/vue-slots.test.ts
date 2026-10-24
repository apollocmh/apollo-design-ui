import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, type VNodeChild } from 'vue';
import Dropdown from '../../dropdown/Dropdown';
import Tabs from '../index';
import type { TabsItem } from '../interface';
import OperationNode from '../OperationNode';

async function settle() {
  for (let i = 0; i < 6; i++) await nextTick();
}

it('F11: overflow content receives one named slot object and can close the popup', async () => {
  const w = mount(OperationNode, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      prefixCls: 'apollo-tabs',
      tabs: [{ key: 'b', label: 'Hidden B' }],
      onTabClick: vi.fn(),
    },
    slots: {
      popupRender: ({
        originNode,
        restTabs,
        onClose,
      }: {
        originNode: VNodeChild;
        restTabs: TabsItem[];
        onClose: () => void;
      }) =>
        h('section', { 'data-tabs-custom': '' }, [
          h('span', { 'data-hidden-count': '' }, String(restTabs.length)),
          originNode,
          h('button', { 'data-popup-close': '', onClick: onClose }, 'Close popup'),
        ]),
    },
  });
  w.get('button').element.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }),
  );
  await settle();
  expect(document.querySelector('[data-hidden-count]')?.textContent).toBe('1');
  expect(document.querySelector('[data-tabs-custom] [role="listbox"]')).not.toBeNull();
  document.querySelector<HTMLButtonElement>('[data-popup-close]')?.click();
  await settle();
  expect(w.get('button').attributes('aria-expanded')).toBe('false');
});

it('F11: conditional extra slots replace fallback and update without remounting their input', async () => {
  const show = ref(false);
  const label = ref('first');
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Tabs,
          {
            items: [{ key: 'a', label: 'A', children: 'Pane A' }],
            tabBarExtraContent: 'fallback',
          },
          show.value
            ? {
                extra: ({ position }: { position: string }) =>
                  position === 'right'
                    ? [
                        h('b', { 'data-extra-label': '' }, label.value),
                        h('input', { 'aria-label': 'Extra state' }),
                      ]
                    : [],
              }
            : {},
        ),
    }),
  );
  expect(w.text()).toContain('fallback');
  show.value = true;
  await settle();
  expect(w.get('[data-extra-label]').text()).toBe('first');
  const input = w.get('input').element;
  label.value = 'second';
  await settle();
  expect(w.get('[data-extra-label]').text()).toBe('second');
  expect(w.get('input').element).toBe(input);
  show.value = false;
  await settle();
  expect(w.text()).toContain('fallback');
  expect(w.find('input').exists()).toBe(false);
});

it('F11: a mounted Dropdown consumes popup slots when they appear, empty and disappear', async () => {
  const show = ref(false);
  const empty = ref(false);
  mount(
    defineComponent({
      setup: () => () =>
        h(
          Dropdown,
          { open: true, menu: { items: [{ key: 'a', label: 'Item A' }] } },
          {
            default: () => h('button', 'Open'),
            ...(show.value
              ? {
                  popupRender: ({ originNode }: { originNode: VNodeChild }) =>
                    empty.value ? [] : h('section', { 'data-current-popup': '' }, [originNode]),
                }
              : {}),
          },
        ),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  await settle();
  expect(document.querySelector('[data-current-popup]')).toBeNull();
  show.value = true;
  await settle();
  expect(document.querySelector('[data-current-popup]')).not.toBeNull();
  empty.value = true;
  await settle();
  expect(document.querySelector('[data-current-popup]')).toBeNull();
  expect(document.querySelector('.apollo-dropdown-menu')).toBeNull();
  show.value = false;
  await settle();
  expect(document.querySelector('.apollo-dropdown-menu')).not.toBeNull();
});
