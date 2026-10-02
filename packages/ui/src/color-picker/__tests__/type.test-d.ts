/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS 74）。
 *
 * ── 本文件钉的八类判据 ───────────────────────────────────────────────────────
 *
 * 1. **值 / 模式 / 格式的形态**：`value: ColorValueType`（`SingleValueType | null |
 *    LineGradientType`）、`mode: ModeType | ModeType[]`、`format: ColorFormatType`。
 * 2. **`onChange` 的第二个参数是 `css: string`**（不是 rc 的 info 对象）。
 * 3. **`panelRender` 的第二个参数是 `ColorPickerPanelRenderExtra`**（给两个组件引用）。
 * 4. **`showText` 是 `boolean | ((color) => VNodeChild)`**。
 * 5. **`ColorPickerEmits` 的 8 个事件**（含 `update:format` / `formatChange` 载荷
 *    **允许 `undefined`**）。
 * 6. **语义槽不对称**：`classNames` 5 槽、`styles` 6 槽（多 `popupOverlayInner`），
 *    且 `popup` 是嵌套 `{ root? }` —— 断言这个不对称本身（「别补齐」是契约）。
 * 7. **本组件「没有」的东西**：`children` 在 Vue 侧走默认插槽（`ColorPickerSlots`）；
 *    **没有 `expose`**（`ColorPickerExpose` 是空类型 —— 上游没有 ref 转发）。
 * 8. **可安装**：`ColorPicker` / `ColorPickerPurePanel` 都是 `withInstall` 的产物，
 *    且挂了 `_InternalPanelDoNotUseOrYouWillBeFired` 静态别名。
 *
 * 负例：非法 `value` / `mode` / `format` / `trigger` / `classNames` / `styles` /
 *       `showText` / `onChange` 形态必须被拒。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { Component, CSSProperties, VNodeChild } from 'vue';
import type { TooltipPlacement } from '../../tooltip/interface';
import type { AggregationColor } from '../color';
import { ColorPicker, ColorPickerPurePanel } from '../index';
import type {
  ColorFormatType,
  ColorPickerEmits,
  ColorPickerExpose,
  ColorPickerPanelRenderExtra,
  ColorPickerProps,
  ColorPickerSemanticClassNames,
  ColorPickerSemanticStyles,
  ColorPickerSemanticValue,
  ColorPickerSlots,
  ColorValueType,
  FORMAT_HEX,
  FORMAT_HSB,
  FORMAT_RGB,
  LineGradientType,
  ModeType,
  PresetsItem,
  SingleValueType,
  TriggerPlacement,
  TriggerType,
} from '../interface';

describe('ColorPicker · Props 类型', () => {
  it('核心 props 的形态：值 / 模式 / 格式', () => {
    expectTypeOf<ColorPickerProps['value']>().toEqualTypeOf<ColorValueType | undefined>();
    expectTypeOf<ColorPickerProps['defaultValue']>().toEqualTypeOf<ColorValueType | undefined>();
    expectTypeOf<ColorValueType>().toEqualTypeOf<SingleValueType | null | LineGradientType>();
    expectTypeOf<SingleValueType>().toEqualTypeOf<AggregationColor | string>();
    expectTypeOf<LineGradientType>().toEqualTypeOf<{ color: SingleValueType; percent: number }[]>();

    expectTypeOf<ColorPickerProps['mode']>().toEqualTypeOf<ModeType | ModeType[] | undefined>();
    expectTypeOf<ModeType>().toEqualTypeOf<'single' | 'gradient'>();

    expectTypeOf<ColorPickerProps['format']>().toEqualTypeOf<ColorFormatType | undefined>();
    expectTypeOf<ColorPickerProps['defaultFormat']>().toEqualTypeOf<ColorFormatType | undefined>();
    expectTypeOf<ColorFormatType>().toEqualTypeOf<'hex' | 'rgb' | 'hsb'>();

    expectTypeOf<ColorPickerProps['open']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ColorPickerProps['allowClear']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ColorPickerProps['disabled']>().toEqualTypeOf<boolean | undefined>();
  });

  it('🚨 `onChange` 的第二个参数是 `css: string`（不是 rc 的 info 对象）', () => {
    expectTypeOf<NonNullable<ColorPickerProps['onChange']>>().parameters.toEqualTypeOf<
      [value: AggregationColor, css: string]
    >();
    expectTypeOf<NonNullable<ColorPickerProps['onChange']>>().returns.toBeVoid();
    // 事件面同形
    expectTypeOf<Parameters<ColorPickerEmits['change']>[1]>().toEqualTypeOf<string>();
  });

  it('`panelRender` 的第二个参数是 `ColorPickerPanelRenderExtra`（两个组件引用）', () => {
    expectTypeOf<NonNullable<ColorPickerProps['panelRender']>>().parameters.toEqualTypeOf<
      [panel: VNodeChild, extra: ColorPickerPanelRenderExtra]
    >();
    expectTypeOf<ColorPickerPanelRenderExtra['components']>().toEqualTypeOf<{
      Picker: Component;
      Presets: Component;
    }>();
  });

  it('`showText` 是 `boolean | ((color: AggregationColor) => VNodeChild)`', () => {
    expectTypeOf<ColorPickerProps['showText']>().toEqualTypeOf<
      boolean | ((color: AggregationColor) => VNodeChild) | undefined
    >();
  });

  it('`trigger` 只有两档（不像 Tooltip 有 4 档 + 数组）；`placement` = `TooltipPlacement`', () => {
    expectTypeOf<TriggerType>().toEqualTypeOf<'click' | 'hover'>();
    expectTypeOf<ColorPickerProps['trigger']>().toEqualTypeOf<TriggerType | undefined>();
    expectTypeOf<TriggerPlacement>().toEqualTypeOf<TooltipPlacement>();
    expectTypeOf<ColorPickerProps['placement']>().toEqualTypeOf<TriggerPlacement | undefined>();
  });

  it('`presets` 的形状与 `PresetsItem`', () => {
    expectTypeOf<ColorPickerProps['presets']>().toEqualTypeOf<PresetsItem[] | undefined>();
    expectTypeOf<PresetsItem['label']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<PresetsItem['colors']>().toEqualTypeOf<
      (string | AggregationColor | LineGradientType)[]
    >();
    expectTypeOf<PresetsItem['defaultOpen']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<PresetsItem['key']>().toEqualTypeOf<string | number | undefined>();
  });

  it('三个格式常量的**值是判据**（会出现在 DOM 与 `@formatChange` 载荷里）', () => {
    // ⚠️ 用 `typeof` 而非传值：`expectTypeOf(FORMAT_HEX)` 的泛型推断会把字面量
    //    放宽成 `string`（expect-type 的 `<Actual>(actual: Actual)` 无 `const` 修饰）。
    expectTypeOf<typeof FORMAT_HEX>().toEqualTypeOf<'hex'>();
    expectTypeOf<typeof FORMAT_RGB>().toEqualTypeOf<'rgb'>();
    expectTypeOf<typeof FORMAT_HSB>().toEqualTypeOf<'hsb'>();
  });
});

describe('ColorPicker · Emits（8 个）', () => {
  it('事件名恰好这 8 个', () => {
    expectTypeOf<keyof ColorPickerEmits>().toEqualTypeOf<
      | 'update:value'
      | 'change'
      | 'changeComplete'
      | 'clear'
      | 'update:open'
      | 'openChange'
      | 'update:format'
      | 'formatChange'
    >();
  });

  it('各事件载荷', () => {
    expectTypeOf<ColorPickerEmits['update:value']>().toEqualTypeOf<
      (value: AggregationColor) => void
    >();
    expectTypeOf<ColorPickerEmits['change']>().toEqualTypeOf<
      (value: AggregationColor, css: string) => void
    >();
    expectTypeOf<ColorPickerEmits['changeComplete']>().toEqualTypeOf<
      (value: AggregationColor) => void
    >();
    expectTypeOf<ColorPickerEmits['clear']>().toEqualTypeOf<() => void>();
    expectTypeOf<ColorPickerEmits['update:open']>().toEqualTypeOf<(open: boolean) => void>();
    expectTypeOf<ColorPickerEmits['openChange']>().toEqualTypeOf<(open: boolean) => void>();
  });

  it('🚨 `update:format` / `formatChange` 的载荷**允许 `undefined`**', () => {
    expectTypeOf<ColorPickerEmits['update:format']>().toEqualTypeOf<
      (format: ColorFormatType | undefined) => void
    >();
    expectTypeOf<ColorPickerEmits['formatChange']>().toEqualTypeOf<
      (format: ColorFormatType | undefined) => void
    >();
  });
});

describe('ColorPicker · 语义槽（不对称）', () => {
  it('🚨 `classNames` 5 槽 / `styles` 6 槽 —— 断言不对称本身（别补齐）', () => {
    expectTypeOf<keyof ColorPickerSemanticClassNames>().toEqualTypeOf<
      'root' | 'body' | 'content' | 'description' | 'popup'
    >();
    expectTypeOf<keyof ColorPickerSemanticStyles>().toEqualTypeOf<
      'root' | 'body' | 'content' | 'description' | 'popupOverlayInner' | 'popup'
    >();
    // 不对称：只有 `styles` 有 `popupOverlayInner`（映射到 Popover 的 `styles.container`）
    expectTypeOf<ColorPickerSemanticStyles>().toHaveProperty('popupOverlayInner');
    expectTypeOf<ColorPickerSemanticClassNames>().not.toHaveProperty('popupOverlayInner');
  });

  it('🚨 `popup` 是**嵌套对象** `{ root? }`（不是字符串）', () => {
    expectTypeOf<NonNullable<ColorPickerSemanticClassNames['popup']>>().toEqualTypeOf<{
      root?: string;
    }>();
    expectTypeOf<NonNullable<ColorPickerSemanticStyles['popup']>>().toEqualTypeOf<{
      root?: CSSProperties;
    }>();
  });

  it('`classNames` / `styles` 支持**函数形态**（`info.props` 是 `ColorPickerProps`）', () => {
    expectTypeOf<NonNullable<ColorPickerProps['classNames']>>().toEqualTypeOf<
      ColorPickerSemanticValue<ColorPickerSemanticClassNames, ColorPickerProps>
    >();
    expectTypeOf<
      ColorPickerSemanticValue<ColorPickerSemanticClassNames, ColorPickerProps>
    >().toEqualTypeOf<
      | ColorPickerSemanticClassNames
      | ((info: { props: ColorPickerProps }) => ColorPickerSemanticClassNames)
    >();
    expectTypeOf<NonNullable<ColorPickerProps['styles']>>().toEqualTypeOf<
      ColorPickerSemanticValue<ColorPickerSemanticStyles, ColorPickerProps>
    >();
  });
});

describe('ColorPicker · 本组件「没有」的东西', () => {
  it('`children` 在 Vue 侧走**默认插槽**（`ColorPickerSlots`），`panelRender` 另有同名 scoped slot', () => {
    expectTypeOf<keyof ColorPickerSlots>().toEqualTypeOf<'default' | 'panelRender'>();
    expectTypeOf<ColorPickerSlots['default']>().toEqualTypeOf<(() => VNodeChild) | undefined>();
    expectTypeOf<NonNullable<ColorPickerSlots['panelRender']>>().parameters.toEqualTypeOf<
      [{ panel: VNodeChild; extra: ColorPickerPanelRenderExtra }]
    >();
    // ⚠️ `ColorPickerProps.children`（上游同形）仍在类型面上；Vue 运行时 props 面
    //    用 `ColorPickerVueProps` 的 `Omit<…, 'children'>` 摘掉它、改走默认插槽。
    expectTypeOf<ColorPickerProps['children']>().toEqualTypeOf<VNodeChild | undefined>();
  });

  it('🚨 **没有 `expose`**（上游无 ref 转发）—— `ColorPickerExpose` 是空类型', () => {
    expectTypeOf<ColorPickerExpose>().toEqualTypeOf<Record<never, never>>();
    expectTypeOf<ColorPickerExpose>().not.toHaveProperty('nativeElement');
    expectTypeOf<ColorPickerExpose>().not.toHaveProperty('popupElement');
    expectTypeOf<ColorPickerExpose>().not.toHaveProperty('forceAlign');
  });
});

describe('ColorPicker · 可安装', () => {
  it('★ 两个导出都是 `withInstall` 的产物', () => {
    expectTypeOf(ColorPicker).toHaveProperty('install');
    expectTypeOf(ColorPickerPurePanel).toHaveProperty('install');
  });

  it('★ `ColorPicker` 挂了 `_InternalPanelDoNotUseOrYouWillBeFired` 静态别名', () => {
    expectTypeOf(ColorPicker).toHaveProperty('_InternalPanelDoNotUseOrYouWillBeFired');
  });
});

describe('ColorPicker · 负例（永不调用的闭包内）', () => {
  it('非法的 `value` / `mode` / `format` / `trigger` 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `value` 不能是数字
      const badValue: ColorPickerProps = { value: 123 };
      // @ts-expect-error `mode` 只接受 `'single' | 'gradient'`
      const badMode: ColorPickerProps = { mode: 'both' };
      // @ts-expect-error `format` 只接受 `'hex' | 'rgb' | 'hsb'`
      const badFormat: ColorPickerProps = { format: 'hsl' };
      // @ts-expect-error `trigger` 只有 `'click' | 'hover'` 两档
      const badTrigger: ColorPickerProps = { trigger: 'focus' };
      // @ts-expect-error `defaultValue` 与 `value` 同形，数字非法
      const badDefault: ColorPickerProps = { defaultValue: 123 };
      return [badValue, badMode, badFormat, badTrigger, badDefault];
    };
    void _never;
  });

  it('非法的 `classNames` / `styles` 形态必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `popup` 是嵌套对象 `{ root? }`，不是字符串
      const badPopup: ColorPickerProps = { classNames: { popup: 'x' } };
      // @ts-expect-error `classNames` **没有** `popupOverlayInner`（只有 `styles` 有）
      const badOverlay: ColorPickerProps = { classNames: { popupOverlayInner: 'x' } };
      // @ts-expect-error `styles.popupOverlayInner` 是 `CSSProperties`，不是字符串
      const badStyle: ColorPickerProps = { styles: { popupOverlayInner: 'x' } };
      // @ts-expect-error `classNames` 的槽位是 `string`，不是数字
      const badSlot: ColorPickerProps = { classNames: { root: 1 } };
      return [badPopup, badOverlay, badStyle, badSlot];
    };
    void _never;
  });

  it('`showText` 与 `onChange` 的签名必须被守住', () => {
    const _never = () => {
      // @ts-expect-error `showText` 是 `boolean | ((color) => VNodeChild)`
      const badText: ColorPickerProps = { showText: 'yes' };
      const badChange: ColorPickerProps = {
        // @ts-expect-error `onChange` 的第二个参数是 `string`（不是 info 对象）
        onChange: (_color: AggregationColor, _info: { css: string }) => {},
      };
      return [badText, badChange];
    };
    void _never;
  });
});
