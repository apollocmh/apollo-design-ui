import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, type Ref, ref } from 'vue';
import {
  ConfigProvider,
  type ConfigProviderProps,
  Image,
  ImagePreviewGroup,
  type ImageSemanticType,
  type PreviewImageInfo,
} from '../../index';

vi.unmock('@apollo-design/motion');

type Target = 'Image' | 'PreviewGroup';
type Field = 'classNames' | 'styles';
type Components = NonNullable<ConfigProviderProps['components']>;
const targets: Target[] = ['Image', 'PreviewGroup'];
const fields: Field[] = ['classNames', 'styles'];
const parts = ['root', 'mask', 'body', 'footer', 'actions', 'close'] as const;
type Part = (typeof parts)[number];
const options = { attachTo: document.body, global: { stubs: { teleport: false } } };
const styleAt = (part: Part, revision: string) => ({ [`--provider-popup-${part}`]: revision });
function configAt(field: Field, revision: string): ImageSemanticType {
  if (field === 'classNames')
    return {
      classNames: {
        popup: {
          root: `provider-${revision}-root`,
          mask: `provider-${revision}-mask`,
          body: `provider-${revision}-body`,
          footer: `provider-${revision}-footer`,
          actions: `provider-${revision}-actions`,
          close: `provider-${revision}-close`,
        },
      },
    };
  return {
    styles: {
      popup: {
        root: styleAt('root', revision),
        mask: styleAt('mask', revision),
        body: styleAt('body', revision),
        footer: styleAt('footer', revision),
        actions: styleAt('actions', revision),
        close: styleAt('close', revision),
      },
    },
  };
}
async function settle() {
  await nextTick();
  await nextTick();
}
function element(selector: string): HTMLElement {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`Missing actual element ${selector}`);
  return node;
}
function popupNode(part: Part) {
  return element(part === 'root' ? '[role="dialog"]' : `.apollo-image-preview-${part}`);
}
function assertCurrent(field: Field, revision?: string, localRoot = false) {
  for (const part of parts) {
    const node = popupNode(part);
    if (field === 'classNames') {
      for (const name of ['first', 'current'])
        expect.soft(node.classList.contains(`provider-${name}-${part}`)).toBe(revision === name);
    } else {
      expect
        .soft(node.style.getPropertyValue(`--provider-popup-${part}`))
        .toBe(part === 'root' && localRoot ? '' : (revision ?? ''));
    }
  }
}
const renderImage = (info: PreviewImageInfo) =>
  h('figure', [info.originNode, h('input', { 'aria-label': 'Provider preview note' })]);
async function mounted(target: Target, components: Ref<Components>, local = false) {
  const localClasses: ImageSemanticType['classNames'] = local
    ? { popup: { root: 'local-popup-root', body: 'local-popup-body' } }
    : undefined;
  const localStyles: ImageSemanticType['styles'] = local
    ? { popup: { root: { '--local-popup-root': 'kept' } } }
    : undefined;
  const attrs = {
    class: 'native-provider-root',
    style: { paddingLeft: '9px' },
    'data-popup-provider-root': '',
    classNames: localClasses,
    styles: localStyles,
  };
  const Host = defineComponent({
    setup: () => () =>
      h(
        ConfigProvider,
        { components: components.value },
        {
          default: () =>
            target === 'Image'
              ? h(
                  Image,
                  { src: 'first.png', alt: 'Provider preview first', ...attrs },
                  { previewImage: renderImage },
                )
              : h(ImagePreviewGroup, attrs, {
                  default: () => [
                    h(Image, { src: 'first.png', alt: 'Provider preview first' }),
                    h(Image, { src: 'second.png', alt: 'Provider preview second' }),
                  ],
                  previewImage: renderImage,
                }),
        },
      ),
  });
  const wrapper = mount(Host, options);
  await settle();
  await wrapper.get('.apollo-image').trigger('click');
  await settle();
  return wrapper;
}
function assertStable(before: {
  dialog: HTMLElement;
  image: HTMLElement;
  input: HTMLInputElement;
}) {
  expect(popupNode('root')).toBe(before.dialog);
  expect(element('.apollo-image-preview-img')).toBe(before.image);
  expect(element('input[aria-label="Provider preview note"]')).toBe(before.input);
  expect(before.input.value).toBe('Provider draft');
  expect(document.activeElement).toBe(before.input);
  expect(element('.apollo-image-preview-img').style.transform).toContain('rotate(90deg)');
  expect(before.dialog.classList.contains('native-provider-root')).toBe(false);
  expect(before.dialog.style.paddingLeft).toBe('');
}
function preserveState() {
  element('button[aria-label="rotateRight"]').click();
  const input = element('input[aria-label="Provider preview note"]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Missing real preview editor');
  input.value = 'Provider draft';
  input.focus();
  return { dialog: popupNode('root'), image: element('.apollo-image-preview-img'), input };
}

describe('Image/Group current provider popup semantics', () => {
  for (const target of targets) {
    for (const field of fields) {
      it(`${target} ${field}: initial provider values reach all six popup nodes`, async () => {
        await mounted(target, ref<Components>({ image: { ...configAt(field, 'first') } }));
        assertCurrent(field, 'first');
      });

      it(`${target} ${field}: late addition, field replacement and field removal remain live`, async () => {
        const imageConfig = ref({ ...configAt(field, 'first') });
        delete imageConfig.value[field];
        const components = ref<Components>({ image: imageConfig.value });
        await mounted(target, components);
        assertCurrent(field);
        const before = preserveState();
        await settle();
        if (field === 'classNames')
          imageConfig.value.classNames = configAt(field, 'first').classNames;
        else imageConfig.value.styles = configAt(field, 'first').styles;
        await settle();
        assertCurrent(field, 'first');
        assertStable(before);
        if (field === 'classNames')
          imageConfig.value.classNames = configAt(field, 'current').classNames;
        else imageConfig.value.styles = configAt(field, 'current').styles;
        await settle();
        assertCurrent(field, 'current');
        assertStable(before);
        if (field === 'classNames') delete imageConfig.value.classNames;
        else delete imageConfig.value.styles;
        await settle();
        assertCurrent(field);
        assertStable(before);
      });

      it(`${target} ${field}: whole map replacement and image removal preserve live preview state`, async () => {
        const components = ref<Components>({ image: { ...configAt(field, 'first') } });
        await mounted(target, components);
        const before = preserveState();
        await settle();
        components.value = { image: { ...configAt(field, 'current') } };
        await settle();
        assertCurrent(field, 'current');
        assertStable(before);
        delete components.value.image;
        await settle();
        assertCurrent(field);
        assertStable(before);
      });

      it(`${target} ${field}: mutations inside the existing popup object are current`, async () => {
        const imageConfig = ref({ ...configAt(field, 'first') });
        const components = ref<Components>({ image: imageConfig.value });
        await mounted(target, components);
        if (field === 'classNames' && imageConfig.value.classNames?.popup) {
          imageConfig.value.classNames.popup.mask = 'provider-current-mask';
        } else if (field === 'styles' && imageConfig.value.styles?.popup?.mask) {
          imageConfig.value.styles.popup.mask['--provider-popup-mask'] = 'current';
        }
        await settle();
        if (field === 'classNames')
          expect(popupNode('mask').classList.contains('provider-current-mask')).toBe(true);
        else
          expect(popupNode('mask').style.getPropertyValue('--provider-popup-mask')).toBe('current');
      });
    }

    it(`${target}: local popup style fields override provider fields while other fields and classes remain`, async () => {
      const classes = configAt('classNames', 'first');
      const styles = configAt('styles', 'first');
      const components = ref<Components>({ image: { ...classes, ...styles } });
      const wrapper = await mounted(target, components, true);
      assertCurrent('classNames', 'first');
      assertCurrent('styles', 'first', true);
      expect(popupNode('root').classList.contains('local-popup-root')).toBe(true);
      expect(popupNode('body').classList.contains('local-popup-body')).toBe(true);
      expect(popupNode('root').style.getPropertyValue('--local-popup-root')).toBe('kept');
      const native = wrapper.get('[data-popup-provider-root]');
      expect(native.classes()).toContain('native-provider-root');
      expect(native.attributes('style')).toContain('padding-left: 9px');
    });
  }
});
