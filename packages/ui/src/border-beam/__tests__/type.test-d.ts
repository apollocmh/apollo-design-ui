/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { type CSSProperties, h, type VNodeChild } from 'vue';
import { BorderBeam } from '../index';
import type {
  BorderBeamColor,
  BorderBeamGradient,
  BorderBeamProps,
  BorderBeamSemanticStyles,
  BorderBeamSlot,
  BorderBeamSlots,
} from '../interface';

describe('BorderBeam · Props 类型', () => {
  it('color 支持纯色与色标数组', () => {
    expectTypeOf<BorderBeamColor>().toEqualTypeOf<string | BorderBeamGradient[]>();
    expectTypeOf<BorderBeamGradient>().toEqualTypeOf<{ color: string; percent: number }>();
  });

  it('数值类 prop 均接受 number | string', () => {
    expectTypeOf<BorderBeamProps['lineWidth']>().toEqualTypeOf<number | string | undefined>();
    expectTypeOf<BorderBeamProps['outset']>().toEqualTypeOf<number | string | undefined>();
    expectTypeOf<BorderBeamProps['size']>().toEqualTypeOf<number | string | undefined>();
  });

  it('★ 负例（永不调用的闭包内）', () => {
    const _never = () => {
      // @ts-expect-error count 不接受字符串
      const badCount: BorderBeamProps = { count: '3' };
      // @ts-expect-error 色标缺 percent
      const badStops: BorderBeamColor = [{ color: 'red' }];
      return [badCount, badStops];
    };
    void _never;
  });
});

describe('BorderBeam actual Vue contracts', () => {
  it('keeps complete content slots and separates native style from effect props', () => {
    type Instance = InstanceType<typeof BorderBeam>;
    expectTypeOf<ReturnType<BorderBeamSlot>>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<
      ReturnType<NonNullable<Instance['$slots']['default']>>
    >().toEqualTypeOf<VNodeChild>();
    expectTypeOf<BorderBeamSlots>().toEqualTypeOf<{ default?: () => VNodeChild }>();
    expectTypeOf<BorderBeamSemanticStyles['effect']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<Extract<'className' | 'style', keyof BorderBeamProps>>().toEqualTypeOf<never>();
    h(
      BorderBeam,
      {
        count: 2,
        style: ['color: red', { marginTop: '2px' }],
        styles: { effect: { opacity: 0.5 } },
      },
      { default: () => [h('button', 'Host'), 'Text'] },
    );
    const _negative = () => {
      // @ts-expect-error Effect style uses Vue CSSProperties rather than arbitrary numeric properties.
      const invalidStyle: BorderBeamSemanticStyles = { effect: { position: 42 } };
      // @ts-expect-error React effect className has been removed from the component Props.
      const legacyClass: BorderBeamProps = { className: 'old-effect' };
      // @ts-expect-error style is a native host attr; use styles.effect for the decorative layer.
      const legacyStyle: BorderBeamProps = { style: { opacity: 0.5 } };
      // @ts-expect-error Actual component constructor rejects invalid beam counts.
      h(BorderBeam, { count: '2' });
      // @ts-expect-error Actual owned slots have no required scope or return-value service.
      const badSlot: NonNullable<Instance['$slots']['default']> = (scope: number) => scope;
      return [invalidStyle, legacyClass, legacyStyle, badSlot];
    };
    void _negative;
  });
});
