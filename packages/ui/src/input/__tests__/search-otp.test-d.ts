/**
 * Input.Search / Input.OTP 的 L3 类型契约（含负例）。
 */
import { describe, expectTypeOf, it } from 'vitest';
import type { InputOTP, InputSearch } from '../index';
import type { InputSearchProps, OTPProps, OTPRef } from '../interface';

describe('Input.Search / OTP · L3 类型', () => {
  it('Search Props 面关键字段', () => {
    const props: InputSearchProps = {
      enterButton: true,
      loading: true,
      onSearch: (value, _event, info) => {
        expectTypeOf(value).toEqualTypeOf<string>();
        expectTypeOf(info?.source).toEqualTypeOf<'clear' | 'input' | undefined>();
      },
    };
    expectTypeOf<NonNullable<InputSearchProps['onSearch']>>().toBeFunction();
    expectTypeOf(props.loading).toEqualTypeOf<boolean | undefined>();
    expectTypeOf<InstanceType<typeof InputSearch>['$props']>().toHaveProperty('enterButton');
  });

  it('OTP Props / Ref 面关键字段', () => {
    const props: OTPProps = {
      length: 6,
      mask: true,
      separator: '-',
      onChange: (value) => {
        expectTypeOf(value).toEqualTypeOf<string>();
      },
      onInput: (value) => {
        expectTypeOf(value).toEqualTypeOf<string[]>();
      },
    };
    expectTypeOf(props.length).toEqualTypeOf<number | undefined>();
    expectTypeOf<InstanceType<typeof InputOTP>['$props']>().toHaveProperty('length');
    expectTypeOf<OTPRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('负例：length 必须是 number', () => {
    // @ts-expect-error OTP.length 必须是 number
    const badLength: OTPProps = { length: '6' };
    expectTypeOf(badLength).toMatchTypeOf<OTPProps>();
  });
});
