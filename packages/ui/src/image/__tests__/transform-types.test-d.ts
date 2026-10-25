import { expectTypeOf, it } from 'vitest';
import type {
  Image,
  ImagePreviewGroup,
  ImageProps,
  PreviewConfig,
  PreviewGroupProps,
  TransformInfo,
} from '../../index';

it('Image/Group expose exact typed transform listeners with a public payload', () => {
  type ImagePublic = InstanceType<typeof Image>['$props'];
  type GroupPublic = InstanceType<typeof ImagePreviewGroup>['$props'];
  expectTypeOf<Parameters<NonNullable<ImagePublic['onTransform']>>>().toEqualTypeOf<
    [TransformInfo]
  >();
  expectTypeOf<Parameters<NonNullable<GroupPublic['onTransform']>>>().toEqualTypeOf<
    [TransformInfo]
  >();
  expectTypeOf<Parameters<NonNullable<ImageProps['onTransform']>>>().toEqualTypeOf<
    [TransformInfo]
  >();
  expectTypeOf<Parameters<NonNullable<PreviewGroupProps['onTransform']>>>().toEqualTypeOf<
    [TransformInfo]
  >();
  expectTypeOf<TransformInfo>().toEqualTypeOf<{
    rotate: number;
    scale: number;
    flipX: boolean;
    flipY: boolean;
    x: number;
    y: number;
  }>();
});

it('transform is a Vue event and the ineffective preview callback is removed', () => {
  expectTypeOf<PreviewConfig>().not.toHaveProperty('onTransform');
  const check = (
    image: InstanceType<typeof Image>['$emit'],
    group: InstanceType<typeof ImagePreviewGroup>['$emit'],
  ) => {
    const info: TransformInfo = { rotate: 90, scale: 1, flipX: false, flipY: false, x: 0, y: 0 };
    image('transform', info);
    group('transform', info);
    // @ts-expect-error Transform notifications receive the business snapshot, not a DOM event.
    image('transform', new Event('transform'));
    // @ts-expect-error The complete snapshot is required, not a partial transform patch.
    group('transform', { rotate: 90 });
    // @ts-expect-error A transform listener receives TransformInfo rather than a number.
    const invalid: ImageProps = { onTransform: (_angle: number) => {} };
    // @ts-expect-error The dead configuration callback moves directly to @transform.
    const old: PreviewConfig = { onTransform: () => {} };
    return [invalid, old];
  };
  void check;
});
