import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider';
import { Badge, Ribbon } from '../index';

describe('Badge indicator ownership across visual modes', () => {
  for (const text of [undefined, 'Ready']) {
    it(`wrapped status has an actual status dot (${text ?? 'no caption'})`, () => {
      const w = mount(Badge, {
        props: { status: 'success', text },
        slots: { default: () => h('i', 'Anchor') },
      });
      const dot = w.get('.apollo-badge-status-dot');
      expect(dot.classes()).toContain('apollo-badge-dot');
      expect(dot.classes()).not.toContain('apollo-badge-count');
      expect(dot.classes()).toContain('apollo-badge-status-success');
      expect(w.find('.apollo-badge-count').exists()).toBe(false);
      w.unmount();
    });
  }
  it('complete rich content consumes the existing multiword padding', () => {
    const w = mount(Badge, { slots: { count: () => h('strong', 'Words') } });
    expect(w.get('.apollo-badge-count').classes()).toContain('apollo-badge-multiple-words');
    w.unmount();
  });
  for (const count of [5, h('strong', 'Words')]) {
    it(`explicit shadow wins with borderColor (${typeof count})`, () => {
      const w = mount(Badge, {
        props: { count, styles: { indicator: { borderColor: 'red', boxShadow: 'none' } } },
      });
      expect(w.get('.apollo-badge-count').attributes('style')).toContain('box-shadow: none');
      expect(w.get('.apollo-badge-count').attributes('style')).toContain('border-color: red');
      w.unmount();
    });
  }
  for (const component of [Badge, Ribbon]) {
    it(`${component.name}: native direction overrides Provider without replacing content`, async () => {
      const dir = ref<'ltr' | 'rtl' | 'auto' | undefined>('ltr');
      const w = mount(
        defineComponent(
          () => () =>
            h(
              ConfigProvider,
              { direction: 'rtl' },
              {
                default: () =>
                  h(component, { dir: dir.value, count: 5, text: 'Ribbon' }, () =>
                    h('input', { 'aria-label': 'Direction draft' }),
                  ),
              },
            ),
        ),
        { global: { stubs: { teleport: false } } },
      );
      const input = w.get('input').element;
      const root = w.findComponent(component);
      const node = () => (component === Badge ? root : w.get('.apollo-ribbon'));
      const rtlClass = component === Badge ? 'apollo-badge-rtl' : 'apollo-ribbon-rtl';
      expect(root.attributes('dir')).toBe('ltr');
      expect(node().classes()).not.toContain(rtlClass);
      dir.value = 'rtl';
      await nextTick();
      expect(node().classes()).toContain(rtlClass);
      dir.value = 'auto';
      await nextTick();
      expect(root.attributes('dir')).toBe('auto');
      expect(node().classes()).not.toContain(rtlClass);
      dir.value = undefined;
      await nextTick();
      expect(node().classes()).toContain(rtlClass);
      expect(w.get('input').element).toBe(input);
      w.unmount();
    });
  }
});
