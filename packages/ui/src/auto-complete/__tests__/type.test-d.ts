/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type { SizeType } from '../../config-provider/size-context';
import type { AutoCompleteProps, AutoCompleteRef, DataSourceItemObject } from '../interface';

describe('AutoComplete · 类型', () => {
  it('value/defaultValue 是 SelectValue（不含 labelInValue —— antd omit）', () => {
    expectTypeOf<AutoCompleteProps['value']>().toEqualTypeOf<
      import('../../select/interface').SelectValue
    >();
  });

  it('dataSource 元素接受结构化数据、文本与选项VNode（deprecated）', () => {
    const item: DataSourceItemObject = { value: 0, text: 0 };
    expectTypeOf(item.value).toEqualTypeOf<string | number>();
  });

  it('语义面：root/prefix/input/placeholder/content/clear/popup（无 item 系）', () => {
    const cn: AutoCompleteProps['classNames'] = {
      root: 'r',
      input: 'i',
      popup: { root: 'p' },
    };
    expectTypeOf(cn).not.toBeNever();
  });

  it('AutoCompleteRef：focus/blur/scrollTo', () => {
    const ref: AutoCompleteRef = {
      focus: () => undefined,
      blur: () => undefined,
      scrollTo: () => undefined,
      nativeElement: null,
    };
    expectTypeOf(ref).not.toBeNever();
  });

  it('★ Issue #14.2：size 是共享 SizeType（含 medium，不是手写三档）', () => {
    // 上游 `AutoCompleteProps` 继承 `InternalSelectProps`，其 `size` 就是
    // `SizeType`（运行时转发给 Select 的 `useSize`）。
    expectTypeOf<AutoCompleteProps['size']>().toEqualTypeOf<SizeType | undefined>();
    // 正例：四档都必须可用（此前手写 `'large' | 'middle' | 'small'` 漏掉 medium）
    const sizes: NonNullable<AutoCompleteProps['size']>[] = ['small', 'medium', 'middle', 'large'];
    void sizes;
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: AutoCompleteProps = {
        // @ts-expect-error mode 已被 antd omit（AutoComplete 不接受）
        mode: 'multiple',
        // labelInValue 同样被 omit —— TS 的对象字面量多余属性检查
        // 对首个多余键之后的键不再重复报错，故此处不放负例断言
        labelInValue: true,
      };
      return props;
    };
    void negative;
  });
});

import type { AutoComplete, AutoCompleteEmits, AutoCompleteSlots } from '../index';

type ActualProps = InstanceType<typeof AutoComplete>['$props'];
expectTypeOf<InstanceType<typeof AutoComplete>>().toExtend<AutoCompleteRef>();
expectTypeOf<Parameters<NonNullable<ActualProps['onChange']>>>().toEqualTypeOf<
  AutoCompleteEmits['change']
>();
expectTypeOf<Parameters<NonNullable<ActualProps['onSelect']>>>().toEqualTypeOf<
  AutoCompleteEmits['select']
>();
expectTypeOf<Parameters<NonNullable<ActualProps['onSearch']>>>().toEqualTypeOf<[value: string]>();
expectTypeOf<Parameters<NonNullable<ActualProps['onUpdate:open']>>>().toEqualTypeOf<
  [open: boolean]
>();
expectTypeOf<InstanceType<typeof AutoComplete>['$slots']['searchIcon']>().toExtend<
  AutoCompleteSlots['searchIcon']
>();
const rejectedProps = () => {
  // @ts-expect-error The combobox owns its internal mode.
  const mode: ActualProps = { mode: 'multiple' };
  // @ts-expect-error Content functions are slots.
  const render: ActualProps = { optionRender: () => null };
  // @ts-expect-error Open notifications use @openChange.
  const oldCallback: ActualProps = { onDropdownVisibleChange: () => {} };
  // @ts-expect-error Search notifications are owned emits, not configuration callbacks.
  const config: ActualProps = { showSearch: { onSearch: () => {} } };
  return [mode, render, oldCallback, config];
};
void rejectedProps;
