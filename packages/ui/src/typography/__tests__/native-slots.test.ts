import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Component, defineComponent, h, nextTick, ref } from 'vue';
import { Link, Paragraph, Text, Title, Typography } from '../../index';

const family: { name: string; component: Component }[] = [
  { name: 'Typography', component: Typography },
  { name: 'Text', component: Text },
  { name: 'Title', component: Title },
  { name: 'Paragraph', component: Paragraph },
  { name: 'Link', component: Link },
];
const children = family.filter(({ name }) => name !== 'Typography');

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function flushRender() {
  await nextTick();
  await nextTick();
}

describe('F11 Typography current native default slots', () => {
  for (const { name, component } of family) {
    it(`${name} uses the current parent-render slot closure`, async () => {
      const text = ref('first text');
      const Host = defineComponent(() => () => {
        // Read in the parent render: the supplied slot closes over a plain value.
        const current = text.value;
        return h(component, {}, { default: () => current });
      });
      const wrapper = mount(Host, { attachTo: document.body });
      const root = wrapper.get('.apollo-typography').element;
      expect(root.textContent).toBe('first text');
      text.value = 'current text';
      await flushRender();
      expect(wrapper.get('.apollo-typography').element).toBe(root);
      expect(root.textContent).toBe('current text');
      wrapper.unmount();
    });
  }

  for (const { name, component } of children) {
    it(`${name} CSS ellipsis does not evaluate default slots before render`, async () => {
      const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const wrapper = mount(component, {
        props: { ellipsis: true },
        slots: { default: () => 'Ellipsis content' },
        attachTo: document.body,
      });
      await flushRender();
      const slotWarnings = warnings.mock.calls.filter((args) =>
        args.some((value) =>
          String(value).includes('Slot "default" invoked outside of the render function'),
        ),
      );
      expect(slotWarnings).toEqual([]);
      wrapper.unmount();
    });
  }

  it('retains the already reactive direct-ref slot as a control', async () => {
    const text = ref('first direct text');
    const wrapper = mount(Text, {
      slots: { default: () => text.value },
      attachTo: document.body,
    });
    expect(wrapper.text()).toBe('first direct text');
    text.value = 'current direct text';
    await flushRender();
    expect(wrapper.text()).toBe('current direct text');
    wrapper.unmount();
  });

  it('a current conditional slot changes copy icon-only state and can become empty again', async () => {
    const present = ref(false);
    const Host = defineComponent(() => () => {
      const current = present.value;
      return h(Text, { copyable: true }, current ? { default: () => 'Available text' } : {});
    });
    const wrapper = mount(Host, { attachTo: document.body });
    expect(wrapper.get('.apollo-typography-copy').classes()).toContain(
      'apollo-typography-copy-icon-only',
    );
    present.value = true;
    await flushRender();
    expect(wrapper.text()).toContain('Available text');
    expect(wrapper.get('.apollo-typography-copy').classes()).not.toContain(
      'apollo-typography-copy-icon-only',
    );
    present.value = false;
    await flushRender();
    expect(wrapper.text()).not.toContain('Available text');
    expect(wrapper.get('.apollo-typography-copy').classes()).toContain(
      'apollo-typography-copy-icon-only',
    );
    wrapper.unmount();
  });

  it('editing starts from the currently displayed default text', async () => {
    const text = ref('old editable text');
    const Host = defineComponent(() => () => {
      const current = text.value;
      return h(Paragraph, { editable: true }, { default: () => current });
    });
    const wrapper = mount(Host, { attachTo: document.body });
    text.value = 'current editable text';
    await flushRender();
    await wrapper.get('.apollo-typography-edit').trigger('click');
    await flushRender();
    const editor = wrapper.get('textarea').element;
    if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected native editor');
    expect(editor.value).toBe('current editable text');
    expect(document.activeElement).toBe(editor);
    wrapper.unmount();
  });

  it('keeps the current native aria-label on the focused editor without losing its draft', async () => {
    const label = ref<string | undefined>('Editable article label');
    const Host = defineComponent(
      () => () =>
        h(
          Paragraph,
          { editable: true, 'aria-label': label.value },
          { default: () => 'Editable article' },
        ),
    );
    const wrapper = mount(Host, { attachTo: document.body });
    expect(wrapper.get('.apollo-typography').attributes('aria-label')).toBe(
      'Editable article label',
    );
    await wrapper.get('.apollo-typography-edit').trigger('click');
    await flushRender();
    const editor = wrapper.get('textarea').element;
    if (!(editor instanceof HTMLTextAreaElement)) throw new Error('Expected native editor');
    expect(editor.getAttribute('aria-label')).toBe('Editable article label');
    editor.value = 'User draft remains';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    await flushRender();
    expect(document.activeElement).toBe(editor);
    label.value = 'Current editor label';
    await flushRender();
    expect(wrapper.get('textarea').element).toBe(editor);
    expect(editor.getAttribute('aria-label')).toBe('Current editor label');
    expect(editor.value).toBe('User draft remains');
    expect(document.activeElement).toBe(editor);
    label.value = undefined;
    await flushRender();
    expect(wrapper.get('textarea').element).toBe(editor);
    expect(editor.getAttribute('aria-label')).toBe('Edit');
    expect(editor.value).toBe('User draft remains');
    expect(document.activeElement).toBe(editor);
    wrapper.unmount();
  });

  it('copy fallback reads the current parent-render text', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    try {
      const text = ref('old clipboard text');
      const Host = defineComponent(() => () => {
        const current = text.value;
        return h(Text, { copyable: true }, { default: () => current });
      });
      const wrapper = mount(Host, { attachTo: document.body });
      text.value = 'current clipboard text';
      await flushRender();
      await wrapper.get('.apollo-typography-copy').trigger('click');
      await flushRender();
      expect(writeText).toHaveBeenCalledExactlyOnceWith('current clipboard text');
      wrapper.unmount();
    } finally {
      if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
      else Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('rich content updates without replacing a focused uncontrolled input', async () => {
    const text = ref('first rich label');
    const Host = defineComponent(() => () => {
      const current = text.value;
      return h(
        Paragraph,
        {},
        {
          default: () => [
            h('span', { key: 'label', 'data-native-slot-label': '' }, current),
            h('input', { key: 'note', 'aria-label': 'Typography note' }),
          ],
        },
      );
    });
    const wrapper = mount(Host, { attachTo: document.body });
    const input = wrapper.get('input').element;
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected native input');
    input.value = 'kept draft';
    input.focus();
    text.value = 'current rich label';
    await flushRender();
    expect(wrapper.get('input').element).toBe(input);
    expect(input.value).toBe('kept draft');
    expect(document.activeElement).toBe(input);
    expect(wrapper.get('[data-native-slot-label]').text()).toBe('current rich label');
    wrapper.unmount();
  });
});
