import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, onMounted, ref, shallowRef } from 'vue';
import { ConfigProvider } from '../ConfigProvider';
import type { ConfigProviderThemeConfig } from '../hooks/use-theme';

it('replaces a current CSS variable prefix and removes variables from its previous prefix', async () => {
  const wrapper = mount(ConfigProvider, {
    props: {
      scopeTag: 'div',
      theme: { cssVarPrefix: 'first', token: { colorPrimary: '#123456' } },
    },
    slots: { default: () => h('span', 'Current theme') },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  await nextTick();
  await nextTick();
  const scope = wrapper.get('div[style*="display: contents"]').element;
  if (!(scope instanceof HTMLElement)) throw new Error('Expected the actual theme scope');
  expect(scope.style.getPropertyValue('--first-color-primary')).toBe('#123456');
  await wrapper.setProps({ theme: { cssVarPrefix: 'second', token: { colorPrimary: '#234567' } } });
  expect(scope.style.getPropertyValue('--first-color-primary')).toBe('');
  expect(scope.style.getPropertyValue('--second-color-primary')).toBe('#234567');
  wrapper.unmount();
  expect(scope.style.getPropertyValue('--second-color-primary')).toBe('');
});

it.each([false, true])(
  'preserves slot component state, editor and focus through theme appearance/removal (initial=%s)',
  async (initial) => {
    const theme = shallowRef<ConfigProviderThemeConfig | undefined>(
      initial ? { token: { colorPrimary: '#123456' } } : undefined,
    );
    const mounted = vi.fn();
    const Child = defineComponent({
      setup() {
        const count = ref(0);
        onMounted(mounted);
        return () =>
          h('section', [
            h('button', { onClick: () => count.value++ }, `Count ${count.value}`),
            h('input', { 'aria-label': 'Provider draft' }),
          ]);
      },
    });
    const Host = defineComponent(
      () => () => h(ConfigProvider, { theme: theme.value }, { default: () => h(Child) }),
    );
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    await nextTick();
    const root = wrapper.get('section').element;
    const editor = wrapper.get('input').element;
    if (!(editor instanceof HTMLInputElement)) throw new Error('Expected the actual editor');
    await wrapper.get('button').trigger('click');
    editor.value = 'Kept provider draft';
    editor.focus();
    editor.setSelectionRange(2, 5);
    for (const current of [
      { token: { colorPrimary: '#234567' } },
      undefined,
      { token: { colorPrimary: '#345678' } },
      undefined,
    ]) {
      theme.value = current;
      await nextTick();
      await nextTick();
      await nextTick();
      expect(wrapper.get('section').element).toBe(root);
      expect(wrapper.get('input').element).toBe(editor);
      expect(wrapper.get('button').text()).toBe('Count 1');
      expect(editor.value).toBe('Kept provider draft');
      expect([editor.selectionStart, editor.selectionEnd]).toEqual([2, 5]);
      expect(document.activeElement).toBe(editor);
      expect(mounted).toHaveBeenCalledTimes(1);
    }
    wrapper.unmount();
  },
);
