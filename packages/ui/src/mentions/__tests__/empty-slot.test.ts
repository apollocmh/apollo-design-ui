import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef, type VNodeChild } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ConfigProvider from '../../config-provider';
import Mentions from '../index';
import type { MentionsOptionProps } from '../interface';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
async function measure(editor: HTMLTextAreaElement) {
  editor.focus();
  editor.value = '@';
  editor.setSelectionRange(1, 1);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
  await nextTick();
  editor.dispatchEvent(new KeyboardEvent('keyup', { key: '@', bubbles: true }));
  await nextTick();
  await nextTick();
}
const menu = () => document.body.querySelector('[role="menu"]');
function editorOf(wrapper: ReturnType<typeof mount>) {
  const editor = wrapper.get('textarea').element;
  if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected textarea');
  return editor;
}

describe('F11 Mentions native empty content', () => {
  for (const allowClear of [false, true]) {
    it(`current/empty/removed slot beats fallback without resetting the editor (clear=${allowClear})`, async () => {
      const show = ref(false);
      const empty = ref(false);
      const label = ref('first');
      const fallback = ref('prop fallback');
      const options = shallowRef<MentionsOptionProps[]>([]);
      const loading = ref(false);
      const slot = vi.fn<() => VNodeChild>(() =>
        empty.value ? [] : h('span', { 'data-empty-content': '' }, label.value),
      );
      const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const Host = defineComponent(
        () => () =>
          h(
            Mentions,
            {
              allowClear,
              loading: loading.value,
              options: options.value,
              notFoundContent: fallback.value,
              'aria-label': 'Empty mentions',
            },
            show.value ? { notFoundContent: slot } : {},
          ),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      const editor = editorOf(wrapper);
      expect(slot).not.toHaveBeenCalled();
      await measure(editor);
      expect(menu()?.textContent).toBe('prop fallback');
      show.value = true;
      await nextTick();
      await nextTick();
      expect(menu()?.textContent).toBe('first');
      const content = document.body.querySelector('[data-empty-content]');
      label.value = 'current';
      await nextTick();
      expect(menu()?.textContent).toBe('current');
      expect(document.body.querySelector('[data-empty-content]')).toBe(content);
      empty.value = true;
      await nextTick();
      expect(menu()?.textContent).toBe('');
      expect(menu()?.querySelector('[role="menuitem"]')?.getAttribute('aria-disabled')).toBe(
        'true',
      );
      fallback.value = 'current fallback';
      show.value = false;
      await nextTick();
      expect(menu()?.textContent).toBe('current fallback');
      show.value = true;
      empty.value = false;
      await nextTick();
      await nextTick();
      options.value = [{ value: 'alpha', label: 'Alpha' }];
      await nextTick();
      await nextTick();
      const before = slot.mock.calls.length;
      label.value = 'unused';
      await nextTick();
      expect(menu()?.textContent).toBe('Alpha');
      expect(slot).toHaveBeenCalledTimes(before);
      loading.value = true;
      await nextTick();
      await nextTick();
      expect(menu()?.querySelector('.apollo-spin')).not.toBeNull();
      expect(slot).toHaveBeenCalledTimes(before);
      loading.value = false;
      options.value = [];
      await nextTick();
      await nextTick();
      expect(menu()?.textContent).toBe('unused');
      expect(editorOf(wrapper)).toBe(editor);
      expect(editor.value).toBe('@');
      expect(document.activeElement).toBe(editor);
      expect(warnings).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  }

  it('documented ConfigProvider empty data updates and falls back to renderEmpty only when absent', async () => {
    const configured = ref<string | false | undefined>('configured');
    const local = ref<string | undefined>();
    const fallback = ref('rendered fallback');
    const Host = defineComponent(
      () => () =>
        h(
          ConfigProvider,
          {
            components: { mentions: { notFoundContent: configured.value } },
            renderEmpty: () => h('b', fallback.value),
          },
          {
            default: () =>
              h(Mentions, {
                options: [],
                notFoundContent: local.value,
                'aria-label': 'Configured mentions',
              }),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await measure(editorOf(wrapper));
    expect(menu()?.textContent).toBe('configured');
    configured.value = 'updated';
    await nextTick();
    expect(menu()?.textContent).toBe('updated');
    local.value = 'local';
    await nextTick();
    expect(menu()?.textContent).toBe('local');
    local.value = undefined;
    configured.value = false;
    await nextTick();
    expect(menu()?.textContent).toBe('');
    configured.value = undefined;
    await nextTick();
    expect(menu()?.textContent).toBe('rendered fallback');
    fallback.value = 'current rendered fallback';
    await nextTick();
    expect(menu()?.textContent).toBe('current rendered fallback');
    wrapper.unmount();
  });

  for (const sample of [
    { name: 'false', content: false, text: '' },
    { name: 'zero', content: 0, text: '0' },
    { name: 'VNode', content: h('strong', 'Rich'), text: 'Rich' },
    { name: 'array', content: [h('span', 'A'), 'B'], text: 'AB' },
  ]) {
    it(`retains Vue VNodeChild data semantics for ${sample.name}`, async () => {
      const wrapper = mount(Mentions, {
        props: { options: [], notFoundContent: sample.content },
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await measure(editorOf(wrapper));
      expect(menu()?.textContent).toBe(sample.text);
      if (Array.isArray(sample.content)) expect(sample.content[1]).toBe('B');
      wrapper.unmount();
    });
  }

  for (const sample of [
    { name: 'false', label: false, text: '' },
    { name: 'zero', label: 0, text: '0' },
    { name: 'array', label: [h('span', 'A'), 'B'], text: 'AB' },
  ]) {
    it(`candidate VNode data remains valid for ${sample.name} and selects once`, async () => {
      const select = vi.fn();
      const wrapper = mount(Mentions, {
        props: { options: [{ value: 'alpha', label: sample.label }], onSelect: select },
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      const editor = editorOf(wrapper);
      await measure(editor);
      expect(menu()?.textContent).toBe(sample.text);
      if (Array.isArray(sample.label)) expect(sample.label[1]).toBe('B');
      editor.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
      await nextTick();
      expect(editor.value).toBe('@alpha ');
      expect(select).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    });
  }

  it('a present empty slot does not evaluate the renderEmpty fallback', async () => {
    const show = ref(true);
    const fallback = vi.fn(() => h('b', 'Provider fallback'));
    const Host = defineComponent(
      () => () =>
        h(
          ConfigProvider,
          { renderEmpty: fallback },
          {
            default: () =>
              h(Mentions, { options: [] }, show.value ? { notFoundContent: () => [] } : {}),
          },
        ),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    expect(fallback).not.toHaveBeenCalled();
    await measure(editorOf(wrapper));
    expect(menu()?.textContent).toBe('');
    expect(fallback).not.toHaveBeenCalled();
    show.value = false;
    await nextTick();
    expect(menu()?.textContent).toBe('Provider fallback');
    expect(fallback).toHaveBeenCalledWith('Select');
    wrapper.unmount();
  });

  it('closed SSR does not evaluate popup-only empty slots', async () => {
    const slot = vi.fn(() => h('span', 'Unused SSR empty'));
    const html = await renderToString(
      h(Mentions, { options: [], 'aria-label': 'SSR mentions' }, { notFoundContent: slot }),
    );
    expect(html).toContain('<textarea');
    expect(html).not.toContain('Unused SSR empty');
    expect(slot).not.toHaveBeenCalled();
  });

  it('an intentionally empty popupRender does not eagerly evaluate empty content', async () => {
    const slot = vi.fn(() => h('span', 'Unused empty'));
    const wrapper = mount(Mentions, {
      props: { options: [] },
      slots: { popupRender: () => [], notFoundContent: slot },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await measure(editorOf(wrapper));
    expect(menu()).toBeNull();
    expect(slot).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
