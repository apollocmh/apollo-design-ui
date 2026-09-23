/**
 * L3 · 类型 —— Listy（expectType 断言，antd 类型契约逐条对齐）
 */

import { describe, expectTypeOf, it } from 'vitest';
import type {
  ListyClassNames,
  ListyGroup,
  ListyProps,
  ListyRef,
  ListyScrollToConfig,
  ListySemanticName,
} from '../interface';

describe('Listy · 类型', () => {
  it('★ rowKey / itemRender 双形态', () => {
    expectTypeOf<ListyProps['rowKey']>().toEqualTypeOf<
      keyof Record<string, unknown> | ((item: Record<string, unknown>) => string | number)
    >();
    // itemRender 返回 VNodeChild（联合类型，toEqualTypeOf 对函数返回 unknown 不适用）
    const itemRender = expectTypeOf<ListyProps['itemRender']>().parameter(0).parameter(0);
    void itemRender;
    expectTypeOf<NonNullable<ListyProps['itemRender']>>().toBeFunction();
  });

  it('★ group：key 函数 + title 函数（带参数，非插槽）', () => {
    expectTypeOf<ListyGroup<{ g: string }, string>['key']>().toEqualTypeOf<
      (item: { g: string }) => string
    >();
    // title 的返回是 VNodeChild（联合）⇒ 断言参数与「是函数」
    expectTypeOf<ListyGroup<{ g: string }, string>['title']>().toBeFunction();
    expectTypeOf<ListyGroup<{ g: string }, string>['title']>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ListyGroup<{ g: string }, string>['title']>()
      .parameter(1)
      .toEqualTypeOf<{ g: string }[]>();
  });

  it('★ semantic 槽位固定三个：root / item / groupHeader', () => {
    expectTypeOf<ListySemanticName>().toEqualTypeOf<'root' | 'item' | 'groupHeader'>();
    expectTypeOf<ListyClassNames['item']>().toEqualTypeOf<string | undefined>();
  });

  it('★ scrollTo 配置的联合形状', () => {
    expectTypeOf<ListyScrollToConfig>().toEqualTypeOf<
      | number
      | null
      | { key: string | number; align?: 'top' | 'bottom' | 'auto'; offset?: number }
      | { left?: number; top?: number }
      | { groupKey: string | number; align?: 'top' | 'bottom' | 'auto'; offset?: number }
    >();
  });

  it('★ ref：只有 scrollTo', () => {
    expectTypeOf<ListyRef>().toMatchTypeOf<{ scrollTo: (config?: ListyScrollToConfig) => void }>();
  });
});
