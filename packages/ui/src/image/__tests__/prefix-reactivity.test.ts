import { config, mount } from '@vue/test-utils';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, type Ref, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider, Image, ImagePreviewGroup, type ImageProps } from '../../index';

type ImageMode = 'normal' | 'progress' | 'placeholder';
// ConfigProvider now preserves its content through a native Teleport. Exercise
// that renderer for identity assertions; VTU's builtin stub rebuilds its slots.
const previousStubs = config.global.stubs;
beforeAll(() => {
  config.global.stubs = { teleport: false };
});
afterAll(() => {
  config.global.stubs = previousStubs;
});
const imageModes: Record<ImageMode, Pick<ImageProps, 'src' | 'placeholder'>> = {
  normal: { src: 'prefix.png', placeholder: 'Loading image' },
  progress: { placeholder: { progress: { percent: 40 } } },
  placeholder: { placeholder: 'Waiting for an image' },
};

function imageHost(
  prefix: Ref<string | undefined>,
  providerPrefix: Ref<string | undefined>,
  mode: ImageMode = 'normal',
  open = false,
) {
  return defineComponent(
    () => () =>
      h(
        ConfigProvider,
        { prefixCls: providerPrefix.value },
        {
          default: () =>
            h(Image, {
              ...imageModes[mode],
              prefixCls: prefix.value,
              alt: 'Prefix image',
              open,
              'data-prefix-image': '',
              preview:
                mode === 'normal'
                  ? { mask: false, cover: { placement: 'bottom', coverNode: 'Preview' } }
                  : false,
            }),
        },
      ),
  );
}

function groupHost(
  providerPrefix: Ref<string | undefined>,
  previewPrefix: Ref<string | undefined>,
  mask = true,
) {
  return defineComponent(
    () => () =>
      h(
        ConfigProvider,
        { prefixCls: providerPrefix.value },
        {
          default: () =>
            h(
              ImagePreviewGroup,
              {
                previewPrefixCls: previewPrefix.value,
                preview: { mask },
                'data-prefix-group': '',
              },
              {
                default: () => [
                  h(Image, { src: 'first.png', alt: 'First prefix image', 'data-group-first': '' }),
                  h(Image, {
                    src: 'second.png',
                    alt: 'Second prefix image',
                    'data-group-second': '',
                  }),
                ],
              },
            ),
        },
      ),
  );
}

async function flushRender() {
  await nextTick();
  await nextTick();
  await nextTick();
}

function htmlElement(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML element');
  return element;
}

function imageElement(container: ParentNode): HTMLImageElement {
  const image = container.querySelector('img');
  if (!(image instanceof HTMLImageElement)) throw new Error('Expected the real img');
  return image;
}

function dialogElement(): HTMLElement {
  const dialog = document.querySelector('[role="dialog"]');
  if (!(dialog instanceof HTMLElement)) throw new Error('Expected an open preview dialog');
  return dialog;
}

function assertImageNamespace(root: HTMLElement, prefix: string, mode: ImageMode) {
  expect.soft(root.classList.contains(prefix)).toBe(true);
  if (mode === 'normal') {
    expect.soft(imageElement(root).classList.contains(`${prefix}-img`)).toBe(true);
    expect.soft(root.querySelector(`.${prefix}-placeholder`)).not.toBeNull();
    expect.soft(root.querySelector(`.${prefix}-cover.${prefix}-cover-bottom`)).not.toBeNull();
  } else {
    expect.soft(root.classList.contains(`${prefix}-progress-wrapper`)).toBe(true);
    expect.soft(root.querySelector(`.${prefix}-progress-content`)).not.toBeNull();
    expect.soft(root.querySelector(`.${prefix}-progress-ink-1`)).not.toBeNull();
    if (mode === 'progress') {
      expect.soft(root.querySelector(`.${prefix}-progress-rail`)).not.toBeNull();
      expect(root.getAttribute('role')).toBe('progressbar');
      expect(root.getAttribute('aria-valuenow')).toBe('40');
    } else {
      expect(root.textContent).toContain('Waiting for an image');
    }
  }
}

function assertPreviewNamespace(dialog: HTMLElement, prefix: string) {
  expect.soft(dialog.classList.contains(prefix)).toBe(true);
  for (const suffix of ['mask', 'body', 'img', 'close', 'footer', 'actions']) {
    expect.soft(dialog.querySelector(`.${prefix}-${suffix}`)).not.toBeNull();
  }
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('Image current DOM prefix namespace (custom CSS remains preloaded by consumers)', () => {
  for (const mode of ['normal', 'progress', 'placeholder'] as const) {
    it(`${mode}: initial explicit prefix works in CSR and SSR as a passing control`, async () => {
      const Host = imageHost(ref('initial-image'), ref('provider'), mode);
      const wrapper = mount(Host);
      const root = htmlElement(wrapper.get('[data-prefix-image]').element);
      assertImageNamespace(root, 'initial-image', mode);
      const container = document.createElement('div');
      container.innerHTML = await renderToString(h(Host));
      const serverRoot = container.querySelector('[data-prefix-image]');
      if (!(serverRoot instanceof HTMLElement)) throw new Error('Expected the server Image root');
      assertImageNamespace(serverRoot, 'initial-image', mode);
      wrapper.unmount();
    });
  }

  it('Image prefix prop replacement/removal updates an already-open preview without resetting its nodes or transform', async () => {
    const prefix = ref<string | undefined>('first-image');
    const wrapper = mount(imageHost(prefix, ref('provider'), 'normal', true), {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await flushRender();
    const root = htmlElement(wrapper.get('[data-prefix-image]').element);
    const image = imageElement(root);
    const dialog = dialogElement();
    const previewImage = imageElement(dialog);
    const rotate = dialog.querySelector('[aria-label="rotateRight"]');
    if (!(rotate instanceof HTMLButtonElement)) throw new Error('Expected a rotate control');
    rotate.click();
    await flushRender();
    expect(previewImage.style.transform).toContain('rotate(90deg)');
    dialog.focus();
    for (const current of ['second-image', undefined]) {
      prefix.value = current;
      await flushRender();
      const expected = current ?? 'provider-image';
      assertImageNamespace(root, expected, 'normal');
      assertPreviewNamespace(dialog, `${expected}-preview`);
      expect(dialogElement()).toBe(dialog);
      expect(imageElement(root)).toBe(image);
      expect(imageElement(dialog)).toBe(previewImage);
      expect(previewImage.style.transform).toContain('rotate(90deg)');
      expect(document.activeElement).toBe(dialog);
      expect(wrapper.findComponent({ name: 'CSSMotion' }).props('motionName')).toBe(
        `${expected}-preview-fade`,
      );
      expect.soft(root.classList.contains('first-image')).toBe(false);
    }
    wrapper.unmount();
  });

  it('Image follows current provider prefix and falls back to the default when the provider prefix is removed', async () => {
    const providerPrefix = ref<string | undefined>('first');
    const wrapper = mount(imageHost(ref(undefined), providerPrefix));
    const root = htmlElement(wrapper.get('[data-prefix-image]').element);
    const image = imageElement(root);
    assertImageNamespace(root, 'first-image', 'normal');
    for (const current of ['second', undefined, 'first']) {
      providerPrefix.value = current;
      await flushRender();
      assertImageNamespace(root, `${current ?? 'apollo'}-image`, 'normal');
      expect(htmlElement(wrapper.get('[data-prefix-image]').element)).toBe(root);
      expect(imageElement(root)).toBe(image);
    }
    wrapper.unmount();
  });

  it('an explicit Image prefix wins while the provider changes, and removal reveals the current provider', async () => {
    const prefix = ref<string | undefined>('explicit-image');
    const providerPrefix = ref<string | undefined>('first');
    const wrapper = mount(imageHost(prefix, providerPrefix));
    const root = htmlElement(wrapper.get('[data-prefix-image]').element);
    providerPrefix.value = 'second';
    await flushRender();
    assertImageNamespace(root, 'explicit-image', 'normal');
    prefix.value = undefined;
    await flushRender();
    assertImageNamespace(root, 'second-image', 'normal');
    expect.soft(root.classList.contains('explicit-image')).toBe(false);
    wrapper.unmount();
  });

  for (const mode of ['progress', 'placeholder'] as const) {
    for (const source of ['prop', 'provider'] as const) {
      it(`${mode}: current ${source} prefix reaches the existing Progress root and children`, async () => {
        const prefix = ref<string | undefined>(source === 'prop' ? 'first-image' : undefined);
        const providerPrefix = ref<string | undefined>('first');
        const wrapper = mount(imageHost(prefix, providerPrefix, mode));
        const root = htmlElement(wrapper.get('[data-prefix-image]').element);
        assertImageNamespace(root, 'first-image', mode);
        if (source === 'prop') prefix.value = 'second-image';
        else providerPrefix.value = 'second';
        await flushRender();
        assertImageNamespace(root, 'second-image', mode);
        expect(htmlElement(wrapper.get('[data-prefix-image]').element)).toBe(root);
        expect.soft(root.classList.contains('first-image')).toBe(false);
        expect.soft(root.classList.contains('first-image-progress-wrapper')).toBe(false);
        wrapper.unmount();
      });
    }
  }

  it('PreviewGroup initial explicit preview prefix works while root/children follow the provider (CSR/SSR control)', async () => {
    const Host = groupHost(ref('initial'), ref('custom-preview'));
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const group = htmlElement(wrapper.get('[data-prefix-group]').element);
    expect(group.classList.contains('initial-image-preview-group')).toBe(true);
    await wrapper.get('[data-group-first]').trigger('click');
    await flushRender();
    assertPreviewNamespace(dialogElement(), 'custom-preview');
    const container = document.createElement('div');
    container.innerHTML = await renderToString(h(Host));
    expect(container.querySelector('.initial-image-preview-group')).not.toBeNull();
    expect(container.querySelectorAll('img.initial-image-img')).toHaveLength(2);
    wrapper.unmount();
  });

  it('PreviewGroup provider replacement updates its root, registered children and open default preview', async () => {
    const providerPrefix = ref<string | undefined>('first');
    const wrapper = mount(groupHost(providerPrefix, ref(undefined)), {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    const group = htmlElement(wrapper.get('[data-prefix-group]').element);
    const first = htmlElement(wrapper.get('[data-group-first]').element);
    const firstImage = imageElement(first);
    await wrapper.get('[data-group-first]').trigger('click');
    await flushRender();
    const dialog = dialogElement();
    const previewImage = imageElement(dialog);
    providerPrefix.value = 'second';
    await flushRender();
    expect.soft(group.classList.contains('second-image-preview-group')).toBe(true);
    expect.soft(group.classList.contains('first-image-preview-group')).toBe(false);
    expect.soft(first.classList.contains('second-image')).toBe(true);
    expect.soft(firstImage.classList.contains('second-image-img')).toBe(true);
    assertPreviewNamespace(dialog, 'second-image-preview');
    expect(dialogElement()).toBe(dialog);
    expect(imageElement(dialog)).toBe(previewImage);
    expect(imageElement(first)).toBe(firstImage);
    expect(wrapper.findComponent({ name: 'CSSMotion' }).props('motionName')).toBe(
      'second-image-preview-fade',
    );
    expect(dialog.textContent).toContain('1 / 2');
    wrapper.unmount();
  });

  it('PreviewGroup previewPrefixCls replacement/removal updates the open dialog while keeping provider/root precedence', async () => {
    const providerPrefix = ref<string | undefined>('first');
    const previewPrefix = ref<string | undefined>('custom-first');
    const wrapper = mount(groupHost(providerPrefix, previewPrefix), {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await wrapper.get('[data-group-first]').trigger('click');
    await flushRender();
    const group = htmlElement(wrapper.get('[data-prefix-group]').element);
    const dialog = dialogElement();
    const previewImage = imageElement(dialog);
    previewPrefix.value = 'custom-second';
    await flushRender();
    assertPreviewNamespace(dialog, 'custom-second');
    providerPrefix.value = 'second';
    await flushRender();
    assertPreviewNamespace(dialog, 'custom-second');
    expect.soft(group.classList.contains('second-image-preview-group')).toBe(true);
    previewPrefix.value = undefined;
    await flushRender();
    assertPreviewNamespace(dialog, 'second-image-preview');
    expect.soft(dialog.classList.contains('custom-first')).toBe(false);
    expect.soft(dialog.classList.contains('custom-second')).toBe(false);
    expect(dialogElement()).toBe(dialog);
    expect(imageElement(dialog)).toBe(previewImage);
    expect(wrapper.findComponent({ name: 'CSSMotion' }).props('motionName')).toBe(
      'second-image-preview-fade',
    );
    wrapper.unmount();
  });

  it('PreviewGroup mask=false uses the actual custom preview namespace rather than the provider default', async () => {
    const wrapper = mount(groupHost(ref('provider'), ref('custom-preview'), false), {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await wrapper.get('[data-group-first]').trigger('click');
    await flushRender();
    const mask = dialogElement().querySelector('.custom-preview-mask');
    if (!(mask instanceof HTMLElement)) throw new Error('Expected the custom preview mask');
    expect(mask.classList.contains('custom-preview-mask-hidden')).toBe(true);
    expect(mask.classList.contains('provider-image-preview-mask-hidden')).toBe(false);
    wrapper.unmount();
  });
});
