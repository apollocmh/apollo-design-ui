import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, type VNodeChild } from 'vue';
import { renderToString } from 'vue/server-renderer';
import type { PopconfirmProps } from '../interface';
import Popconfirm from '../Popconfirm';
import PopconfirmPurePanel from '../PurePanel';

type ContentSlots = Record<string, () => VNodeChild>;
const styles = { icon: { color: 'red' } };
const classNames = { icon: 'custom-icon-wrapper' };
const cases = [
  {
    name: 'Popconfirm',
    render: (icon: PopconfirmProps['icon'], slots: ContentSlots) =>
      h(
        Popconfirm,
        { open: true, title: 'Title', icon, styles, classNames },
        { default: () => h('button', 'target'), ...slots },
      ),
  },
  {
    name: 'PopconfirmPurePanel',
    render: (icon: PopconfirmProps['icon'], slots: ContentSlots) =>
      h(PopconfirmPurePanel, { title: 'Title', icon, styles, classNames }, slots),
  },
];
afterEach(() => {
  document.body.replaceChildren();
});

describe('F11 Popconfirm native icon slot', () => {
  for (const entry of cases) {
    it(`${entry.name}: current/empty/removed icon slots override data without replacing the body`, async () => {
      const show = ref(false);
      const empty = ref(false);
      const label = ref('first');
      const icon = h('b', { 'data-data-icon': '' }, 'data-icon');
      const Host = defineComponent(
        () => () =>
          entry.render(icon, {
            description: () => h('input', { 'aria-label': 'Icon body note' }),
            ...(show.value
              ? { icon: () => (empty.value ? [] : h('i', { 'data-native-icon': '' }, label.value)) }
              : {}),
          }),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await nextTick();
      expect(document.querySelector('[data-data-icon]')).not.toBeNull();
      const input = document.querySelector('input');
      if (!(input instanceof HTMLInputElement)) throw new Error('Expected body input');
      input.value = 'kept';
      input.focus();
      show.value = true;
      await nextTick();
      expect(document.querySelector('[data-native-icon]')?.textContent).toBe('first');
      expect(document.querySelector('[data-data-icon]')).toBeNull();
      expect(document.querySelector<HTMLElement>('.custom-icon-wrapper')?.style.color).toBe('red');
      label.value = 'current';
      await nextTick();
      expect(document.querySelector('[data-native-icon]')?.textContent).toBe('current');
      empty.value = true;
      await nextTick();
      expect(document.querySelector('.apollo-popconfirm-message-icon')).toBeNull();
      expect(document.querySelector('[data-data-icon]')).toBeNull();
      show.value = false;
      await nextTick();
      expect(document.querySelector('[data-data-icon]')?.textContent).toBe('data-icon');
      expect(document.querySelector('input')).toBe(input);
      expect(input.value).toBe('kept');
      expect(document.activeElement).toBe(input);
      wrapper.unmount();
    });

    it(`${entry.name}: empty slots suppress defaults; removing slots restores default or false data`, async () => {
      const show = ref(false);
      const disabled = ref(false);
      const Host = defineComponent(
        () => () =>
          entry.render(disabled.value ? false : undefined, show.value ? { icon: () => [] } : {}),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await nextTick();
      expect(document.querySelector('[aria-label="exclamation-circle"]')).not.toBeNull();
      show.value = true;
      await nextTick();
      expect(document.querySelector('.apollo-popconfirm-message-icon')).toBeNull();
      show.value = false;
      await nextTick();
      expect(document.querySelector('[aria-label="exclamation-circle"]')).not.toBeNull();
      disabled.value = true;
      await nextTick();
      expect(document.querySelector('.apollo-popconfirm-message-icon')).toBeNull();
      wrapper.unmount();
    });
  }

  it('SSR honors icon slot over false data', async () => {
    const html = await renderToString(
      h(
        PopconfirmPurePanel,
        { title: 'Title', icon: false },
        { icon: () => h('b', { 'data-native-icon': '' }, 'server-icon') },
      ),
    );
    expect(html).toContain('server-icon');
    expect(html).toContain('data-native-icon');
  });

  it('SSR empty icon slot suppresses the default wrapper and icon', async () => {
    const html = await renderToString(
      h(PopconfirmPurePanel, { title: 'Title' }, { icon: () => [] }),
    );
    expect(html).not.toContain('apollo-popconfirm-message-icon');
    expect(html).not.toContain('exclamation-circle');
  });
});
