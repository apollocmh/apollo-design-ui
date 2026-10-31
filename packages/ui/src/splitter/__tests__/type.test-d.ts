/**
 * L3 · 类型测试（Splitter）—— 负例闭包。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Splitter, SplitterPanel } from '../index';
import type {
  PanelCollapsible,
  ShowCollapsibleIconMode,
  SplitterEmits,
  SplitterPanelRef,
  SplitterPanelSlots,
  SplitterProps,
  SplitterRef,
  SplitterSemanticClassNames,
  SplitterSlots,
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

  it('uses actual constructors for Vue slots, owned listeners and exposed native roots', () => {
    const slots: SplitterSlots = {
      default: () => [h(SplitterPanel, { style: ['padding:2px', { color: 'red' }] })],
      draggerIcon: () => [0, h('b', 'Handle')],
    };
    const panelSlots: SplitterPanelSlots = { default: () => [0, h('input')] };
    h(
      Splitter,
      {
        onResizeStart: (sizes: number[]) => sizes.at(0),
        onCollapse: (collapsed: boolean[], sizes: number[]) => [collapsed, sizes],
      },
      slots,
    );
    h(Splitter.Panel, { size: '40%' }, panelSlots);
    expectTypeOf<InstanceType<typeof Splitter>['nativeElement']>().toEqualTypeOf<
      SplitterRef['nativeElement']
    >();
    expectTypeOf<InstanceType<typeof SplitterPanel>['nativeElement']>().toEqualTypeOf<
      SplitterPanelRef['nativeElement']
    >();
    expectTypeOf<SplitterEmits['resizeStart']>().toEqualTypeOf<[sizes: number[]]>();
    expectTypeOf<keyof SplitterSlots>().toEqualTypeOf<'default' | 'draggerIcon'>();
    const emit = (root: InstanceType<typeof Splitter>) => {
      root.$emit('resizeStart', [100, 200]);
      root.$emit('resizeEnd', [100, 200]);
      root.$emit('collapse', [true, false], [0, 300]);
      // @ts-expect-error Owned resize receives actual sizes, not a DOM Event.
      root.$emit('resize', new Event('resize'));
      // @ts-expect-error camelCase is the one owned event name; templates kebab-case naturally.
      root.$emit('resize-start', [100, 200]);
      // @ts-expect-error Collapsed state and sizes are two distinct required payloads.
      root.$emit('collapse', [100, 200]);
    };
    void emit;
    const invalid = () => {
      // @ts-expect-error resize listeners receive numeric sizes, not a MouseEvent.
      h(Splitter, { onResize: (_event: MouseEvent) => {} });
    };
    void invalid;
  });
});
