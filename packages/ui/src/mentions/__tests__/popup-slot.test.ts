import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, isVNode, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Mentions from '../index';
import type { MentionsPopupRenderSlotProps } from '../interface';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('F11 Mentions native popupRender', () => {
  for (const allowClear of [false, true]) {
    it(`current/empty/removed scoped slots retain textarea and current menu behavior (clear=${allowClear})`, async () => {
      const show = ref(false);
      const empty = ref(false);
      const label = ref('first');
      const value = ref('');
      const options = ref([
        { value: 'alpha', label: 'Alpha' },
        { value: 'beta', label: 'Beta' },
      ]);
      const onSelect = vi.fn();
      const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const Host = defineComponent(
        () => () =>
          h(
            Mentions,
            {
              options: options.value,
              allowClear,
              value: value.value,
              'onUpdate:value': (next: string) => {
                value.value = next;
              },
              onSelect,
              classNames: { popup: 'native-popup-semantic' },
              popupClassName: 'native-popup-prop',
              'aria-label': 'Mention editor',
            },
            show.value
              ? {
                  popupRender: (info: MentionsPopupRenderSlotProps) => {
                    expect(isVNode(info.originNode)).toBe(true);
                    return empty.value
                      ? []
                      : h('section', { 'data-native-popup': '' }, [
                          h('strong', label.value),
                          h('input', { key: 'note', 'aria-label': 'Popup note' }),
                          info.originNode,
                        ]);
                  },
                }
              : {},
          ),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      const textarea = wrapper.find('textarea').element;
      if (!(textarea instanceof HTMLTextAreaElement)) throw new Error('Expected mentions textarea');
      textarea.focus();
      textarea.value = '@';
      textarea.setSelectionRange(1, 1);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      await nextTick();
      textarea.dispatchEvent(new KeyboardEvent('keyup', { key: '@', which: 64, bubbles: true }));
      await nextTick();
      await nextTick();
      const items = () => document.querySelectorAll('.apollo-mentions-dropdown-menu-item');
      expect(items()).toHaveLength(2);
      const popupClass = document.querySelector('.apollo-mentions-dropdown')?.classList;
      expect(popupClass?.contains('native-popup-semantic')).toBe(true);
      expect(popupClass?.contains('native-popup-prop')).toBe(true);
      expect(popupClass?.contains('apollo-mentions-css-var')).toBe(true);
      show.value = true;
      await nextTick();
      expect(document.querySelector('[data-native-popup]')?.textContent).toContain('first');
      expect(items()).toHaveLength(2);
      const note = document.querySelector('input');
      if (!(note instanceof HTMLInputElement)) throw new Error('Expected popup note');
      note.value = 'kept';
      label.value = 'current';
      options.value = [
        { value: 'alpha', label: 'Alpha current' },
        { value: 'gamma', label: 'Gamma' },
      ];
      await nextTick();
      expect(document.querySelector('[data-native-popup]')?.textContent).toContain('current');
      expect(document.querySelector('[data-native-popup]')?.textContent).toContain('Gamma');
      expect(document.querySelector('input')).toBe(note);
      expect(note.value).toBe('kept');
      empty.value = true;
      await nextTick();
      expect(items()).toHaveLength(0);
      expect(document.querySelector('[data-native-popup]')).toBeNull();
      show.value = false;
      await nextTick();
      expect(items()).toHaveLength(2);
      expect(wrapper.find('textarea').element).toBe(textarea);
      expect(textarea.value).toBe('@');
      expect(document.activeElement).toBe(textarea);
      empty.value = false;
      show.value = true;
      await nextTick();
      textarea.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', which: 13, bubbles: true, cancelable: true }),
      );
      await nextTick();
      expect(value.value).toBe('@alpha ');
      expect(onSelect).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ value: 'alpha', label: 'Alpha current' }),
        '@',
      );
      expect(warnings).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  }

  it('SSR does not execute popup slots before the editor enters candidate measurement', async () => {
    const popupRender = vi.fn(() => h('b', 'not visible'));
    const html = await renderToString(
      h(Mentions, { defaultValue: '@', allowClear: true }, { popupRender }),
    );
    expect(html).toContain('textarea');
    expect(html).toContain('@');
    expect(html).not.toContain('not visible');
    expect(popupRender).not.toHaveBeenCalled();
  });
});
