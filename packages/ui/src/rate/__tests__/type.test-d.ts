/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type { TooltipProps } from '../../tooltip/interface';
import type { RateProps, RateRef, StarRenderInfo } from '../interface';

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

  it('回调面：onChange(value) / onHoverChange(value|undefined)（props 形态，非 emits）', () => {
    expectTypeOf<RateProps['onChange']>().toEqualTypeOf<((value: number) => void) | undefined>();
    expectTypeOf<RateProps['onHoverChange']>().toEqualTypeOf<
      ((value: number | undefined) => void) | undefined
    >();
  });

  it('RateRef：focus/blur', () => {
    expectTypeOf<RateRef>().toEqualTypeOf<{ focus: () => void; blur: () => void }>();
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
  });
});
