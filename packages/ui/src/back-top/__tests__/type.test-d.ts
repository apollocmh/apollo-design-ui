/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { BackTop } from '../index';
import type { BackTopExpose, BackTopProps, BackTopSlots, BackTopTarget } from '../interface';

describe('BackTop · Props 类型', () => {
  it('target supports pending template refs; events and slots retain their Vue types', () => {
    expectTypeOf<BackTopTarget>().toEqualTypeOf<() => HTMLElement | Window | Document | null>();
    expectTypeOf<BackTopProps['visibilityHeight']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<BackTopProps['duration']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<BackTopExpose['nativeElement']>().toEqualTypeOf<HTMLButtonElement | null>();
    expectTypeOf<InstanceType<typeof BackTop>['nativeElement']>().toEqualTypeOf<
      BackTopExpose['nativeElement']
    >();
    expectTypeOf<BackTopSlots['default']>().toEqualTypeOf<(() => VNodeChild) | undefined>();
    expectTypeOf<NonNullable<InstanceType<typeof BackTop>['$props']['onClick']>>()
      .parameter(0)
      .toEqualTypeOf<MouseEvent>();
  });

  it('★ 负例（永不调用的闭包内）', () => {
    const _never = () => {
      // @ts-expect-error visibilityHeight 不接受字符串
      const badHeight: BackTopProps = { visibilityHeight: '400' };
      // @ts-expect-error target 返回值类型不符
      const badTarget: BackTopProps = { target: () => 123 };
      // @ts-expect-error BackTop emits the original DOM MouseEvent
      const badEvent: BackTopProps = { onClick: (_event: string) => {} };
      return [badHeight, badTarget, badEvent];
    };
    void _never;
  });
});
