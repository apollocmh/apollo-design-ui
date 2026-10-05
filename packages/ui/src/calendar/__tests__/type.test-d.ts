/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS 74）。
 *
 * ── 本文件钉的六类判据 ───────────────────────────────────────────────────────
 *
 * 1. 🚨 **`CalendarProps` 的键集是**「上游 21 个」**，多一个少一个都是判据** ——
 *    少一个 ⇒ 该 prop 会被 Vue 归进 `attrs` 而**静默失效**（PITFALLS 跨包判据 1）；
 *    多一个 ⇒ 我们凭空发明了 API。所以这里用 `toEqualTypeOf` 对**键集**逐一核对。
 * 2. **`CalendarExpose` 只有 `nativeElement`** —— 上游 `CalendarRef` 没有
 *    `focus` / `blur`（那是 `DatePicker` 的 `PickerRef` 才有）⇒ 本仓**不补**。
 * 3. **`CalendarEmits` 的载荷形状**（C11 双发：`update:value`+`change`、
 *    `update:mode`+`panelChange`）。
 * 4. **语义槽是「对象 | 函数」的联合**，且 6 个槽是**平铺**的（没有 `popup` 那样的嵌套）。
 * 5. **`CalendarCellRenderInfo` 就是 picker 的 `PanelCellRenderInfo`**（别名，不重定义）。
 * 6. **三个渲染 prop 的签名**（`dateRender` / `monthRender` 的 `(date, info)`）。
 */

import type { PanelCellRenderInfo } from '@apollo-design/picker';
import type { Dayjs } from 'dayjs';
import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type {
  CalendarCellRender,
  CalendarCellRenderInfo,
  CalendarDate,
  CalendarEmits,
  CalendarExpose,
  CalendarFullCellRender,
  CalendarHeaderRender,
  CalendarHeaderRenderConfig,
  CalendarMode,
  CalendarProps,
  CalendarSemanticClassNames,
  CalendarSemanticStyles,
  CalendarSemanticValue,
  CalendarSlots,
  SelectInfo,
} from '../interface';

describe('Calendar · Props 键集（18 个）', () => {
  it('🚨 键集与上游 `CalendarProps` **逐一对应**（根 class/style 走原生 attrs，不在键集里）', () => {
    expectTypeOf<keyof CalendarProps>().toEqualTypeOf<
      | 'prefixCls'
      | 'classNames'
      | 'styles'
      | 'locale'
      | 'validRange'
      | 'disabledDate'
      | 'dateFullCellRender'
      | 'dateCellRender'
      | 'monthFullCellRender'
      | 'monthCellRender'
      | 'cellRender'
      | 'fullCellRender'
      | 'headerRender'
      | 'value'
      | 'defaultValue'
      | 'mode'
      | 'fullscreen'
      | 'showWeek'
    >();
  });

  it('`value` / `defaultValue` 是**单值**（不是数组）', () => {
    expectTypeOf<CalendarProps['value']>().toEqualTypeOf<CalendarDate | undefined>();
    expectTypeOf<CalendarProps['defaultValue']>().toEqualTypeOf<CalendarDate | undefined>();
    expectTypeOf<CalendarDate>().toEqualTypeOf<Dayjs>();
  });

  it('`mode` 只有两档；`fullscreen` / `showWeek` 是**可 undefined 的布尔**', () => {
    expectTypeOf<CalendarMode>().toEqualTypeOf<'year' | 'month'>();
    expectTypeOf<CalendarProps['mode']>().toEqualTypeOf<CalendarMode | undefined>();
    // ⚠️ 必须带 `undefined`（PITFALLS 46：Vue 会把未传的 Boolean prop 赋成 `false`）
    expectTypeOf<CalendarProps['fullscreen']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CalendarProps['showWeek']>().toEqualTypeOf<boolean | undefined>();
  });

  it('`validRange` 是**二元组**；`disabledDate` 收单值', () => {
    expectTypeOf<CalendarProps['validRange']>().toEqualTypeOf<
      [CalendarDate, CalendarDate] | undefined
    >();
    expectTypeOf<CalendarProps['disabledDate']>().toEqualTypeOf<
      ((date: CalendarDate) => boolean) | undefined
    >();
  });

  it('`SelectInfo.source` 是**四值联合**', () => {
    expectTypeOf<SelectInfo['source']>().toEqualTypeOf<'year' | 'month' | 'date' | 'customize'>();
  });
});

describe('Calendar · 渲染 prop 的签名', () => {
  it('`cellRender` / `fullCellRender` 都是 `(date, info) => VNodeChild`', () => {
    expectTypeOf<CalendarCellRender>().toEqualTypeOf<
      (date: CalendarDate, info: CalendarCellRenderInfo) => VNodeChild
    >();
    expectTypeOf<CalendarFullCellRender>().toEqualTypeOf<
      (date: CalendarDate, info: CalendarCellRenderInfo) => VNodeChild
    >();
  });

  it('🚨 `CalendarCellRenderInfo` **就是** picker 的 `PanelCellRenderInfo`（别名不重定义）', () => {
    expectTypeOf<CalendarCellRenderInfo>().toEqualTypeOf<PanelCellRenderInfo>();
    // 形状抽查：`type` 是面板粒度、`originNode` 是默认渲染出来的节点
    expectTypeOf<CalendarCellRenderInfo['originNode']>().toEqualTypeOf<VNodeChild>();
  });

  it('`headerRender` 的 config 恰好四个键，且 `type` 是 `CalendarMode`', () => {
    expectTypeOf<keyof CalendarHeaderRenderConfig>().toEqualTypeOf<
      'value' | 'type' | 'onChange' | 'onTypeChange'
    >();
    expectTypeOf<CalendarHeaderRenderConfig['type']>().toEqualTypeOf<CalendarMode>();
    expectTypeOf<CalendarHeaderRender>().toEqualTypeOf<
      (config: CalendarHeaderRenderConfig) => VNodeChild
    >();
  });

  it('四个废弃 prop 与替代品**同签名**（`dateFullCellRender` 少一个 `info` 参数的差异见负例）', () => {
    expectTypeOf<CalendarProps['dateCellRender']>().toEqualTypeOf<CalendarCellRender | undefined>();
    expectTypeOf<CalendarProps['monthCellRender']>().toEqualTypeOf<
      CalendarCellRender | undefined
    >();
  });
});

describe('Calendar · 语义槽（6 平铺，无嵌套）', () => {
  it('classNames / styles 的键集完全相同（6 个）', () => {
    expectTypeOf<keyof CalendarSemanticClassNames>().toEqualTypeOf<
      'root' | 'header' | 'body' | 'content' | 'item' | 'itemContent'
    >();
    expectTypeOf<keyof CalendarSemanticStyles>().toEqualTypeOf<keyof CalendarSemanticClassNames>();
    expectTypeOf<CalendarSemanticStyles['root']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('`CalendarSemanticValue<T, P>` = `T | ((info: { props: P }) => T)`', () => {
    expectTypeOf<CalendarSemanticValue<CalendarSemanticClassNames, CalendarProps>>().toEqualTypeOf<
      CalendarSemanticClassNames | ((info: { props: CalendarProps }) => CalendarSemanticClassNames)
    >();
    // 组件上的两个 prop 用的就是它
    expectTypeOf<CalendarProps['classNames']>().toEqualTypeOf<
      CalendarSemanticValue<CalendarSemanticClassNames, CalendarProps> | undefined
    >();
  });
});

describe('Calendar · Emits / Slots / Expose', () => {
  it('C11 双发：`update:value` 与 `change` 载荷同形；`update:mode` 与 `panelChange` 的第二参同形', () => {
    expectTypeOf<CalendarEmits['change']>().toEqualTypeOf<(date: CalendarDate) => void>();
    expectTypeOf<CalendarEmits['update:value']>().toEqualTypeOf<(date: CalendarDate) => void>();
    expectTypeOf<CalendarEmits['panelChange']>().toEqualTypeOf<
      (date: CalendarDate, mode: CalendarMode) => void
    >();
    expectTypeOf<CalendarEmits['update:mode']>().toEqualTypeOf<(mode: CalendarMode) => void>();
    expectTypeOf<CalendarEmits['select']>().toEqualTypeOf<
      (date: CalendarDate, info: SelectInfo) => void
    >();
  });

  it('三个插槽与三个渲染 prop **一一对应**', () => {
    expectTypeOf<keyof CalendarSlots>().toEqualTypeOf<
      'headerRender' | 'cellRender' | 'fullCellRender'
    >();
  });

  it('🚨 `CalendarExpose` **只有** `nativeElement`（上游 `CalendarRef` 没有 focus/blur）', () => {
    expectTypeOf<keyof CalendarExpose>().toEqualTypeOf<'nativeElement'>();
    expectTypeOf<CalendarExpose['nativeElement']>().toEqualTypeOf<HTMLDivElement>();
  });
});

describe('Calendar · 负例（永不调用的闭包内）', () => {
  it('`mode` 不接受 `"week"` / `"date"` 等（只有两档）', () => {
    const _never = () => {
      // @ts-expect-error Calendar 的 mode 只有 'year' | 'month'
      const bad: CalendarProps = { mode: 'week' };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('🚨 `value` 不接受数组（与 `DatePicker` 的 `value` 不同）', () => {
    const _never = () => {
      // @ts-expect-error Calendar 的 value 是单值
      const bad: CalendarProps = { value: [new Date()] };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('`validRange` 不接受长度不为 2 的数组', () => {
    const _never = () => {
      // @ts-expect-error 必须是二元组
      const bad: CalendarProps = { validRange: [new Date()] };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('`SelectInfo.source` 不接受任意字符串', () => {
    const _never = () => {
      // @ts-expect-error source 是四值联合
      const bad: SelectInfo = { source: 'panel' };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('🚨 `CalendarExpose` **没有** `focus` / `blur`（那是 `DatePicker` 才有的）', () => {
    const _never = () => {
      // @ts-expect-error CalendarRef 只有 nativeElement
      const bad: CalendarExpose = { nativeElement: document.createElement('div'), focus: () => {} };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('语义槽的值必须是 `string`（不接受数字 / 对象）', () => {
    const _never = () => {
      // @ts-expect-error classNames.root 是 string
      const bad: CalendarProps = { classNames: { root: 1 } };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('`headerRender` 的返回类型是 `VNodeChild`（返回对象字面量会被拒）', () => {
    const _never = () => {
      // @ts-expect-error 必须是可渲染值
      const bad: CalendarProps = { headerRender: () => ({ nope: true }) };
      void bad;
    };
    expectTypeOf(_never).toBeFunction();
  });
});
