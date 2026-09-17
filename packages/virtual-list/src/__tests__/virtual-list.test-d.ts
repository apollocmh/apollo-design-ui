/**
 * L3 —— 类型契约。
 *
 * 除了正向断言，每条容易写错的都配了 `@ts-expect-error` 负例：
 * 类型测试如果只有正例，改坏签名也照样是绿的。
 *
 * ⚠️ 本文件会被 vitest **真的执行**，所以含运行时后果的负例必须包在
 *    `neverCalled(() => {...})` 里（它永不调用，但 TS 照样检查函数体）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';

import type {
  ComputeRangeInput,
  ComputeScrollTargetInput,
  ComputeScrollTargetResult,
  CreateSizeGetterInput,
  ExtraRenderInfo,
  FillerExposed,
  GetKey,
  GetSize,
  HeightsLookup,
  ItemKey,
  ListDiffResult,
  RangeResult,
  RenderFunc,
  RenderProps,
  ScrollAlign,
  ScrollInfo,
  ScrollTo,
  SizeInfo,
  VirtualListExposed,
} from '../index';
import {
  CacheMap,
  computeRange,
  createSizeGetter,
  findListDiffIndex,
  isInVirtual,
  keepInHorizontalRange,
  keepInRange,
  type MAX_SCROLL_TO_TIMES,
  normalizeScrollArg,
  resolveScrollOffset,
  shouldUseVirtual,
  sumHeights,
  type VirtualList,
} from '../index';

function neverCalled(fn: () => void): void {
  void fn;
}

describe('纯函数的签名', () => {
  it('shouldUseVirtual / isInVirtual 返回 boolean', () => {
    expectTypeOf(shouldUseVirtual(undefined, 100, 20)).toEqualTypeOf<boolean>();
    expectTypeOf(isInVirtual(true, 10, 20, 0, 100, undefined)).toEqualTypeOf<boolean>();
    expectTypeOf(shouldUseVirtual).parameters.toEqualTypeOf<
      [boolean | undefined, number | undefined, number | undefined]
    >();
  });

  it('⭐ computeRange 的返回是 RangeResult，且 scrollHeight / offset 可空', () => {
    expectTypeOf(computeRange<string>).returns.toEqualTypeOf<RangeResult>();
    expectTypeOf<RangeResult['scrollHeight']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<RangeResult['offset']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<RangeResult['start']>().toEqualTypeOf<number>();
    expectTypeOf<RangeResult['end']>().toEqualTypeOf<number>();
  });

  it('computeRange 需要泛型参数与 getKey 对齐', () => {
    neverCalled(() => {
      // @ts-expect-error data 是 number[]，getKey 却返回 string 之外的 ItemKey 类型不匹配
      computeRange<number>({ data: ['a'] });
    });
  });

  it('ComputeRangeInput 的每个字段都是必填的', () => {
    neverCalled(() => {
      // @ts-expect-error 缺 itemHeight
      const bad: ComputeRangeInput<string> = {
        data: [],
        getKey: (item: string) => item,
        heights: { get: () => undefined },
        height: 100,
        offsetTop: 0,
        useVirtual: true,
        inVirtual: true,
        measuredInnerHeight: 0,
      };
      void bad;
    });
  });

  it('keepInRange / keepInHorizontalRange 返回 number', () => {
    expectTypeOf(keepInRange(0, 100)).toEqualTypeOf<number>();
    expectTypeOf(keepInHorizontalRange(0, 100, 100)).toEqualTypeOf<number>();
    // @ts-expect-error maxScrollHeight 必须是 number（NaN 也是 number）
    keepInRange(0, '100');
  });

  it('sumHeights 收只读字典', () => {
    expectTypeOf(sumHeights({ a: 1 })).toEqualTypeOf<number>();
    expectTypeOf(sumHeights({ a: undefined })).toEqualTypeOf<number>();
  });
});

describe('CacheMap', () => {
  it('⭐ 泛型参数决定 get 的返回类型', () => {
    const map = new CacheMap<number>();
    expectTypeOf(map.get('a')).toEqualTypeOf<number | undefined>();
    expectTypeOf(map.id).toEqualTypeOf<number>();
    expectTypeOf(map.getRecord()).toEqualTypeOf<ReadonlyMap<ItemKey, number | undefined>>();
  });

  it('CacheMap<number> 结构化满足 HeightsLookup', () => {
    expectTypeOf(new CacheMap<number>()).toExtend<HeightsLookup>();
    // @ts-expect-error CacheMap<string> 不满足 HeightsLookup（get 返回 string）
    const bad: HeightsLookup = new CacheMap<string>();
    void bad;
  });

  it('set 的 value 类型跟着泛型', () => {
    neverCalled(() => {
      // @ts-expect-error 不能给 CacheMap<number> 写字符串
      new CacheMap<number>().set('a', 'b');
    });
  });
});

describe('findListDiffIndex', () => {
  it('返回 ListDiffResult | null', () => {
    expectTypeOf(
      findListDiffIndex(['a'], ['b'], (item: string) => item),
    ).toEqualTypeOf<ListDiffResult | null>();
    expectTypeOf<ListDiffResult['multiple']>().toEqualTypeOf<boolean>();
  });

  it('getKey 必须收 T 返回 ItemKey', () => {
    neverCalled(() => {
      // @ts-expect-error getKey 必须返回 ItemKey
      findListDiffIndex(['a'], ['b'], () => ({}));
    });
  });
});

describe('scrollTo 相关', () => {
  it('MAX_SCROLL_TO_TIMES 是字面量 10', () => {
    expectTypeOf<typeof MAX_SCROLL_TO_TIMES>().toEqualTypeOf<10>();
  });

  it('resolveScrollOffset 收 number | 函数 | undefined，返回 number', () => {
    expectTypeOf(
      resolveScrollOffset(1, { getSize: () => ({ top: 0, bottom: 0 }) }),
    ).toEqualTypeOf<number>();
    expectTypeOf(
      resolveScrollOffset(() => 1, { getSize: () => ({ top: 0, bottom: 0 }) }),
    ).toEqualTypeOf<number>();
    // @ts-expect-error offset 不能是字符串
    resolveScrollOffset('1', { getSize: () => ({ top: 0, bottom: 0 }) });
  });

  it('⭐ computeScrollTarget 的 targetTop 可空（null = 本轮不滚）', () => {
    expectTypeOf<ComputeScrollTargetResult['targetTop']>().toEqualTypeOf<number | null>();
    expectTypeOf<ComputeScrollTargetResult['nextAlign']>().toEqualTypeOf<ScrollAlign | undefined>();
    expectTypeOf<ComputeScrollTargetResult['needCollectHeight']>().toEqualTypeOf<boolean>();
  });

  it('ComputeScrollTargetInput 的 align 可空，index 必填', () => {
    neverCalled(() => {
      // @ts-expect-error 缺 index
      const bad: ComputeScrollTargetInput<string> = {
        data: [],
        getKey: (item: string) => item,
        heights: { get: () => undefined },
        itemHeight: 20,
        align: 'top',
        offset: 0,
        containerHeight: 100,
        scrollTop: 0,
      };
      void bad;
    });
  });

  it('ScrollAlign 只有 top / bottom', () => {
    expectTypeOf<ScrollAlign>().toEqualTypeOf<'top' | 'bottom'>();
    neverCalled(() => {
      // @ts-expect-error 'middle' 不是合法的对齐
      const bad: ScrollAlign = 'middle';
      void bad;
    });
  });

  it('normalizeScrollArg 收四种形态', () => {
    const data = ['a'];
    const getKey = (item: string): string => item;
    expectTypeOf(normalizeScrollArg(null, data, getKey)).toExtend<{ kind: string }>();
    normalizeScrollArg(1, data, getKey);
    normalizeScrollArg({ index: 0 }, data, getKey);
    normalizeScrollArg({ key: 'a', align: 'top', offset: 1 }, data, getKey);
    // @ts-expect-error key 不能是对象
    normalizeScrollArg({ key: {} }, data, getKey);
  });
});

describe('尺寸查询', () => {
  it('createSizeGetter 返回 GetSize，其返回是 {top, bottom} 都是 number', () => {
    expectTypeOf(createSizeGetter<string>).returns.toEqualTypeOf<GetSize>();
    expectTypeOf<ReturnType<GetSize>>().toEqualTypeOf<{ top: number; bottom: number }>();
  });

  it('⭐ 与上游不同：bottom 不是 number | undefined（我们把声明做成真的）', () => {
    expectTypeOf<ReturnType<GetSize>['bottom']>().toEqualTypeOf<number>();
  });

  it('GetSize 的 endKey 可省', () => {
    const getSize: GetSize = (_startKey) => ({ top: 0, bottom: 0 });
    getSize('a');
    getSize('a', 'b');
    // @ts-expect-error 第一个参数必填
    getSize();
  });

  it('CreateSizeGetterInput 的 data 是只读数组', () => {
    const input: CreateSizeGetterInput<string> = {
      data: ['a'] as readonly string[],
      getKey: (item) => item,
      heights: { get: () => undefined },
      itemHeight: 20,
    };
    expectTypeOf(input).toEqualTypeOf<CreateSizeGetterInput<string>>();
  });
});

describe('组件契约', () => {
  it('⭐ itemKey 是必填的（没有它无法稳定复用 DOM）', () => {
    neverCalled(() => {
      // @ts-expect-error 缺 itemKey
      const bad: Parameters<typeof VirtualList>[0] = { data: [] };
      void bad;
    });
  });

  it('VirtualListExposed 的三个成员', () => {
    const api = {} as VirtualListExposed;
    expectTypeOf(api.nativeElement).toEqualTypeOf<HTMLElement | null>();
    expectTypeOf(api.getScrollInfo).returns.toEqualTypeOf<ScrollInfo>();
    expectTypeOf(api.scrollTo).toEqualTypeOf<ScrollTo>();
  });

  it('ScrollTo 的入参可选', () => {
    neverCalled(() => {
      const fn = {} as ScrollTo;
      fn();
      fn(100);
      fn({ index: 1, align: 'top' });
      fn({
        key: 'a',
        offset: (info: { align?: 'top' | 'bottom' }) => (info.align === 'top' ? 1 : 0),
      });
    });
  });

  it('ScrollInfo 的 x / y 都是 number', () => {
    expectTypeOf<ScrollInfo>().toEqualTypeOf<{ x: number; y: number }>();
  });

  it('ExtraRenderInfo 的 getSize 是 GetSize', () => {
    expectTypeOf<ExtraRenderInfo['getSize']>().toEqualTypeOf<GetSize>();
    expectTypeOf<ExtraRenderInfo['offsetY']>().toEqualTypeOf<number | undefined>();
  });

  it('RenderProps 的 style 允许 undefined 值', () => {
    expectTypeOf<RenderProps['style']>().toEqualTypeOf<
      Record<string, number | string | undefined>
    >();
  });

  it('RenderFunc 返回 VNodeChild', () => {
    expectTypeOf<ReturnType<RenderFunc<string>>>().toEqualTypeOf<VNodeChild>();
  });

  it('FillerExposed 暴露 getInnerHeight', () => {
    const exposed = {} as FillerExposed;
    expectTypeOf(exposed.getInnerHeight).toEqualTypeOf<() => number>();
  });

  it('SizeInfo 的两个字段', () => {
    expectTypeOf<SizeInfo>().toEqualTypeOf<{ width: number; height: number }>();
  });

  it('ItemKey 是 string | number', () => {
    expectTypeOf<ItemKey>().toEqualTypeOf<string | number>();
    neverCalled(() => {
      // @ts-expect-error bigint 不在 ItemKey 里
      const bad: ItemKey = 1n;
      void bad;
    });
  });

  it('GetKey 的泛型', () => {
    const fn: GetKey<{ id: number }> = (item) => item.id;
    expectTypeOf(fn).toEqualTypeOf<GetKey<{ id: number }>>();
  });
});
