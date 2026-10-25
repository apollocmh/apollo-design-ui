import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import {
  defineComponent,
  h,
  nextTick,
  ref,
  type StyleValue,
  shallowReactive,
  shallowRef,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Image } from '../index';
import type { ImageRenderInfo } from '../interface';

afterEach(() => document.body.replaceChildren());
const src =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';

it('native string style reaches the public Image root without numeric CSS keys', () => {
  const wrapper = mount(Image, {
    props: { src, preview: false },
    attrs: { style: 'color:rgb(10,20,30);padding-top:20px;--native-root:current' },
  });
  const root = wrapper.element;
  if (!(root instanceof HTMLElement)) throw new Error('Expected Image root');
  expect(root.style.color).toBe('rgb(10, 20, 30)');
  expect(root.style.paddingTop).toBe('20px');
  expect(root.style.getPropertyValue('--native-root')).toBe('current');
  expect(root.getAttribute('style')).not.toMatch(/(?:^|;)\s*\d+\s*:/);
  wrapper.unmount();
});

it('native root style does not override the independent img semantic style', () => {
  const wrapper = mount(Image, {
    props: { src, preview: false, styles: { image: { paddingTop: '6px' } } },
    attrs: { style: { paddingTop: '20px' } },
  });
  const root = wrapper.element;
  const image = wrapper.get('img').element;
  if (!(root instanceof HTMLElement) || !(image instanceof HTMLImageElement))
    throw new Error('Expected Image nodes');
  expect(root.style.paddingTop).toBe('20px');
  expect(image.style.paddingTop).toBe('6px');
  wrapper.unmount();
});

it('Progress keeps native root attrs/styles while retaining controlled progress ARIA', () => {
  const wrapper = mount(Image, {
    props: {
      width: 120,
      height: 80,
      placeholder: { progress: { percent: 50 } },
      classNames: {
        root: 'semantic-image-root',
        placeholder: { progress: { root: 'semantic-progress-root' } },
      },
      styles: {
        root: { paddingTop: '6px' },
        placeholder: { progress: { root: { paddingTop: '8px' } } },
      },
    },
    attrs: {
      class: 'native-progress-root',
      id: 'native-progress',
      'aria-label': 'Custom progress',
      'aria-describedby': 'progress-help',
      'data-state': 'current',
      style: { paddingTop: '20px' },
      role: 'button',
      'aria-valuemin': 9,
      'aria-valuemax': 9,
      'aria-valuenow': 9,
      'aria-busy': true,
    },
  });
  const root = wrapper.element;
  if (!(root instanceof HTMLElement)) throw new Error('Expected Progress root');
  expect({
    nativeClass: root.classList.contains('native-progress-root'),
    semanticImage: root.classList.contains('semantic-image-root'),
    semanticProgress: root.classList.contains('semantic-progress-root'),
    id: root.id,
    label: root.getAttribute('aria-label'),
    description: root.getAttribute('aria-describedby'),
    data: root.getAttribute('data-state'),
    padding: root.style.paddingTop,
  }).toEqual({
    nativeClass: true,
    semanticImage: true,
    semanticProgress: true,
    id: 'native-progress',
    label: 'Custom progress',
    description: 'progress-help',
    data: 'current',
    padding: '20px',
  });
  expect(root.getAttribute('role')).toBe('progressbar');
  expect(root.getAttribute('aria-valuemin')).toBe('0');
  expect(root.getAttribute('aria-valuemax')).toBe('100');
  expect(root.getAttribute('aria-valuenow')).toBe('50');
  expect(root.hasAttribute('aria-busy')).toBe(false);
  wrapper.unmount();
});

const stringStyle = 'padding-top:20px;padding-bottom:21px;--native-root:current';
const mixedStyle: StyleValue = [
  'padding-top:20px;--native-root:current',
  { paddingBottom: '21px' },
];
const objectStyle: StyleValue = {
  paddingTop: '20px',
  paddingBottom: '21px',
  '--native-root': 'current',
};
const styleForms: { name: string; value: StyleValue }[] = [
  { name: 'string', value: stringStyle },
  { name: 'mixed array', value: mixedStyle },
  { name: 'object', value: objectStyle },
];
const semanticStyles = {
  root: { paddingTop: '3px', paddingBottom: '4px', '--semantic-root': 'kept' },
  image: { paddingTop: '6px', paddingBottom: '7px', '--semantic-image': 'kept' },
};

for (const form of styleForms) {
  it(`SSR ${form.name}: native root and img semantic styles remain independent`, async () => {
    const html = await renderToString(
      h(Image, { src, preview: false, style: form.value, styles: semanticStyles }),
    );
    const host = document.createElement('div');
    host.innerHTML = html;
    const root = host.firstElementChild;
    const image = host.querySelector('img');
    if (!(root instanceof HTMLElement) || !(image instanceof HTMLImageElement))
      throw new Error('Expected SSR Image nodes');
    expect(root.style.paddingTop).toBe('20px');
    expect(root.style.paddingBottom).toBe('21px');
    expect(root.style.getPropertyValue('--native-root')).toBe('current');
    expect(root.style.getPropertyValue('--semantic-root')).toBe('kept');
    expect(image.style.paddingTop).toBe('6px');
    expect(image.style.paddingBottom).toBe('7px');
    expect(image.style.getPropertyValue('--native-root')).toBe('');
    expect(image.style.getPropertyValue('--semantic-image')).toBe('kept');
    expect(html).not.toMatch(/(?:style="|;)\s*\d+\s*:/);
  });
}

it('mixed-array normalization and removal already work for native root updates', async () => {
  const wrapper = mount(Image, {
    props: { src, preview: false, styles: semanticStyles },
    attrs: { style: ['color:rgb(10,20,30)', { paddingTop: '9px' }] },
  });
  const root = wrapper.element;
  if (!(root instanceof HTMLElement)) throw new Error('Expected root');
  expect(root.style.color).toBe('rgb(10, 20, 30)');
  expect(root.style.paddingTop).toBe('9px');
  await wrapper.setProps({ style: undefined });
  expect(root.style.color).toBe('');
  expect(root.style.paddingTop).toBe('3px');
  wrapper.unmount();
});

it('attrs-only style/class updates preserve root, origin img, focused input and draft', async () => {
  const style = shallowRef<StyleValue>(objectStyle);
  const className = ref<string | undefined>('native-first');
  const renderImage = (info: ImageRenderInfo) =>
    h('figure', { 'data-rich-image': '' }, [
      info.originNode,
      h('input', { key: 'draft', 'aria-label': 'Native image style draft' }),
    ]);
  const slots = { imageRender: renderImage };
  const classNames = { root: 'semantic-root' };
  const Host = defineComponent(
    () => () =>
      h(
        Image,
        {
          src,
          preview: false,
          styles: semanticStyles,
          classNames,
          style: style.value,
          class: className.value,
        },
        slots,
      ),
  );
  const wrapper = mount(Host, { attachTo: document.body });
  const root = wrapper.get('.apollo-image').element;
  const image = wrapper.get('img').element;
  const input = wrapper.get('input').element;
  if (
    !(root instanceof HTMLElement) ||
    !(image instanceof HTMLImageElement) ||
    !(input instanceof HTMLInputElement)
  )
    throw new Error('Expected rich Image nodes');
  input.value = 'kept image draft';
  input.focus();
  for (const [index, next] of [mixedStyle, stringStyle, undefined].entries()) {
    style.value = next;
    className.value = index === 2 ? undefined : 'native-current';
    await nextTick();
    await nextTick();
    expect(wrapper.get('.apollo-image').element).toBe(root);
    expect(wrapper.get('img').element).toBe(image);
    expect(wrapper.get('input').element).toBe(input);
    expect(input.value).toBe('kept image draft');
    expect(document.activeElement).toBe(input);
    expect(root.classList.contains('semantic-root')).toBe(true);
    expect(root.classList.contains('native-first')).toBe(false);
    expect(root.classList.contains('native-current')).toBe(index !== 2);
    expect(root.style.paddingTop).toBe(index === 2 ? '3px' : '20px');
    expect(root.style.getPropertyValue('--native-root')).toBe(index === 2 ? '' : 'current');
    expect(input.style.paddingTop).toBe('');
    expect(image.style.paddingTop).toBe('6px');
    expect(root.getAttribute('style')).not.toMatch(/(?:^|;)\s*\d+\s*:/);
  }
  wrapper.unmount();
});

for (const mode of ['percent', 'VNode']) {
  it(`SSR ${mode} placeholder retains native root bindings and progress semantics`, async () => {
    const html = await renderToString(
      h(Image, {
        placeholder: mode === 'percent' ? { progress: { percent: 50 } } : h('b', 'Waiting'),
        width: 120,
        height: 80,
        classNames: {
          root: 'semantic-image-root',
          placeholder: { progress: { root: 'semantic-progress-root' } },
        },
        styles: {
          root: { paddingTop: '6px', '--image-root': 'kept' },
          placeholder: { progress: { root: { paddingTop: '8px', '--progress-root': 'kept' } } },
        },
        class: 'native-placeholder',
        id: 'placeholder-root',
        'aria-describedby': 'placeholder-help',
        'data-state': 'current',
        style: 'padding-top:20px;--native-root:current',
        role: 'button',
        'aria-valuemin': 9,
        'aria-valuemax': 9,
        'aria-valuenow': 9,
        'aria-busy': false,
      }),
    );
    const host = document.createElement('div');
    host.innerHTML = html;
    const root = host.firstElementChild;
    if (!(root instanceof HTMLElement)) throw new Error('Expected SSR placeholder');
    expect(root.classList.contains('native-placeholder')).toBe(true);
    expect(root.classList.contains('semantic-image-root')).toBe(true);
    expect(root.classList.contains('semantic-progress-root')).toBe(true);
    expect(root.id).toBe('placeholder-root');
    expect(root.getAttribute('aria-describedby')).toBe('placeholder-help');
    expect(root.dataset.state).toBe('current');
    expect(root.style.paddingTop).toBe('20px');
    expect(root.style.getPropertyValue('--native-root')).toBe('current');
    expect(root.style.getPropertyValue('--image-root')).toBe('kept');
    expect(root.style.getPropertyValue('--progress-root')).toBe('kept');
    expect(root.getAttribute('role')).toBe(mode === 'percent' ? 'progressbar' : null);
    expect(root.getAttribute('aria-valuenow')).toBe(mode === 'percent' ? '50' : null);
    expect(root.getAttribute('aria-valuemin')).toBe(mode === 'percent' ? '0' : null);
    expect(root.getAttribute('aria-valuemax')).toBe(mode === 'percent' ? '100' : null);
    expect(root.getAttribute('aria-busy')).toBe(mode === 'percent' ? null : 'true');
  });
}

it('Progress current attrs-only style/name updates restore nested semantic style and default name on removal', async () => {
  const nativeAttrs = shallowReactive<{
    style: StyleValue;
    class: string | undefined;
    'aria-label': string | undefined;
    'aria-labelledby': string | undefined;
    id: string;
  }>({
    class: 'native-progress',
    style: 'padding-top:20px;--native-root:first',
    'aria-label': 'First progress',
    'aria-labelledby': 'first-label',
    id: 'first-id',
  });
  const placeholder = { progress: { percent: 50 } };
  const styles = {
    root: { paddingTop: '6px' },
    placeholder: { progress: { root: { paddingTop: '8px' } } },
  };
  const Host = defineComponent(
    () => () =>
      h(Image, {
        placeholder,
        styles,
        ...nativeAttrs,
      }),
  );
  const wrapper = mount(Host);
  const root = wrapper.element;
  if (!(root instanceof HTMLElement)) throw new Error('Expected progress');
  expect(root.getAttribute('aria-label')).toBe('First progress');
  expect(root.style.paddingTop).toBe('20px');
  nativeAttrs.style = ['padding-top:22px', { '--native-root': 'current' }];
  nativeAttrs['aria-label'] = 'Current progress';
  nativeAttrs['aria-labelledby'] = 'current-label';
  nativeAttrs.id = 'current-id';
  await nextTick();
  await nextTick();
  expect(wrapper.element).toBe(root);
  expect(root.style.paddingTop).toBe('22px');
  expect(root.style.getPropertyValue('--native-root')).toBe('current');
  expect(root.getAttribute('aria-label')).toBe('Current progress');
  expect(root.getAttribute('aria-labelledby')).toBe('current-label');
  expect(root.id).toBe('current-id');
  nativeAttrs.style = undefined;
  nativeAttrs.class = undefined;
  nativeAttrs['aria-label'] = undefined;
  nativeAttrs['aria-labelledby'] = undefined;
  await nextTick();
  await nextTick();
  expect(wrapper.element).toBe(root);
  expect(root.style.paddingTop).toBe('8px');
  expect(root.style.getPropertyValue('--native-root')).toBe('');
  expect(root.classList.contains('native-progress')).toBe(false);
  expect(root.getAttribute('aria-label')).toBe('50%');
  expect(root.hasAttribute('aria-labelledby')).toBe(false);
  wrapper.unmount();
});

it('Progress forwards one click, ignores image errors and never opens a latent preview', async () => {
  const click = vi.fn();
  const error = vi.fn();
  const renderImage = vi.fn(() => h('span', 'Unused image slot'));
  const wrapper = mount(Image, {
    props: { placeholder: { progress: { percent: 50 } }, onClick: click, onError: error },
    slots: { imageRender: renderImage },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  const event = new MouseEvent('click', { bubbles: true });
  wrapper.element.dispatchEvent(event);
  wrapper.element.dispatchEvent(new Event('error'));
  expect(click).toHaveBeenCalledExactlyOnceWith(event);
  expect(wrapper.emitted('update:open')).toBeUndefined();
  expect(error).not.toHaveBeenCalled();
  expect(renderImage).not.toHaveBeenCalled();
  expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  await wrapper.setProps({ placeholder: undefined, src });
  await nextTick();
  expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  wrapper.unmount();
});
