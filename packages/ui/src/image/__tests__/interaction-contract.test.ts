import { resetFocusLock } from '@apollo-design/a11y';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider';
import { Image, ImagePreviewGroup, type ImageRenderInfo, type PreviewImageInfo } from '../index';

vi.unmock('@apollo-design/motion');
const source = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};
const locks = () =>
  [...document.head.querySelectorAll('style')].filter((node) =>
    node.textContent?.includes('overflow-y: hidden'),
  );
afterEach(() => {
  resetFocusLock();
  vi.restoreAllMocks();
});

describe('Image remaining interaction contracts', () => {
  it('keeps origin img semantics inside a caller button and gives rich content a separate native preview action', async () => {
    const save = vi.fn();
    const wrapper = mount(Image, {
      ...options,
      props: { src: source, alt: 'Artwork', height: 100 },
      slots: {
        imageRender: ({ originNode }) =>
          h('section', [
            h('button', { type: 'button', onClick: save }, [originNode, 'Save artwork']),
            h('input', { 'aria-label': 'Artwork caption' }),
          ]),
      },
    });
    expect(wrapper.get('img').attributes('role')).toBeUndefined();
    expect(wrapper.attributes('style')).toContain('height: auto');
    await wrapper.get('button').trigger('click');
    expect(save).toHaveBeenCalledOnce();
    expect(wrapper.emitted('update:open')).toBeUndefined();
    const action = wrapper.get('[data-apollo-image-preview-trigger]');
    expect(action.element.tagName).toBe('BUTTON');
    await action.trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
  });
  it('keeps a native keyboard preview action when custom content replaces the origin img, while empty slots stay empty', async () => {
    const empty = ref(false);
    const wrapper = mount(
      {
        setup: () => () =>
          h(
            Image,
            { src: source, alt: 'Custom artwork preview' },
            {
              imageRender: () =>
                empty.value
                  ? []
                  : h('section', [
                      h('span', 'Custom artwork'),
                      h('input', { 'aria-label': 'Artwork note' }),
                    ]),
            },
          ),
      },
      options,
    );
    await settle();
    expect(wrapper.find('img').exists()).toBe(false);
    const action = wrapper.get('button');
    expect(action.text()).toBe('Preview image');
    await action.trigger('click');
    expect(wrapper.findComponent(Image).emitted('update:open')).toEqual([[true]]);
    empty.value = true;
    await settle();
    expect(wrapper.find('button').exists()).toBe(false);
  });
  it('keeps each instance locked through a refused close, sibling removal and remount', async () => {
    const first = ref(true);
    const second = ref(true);
    const refused = vi.fn();
    const wrapper = mount(
      {
        setup: () => () => [
          first.value ? h(Image, { src: source, open: true }) : null,
          second.value
            ? h(
                Image,
                { src: source, open: true, 'onUpdate:open': refused },
                {
                  previewImage: ({ originNode }: PreviewImageInfo) => [
                    originNode,
                    h('input', { 'aria-label': 'Top first editor' }),
                    h('input', { 'aria-label': 'Top draft' }),
                  ],
                },
              )
            : null,
        ],
      },
      options,
    );
    await settle();
    expect(locks()).toHaveLength(2);
    const close = [
      ...document.querySelectorAll<HTMLButtonElement>('[aria-label="Close preview"]'),
    ].at(-1);
    if (!close) throw new Error('Expected top preview close control');
    close.click();
    await settle();
    expect(refused).toHaveBeenCalledExactlyOnceWith(false);
    expect(locks()).toHaveLength(2);
    const draft = document.querySelector<HTMLInputElement>('[aria-label="Top draft"]');
    if (!draft) throw new Error('Expected the top editor');
    // jsdom has no layout; make only these connected editors visible to the
    // real trap. The production browser suite supplies native geometry.
    for (const input of document.querySelectorAll<HTMLInputElement>('[aria-label^="Top "]')) {
      Object.defineProperty(input, 'offsetParent', {
        configurable: true,
        get: () => (input.isConnected ? input.parentElement : null),
      });
    }
    draft.value = 'Retained stacked draft';
    draft.focus();
    first.value = false;
    await settle();
    expect(locks()).toHaveLength(1);
    const outside = document.createElement('button');
    document.body.append(outside);
    try {
      outside.focus();
      expect(document.activeElement).toBe(draft);
      expect(draft.value).toBe('Retained stacked draft');
    } finally {
      outside.remove();
    }
    second.value = false;
    await settle();
    expect(locks()).toHaveLength(0);
    first.value = true;
    await settle();
    expect(locks()).toHaveLength(1);
    wrapper.unmount();
    expect(locks()).toHaveLength(0);
  });

  it('finishes leave on a live reduced-motion change, stays closed when reenabled and removes its listener', async () => {
    let reduced = false;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    Object.defineProperty(media, 'matches', { configurable: true, get: () => reduced });
    const add = vi.spyOn(media, 'addEventListener');
    const remove = vi.spyOn(media, 'removeEventListener');
    vi.spyOn(window, 'matchMedia').mockReturnValue(media);
    const wrapper = mount(Image, { ...options, props: { src: source, open: true } });
    await settle();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    const listener = add.mock.calls.find(([name]) => name === 'change')?.[1];
    if (!listener) throw new Error('Expected live preference listener');
    const change = () => {
      const event = Object.assign(new Event('change'), { matches: reduced, media: media.media });
      if (typeof listener === 'function') listener.call(media, event);
      else listener.handleEvent(event);
    };
    await wrapper.setProps({ open: false });
    reduced = true;
    change();
    await settle();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    reduced = false;
    change();
    await settle();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    wrapper.unmount();
    expect(remove).toHaveBeenCalledExactlyOnceWith('change', listener);
  });
  it('keeps rich percent progress controls outside its progressbar semantics', async () => {
    const saved = vi.fn();
    const wrapper = mount(Image, {
      ...options,
      props: {
        placeholder: {
          progress: {
            percent: 25,
            render: (origin) => [
              origin,
              h('input', { 'aria-label': 'Loading draft' }),
              h('button', { onClick: saved }, 'Cancel loading'),
            ],
          },
        },
      },
    });
    expect(wrapper.attributes('role')).toBe('group');
    const progress = wrapper.get('[role="progressbar"]');
    expect(progress.attributes('aria-valuenow')).toBe('25');
    expect(progress.find('input,button').exists()).toBe(false);
    await wrapper.get('button').trigger('click');
    expect(saved).toHaveBeenCalledOnce();
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });
  it('rich thumbnail editors and buttons keep native events without opening a preview', async () => {
    const clicked = vi.fn();
    const wrapper = mount(Image, {
      ...options,
      props: { src: source, alt: 'Editable thumbnail' },
      slots: {
        imageRender: ({ originNode }) => [
          originNode,
          h('input', { 'aria-label': 'Caption' }),
          h('button', { onClick: clicked }, 'Save'),
        ],
      },
    });
    const input = wrapper.get('input');
    await input.trigger('click');
    await input.trigger('keydown', { key: ' ' });
    await input.trigger('keydown', { key: 'Enter' });
    await wrapper.get('button').trigger('click');
    expect(clicked).toHaveBeenCalledOnce();
    expect(wrapper.emitted('update:open')).toBeUndefined();
    expect(wrapper.attributes('role')).not.toBe('button');
    await wrapper.get('[data-apollo-image-preview-trigger]').trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
  });

  it('rich cover controls and canceled clicks do not trigger the root action', async () => {
    const wrapper = mount(Image, {
      ...options,
      props: {
        src: source,
        preview: { cover: h('button', { 'data-cover-action': '' }, 'Download') },
      },
    });
    await wrapper.get('[data-cover-action]').trigger('click');
    expect(wrapper.emitted('update:open')).toBeUndefined();
    expect(wrapper.attributes('role')).not.toBe('button');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    event.preventDefault();
    wrapper.get('img').element.dispatchEvent(event);
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('keeps the actual thumbnail and moves owned focus when a conditional rich slot is removed', async () => {
    const rich = ref(true);
    const wrapper = mount(
      {
        setup: () => () =>
          h(
            Image,
            { src: source, alt: 'Conditional trigger' },
            rich.value ? { imageRender: ({ originNode }: ImageRenderInfo) => [originNode] } : {},
          ),
      },
      options,
    );
    const image = wrapper.get('img').element;
    wrapper.get<HTMLElement>('[data-apollo-image-preview-trigger]').element.focus();
    rich.value = false;
    await settle();
    expect(wrapper.get('img').element).toBe(image);
    expect(document.activeElement).toBe(wrapper.get('[role="button"]').element);
  });

  for (const group of [false, true]) {
    it(`${group ? 'Group' : 'Image'}: locks for the whole modal lifetime and releases on unmount`, async () => {
      const wrapper = group
        ? mount(ImagePreviewGroup, {
            ...options,
            props: { open: true, items: [source], preview: { mask: false } },
          })
        : mount(Image, {
            ...options,
            props: { src: source, open: true, preview: { mask: false } },
          });
      await settle();
      expect(locks()).toHaveLength(1);
      await wrapper.setProps({ open: false });
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
      expect(locks()).toHaveLength(1);
      await wrapper.setProps({ open: true });
      expect(locks()).toHaveLength(1);
      wrapper.unmount();
      expect(locks()).toHaveLength(0);
    });

    it(`${group ? 'Group' : 'Image'}: IME Escape and modified arrows keep native editing semantics`, async () => {
      const wrapper = group
        ? mount(ImagePreviewGroup, {
            ...options,
            props: { open: true, items: [source, `${source}#2`] },
          })
        : mount(Image, { ...options, props: { src: source, open: true } });
      await settle();
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) throw new Error('Expected actual preview');
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(wrapper.emitted('update:open')).toBeUndefined();
      expect(wrapper.emitted('update:current')).toBeUndefined();
      dialog.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      dialog.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
      expect(wrapper.emitted('update:open')).toBeUndefined();
    });
  }

  it('theme motion=false closes without waiting for a nonexistent transition event', async () => {
    const open = ref(true);
    mount(ConfigProvider, {
      ...options,
      props: { theme: { token: { motion: false } } },
      slots: { default: () => h(Image, { src: source, open: open.value }) },
    });
    await settle();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    open.value = false;
    await settle();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
