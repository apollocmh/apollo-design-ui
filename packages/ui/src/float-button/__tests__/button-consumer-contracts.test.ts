import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, type StyleValue, shallowRef } from 'vue';
import FloatButton from '../FloatButton';

describe('FloatButton native attributes through its Button consumer', () => {
  it.each([
    ['string', 'inset-inline-end:164px;z-index:0'],
    ['array', [{ insetInlineEnd: '94px' }, 'z-index:23']],
    ['object', { insetInlineEnd: '24px', zIndex: 43 }],
  ] satisfies [string, StyleValue][])(
    'consumes native %s styles once on the real root',
    (_name, style) => {
      const wrapper = mount(FloatButton, {
        props: { shape: 'square' },
        attrs: { style },
        slots: { content: () => 'HELP' },
        global: { stubs: { teleport: false } },
      });
      try {
        const root = wrapper.get<HTMLElement>('button').element;
        expect(root.style.insetInlineEnd).toBe(
          _name === 'string' ? '164px' : _name === 'array' ? '94px' : '24px',
        );
        expect(root.style.zIndex).toBe(_name === 'string' ? '0' : _name === 'array' ? '23' : '43');
        expect(root.style.getPropertyValue('0')).toBe('');
      } finally {
        wrapper.unmount();
      }
    },
  );
  it('removes and restores current native styles while retaining root, focus and semantic fallback', async () => {
    const style = shallowRef<StyleValue>('inset-inline-end:164px;z-index:0');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            FloatButton,
            { style: style.value, styles: { root: { paddingInline: '3px', zIndex: 17 } } },
            { content: () => h('strong', 'HELP') },
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    try {
      const original = wrapper.get<HTMLButtonElement>('button').element;
      original.focus();
      for (const value of [
        [{ paddingInline: '19px' }, 'z-index:23'],
        { paddingInline: '21px', zIndex: 29 },
        undefined,
      ]) {
        style.value = value;
        await nextTick();
        expect(wrapper.get('button').element).toBe(original);
        expect(document.activeElement).toBe(original);
      }
      expect(original.style.insetInlineEnd).toBe('');
      expect(original.style.paddingInline).toBe('3px');
      expect(original.style.zIndex).toBe('17');
    } finally {
      wrapper.unmount();
    }
  });
});
