/**
 * L3 类型测试（含负例；负例包在**永不调用的闭包**里 —— *.test-d.ts 会被
 * vitest 真执行，CHECKLIST 三）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { Variant } from '../../config-provider/context';
import type {
  InputNumberControls,
  InputNumberProps,
  InputNumberRef,
  InputNumberSemanticClassNames,
  InputNumberSemanticStyles,
  ValueType,
} from '../interface';

describe('InputNumber · L3 类型', () => {
  it('Props 面关键字段', () => {
    expectTypeOf<InputNumberProps['value']>().toEqualTypeOf<ValueType | null | undefined>();
    expectTypeOf<InputNumberProps['step']>().toEqualTypeOf<ValueType | undefined>();
    expectTypeOf<InputNumberProps['precision']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<InputNumberProps['mode']>().toEqualTypeOf<'input' | 'spinner' | undefined>();
    expectTypeOf<InputNumberProps['variant']>().toEqualTypeOf<Variant | undefined>();
    expectTypeOf<InputNumberProps['stringMode']>().toEqualTypeOf<boolean | undefined>();
  });

  it('controls 双形态', () => {
    expectTypeOf<InputNumberProps['controls']>().toEqualTypeOf<
      boolean | InputNumberControls | undefined
    >();
    expectTypeOf<InputNumberControls['upIcon']>().toEqualTypeOf<VNodeChild | undefined>();
  });

  it('语义槽五键（root/prefix/suffix/input/actions）', () => {
    expectTypeOf<keyof InputNumberSemanticClassNames>().toEqualTypeOf<
      'root' | 'prefix' | 'suffix' | 'input' | 'actions'
    >();
    expectTypeOf<keyof InputNumberSemanticStyles>().toEqualTypeOf<
      'root' | 'prefix' | 'suffix' | 'input' | 'actions'
    >();
  });

  it('Ref 面（focus/blur/nativeElement）', () => {
    expectTypeOf<InputNumberRef['focus']>().toEqualTypeOf<
      (option?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => void
    >();
    expectTypeOf<InputNumberRef['blur']>().toEqualTypeOf<() => void>();
    expectTypeOf<InputNumberRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('onStep 的 info 形状（offset/type/emitter）', () => {
    expectTypeOf<Parameters<NonNullable<InputNumberProps['onStep']>>[1]>().toEqualTypeOf<{
      offset: number | string;
      type: 'up' | 'down';
      emitter: 'handler' | 'keyboard' | 'wheel';
    }>();
  });

  it('负例（永不调用的闭包）', () => {
    const _negatives = () => {
      // mode 只接受 input | spinner
      // @ts-expect-error mode 不接受 'wheel'
      const badMode: InputNumberProps['mode'] = 'wheel';
      void badMode;
      // variant 只接受四形态
      // @ts-expect-error variant 不接受 'dashed'
      const badVariant: InputNumberProps['variant'] = 'dashed';
      void badVariant;
      // status 只接受 error | warning
      // @ts-expect-error status 不接受 'info'
      const badStatus: InputNumberProps['status'] = 'info';
      void badStatus;
      // precision 是 number
      // @ts-expect-error precision 不接受字符串
      const badPrecision: InputNumberProps['precision'] = '2';
      void badPrecision;
      // controls 不接受字符串
      // @ts-expect-error controls 不接受 'yes'
      const badControls: InputNumberProps['controls'] = 'yes';
      void badControls;
    };
    void _negatives;
    expectTypeOf(_negatives).toBeFunction();
  });
});
