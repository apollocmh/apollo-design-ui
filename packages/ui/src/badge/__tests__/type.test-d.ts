/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里（*.test-d.ts 被真执行）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { BadgeProps, RibbonProps } from '../interface';

describe('Badge · Props 类型', () => {
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
