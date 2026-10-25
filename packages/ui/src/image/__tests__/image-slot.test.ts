import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, isVNode, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Image, ImagePreviewGroup } from '../../index';
import type { ImageRenderInfo } from '../interface';

// jsdom has no image decoding. Exercise the real status hook through its browser API.
class ValidationImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(value: string) {
    queueMicrotask(() => {
      if (value === 'bad.png') this.onerror?.();
      else this.onload?.();
    });
  }
}
beforeEach(() => {
  vi.stubGlobal('Image', ValidationImage);
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function flushRender() {
  await nextTick();
  await nextTick();
  await nextTick();
}
function nativeImage(wrapper: ReturnType<typeof mount>) {
  const image = wrapper.get('.apollo-image-img').element;
  if (!(image instanceof HTMLImageElement)) throw new Error('Expected the original image');
  return image;
}
function originalFigure(info: ImageRenderInfo) {
  if (!isVNode(info.originNode)) throw new Error('Expected the original image VNode');
  return h('figure', { 'data-image-slot': info.src ?? 'missing' }, [info.originNode]);
}
function latest(calls: readonly (readonly ImageRenderInfo[])[]) {
  const info = calls.at(-1)?.[0];
  if (!info) throw new Error('Expected a current image slot scope');
  return info;
}

describe('F11 Image native imageRender slot', () => {
  it('current, empty and removed slots expose current image data while preserving live rich content', async () => {
    const present = ref(false);
    const empty = ref(false);
    const label = ref('First caption');
    const src = ref('first.png');
    const alt = ref('First alternative');
    const width = ref<number | string>(120);
    const height = ref<number | string>('90px');
    const title = ref('First image title');
    const imageClass = ref('initial-image-semantic');
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const slot = vi.fn((info: ImageRenderInfo) => {
      if (!isVNode(info.originNode)) throw new Error('Expected a single original VNode');
      return empty.value
        ? []
        : h('figure', { 'data-current-image-slot': '' }, [
            h('figcaption', { key: 'caption' }, label.value),
            info.originNode,
            h('input', { key: 'draft', 'aria-label': 'Custom image draft' }),
          ]);
    });
    const Host = defineComponent(
      () => () =>
        h(
          Image,
          {
            src: src.value,
            alt: alt.value,
            width: width.value,
            height: height.value,
            title: title.value,
            classNames: { image: imageClass.value },
            preview: false,
          },
          present.value ? { imageRender: slot } : {},
        ),
    );
    const wrapper = mount(Host, { attachTo: document.body });
    const root = wrapper.get('.apollo-image').element;
    expect(nativeImage(wrapper).getAttribute('src')).toBe('first.png');
    expect(slot).not.toHaveBeenCalled();
    present.value = true;
    await flushRender();
    expect(wrapper.find('[data-current-image-slot]').exists()).toBe(true);
    expect(slot.mock.calls.every((call) => call.length === 1)).toBe(true);
    expect(latest(slot.mock.calls)).toEqual(
      expect.objectContaining({
        src: 'first.png',
        alt: 'First alternative',
        width: 120,
        height: '90px',
        title: 'First image title',
        classNames: { image: 'initial-image-semantic' },
      }),
    );
    const image = nativeImage(wrapper);
    const draft = wrapper.get('input').element;
    if (!(draft instanceof HTMLInputElement)) throw new Error('Expected rich native input');
    draft.value = 'Kept image draft';
    draft.focus();
    src.value = 'current.png';
    alt.value = 'Current alternative';
    width.value = '210px';
    height.value = 140;
    title.value = 'Current image title';
    imageClass.value = 'current-image-semantic';
    label.value = 'Current caption';
    await flushRender();
    expect(wrapper.get('.apollo-image').element).toBe(root);
    expect(nativeImage(wrapper)).toBe(image);
    expect(image.getAttribute('src')).toBe('current.png');
    expect(image.getAttribute('alt')).toBe('Current alternative');
    expect(image.getAttribute('width')).toBe('210px');
    expect(image.getAttribute('height')).toBe('140');
    expect(image.classList.contains('current-image-semantic')).toBe(true);
    expect(wrapper.get('figcaption').text()).toBe('Current caption');
    expect(wrapper.get('input').element).toBe(draft);
    expect(draft.value).toBe('Kept image draft');
    expect(document.activeElement).toBe(draft);
    expect(latest(slot.mock.calls)).toEqual(
      expect.objectContaining({
        src: 'current.png',
        alt: 'Current alternative',
        width: '210px',
        height: 140,
        title: 'Current image title',
        classNames: { image: 'current-image-semantic' },
      }),
    );
    empty.value = true;
    await flushRender();
    expect(wrapper.find('img').exists()).toBe(false);
    present.value = false;
    await flushRender();
    expect(wrapper.get('.apollo-image').element).toBe(root);
    expect(nativeImage(wrapper).getAttribute('src')).toBe('current.png');
    expect(wrapper.find('[data-current-image-slot]').exists()).toBe(false);
    expect(warnings).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('missing src stays undefined in the scope and original VNode', async () => {
    const slot = vi.fn(originalFigure);
    const wrapper = mount(Image, {
      props: { alt: 'No source', preview: false },
      slots: { imageRender: slot },
    });
    expect(slot).toHaveBeenCalled();
    const info = latest(slot.mock.calls);
    expect(info.src).toBeUndefined();
    if (!isVNode(info.originNode)) throw new Error('Expected the original image VNode');
    expect(info.originNode.props?.src).toBeUndefined();
    expect(nativeImage(wrapper).hasAttribute('src')).toBe(false);
    wrapper.unmount();
  });

  it('scope src follows the actual original image fallback and a later valid source', async () => {
    const slot = vi.fn(originalFigure);
    const wrapper = mount(Image, {
      props: { src: 'bad.png', fallback: 'fallback.png', preview: false },
      slots: { imageRender: slot },
    });
    await flushRender();
    expect(slot).toHaveBeenCalled();
    const image = nativeImage(wrapper);
    expect(image.getAttribute('src')).toBe('fallback.png');
    expect(latest(slot.mock.calls).src).toBe('fallback.png');
    expect(wrapper.classes()).toContain('apollo-image-error');
    await wrapper.setProps({ src: 'valid.png' });
    await flushRender();
    expect(nativeImage(wrapper)).toBe(image);
    expect(image.getAttribute('src')).toBe('valid.png');
    expect(latest(slot.mock.calls).src).toBe('valid.png');
    expect(wrapper.classes()).not.toContain('apollo-image-error');
    wrapper.unmount();
  });

  for (const custom of [false, true]) {
    it(`original image ref/load/error paths remain intact (custom=${custom})`, async () => {
      const error = vi.fn<(event: Event) => void>();
      const slot = vi.fn(originalFigure);
      const wrapper = mount(Image, {
        props: {
          src: 'loading.png',
          alt: 'Loading original',
          placeholder: 'Loading image',
          preview: false,
          onError: error,
        },
        slots: custom ? { imageRender: slot } : {},
        attachTo: document.body,
      });
      const image = nativeImage(wrapper);
      if (custom) {
        expect(slot).toHaveBeenCalled();
        const origin = latest(slot.mock.calls).originNode;
        if (!isVNode(origin)) throw new Error('Expected an image VNode');
        expect(origin.ref).not.toBeNull();
      }
      expect(wrapper.find('.apollo-image-placeholder').exists()).toBe(true);
      const event = new Event('error');
      image.dispatchEvent(event);
      expect(error).toHaveBeenCalledExactlyOnceWith(event);
      image.dispatchEvent(new Event('load'));
      await flushRender();
      expect(wrapper.find('.apollo-image-placeholder').exists()).toBe(false);
      expect(nativeImage(wrapper)).toBe(image);
      wrapper.unmount();
    });

    it(`original image opens the independent preview image (custom=${custom})`, async () => {
      const open = vi.fn<(open: boolean, previous: boolean) => void>();
      const slot = vi.fn(originalFigure);
      const wrapper = mount(Image, {
        props: {
          src: 'thumbnail.png',
          alt: 'Preview original',
          preview: { src: 'large.png' },
          onOpenChange: open,
        },
        slots: custom ? { imageRender: slot } : {},
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      if (custom) expect(wrapper.find('[data-image-slot]').exists()).toBe(true);
      nativeImage(wrapper).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushRender();
      const preview = document.body.querySelector('.apollo-image-preview-img');
      if (!(preview instanceof HTMLImageElement)) throw new Error('Expected a preview image');
      expect(preview.getAttribute('src')).toBe('large.png');
      expect(open).toHaveBeenCalledTimes(1);
      expect(open.mock.calls[0]?.[0]).toBe(true);
      if (custom) expect(latest(slot.mock.calls).src).toBe('thumbnail.png');
      wrapper.unmount();
    });

    it(`group registration selects the clicked original image (custom=${custom})`, async () => {
      const slot = vi.fn(originalFigure);
      const Host = defineComponent(
        () => () =>
          h(
            ImagePreviewGroup,
            {},
            {
              default: () => [
                h(
                  Image,
                  {
                    src: 'first-thumb.png',
                    alt: 'First group image',
                    preview: { src: 'first-large.png' },
                  },
                  custom ? { imageRender: slot } : {},
                ),
                h(
                  Image,
                  {
                    src: 'second-thumb.png',
                    alt: 'Second group image',
                    preview: { src: 'second-large.png' },
                  },
                  custom ? { imageRender: slot } : {},
                ),
              ],
            },
          ),
      );
      const wrapper = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await flushRender();
      if (custom) expect(wrapper.findAll('[data-image-slot]')).toHaveLength(2);
      await wrapper.get('img[src="second-thumb.png"]').trigger('click');
      await flushRender();
      const preview = document.body.querySelector('.apollo-image-preview-img');
      if (!(preview instanceof HTMLImageElement)) throw new Error('Expected a group preview image');
      expect(preview.getAttribute('src')).toBe('second-large.png');
      expect(preview.getAttribute('alt')).toBe('Second group image');
      wrapper.unmount();
    });
  }

  it('SSR renders the current rich image slot around the original VNode', async () => {
    const slot = vi.fn((info: ImageRenderInfo) => {
      if (!isVNode(info.originNode)) throw new Error('Expected an SSR image VNode');
      return h('figure', { 'data-ssr-image-slot': '' }, [
        h('figcaption', info.alt),
        info.originNode,
      ]);
    });
    const html = await renderToString(
      h(Image, { src: 'server.png', alt: 'Server caption', preview: false }, { imageRender: slot }),
    );
    const host = document.createElement('div');
    host.innerHTML = html;
    expect(host.querySelector('[data-ssr-image-slot] figcaption')?.textContent).toBe(
      'Server caption',
    );
    expect(host.querySelector('[data-ssr-image-slot] img')?.getAttribute('src')).toBe('server.png');
    expect(latest(slot.mock.calls).src).toBe('server.png');
  });

  it('SSR respects an intentionally empty image slot', async () => {
    const slot = vi.fn((_info: ImageRenderInfo) => []);
    const html = await renderToString(
      h(Image, { src: 'server.png', preview: false }, { imageRender: slot }),
    );
    const host = document.createElement('div');
    host.innerHTML = html;
    expect(host.querySelector('.apollo-image')).not.toBeNull();
    expect(host.querySelector('img')).toBeNull();
    expect(slot).toHaveBeenCalledTimes(1);
  });

  it('default SSR image remains an unchanged passing control', async () => {
    const html = await renderToString(
      h(Image, { src: 'server.png', alt: 'Default server image', preview: false }),
    );
    const host = document.createElement('div');
    host.innerHTML = html;
    expect(host.querySelector('.apollo-image-img')?.getAttribute('src')).toBe('server.png');
    expect(host.querySelector('.apollo-image-img')?.getAttribute('alt')).toBe(
      'Default server image',
    );
  });

  it('Progress CSR and SSR returns do not eagerly evaluate imageRender', async () => {
    const slot = vi.fn((_info: ImageRenderInfo) => h('b', 'Unused image renderer'));
    const props = { placeholder: { progress: { percent: 45 } }, width: 160, height: 90 };
    const wrapper = mount(Image, { props, slots: { imageRender: slot } });
    expect(wrapper.attributes('role')).toBe('progressbar');
    expect(wrapper.attributes('aria-valuenow')).toBe('45');
    expect(wrapper.find('img').exists()).toBe(false);
    expect(slot).not.toHaveBeenCalled();
    const html = await renderToString(h(Image, props, { imageRender: slot }));
    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('Unused image renderer');
    expect(slot).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
