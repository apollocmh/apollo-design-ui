/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里（*.test-d.ts 会被真执行）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties } from 'vue';
import type { Statistic, StatisticCountdown, StatisticTimer } from '../index';
import type {
  CountdownProps,
  StatisticFormatConfig,
  StatisticProps,
  StatisticRef,
  StatisticSemanticClassNames,
  StatisticSemanticStyles,
  StatisticSlots,
  StatisticTimerProps,
  StatisticTimerSlots,
  StatisticTimerValueSlotProps,
  StatisticValueSlotProps,
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
    // C8-R2：title 收窄 string（富内容走 #title 插槽）
    expectTypeOf<StatisticProps['title']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<StatisticProps['valueStyle']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('StatisticTimerProps 的 type 必填、format 可选', () => {
    expectTypeOf<StatisticTimerProps['type']>().toEqualTypeOf<TimerType>();
    expectTypeOf<StatisticTimerProps['format']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<StatisticTimerProps['onFinish']>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<StatisticTimerProps['onChange']>().toEqualTypeOf<
      ((duration: number) => void) | undefined
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
      // @ts-expect-error formatter内容回调已移除，使用#value
      const badFormatter: StatisticFormatConfig = { formatter: 'custom' };
      // @ts-expect-error Timer uses format, not ineffective numeric precision
      const badPrecision: StatisticTimerProps = { type: 'countdown', precision: 2 };
      // @ts-expect-error The VNode wrapper callback was removed outright
      const badWrapper: StatisticTimerProps = { type: 'countdown', valueRender: () => 'x' };
      return [badSlot, badType, badValue, badFormatter, badPrecision, badWrapper];
    };
    void _never;
  });

  it('数值槽提供业务值与文本，计时槽增加当前duration/type', () => {
    expectTypeOf<StatisticValueSlotProps>().toEqualTypeOf<{ value: ValueType; text: string }>();
    expectTypeOf<StatisticTimerValueSlotProps['duration']>().toEqualTypeOf<number | null>();
    expectTypeOf<StatisticTimerValueSlotProps['type']>().toEqualTypeOf<TimerType>();
    expectTypeOf<keyof StatisticSlots>().toEqualTypeOf<'title' | 'prefix' | 'suffix' | 'value'>();
    expectTypeOf<keyof StatisticTimerSlots>().toEqualTypeOf<keyof StatisticSlots>();
    expectTypeOf<StatisticValueSlotProps>().not.toHaveProperty('node');
    expectTypeOf<typeof Statistic.Timer>().toEqualTypeOf<typeof StatisticTimer>();
    expectTypeOf<typeof Statistic.Countdown>().toEqualTypeOf<typeof StatisticCountdown>();
    expectTypeOf<StatisticProps>().not.toHaveProperty('formatter');
    expectTypeOf<StatisticTimerProps>().not.toHaveProperty('valueRender');
    expectTypeOf<StatisticTimerProps>().not.toHaveProperty('precision');
    expectTypeOf<StatisticTimerProps>().not.toHaveProperty('groupSeparator');
    expectTypeOf<StatisticTimerProps>().not.toHaveProperty('decimalSeparator');
  });
});
