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
  PasswordSemanticClassNames,
  PasswordSemanticContext,
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

// ===========================================================================
// Issue #3.4 · PasswordProps 必须覆盖完整的 InputProps
// ===========================================================================

describe('Input.Password · 类型面覆盖 InputProps（Issue #3.4）', () => {
  it('★ 从 InputProps 继承（上游 `Password.d.ts:7` 就是 `extends InputProps`）', () => {
    // 这三个是「独立接口」时代最典型的缺口 —— 运行时能透传、类型层却拒绝
    expectTypeOf<InputPasswordProps['allowClear']>().toEqualTypeOf<InputProps['allowClear']>();
    expectTypeOf<InputPasswordProps['readOnly']>().toEqualTypeOf<InputProps['readOnly']>();
    expectTypeOf<InputPasswordProps['maxLength']>().toEqualTypeOf<InputProps['maxLength']>();
    expectTypeOf<InputPasswordProps['showCount']>().toEqualTypeOf<InputProps['showCount']>();
    expectTypeOf<InputPasswordProps['status']>().toEqualTypeOf<InputProps['status']>();
    expectTypeOf<InputPasswordProps['size']>().toEqualTypeOf<InputProps['size']>();
  });

  it('★ 顶层 `action` 是公开 API（`Password.d.ts:8`）', () => {
    expectTypeOf<InputPasswordProps['action']>().toEqualTypeOf<'click' | 'hover' | undefined>();
  });

  it('`classNames` 仍是 Password 自己的槽位集合（多一个 `icon`）', () => {
    // Omit 再声明的理由：PasswordSemanticClassNames 与 InputSemanticClassNames 不兼容
    expectTypeOf<InputPasswordProps['classNames']>().toEqualTypeOf<
      | PasswordSemanticClassNames
      | ((context: PasswordSemanticContext) => PasswordSemanticClassNames)
      | undefined
    >();
  });

  it('正例：Password 支持继承的有效输入属性', () => {
    const full: InputPasswordProps = {
      action: 'hover',
      allowClear: true,
      readOnly: true,
      maxLength: 12,
      showCount: true,
      status: 'error',
      placeholder: 'pw',
      prefix: 'P',
      visibilityToggle: { visible: false, onVisibleChange: () => {}, tabIndex: 0 },
    };
    expectTypeOf(full).toEqualTypeOf<InputPasswordProps>();
  });

  it('负例（永不调用的闭包）', () => {
    const _negatives = () => {
      // @ts-expect-error Password owns password/text; the ineffective type field was removed.
      const badType: InputPasswordProps = { type: 'email' };
      // @ts-expect-error Content renderers use the icon scoped slot.
      const oldIcon: InputPasswordProps = { iconRender: () => null };
      void badType;
      void oldIcon;
      // @ts-expect-error `action` 只接受 click / hover
      const badAction: InputPasswordProps = { action: 'dblclick' };
      void badAction;
      // @ts-expect-error `maxLength` 是数字
      const badMax: InputPasswordProps = { maxLength: '12' };
      void badMax;
      return [badAction, badMax];
    };
    expectTypeOf(_negatives).toBeFunction();
  });
});
