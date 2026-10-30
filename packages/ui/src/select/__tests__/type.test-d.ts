/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type { SizeType } from '../../config-provider/size-context';
import type {
  DefaultOptionType,
  SelectCommonPlacement,
  SelectMode,
  SelectProps,
  SelectRef,
  SelectSize,
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
        // @ts-expect-error size 是 small|medium|middle|large
        size: 'huge',
        // @ts-expect-error variant 是 4 值联合
        variant: 'dashed',
      };
      return props;
    };
    void negative;
  });
});

// ===========================================================================
// Issue #4.3 · SelectSize 必须覆盖 6.6.4 的 SizeType 全集（含 medium）
// ===========================================================================

describe('Select · size 类型（Issue #4.3）', () => {
  it('★ `SelectSize` 就是 `SizeType`（不是「长得像」）', () => {
    expectTypeOf<SelectSize>().toEqualTypeOf<SizeType>();
    expectTypeOf<SelectProps['size']>().toEqualTypeOf<SizeType | undefined>();
  });

  it('正例：medium 通过类型检查', () => {
    const medium: SelectProps = { size: 'medium' };
    expectTypeOf(medium).toEqualTypeOf<SelectProps>();
  });
});

// F02: normalized option children are an internal implementation detail.
// @ts-expect-error F02: callers use options or the default slot, not optionChildren.
const internalOptionChildren: SelectProps = { optionChildren: [] };
void internalOptionChildren;

import type { SelectPurePanel as PurePanel, Select } from '../index';
import type { LabeledValue, SelectSlots, SelectValue } from '../interface';

type ActualProps = InstanceType<typeof Select>['$props'];
type ActualSlots = InstanceType<typeof Select>['$slots'];
expectTypeOf<InstanceType<typeof Select>>().toExtend<SelectRef>();
expectTypeOf<InstanceType<typeof PurePanel>>().toExtend<SelectRef>();
expectTypeOf<Parameters<NonNullable<ActualProps['onChange']>>>().toEqualTypeOf<
  [value: SelectValue, option: DefaultOptionType | DefaultOptionType[] | undefined]
>();
expectTypeOf<Parameters<NonNullable<ActualProps['onSelect']>>>().toEqualTypeOf<
  [value: string | number | LabeledValue, option: DefaultOptionType]
>();
expectTypeOf<Parameters<NonNullable<ActualProps['onUpdate:searchValue']>>>().toEqualTypeOf<
  [value: string]
>();
expectTypeOf<ActualSlots['optionRender']>().toExtend<SelectSlots['optionRender']>();
const rejectedComponentProps = () => {
  // @ts-expect-error Public Select does not expose the internal combobox mode.
  const mode: ActualProps = { mode: 'combobox' };
  // @ts-expect-error Search notifications use emits; showSearch config contains search algorithms only.
  const callback: ActualProps = { showSearch: { onSearch: (_value: string) => {} } };
  // @ts-expect-error Content functions use named slots.
  const render: ActualProps = { optionRender: () => null };
  return [mode, callback, render];
};
void rejectedComponentProps;
