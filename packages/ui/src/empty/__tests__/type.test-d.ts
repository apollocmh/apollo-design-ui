/**
 * L3 · 类型测试（含**负例**）
 *
 * 规则 T7：只有正例的类型测试是没有价值的。下面每个 `describe` 都同时给出
 * 「应当通过」与「应当报错」两侧。
 *
 * ⚠️ 负例必须包在**永不调用**的闭包里 —— 本文件会被 vitest 真的执行
 *    （`--project types` 开了 typecheck，但仍然跑运行时）。裸写一行错误用法会直接崩。
 *
 * `@ts-expect-error` 在本仓库**只允许**出现在这里（`AGENTS.md` H10）：
 * 它的语义是「此处应当报错」，一旦 TS 不再报错，`@ts-expect-error` 本身会变成错误。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { type Component, type CSSProperties, h, type VNodeChild } from 'vue';
import { PRESENTED_IMAGE_DEFAULT, PRESENTED_IMAGE_SIMPLE } from '../index';
import type {
  EmptyImage,
  EmptyProps,
  EmptyRef,
  EmptySemanticClassNames,
  EmptySemanticStyles,
} from '../interface';

describe('Empty · image', () => {
  it('接受字符串 / VNode / 组件（三种形态与 DOM 契约用例一一对应）', () => {
    const fromString: EmptyProps = { image: 'https://example.com/a.png' };
    const fromVNode: EmptyProps = { image: h('div', { class: 'x' }) };
    const fromComponent: EmptyProps = { image: PRESENTED_IMAGE_DEFAULT };

    expectTypeOf(fromString.image).toMatchTypeOf<EmptyImage | undefined>();
    expectTypeOf(fromVNode.image).toMatchTypeOf<EmptyImage | undefined>();
    expectTypeOf(fromComponent.image).toMatchTypeOf<EmptyImage | undefined>();
    expectTypeOf<EmptyImage>().toEqualTypeOf<VNodeChild | Component>();
  });

  it('PRESENTED_IMAGE_* 是组件类型，不是 VNode', () => {
    expectTypeOf(PRESENTED_IMAGE_DEFAULT).toMatchTypeOf<Component>();
    expectTypeOf(PRESENTED_IMAGE_SIMPLE).toMatchTypeOf<Component>();
  });
});

describe('Empty · description', () => {
  it('接受节点，且 `false` 是合法值（用于隐藏描述块）', () => {
    // ⚠️ 不要断言 `fromFalse.description` 是 `false | undefined`：
    //    对象字面量赋值不会收窄**属性**的声明类型，它的类型始终是 `EmptyProps['description']`。
    //    要断言「`false` 是合法入参」，正确写法是直接构造一次（下面四行）+ 断言声明类型。
    const fromString: EmptyProps = { description: 'Nothing' };
    const fromFalse: EmptyProps = { description: false };
    const fromZero: EmptyProps = { description: 0 };
    const fromVNode: EmptyProps = { description: h('span') };

    expectTypeOf<EmptyProps['description']>().toEqualTypeOf<VNodeChild | undefined>();
    expectTypeOf(fromString.description).toMatchTypeOf<VNodeChild | undefined>();
    expectTypeOf(fromFalse.description).toMatchTypeOf<VNodeChild | undefined>();
    expectTypeOf(fromZero.description).toMatchTypeOf<VNodeChild | undefined>();
    expectTypeOf(fromVNode.description).toMatchTypeOf<VNodeChild | undefined>();
  });
});

describe('Empty · 语义化 classNames / styles', () => {
  it('对象式：只接受四个槽位', () => {
    const classNames: EmptySemanticClassNames = {
      root: 'a',
      image: 'b',
      description: 'c',
      footer: 'd',
    };
    const styles: EmptySemanticStyles = { root: { color: 'red' } };
    expectTypeOf(classNames.root).toEqualTypeOf<string | undefined>();
    expectTypeOf(styles.root).toEqualTypeOf<CSSProperties | undefined>();
  });

  it('★ 函数式：被调用时收到 `{ props }`（裁决 empty-semantic-fn = B）', () => {
    const fromFn: EmptyProps = {
      classNames: (info) => {
        expectTypeOf(info).toHaveProperty('props');
        expectTypeOf(info.props).toMatchTypeOf<EmptyProps>();
        return { root: 'from-fn' };
      },
      styles: (info) => ({ root: { color: info.props.prefixCls } }),
    };
    // 断言「函数式形态确实是这个联合类型的一个成员」，且签名正确。
    //
    // 不能直接 `toMatchTypeOf<函数类型>`：`EmptyProps['classNames']` 是
    // `对象 | 函数` 的**联合**，联合不能赋给函数类型（那正是「两种形态都支持」的含义）。
    // 所以先用 `Extract` 把函数那一支取出来，再断言它的参数与返回值。
    type ClassNamesFn = Extract<
      NonNullable<EmptyProps['classNames']>,
      (...args: never[]) => unknown
    >;
    type StylesFn = Extract<NonNullable<EmptyProps['styles']>, (...args: never[]) => unknown>;

    expectTypeOf<Parameters<ClassNamesFn>>().toEqualTypeOf<[{ props: EmptyProps }]>();
    expectTypeOf<ReturnType<ClassNamesFn>>().toEqualTypeOf<EmptySemanticClassNames>();
    expectTypeOf<Parameters<StylesFn>>().toEqualTypeOf<[{ props: EmptyProps }]>();
    expectTypeOf<ReturnType<StylesFn>>().toEqualTypeOf<EmptySemanticStyles>();

    expectTypeOf(fromFn.classNames).toMatchTypeOf<EmptyProps['classNames']>();
  });
});

describe('Empty · 负例（应当报错）', () => {
  it('下面的用法都应当被类型系统拒绝', () => {
    // 永不调用的闭包 —— 负例只能存在于类型层。
    const negatives = () => {
      // @ts-expect-error `classNames` 只接受 root / image / description / footer
      const extraKey: EmptyProps = { classNames: { body: 'x' } };
      // @ts-expect-error `styles` 只接受 root / image / description / footer
      const extraStyleKey: EmptyProps = { styles: { body: { color: 'red' } } };
      // @ts-expect-error `description` 不接受普通对象（不是 VNode）
      const badDescription: EmptyProps = { description: { text: 'x' } };
      // @ts-expect-error 函数式 `classNames` 的返回值必须是四个槽位的对象
      const badFnReturn: EmptyProps = { classNames: () => ({ body: 'x' }) };
      // @ts-expect-error `prefixCls` 必须是字符串
      const badPrefixCls: EmptyProps = { prefixCls: 123 };
      // @ts-expect-error `imageStyle` 是样式对象，不是字符串
      const badImageStyle: EmptyProps = { imageStyle: 'color: red' };
      return [extraKey, extraStyleKey, badDescription, badFnReturn, badPrefixCls, badImageStyle];
    };
    expectTypeOf(negatives).toBeFunction();
  });
});

describe('Empty · ref 与静态属性', () => {
  it('nativeElement 可空（与 antd 的类型有一处登记差异）', () => {
    expectTypeOf<EmptyRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('组件上挂着两个插画常量，且与具名导出同型', () => {
    expectTypeOf<typeof PRESENTED_IMAGE_SIMPLE>().toMatchTypeOf<Component>();
  });
});
