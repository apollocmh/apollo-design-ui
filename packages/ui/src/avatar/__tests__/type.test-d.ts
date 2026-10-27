import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { Breakpoint } from '../../_internal/responsive-observer';
import type { SizeType } from '../../config-provider/size-context';
import type {
  Avatar,
  AvatarConfig,
  AvatarEmits,
  AvatarGroup,
  AvatarGroupMax,
  AvatarGroupProps,
  AvatarGroupRef,
  AvatarGroupSlot,
  AvatarProps,
  AvatarRef,
  AvatarShape,
  AvatarSize,
  AvatarSlot,
  AvatarSlots,
  ScreenSizeMap,
} from '../index';

describe('Avatar public Vue types', () => {
  it('all public image, shape and size fields retain their concrete types', () => {
    expectTypeOf<AvatarProps['prefixCls']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AvatarShape>().toEqualTypeOf<'circle' | 'square'>();
    expectTypeOf<AvatarSize>().toEqualTypeOf<SizeType | 'default' | number | ScreenSizeMap>();
    expectTypeOf<ScreenSizeMap>().toEqualTypeOf<Partial<Record<Breakpoint, number>>>();
    expectTypeOf<AvatarProps['src']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<AvatarProps['icon']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<AvatarProps['srcSet']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AvatarProps['draggable']>().toEqualTypeOf<
      boolean | 'true' | 'false' | undefined
    >();
    expectTypeOf<AvatarProps['crossOrigin']>().toEqualTypeOf<
      '' | 'anonymous' | 'use-credentials' | undefined
    >();
    expectTypeOf<AvatarProps['alt']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AvatarProps['gap']>().toEqualTypeOf<number | undefined>();
  });
  it('click/error are typed Vue events and cancellation has an explicit hook', () => {
    expectTypeOf<AvatarEmits>().toEqualTypeOf<{
      click: [event: MouseEvent];
      error: [event: Event];
    }>();
    expectTypeOf<NonNullable<AvatarProps['beforeFallback']>>().parameters.toEqualTypeOf<
      [event: Event]
    >();
    expectTypeOf<NonNullable<AvatarProps['beforeFallback']>>().returns.toEqualTypeOf<
      // biome-ignore lint/suspicious/noConfusingVoidType: Verify the public boolean-or-void cancellation hook without rejecting side-effect callbacks.
      boolean | void>();
    expectTypeOf<
      NonNullable<InstanceType<typeof Avatar>['$props']['onError']>
    >().parameters.toEqualTypeOf<[event: Event]>();
  });
  it('all three slots carry complete VNodeChild with no positional payload', () => {
    expectTypeOf<keyof AvatarSlots>().toEqualTypeOf<'default' | 'image' | 'icon'>();
    expectTypeOf<NonNullable<AvatarSlots['image']>>().returns.toEqualTypeOf<VNodeChild>();
    expectTypeOf<AvatarSlot>().returns.toEqualTypeOf<VNodeChild>();
    expectTypeOf<AvatarGroupSlot>().returns.toEqualTypeOf<VNodeChild>();
  });
  it('Group exposes one current max configuration and inherited sizes', () => {
    expectTypeOf<keyof AvatarGroupProps>().toEqualTypeOf<'prefixCls' | 'size' | 'shape' | 'max'>();
    expectTypeOf<keyof AvatarGroupMax>().toEqualTypeOf<'count' | 'style' | 'popover'>();
    expectTypeOf<AvatarGroupProps['size']>().toEqualTypeOf<AvatarProps['size']>();
    expectTypeOf<AvatarGroupProps['shape']>().toEqualTypeOf<AvatarProps['shape']>();
    expectTypeOf<keyof AvatarConfig>().toEqualTypeOf<'className' | 'style'>();
  });
  it('native attrs and static/installed components are available; public refs stay narrow', () => {
    type Props = InstanceType<typeof Avatar>['$props'];
    const attrs: Props = {
      class: ['native', { active: true }],
      style: [{ color: 'red' }],
      onClick: (e: MouseEvent) => e.preventDefault(),
      onError: (e: Event) => e.type,
    };
    expectTypeOf(attrs).toMatchTypeOf<Props>();
    expectTypeOf<AvatarRef>().toEqualTypeOf<{ nativeElement: HTMLSpanElement | null }>();
    expectTypeOf<AvatarGroupRef>().toEqualTypeOf<{ nativeElement: HTMLDivElement | null }>();
    expectTypeOf<
      InstanceType<typeof Avatar>['nativeElement']
    >().toEqualTypeOf<HTMLSpanElement | null>();
    expectTypeOf<InstanceType<typeof AvatarGroup>>().toMatchTypeOf<AvatarGroupRef>();
    expectTypeOf<typeof Avatar.Group>().toEqualTypeOf<typeof AvatarGroup>();
    expectTypeOf<typeof Avatar>().toHaveProperty('install');
    expectTypeOf<typeof AvatarGroup>().toHaveProperty('install');
  });
  it('invalid fields, legacy aliases and private implementation are rejected', () => {
    const invalid = () => {
      // @ts-expect-error native attrs are not renamed to React props
      const className: AvatarProps = { className: 'legacy' };
      // @ts-expect-error use the default slot
      const children: AvatarProps = { children: 'content' };
      // @ts-expect-error images use standard crossorigin values
      const crossorigin: AvatarProps = { crossOrigin: 'yes' };
      // @ts-expect-error shapes have two values
      const shape: AvatarProps = { shape: 'round' };
      // @ts-expect-error size names are finite
      const size: AvatarProps = { size: 'huge' };
      // @ts-expect-error responsive values are numbers
      const map: ScreenSizeMap = { xs: '24px' };
      // @ts-expect-error cancellation must return boolean or void
      const before: AvatarProps = { beforeFallback: () => 'no' };
      // @ts-expect-error use max.count
      const max: AvatarGroupProps = { maxCount: 2 };
      // @ts-expect-error use max.style
      const style: AvatarGroupProps = { maxStyle: {} };
      // @ts-expect-error use max.popover.placement
      const placement: AvatarGroupProps = { maxPopoverPlacement: 'top' };
      // @ts-expect-error use max.popover.trigger
      const trigger: AvatarGroupProps = { maxPopoverTrigger: 'hover' };
      return [
        className,
        children,
        crossorigin,
        shape,
        size,
        map,
        before,
        max,
        style,
        placement,
        trigger,
      ];
    };
    void invalid;
    const privateRef = (
      avatar: InstanceType<typeof Avatar>,
      group: InstanceType<typeof AvatarGroup>,
    ) => {
      // @ts-expect-error internal measurement is not exposed
      avatar.setScaleParam();
      // @ts-expect-error internal rendering is not exposed
      group.groupChildren();
    };
    void privateRef;
  });
});
