import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Image, ImagePreviewGroup } from '../../index';
import { createImageRegistry, type RegisteredImage } from '../context';

interface Picture {
  id: string;
  src: string;
  alt: string;
}
function pictures(): Picture[] {
  return [
    { id: 'first', src: 'first.png', alt: 'First registered image' },
    { id: 'second', src: 'second.png', alt: 'Second registered image' },
    { id: 'third', src: 'third.png', alt: 'Third registered image' },
  ];
}
async function settle() {
  await nextTick();
  await nextTick();
  await nextTick();
}
function previewImage() {
  const image = document.querySelector('.apollo-image-preview-img');
  if (!(image instanceof HTMLImageElement))
    throw new Error('Expected the public group preview img');
  return image;
}
function progress() {
  const node = document.querySelector('.apollo-image-preview-progress');
  if (!(node instanceof HTMLElement)) throw new Error('Expected the group counter');
  return node.textContent;
}
async function move(direction: 'next' | 'prev') {
  const button = document.querySelector(`.apollo-image-preview-switch-${direction}`);
  if (!(button instanceof HTMLButtonElement))
    throw new Error('Expected a real group navigation button');
  expect(button.disabled).toBe(false);
  button.click();
  await settle();
}
async function groupWith(initial: Picture[]) {
  const entries = ref(initial);
  const current = ref(0);
  const open = ref(false);
  const changed = vi.fn<(next: number, previous: number) => void>();
  const opened = vi.fn<(next: boolean, previous: boolean) => void>();
  const updated = vi.fn<(next: number) => void>((next) => {
    current.value = next;
  });
  const Host = defineComponent(
    () => () =>
      h(
        ImagePreviewGroup,
        {
          open: open.value,
          current: current.value,
          onChange: changed,
          onOpenChange: opened,
          'onUpdate:current': updated,
          'onUpdate:open': (next: boolean) => {
            open.value = next;
          },
        },
        {
          default: () =>
            entries.value.map((entry) =>
              h(Image, {
                key: entry.id,
                src: entry.src,
                alt: entry.alt,
                'data-registered-image': entry.id,
              }),
            ),
        },
      ),
  );
  const wrapper = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
  // Open through a real registered thumbnail after the group has collected its children.
  await settle();
  await wrapper.get('[data-registered-image="first"]').trigger('click');
  await settle();
  expect(open.value).toBe(true);
  expect(opened).toHaveBeenCalledExactlyOnceWith(true, false);
  // Opening can select the clicked index; isolate subsequent data updates/navigation.
  changed.mockClear();
  updated.mockClear();
  opened.mockClear();
  return { entries, current, changed, updated, opened, wrapper };
}
function assertImage(image: HTMLImageElement, picture: Picture) {
  expect.soft(image.getAttribute('src')).toBe(picture.src);
  expect.soft(image.getAttribute('alt')).toBe(picture.alt);
}
function firstPicture(entries: Picture[]) {
  const first = entries[0];
  if (!first) throw new Error('Expected the first registered picture');
  return first;
}
afterEach(() => {
  document.body.replaceChildren();
});

describe('Image PreviewGroup stable registration order', () => {
  for (const count of [2, 3]) {
    for (const field of ['src', 'alt'] as const) {
      it(`${count} images: replacing first ${field} refreshes the selected image without reordering navigation`, async () => {
        const all = pictures().slice(0, count);
        const { entries, current, changed, updated, opened, wrapper } = await groupWith(all);
        await settle();
        const image = previewImage();
        const firstRoot = wrapper.get('[data-registered-image="first"]').element;
        const firstThumbnail = wrapper.get('[data-registered-image="first"] img').element;
        assertImage(image, firstPicture(all));
        expect(progress()).toBe(`1 / ${count}`);
        expect(current.value).toBe(0);

        const first = firstPicture(entries.value);
        if (field === 'src') first.src = 'first-current.png';
        else first.alt = 'First current image';
        await settle();
        expect(wrapper.get('[data-registered-image="first"]').element).toBe(firstRoot);
        expect(wrapper.get('[data-registered-image="first"] img').element).toBe(firstThumbnail);
        expect(previewImage()).toBe(image);
        expect(current.value).toBe(0);
        expect(progress()).toBe(`1 / ${count}`);
        expect(changed).not.toHaveBeenCalled();
        expect(updated).not.toHaveBeenCalled();
        expect(opened).not.toHaveBeenCalled();
        assertImage(image, first);

        for (let index = 1; index < count; index++) {
          await move('next');
          const expected = entries.value[index];
          if (!expected) throw new Error('Expected the next registered image');
          expect(current.value).toBe(index);
          expect(progress()).toBe(`${index + 1} / ${count}`);
          expect(previewImage()).toBe(image);
          assertImage(image, expected);
          expect(changed).toHaveBeenNthCalledWith(index, index, index - 1);
          expect(updated).toHaveBeenNthCalledWith(index, index);
        }
        expect(changed).toHaveBeenCalledTimes(count - 1);
        expect(updated).toHaveBeenCalledTimes(count - 1);
        expect(opened).not.toHaveBeenCalled();
        wrapper.unmount();
      });
    }
  }

  it('registry same-id upsert already preserves insertion order and current data (passing control)', () => {
    const { images, register } = createImageRegistry();
    const entry = (src: string): RegisteredImage => ({ data: { src }, canPreview: true });
    register('first', entry('first.png'));
    const removeSecond = register('second', entry('second.png'));
    register('third', entry('third.png'));
    const removeFirst = register('first', entry('first-current.png'));
    expect(Array.from(images.value.keys())).toEqual(['first', 'second', 'third']);
    expect(images.value.get('first')?.data.src).toBe('first-current.png');
    expect(images.value.size).toBe(3);
    removeFirst();
    expect(Array.from(images.value.keys())).toEqual(['second', 'third']);
    removeSecond();
    expect(Array.from(images.value.keys())).toEqual(['third']);
  });

  it('public append/unmount retains normal order, counts and navigation (passing control)', async () => {
    const all = pictures();
    const { entries, current, wrapper } = await groupWith(all.slice(0, 2));
    await settle();
    const image = previewImage();
    assertImage(image, firstPicture(all));
    expect(progress()).toBe('1 / 2');
    const third = all[2];
    if (!third) throw new Error('Expected the appended picture');
    entries.value.push(third);
    await settle();
    expect(progress()).toBe('1 / 3');
    for (let index = 1; index < all.length; index++) {
      await move('next');
      const expected = all[index];
      if (!expected) throw new Error('Expected a registered picture');
      assertImage(image, expected);
      expect(progress()).toBe(`${index + 1} / 3`);
    }
    await move('prev');
    await move('prev');
    expect(current.value).toBe(0);
    entries.value.pop();
    await settle();
    expect(wrapper.find('[data-registered-image="third"]').exists()).toBe(false);
    expect(wrapper.findAll('.apollo-image-img')).toHaveLength(2);
    expect(progress()).toBe('1 / 2');
    expect(previewImage()).toBe(image);
    assertImage(image, firstPicture(all));
    await move('next');
    const second = all[1];
    if (!second) throw new Error('Expected the surviving second picture');
    assertImage(image, second);
    expect(progress()).toBe('2 / 2');
    wrapper.unmount();
  });
});
