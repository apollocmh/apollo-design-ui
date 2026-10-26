import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  type Ref,
  ref,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { ConfigProvider, type ConfigProviderProps } from '../../index';
import {
  Image,
  ImagePreviewGroup,
  type ImageProps,
  type PreviewConfig,
  type PreviewGroupProps,
} from '../index';
import type { ImageCommonProps } from '../interface';

vi.unmock('@apollo-design/motion');
const containers: HTMLElement[] = [];
afterEach(() => {
  window.dispatchEvent(new MouseEvent('mouseup'));
  vi.restoreAllMocks();
  for (const node of containers.splice(0)) node.remove();
});
async function settle() {
  await nextTick();
  await nextTick();
}
function required<T extends Element>(selector: string, type: { new (...args: never[]): T }): T {
  const node = document.querySelector(selector);
  if (!(node instanceof type)) throw new Error(`Missing actual ${selector}`);
  return node;
}
function host(group: boolean, initial: PreviewConfig = {}) {
  const preview = shallowRef<boolean | PreviewConfig>(initial);
  const child = shallowRef<ImageProps>({ src: 'audit-first.png', alt: 'Audit first' });
  const groupProps = shallowRef<PreviewGroupProps>({});
  const open = ref<boolean | undefined>(undefined);
  const transformed = vi.fn();
  const opened = vi.fn();
  const popupContainer = shallowRef<ConfigProviderProps['getPopupContainer']>();
  const Host = defineComponent({
    setup: () => () =>
      h(
        ConfigProvider,
        { getPopupContainer: popupContainer.value },
        {
          default: () =>
            group
              ? h(
                  ImagePreviewGroup,
                  {
                    ...groupProps.value,
                    preview: preview.value,
                    open: open.value,
                    onTransform: transformed,
                    onOpenChange: opened,
                  },
                  {
                    default: () => [
                      h(Image, child.value),
                      h(Image, { src: 'audit-second.png', alt: 'Audit second' }),
                    ],
                  },
                )
              : h(Image, {
                  ...child.value,
                  preview: preview.value,
                  open: open.value,
                  onTransform: transformed,
                  onOpenChange: opened,
                }),
        },
      ),
  });
  const wrapper = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
  const show = async () => {
    await wrapper.get('.apollo-image').trigger('click');
    await settle();
  };
  return { wrapper, preview, child, groupProps, open, transformed, opened, show, popupContainer };
}
const native: Array<{
  key: keyof ImageCommonProps;
  attr: string;
  first: string | boolean;
  next: string | boolean;
}> = [
  { key: 'alt', attr: 'alt', first: 'First name', next: 'Second name' },
  { key: 'crossOrigin', attr: 'crossorigin', first: 'anonymous', next: 'use-credentials' },
  { key: 'decoding', attr: 'decoding', first: 'async', next: 'sync' },
  { key: 'loading', attr: 'loading', first: 'eager', next: 'lazy' },
  { key: 'referrerPolicy', attr: 'referrerpolicy', first: 'no-referrer', next: 'origin' },
  { key: 'sizes', attr: 'sizes', first: '50vw', next: '100vw' },
  { key: 'srcSet', attr: 'srcset', first: 'first.png 1x', next: 'second.png 2x' },
  { key: 'useMap', attr: 'usemap', first: '#first', next: '#second' },
  { key: 'draggable', attr: 'draggable', first: false, next: true },
];
describe.each([false, true])('Image contract regression (group=%s)', (group) => {
  it('reads the current step for buttons, inverse zoom-out, wheel and double-click', async () => {
    const current = host(group);
    await current.show();
    const image = required('.apollo-image-preview-img', HTMLImageElement);
    required('button[aria-label="zoomIn"]', HTMLButtonElement).click();
    await settle();
    expect(current.transformed).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 1.5 }));
    required('button[aria-label="zoomOut"]', HTMLButtonElement).click();
    await settle();
    expect(current.transformed).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 1 }));
    current.preview.value = { scaleStep: 0.25 };
    await settle();
    image.dispatchEvent(new WheelEvent('wheel', { deltaY: -10, bubbles: true, cancelable: true }));
    await settle();
    expect(current.transformed).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 1.25 }));
    image.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await settle();
    expect(current.transformed).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 1 }));
    image.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await settle();
    expect(current.transformed).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 1.25 }));
    expect(required('.apollo-image-preview-img', HTMLImageElement)).toBe(image);
    current.wrapper.unmount();
  });
  it('falls back from invalid numeric scale configuration without producing NaN', async () => {
    const current = host(group, {
      minScale: Number.NaN,
      maxScale: -1,
      scaleStep: Number.POSITIVE_INFINITY,
    });
    await current.show();
    required('button[aria-label="zoomIn"]', HTMLButtonElement).click();
    await settle();
    expect(current.transformed).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 1.5 }));
    current.wrapper.unmount();
  });
  it('uses the current provider container only when no explicit container is configured', async () => {
    const provider = document.createElement('section');
    const explicit = document.createElement('section');
    document.body.append(provider, explicit);
    containers.push(provider, explicit);
    const current = host(group);
    const resolve = vi.fn(() => provider);
    current.popupContainer.value = resolve;
    await settle();
    await current.show();
    const dialog = required('[role="dialog"]', HTMLDivElement);
    expect(provider.contains(dialog)).toBe(true);
    expect(resolve).toHaveBeenLastCalledWith(current.wrapper.get('.apollo-image').element);
    current.preview.value = { getContainer: () => explicit };
    await settle();
    expect(explicit.contains(dialog)).toBe(true);
    current.preview.value = {};
    current.popupContainer.value = undefined;
    await settle();
    expect(provider.contains(dialog)).toBe(false);
    expect(explicit.contains(dialog)).toBe(false);
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    current.wrapper.unmount();
  });
  it('suppresses failed resource candidates for fallback and restores them for a new source', async () => {
    const current = host(group);
    current.child.value = {
      src: 'broken.png',
      srcSet: 'broken-set.png 1x',
      sizes: '50vw',
      fallback: 'fallback.png',
    };
    await settle();
    const thumb = required('.apollo-image-img', HTMLImageElement);
    thumb.dispatchEvent(new Event('error'));
    await settle();
    expect(thumb.getAttribute('src')).toBe('fallback.png');
    expect(thumb.hasAttribute('srcset')).toBe(false);
    expect(thumb.hasAttribute('sizes')).toBe(false);
    await current.show();
    const image = required('.apollo-image-preview-img', HTMLImageElement);
    image.dispatchEvent(new Event('error'));
    await settle();
    expect(image.getAttribute('src')).toBe('fallback.png');
    expect(image.hasAttribute('srcset')).toBe(false);
    current.child.value = {
      ...current.child.value,
      src: 'recovered.png',
      srcSet: 'recovered-set.png 1x',
    };
    await settle();
    expect(required('.apollo-image-img', HTMLImageElement)).toBe(thumb);
    expect(required('.apollo-image-preview-img', HTMLImageElement)).toBe(image);
    for (const node of [thumb, image]) {
      expect(node.getAttribute('src')).toBe('recovered.png');
      expect(node.getAttribute('srcset')).toBe('recovered-set.png 1x');
      expect(node.getAttribute('sizes')).toBe('50vw');
    }
    current.wrapper.unmount();
  });
  it.each(['blur', 'lost-button', 'secondary-button'])(
    'does not retain a drag after %s',
    async (reason) => {
      const current = host(group);
      await current.show();
      const image = required('.apollo-image-preview-img', HTMLImageElement);
      image.dispatchEvent(
        new MouseEvent('mousedown', {
          button: reason === 'secondary-button' ? 2 : 0,
          bubbles: true,
        }),
      );
      if (reason === 'blur') window.dispatchEvent(new Event('blur'));
      if (reason === 'lost-button')
        window.dispatchEvent(new MouseEvent('mousemove', { buttons: 0, clientX: 10 }));
      current.transformed.mockClear();
      window.dispatchEvent(new MouseEvent('mousemove', { buttons: 1, clientX: 20 }));
      await settle();
      expect(current.transformed).not.toHaveBeenCalled();
      current.wrapper.unmount();
    },
  );
  it.each(['width', 'height'] as const)(
    'carries %s through registered image data into the actual preview',
    async (key) => {
      const current = host(group);
      current.child.value = { ...current.child.value, [key]: 180 };
      await settle();
      await current.show();
      expect(required('.apollo-image-preview-img', HTMLImageElement).getAttribute(key)).toBe('180');
      current.child.value = { ...current.child.value, [key]: 220 };
      await settle();
      expect(required('.apollo-image-preview-img', HTMLImageElement).getAttribute(key)).toBe('220');
      current.wrapper.unmount();
    },
  );
  it.each(native)(
    'forwards current $key through the actual preview and removes it',
    async ({ key, attr, first, next }) => {
      const current = host(group);
      current.child.value = { ...current.child.value, [key]: first };
      await settle();
      await current.show();
      const image = required('.apollo-image-preview-img', HTMLImageElement);
      expect(image.getAttribute(attr)).toBe(String(first));
      current.child.value = { ...current.child.value, [key]: next };
      await settle();
      expect(document.querySelector('.apollo-image-preview-img')).toBe(image);
      expect(image.getAttribute(attr)).toBe(String(next));
      const nextProps = { ...current.child.value };
      delete nextProps[key];
      current.child.value = nextProps;
      await settle();
      if (key === 'alt') expect(image.getAttribute(attr)).toBe('');
      else expect(image.hasAttribute(attr)).toBe(false);
      current.wrapper.unmount();
    },
  );
  it('consumes all declared mask object fields on the actual mask', async () => {
    const current = host(group, {
      mask: { blur: true, className: 'audit-mask', style: { borderTopWidth: '7px' } },
    });
    await current.show();
    const mask = required('.apollo-image-preview-mask', HTMLDivElement);
    expect(mask.classList.contains('apollo-image-preview-mask-blur')).toBe(true);
    expect(mask.classList.contains('audit-mask')).toBe(true);
    expect(mask.style.borderTopWidth).toBe('7px');
    current.preview.value = { mask: { blur: false } };
    await settle();
    expect(mask.classList.contains('apollo-image-preview-mask-blur')).toBe(false);
    expect(mask.classList.contains('audit-mask')).toBe(false);
    expect(mask.style.borderTopWidth).toBe('');
    current.wrapper.unmount();
  });
  it('uses the declared custom preview container and current replacements', async () => {
    const first = document.createElement('section');
    const second = document.createElement('section');
    document.body.append(first, second);
    containers.push(first, second);
    const current = host(group, { getContainer: () => first });
    await current.show();
    const dialog = required('[role="dialog"]', HTMLDivElement);
    expect(first.contains(dialog)).toBe(true);
    current.preview.value = { getContainer: () => second };
    await settle();
    await settle();
    expect(document.querySelector('[role="dialog"]')).toBe(dialog);
    expect(second.contains(dialog)).toBe(true);
    current.preview.value = {};
    await settle();
    await settle();
    expect(second.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
    current.wrapper.unmount();
  });
  it('stops a drag on close and does not transform closed or reopened previews', async () => {
    const current = host(group);
    current.open.value = true;
    await settle();
    const image = required('.apollo-image-preview-img', HTMLImageElement);
    image.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 20 }));
    window.dispatchEvent(new MouseEvent('mousemove', { buttons: 1, clientX: 30, clientY: 50 }));
    await settle();
    expect(current.transformed).toHaveBeenLastCalledWith(expect.objectContaining({ x: 20, y: 30 }));
    current.open.value = false;
    await settle();
    current.transformed.mockClear();
    window.dispatchEvent(new MouseEvent('mousemove', { buttons: 1, clientX: 50, clientY: 80 }));
    await settle();
    expect(current.transformed).not.toHaveBeenCalled();
    current.open.value = true;
    await settle();
    current.transformed.mockClear();
    window.dispatchEvent(new MouseEvent('mousemove', { buttons: 1, clientX: 60, clientY: 90 }));
    await settle();
    expect(current.transformed).not.toHaveBeenCalled();
    expect(
      required('[role="dialog"]', HTMLDivElement).classList.contains('apollo-image-preview-moving'),
    ).toBe(false);
    window.dispatchEvent(new MouseEvent('mouseup'));
    current.wrapper.unmount();
  });
  it('stops an active drag when movable becomes false', async () => {
    const current = host(group);
    await current.show();
    required('.apollo-image-preview-img', HTMLImageElement).dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 20 }),
    );
    current.preview.value = { movable: false };
    await settle();
    current.transformed.mockClear();
    window.dispatchEvent(new MouseEvent('mousemove', { buttons: 1, clientX: 50, clientY: 80 }));
    await settle();
    expect(current.transformed).not.toHaveBeenCalled();
    window.dispatchEvent(new MouseEvent('mouseup'));
    current.wrapper.unmount();
  });
  it('releases the real drag listener pair when its open scope is unmounted', async () => {
    const current = host(group);
    await current.show();
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    required('.apollo-image-preview-img', HTMLImageElement).dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 20 }),
    );
    const move = add.mock.calls.find(([name]) => name === 'mousemove')?.[1];
    const up = add.mock.calls.find(([name]) => name === 'mouseup')?.[1];
    expect(move).toBeDefined();
    expect(up).toBeDefined();
    current.wrapper.unmount();
    expect(remove).toHaveBeenCalledWith('mousemove', move);
    expect(remove).toHaveBeenCalledWith('mouseup', up);
  });
});
it('accepts a null cover without throwing or rendering a configuration object', () => {
  expect(() => {
    const current = host(false, { cover: null });
    current.wrapper.unmount();
  }).not.toThrow();
});
it('does not stringify a placement-only cover configuration', () => {
  const current = host(false, { cover: { placement: 'top' } });
  expect(current.wrapper.get('.apollo-image-cover').text()).toBe('');
  current.wrapper.unmount();
});
it.each([0, [h('span', 'First'), h('span', 'Second')]])(
  'renders legitimate placeholder data %#',
  (placeholder) => {
    const wrapper = mount(Image, { props: { placeholder, alt: 'Placeholder data' } });
    const text = wrapper.text();
    expect(text).toContain(placeholder === 0 ? '0' : 'FirstSecond');
    wrapper.unmount();
  },
);
it('retains the last controlled Group current when the control is removed', async () => {
  const current = host(true);
  current.groupProps.value = { current: 0 };
  await settle();
  await current.show();
  current.groupProps.value = { current: 1 };
  await settle();
  expect(required('.apollo-image-preview-img', HTMLImageElement).getAttribute('src')).toBe(
    'audit-second.png',
  );
  current.groupProps.value = {};
  await settle();
  expect(required('.apollo-image-preview-img', HTMLImageElement).getAttribute('src')).toBe(
    'audit-second.png',
  );
  current.wrapper.unmount();
});
it('switches explicit items and registered sources, preserving available previews and clearing empty ownership', async () => {
  const current = host(true);
  const changed = vi.fn();
  try {
    current.groupProps.value = {
      items: ['explicit-first.png', 'explicit-second.png'],
      current: 1,
      onChange: changed,
    };
    current.open.value = true;
    await settle();
    const image = required('.apollo-image-preview-img', HTMLImageElement);
    expect(image.getAttribute('src')).toBe('explicit-second.png');
    current.groupProps.value = { onChange: changed };
    await settle();
    expect(required('.apollo-image-preview-img', HTMLImageElement)).toBe(image);
    expect(image.getAttribute('src')).toBe('audit-second.png');
    current.groupProps.value = { items: ['replacement.png'], onChange: changed };
    await settle();
    expect(required('.apollo-image-preview-img', HTMLImageElement)).toBe(image);
    expect(image.getAttribute('src')).toBe('replacement.png');
    current.groupProps.value = { items: [], onChange: changed };
    await settle();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(image.isConnected).toBe(false);
    current.groupProps.value = { onChange: changed };
    await settle();
    expect(required('.apollo-image-preview-img', HTMLImageElement).getAttribute('src')).toBe(
      'audit-first.png',
    );
    expect(changed).not.toHaveBeenCalled();
    expect(current.opened).not.toHaveBeenCalled();
  } finally {
    current.wrapper.unmount();
  }
});

it('keeps nested and sibling group registrations and models isolated through inner remounts', async () => {
  const outer = ref(false);
  const inner = ref(false);
  const sibling = ref(false);
  const showInner = ref(true);
  const thumb = (name: string) =>
    h(Image, { key: name, src: `${name}.png`, alt: name, 'data-ownership-thumb': name });
  const group = (open: Ref<boolean>, children: () => VNodeChild) =>
    h(
      ImagePreviewGroup,
      {
        open: open.value,
        'onUpdate:open': (next: boolean) => {
          open.value = next;
        },
      },
      { default: children },
    );
  const wrapper = mount(
    {
      setup: () => () =>
        h('section', [
          group(outer, () => [
            thumb('outer-first'),
            showInner.value
              ? group(inner, () => [thumb('inner-first'), thumb('inner-second')])
              : null,
            thumb('outer-second'),
          ]),
          group(sibling, () => [thumb('sibling-first'), thumb('sibling-second')]),
        ]),
    },
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  const close = async () => {
    required('[aria-label="Close preview"]', HTMLButtonElement).click();
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  };
  try {
    await settle();
    for (const [name, state, counter] of [
      ['outer-second', outer, '2 / 2'],
      ['inner-second', inner, '2 / 2'],
      ['sibling-first', sibling, '1 / 2'],
    ] satisfies Array<[string, Ref<boolean>, string]>) {
      await wrapper.get(`[data-ownership-thumb="${name}"]`).trigger('click');
      await settle();
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
      expect(required('.apollo-image-preview-img', HTMLImageElement).getAttribute('src')).toBe(
        `${name}.png`,
      );
      expect(document.querySelector('.apollo-image-preview-progress')?.textContent).toBe(counter);
      expect([outer, inner, sibling].filter((value) => value.value)).toEqual([state]);
      await close();
    }
    await wrapper.get('[data-ownership-thumb="outer-first"]').trigger('click');
    await settle();
    const image = required('.apollo-image-preview-img', HTMLImageElement);
    for (const visible of [false, true]) {
      showInner.value = visible;
      await settle();
      expect(required('.apollo-image-preview-img', HTMLImageElement)).toBe(image);
      expect(image.getAttribute('src')).toBe('outer-first.png');
      expect(document.querySelector('.apollo-image-preview-progress')?.textContent).toBe('1 / 2');
    }
  } finally {
    wrapper.unmount();
  }
});
it('does not open an empty Group preview from registered children', async () => {
  const current = host(true);
  current.groupProps.value = { items: [] };
  await settle();
  await current.show();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(current.opened).not.toHaveBeenCalled();
  current.wrapper.unmount();
});
it('waits for registered children before normalizing defaultCurrent and ignores later default changes', async () => {
  const wrapper = mount(ImagePreviewGroup, {
    props: { defaultOpen: true, defaultCurrent: 1 },
    slots: { default: () => [h(Image, { src: 'first.png' }), h(Image, { src: 'second.png' })] },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  await settle();
  expect(required('.apollo-image-preview-img', HTMLImageElement).getAttribute('src')).toBe(
    'second.png',
  );
  await wrapper.setProps({ defaultCurrent: 0 });
  expect(required('.apollo-image-preview-img', HTMLImageElement).getAttribute('src')).toBe(
    'second.png',
  );
  wrapper.unmount();
});
it('normalizes a shrinking uncontrolled list, suppresses an empty dialog, and resumes when items return', async () => {
  const changed = vi.fn();
  const wrapper = mount(ImagePreviewGroup, {
    props: {
      items: ['first.png', 'second.png', 'third.png'],
      defaultCurrent: 2,
      open: true,
      onChange: changed,
    },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  await settle();
  const image = required('.apollo-image-preview-img', HTMLImageElement);
  expect(image.getAttribute('src')).toBe('third.png');
  await wrapper.setProps({ items: ['survivor.png'] });
  await settle();
  expect(required('.apollo-image-preview-img', HTMLImageElement)).toBe(image);
  expect(image.getAttribute('src')).toBe('survivor.png');
  expect(changed).not.toHaveBeenCalled();
  await wrapper.setProps({ items: [] });
  await settle();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  await wrapper.setProps({ items: ['returned.png'] });
  await settle();
  expect(required('.apollo-image-preview-img', HTMLImageElement).getAttribute('src')).toBe(
    'returned.png',
  );
  expect(changed).not.toHaveBeenCalled();
  wrapper.unmount();
});
it('a disabled Group does not leave an inert button role on its Image children', async () => {
  const current = host(true);
  current.preview.value = false;
  await settle();
  expect(current.wrapper.get('.apollo-image').attributes('role')).toBeUndefined();
  expect(current.wrapper.get('.apollo-image').attributes('tabindex')).toBeUndefined();
  current.wrapper.unmount();
});

it('keeps the existing data-driven progress renderer current, clamps percent, and respects empty content', async () => {
  const wrapper = mount(Image, {
    props: {
      alt: 'Progress renderer',
      placeholder: {
        progress: { percent: 25, render: (_bar, percent) => h('strong', `First ${percent}`) },
      },
    },
  });
  expect(wrapper.text()).toContain('First 25');
  await wrapper.setProps({
    placeholder: {
      progress: { percent: 130, render: (_bar, percent) => h('strong', `Current ${percent}`) },
    },
  });
  expect(wrapper.text()).toContain('Current 100');
  // Rich progress content is a group; its separate progressbar preserves the
  // percentage without making custom controls presentational descendants.
  expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100');
  await wrapper.setProps({ placeholder: { progress: { percent: 130, render: () => null } } });
  expect(wrapper.find('.apollo-image-progress-content').text()).toBe('');
  await wrapper.setProps({ placeholder: { progress: { percent: Number.NaN } } });
  expect(wrapper.attributes('aria-busy')).toBe('true');
  expect(wrapper.attributes('aria-valuenow')).toBeUndefined();
  wrapper.unmount();
});

it('registers both actual public component names and exposes the same runtime static Group', () => {
  const app = createApp({ render: () => null });
  app.use(Image);
  app.use(ImagePreviewGroup);
  expect(app.component('AImage')).toBe(Image);
  expect(app.component('AImagePreviewGroup')).toBe(ImagePreviewGroup);
  expect(Image.PreviewGroup).toBe(ImagePreviewGroup);
});
