/**
 * L3 类型测试（含负例；负例包在**永不调用的闭包**里 —— `*.test-d.ts` 会被 vitest 真执行）。
 *
 * 判据来源：`packages/ui/src/slider/interface.ts`（G2 定稿的类型面）。
 * 这里钉的是**对外契约的形状**，不是实现细节：
 *   - `SliderProps` 的值域是 `number | number[]`（单一形状 + 联合类型，理由见 interface.ts）；
 *   - 语义槽 5 个、`SliderRangeConfig` 4 个字段、`SliderHandleInfo` 的槽参数形状；
 *   - `SliderRef` 只有 focus/blur；
 *   - emits 的载荷类型，其中 `focus`/`blur` 带**把手索引**（对齐 rc 的 `onFocus(e, index)`）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { type CSSProperties, h, type VNodeChild } from 'vue';
import { Slider } from '../index';
import type {
  SliderEmits,
  SliderHandleInfo,
  SliderMarkObject,
  SliderMarks,
  SliderOrientation,
  SliderProps,
  SliderRangeConfig,
  SliderRef,
  SliderSemanticClassNames,
  SliderSemanticStyles,
  SliderSlots,
  SliderTooltipProps,
  SliderValue,
} from '../interface';

describe('Slider · L3 类型', () => {
  it('值域：单值与数组共用一个联合类型', () => {
    expectTypeOf<SliderValue>().toEqualTypeOf<number | number[]>();
    expectTypeOf<SliderProps['value']>().toEqualTypeOf<SliderValue | null | undefined>();
    expectTypeOf<SliderProps['defaultValue']>().toEqualTypeOf<SliderValue | null | undefined>();
  });

  it('range：三形态（true / 配置对象 / 未传）', () => {
    expectTypeOf<SliderProps['range']>().toEqualTypeOf<boolean | SliderRangeConfig | undefined>();
    expectTypeOf<SliderRangeConfig>().toHaveProperty('editable');
    expectTypeOf<SliderRangeConfig>().toHaveProperty('draggableTrack');
    expectTypeOf<SliderRangeConfig>().toHaveProperty('minCount');
    expectTypeOf<SliderRangeConfig>().toHaveProperty('maxCount');
  });

  it('orientation 是两值联合（vertical 是废弃写法，仍是 boolean）', () => {
    expectTypeOf<SliderOrientation>().toEqualTypeOf<'horizontal' | 'vertical'>();
    expectTypeOf<SliderProps['orientation']>().toEqualTypeOf<SliderOrientation | undefined>();
    expectTypeOf<SliderProps['vertical']>().toEqualTypeOf<boolean | undefined>();
  });

  it('disabled 收布尔与数组两形态', () => {
    expectTypeOf<SliderProps['disabled']>().toEqualTypeOf<boolean | boolean[] | undefined>();
    expectTypeOf<SliderProps['pushable']>().toEqualTypeOf<boolean | number | undefined>();
  });

  it('语义槽 5 个（root / tracks / track / rail / handle）', () => {
    expectTypeOf<keyof SliderSemanticClassNames>().toEqualTypeOf<
      'root' | 'tracks' | 'track' | 'rail' | 'handle'
    >();
    expectTypeOf<keyof SliderSemanticStyles>().toEqualTypeOf<
      'root' | 'tracks' | 'track' | 'rail' | 'handle'
    >();
    expectTypeOf<SliderSemanticStyles['handle']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('marks：VNodeChild 或对象形态；dotStyle 支持按值求值', () => {
    expectTypeOf<SliderMarks>().toEqualTypeOf<
      Record<string | number, VNodeChild | SliderMarkObject>
    >();
    expectTypeOf<SliderMarkObject['label']>().toEqualTypeOf<VNodeChild | undefined>();
    expectTypeOf<SliderProps['dotStyle']>().toEqualTypeOf<
      CSSProperties | ((dotValue: number) => CSSProperties) | undefined
    >();
  });

  it('tooltip：formatter 允许 null（null ⇒ 永不显示）', () => {
    expectTypeOf<SliderTooltipProps['formatter']>().toEqualTypeOf<
      ((value?: number) => VNodeChild) | null | undefined
    >();
    expectTypeOf<SliderTooltipProps['open']>().toEqualTypeOf<boolean | undefined>();
  });

  it('emits：载荷形状与 focus/blur 的索引参数', () => {
    expectTypeOf<SliderEmits['update:value']>().toEqualTypeOf<[value: SliderValue]>();
    expectTypeOf<SliderEmits['change']>().toEqualTypeOf<[value: SliderValue]>();
    expectTypeOf<SliderEmits['changeComplete']>().toEqualTypeOf<[value: SliderValue]>();
    expectTypeOf<SliderEmits['beforeChange']>().toEqualTypeOf<[value: SliderValue]>();
    expectTypeOf<SliderEmits['focus']>().toEqualTypeOf<[event: FocusEvent, index: number]>();
    expectTypeOf<SliderEmits['blur']>().toEqualTypeOf<[event: FocusEvent, index: number]>();
  });

  it('slots：handle 的槽参数是 SliderHandleInfo', () => {
    expectTypeOf<SliderSlots['handle']>().parameters.toEqualTypeOf<[info: SliderHandleInfo]>();
    expectTypeOf<SliderHandleInfo['index']>().toEqualTypeOf<number>();
    expectTypeOf<SliderHandleInfo['draggingDelete']>().toEqualTypeOf<boolean>();
  });

  it('ref：只有 focus 与 blur', () => {
    expectTypeOf<keyof SliderRef>().toEqualTypeOf<'focus' | 'blur'>();
    expectTypeOf<SliderRef['focus']>().toEqualTypeOf<() => void>();
  });
});

describe('Slider · L3 负例', () => {
  it('value 不接受字符串', () => {
    type Acceptable = SliderValue | null | undefined;
    // @ts-expect-error 字符串不是合法的 slider 值
    const bad: Acceptable = '30';
    expectTypeOf(bad).not.toBeNever();
  });

  it('orientation 不接受任意字符串', () => {
    type Acceptable = SliderOrientation | undefined;
    // @ts-expect-error 'vertical-up' 不是合法朝向
    const bad: Acceptable = 'vertical-up';
    expectTypeOf(bad).not.toBeNever();
  });

  it('range.minCount 不接受字符串', () => {
    type Acceptable = SliderRangeConfig;
    // @ts-expect-error minCount 是数字
    const bad: Acceptable = { minCount: '2' };
    expectTypeOf(bad).not.toBeNever();
  });

  it('语义槽不接受未知键', () => {
    type Acceptable = SliderSemanticClassNames;
    // @ts-expect-error 'wrapper' 不是语义槽
    const bad: Acceptable = { wrapper: 'x' };
    expectTypeOf(bad).not.toBeNever();
  });
});

type SliderInstance = InstanceType<typeof Slider>;
it('actual constructor exposes the existing native focus methods and owned payloads', () => {
  expectTypeOf<SliderInstance['focus']>().toEqualTypeOf<SliderRef['focus']>();
  expectTypeOf<SliderInstance['blur']>().toEqualTypeOf<SliderRef['blur']>();
  expectTypeOf<Parameters<NonNullable<SliderInstance['$props']['onChange']>>>().toEqualTypeOf<
    SliderEmits['change']
  >();
  expectTypeOf<Parameters<NonNullable<SliderInstance['$props']['onFocus']>>>().toEqualTypeOf<
    SliderEmits['focus']
  >();
  expectTypeOf<Parameters<NonNullable<SliderInstance['$props']['onKeydown']>>>().toEqualTypeOf<
    SliderEmits['keydown']
  >();
  expectTypeOf<SliderProps['min']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<SliderProps['max']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<SliderProps['step']>().toEqualTypeOf<number | null | undefined>();
});

it('actual h consumers use complete native handle scopes and nullable inputs', () => {
  const slots: SliderSlots = {
    handle: (info) => {
      expectTypeOf(info.value).toEqualTypeOf<number>();
      expectTypeOf(info.nodeProps.onFocus).toEqualTypeOf<
        ((event: FocusEvent) => void) | undefined
      >();
      expectTypeOf(info.nodeProps.onKeydown).toEqualTypeOf<
        ((event: KeyboardEvent) => void) | undefined
      >();
      return h('div', { ...info.nodeProps, class: info.className, style: info.style });
    },
    activeHandle: (info) =>
      h('div', { ...info.nodeProps, class: info.className, style: info.style }),
  };
  const props: SliderProps = {
    min: 10,
    max: 80,
    step: null,
    marks: { 10: 'low', 80: 'high' },
    value: null,
  };
  h(Slider, { ...props }, slots);
  h(Slider, {
    range: { editable: true, minCount: 1, maxCount: 3 },
    value: [20, 60],
    disabled: [false, true],
    onKeydown: (event, index) => {
      expectTypeOf(index).toBeNumber();
      event.preventDefault();
    },
    onChange: (next) => {
      expectTypeOf(next).toEqualTypeOf<SliderValue>();
    },
  });
});
function invalidNativeSliderContracts(instance: SliderInstance) {
  // @ts-expect-error The current Slider ref has only focus and blur; no added root-handle promise.
  instance.nativeElement;
  // @ts-expect-error Values must be numeric or explicitly cleared with null.
  h(Slider, { value: '30' });
  // @ts-expect-error The runtime range limit is numeric.
  h(Slider, { range: { maxCount: '3' } });
  // @ts-expect-error Native keydown receives KeyboardEvent, not a MouseEvent callback.
  h(Slider, { onKeydown: (_event: MouseEvent) => {} });
  // @ts-expect-error Tooltip visibility is owned by Slider focus/hover and tooltip.open.
  const unsupported: SliderTooltipProps = { defaultOpen: true };
  // @ts-expect-error Internal dragging metadata lives on the actual handle scope.
  const fakeTooltipValue: SliderTooltipProps = { value: 30 };
  // @ts-expect-error The handle scope value is a real number.
  const badSlots: SliderSlots = { handle: (_info: { value: string }) => null };
  void [unsupported, fakeTooltipValue, badSlots];
}
void invalidNativeSliderContracts;
