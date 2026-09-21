/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { BorderBeamColor, BorderBeamGradient, BorderBeamProps } from '../interface';

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
