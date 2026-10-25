import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Component, defineComponent, h, nextTick, ref, type StyleValue } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Link, Paragraph, Text, Title, Typography } from '../../index';

const entries: { name: string; component: Component }[] = [
  { name: 'Text', component: Text },
  { name: 'Title', component: Title },
  { name: 'Paragraph', component: Paragraph },
  { name: 'Link', component: Link },
  { name: 'Typography', component: Typography },
];
const editors = entries.filter(({ name }) => name === 'Text' || name === 'Paragraph');
const semanticStyles = {
  root: { maxWidth: '220px', minHeight: '44px', paddingTop: '4px' },
  textarea: { letterSpacing: '1px' },
};
const expected = [
  { width: '300px', top: '8px', bottom: '', start: '', phase: 'string' },
  { width: '340px', top: '4px', bottom: '10px', start: '', phase: 'array' },
  { width: '360px', top: '4px', bottom: '', start: '12px', phase: 'object' },
  { width: '220px', top: '4px', bottom: '', start: '', phase: '' },
];
function nativeStyle(phase: number): StyleValue {
  if (phase === 0) return 'max-width:300px;padding-top:8px;--native-phase:string';
  if (phase === 1) return ['max-width:340px;--native-phase:array', { paddingBottom: '10px' }];
  if (phase === 2)
    return { maxWidth: '360px', paddingInlineStart: '12px', '--native-phase': 'object' };
  return undefined;
}
function assertStyle(root: HTMLElement, phase: number) {
  const value = expected[phase];
  if (!value) throw new Error('Expected a known style phase');
  expect(root.style.maxWidth).toBe(value.width);
  expect(root.style.minHeight).toBe('44px');
  expect(root.style.paddingTop).toBe(value.top);
  expect(root.style.paddingBottom).toBe(value.bottom);
  expect(root.style.paddingInlineStart).toBe(value.start);
  expect(root.style.getPropertyValue('--native-phase')).toBe(value.phase);
  expect(root.getAttribute('style') ?? '').not.toMatch(/(?:^|;)\s*\d+\s*:/);
}
async function flushRender() {
  await nextTick();
  await nextTick();
}
function htmlElement(element: Element) {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML root');
  return element;
}
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('F11 Typography native style forms', () => {
  for (const { name, component } of entries) {
    it(`${name}: dynamic native string, mixed array, object and removal apply to the same root`, async () => {
      const phase = ref(0);
      const Host = defineComponent(
        () => () =>
          h(
            component,
            { styles: semanticStyles, style: nativeStyle(phase.value) },
            {
              default: () => h('span', { key: 'body', 'data-style-body': '' }, 'Kept body'),
            },
          ),
      );
      const wrapper = mount(Host, { attachTo: document.body });
      const root = htmlElement(wrapper.get('.apollo-typography').element);
      const body = wrapper.get('[data-style-body]').element;
      assertStyle(root, 0);
      for (const next of [1, 2, 3]) {
        phase.value = next;
        await flushRender();
        expect(wrapper.get('.apollo-typography').element).toBe(root);
        expect(wrapper.get('[data-style-body]').element).toBe(body);
        assertStyle(root, next);
      }
      expect(console.warn).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it(`${name}: h-normalized mixed arrays and objects remain a passing control`, async () => {
      const phase = ref(1);
      const Host = defineComponent(
        () => () =>
          h(
            component,
            { styles: semanticStyles, style: nativeStyle(phase.value) },
            { default: () => 'Control body' },
          ),
      );
      const wrapper = mount(Host, { attachTo: document.body });
      const root = htmlElement(wrapper.get('.apollo-typography').element);
      assertStyle(root, 1);
      for (const next of [2, 3]) {
        phase.value = next;
        await flushRender();
        expect(wrapper.get('.apollo-typography').element).toBe(root);
        assertStyle(root, next);
      }
      expect(console.warn).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it(`${name}: SSR puts every native style form on the root without numeric CSS keys`, async () => {
      for (const phase of [1, 2, 3, 0]) {
        const html = await renderToString(
          h(
            component,
            { styles: semanticStyles, style: nativeStyle(phase) },
            { default: () => h('span', { 'data-ssr-style-body': '' }, 'SSR body') },
          ),
        );
        const host = document.createElement('div');
        host.innerHTML = html;
        const root = host.querySelector('.apollo-typography');
        if (!root) throw new Error('Expected an SSR typography root');
        assertStyle(htmlElement(root), phase);
        const body = host.querySelector('[data-ssr-style-body]');
        expect(body?.getAttribute('style')).toBeNull();
      }
      expect(console.warn).not.toHaveBeenCalled();
    });
  }

  for (const { name, component } of editors) {
    for (const first of [0, 1]) {
      it(`${name}: editing ${first === 0 ? 'string' : 'mixed-array control'} styles update without resetting the native textarea`, async () => {
        const phase = ref(3);
        const Host = defineComponent(
          () => () =>
            h(
              component,
              {
                editable: true,
                'aria-label': `${name} native style editor`,
                styles: semanticStyles,
                style: nativeStyle(phase.value),
              },
              { default: () => 'Editable body' },
            ),
        );
        const wrapper = mount(Host, { attachTo: document.body });
        await wrapper.get('.apollo-typography-edit').trigger('click');
        await flushRender();
        const root = htmlElement(wrapper.get('.apollo-typography-edit-content').element);
        const editor = wrapper.get('textarea').element;
        if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected a native textarea');
        editor.value = 'Uncommitted style draft';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        await flushRender();
        for (const next of first === 0 ? [0, 1, 2, 3] : [1, 2, 3]) {
          phase.value = next;
          await flushRender();
          expect(wrapper.get('.apollo-typography-edit-content').element).toBe(root);
          assertStyle(root, next);
          expect(wrapper.get('textarea').element).toBe(editor);
          expect(editor.value).toBe('Uncommitted style draft');
          expect(document.activeElement).toBe(editor);
          expect(editor.getAttribute('aria-label')).toBe(`${name} native style editor`);
          expect(editor.style.maxWidth).toBe('');
          expect(editor.style.getPropertyValue('--native-phase')).toBe('');
          expect(editor.style.letterSpacing).toBe('1px');
        }
        expect(console.warn).not.toHaveBeenCalled();
        wrapper.unmount();
      });
    }

    it(`${name}: SSR editor styles stay on the editing root for every native form`, async () => {
      for (const phase of [1, 2, 3, 0]) {
        const html = await renderToString(
          h(
            component,
            {
              editable: { editing: true },
              'aria-label': `${name} SSR style editor`,
              styles: semanticStyles,
              style: nativeStyle(phase),
            },
            { default: () => 'SSR editable body' },
          ),
        );
        const host = document.createElement('div');
        host.innerHTML = html;
        const root = host.querySelector('.apollo-typography-edit-content');
        if (!root) throw new Error('Expected an SSR editing root');
        assertStyle(htmlElement(root), phase);
        const editor = host.querySelector('textarea');
        expect(editor?.getAttribute('aria-label')).toBe(`${name} SSR style editor`);
        expect(editor?.style.maxWidth).toBe('');
        expect(editor?.style.getPropertyValue('--native-phase')).toBe('');
        expect(editor?.style.letterSpacing).toBe('1px');
      }
      expect(console.warn).not.toHaveBeenCalled();
    });
  }
});
