/**
 * L3 类型测试 —— `measure.ts`（DOM 测量层）。
 *
 * TESTING.md T7 要求：**必须包含负例**。负例用 `@ts-expect-error` 表达，
 * 语义是「此处**应当**报错」；若哪天类型放宽导致这里不再报错，
 * `@ts-expect-error` 自身会变成错误，测试即失败。这是它唯一被允许的使用场景。
 *
 * ⚠️⚠️ `*.test-d.ts` **会被 vitest 实际执行**（不只是类型检查），
 *      所以每个负例在运行期也必须是安全的。会真的崩掉的非法调用
 *      （例如把字符串当元素传进去）一律放进**永不执行**的闭包里，只留给 TS 看。
 *
 * 本文件只做类型层断言，不重复 L1/L2 已经覆盖的运行期行为。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { Area, HtmlRegion, MeasureResult, RectLike, ScaleResult } from '../index';
import {
  collectScroller,
  getScrollArea,
  getViewportArea,
  getVisibleArea,
  getWin,
  measureAlign,
  measureRect,
  measureScale,
  mirrorOffsetB,
  mirrorOffsetR,
  normalizeHtmlRegion,
  pointRect,
  pxValue,
  scaleFloor,
  shouldMeasure,
  toRect,
  toSafeNum,
} from '../index';

/** 永不执行 —— 只为了让 TS 检查里面的调用。 */
function neverCalled(fn: () => void): void {
  void fn;
}

describe('纯数据侧的签名', () => {
  it('toSafeNum 的两个参数都是 number，兜底值可选', () => {
    expectTypeOf(toSafeNum(Number.NaN)).toEqualTypeOf<number>();
    expectTypeOf(toSafeNum(Number.NaN, 0)).toEqualTypeOf<number>();

    neverCalled(() => {
      // @ts-expect-error 兜底值必须是 number
      toSafeNum(Number.NaN, '0');
      // @ts-expect-error 必填入参
      toSafeNum();
    });
  });

  it('pxValue 接受 string | undefined —— computed style 的值可能缺失', () => {
    expectTypeOf(pxValue('10px')).toEqualTypeOf<number>();
    expectTypeOf(pxValue(undefined)).toEqualTypeOf<number>();

    neverCalled(() => {
      // @ts-expect-error 不接受 number
      pxValue(10);
    });
  });

  it('normalizeHtmlRegion 返回三值联合，而不是 string', () => {
    expectTypeOf(normalizeHtmlRegion('scroll')).toEqualTypeOf<HtmlRegion>();
    expectTypeOf(normalizeHtmlRegion(undefined)).toEqualTypeOf<HtmlRegion>();

    // 返回值只能是三个字面量之一
    expectTypeOf<HtmlRegion>().toEqualTypeOf<'visible' | 'scroll' | 'visibleFirst'>();

    neverCalled(() => {
      // @ts-expect-error 入参不接受 number
      normalizeHtmlRegion(1);
    });
  });

  it('toRect 的输入是 RectLike：坐标可选，尺寸必填', () => {
    expectTypeOf(toRect({ width: 1, height: 2 })).toEqualTypeOf<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>();

    neverCalled(() => {
      // @ts-expect-error 缺 height
      toRect({ width: 1 });
      // @ts-expect-error 缺 width
      toRect({ height: 1 });
      // @ts-expect-error 尺寸必须是 number
      toRect({ width: '1', height: 2 });
    });
  });

  it('RectLike 的 x/y 与 left/top 都是可选 —— 兼容只提供 left/top 的 DOMRect', () => {
    const legacy: RectLike = { left: 1, top: 2, width: 3, height: 4 };
    const modern: RectLike = { x: 1, y: 2, width: 3, height: 4 };
    expectTypeOf(legacy.width).toEqualTypeOf<number>();
    expectTypeOf(modern.x).toEqualTypeOf<number | undefined>();
  });

  it('scaleFloor / mirrorOffset* / shouldMeasure 的数值签名', () => {
    expectTypeOf(scaleFloor(1.5, 1)).toEqualTypeOf<number>();
    expectTypeOf(
      mirrorOffsetR({ x: 0, y: 0, width: 1, height: 1 }, { x: 0, y: 0, width: 1, height: 1 }, 0),
    ).toEqualTypeOf<number>();
    expectTypeOf(
      mirrorOffsetB({ x: 0, y: 0, width: 1, height: 1 }, { x: 0, y: 0, width: 1, height: 1 }, 0),
    ).toEqualTypeOf<number>();
    expectTypeOf(shouldMeasure(1, 1, true)).toEqualTypeOf<boolean>();

    neverCalled(() => {
      // @ts-expect-error 第三参必须是 boolean
      shouldMeasure(1, 1, 1);
      // @ts-expect-error 缺 scale
      shouldMeasure(1, true);
    });
  });
});

describe('DOM 侧的签名', () => {
  it('getWin 返回 Window | null —— 无 defaultView 的文档必须能表达', () => {
    expectTypeOf(getWin(document.body)).toEqualTypeOf<Window | null>();
  });

  it('collectScroller 接受 Element，返回 HTMLElement[]', () => {
    expectTypeOf(collectScroller(document.body)).toEqualTypeOf<HTMLElement[]>();

    neverCalled(() => {
      // @ts-expect-error 不接受裸字符串
      collectScroller('body');
    });
  });

  it('getVisibleArea 的区域入参是 Area，滚动容器是只读数组', () => {
    expectTypeOf(
      getVisibleArea({ left: 0, top: 0, right: 1, bottom: 1 }, []),
    ).toEqualTypeOf<Area>();

    const scrollers: readonly HTMLElement[] = [document.body];
    expectTypeOf(
      getVisibleArea({ left: 0, top: 0, right: 1, bottom: 1 }, scrollers),
    ).toEqualTypeOf<Area>();

    neverCalled(() => {
      // @ts-expect-error 区域缺 bottom
      getVisibleArea({ left: 0, top: 0, right: 1 }, []);
    });
  });

  it('区域构造函数只接受 Document', () => {
    expectTypeOf(getViewportArea(document)).toEqualTypeOf<Area>();
    expectTypeOf(getScrollArea(document)).toEqualTypeOf<Area>();

    neverCalled(() => {
      // @ts-expect-error 不接受 Element
      getViewportArea(document.body);
    });
  });

  it('measureRect 接受 Element，measureScale 额外需要 Window', () => {
    expectTypeOf(measureRect(document.body)).toEqualTypeOf<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>();
    const rect = measureRect(document.body);
    const win = getWin(document.body);
    if (win) {
      expectTypeOf(measureScale(document.body, rect, win)).toEqualTypeOf<ScaleResult>();
    }

    neverCalled(() => {
      // @ts-expect-error 缺 Window
      measureScale(document.body, rect);
    });
  });
});

describe('measureAlign 的契约', () => {
  it('返回 MeasureResult | null —— 调用方必须处理不可测的情形', () => {
    const result = measureAlign({ popupEle: document.body, target: [0, 0] });
    expectTypeOf(result).toEqualTypeOf<MeasureResult | null>();

    // 返回类型不能**直接**当 MeasureResult 用 —— 强制调用方判空
    neverCalled(() => {
      // @ts-expect-error `MeasureResult | null` 不能直接赋给 `MeasureResult`
      const bad: MeasureResult = measureAlign({ popupEle: document.body, target: [0, 0] });
      void bad;
    });
  });

  it('target 只能是元素或坐标元组', () => {
    measureAlign({ popupEle: document.body, target: document.body });
    measureAlign({ popupEle: document.body, target: [0, 0] });

    neverCalled(() => {
      // @ts-expect-error 不接受三元组
      measureAlign({ popupEle: document.body, target: [0, 0, 0] });
      // @ts-expect-error 不接受裸对象
      measureAlign({ popupEle: document.body, target: { x: 0, y: 0 } });
    });
  });

  it('htmlRegion 只接受三值联合', () => {
    measureAlign({ popupEle: document.body, target: [0, 0], htmlRegion: 'visibleFirst' });

    neverCalled(() => {
      // @ts-expect-error 拼错的值必须被拒 —— 运行期的降级不等于类型上合法
      measureAlign({ popupEle: document.body, target: [0, 0], htmlRegion: 'visiblefirst' });
    });
  });

  it('scrollers 可省略，给出时是只读数组', () => {
    measureAlign({ popupEle: document.body, target: [0, 0] });
    measureAlign({ popupEle: document.body, target: [0, 0], scrollers: [document.body] });
    const list: readonly HTMLElement[] = [document.body];
    measureAlign({ popupEle: document.body, target: [0, 0], scrollers: list });
  });

  it('popupEle 必填', () => {
    neverCalled(() => {
      // @ts-expect-error 缺 popupEle
      measureAlign({ target: [0, 0] });
    });
  });

  it('pointRect 产出与 Rect 同构的对象', () => {
    expectTypeOf(pointRect(1, 2)).toEqualTypeOf<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>();

    neverCalled(() => {
      // @ts-expect-error 坐标必须是 number
      pointRect('1', 2);
    });
  });
});
