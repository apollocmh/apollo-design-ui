/**
 * L3 类型测试 —— `@apollo-design/picker` 的公共类型面。
 *
 * TESTING.md T7 要求：**必须包含负例**。负例用 `@ts-expect-error` 表达，
 * 语义是「此处**应当**报错」；若哪天类型放宽导致这里不再报错，
 * `@ts-expect-error` 自身会变成错误，测试即失败。
 *
 * ⚠️⚠️ `*.test-d.ts` **会被 vitest 实际执行**（不只是类型检查），
 *      所以每个负例在运行期也必须是安全的。会真的崩掉的非法调用一律放进
 *      **永不执行**的闭包里，只留给 TS 看（PITFALLS 22 / 74）。
 *
 * 本文件只做类型层断言，不重复 L1 已经覆盖的运行期行为。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import type {
  DisabledDate,
  GenerateConfig,
  InternalMode,
  PanelCell,
  PanelMode,
  PickerLocale,
  PickerMode,
} from '../types';
import {
  buildPanelCells,
  dayjsGenerateConfig,
  fillIndex,
  fillTime,
  findValidateTime,
  formatValue,
  getMaskRange,
  getPanelGeometry,
  getQuarter,
  getRowFormat,
  getRowStartDate,
  getWeekNumber,
  getWeekStartDate,
  isInRange,
  isSame,
  isSameDate,
  isSameWeek,
  isWeekMode,
  leftPad,
  offsetCellValue,
  orderDates,
  pickProps,
  toArray,
  validateRangeSubmit,
} from '../index';

/** 永不执行 —— 只为了让 TS 检查里面的调用。 */
function neverCalled(fn: () => void): void {
  void fn;
}

describe('GenerateConfig<Dayjs> 的方法面', () => {
  it('dayjsGenerateConfig 是 GenerateConfig<Dayjs>', () => {
    expectTypeOf(dayjsGenerateConfig).toEqualTypeOf<GenerateConfig<Dayjs>>();
    expectTypeOf(dayjsGenerateConfig.getYear).toEqualTypeOf<(value: Dayjs) => number>();
    expectTypeOf(dayjsGenerateConfig.addMonth).toEqualTypeOf<
      (value: Dayjs, diff: number) => Dayjs
    >();
    expectTypeOf(dayjsGenerateConfig.locale.getWeek).toEqualTypeOf<
      (locale: string, value: Dayjs) => number
    >();
  });

  it('locale.parse 返回 Dayjs | null（不是 Dayjs）', () => {
    expectTypeOf(dayjsGenerateConfig.locale.parse).returns.toEqualTypeOf<Dayjs | null>();

    neverCalled(() => {
      // @ts-expect-error 可能解析失败 ⇒ 必须处理 null
      const bad: Dayjs = dayjsGenerateConfig.locale.parse('en_US', 'x', ['YYYY']);
      void bad;
    });
  });
});

describe('模式联合类型', () => {
  it('PanelMode / InternalMode / PickerMode 的差集关系', () => {
    expectTypeOf<PickerMode>().toExtend<PanelMode>();
    expectTypeOf<PanelMode>().toExtend<InternalMode>();

    neverCalled(() => {
      // @ts-expect-error decade 不是 PickerMode（它只是中间层）
      const bad: PickerMode = 'decade';
      void bad;
      // @ts-expect-error 不存在的模式
      const bad2: PanelMode = 'century';
      void bad2;
    });
  });

  it('isWeekMode 只收 PanelMode', () => {
    expectTypeOf(isWeekMode('week')).toEqualTypeOf<boolean>();
    neverCalled(() => {
      // @ts-expect-error 不接受任意字符串
      isWeekMode('nope');
    });
  });
});

describe('日期语义函数的签名', () => {
  it('isSame 收 PickerLocale 对象 + InternalMode', () => {
    const locale: PickerLocale = { locale: 'zh_CN' };
    expectTypeOf(isSame(dayjsGenerateConfig, locale, null, null, 'date')).toEqualTypeOf<
      boolean
    >();
    // 'datetime' 是 InternalMode 才有 ⇒ 能传
    expectTypeOf(
      isSame(dayjsGenerateConfig, locale, null, null, 'datetime'),
    ).toEqualTypeOf<boolean>();

    neverCalled(() => {
      // @ts-expect-error 第一个参数必须是 GenerateConfig
      isSame({}, locale, null, null, 'date');
      // @ts-expect-error 不存在的模式
      isSame(dayjsGenerateConfig, locale, null, null, 'nope');
    });
  });

  it('⭐ isSameWeek 收**裸字符串** locale（与 isSame 的不对称是照抄上游）', () => {
    expectTypeOf(isSameWeek(dayjsGenerateConfig, 'zh_CN', null, null)).toEqualTypeOf<
      boolean
    >();
    neverCalled(() => {
      // @ts-expect-error 这里要的是 locale 字符串，不是 PickerLocale 对象
      isSameWeek(dayjsGenerateConfig, { locale: 'zh_CN' }, null, null);
    });
  });

  it('null / undefined 都是合法入参（NullableDateType）', () => {
    expectTypeOf(isSameDate(dayjsGenerateConfig, null, undefined)).toEqualTypeOf<boolean>();
    expectTypeOf(isInRange(dayjsGenerateConfig, null, null, null)).toEqualTypeOf<boolean>();
  });

  it('getWeekStartDate 的参数顺序是 (locale, generateConfig, value)', () => {
    expectTypeOf(
      getWeekStartDate('zh_CN', dayjsGenerateConfig, dayjs()),
    ).toEqualTypeOf<Dayjs>();

    neverCalled(() => {
      // @ts-expect-error 顺序反了
      getWeekStartDate(dayjsGenerateConfig, 'zh_CN', dayjs());
    });
  });

  it('formatValue 的 format 可以是字符串或函数', () => {
    const locale: PickerLocale = { locale: 'zh_CN' };
    expectTypeOf(
      formatValue(dayjs(), { generateConfig: dayjsGenerateConfig, locale, format: 'YYYY' }),
    ).toEqualTypeOf<string>();
    expectTypeOf(
      formatValue(dayjs(), {
        generateConfig: dayjsGenerateConfig,
        locale,
        format: (value: Dayjs) => String(value.year()),
      }),
    ).toEqualTypeOf<string>();
  });

  it('fillTime 的 time 可省', () => {
    expectTypeOf(fillTime(dayjsGenerateConfig, dayjs())).toEqualTypeOf<Dayjs>();
    expectTypeOf(fillTime(dayjsGenerateConfig, dayjs(), dayjs())).toEqualTypeOf<Dayjs>();
  });

  it('getQuarter / getWeekNumber 返回 number', () => {
    expectTypeOf(getQuarter(dayjsGenerateConfig, dayjs())).toEqualTypeOf<number>();
    expectTypeOf(getWeekNumber(dayjsGenerateConfig, 'zh_CN', dayjs())).toEqualTypeOf<
      number
    >();
  });
});

describe('misc-util 的签名', () => {
  it('leftPad 收 string | number', () => {
    expectTypeOf(leftPad(1, 2)).toEqualTypeOf<string>();
    expectTypeOf(leftPad('1', 2, 'x')).toEqualTypeOf<string>();
    neverCalled(() => {
      // @ts-expect-error 不接受 null
      leftPad(null, 2);
    });
  });

  it('toArray 把可空单值收成数组', () => {
    expectTypeOf(toArray<string>(null)).toEqualTypeOf<string[]>();
    expectTypeOf(toArray<string>(undefined)).toEqualTypeOf<string[]>();
    expectTypeOf(toArray<string>('a')).toEqualTypeOf<string[]>();
  });

  it('fillIndex 的入参与返回值同元素类型', () => {
    expectTypeOf(fillIndex([1, 2], 0, 9)).toEqualTypeOf<number[]>();
    neverCalled(() => {
      // @ts-expect-error 值类型必须与数组元素一致
      fillIndex([1, 2], 0, 'x');
    });
  });

  it('pickProps 返回 Partial<T>', () => {
    expectTypeOf(pickProps({ a: 1, b: 'x' })).toEqualTypeOf<{ a?: number; b?: string }>();
    neverCalled(() => {
      // @ts-expect-error keys 必须是 props 的键
      pickProps({ a: 1 }, ['zzz']);
    });
  });

  it('getRowFormat 可能返回 undefined（locale 的键全是可选的）', () => {
    expectTypeOf(getRowFormat('date', { locale: 'zh_CN' })).toEqualTypeOf<
      string | undefined
    >();
  });
});

describe('panel 的签名', () => {
  it('getPanelGeometry 返回 PanelGeometry<Dayjs>', () => {
    const geo = getPanelGeometry('date', {
      generateConfig: dayjsGenerateConfig,
      locale: { locale: 'zh_CN' },
      pickerValue: dayjs(),
      now: dayjs(),
    });
    expectTypeOf(geo.rowNum).toEqualTypeOf<number>();
    expectTypeOf(geo.getCellDate).toEqualTypeOf<(base: Dayjs, offset: number) => Dayjs>();
    expectTypeOf(getRowStartDate(geo, 0)).toEqualTypeOf<Dayjs>();
  });

  it('buildPanelCells 返回二维数组', () => {
    const geo = getPanelGeometry('month', {
      generateConfig: dayjsGenerateConfig,
      locale: { locale: 'zh_CN' },
      pickerValue: dayjs(),
      now: dayjs(),
    });
    const rows = buildPanelCells(geo, {
      generateConfig: dayjsGenerateConfig,
      locale: { locale: 'zh_CN' },
      mode: 'month',
      now: dayjs(),
      values: [],
    });
    expectTypeOf(rows).toEqualTypeOf<PanelCell<Dayjs>[][]>();
    expectTypeOf(rows[0]).toEqualTypeOf<PanelCell<Dayjs>[] | undefined>();
  });

  it('PanelCell 的状态位全是 boolean', () => {
    expectTypeOf<PanelCell<Dayjs>['selected']>().toEqualTypeOf<boolean>();
    expectTypeOf<PanelCell<Dayjs>['inRange']>().toEqualTypeOf<boolean>();
    expectTypeOf<PanelCell<Dayjs>['title']>().toEqualTypeOf<string | undefined>();
  });
});

describe('range / keyboard / time 的签名', () => {
  it('orderDates 返回同元素类型数组', () => {
    expectTypeOf(orderDates([dayjs()], dayjsGenerateConfig)).toEqualTypeOf<Dayjs[]>();
  });

  it('validateRangeSubmit 返回四字段结果', () => {
    const out = validateRangeSubmit(
      {
        generateConfig: dayjsGenerateConfig,
        locale: { locale: 'zh_CN' },
        picker: 'date',
        order: false,
        disabled: [false, false],
        nullValue: false,
      },
      dayjs(),
      dayjs(),
      () => false,
    );
    expectTypeOf(out.passed).toEqualTypeOf<boolean>();
    expectTypeOf(out.emptyOk).toEqualTypeOf<boolean>();
    expectTypeOf(out.orderOk).toEqualTypeOf<boolean>();
    expectTypeOf(out.datesOk).toEqualTypeOf<boolean>();
  });

  it('disabled 是长度 2 的元组', () => {
    neverCalled(() => {
      validateRangeSubmit(
        {
          generateConfig: dayjsGenerateConfig,
          locale: { locale: 'zh_CN' },
          picker: 'date',
          order: false,
          // @ts-expect-error disabled 必须是 [boolean, boolean]
          disabled: [false],
          nullValue: false,
        },
        dayjs(),
        dayjs(),
        () => false,
      );
    });
  });

  it('getMaskRange 返回可能 undefined；offsetCellValue 返回 string | undefined', () => {
    expectTypeOf(getMaskRange('MM')).toEqualTypeOf<readonly [number, number, number?] | undefined>();
    expectTypeOf(offsetCellValue('5', 'MM', 1)).toEqualTypeOf<string | undefined>();
  });

  it('findValidateTime 的档位表是只读数组', () => {
    expectTypeOf(
      findValidateTime(
        dayjs(),
        () => [{ value: 0, disabled: false }],
        () => [{ value: 0, disabled: false }],
        () => [{ value: 0, disabled: false }],
        () => [{ value: 0, disabled: false }],
        dayjsGenerateConfig,
      ),
    ).toEqualTypeOf<Dayjs>();
  });

  it('DisabledDate 的 info 带 from（区间校验结束位时用）', () => {
    const fn: DisabledDate<Dayjs> = (_date, info) => {
      expectTypeOf(info.type).toEqualTypeOf<PanelMode>();
      expectTypeOf(info.from).toEqualTypeOf<Dayjs | undefined>();
      return false;
    };
    expectTypeOf(fn).toEqualTypeOf<DisabledDate<Dayjs>>();
  });
});
