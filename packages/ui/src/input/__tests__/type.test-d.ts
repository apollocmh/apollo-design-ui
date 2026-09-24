/**
 * L3 类型测试（含负例；负例包在**永不调用的闭包**里 —— *.test-d.ts 会被
 * vitest 真执行，CHECKLIST 三）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { SizeType } from '../../config-provider/size-context';
import type { InputStatus } from '../../space/statusUtils';
import type {
  AllowClearProp,
  InputFocusOptions,
  InputGroupProps,
  InputPasswordProps,
  InputProps,
  InputRef,
  InputSemanticClassNames,
  InputSemanticStyles,
  ShowCountProp,
  TextAreaProps,
  TextAreaRef,
} from '../interface';

describe('Input · L3 类型', () => {
  it('Props 面关键字段', () => {
    expectTypeOf<InputProps['value']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<InputProps['size']>().toEqualTypeOf<SizeType | undefined>();
    expectTypeOf<InputProps['variant']>().toEqualTypeOf<
      'outlined' | 'borderless' | 'filled' | 'underlined' | undefined
    >();
    expectTypeOf<InputProps['status']>().toEqualTypeOf<InputStatus | undefined>();
    expectTypeOf<InputProps['maxLength']>().toEqualTypeOf<number | undefined>();
  });

  it('allowClear / showCount 双形态', () => {
    expectTypeOf<AllowClearProp>().toEqualTypeOf<
      boolean | { clearIcon?: VNodeChild; disabled?: boolean }
    >();
    expectTypeOf<ShowCountProp>().toEqualTypeOf<
      | boolean
      | { formatter: (info: { value: string; count: number; maxLength?: number }) => unknown }
    >();
  });

  it('语义槽键（root/prefix/suffix/input/count/clear）', () => {
    expectTypeOf<keyof InputSemanticClassNames>().toEqualTypeOf<
      | 'root'
      | 'prefix'
      | 'suffix'
      | 'clear'
      | 'input'
      | 'count'
      | 'affixWrapper'
      | 'wrapper'
      | 'groupWrapper'
      | 'variant'
    >();
    expectTypeOf<keyof InputSemanticStyles>().toEqualTypeOf<
      'root' | 'prefix' | 'suffix' | 'clear' | 'input' | 'count' | 'affixWrapper' | 'wrapper'
    >();
  });

  it('Ref 面（focus/blur/select）', () => {
    expectTypeOf<InputRef['focus']>().toEqualTypeOf<(option?: InputFocusOptions) => void>();
    expectTypeOf<InputRef['blur']>().toEqualTypeOf<() => void>();
    expectTypeOf<InputRef['select']>().toEqualTypeOf<() => void>();
  });

  it('TextArea 专有（autoSize/rows）', () => {
    expectTypeOf<TextAreaProps['autoSize']>().toEqualTypeOf<
      boolean | { minRows?: number; maxRows?: number } | undefined
    >();
    expectTypeOf<TextAreaProps['rows']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<keyof TextAreaRef>().toEqualTypeOf<
      'focus' | 'blur' | 'resizableTextArea' | 'nativeElement'
    >();
  });

  it('Password 专有（visibilityToggle）', () => {
    expectTypeOf<InputPasswordProps['visibilityToggle']>().toEqualTypeOf<
      | boolean
      | {
          visible?: boolean;
          onVisibleChange?: (visible: boolean) => void;
          tabIndex?: number;
          action?: 'click' | 'hover';
        }
      | undefined
    >();
  });

  it('Group（deprecated）面', () => {
    expectTypeOf<InputGroupProps['size']>().toEqualTypeOf<SizeType | undefined>();
    expectTypeOf<InputGroupProps['compact']>().toEqualTypeOf<boolean | undefined>();
  });

  it('负例（永不调用的闭包）', () => {
    const _negatives = () => {
      // size 不接受 'huge'
      // @ts-expect-error size 不接受 'huge'
      const badSize: InputProps['size'] = 'huge';
      void badSize;
      // variant 不接受 'dashed'
      // @ts-expect-error variant 不接受 'dashed'
      const badVariant: InputProps['variant'] = 'dashed';
      void badVariant;
      // status 不接受 'info'
      // @ts-expect-error status 不接受 'info'
      const badStatus: InputProps['status'] = 'info';
      void badStatus;
      // rows 是 number
      // @ts-expect-error rows 不接受字符串
      const badRows: TextAreaProps['rows'] = '4';
      void badRows;
      // visibilityToggle 不接受字符串
      // @ts-expect-error visibilityToggle 不接受 'yes'
      const badToggle: InputPasswordProps['visibilityToggle'] = 'yes';
      void badToggle;
    };
    void _negatives;
    expectTypeOf(_negatives).toBeFunction();
  });
});
