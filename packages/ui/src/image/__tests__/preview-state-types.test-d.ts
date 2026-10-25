import { expectTypeOf, it } from 'vitest';
import type {
  Image,
  ImagePreviewGroup,
  ImageProps,
  PreviewConfig,
  PreviewGroupProps,
} from '../../index';
import type { GroupPreviewConfig } from '../index';

it('Image and PreviewGroup expose top-level Boolean models and exact state events', () => {
  type ImagePublic = InstanceType<typeof Image>['$props'];
  type GroupPublic = InstanceType<typeof ImagePreviewGroup>['$props'];
  expectTypeOf<ImageProps['open']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<ImageProps['defaultOpen']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<PreviewGroupProps['open']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<PreviewGroupProps['defaultOpen']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<ImagePublic['open']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<GroupPublic['open']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<Parameters<NonNullable<ImagePublic['onOpenChange']>>>().toEqualTypeOf<
    [boolean, boolean]
  >();
  expectTypeOf<Parameters<NonNullable<GroupPublic['onOpenChange']>>>().toEqualTypeOf<
    [boolean, boolean]
  >();
  expectTypeOf<Parameters<NonNullable<GroupPublic['onUpdate:open']>>>().toEqualTypeOf<[boolean]>();
  expectTypeOf<Parameters<NonNullable<ImageProps['onOpenChange']>>>().toEqualTypeOf<
    [boolean, boolean]
  >();
  expectTypeOf<Parameters<NonNullable<PreviewGroupProps['onOpenChange']>>>().toEqualTypeOf<
    [boolean, boolean]
  >();
  expectTypeOf<Parameters<NonNullable<GroupPublic['onChange']>>>().toEqualTypeOf<
    [number, number]
  >();
  expectTypeOf<Parameters<NonNullable<GroupPublic['onUpdate:current']>>>().toEqualTypeOf<
    [number]
  >();
  expectTypeOf<Parameters<NonNullable<PreviewGroupProps['onChange']>>>().toEqualTypeOf<
    [number, number]
  >();
  expectTypeOf<Parameters<NonNullable<PreviewGroupProps['onUpdate:current']>>>().toEqualTypeOf<
    [number]
  >();
});

it('state configuration moves directly out of PreviewConfig while the motion callback remains', () => {
  expectTypeOf<GroupPreviewConfig>().toEqualTypeOf<Omit<PreviewConfig, 'src' | 'cover'>>();
  expectTypeOf<GroupPreviewConfig>().not.toHaveProperty('src');
  expectTypeOf<GroupPreviewConfig>().not.toHaveProperty('cover');
  expectTypeOf<PreviewConfig>().not.toHaveProperty('open');
  expectTypeOf<PreviewConfig>().not.toHaveProperty('defaultOpen');
  expectTypeOf<PreviewConfig>().not.toHaveProperty('onOpenChange');
  expectTypeOf<PreviewConfig>().not.toHaveProperty('visible');
  expectTypeOf<PreviewConfig>().not.toHaveProperty('onVisibleChange');
  expectTypeOf<GroupPreviewConfig>().not.toHaveProperty('open');
  expectTypeOf<GroupPreviewConfig>().not.toHaveProperty('defaultOpen');
  expectTypeOf<GroupPreviewConfig>().not.toHaveProperty('onOpenChange');
  expectTypeOf<GroupPreviewConfig>().not.toHaveProperty('visible');
  expectTypeOf<GroupPreviewConfig>().not.toHaveProperty('onVisibleChange');
  expectTypeOf<PreviewConfig>().toHaveProperty('afterOpenChange');
  // Transform notifications now use their own typed top-level event.
  expectTypeOf<PreviewConfig>().not.toHaveProperty('onTransform');
  const check = () => {
    // @ts-expect-error Controlled state moves directly to the top-level open model.
    const oldOpen: PreviewConfig = { open: true };
    // @ts-expect-error Initial state moves directly to top-level defaultOpen.
    const oldDefault: PreviewConfig = { defaultOpen: true };
    // @ts-expect-error State notifications move directly to the openChange event.
    const oldChange: PreviewConfig = { onOpenChange: () => {} };
    // @ts-expect-error The visible alias is removed instead of retained as a fallback.
    const oldVisible: PreviewConfig = { visible: true };
    // @ts-expect-error The legacy state callback is removed without a compatibility channel.
    const oldVisibleChange: PreviewConfig = { onVisibleChange: () => {} };
    // @ts-expect-error Group uses the same top-level state model.
    const oldGroupOpen: GroupPreviewConfig = { open: true };
    // @ts-expect-error Group no longer accepts the three-argument legacy state callback.
    const oldGroupVisibleChange: GroupPreviewConfig = { onVisibleChange: () => {} };
    // @ts-expect-error Open accepts a primitive Boolean, not a boxed value.
    const boxedOpen: ImageProps = { open: new Boolean(true) };
    // @ts-expect-error Initial state accepts a primitive Boolean, not a boxed value.
    const boxedDefault: PreviewGroupProps = { defaultOpen: new Boolean(true) };
    return [
      oldOpen,
      oldDefault,
      oldChange,
      oldVisible,
      oldVisibleChange,
      oldGroupOpen,
      oldGroupVisibleChange,
      boxedOpen,
      boxedDefault,
    ];
  };
  void check;
});

it('typed state and current emits reject unknown events and incorrect payloads', () => {
  type ImageEmit = InstanceType<typeof Image>['$emit'];
  type GroupEmit = InstanceType<typeof ImagePreviewGroup>['$emit'];
  const check = (image: ImageEmit, group: GroupEmit) => {
    image('openChange', true, false);
    image('update:open', true);
    group('openChange', false, true);
    group('update:open', false);
    group('change', 1, 0);
    group('update:current', 1);
    // @ts-expect-error State changes require a previous Boolean state.
    image('openChange', true);
    // @ts-expect-error State changes do not carry DOM events.
    image('openChange', new Event('change'), false);
    // @ts-expect-error Models receive primitive Boolean values.
    group('update:open', new Boolean(true));
    // @ts-expect-error The previous open state must also be Boolean.
    group('openChange', true, 'false');
    // @ts-expect-error Current change keeps numeric previous indices.
    group('change', 1, false);
    // @ts-expect-error Current updates reject string indices.
    group('update:current', '1');
    // @ts-expect-error Current updates reject boxed numbers.
    group('update:current', new Number(1));
    // @ts-expect-error The removed visible event is not part of the public contract.
    group('visibleChange', true, false, 0);
    // @ts-expect-error Unknown Image events remain rejected.
    image('unknownImageState', true);
    // @ts-expect-error Unknown Group events remain rejected.
    group('unknownGroupState', true);
  };
  void check;
});
