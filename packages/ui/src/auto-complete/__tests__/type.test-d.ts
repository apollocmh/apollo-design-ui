/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type { AutoCompleteProps, AutoCompleteRef, DataSourceItemObject } from '../interface';

describe('AutoComplete · 类型', () => {
  it('value/defaultValue 是 SelectValue（不含 labelInValue —— antd omit）', () => {
    expectTypeOf<AutoCompleteProps['value']>().toEqualTypeOf<
      import('../../select/interface').SelectValue
    >();
  });

  it('dataSource 元素：DataSourceItemObject | unknown（deprecated）', () => {
    expectTypeOf<DataSourceItemObject>().toEqualTypeOf<{ value: string; text: string }>();
  });

  it('语义面：root/prefix/input/placeholder/content/clear/popup（无 item 系）', () => {
    const cn: AutoCompleteProps['classNames'] = {
      root: 'r',
      input: 'i',
      popup: { root: 'p' },
    };
    expectTypeOf(cn).not.toBeNever();
  });

  it('回调面（props 形态）', () => {
    expectTypeOf<AutoCompleteProps['onChange']>().toEqualTypeOf<
      ((value: import('../../select/interface').SelectValue, option: unknown) => void) | undefined
    >();
    expectTypeOf<AutoCompleteProps['onOpenChange']>().toEqualTypeOf<
      ((open: boolean) => void) | undefined
    >();
  });

  it('AutoCompleteRef：focus/blur/scrollTo', () => {
    const ref: AutoCompleteRef = {
      focus: () => undefined,
      blur: () => undefined,
      scrollTo: () => undefined,
    };
    expectTypeOf(ref).not.toBeNever();
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
