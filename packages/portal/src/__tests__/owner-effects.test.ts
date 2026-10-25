import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick, shallowRef } from 'vue';
import { Portal } from '../portal';
import { escKeyDownTest } from '../use-esc-key-down';

const locks = (doc: Document) =>
  [...doc.head.querySelectorAll('style')].filter((node) =>
    node.textContent?.includes('overflow-y: hidden'),
  );
const settle = async () => {
  await nextTick();
  await nextTick();
};
describe('Portal side effects follow the actual container owner', () => {
  it('moves lock and Escape registration with a stable resolver, including inline rendering', async () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const doc = frame.contentDocument;
    const view = doc?.defaultView;
    if (!doc || !view) throw new Error('Expected actual iframe');
    const target = shallowRef<Element | undefined>(doc.body);
    const onEsc = vi.fn();
    const wrapper = mount(Portal, {
      attachTo: document.body,
      props: { open: true, autoLock: true, getContainer: () => target.value, onEsc },
      slots: { default: () => h('input') },
      global: { stubs: { teleport: false } },
    });
    try {
      await settle();
      expect.soft(locks(doc)).toHaveLength(1);
      expect.soft(locks(document)).toHaveLength(0);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect.soft(onEsc).not.toHaveBeenCalled();
      view.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect.soft(onEsc).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ top: true }));
      onEsc.mockClear();
      target.value = document.body;
      await settle();
      expect.soft(locks(doc)).toHaveLength(0);
      expect.soft(locks(document)).toHaveLength(1);
      view.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect.soft(onEsc).not.toHaveBeenCalled();
      await wrapper.setProps({ getContainer: false });
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect.soft(onEsc).toHaveBeenCalledOnce();
    } finally {
      wrapper.unmount();
      frame.remove();
    }
    expect(locks(document)).toHaveLength(0);
  });

  it('respects a child preventing Escape before it reaches the owning window', async () => {
    const onEsc = vi.fn();
    const wrapper = mount(Portal, {
      attachTo: document.body,
      props: { open: true, onEsc },
      slots: {
        default: () => h('input', { onKeydown: (event: KeyboardEvent) => event.preventDefault() }),
      },
      global: { stubs: { teleport: false } },
    });
    await settle();
    try {
      document
        .querySelector('input')
        ?.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
      expect(onEsc).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps independent stacks, latest callbacks, IME protection and original top flags while closing', async () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const doc = frame.contentDocument;
    const view = doc?.defaultView;
    if (!doc || !view) throw new Error('Expected actual iframe');
    const calls: string[] = [];
    const first = mount(Portal, {
      props: {
        open: true,
        getContainer: () => doc.body,
        onEsc: ({ top }) => calls.push(`first:${top}`),
      },
    });
    const second = mount(Portal, {
      props: {
        open: true,
        getContainer: () => doc.body,
        onEsc: ({ top }) => {
          calls.push(`second:${top}`);
          second.unmount();
        },
      },
    });
    const main = mount(Portal, {
      props: { open: true, onEsc: ({ top }) => calls.push(`main:${top}`) },
    });
    try {
      await settle();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(calls.splice(0)).toEqual(['main:true']);
      view.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(calls.splice(0)).toEqual(['second:true', 'first:false']);
      await first.setProps({ onEsc: ({ top }) => calls.push(`updated:${top}`) });
      vi.useFakeTimers();
      view.dispatchEvent(new Event('compositionend'));
      view.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(calls).toEqual([]);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(calls.splice(0)).toEqual(['main:true']);
      vi.advanceTimersByTime(200);
      view.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(calls.splice(0)).toEqual(['updated:true']);
      await first.setProps({ open: false });
      view.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(calls).toEqual([]);
    } finally {
      vi.useRealTimers();
      first.unmount();
      main.unmount();
      frame.remove();
    }
    expect(escKeyDownTest?.getStack()).toHaveLength(0);
  });
});
