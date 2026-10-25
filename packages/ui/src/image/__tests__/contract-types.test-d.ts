import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import {
  type GroupPreviewConfig,
  Image,
  ImagePreviewGroup,
  type MaskType,
  type PreviewConfig,
  type PreviewGroupItem,
  type PreviewGroupProps,
} from '../../index';

it('keeps static and named Group declarations identical and typed', () => {
  expectTypeOf(Image.PreviewGroup).toEqualTypeOf(ImagePreviewGroup);
  expectTypeOf(Image.PreviewGroup).not.toBeAny();
  const item: PreviewGroupItem = {
    src: 'image.png',
    width: 240,
    fallback: 'fallback.png',
    srcSet: 'large.png 2x',
    metadata: { id: 1 },
  };
  const props: PreviewGroupProps = {
    items: [item],
    classNames: { root: 'gallery', popup: { mask: 'overlay' } },
  };
  const mask: MaskType = { blur: true, className: 'mask', style: { opacity: 0.8 } };
  const preview: PreviewConfig = { mask, cover: h('span', 'Preview'), scaleStep: 0.25 };
  expectTypeOf(props).toExtend<PreviewGroupProps>();
  expectTypeOf(preview).toExtend<PreviewConfig>();
});

it('rejects configuration that has no matching behavior', () => {
  const negative = () => {
    // @ts-expect-error Mask appearance is configuration, not rendered content.
    const mask: MaskType = 'Mask text';
    // @ts-expect-error Group sources belong to items or child Image.preview.src.
    const source: GroupPreviewConfig = { src: 'ignored.png' };
    // @ts-expect-error Group covers belong to child Images.
    const cover: GroupPreviewConfig = { cover: false };
    // @ts-expect-error Removed ineffective lifecycle option.
    const force: PreviewConfig = { forceRender: true };
    // @ts-expect-error Removed ineffective lifecycle option.
    const destroy: PreviewConfig = { destroyOnClose: true };
    // @ts-expect-error Group only owns root and popup semantics.
    const semantics: PreviewGroupProps = { styles: { image: { opacity: 0.5 } } };
    return [mask, source, cover, force, destroy, semantics];
  };
  void negative;
});
