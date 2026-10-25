import { resetFocusLock } from '@apollo-design/a11y';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Image, ImagePreviewGroup, type ImageProps } from '../index';

// Keep the real Portal, CSSMotion, focus hooks and deadline in this integration suite.
vi.unmock('@apollo-design/motion');

type Target = 'Image' | 'PreviewGroup';
const targets: Target[] = ['Image', 'PreviewGroup'];
const source =
  'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="140"%3E%3Crect width="240" height="140" fill="%2338598b"/%3E%3C/svg%3E';
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };

afterEach(() => {
  resetFocusLock();
  vi.restoreAllMocks();
});

function element(node: Element | null): HTMLElement {
  if (!(node instanceof HTMLElement)) throw new Error('Expected a real mounted HTML element');
  return node;
}

function dialog() {
  return element(document.querySelector('[role="dialog"]'));
}

function dispatchActiveKey(key: string) {
  element(document.activeElement).dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

function mountTarget(
  target: Target,
  props: Pick<ImageProps, 'open' | 'preview' | 'onOpenChange'> = {},
) {
  if (target === 'Image') {
    return mount(Image, {
      ...options,
      props: { src: source, alt: 'Focus preview image', ...props },
      attrs: { 'data-focus-trigger': '' },
    });
  }
  return mount(ImagePreviewGroup, {
    ...options,
    props,
    slots: {
      default: () => [
        h(Image, { src: source, alt: 'Focus preview first', 'data-focus-trigger': '' }),
        h(Image, { src: source, alt: 'Focus preview second' }),
      ],
    },
  });
}

async function settle() {
  await nextTick();
  await nextTick();
  await nextTick();
}

async function expectClosed() {
  // Do not synthesize transitionend: the real CSSMotion deadline must finish leaving.
  await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), {
    timeout: 1500,
  });
}

describe('Image Preview real focus and control names', () => {
  for (const target of targets) {
    it(`${target}: Enter moves focus inside so Escape from the active element really closes`, async () => {
      const afterOpenChange = vi.fn<(open: boolean) => void>();
      const wrapper = mountTarget(target, { preview: { afterOpenChange } });
      const trigger = element(wrapper.get('[data-focus-trigger]').element);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);
      dispatchActiveKey('Enter');
      await vi.waitFor(() => expect(afterOpenChange).toHaveBeenCalledWith(true), {
        timeout: 1500,
      });
      expect.soft(dialog().contains(document.activeElement)).toBe(true);
      // Send Escape to the actual current focus; do not focus the dialog for this path.
      dispatchActiveKey('Escape');
      await expectClosed();
      expect(document.activeElement).toBe(trigger);
      expect(afterOpenChange).toHaveBeenLastCalledWith(false);
    });

    it(`${target}: closing with the real button restores the original trigger`, async () => {
      const wrapper = mountTarget(target);
      const trigger = element(wrapper.get('[data-focus-trigger]').element);
      trigger.focus();
      dispatchActiveKey('Enter');
      await settle();
      const close = element(dialog().querySelector('.apollo-image-preview-close'));
      // jsdom's click() does not move focus as a browser click does.
      close.focus();
      expect(document.activeElement).toBe(close);
      close.click();
      await expectClosed();
      expect(document.activeElement).toBe(trigger);
    });

    it(`${target}: control - explicitly focused dialog already handles Escape`, async () => {
      const wrapper = mountTarget(target);
      const trigger = element(wrapper.get('[data-focus-trigger]').element);
      trigger.focus();
      dispatchActiveKey('Enter');
      await settle();
      dialog().focus();
      expect(document.activeElement).toBe(dialog());
      dispatchActiveKey('Escape');
      await expectClosed();
      expect(wrapper.emitted('openChange')).toEqual([
        [true, false],
        [false, true],
      ]);
    });

    it(`${target}: a controlled parent rejecting close keeps focus until it actually closes`, async () => {
      const onOpenChange = vi.fn();
      const wrapper = mountTarget(target, { open: false, onOpenChange });
      const trigger = element(wrapper.get('[data-focus-trigger]').element);
      trigger.focus();
      await wrapper.setProps({ open: true });
      await settle();
      const currentDialog = dialog();
      const close = element(currentDialog.querySelector('.apollo-image-preview-close'));
      close.focus();
      close.click();
      await settle();
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false, true);
      expect(dialog()).toBe(currentDialog);
      expect(document.activeElement).toBe(close);
      expect(document.activeElement).not.toBe(trigger);
      await wrapper.setProps({ open: false });
      await expectClosed();
      expect(document.activeElement).toBe(trigger);
    });

    it(`${target}: unmounting a conditionally mounted open preview restores its external opener`, async () => {
      const shown = ref(false);
      const Host = defineComponent({
        setup: () => () =>
          h('section', [
            h(
              'button',
              { type: 'button', 'data-external-opener': '', onClick: () => (shown.value = true) },
              'Open conditional image',
            ),
            shown.value
              ? target === 'Image'
                ? h(Image, { src: source, alt: 'Conditional image', defaultOpen: true })
                : h(
                    ImagePreviewGroup,
                    { defaultOpen: true },
                    { default: () => h(Image, { src: source, alt: 'Conditional group image' }) },
                  )
              : null,
          ]),
      });
      const wrapper = mount(Host, options);
      const opener = element(wrapper.get('[data-external-opener]').element);
      opener.focus();
      opener.click();
      await settle();
      // Exercise teardown independently of the automatic-opening focus assertion above.
      dialog().focus();
      expect(document.activeElement).toBe(dialog());
      shown.value = false;
      await expectClosed();
      expect(document.activeElement).toBe(opener);
    });
  }

  it('custom decorative icons preserve button action names and type=button', async () => {
    mountTarget('PreviewGroup', {
      open: true,
      preview: {
        icons: {
          close: h('span', { 'aria-hidden': 'true' }, '×'),
          left: h('span', { 'aria-hidden': 'true' }, '‹'),
          right: h('span', { 'aria-hidden': 'true' }, '›'),
        },
      },
    });
    await settle();
    for (const selector of [
      '.apollo-image-preview-close',
      '.apollo-image-preview-switch-prev',
      '.apollo-image-preview-switch-next',
    ]) {
      const control = element(dialog().querySelector(selector));
      expect.soft(control).toHaveAccessibleName();
      expect.soft(control).toHaveAttribute('type', 'button');
    }
  });

  it('control - default icons already provide nonempty close and switch names', async () => {
    mountTarget('PreviewGroup', { open: true });
    await settle();
    for (const selector of [
      '.apollo-image-preview-close',
      '.apollo-image-preview-switch-prev',
      '.apollo-image-preview-switch-next',
    ]) {
      expect(element(dialog().querySelector(selector))).toHaveAccessibleName();
    }
  });

  it('removing the opener and unmounting the preview is safe and releases its focus listeners', async () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const shown = ref(false);
    const hasOpener = ref(true);
    const errors: unknown[] = [];
    const Host = defineComponent({
      setup: () => () =>
        h('section', [
          hasOpener.value
            ? h(
                'button',
                {
                  type: 'button',
                  'data-removable-opener': '',
                  onClick: () => (shown.value = true),
                },
                'Open removable image',
              )
            : null,
          shown.value
            ? h(Image, { src: source, alt: 'Removable opener image', defaultOpen: true })
            : null,
          h('button', { type: 'button', 'data-surviving-control': '' }, 'Surviving control'),
        ]),
    });
    const wrapper = mount(Host, {
      ...options,
      global: { ...options.global, config: { errorHandler: (error) => errors.push(error) } },
    });
    const opener = element(wrapper.get('[data-removable-opener]').element);
    opener.focus();
    opener.click();
    await settle();
    dialog().focus();
    hasOpener.value = false;
    await settle();
    expect(opener.isConnected).toBe(false);
    shown.value = false;
    await expectClosed();
    expect(errors).toEqual([]);
    const focusListeners = add.mock.calls.filter(([type]) => type === 'focusin');
    expect(focusListeners.length).toBeGreaterThan(0);
    for (const [type, listener, listenerOptions] of focusListeners) {
      expect(
        remove.mock.calls.some(
          ([removedType, removedListener, removedOptions]) =>
            removedType === type &&
            removedListener === listener &&
            removedOptions === listenerOptions,
        ),
      ).toBe(true);
    }
    const survivor = element(wrapper.get('[data-surviving-control]').element);
    survivor.focus();
    expect(document.activeElement).toBe(survivor);
  });
});
