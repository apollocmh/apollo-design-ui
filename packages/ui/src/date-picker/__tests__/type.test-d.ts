/**
 * L3 类型测试 —— 钉住 DatePicker 的**对外契约形状**（G2 的 `interface.ts` 定稿）。
 *
 * 负例用 `@ts-expect-error`（`*.test-d.ts` 会被 vitest **真执行**，所以负例不能是
 * 「不编译的死代码」，而是「必然报错但被显式豁免」的赋值 —— 运行时的 `const x: T = v`
 * 只是普通赋值，不会抛）。
 *
 * ── 覆盖面 ────────────────────────────────────────────────────────────────────
 *
 *   - 值域：`picker` / `mode` / `size` / `variant` / `status` / `placement`
 *   - 值形态：`SingleValue`（含 `null` = 受控且空）/ `RangeValue`（`null` 与 `undefined`
 *     **语义不同**）/ `NoUndefinedRangeValue`
 *   - `format` 的三形态（`string | string[] | { format, type: 'mask' }`）+ 函数形态
 *   - 语义槽 **4 平铺 + 7 嵌套**，且 `popup` 允许 **string 或对象**（与 tabs 相反！）
 *   - emits 载荷：`update:value` / `change` / `calendarChange`（**3 参**）/
 *     `keydown`（**2 参**，第二参是 `preventDefault`）
 *   - `expose`：`DatePickerExpose` 与 `RangePickerExpose` 的 **`focus` 签名不同**
 *   - 单值与范围的**差异面**：`showTime` / `presets` / `placeholder` / `disabled` / `separator`
 *   - 负例：`'datetime'` 不是 `picker`/`mode` 的合法值；`status` 只有两档；
 *     单值不接受两端元组的 `disabled`；`separator` 只在范围版
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type {
  CellRender,
  CellRenderInfo,
  CustomFormat,
  CustomTagProps,
  DatePickerDate,
  DatePickerEmits,
  DatePickerExpose,
  DatePickerFormat,
  DatePickerMode,
  DatePickerPanelMode,
  DatePickerPlacement,
  DatePickerProps,
  DatePickerSemanticClassNames,
  DatePickerSemanticStyles,
  DatePickerSemanticValue,
  DatePickerSize,
  DatePickerSlots,
  DatePickerStatus,
  DatePickerVariant,
  DisabledDate,
  DisabledTimes,
  FormatType,
  LimitDate,
  MaskFormatConfig,
  NoUndefinedRangeValue,
  OpenConfig,
  PickerCommonProps,
  PickerPopupSemanticClassNames,
  PurePanelProps,
  RangePickerEmits,
  RangePickerExpose,
  RangePickerProps,
  RangeTimeProps,
  RangeValue,
  RangeValueDate,
  SharedTimeProps,
  SingleValue,
  ValueDate,
} from '../interface';

describe('DatePicker · L3 值域与联合', () => {
  it('`picker` 是 `PickerMode`（**不含** `decade` 与 `datetime`）', () => {
    expectTypeOf<DatePickerProps['picker']>().toEqualTypeOf<DatePickerMode | undefined>();
    expectTypeOf<DatePickerMode>().toEqualTypeOf<
      'time' | 'date' | 'week' | 'month' | 'quarter' | 'year'
    >();
  });

  it('`mode` 是 `PanelMode`（**含** `decade`，它是中间层）', () => {
    expectTypeOf<DatePickerProps['mode']>().toEqualTypeOf<DatePickerPanelMode | undefined>();
    expectTypeOf<DatePickerPanelMode>().toEqualTypeOf<
      'time' | 'date' | 'week' | 'month' | 'quarter' | 'year' | 'decade'
    >();
  });

  it('`size` / `variant` / `status` / `placement` 都是字面量联合', () => {
    expectTypeOf<DatePickerSize>().toEqualTypeOf<'small' | 'medium' | 'middle' | 'large'>();
    expectTypeOf<DatePickerVariant>().toEqualTypeOf<
      'outlined' | 'borderless' | 'filled' | 'underlined'
    >();
    // ⚠️ 只有两档 —— 不含 `success` / `validating`
    expectTypeOf<DatePickerStatus>().toEqualTypeOf<'error' | 'warning'>();
    expectTypeOf<DatePickerPlacement>().toEqualTypeOf<
      'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
    >();
  });

  it('`value` 的三形态：单值 / 数组（`multiple`）/ `null`（受控且空）', () => {
    expectTypeOf<SingleValue>().toEqualTypeOf<DatePickerDate | DatePickerDate[] | null>();
    expectTypeOf<DatePickerProps['value']>().toEqualTypeOf<SingleValue | undefined>();
  });

  it('`RangeValue` 的 `null` 与 `undefined` **语义不同**', () => {
    expectTypeOf<RangeValue>().toEqualTypeOf<
      [start: DatePickerDate | null | undefined, end: DatePickerDate | null | undefined]
    >();
    // `onChange` 的载荷**不允许** `undefined`
    expectTypeOf<NoUndefinedRangeValue>().toEqualTypeOf<
      [start: DatePickerDate | null, end: DatePickerDate | null]
    >();
  });
});

describe('DatePicker · L3 format 的三形态', () => {
  it('`FormatType` = `string | CustomFormat`（**函数形态是契约的一部分**）', () => {
    expectTypeOf<FormatType>().toEqualTypeOf<string | CustomFormat>();
    expectTypeOf<CustomFormat>().toEqualTypeOf<(value: DatePickerDate) => string>();
  });

  it('`DatePickerFormat` = 单值 | 数组 | 掩码对象', () => {
    expectTypeOf<DatePickerFormat>().toEqualTypeOf<FormatType | FormatType[] | MaskFormatConfig>();
    expectTypeOf<MaskFormatConfig>().toEqualTypeOf<{ format: string; type?: 'mask' }>();
  });

  it('四种写法都能赋值给 `format`', () => {
    const a: DatePickerProps['format'] = 'YYYY-MM-DD';
    const b: DatePickerProps['format'] = ['YYYY-MM-DD', 'YYYY/MM/DD'];
    const c: DatePickerProps['format'] = { format: 'YYYY-MM-DD', type: 'mask' };
    const d: DatePickerProps['format'] = (date) => String(date);
    expectTypeOf(a).not.toBeNever();
    expectTypeOf(b).not.toBeNever();
    expectTypeOf(c).not.toBeNever();
    expectTypeOf(d).not.toBeNever();
  });
});

describe('DatePicker · L3 语义槽（4 平铺 + 7 嵌套）', () => {
  it('4 个平铺键', () => {
    expectTypeOf<DatePickerSemanticClassNames['root']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<DatePickerSemanticClassNames['prefix']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<DatePickerSemanticClassNames['input']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<DatePickerSemanticClassNames['suffix']>().toEqualTypeOf<string | undefined>();
  });

  it('🚨 `popup` 允许 **string 或对象**（与 tabs 的「只能是对象」相反）', () => {
    expectTypeOf<DatePickerSemanticClassNames['popup']>().toEqualTypeOf<
      string | PickerPopupSemanticClassNames | undefined
    >();
    const asString: DatePickerSemanticClassNames = { popup: 'c-popup' };
    const asObject: DatePickerSemanticClassNames = { popup: { root: 'c-popup' } };
    expectTypeOf(asString).not.toBeNever();
    expectTypeOf(asObject).not.toBeNever();
  });

  it('嵌套的 7 个子槽逐键可选', () => {
    expectTypeOf<PickerPopupSemanticClassNames>().toEqualTypeOf<{
      root?: string;
      header?: string;
      body?: string;
      content?: string;
      item?: string;
      footer?: string;
      container?: string;
    }>();
  });

  it('`styles.popup` 只有对象形态（7 个键都是 `CSSProperties`）', () => {
    expectTypeOf<NonNullable<DatePickerSemanticStyles['popup']>['root']>().toEqualTypeOf<
      CSSProperties | undefined
    >();
    expectTypeOf<NonNullable<DatePickerSemanticStyles['popup']>['header']>().toEqualTypeOf<
      CSSProperties | undefined
    >();
  });

  it('语义化输入支持**函数形态**（`GenerateSemantic` 的等价物）', () => {
    expectTypeOf<
      DatePickerSemanticValue<DatePickerSemanticClassNames, PickerCommonProps>
    >().toEqualTypeOf<
      | DatePickerSemanticClassNames
      | ((info: { props: PickerCommonProps }) => DatePickerSemanticClassNames)
    >();
  });
});

describe('DatePicker · L3 emits 载荷', () => {
  it('`update:value` 与 `change` 是**两个**通道（C11 双发）', () => {
    expectTypeOf<DatePickerEmits['update:value']>().toEqualTypeOf<(date: SingleValue) => void>();
    expectTypeOf<DatePickerEmits['change']>().toEqualTypeOf<
      (date: SingleValue, dateString: string | string[] | null) => void
    >();
  });

  it('`calendarChange` 是 **3 参**（第三参带 `range` / `from`）', () => {
    expectTypeOf<DatePickerEmits['calendarChange']>().toEqualTypeOf<
      (
        date: DatePickerDate | DatePickerDate[],
        dateString: string | string[],
        info: { range?: 'start' | 'end'; from?: DatePickerDate },
      ) => void
    >();
  });

  it('🚨 `keydown` 的第二参是 `preventDefault`（上游 `LegacyOnKeyDown` 的签名）', () => {
    expectTypeOf<DatePickerEmits['keydown']>().toEqualTypeOf<
      (event: KeyboardEvent, preventDefault: () => void) => void
    >();
  });

  it('`openChange` 的第二参是 `OpenConfig`', () => {
    expectTypeOf<DatePickerEmits['openChange']>().toEqualTypeOf<
      (open: boolean, config?: OpenConfig) => void
    >();
    expectTypeOf<OpenConfig>().toEqualTypeOf<{
      index?: number;
      inherit?: boolean;
      force?: boolean;
    }>();
  });

  it('范围版的事件载荷是**数组化**的（与单值分开定义）', () => {
    expectTypeOf<RangePickerEmits['change']>().toEqualTypeOf<
      (dates: NoUndefinedRangeValue | null, dateStrings: [string, string]) => void
    >();
    expectTypeOf<RangePickerEmits['calendarChange']>().toEqualTypeOf<
      (
        dates: NoUndefinedRangeValue,
        dateStrings: [string, string],
        info: { range?: 'start' | 'end'; from?: DatePickerDate },
      ) => void
    >();
  });
});

describe('DatePicker · L3 expose（单值与范围的 `focus` 签名不同）', () => {
  it('单值 `focus(options?)`', () => {
    expectTypeOf<DatePickerExpose['focus']>().toEqualTypeOf<(options?: FocusOptions) => void>();
    expectTypeOf<DatePickerExpose['nativeElement']>().toEqualTypeOf<HTMLDivElement>();
  });

  it('🚨 范围 `focus(index?)` —— 可指定聚焦哪一端，另有 `startInput` / `endInput`', () => {
    expectTypeOf<RangePickerExpose['focus']>().toEqualTypeOf<
      (index?: number | (FocusOptions & { index?: number })) => void
    >();
    expectTypeOf<RangePickerExpose['startInput']>().toEqualTypeOf<HTMLInputElement>();
    expectTypeOf<RangePickerExpose['endInput']>().toEqualTypeOf<HTMLInputElement>();
  });
});

describe('DatePicker · L3 单值与范围的差异面', () => {
  it('`showTime`：单值 `SharedTimeProps` / 范围 `RangeTimeProps`', () => {
    expectTypeOf<DatePickerProps['showTime']>().toEqualTypeOf<
      boolean | SharedTimeProps | undefined
    >();
    expectTypeOf<RangePickerProps['showTime']>().toEqualTypeOf<
      boolean | RangeTimeProps | undefined
    >();
  });

  it('范围的 `RangeTimeProps.disabledTime` 多两个参数', () => {
    expectTypeOf<SharedTimeProps['disabledTime']>().toEqualTypeOf<
      ((date: DatePickerDate) => DisabledTimes) | undefined
    >();
    expectTypeOf<RangeTimeProps['disabledTime']>().toEqualTypeOf<
      | ((
          date: DatePickerDate,
          range: 'start' | 'end',
          info: { from?: DatePickerDate },
        ) => DisabledTimes)
      | undefined
    >();
  });

  it('`presets`：单值 `ValueDate[]` / 范围 `RangeValueDate[]`', () => {
    expectTypeOf<DatePickerProps['presets']>().toEqualTypeOf<ValueDate[] | undefined>();
    expectTypeOf<RangePickerProps['presets']>().toEqualTypeOf<RangeValueDate[] | undefined>();
  });

  it('`placeholder`：单值 `string` / 范围元组', () => {
    expectTypeOf<DatePickerProps['placeholder']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<RangePickerProps['placeholder']>().toEqualTypeOf<[string, string] | undefined>();
  });

  it('`disabled`：单值 `boolean` / 范围可两端', () => {
    expectTypeOf<DatePickerProps['disabled']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<RangePickerProps['disabled']>().toEqualTypeOf<
      boolean | [boolean, boolean] | undefined
    >();
  });

  it('`separator` 与 `allowEmpty` **只在范围版**', () => {
    expectTypeOf<RangePickerProps['separator']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<RangePickerProps['allowEmpty']>().toEqualTypeOf<
      boolean | [boolean, boolean] | undefined
    >();
  });

  it('`presets[].value` 允许**函数**（懒求值）', () => {
    expectTypeOf<ValueDate['value']>().toEqualTypeOf<DatePickerDate | (() => DatePickerDate)>();
    expectTypeOf<RangeValueDate['value']>().toEqualTypeOf<
      NoUndefinedRangeValue | (() => NoUndefinedRangeValue)
    >();
  });

  it('`label` 是 `VNodeChild`（不是 `string`）', () => {
    expectTypeOf<ValueDate['label']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<CustomTagProps['label']>().toEqualTypeOf<VNodeChild>();
  });
});

describe('DatePicker · L3 判定与渲染函数的签名', () => {
  it('`disabledDate` 的 `info` 带 `type` 与可选的 `from`', () => {
    expectTypeOf<DisabledDate>().toEqualTypeOf<
      (date: DatePickerDate, info: { type: DatePickerPanelMode; from?: DatePickerDate }) => boolean
    >();
  });

  it('🚨 `LimitDate` 允许**函数形态**（「结束的最早值」取决于「开始选了什么」）', () => {
    expectTypeOf<LimitDate>().toEqualTypeOf<
      DatePickerDate | ((info: { from?: DatePickerDate }) => DatePickerDate)
    >();
  });

  it('`CellRender` 的第一参是**联合**（时间列传数字、上下午列传字符串）', () => {
    expectTypeOf<CellRender>().toEqualTypeOf<
      (current: DatePickerDate | number | string, info: CellRenderInfo) => VNodeChild
    >();
  });

  it('`CellRenderInfo.originNode` 是 `VNodeChild`（上游是 `React.ReactElement`）', () => {
    expectTypeOf<CellRenderInfo['originNode']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<CellRenderInfo['subType']>().toEqualTypeOf<
      'hour' | 'minute' | 'second' | 'millisecond' | 'meridiem' | undefined
    >();
  });
});

describe('DatePicker · L3 slots 与 PurePanel', () => {
  it('`panelRender` / `extraFooter` 的签名', () => {
    expectTypeOf<NonNullable<DatePickerSlots['panelRender']>>().toEqualTypeOf<
      (props: { originPanel: VNodeChild }) => VNodeChild
    >();
    expectTypeOf<NonNullable<DatePickerSlots['extraFooter']>>().toEqualTypeOf<
      (props: { mode: DatePickerPanelMode }) => VNodeChild
    >();
  });

  it('`PurePanelProps` 只出面板（`picker` / `mode` / `value`）', () => {
    expectTypeOf<PurePanelProps['picker']>().toEqualTypeOf<DatePickerMode | undefined>();
    expectTypeOf<PurePanelProps['mode']>().toEqualTypeOf<DatePickerPanelMode | undefined>();
    expectTypeOf<PurePanelProps['value']>().toEqualTypeOf<DatePickerDate | null | undefined>();
  });
});

describe('DatePicker · L3 负例', () => {
  it("`picker` 不接受 `'datetime'`（它只在 `InternalMode` 里，不是 `PickerMode`）", () => {
    type Acceptable = DatePickerMode;
    // @ts-expect-error 'datetime' 是 InternalMode 的组合态，不是 PickerMode
    const bad: Acceptable = 'datetime';
    expectTypeOf(bad).not.toBeNever();
  });

  it("`mode` 不接受 `'datetime'`（`PanelMode` 也没有它）", () => {
    type Acceptable = DatePickerPanelMode;
    // @ts-expect-error 'datetime' 不在 PanelMode 里
    const bad: Acceptable = 'datetime';
    expectTypeOf(bad).not.toBeNever();
  });

  it("`status` 不接受 `'success'`（只有 error / warning）", () => {
    type Acceptable = DatePickerStatus;
    // @ts-expect-error 上游的 DatePickerStatus 只有两档
    const bad: Acceptable = 'success';
    expectTypeOf(bad).not.toBeNever();
  });

  it('单值的 `disabled` 不接受两端元组（那是范围版的形状）', () => {
    type Acceptable = DatePickerProps['disabled'];
    // @ts-expect-error 单值是 boolean，不接受元组
    const bad: Acceptable = [true, false];
    expectTypeOf(bad).not.toBeNever();
  });

  it('`separator` 不在单值 props 上（只有范围版有）', () => {
    // @ts-expect-error separator 只在 RangePickerProps 上
    const bad: DatePickerProps = { separator: '→' };
    expectTypeOf(bad).not.toBeNever();
  });

  it('`size` 不接受任意字符串', () => {
    type Acceptable = DatePickerSize;
    // @ts-expect-error 只有四档
    const bad: Acceptable = 'huge';
    expectTypeOf(bad).not.toBeNever();
  });

  it('`variant` 不接受任意字符串', () => {
    type Acceptable = DatePickerVariant;
    // @ts-expect-error 只有四档
    const bad: Acceptable = 'ghost';
    expectTypeOf(bad).not.toBeNever();
  });

  it('`placement` 不接受任意字符串', () => {
    type Acceptable = DatePickerPlacement;
    // @ts-expect-error 只有四个落点
    const bad: Acceptable = 'center';
    expectTypeOf(bad).not.toBeNever();
  });
});
