/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS 74）。
 *
 * ── 本文件钉的六类判据 ───────────────────────────────────────────────────────
 *
 * 1. **本组件「没有」的东西**：`children` prop（内容由具名条目槽提供）；
 *    `Timeline` **没有** `emits`（全部回调都在 `items` 里或走 `attrs`）。
 * 2. **`ref` 的形状**：`{ nativeElement: HTMLElement | null }` —— ⚠️ 上游**没有 ref**
 *    （它没有自己的 DOM）；本仓取 **`Steps` 的根元素**，所以类型是 `HTMLElement` 而不是
 *    `HTMLDivElement`（`ol` / `div` 都可能）。
 * 3. **`TimelineItemType` 的四个废弃字段**（`label` / `children` / `dot` / `position`）。
 * 4. **语义化槽是 `Steps` 的十槽去掉 `itemSubtitle`**（用 `Omit`，与 D36 同判）。
 * 5. **`TimelineConfig` = `ComponentStyleConfig & Pick<TimelineProps,'classNames'|'styles'>`**
 *    （与 `card` 同判）。
 * 6. **原生条目槽**：当前item/index类型与空壳具名导出移除。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type { StepsVariant } from '../../steps/interface';
import type { Timeline } from '../index';
import type {
  ItemPlacement,
  ItemPosition,
  TimelineColor,
  TimelineConfig,
  TimelineItemSlotProps,
  TimelineItemType,
  TimelineMode,
  TimelineProps,
  TimelineRef,
  TimelineSemanticClassNames,
  TimelineSemanticStyles,
  TimelineSemanticValue,
  TimelineSlots,
} from '../interface';

describe('Timeline · Props 类型', () => {
  it('核心 props 的形态', () => {
    expectTypeOf<TimelineProps['prefixCls']>().toEqualTypeOf<string | undefined>();
    // 根 class/style 走 Vue 原生 attrs，不在 TimelineProps 键集里
    expectTypeOf<
      Extract<keyof TimelineProps, 'className' | 'rootClassName' | 'style'>
    >().toEqualTypeOf<never>();
    expectTypeOf<TimelineProps['variant']>().toEqualTypeOf<StepsVariant | undefined>();
    expectTypeOf<TimelineProps['mode']>().toEqualTypeOf<TimelineMode | undefined>();
    expectTypeOf<TimelineProps['orientation']>().toEqualTypeOf<
      'horizontal' | 'vertical' | undefined
    >();
    expectTypeOf<TimelineProps['titleSpan']>().toEqualTypeOf<string | number | undefined>();
    expectTypeOf<TimelineProps['items']>().toEqualTypeOf<TimelineItemType[] | undefined>();
    expectTypeOf<TimelineProps['reverse']>().toEqualTypeOf<boolean | undefined>();
  });

  it('三个废弃的 pending prop 都是 `VNodeChild`（保留 prop 形态）', () => {
    expectTypeOf<TimelineProps['pending']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<TimelineProps['pendingDot']>().toEqualTypeOf<VNodeChild>();
  });

  it('判据 3：`TimelineItemType` 的字段与四个废弃标记', () => {
    expectTypeOf<TimelineItemType['key']>().toEqualTypeOf<string | number | undefined>();
    expectTypeOf<TimelineItemType['title']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<TimelineItemType['content']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<TimelineItemType['icon']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<TimelineItemType['loading']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<TimelineItemType['className']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TimelineItemType['style']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<TimelineItemType['placement']>().toEqualTypeOf<ItemPlacement | undefined>();
    // 四个废弃字段
    expectTypeOf<TimelineItemType['label']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<TimelineItemType['children']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<TimelineItemType['dot']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<TimelineItemType['position']>().toEqualTypeOf<ItemPosition | undefined>();
  });

  it('`color` 放宽成 `TimelineColor | string`（上游是 `LiteralUnion`）', () => {
    expectTypeOf<TimelineItemType['color']>().toEqualTypeOf<TimelineColor | string | undefined>();
    expectTypeOf<TimelineColor>().toEqualTypeOf<'blue' | 'red' | 'green' | 'gray'>();
  });

  it('三个联合的成员', () => {
    expectTypeOf<ItemPosition>().toEqualTypeOf<'left' | 'right' | 'start' | 'end'>();
    expectTypeOf<ItemPlacement>().toEqualTypeOf<'start' | 'end'>();
    expectTypeOf<TimelineMode>().toEqualTypeOf<ItemPosition | 'alternate'>();
  });

  it('判据 4：语义化槽 = Steps 的十槽**去掉 `itemSubtitle`**', () => {
    expectTypeOf<TimelineSemanticClassNames>().toHaveProperty('item');
    expectTypeOf<TimelineSemanticClassNames>().toHaveProperty('itemRail');
    expectTypeOf<TimelineSemanticClassNames>().toHaveProperty('itemWrapper');
    // ⚠️ `itemSubtitle` **不在**
    expectTypeOf<TimelineSemanticClassNames>().not.toHaveProperty('itemSubtitle');
    expectTypeOf<TimelineSemanticStyles>().not.toHaveProperty('itemSubtitle');
  });

  it('判据 5：`TimelineConfig` 含 `className` / `style` / `classNames` / `styles`', () => {
    expectTypeOf<TimelineConfig['className']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TimelineConfig['style']>().toEqualTypeOf<CSSProperties | undefined>();
    // ⚠️ 语义化槽是「对象 | 函数」的联合（与 card 的 `CardSemanticValue` 同判）
    expectTypeOf<TimelineConfig['classNames']>().toEqualTypeOf<
      TimelineSemanticValue<TimelineSemanticClassNames> | undefined
    >();
    expectTypeOf<TimelineConfig['styles']>().toEqualTypeOf<
      TimelineSemanticValue<TimelineSemanticStyles> | undefined
    >();
  });

  it('判据 2：`TimelineRef.nativeElement` 是 `HTMLElement | null`（不是 `HTMLDivElement`）', () => {
    expectTypeOf<TimelineRef['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
  });

  it('native item scopes are typed; children is not a prop', () => {
    expectTypeOf<TimelineProps>().not.toHaveProperty('children');
    expectTypeOf<NonNullable<TimelineSlots['itemContent']>>().parameters.toEqualTypeOf<
      [props: TimelineItemSlotProps]
    >();
    expectTypeOf<NonNullable<TimelineSlots['itemTitle']>>().returns.toEqualTypeOf<VNodeChild>();
    expectTypeOf<NonNullable<TimelineSlots['itemIcon']>>().returns.toEqualTypeOf<VNodeChild>();
    expectTypeOf<NonNullable<TimelineItemType['classNames']>>().not.toHaveProperty('subtitle');
    expectTypeOf<NonNullable<TimelineItemType['styles']>>().not.toHaveProperty('subtitle');
  });
});

describe('Timeline · native exports', () => {
  it('installs Timeline and removes the empty Item export', () => {
    expectTypeOf<typeof Timeline>().toHaveProperty('install');
    // Vue's ComponentOptionsBase has an open index signature; static Item absence
    // is checked at runtime, while named-export absence is checked below.
    expectTypeOf<typeof import('../index')>().not.toHaveProperty('TimelineItemComponent');
    expectTypeOf<keyof TimelineSlots>().toEqualTypeOf<'itemTitle' | 'itemContent' | 'itemIcon'>();
    expectTypeOf<TimelineItemSlotProps['item']>().toEqualTypeOf<TimelineItemType>();
    expectTypeOf<TimelineItemSlotProps['index']>().toEqualTypeOf<number>();
  });
});

describe('Timeline · 负例（永不调用的闭包内）', () => {
  it('非法的 `mode` / `orientation` / `placement` 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `children` 不是 prop（Vue 侧是默认插槽，规则 C19）
      const badChildren: TimelineProps = { children: 'x' };
      // @ts-expect-error `mode` 只有四个位置 + `alternate`
      const badMode: TimelineProps = { mode: 'diagonal' };
      // @ts-expect-error `orientation` 只有两个成员
      const badOrientation: TimelineProps = { orientation: 'diagonal' };
      // @ts-expect-error `items[].placement` 只有两个成员
      const badPlacement: TimelineItemType = { placement: 'left' };
      void [badChildren, badMode, badOrientation, badPlacement];
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('语义化槽里写 `itemSubtitle` 必须被拒绝（它被 `Omit` 掉了）', () => {
    const _never = () => {
      // @ts-expect-error `Timeline` 没有副标题槽
      const badSlot: TimelineProps = { classNames: { itemSubtitle: 'x' } };
      // @ts-expect-error Timeline has no rendered item subtitle region
      const badItemClass: TimelineItemType = { classNames: { subtitle: 'x' } };
      // @ts-expect-error Timeline has no rendered item subtitle region
      const badItemStyle: TimelineItemType = { styles: { subtitle: { color: 'red' } } };
      void [badSlot, badItemClass, badItemStyle];
    };
    expectTypeOf(_never).toBeFunction();
  });
});
