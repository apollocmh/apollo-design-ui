import { expectTypeOf, it } from 'vitest';
import type { VNode, VNodeChild } from 'vue';
import type { ImageProps, ImageRenderInfo, ImageSlots, PreviewConfig } from '../../index';

it('thumbnail imageRender is a single-object native slot with a real VNode', () => {
  expectTypeOf<Parameters<NonNullable<ImageSlots['imageRender']>>>().toEqualTypeOf<
    [ImageRenderInfo]
  >();
  expectTypeOf<ReturnType<NonNullable<ImageSlots['imageRender']>>>().toEqualTypeOf<VNodeChild>();
  expectTypeOf<ImageRenderInfo['originNode']>().toEqualTypeOf<VNode>();
  expectTypeOf<ImageRenderInfo['src']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<ImageProps>().not.toHaveProperty('imageRender');
  // Preview rendering now has a distinct native previewImage slot too.
  expectTypeOf<PreviewConfig>().not.toHaveProperty('imageRender');
  const check = () => {
    // @ts-expect-error Top-level content functions migrate directly to #imageRender.
    const old: ImageProps = { imageRender: () => null };
    // @ts-expect-error The slot receives a named info object, not a positional VNode.
    const positional: ImageSlots = { imageRender: (_node: VNode) => null };
    return [old, positional];
  };
  void check;
});
