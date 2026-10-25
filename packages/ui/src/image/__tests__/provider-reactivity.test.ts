import { config, mount } from '@vue/test-utils';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, type Ref, reactive, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  ConfigProvider,
  type ConfigProviderProps,
  Image,
  type ImageRenderInfo,
  type ImageSemanticType,
} from '../../index';

type Components = NonNullable<ConfigProviderProps['components']>;
// Preserve all original live-node assertions against the actual renderer.
const previousStubs = config.global.stubs;
beforeAll(() => {
  config.global.stubs = { teleport: false };
});
afterAll(() => {
  config.global.stubs = previousStubs;
});
type Field = 'classNames' | 'styles';
type Revision = 'first' | 'current';

function configAt(field: Field, revision: Revision): ImageSemanticType {
  if (field === 'classNames') {
    return {
      classNames: {
        root: `provider-${revision}-root`,
        image: `provider-${revision}-image`,
      },
    };
  }
  return {
    styles: {
      root: { paddingTop: revision === 'first' ? '5px' : '13px', maxWidth: '210px' },
      image: { opacity: revision === 'first' ? 0.4 : 0.7, objectFit: 'cover' },
    },
  };
}

const localClassNames = { root: 'local-root', image: 'local-image' };
const localStyles = {
  root: { maxWidth: '260px', minHeight: '31px' },
  image: { objectFit: 'contain' },
};
const nativeStyle = { maxWidth: '340px', paddingLeft: '9px' };

function richImage(info: ImageRenderInfo) {
  return h('figure', null, [info.originNode, h('input', { 'aria-label': 'Provider image draft' })]);
}

function hostFor(components: Ref<Components>, rich = false) {
  return defineComponent(
    () => () =>
      h(
        ConfigProvider,
        { components: components.value },
        {
          default: () =>
            h(
              Image,
              {
                src: 'provider.png',
                alt: 'Provider image',
                preview: false,
                class: 'native-root',
                style: nativeStyle,
                classNames: localClassNames,
                styles: localStyles,
              },
              rich ? { imageRender: richImage } : {},
            ),
        },
      ),
  );
}

function nodesIn(container: ParentNode) {
  const root = container.querySelector('.apollo-image');
  const image = container.querySelector('.apollo-image-img');
  if (!(root instanceof HTMLElement) || !(image instanceof HTMLImageElement)) {
    throw new Error('Expected the public Image root and original img');
  }
  return { root, image };
}

function assertSameNodes(container: ParentNode, before: ReturnType<typeof nodesIn>) {
  const after = nodesIn(container);
  expect(after.root).toBe(before.root);
  expect(after.image).toBe(before.image);
}

function assertLocal(nodes: ReturnType<typeof nodesIn>) {
  expect(nodes.root.classList.contains('native-root')).toBe(true);
  expect(nodes.root.classList.contains('local-root')).toBe(true);
  expect(nodes.image.classList.contains('local-image')).toBe(true);
  expect(nodes.root.style.maxWidth).toBe('340px');
  expect(nodes.root.style.paddingLeft).toBe('9px');
  expect(nodes.root.style.minHeight).toBe('31px');
  expect(nodes.image.style.objectFit).toBe('contain');
}

function assertCurrent(nodes: ReturnType<typeof nodesIn>, field: Field, revision?: Revision) {
  if (field === 'classNames') {
    for (const value of ['first', 'current']) {
      expect.soft(nodes.root.classList.contains(`provider-${value}-root`)).toBe(value === revision);
      expect
        .soft(nodes.image.classList.contains(`provider-${value}-image`))
        .toBe(value === revision);
    }
  } else {
    expect
      .soft(nodes.root.style.paddingTop)
      .toBe(revision === 'first' ? '5px' : revision === 'current' ? '13px' : '');
    expect
      .soft(nodes.image.style.opacity)
      .toBe(revision === 'first' ? '0.4' : revision === 'current' ? '0.7' : '');
  }
  assertLocal(nodes);
}

async function flushRender() {
  await nextTick();
  await nextTick();
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('F11 Image current ConfigProvider semantics', () => {
  for (const field of ['classNames', 'styles'] as const) {
    it(`${field}: replacing the semantic object on the same image config refreshes root and img`, async () => {
      const imageConfig = reactive({ ...configAt(field, 'first') });
      const components = ref<Components>({ image: imageConfig });
      const wrapper = mount(hostFor(components));
      const before = nodesIn(wrapper.element);
      assertCurrent(before, field, 'first');
      const replacement = configAt(field, 'current');
      if (field === 'classNames') imageConfig.classNames = replacement.classNames;
      else imageConfig.styles = replacement.styles;
      await flushRender();
      assertSameNodes(wrapper.element, before);
      assertCurrent(before, field, 'current');
      wrapper.unmount();
    });

    it(`${field}: replacing the whole image config refreshes its current semantics`, async () => {
      const components = ref<Components>({ image: { ...configAt(field, 'first') } });
      const wrapper = mount(hostFor(components));
      const before = nodesIn(wrapper.element);
      assertCurrent(before, field, 'first');
      components.value.image = { ...configAt(field, 'current') };
      await flushRender();
      assertSameNodes(wrapper.element, before);
      assertCurrent(before, field, 'current');
      wrapper.unmount();
    });

    it(`${field}: replacing the whole components map keeps native overrides and live rich content`, async () => {
      const components = ref<Components>({ image: { ...configAt(field, 'first') } });
      const wrapper = mount(hostFor(components, true), { attachTo: document.body });
      const before = nodesIn(wrapper.element);
      const input = wrapper.get('input').element;
      if (!(input instanceof HTMLInputElement)) throw new Error('Expected a live rich input');
      input.value = 'Kept provider draft';
      input.focus();
      assertCurrent(before, field, 'first');
      components.value = { image: { ...configAt(field, 'current') }, button: { size: 'small' } };
      await flushRender();
      assertSameNodes(wrapper.element, before);
      expect(wrapper.get('input').element).toBe(input);
      expect(input.value).toBe('Kept provider draft');
      expect(document.activeElement).toBe(input);
      assertCurrent(before, field, 'current');
      wrapper.unmount();
    });

    it(`${field}: a provider image config added after mount is consumed`, async () => {
      const components = ref<Components>({});
      const wrapper = mount(hostFor(components));
      const before = nodesIn(wrapper.element);
      assertCurrent(before, field);
      components.value.image = { ...configAt(field, 'current') };
      await flushRender();
      assertSameNodes(wrapper.element, before);
      assertCurrent(before, field, 'current');
      wrapper.unmount();
    });

    it(`${field}: removing the semantic field clears provider values and restores local attrs`, async () => {
      const imageConfig = reactive({ ...configAt(field, 'first') });
      const components = ref<Components>({ image: imageConfig });
      const wrapper = mount(hostFor(components));
      const before = nodesIn(wrapper.element);
      assertCurrent(before, field, 'first');
      if (field === 'classNames') delete imageConfig.classNames;
      else delete imageConfig.styles;
      await flushRender();
      assertSameNodes(wrapper.element, before);
      assertCurrent(before, field);
      wrapper.unmount();
    });

    it(`${field}: removing the whole image config clears provider values`, async () => {
      const components = ref<Components>({ image: { ...configAt(field, 'first') } });
      const wrapper = mount(hostFor(components));
      const before = nodesIn(wrapper.element);
      assertCurrent(before, field, 'first');
      delete components.value.image;
      await flushRender();
      assertSameNodes(wrapper.element, before);
      assertCurrent(before, field);
      wrapper.unmount();
    });
  }

  it('initial CSR provider semantics and precedence remain a passing control', () => {
    const components = ref<Components>({
      image: { ...configAt('classNames', 'first'), ...configAt('styles', 'first') },
    });
    const wrapper = mount(hostFor(components));
    const nodes = nodesIn(wrapper.element);
    assertCurrent(nodes, 'classNames', 'first');
    assertCurrent(nodes, 'styles', 'first');
    wrapper.unmount();
  });

  it('initial SSR provider semantics and precedence remain a passing control', async () => {
    const components = ref<Components>({
      image: { ...configAt('classNames', 'first'), ...configAt('styles', 'first') },
    });
    const html = await renderToString(h(hostFor(components)));
    const container = document.createElement('div');
    container.innerHTML = html;
    const nodes = nodesIn(container);
    assertCurrent(nodes, 'classNames', 'first');
    assertCurrent(nodes, 'styles', 'first');
  });

  it('deep mutations on the same provider objects remain a passing control', async () => {
    const classNames = reactive({ root: 'provider-first-root', image: 'provider-first-image' });
    const rootStyle = reactive({ paddingTop: '5px', maxWidth: '210px' });
    const imageStyle = reactive({ opacity: 0.4, objectFit: 'cover' });
    const components = ref<Components>({
      image: { classNames, styles: { root: rootStyle, image: imageStyle } },
    });
    const wrapper = mount(hostFor(components));
    const nodes = nodesIn(wrapper.element);
    assertCurrent(nodes, 'classNames', 'first');
    assertCurrent(nodes, 'styles', 'first');
    classNames.root = 'provider-current-root';
    classNames.image = 'provider-current-image';
    rootStyle.paddingTop = '13px';
    imageStyle.opacity = 0.7;
    await flushRender();
    assertCurrent(nodes, 'classNames', 'current');
    assertCurrent(nodes, 'styles', 'current');
    assertSameNodes(wrapper.element, nodes);
    wrapper.unmount();
  });
});
