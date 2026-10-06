/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS 74）。
 *
 * ── 本文件钉的六类判据 ───────────────────────────────────────────────────────
 *
 * 1. **本组件「没有」的东西**：`children` prop（Vue 侧是默认插槽，规则 C19）；
 *    `List` **没有** `emits`（分页回调是 `pagination` 对象里的键，不是组件事件）。
 * 2. **`ref` 的形状**：`{ nativeElement }` 且**可空**（`List` / `List.Item` / `Meta` 都是 `<div>`）。
 * 3. **`ListGridType` 的九个键**：`gutter` / `column` + 7 个断点（`xs`…`xxxl`）。
 * 4. **`ListSize` 是三个字面量**（`'small' | 'default' | 'large'`）—— 与 `SizeType` 不同
 *    （**没有** `'middle'` / `'medium'`）。
 * 5. **语义化槽只在 `List.Item` 上**（`actions` / `extra`）；`List` 本身**没有**
 *    `classNames` / `styles`（与 card / empty / skeleton 不同）。
 * 6. **复合组件**：`List.Item` / `List.Item.Meta` 在**类型层**可见
 *    （`Object.assign` 的交叉类型），三个组件都带 `install`。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type { Breakpoint } from '../../_internal/responsive-observer';
import type { Gutter } from '../../grid/interface';
import type { PaginationConfig } from '../../pagination/interface';
import type { SpinProps } from '../../spin/interface';
import type { List, ListItem, ListItemMeta } from '../index';
import type {
  ColumnCount,
  ColumnType,
  ListConfig,
  ListConsumerProps,
  ListGridType,
  ListItemLayout,
  ListItemMetaProps,
  ListItemMetaRef,
  ListItemMetaSlot,
  ListItemProps,
  ListItemSemanticClassNames,
  ListItemSemanticName,
  ListItemSemanticStyles,
  ListItemSlot,
  ListLocale,
  ListProps,
  ListRef,
  ListSize,
  ListSlot,
} from '../interface';

describe('List · Props 类型', () => {
  it('核心 props 的形态', () => {
    expectTypeOf<ListProps['prefixCls']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ListProps['bordered']>().toEqualTypeOf<boolean | undefined>();
    // 根 class/style 走 Vue 原生 attrs，不在 ListProps 键集里
    expectTypeOf<
      Extract<keyof ListProps, 'className' | 'rootClassName' | 'style'>
    >().toEqualTypeOf<never>();
    expectTypeOf<ListProps['id']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ListProps['split']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ListProps['itemLayout']>().toEqualTypeOf<ListItemLayout | undefined>();
    expectTypeOf<ListProps['size']>().toEqualTypeOf<ListSize | undefined>();
    expectTypeOf<ListProps['grid']>().toEqualTypeOf<ListGridType | undefined>();
    expectTypeOf<ListProps['locale']>().toEqualTypeOf<ListLocale | undefined>();
  });

  it('内容类 prop 是 `VNodeChild`（**不是**插槽 —— 与 card 同判）', () => {
    expectTypeOf<ListProps['header']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<ListProps['footer']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<ListProps['loadMore']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<ListProps['extra']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<ListItemProps['extra']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<ListItemMetaProps['title']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<ListItemMetaProps['description']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<ListItemMetaProps['avatar']>().toEqualTypeOf<VNodeChild>();
  });

  it('`dataSource` / `renderItem` / `rowKey` 是泛型默认实例化（`unknown`）', () => {
    expectTypeOf<ListProps['dataSource']>().toEqualTypeOf<unknown[] | undefined>();
    expectTypeOf<ListProps['renderItem']>().toEqualTypeOf<
      ((item: unknown, index: number) => VNodeChild) | undefined
    >();
    // ⚠️ `rowKey` 是「函数 | 字段名」的四元联合：`toEqualTypeOf` 的约束检查
    //    在「联合里含函数」时会退化成 `Expected X, Actual never` ⇒ 用 `toMatchTypeOf`。
    expectTypeOf<ListProps['rowKey']>().toMatchTypeOf<
      ((item: unknown) => string | number) | string | number | undefined
    >();
  });

  it('`loading` / `pagination` 的联合', () => {
    expectTypeOf<ListProps['loading']>().toEqualTypeOf<boolean | SpinProps | undefined>();
    expectTypeOf<ListProps['pagination']>().toEqualTypeOf<PaginationConfig | false | undefined>();
  });

  it('判据 3：`ListGridType` 的九个键，`gutter` 复用 `Row` 的 `Gutter`', () => {
    expectTypeOf<ListGridType['gutter']>().toEqualTypeOf<Gutter | undefined>();
    expectTypeOf<ListGridType['column']>().toEqualTypeOf<ColumnCount | undefined>();
    for (const key of ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const) {
      expectTypeOf<ListGridType[typeof key]>().toEqualTypeOf<ColumnCount | undefined>();
    }
    expectTypeOf<ColumnType>().toEqualTypeOf<'gutter' | 'column' | Breakpoint>();
  });

  it('判据 4：`ListSize` 只有三个字面量（**没有** `middle` / `medium`）', () => {
    expectTypeOf<ListSize>().toEqualTypeOf<'small' | 'default' | 'large'>();
    expectTypeOf<ListItemLayout>().toEqualTypeOf<'horizontal' | 'vertical'>();
  });

  it('`ListLocale.emptyText` 是**必填**（上游非可选）', () => {
    expectTypeOf<ListLocale['emptyText']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<ListLocale>().toHaveProperty('emptyText');
  });

  it('`List.Item` 的 `actions` 是 `VNodeChild[]`', () => {
    expectTypeOf<ListItemProps['actions']>().toEqualTypeOf<VNodeChild[] | undefined>();
    expectTypeOf<ListItemProps['colStyle']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('判据 5：语义化槽只在 `List.Item` 上（`actions` / `extra`）', () => {
    expectTypeOf<ListItemSemanticName>().toEqualTypeOf<'actions' | 'extra'>();
    expectTypeOf<ListItemSemanticClassNames['actions']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ListItemSemanticClassNames['extra']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ListItemSemanticStyles['actions']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<ListItemSemanticStyles['extra']>().toEqualTypeOf<CSSProperties | undefined>();
    // ⚠️ `ListProps` **没有** `classNames` / `styles`
    expectTypeOf<ListProps>().not.toHaveProperty('classNames');
    expectTypeOf<ListProps>().not.toHaveProperty('styles');
  });

  it('判据 2：两个 `ref` 都是 `{ nativeElement: … | null }`', () => {
    expectTypeOf<ListRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf<ListItemMetaRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('判据 1：`children` 不在任何 Props 里（Vue 侧是默认插槽）', () => {
    expectTypeOf<ListProps>().not.toHaveProperty('children');
    expectTypeOf<ListItemProps>().not.toHaveProperty('children');
    expectTypeOf<ListItemMetaProps>().not.toHaveProperty('children');
    // 三个默认插槽类型
    expectTypeOf<ListSlot>().toEqualTypeOf<() => VNodeChild>();
    expectTypeOf<ListItemSlot>().toEqualTypeOf<() => VNodeChild>();
    expectTypeOf<ListItemMetaSlot>().toEqualTypeOf<() => VNodeChild>();
  });

  it('`ListConsumerProps` 与上游 `ListContext` 同形', () => {
    expectTypeOf<ListConsumerProps['grid']>().toEqualTypeOf<ListGridType | undefined>();
    expectTypeOf<ListConsumerProps['itemLayout']>().toEqualTypeOf<string | undefined>();
  });

  it('`ListConfig` 比 card / empty **多一层 `item`**（语义化槽的底座）', () => {
    expectTypeOf<ListConfig['className']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ListConfig['style']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<NonNullable<ListConfig['item']>['classNames']>().toEqualTypeOf<
      ListItemSemanticClassNames | undefined
    >();
    expectTypeOf<NonNullable<ListConfig['item']>['styles']>().toEqualTypeOf<
      ListItemSemanticStyles | undefined
    >();
  });
});

describe('List · 复合组件（类型层）', () => {
  it('判据 6：`List.Item` / `List.Item.Meta` 静态属性可见，且都带 `install`', () => {
    expectTypeOf<typeof List>().toHaveProperty('Item');
    expectTypeOf<typeof List>().toHaveProperty('install');
    expectTypeOf<typeof ListItem>().toHaveProperty('Meta');
    expectTypeOf<typeof ListItem>().toHaveProperty('install');
    expectTypeOf<typeof ListItemMeta>().toHaveProperty('install');
    // 静态属性与具名导出是**同一个类型**
    expectTypeOf<(typeof List)['Item']>().toEqualTypeOf<typeof ListItem>();
    expectTypeOf<(typeof ListItem)['Meta']>().toEqualTypeOf<typeof ListItemMeta>();
  });
});

describe('List · 负例（永不调用的闭包内）', () => {
  it('非法的 `size` / `itemLayout` / `grid` 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `children` 不是 prop（Vue 侧是默认插槽，规则 C19）
      const badChildren: ListProps = { children: 'x' };
      // @ts-expect-error `size` 只有 `'small' | 'default' | 'large'`
      const badSize: ListProps = { size: 'medium' };
      // @ts-expect-error `itemLayout` 只有两个成员
      const badLayout: ListProps = { itemLayout: 'diagonal' };
      // @ts-expect-error `grid.column` 是数字
      const badGrid: ListProps = { grid: { column: '3' } };
      // @ts-expect-error `pagination` 是 `PaginationConfig | false`
      const badPagination: ListProps = { pagination: 'yes' };
      // @ts-expect-error `List` 没有 `classNames` 语义化槽
      const badClassNames: ListProps = { classNames: { root: 'x' } };
      void [badChildren, badSize, badLayout, badGrid, badPagination, badClassNames];
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('`List.Item` 的非法语义化槽 / `actions` 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error 语义化槽只有 `actions` / `extra`
      const badSlot: ListItemProps = { classNames: { root: 'x' } };
      // @ts-expect-error `actions` 是数组，不是单个节点
      const badActions: ListItemProps = { actions: 'a' };
      // @ts-expect-error `List.Item` 没有 `bordered`
      const badBordered: ListItemProps = { bordered: true };
      void [badSlot, badActions, badBordered];
    };
    expectTypeOf(_never).toBeFunction();
  });

  it('`ListLocale.emptyText` 必填 —— 空对象不合法', () => {
    const _never = () => {
      // @ts-expect-error `emptyText` 是必填字段
      const badLocale: ListLocale = {};
      void badLocale;
    };
    expectTypeOf(_never).toBeFunction();
  });
});
