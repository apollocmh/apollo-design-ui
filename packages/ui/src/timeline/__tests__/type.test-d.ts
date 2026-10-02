/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS 74）。
 *
 * ── 本文件钉的六类判据 ───────────────────────────────────────────────────────
 *
 * 1. **本组件「没有」的东西**：`children` prop（Vue 侧是默认插槽，规则 C19）；
 *    `Timeline` **没有** `emits`（全部回调都在 `items` 里或走 `attrs`）。
 * 2. **`ref` 的形状**：`{ nativeElement: HTMLElement | null }` —— ⚠️ 上游**没有 ref**
 *    （它没有自己的 DOM）；本仓取 **`Steps` 的根元素**，所以类型是 `HTMLElement` 而不是
 *    `HTMLDivElement`（`ol` / `div` 都可能）。
 * 3. **`TimelineItemType` 的四个废弃字段**（`label` / `children` / `dot` / `position`）。
 * 4. **语义化槽是 `Steps` 的十槽去掉 `itemSubtitle`**（用 `Omit`，与 D36 同判）。
 * 5. **`TimelineConfig` = `ComponentStyleConfig & Pick<TimelineProps,'classNames'|'styles'>`**
 *    （与 `card` 同判）。
 * 6. **复合组件**：`Timeline.Item` 在**类型层**可见（`Object.assign` 的交叉类型）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type { StepsVariant } from '../../steps/interface';
import type { Timeline, TimelineItemComponent } from '../index';
import type {
  ItemPlacement,
  ItemPosition,
  TimelineColor,
  TimelineConfig,
  TimelineItemType,
  TimelineMode,
  TimelineProps,
  TimelineRef,
  TimelineSemanticClassNames,
  TimelineSemanticStyles,
  TimelineSemanticValue,
  TimelineSlot,
} from '../interface';

describe('Timeline · Props 类型', () => {
  it('核心 props 的形态', () => {
    expectTypeOf<TimelineProps['prefixCls']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TimelineProps['className']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TimelineProps['rootClassName']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TimelineProps['style']>().toEqualTypeOf<CSSProperties | undefined>();
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

  it('判据 1：`children` 不在 `TimelineProps` 里（Vue 侧是默认插槽）', () => {
    expectTypeOf<TimelineProps>().not.toHaveProperty('children');
    expectTypeOf<TimelineSlot>().toEqualTypeOf<() => VNodeChild>();
  });
});

describe('Timeline · 复合组件（类型层）', () => {
  it('判据 6：`Timeline.Item` 可见，且两个组件都带 `install`', () => {
    expectTypeOf<typeof Timeline>().toHaveProperty('Item');
    expectTypeOf<typeof Timeline>().toHaveProperty('install');
    expectTypeOf<typeof TimelineItemComponent>().toHaveProperty('install');
    expectTypeOf<(typeof Timeline)['Item']>().toEqualTypeOf<typeof TimelineItemComponent>();
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
      void badSlot;
    };
    expectTypeOf(_never).toBeFunction();
  });
});
