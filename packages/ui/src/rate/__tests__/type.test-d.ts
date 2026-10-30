/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { TooltipProps } from '../../tooltip/interface';
import type { Rate } from '../index';
import type { RateProps, RateRef, RateSlots, StarRenderInfo } from '../interface';

describe('Rate · 类型', () => {
  it('value/defaultValue 是 number；count 是 number', () => {
    expectTypeOf<RateProps['value']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<RateProps['defaultValue']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<RateProps['count']>().toEqualTypeOf<number | undefined>();
  });

  it('size 是 large/small/middle 三值（不含 default —— antd 6 的 rate 无此档）', () => {
    expectTypeOf<RateProps['size']>().toEqualTypeOf<'large' | 'middle' | 'small' | undefined>();
  });

  it('tooltips 是 (TooltipProps | string)[]（数据 prop，C8-R2 豁免）', () => {
    expectTypeOf<RateProps['tooltips']>().toEqualTypeOf<(TooltipProps | string)[] | undefined>();
  });

  it('事件面：change(value) / hoverChange(value|undefined) / update:value(value)', () => {
    expectTypeOf<RateProps['onChange']>().toEqualTypeOf<((value: number) => void) | undefined>();
    expectTypeOf<RateProps['onHoverChange']>().toEqualTypeOf<
      ((value: number | undefined) => void) | undefined
    >();
    expectTypeOf<RateProps['onUpdate:value']>().toEqualTypeOf<
      ((value: number) => void) | undefined
    >();
    expectTypeOf<RateProps['onFocus']>().toEqualTypeOf<((event: FocusEvent) => void) | undefined>();
    expectTypeOf<RateProps['onBlur']>().toEqualTypeOf<((event: FocusEvent) => void) | undefined>();
  });

  it('RateRef：focus/blur', () => {
    expectTypeOf<RateRef>().toEqualTypeOf<{ focus: () => void; blur: () => void }>();
    expectTypeOf<InstanceType<typeof Rate>['focus']>().toEqualTypeOf<RateRef['focus']>();
    expectTypeOf<InstanceType<typeof Rate>['blur']>().toEqualTypeOf<RateRef['blur']>();
  });

  it('#character / #characterRender 的 slot props 面（StarRenderInfo）', () => {
    const info: StarRenderInfo = {
      index: 0,
      value: 3,
      allowHalf: true,
      disabled: false,
      count: 5,
      focused: false,
    };
    expectTypeOf(info.index).toBeNumber();
    expectTypeOf(info.value).toBeNumber();
    expectTypeOf<
      Parameters<NonNullable<RateSlots['character']>>[0]
    >().toEqualTypeOf<StarRenderInfo>();
    expectTypeOf<Parameters<NonNullable<RateSlots['characterRender']>>[0]>().toEqualTypeOf<{
      node: VNodeChild;
      index: number;
    }>();
    expectTypeOf<
      Parameters<NonNullable<InstanceType<typeof Rate>['$slots']['character']>>[0]
    >().toEqualTypeOf<StarRenderInfo>();
  });

  it('正例（受控 + 插槽组合）', () => {
    const sample: RateProps = {
      value: 3,
      count: 10,
      allowHalf: true,
      allowClear: false,
      size: 'small',
      tooltips: ['a', { title: 'b' }],
      onChange: () => undefined,
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: RateProps = {
        // @ts-expect-error size 不含 default（antd 6 rate 无此档）
        size: 'default',
        // @ts-expect-error count 必须是 number
        count: 'five',
      };
      return props;
    };
    void negative;

    const invalidListener = () => {
      const props: RateProps = {
        // @ts-expect-error focus uses a native FocusEvent, not a rating payload.
        onFocus: (_value: number) => undefined,
        // @ts-expect-error model events carry a number.
        'onUpdate:value': (_value: string) => undefined,
      };
      const slots: RateSlots = {
        // @ts-expect-error scoped character slots receive a named info object.
        character: (_index: number) => 'star',
      };
      return { props, slots };
    };
    void invalidListener;
  });
});
