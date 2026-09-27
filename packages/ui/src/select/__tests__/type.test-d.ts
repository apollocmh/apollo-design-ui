/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type {
  DefaultOptionType,
  SelectCommonPlacement,
  SelectMode,
  SelectProps,
  SelectRef,
} from '../interface';

describe('Select · 类型', () => {
  it('公开 mode 只有 multiple | tags（combobox 是内核私有）', () => {
    expectTypeOf<SelectMode>().toEqualTypeOf<'multiple' | 'tags'>();
  });

  it('placement 是 4 值联合', () => {
    expectTypeOf<SelectCommonPlacement>().toEqualTypeOf<
      'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
    >();
  });

  it('expose 面与 antd 的 BaseSelectRef 一致', () => {
    expectTypeOf<SelectRef>().toHaveProperty('focus');
    expectTypeOf<SelectRef>().toHaveProperty('blur');
    expectTypeOf<SelectRef>().toHaveProperty('scrollTo');
    expectTypeOf<SelectRef>().toHaveProperty('nativeElement');
  });

  it('正例：合法 prop 组合', () => {
    const options: DefaultOptionType[] = [
      { value: 'a', label: 'A', disabled: false },
      { label: 'G', options: [{ value: 'b', label: 'B' }] },
    ];
    const sample: Pick<
      SelectProps,
      | 'options'
      | 'mode'
      | 'showSearch'
      | 'maxCount'
      | 'popupMatchSelectWidth'
      | 'variant'
      | 'status'
    > = {
      options,
      mode: 'multiple',
      showSearch: { optionFilterProp: ['label', 'nick'], autoClearSearchValue: false },
      maxCount: 3,
      popupMatchSelectWidth: 300,
      variant: 'filled',
      status: 'warning',
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: SelectProps = {
        // @ts-expect-error 公开 mode 不接受 combobox（内部模式）
        mode: 'combobox',
        // @ts-expect-error size 是 small|middle|large
        size: 'huge',
        // @ts-expect-error variant 是 4 值联合
        variant: 'dashed',
      };
      return props;
    };
    void negative;
  });
});
