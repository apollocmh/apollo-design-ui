/**
 * L3 · 类型测试（Splitter）—— 负例闭包。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { Splitter, SplitterPanel } from '../index';
import type {
  PanelCollapsible,
  ShowCollapsibleIconMode,
  SplitterProps,
  SplitterRef,
  SplitterSemanticClassNames,
} from '../interface';

describe('Splitter · 类型', () => {
  it('Splitter 是组件，nativeElement ref 可达', () => {
    expectTypeOf(Splitter).toBeObject();
    expectTypeOf<SplitterRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  /**
   * 🚨 回归哨兵（2026-10-01 补）：本仓的「可安装」断言是**逐组件写在各自主 L3 类型测试**里的，
   * 而 splitter **漏了这条** ⇒ `withInstall` 一直没套上、`app.use(Splitter)` 静默失效。
   * 复合组件与具名面板都要能全局注册。
   */
  it('★ `Splitter` / `SplitterPanel` 都是可安装的组件（`withInstall` 的产物）', () => {
    expectTypeOf(Splitter).toHaveProperty('install');
    expectTypeOf(SplitterPanel).toHaveProperty('install');
  });

  it('Splitter.Panel 存在（复合组件）', () => {
    expectTypeOf(Splitter.Panel).toBeObject();
  });

  it('★ orientation / layout 字面量集合', () => {
    expectTypeOf<NonNullable<SplitterProps['orientation']>>().toEqualTypeOf<
      'horizontal' | 'vertical'
    >();
    expectTypeOf<NonNullable<SplitterProps['layout']>>().toEqualTypeOf<'horizontal' | 'vertical'>();
  });

  it('★ showCollapsibleIcon：true | false | auto', () => {
    expectTypeOf<ShowCollapsibleIconMode>().toEqualTypeOf<boolean | 'auto'>();
  });

  it('★ panel collapsible 对象形态的三键', () => {
    expectTypeOf<keyof PanelCollapsible>().toEqualTypeOf<'start' | 'end' | 'showCollapsibleIcon'>();
  });

  it('★ 语义槽：root/panel 是 string，dragger 支持 string|对象（toEqualTypeOf 对可选键的 undefined 展开过严 ⇒ 用可赋值断言）', () => {
    expectTypeOf<string>().toMatchTypeOf<NonNullable<SplitterSemanticClassNames['dragger']>>();
    expectTypeOf<{ default?: string }>().toMatchTypeOf<
      NonNullable<SplitterSemanticClassNames['dragger']>
    >();
    expectTypeOf<NonNullable<SplitterSemanticClassNames['root']>>().toBeString();
  });

  it('★ 事件回调的 sizes 是 number[]', () => {
    expectTypeOf<NonNullable<SplitterProps['onResize']>>().toEqualTypeOf<
      (sizes: number[]) => void
    >();
    expectTypeOf<NonNullable<SplitterProps['onCollapse']>>()
      .parameter(0)
      .toEqualTypeOf<boolean[]>();
  });
});
