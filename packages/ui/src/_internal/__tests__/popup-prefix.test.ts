import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { type Component, h, nextTick } from 'vue';
import { Popover } from '../../popover';
import { Tooltip } from '../../tooltip';

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount();
  document.body.innerHTML = '';
});
describe.each<{ name: string; component: Component }>([
  { name: 'Tooltip', component: Tooltip },
  { name: 'Popover', component: Popover },
])('$name current popup prefix', ({ component }) => {
  it('updates root/content/id linkage without replacing its business editor', async () => {
    const w = mount(component, {
      props: { open: true, prefixCls: 'first-popup' },
      slots: {
        default: () => h('button', { type: 'button' }, 'Open'),
        title: () => [
          h('label', { for: 'prefix-draft' }, 'Draft'),
          h('input', { id: 'prefix-draft' }),
        ],
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(w);
    await nextTick();
    await nextTick();
    const root = document.querySelector('.first-popup'),
      input = document.querySelector<HTMLInputElement>('#prefix-draft');
    expect(root).not.toBeNull();
    if (!input || !root) throw Error('Missing actual popup');
    const description = () => {
      const id = w.get('button').attributes('aria-describedby');
      if (!id) throw Error('Missing description reference');
      const node = document.getElementById(id);
      if (!node) throw Error('Missing described popup');
      return node;
    };
    const described = description();
    expect(described).not.toBeNull();
    expect(root.contains(described)).toBe(true);
    input.value = 'business draft';
    input.focus();
    await w.setProps({ prefixCls: 'second-popup' });
    await nextTick();
    expect(document.querySelector('.second-popup')).toBe(root);
    expect(root.classList.contains('first-popup')).toBe(false);
    expect(document.querySelector('#prefix-draft')).toBe(input);
    expect(input.value).toBe('business draft');
    expect(document.activeElement).toBe(input);
    expect(description()).toBe(described);
    await w.setProps({ prefixCls: undefined });
    await nextTick();
    expect(document.querySelector('#prefix-draft')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(description()).toBe(described);
  });
});
