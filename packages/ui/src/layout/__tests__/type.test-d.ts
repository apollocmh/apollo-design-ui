/**
 * L3 · 类型测试（Layout）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里：只在类型层面存在，不产生运行时行为。
 */

import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Content, Footer, Header, Layout, Sider } from '../index';
import type { CollapseType, LayoutProps, SiderProps } from '../interface';

it('LayoutProps 的字段类型', () => {
  expectTypeOf<LayoutProps['hasSider']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<LayoutProps['prefixCls']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<keyof LayoutProps>().toEqualTypeOf<'prefixCls' | 'hasSider'>();
});

it('根 `class` / `style` 是 Vue 原生 attrs（不在 LayoutProps / SiderProps 键集里）', () => {
  type LayoutPublic = InstanceType<typeof Layout>['$props'];
  const nativeAttrs: LayoutPublic = { class: ['a', { b: true }], style: { color: 'red' } };
  expectTypeOf(nativeAttrs).toMatchTypeOf<LayoutPublic>();

  const _never = () => {
    // @ts-expect-error `className` 由 Vue 原生 `class` 取代
    const badLayout: LayoutProps = { className: 'legacy' };
    // @ts-expect-error 原生 `style` 不是 SiderProps
    const badSider: SiderProps = { style: { color: 'red' } };
    return [badLayout, badSider];
  };
  void _never;
});

it('SiderProps 的字段类型', () => {
  expectTypeOf<SiderProps['width']>().toEqualTypeOf<number | string | undefined>();
  expectTypeOf<SiderProps['collapsedWidth']>().toEqualTypeOf<number | string | undefined>();
  expectTypeOf<SiderProps['theme']>().toEqualTypeOf<'light' | 'dark' | undefined>();
  expectTypeOf<SiderProps['breakpoint']>().toEqualTypeOf<
    'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | undefined
  >();
  expectTypeOf<SiderProps['onCollapse']>().toEqualTypeOf<
    ((collapsed: boolean, type: 'clickTrigger' | 'responsive') => void) | undefined
  >();
});

it('语义化支持对象与函数两态', () => {
  const obj: SiderProps = {
    classNames: { root: 'r', body: 'b' },
    styles: { root: { color: 'red' } },
  };
  const fn: SiderProps = {
    classNames: ({ props }) => ({ body: props.collapsed ? 'c' : 'e' }),
    styles: ({ props }) => ({ body: { opacity: props.collapsed ? 0.5 : 1 } }),
  };
  expectTypeOf(obj).toEqualTypeOf<SiderProps>();
  expectTypeOf(fn).toEqualTypeOf<SiderProps>();
});

it('四个组件都能被 h() 调用', () => {
  expectTypeOf(h(Layout)).toBeObject();
  expectTypeOf(h(Header)).toBeObject();
  expectTypeOf(h(Footer)).toBeObject();
  expectTypeOf(h(Content)).toBeObject();
  expectTypeOf(h(Sider)).toBeObject();
});

it('Layout 静态属性（复合组件形态）', () => {
  // 组件对象是「可构造的函数」—— 直接断言它不可行，改判「能被 h() 调用」
  expectTypeOf(h(Layout.Sider)).toBeObject();
  expectTypeOf(h(Layout.Content)).toBeObject();
  expectTypeOf(h(Layout.Footer)).toBeObject();
  expectTypeOf(h(Layout.Header)).toBeObject();
});

// ─────────────────────────────────────────────────────────────────────────────
// 负例
// ─────────────────────────────────────────────────────────────────────────────

it('负例：theme / breakpoint 是受限联合', () => {
  // @ts-expect-error theme 只接受 light / dark
  const badTheme: SiderProps = { theme: 'blue' };
  // @ts-expect-error breakpoint 不接受任意字符串
  const badBreakpoint: SiderProps = { breakpoint: 'huge' };
  void badTheme;
  void badBreakpoint;
});

it('负例：语义槽只有 root / body 两键', () => {
  // @ts-expect-error 没有 title 槽
  const badSlot: SiderProps = { classNames: { title: 't' } };
  void badSlot;
});

it('负例：CollapseType 只有两个取值', () => {
  // ⚠️ 不能用「函数参数类型不符」做负例 —— TS 的函数参数是双变的，宽参数类型
  //    会被接受。直接钉联合类型本身。
  // @ts-expect-error 不接受 'hover'
  const badType: CollapseType = 'hover';
  void badType;
});

it('负例：LayoutProps 没有语义化槽位', () => {
  // Layout 本体不做语义化（antd 同）
  // @ts-expect-error Layout 无 classNames
  const badLayout: LayoutProps = { classNames: { root: 'r' } };
  void badLayout;
});
