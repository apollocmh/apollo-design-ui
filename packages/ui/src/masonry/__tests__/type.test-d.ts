/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS）。
 *
 * ── 本文件钉的四类判据 ───────────────────────────────────────────────────────
 *
 * 1. **两个「展开」类型**（`MasonryItemRenderInfo` / `MasonryLayoutItem`）的
 *    `column` 是**非可选 `number`** —— 上游传的是 `{...item, index, column}`，
 *    即把解析出来的列号**覆盖**回 item 上。写窄（可选）会让消费者到处判空。
 * 2. **泛型 `ItemDataType` 的流向**：`MasonryItemType<T>['data']` 与
 *    `itemRender` 入参的 `data` 必须是同一个 `T`；默认参数是 `unknown`（H10 禁 `any`）。
 * 3. **`MasonryProps` 上不该有的键**（`value` / `onChange` / `multiple`）——
 *    本组件没有 `v-model`，也没有多选。
 * 4. 负例：非法 `columns` / `gutter` / `fresh` / `items` / 缺 `data`。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { Breakpoint } from '../../_internal/responsive-observer';
import type { Gutter } from '../../grid/interface';
import type {
  MasonryEmits,
  MasonryExpose,
  MasonryItemRenderInfo,
  MasonryItemType,
  MasonryKey,
  MasonryLayoutItem,
  MasonryProps,
  MasonryRef,
  MasonrySemanticClassNames,
  MasonrySemanticStyles,
} from '../interface';

describe('Masonry · Props 类型', () => {
  it('核心 props 的形态', () => {
    expectTypeOf<MasonryProps['columns']>().toEqualTypeOf<
      number | Partial<Record<Breakpoint, number>> | undefined
    >();
    // `gutter` 复用 grid 的 `Gutter`（上游就是 `RowProps['gutter']`）
    expectTypeOf<MasonryProps['gutter']>().toEqualTypeOf<Gutter | undefined>();
    expectTypeOf<MasonryProps['fresh']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<MasonryProps['items']>().toEqualTypeOf<MasonryItemType[] | undefined>();
    expectTypeOf<MasonryProps['classNames']>().toMatchTypeOf<
      | MasonrySemanticClassNames
      | ((info: { props: MasonryProps }) => MasonrySemanticClassNames)
      | undefined
    >();
    expectTypeOf<MasonryProps['styles']>().toMatchTypeOf<
      MasonrySemanticStyles | ((info: { props: MasonryProps }) => MasonrySemanticStyles) | undefined
    >();
  });

  it('`onLayoutChange` 的载荷是 `MasonryLayoutItem[]`', () => {
    expectTypeOf<NonNullable<MasonryProps['onLayoutChange']>>().parameters.toEqualTypeOf<
      [sortInfo: MasonryLayoutItem[]]
    >();
  });

  it('`MasonryKey` 是 `React.Key` 的对应物', () => {
    expectTypeOf<MasonryKey>().toEqualTypeOf<string | number>();
  });

  it('🚨 本组件**没有** `value` / `onChange` / `multiple`（无 v-model、无多选）', () => {
    expectTypeOf<MasonryProps>().not.toHaveProperty('value');
    expectTypeOf<MasonryProps>().not.toHaveProperty('onChange');
    expectTypeOf<MasonryProps>().not.toHaveProperty('multiple');
  });
});

describe('Masonry · 泛型与「展开」类型', () => {
  it("`MasonryItemType<T>['data']` 就是 `T`；默认参数是 `unknown`", () => {
    expectTypeOf<MasonryItemType<number>['data']>().toEqualTypeOf<number>();
    expectTypeOf<MasonryItemType['data']>().toEqualTypeOf<unknown>();
    expectTypeOf<MasonryItemType>().toMatchTypeOf<MasonryItemType<unknown>>();
  });

  it('🚨 `MasonryItemRenderInfo` / `MasonryLayoutItem` 的 `column` 是**非可选 number**', () => {
    expectTypeOf<MasonryItemRenderInfo<number>['column']>().toEqualTypeOf<number>();
    expectTypeOf<MasonryLayoutItem<number>['column']>().toEqualTypeOf<number>();
    // `index` 只出现在 itemRender 的入参里
    expectTypeOf<MasonryItemRenderInfo<number>['index']>().toEqualTypeOf<number>();
    expectTypeOf<MasonryLayoutItem<number>>().not.toHaveProperty('index');
  });

  it('两个「展开」类型都保留了 item 本体（`key` / `data` 还在）', () => {
    expectTypeOf<MasonryItemRenderInfo<string>['key']>().toEqualTypeOf<MasonryKey>();
    expectTypeOf<MasonryLayoutItem<string>['data']>().toEqualTypeOf<string>();
  });

  it('`itemRender` 的返回值是 `VNodeChild`', () => {
    expectTypeOf<NonNullable<MasonryProps['itemRender']>>().returns.toEqualTypeOf<VNodeChild>();
  });
});

describe('Masonry · emits / expose', () => {
  it('`MasonryEmits` 只有 `layoutChange`', () => {
    expectTypeOf<keyof MasonryEmits>().toEqualTypeOf<'layoutChange'>();
  });

  it('`MasonryRef.nativeElement` 可空；`MasonryExpose` 是函数形态', () => {
    expectTypeOf<MasonryRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf<MasonryExpose['nativeElement']>().toEqualTypeOf<() => HTMLDivElement | null>();
  });
});

describe('Masonry · 负例（永不调用的闭包内）', () => {
  it('非法的 columns / gutter / fresh / items 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `columns` 只接受数字或「断点 → 数字」的对象
      const badColumns: MasonryProps = { columns: 'three' };
      // @ts-expect-error `columns` 的对象值必须是数字
      const badColumnsValue: MasonryProps = { columns: { xs: 'one' } };
      // @ts-expect-error `gutter` 不接受任意对象（只有断点键）
      const badGutter: MasonryProps = { gutter: { bogus: 1 } };
      // @ts-expect-error `fresh` 是布尔
      const badFresh: MasonryProps = { fresh: 'yes' };
      // @ts-expect-error `items` 必须是数组
      const badItems: MasonryProps = { items: 'nope' };
      return [badColumns, badColumnsValue, badGutter, badFresh, badItems];
    };
    void _never;
  });

  it('item 的 `data` 是必填（`MasonryItemType` 不能只给 key）', () => {
    const _never = () => {
      // @ts-expect-error 缺 `data`
      const badItem: MasonryItemType = { key: 'a' };
      return badItem;
    };
    void _never;
  });

  it('`onLayoutChange` 的载荷形状不能写窄', () => {
    const _never = () => {
      // @ts-expect-error 载荷元素必须有 `column`
      const bad: MasonryProps = { onLayoutChange: (list: { key: string }[]) => void list };
      return bad;
    };
    void _never;
  });
});
