/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { Flex } from '../index';
import type {
  FlexAlign,
  FlexComponent,
  FlexJustify,
  FlexProps,
  FlexRef,
  FlexWrap,
} from '../interface';

describe('Flex · Props 类型', () => {
  it('合法取值可通过类型检查', () => {
    expectTypeOf<FlexProps>().toMatchTypeOf<{
      vertical?: boolean;
      orientation?: 'horizontal' | 'vertical';
    }>();
    expectTypeOf<FlexProps['wrap']>().toEqualTypeOf<boolean | FlexWrap | undefined>();
    expectTypeOf<FlexProps['justify']>().toEqualTypeOf<FlexJustify | undefined>();
    expectTypeOf<FlexProps['align']>().toEqualTypeOf<FlexAlign | undefined>();
    expectTypeOf<FlexProps['gap']>().toMatchTypeOf<string | number | undefined>();
    expectTypeOf<FlexProps['component']>().toEqualTypeOf<FlexComponent | undefined>();
  });

  it('gap 的预设串有字面量补全（small / medium / middle / large）', () => {
    expectTypeOf<'small'>().toMatchTypeOf<NonNullable<FlexProps['gap']>>();
    expectTypeOf<'middle'>().toMatchTypeOf<NonNullable<FlexProps['gap']>>();
  });

  it('根 `class` / `style` 是 Vue 原生 attrs，不重复声明为 FlexProps', () => {
    type PublicProps = InstanceType<typeof Flex>['$props'];
    const nativeAttrs: PublicProps = {
      class: ['native-flex', { active: true }],
      style: { color: 'red' },
    };
    expectTypeOf(nativeAttrs).toMatchTypeOf<PublicProps>();

    const _never = () => {
      // @ts-expect-error `className` 由 Vue 原生 `class` 取代
      const badClassName: FlexProps = { className: 'legacy' };
      // @ts-expect-error `rootClassName` 不是 Flex 的 prop
      const badRootClassName: FlexProps = { rootClassName: 'legacy' };
      // @ts-expect-error 原生 `style` 不是 FlexProps
      const badStyle: FlexProps = { style: { color: 'red' } };
      return [badClassName, badRootClassName, badStyle];
    };
    void _never;
  });
});

describe('Flex · 负例（永不调用的闭包内）', () => {
  it('非法的 justify / wrap / orientation 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error 'invalid' 不是合法的 justify 值
      const badJustify: FlexProps = { justify: 'invalid' };
      // @ts-expect-error 'bogus' 不是合法的 wrap 值（boolean | FlexWrap）
      const badWrap: FlexProps = { wrap: 'bogus' };
      // @ts-expect-error orientation 只接受 horizontal | vertical
      const badOrientation: FlexProps = { orientation: 'diagonal' };
      return [badJustify, badWrap, badOrientation];
    };
    void _never;
  });

  it('Ref 暴露面', () => {
    expectTypeOf<FlexRef>().toMatchTypeOf<{ nativeElement: HTMLElement | null }>();
  });
});
