/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里（*.test-d.ts 会被真执行）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type {
  CountdownProps,
  StatisticFormatConfig,
  StatisticFormatter,
  StatisticProps,
  StatisticRef,
  StatisticSemanticClassNames,
  StatisticSemanticStyles,
  StatisticTimerProps,
  TimerType,
  ValueType,
} from '../interface';

describe('Statistic · Props 类型', () => {
  it('valueType 是 number | string', () => {
    expectTypeOf<ValueType>().toEqualTypeOf<number | string>();
  });

  it('TimerType 是 countdown | countup', () => {
    expectTypeOf<TimerType>().toEqualTypeOf<'countdown' | 'countup'>();
  });

  it('语义槽位七槽齐备', () => {
    expectTypeOf<keyof StatisticSemanticClassNames>().toEqualTypeOf<
      'root' | 'header' | 'title' | 'content' | 'value' | 'prefix' | 'suffix'
    >();
    expectTypeOf<keyof StatisticSemanticStyles>().toEqualTypeOf<
      'root' | 'header' | 'title' | 'content' | 'value' | 'prefix' | 'suffix'
    >();
  });

  it('Ref 的 nativeElement 可空（PLATFORM 差异的类型体现）', () => {
    expectTypeOf<StatisticRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('StatisticProps 继承 FormatConfig', () => {
    expectTypeOf<StatisticProps['decimalSeparator']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<StatisticProps['groupSeparator']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<StatisticProps['precision']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<StatisticProps['title']>().toEqualTypeOf<VNodeChild | undefined>();
    expectTypeOf<StatisticProps['valueStyle']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('StatisticTimerProps 的 type 必填、format 可选', () => {
    expectTypeOf<StatisticTimerProps['type']>().toEqualTypeOf<TimerType>();
    expectTypeOf<StatisticTimerProps['format']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<StatisticTimerProps['onFinish']>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<StatisticTimerProps['onChange']>().toEqualTypeOf<
      ((value?: number | string) => void) | undefined
    >();
  });

  it('CountdownProps 不含 type（由实现固定注入）', () => {
    expectTypeOf<CountdownProps>().not.toHaveProperty('type');
  });

  it('★ 负例（永不调用的闭包内）', () => {
    const _never = () => {
      // @ts-expect-error 语义槽位没有 footer
      const badSlot: StatisticSemanticClassNames = { footer: 'x' };
      // @ts-expect-error Timer 的 type 只有两个字面量
      const badType: StatisticTimerProps = { type: 'stopwatch' };
      // @ts-expect-error value 不接受布尔
      const badValue: StatisticProps = { value: true };
      // @ts-expect-error formatter 的字符串枚举不含 'custom'
      const badFormatter: StatisticFormatConfig = { formatter: 'custom' };
      return [badSlot, badType, badValue, badFormatter];
    };
    void _never;
  });

  it('formatter 函数形态返回 VNodeChild', () => {
    const fn: StatisticFormatter = (value) => `v=${value}`;
    expectTypeOf(fn).parameter(0).toEqualTypeOf<ValueType>();
    expectTypeOf(fn('x')).toEqualTypeOf<VNodeChild>();
  });
});
