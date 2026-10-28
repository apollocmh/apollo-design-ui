/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里（*.test-d.ts 被真执行）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { BadgeRef, BadgeSlots, RibbonRef, RibbonSlots } from '../../index';
import type { Badge, Ribbon } from '../index';
import type { BadgeProps, RibbonProps } from '../interface';

describe('Badge · Props 类型', () => {
  it('public instances expose actual native elements and typed Ribbon slots', () => {
    expectTypeOf<typeof Badge.Ribbon>().toEqualTypeOf<typeof Ribbon>();
    expectTypeOf<InstanceType<typeof Badge>['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<
      InstanceType<typeof Ribbon>['nativeElement']
    >().toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<InstanceType<typeof Badge>>().toMatchTypeOf<BadgeRef>();
    expectTypeOf<InstanceType<typeof Ribbon>>().toMatchTypeOf<RibbonRef>();
    expectTypeOf<NonNullable<RibbonSlots['default']>>().toEqualTypeOf<() => VNodeChild>();
    expectTypeOf<NonNullable<RibbonSlots['text']>>().toEqualTypeOf<() => VNodeChild>();
    const check = (badge: InstanceType<typeof Badge>, ribbon: InstanceType<typeof Ribbon>) => {
      ribbon.$slots.text?.();
      // @ts-expect-error nativeElement is an owned readonly element reference
      badge.nativeElement = null;
      // @ts-expect-error nativeElement is an owned readonly wrapper reference
      ribbon.nativeElement = null;
    };
    void check;
  });
  it('root style is a native attribute, not a content-targeted object prop', () => {
    const check = () => {
      // @ts-expect-error indicator styles belong to styles.indicator; native attrs are not BadgeProps
      const oldBadge: BadgeProps = { style: { color: 'red' } };
      // @ts-expect-error Ribbon also keeps native style out of the content props
      const oldRibbon: RibbonProps = { style: { color: 'red' } };
      // @ts-expect-error content functions are replaced by native slots, not accepted as text data
      const callback: RibbonProps = { text: () => 'Old callback' };
      return [oldBadge, oldRibbon, callback];
    };
    void check;
  });
  it('content slots have public callable types and internal flags stay private', () => {
    expectTypeOf<NonNullable<BadgeSlots['count']>>().toEqualTypeOf<() => VNodeChild>();
    const check = (vm: InstanceType<typeof Badge>) => {
      vm.$slots.count?.();
      vm.$slots.text?.();
      // @ts-expect-error customCount belongs to the private indicator engine
      void vm.$props.customCount;
    };
    void check;
  });
  it('status 是五个预设状态色', () => {
    expectTypeOf<BadgeProps['status']>().toEqualTypeOf<
      'success' | 'processing' | 'error' | 'default' | 'warning' | undefined
    >();
  });

  it('size 三值（default 已废弃）', () => {
    expectTypeOf<BadgeProps['size']>().toEqualTypeOf<'medium' | 'small' | 'default' | undefined>();
  });

  it('offset 是二元组（数字或字符串）', () => {
    expectTypeOf<BadgeProps['offset']>().toEqualTypeOf<
      [number | string, number | string] | undefined
    >();
  });

  it('Ribbon.placement 二值', () => {
    expectTypeOf<RibbonProps['placement']>().toEqualTypeOf<'start' | 'end' | undefined>();
  });

  it('★ 负例（永不调用的闭包内）', () => {
    const _never = () => {
      // @ts-expect-error status 不接受任意字符串
      const badStatus: BadgeProps = { status: 'middle-ish' };
      // @ts-expect-error offset 不接受一元组
      const badOffset: BadgeProps = { offset: [10] };
      // @ts-expect-error placement 不接受 'middle'
      const badPlacement: RibbonProps = { placement: 'middle' };
      return [badStatus, badOffset, badPlacement];
    };
    void _never;
  });
});
