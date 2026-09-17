/**
 * L3 —— 类型契约。
 *
 * 除了正向断言，每条容易写错的都配了 `@ts-expect-error` 负例：
 * 类型测试如果只有正例，改坏签名也照样是绿的。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { ComputedRef, ShallowRef } from 'vue';

import type {
  AppendFn,
  ComputeZIndexInput,
  ContainerLike,
  GetContainer,
  ResolvedContainer,
  ZIndexComponentType,
} from '../index';
import {
  computeZIndex,
  enqueueAppend,
  Portal,
  portalInlineMock,
  resolveContainer,
  usePortalContainer,
  useZIndex,
} from '../index';

describe('容器解析', () => {
  it('GetContainer 接受全部四种形态', () => {
    const el = document.createElement('div');
    const specs: GetContainer[] = [
      el,
      false,
      '#id',
      () => el,
      () => null,
      () => undefined,
      null,
      undefined,
    ];
    expectTypeOf(specs).toEqualTypeOf<GetContainer[]>();
  });

  it('⭐ 返回类型是四态联合 —— null 与 undefined **不能**合并', () => {
    expectTypeOf(resolveContainer(false)).toEqualTypeOf<ResolvedContainer>();
    // `false` 形态能被精确收窄
    expectTypeOf(resolveContainer(false)).toExtend<ContainerLike | false | null | undefined>();
  });

  it('负例：数字不是合法的容器 spec', () => {
    expectTypeOf(resolveContainer).parameter(0).not.toExtend<number>();
    // @ts-expect-error 数字不是 GetContainer
    resolveContainer(123);
  });

  it('ContainerLike 允许 ShadowRoot', () => {
    // antd 6 的 `getContainer` 类型是 `(triggerNode?: HTMLElement) => HTMLElement | ShadowRoot`
    expectTypeOf<ContainerLike>().toExtend<Element | ShadowRoot>();
  });
});

describe('z-index', () => {
  it('返回 [number | undefined, number] —— 第一个可能没有', () => {
    expectTypeOf(computeZIndex({ componentType: 'Modal' })).toEqualTypeOf<
      [number | undefined, number]
    >();
  });

  it('componentType 只接受 12 种', () => {
    const ok: ZIndexComponentType = 'Modal';
    // 用 `toExtend` 而不是 `toEqualTypeOf`：expect-type 对「联合类型当类型参数传入」
    // 的推断会退化成 never（报错里写着 Actual never），toExtend 不受影响
    expectTypeOf(ok).toExtend<ZIndexComponentType>();
    expectTypeOf<ZIndexComponentType>().toExtend<string>();
    // @ts-expect-error 'Notification' 不在 12 种里（它在 antd 里由 CSS 侧单独处理）
    computeZIndex({ componentType: 'Notification' });
  });

  it('入参对象必须带 componentType', () => {
    // @ts-expect-error 缺 componentType
    const bad: ComputeZIndexInput = { parentZIndex: 1 };
    void bad;
  });

  it('useZIndex 返回 ComputedRef<number | undefined>', () => {
    // 只在组件 setup 里才有意义，这里只断言类型形状
    expectTypeOf(useZIndex).returns.toEqualTypeOf<ComputedRef<number | undefined>>();
  });
});

/**
 * ⚠️ `*.test-d.ts` 不只是被 tsc 检查 —— vitest **会真的执行**它们。
 *    所以负例必须包在「永不调用」的函数里，否则 `@ts-expect-error` 只挡住了编译期，
 *    运行时照样抛（这里就是 `queue is not iterable`）。
 */
function neverCalled(fn: () => void): void {
  void fn;
}

describe('嵌套队列', () => {
  it('enqueueAppend 是纯函数，返回新队列', () => {
    const fn: AppendFn = () => {};
    expectTypeOf(enqueueAppend([], fn)).toEqualTypeOf<AppendFn[]>();
    neverCalled(() => {
      // @ts-expect-error 第一个参数必须是队列，不是单个函数
      enqueueAppend(fn, fn);
    });
  });
});

describe('组合式函数与组件', () => {
  it('usePortalContainer 的返回值形状', () => {
    // 只断言类型：真正的行为在 L2
    expectTypeOf(usePortalContainer).returns.toExtend<{
      container: unknown;
      shouldRender: unknown;
      defaultContainer: ShallowRef<HTMLElement | null>;
    }>();
  });

  it('⭐ defaultContainer 是 ShallowRef<HTMLElement | null> —— 没有 ShadowRoot', () => {
    // 我们自己建的容器一定是 HTMLDivElement，不接受 ShadowRoot
    expectTypeOf(usePortalContainer).returns.toExtend<{
      defaultContainer: ShallowRef<HTMLElement | null>;
    }>();
  });

  it('Portal 是一个组件（有 setup/render 的构造签名）', () => {
    expectTypeOf(Portal).toExtend<object>();
    expectTypeOf(Portal).toHaveProperty('name');
  });

  it('portalInlineMock 读写同签名', () => {
    expectTypeOf(portalInlineMock()).toEqualTypeOf<boolean>();
    expectTypeOf(portalInlineMock(true)).toEqualTypeOf<boolean>();
    // @ts-expect-error 只接受 boolean
    portalInlineMock('yes');
  });
});
