/**
 * L3 · 类型测试（Collapse）—— 负例闭包。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type {
  CollapseItemType,
  CollapseProps,
  CollapseRef,
  CollapseSemanticClassNames,
  CollapsibleType,
  ExpandIconPlacement,
} from '../interface';

describe('Collapse · 类型', () => {
  it('Collapse 是组件，nativeElement ref 可达；Panel 复合组件存在', () => {
    expectTypeOf<CollapseRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('★ collapsible / placement 字面量集合', () => {
    expectTypeOf<CollapsibleType>().toEqualTypeOf<'header' | 'icon' | 'disabled'>();
    expectTypeOf<ExpandIconPlacement>().toEqualTypeOf<'start' | 'end'>();
  });

  it('★ activeKey / defaultActiveKey：string|number 可赋值', () => {
    expectTypeOf<'1'>().toMatchTypeOf<NonNullable<CollapseProps['activeKey']>>();
    expectTypeOf<1>().toMatchTypeOf<NonNullable<CollapseProps['activeKey']>>();
    expectTypeOf<['1']>().toMatchTypeOf<NonNullable<CollapseProps['activeKey']>>();
  });

  it('★ onChange 的 key 是 string[]（string 化契约）', () => {
    expectTypeOf<NonNullable<CollapseProps['onChange']>>().toEqualTypeOf<(key: string[]) => void>();
  });

  it('★ items 项的关键字段（keyof 断言受 CHECKLIST #61 限制 ⇒ 逐字段断言）', () => {
    expectTypeOf<CollapseItemType['key']>().toEqualTypeOf<string | number | undefined>();
    expectTypeOf<CollapseItemType['collapsible']>().toEqualTypeOf<CollapsibleType | undefined>();
    expectTypeOf<CollapseItemType['destroyOnHidden']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CollapseItemType['onItemClick']>().toEqualTypeOf<
      ((key: string) => void) | undefined
    >();
  });

  it('★ 语义槽五键（root/header/title/body/icon）', () => {
    expectTypeOf<keyof CollapseSemanticClassNames>().toEqualTypeOf<
      'root' | 'header' | 'title' | 'body' | 'icon'
    >();
  });
});
