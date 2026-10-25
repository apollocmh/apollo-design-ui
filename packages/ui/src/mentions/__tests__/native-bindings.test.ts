import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, type StyleValue, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Form, FormItem } from '../../form';
import Mentions from '../index';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
const modes = [
  { name: 'bare', allowClear: false, feedback: false },
  { name: 'clear wrapper', allowClear: true, feedback: false },
  { name: 'Form feedback wrapper', allowClear: false, feedback: true },
];
const wrap = (node: VNode, feedback: boolean) =>
  feedback
    ? h(
        Form,
        {},
        {
          default: () =>
            h(FormItem, { hasFeedback: true, validateStatus: 'success' }, { default: () => node }),
        },
      )
    : node;

describe('Mentions native root bindings', () => {
  for (const mode of modes) {
    it(`${mode.name}: native class/style replace and clear on the root while editor state remains`, async () => {
      const phase = ref(0);
      const style = (): StyleValue =>
        phase.value === 0
          ? 'max-width:300px; padding-top:8px; --native-phase:first'
          : phase.value === 1
            ? ['max-width:340px; --native-phase:next', { paddingBottom: '10px' }]
            : undefined;
      const Host = defineComponent(
        () => () =>
          wrap(
            h(Mentions, {
              allowClear: mode.allowClear,
              'aria-label': 'Native mention field',
              id: 'mention-native-input',
              class: ['native-root', { first: phase.value === 0, next: phase.value === 1 }],
              style: style(),
              classNames: { root: 'semantic-root' },
              styles: { root: { minHeight: '62px', maxWidth: '240px' } },
            }),
            mode.feedback,
          ),
      );
      const wrapper = mount(Host, { attachTo: document.body });
      const root = wrapper.find('.apollo-mentions').element;
      if (!(root instanceof HTMLElement)) throw new Error('Expected mentions root');
      expect(root.classList.contains('native-root')).toBe(true);
      expect(root.classList.contains('semantic-root')).toBe(true);
      expect(root.style.maxWidth).toBe('300px');
      expect(root.style.minHeight).toBe('62px');
      expect(root.style.getPropertyValue('--native-phase')).toBe('first');
      const editor = wrapper.find('textarea').element;
      if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected editor');
      editor.focus();
      editor.value = 'kept mention';
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      await nextTick();
      phase.value = 1;
      await nextTick();
      expect(wrapper.find('.apollo-mentions').element).toBe(root);
      expect(root.classList.contains('first')).toBe(false);
      expect(root.classList.contains('next')).toBe(true);
      expect(root.style.maxWidth).toBe('340px');
      expect(root.style.paddingTop).toBe('');
      expect(root.style.paddingBottom).toBe('10px');
      phase.value = 2;
      await nextTick();
      expect(root.style.maxWidth).toBe('240px');
      expect(root.style.minHeight).toBe('62px');
      expect(root.style.paddingBottom).toBe('');
      expect(root.style.getPropertyValue('--native-phase')).toBe('');
      expect(wrapper.find('textarea').element).toBe(editor);
      expect(editor.value).toBe('kept mention');
      expect(editor.id).toBe('mention-native-input');
      expect(editor.getAttribute('aria-label')).toBe('Native mention field');
      expect(editor.style.maxWidth).toBe('');
      expect(editor.classList.contains('native-root')).toBe(false);
      expect(document.activeElement).toBe(editor);
      if (mode.feedback) expect(wrapper.find('.apollo-mentions-suffix').exists()).toBe(true);
      wrapper.unmount();
    });

    it(`${mode.name}: SSR puts merged styles on the actual outer root`, async () => {
      const html = await renderToString(
        wrap(
          h(Mentions, {
            allowClear: mode.allowClear,
            class: 'native-root',
            style: 'max-width:310px;--native-phase:server',
            styles: { root: { minHeight: '62px' } },
          }),
          mode.feedback,
        ),
      );
      const server = document.createElement('div');
      server.innerHTML = html;
      const root = server.querySelector<HTMLElement>('.apollo-mentions');
      expect(root?.classList.contains('native-root')).toBe(true);
      expect(root?.style.maxWidth).toBe('310px');
      expect(root?.style.minHeight).toBe('62px');
      expect(root?.style.getPropertyValue('--native-phase')).toBe('server');
      expect(server.querySelector('textarea')?.style.maxWidth).toBe('');
    });
  }

  for (const allowClear of [false, true]) {
    it(`explicit silent is current, and loading always suppresses selection (clear=${allowClear})`, async () => {
      const silent = ref(true);
      const loading = ref(false);
      const onSelect = vi.fn();
      const onChange = vi.fn();
      const Host = defineComponent(
        () => () =>
          h(Mentions, {
            allowClear,
            silent: silent.value,
            loading: loading.value,
            options: [{ value: 'alpha', label: 'Alpha' }],
            onSelect,
            onChange,
          }),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      const editor = wrapper.find('textarea').element;
      if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected editor');
      editor.value = '@';
      editor.setSelectionRange(1, 1);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      await nextTick();
      editor.dispatchEvent(new KeyboardEvent('keyup', { key: '@', which: 64, bubbles: true }));
      await nextTick();
      await nextTick();
      const enter = () =>
        editor.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            which: 13,
            bubbles: true,
            cancelable: true,
          }),
        );
      onChange.mockClear();
      enter();
      await nextTick();
      expect(editor.value).toBe('@');
      expect(onSelect).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      silent.value = false;
      loading.value = true;
      await nextTick();
      enter();
      await nextTick();
      expect(editor.value).toBe('@');
      expect(onSelect).not.toHaveBeenCalled();
      loading.value = false;
      await nextTick();
      enter();
      await nextTick();
      expect(editor.value).toBe('@alpha ');
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledExactlyOnceWith('@alpha ');
      wrapper.unmount();
    });
  }
});
