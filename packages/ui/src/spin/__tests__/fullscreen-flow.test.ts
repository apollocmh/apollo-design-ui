import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { Spin } from '../index';
import { genSpinStyle } from '../style';

let style: HTMLStyleElement;
beforeEach(() => {
  style = document.createElement('style');
  style.textContent = genSpinStyle('apollo');
  document.head.appendChild(style);
});
afterEach(() => style.remove());

describe('Spin fullscreen keeps native content in flow', () => {
  it('re-evaluates semantic factories from current fullscreen state', async () => {
    const wrapper = mount(Spin, {
      props: {
        fullscreen: false,
        styles: ({ props }) => ({ container: { color: props.fullscreen ? 'blue' : 'red' } }),
      },
      slots: { default: () => h('input') },
    });
    expect(wrapper.get('.apollo-spin-container').attributes('style')).toContain('color: red');
    await wrapper.setProps({ fullscreen: true });
    expect(wrapper.get('.apollo-spin-container').attributes('style')).toContain('color: blue');
    wrapper.unmount();
  });

  it('fixes the overlay while keeping the root, editor and ref stable across mode changes', async () => {
    const wrapper = mount(Spin, {
      props: { fullscreen: true },
      slots: { default: () => h('input', { 'aria-label': 'Draft' }) },
      attachTo: document.body,
    });
    const root = wrapper.element;
    const editor = wrapper.get('input').element;
    editor.value = 'Current draft';
    editor.focus();
    expect(getComputedStyle(root).position).toBe('relative');
    expect(getComputedStyle(wrapper.get('.apollo-spin-section').element).position).toBe('fixed');
    for (const fullscreen of [false, true, false]) {
      await wrapper.setProps({ fullscreen });
      expect(wrapper.element).toBe(root);
      expect(wrapper.vm.nativeElement).toBe(root);
      expect(wrapper.get('input').element).toBe(editor);
      expect(editor.value).toBe('Current draft');
      expect(document.activeElement).toBe(editor);
    }
    wrapper.unmount();
  });

  it('applies mask semantics to the real overlay and isolates an inactive mask', async () => {
    const warning = vi.spyOn(console, 'error');
    const wrapper = mount(Spin, {
      props: {
        fullscreen: true,
        classNames: { root: 'owned-root', mask: 'owned-mask' },
        styles: { root: { color: 'red' }, mask: { backgroundColor: 'rgb(1, 2, 3)' } },
      },
      slots: { description: () => h('button', { type: 'button' }, 'Cancel') },
    });
    expect(wrapper.classes()).toContain('owned-root');
    expect(wrapper.classes()).not.toContain('owned-mask');
    expect(wrapper.get('.apollo-spin-section.owned-mask').attributes('style')).toContain(
      'background-color: rgb(1, 2, 3)',
    );
    await wrapper.setProps({ spinning: false });
    await nextTick();
    expect(wrapper.get('.owned-mask').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('.owned-mask').element.hasAttribute('inert')).toBe(true);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(warning.mock.calls.flat().join(' ')).not.toContain('mask` is deprecated');
    wrapper.unmount();
  });
});
