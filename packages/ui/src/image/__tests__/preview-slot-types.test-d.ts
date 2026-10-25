import { expectTypeOf, it } from 'vitest';
import type { VNode, VNodeChild } from 'vue';
import type {
  Image,
  ImagePreviewGroup,
  ImageSlots,
  PreviewActionsInfo,
  PreviewConfig,
  PreviewCountInfo,
  PreviewGroupSlots,
  PreviewImageInfo,
  TransformInfo,
} from '../../index';

it('preview slots use one exact info object and real origin VNodes', () => {
  expectTypeOf<Parameters<NonNullable<ImageSlots['previewImage']>>>().toEqualTypeOf<
    [PreviewImageInfo]
  >();
  expectTypeOf<Parameters<NonNullable<ImageSlots['previewActions']>>>().toEqualTypeOf<
    [PreviewActionsInfo]
  >();
  expectTypeOf<Parameters<NonNullable<PreviewGroupSlots['previewImage']>>>().toEqualTypeOf<
    [PreviewImageInfo]
  >();
  expectTypeOf<Parameters<NonNullable<PreviewGroupSlots['previewActions']>>>().toEqualTypeOf<
    [PreviewActionsInfo]
  >();
  expectTypeOf<Parameters<NonNullable<PreviewGroupSlots['previewCount']>>>().toEqualTypeOf<
    [PreviewCountInfo]
  >();
  expectTypeOf<PreviewImageInfo['originNode']>().toEqualTypeOf<VNode>();
  expectTypeOf<PreviewActionsInfo['originNode']>().toEqualTypeOf<VNode>();
  expectTypeOf<PreviewCountInfo['originNode']>().toEqualTypeOf<VNode>();
  expectTypeOf<PreviewImageInfo['src']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<PreviewImageInfo['transform']>().toEqualTypeOf<TransformInfo>();
  expectTypeOf<ReturnType<NonNullable<ImageSlots['previewImage']>>>().toEqualTypeOf<VNodeChild>();
  type ImagePublic = InstanceType<typeof Image>['$slots'];
  type GroupPublic = InstanceType<typeof ImagePreviewGroup>['$slots'];
  expectTypeOf<Parameters<NonNullable<ImagePublic['previewImage']>>>().toEqualTypeOf<
    [PreviewImageInfo]
  >();
  expectTypeOf<Parameters<NonNullable<GroupPublic['previewCount']>>>().toEqualTypeOf<
    [PreviewCountInfo]
  >();
});

it('preview actions are typed callbacks rather than an unknown map', () => {
  expectTypeOf<Parameters<PreviewActionsInfo['actions']['rotateRight']>>().toEqualTypeOf<[]>();
  expectTypeOf<ReturnType<PreviewActionsInfo['actions']['close']>>().toEqualTypeOf<void>();
  expectTypeOf<PreviewActionsInfo['disabled']>().toEqualTypeOf<{
    zoomIn: boolean;
    zoomOut: boolean;
  }>();
  const check = (info: PreviewActionsInfo) => {
    info.actions.flipX();
    info.actions.flipY();
    info.actions.rotateLeft();
    info.actions.rotateRight();
    info.actions.zoomIn();
    info.actions.zoomOut();
    info.actions.reset();
    info.actions.close();
    // @ts-expect-error Actions expose callbacks with documented names, not arbitrary unknown keys.
    info.actions.unknownPreviewAction();
    // @ts-expect-error The fixed-step zoom callback takes no positional arguments.
    info.actions.zoomIn(2);
    // @ts-expect-error Consumers cannot replace the shared callback map.
    info.actions.rotateRight = () => {};
  };
  void check;
});

it('legacy renderer configuration is removed directly without a second channel', () => {
  expectTypeOf<PreviewConfig>().not.toHaveProperty('imageRender');
  expectTypeOf<PreviewConfig>().not.toHaveProperty('actionsRender');
  expectTypeOf<PreviewConfig>().not.toHaveProperty('toolbarRender');
  expectTypeOf<PreviewConfig>().not.toHaveProperty('countRender');
  expectTypeOf<ImageSlots>().not.toHaveProperty('previewCount');
  expectTypeOf<PreviewGroupSlots>().not.toHaveProperty('imageRender');
  const check = () => {
    // @ts-expect-error Preview images use the native previewImage slot.
    const oldImage: PreviewConfig = { imageRender: () => null };
    // @ts-expect-error Toolbar content uses the native previewActions slot.
    const oldActions: PreviewConfig = { actionsRender: () => null };
    // @ts-expect-error The unused legacy toolbar alias is removed too.
    const oldToolbar: PreviewConfig = { toolbarRender: () => null };
    // @ts-expect-error Group counters use the native previewCount slot.
    const oldCount: PreviewConfig = { countRender: () => null };
    const positional: ImageSlots = {
      // @ts-expect-error Slots receive a named object rather than the old positional arguments.
      previewActions: (_node: VNode, _info: PreviewActionsInfo) => null,
    };
    return [oldImage, oldActions, oldToolbar, oldCount, positional];
  };
  void check;
});
