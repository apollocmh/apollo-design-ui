/** Public TimePicker types; negative examples remain inside functions that are never invoked. */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type {
  DatePickerDate,
  DatePickerPanelMode,
  DatePickerStatus,
  PickerPopupSemanticClassNames,
} from '../../date-picker/interface';
import type { TimePicker } from '../index';
import type {
  TimePickerEmits,
  TimePickerExpose,
  TimePickerProps,
  TimePickerSemanticClassNames,
  TimePickerSemanticStyles,
  TimePickerSemanticValue,
  TimePickerSlots,
  TimePickerValue,
  TimeRangePickerExpose,
  TimeRangePickerProps,
} from '../interface';

describe('TimePicker · Props 类型', () => {
  it('判据 1：`picker` / `showTime` **不在** `TimePickerProps` 里', () => {
    expectTypeOf<TimePickerProps>().not.toHaveProperty('picker');
    expectTypeOf<TimePickerProps>().not.toHaveProperty('showTime');
  });

  it('🚨 判据 1：`multiple` 的类型是 **`false`**（不是 `boolean`）', () => {
    // 上游 `PickerPropsWithMultiple<DateType, GenericTimePickerProps<DateType>>` 的
    // `IsMultiple` 默认实参就是 `false` ⇒ 类型层禁止多选。
    expectTypeOf<TimePickerProps['multiple']>().toEqualTypeOf<false | undefined>();
  });

  it('判据 2：`value` / `defaultValue` 是**单值**', () => {
    expectTypeOf<TimePickerProps['value']>().toEqualTypeOf<TimePickerValue | undefined>();
    expectTypeOf<TimePickerValue>().toEqualTypeOf<DatePickerDate | null>();
    expectTypeOf<TimePickerProps['defaultValue']>().toEqualTypeOf<
      DatePickerDate | null | undefined
    >();
  });

  it('判据 2：`onSelect` 是**单参**签名（date-picker 的是单值或数组）', () => {
    expectTypeOf<TimePickerEmits['select']>().toEqualTypeOf<(value: DatePickerDate) => void>();
  });

  it('继承来的常用 props 形态不变', () => {
    expectTypeOf<TimePickerProps['status']>().toEqualTypeOf<DatePickerStatus | undefined>();
    expectTypeOf<TimePickerProps['popupClassName']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TimePickerProps['popupStyle']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<TimePickerSlots['extraFooter']>().not.toBeNever();
  });

  it('判据 3：语义槽是「对象 | 函数」的联合，且 `popup` 允许 string', () => {
    expectTypeOf<TimePickerProps['classNames']>().toEqualTypeOf<
      TimePickerSemanticValue<TimePickerSemanticClassNames> | undefined
    >();
    expectTypeOf<TimePickerProps['styles']>().toEqualTypeOf<
      TimePickerSemanticValue<TimePickerSemanticStyles> | undefined
    >();
    // ⚠️ `popup` 允许 **string 旧写法**（等价 `popup.root`）—— 本仓在归一阶段转成对象形态。
    expectTypeOf<TimePickerSemanticClassNames['popup']>().toEqualTypeOf<
      string | PickerPopupSemanticClassNames | undefined
    >();
  });

  it('extraFooter is a scoped native slot and addon is not a prop', () => {
    expectTypeOf<NonNullable<TimePickerSlots['extraFooter']>>().toEqualTypeOf<
      (scope: { mode: DatePickerPanelMode }) => VNodeChild
    >();
    expectTypeOf<TimePickerProps>().not.toHaveProperty('addon');
  });
});

describe('TimePicker · RangePicker 的 props', () => {
  it('the fixed time axis excludes calendar mode declarations', () => {
    expectTypeOf<TimeRangePickerProps>().not.toHaveProperty('picker');
    expectTypeOf<TimeRangePickerProps>().not.toHaveProperty('showTime');
    expectTypeOf<TimeRangePickerProps>().not.toHaveProperty('mode');
    expectTypeOf<TimePickerProps>().not.toHaveProperty('mode');
    expectTypeOf<TimePickerEmits>().not.toHaveProperty('update:mode');
  });

  it('判据 4：`placeholder` 是二元组、`disabled` 收元组', () => {
    expectTypeOf<TimeRangePickerProps['placeholder']>().toEqualTypeOf<
      [string, string] | undefined
    >();
    expectTypeOf<TimeRangePickerProps['disabled']>().toEqualTypeOf<
      boolean | [boolean, boolean] | undefined
    >();
  });

  it('判据 4：`popupClassName` / `popupStyle` 被**重新声明**（告警行为与单个相反）', () => {
    expectTypeOf<TimeRangePickerProps['popupClassName']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TimeRangePickerProps['popupStyle']>().toEqualTypeOf<CSSProperties | undefined>();
  });
});

describe('TimePicker · emits / expose', () => {
  it('emits 与 `DatePickerEmits` 同形（`multiple` 恒 false ⇒ 数组分支不可达）', () => {
    expectTypeOf<TimePickerEmits>().toHaveProperty('change');
    expectTypeOf<TimePickerEmits>().toHaveProperty('update:value');
    expectTypeOf<TimePickerEmits>().toHaveProperty('ok');
    expectTypeOf<TimePickerEmits>().toHaveProperty('clear');
    expectTypeOf<TimePickerEmits>().toHaveProperty('openChange');
  });

  it('expose forwards the actual nullable shared picker handles', () => {
    expectTypeOf<TimePickerExpose['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<TimePickerExpose['focus']>().toEqualTypeOf<(options?: FocusOptions) => void>();
    expectTypeOf<TimeRangePickerExpose['startInput']>().toEqualTypeOf<HTMLInputElement | null>();
  });
});

describe('TimePicker · 复合组件（类型层）', () => {
  it('判据 5：`TimePicker.RangePicker` 可见，且两者都带 `install`', () => {
    expectTypeOf<typeof TimePicker>().toHaveProperty('RangePicker');
    expectTypeOf<typeof TimePicker>().toHaveProperty('install');
  });
});

describe('TimePicker · 负例（永不调用的闭包内）', () => {
  it('被 `Omit` 掉的键写进 props 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `picker` 恒为 `'time'`，不在 `TimePickerProps` 里
      const badPicker: TimePickerProps = { picker: 'date' };
      // @ts-expect-error `showTime` 被剔除（时间轴没有二级面板）
      const badShowTime: TimePickerProps = { showTime: true };
      void [badPicker, badShowTime];
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('🚨 `multiple` 只接受 `false`（上游 `IsMultiple` 默认实参）', () => {
    const _never = () => {
      // @ts-expect-error TimePicker 不支持多选
      const bad: TimePickerProps = { multiple: true };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('`value` 不接受数组（已被收窄成单值）', () => {
    const _never = () => {
      // @ts-expect-error 单值 picker 不接受数组值
      const bad: TimePickerProps = { value: [] };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('`onSelect` 只收单参（写双参会因参数逆变被拒）', () => {
    const _never = () => {
      // @ts-expect-error 收窄成单值后，双参回调不可赋值
      const bad: TimePickerProps = { onSelect: (_a: DatePickerDate, _b: string) => {} };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('范围版的 `placeholder` 不收单字符串', () => {
    const _never = () => {
      // @ts-expect-error 范围版必须是二元组
      const bad: TimeRangePickerProps = { placeholder: 'x' };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });
});
