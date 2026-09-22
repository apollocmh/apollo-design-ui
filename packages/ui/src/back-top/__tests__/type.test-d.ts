/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { BackTopProps, BackTopTarget } from '../interface';

describe('BackTop · Props 类型', () => {
  it('target 返回 HTMLElement | Window | Document', () => {
    expectTypeOf<BackTopTarget>().toEqualTypeOf<() => HTMLElement | Window | Document>();
    expectTypeOf<BackTopProps['visibilityHeight']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<BackTopProps['duration']>().toEqualTypeOf<number | undefined>();
  });

  it('★ 负例（永不调用的闭包内）', () => {
    const _never = () => {
      // @ts-expect-error visibilityHeight 不接受字符串
      const badHeight: BackTopProps = { visibilityHeight: '400' };
      // @ts-expect-error target 返回值类型不符
      const badTarget: BackTopProps = { target: () => 123 };
      return [badHeight, badTarget];
    };
    void _never;
  });
});
