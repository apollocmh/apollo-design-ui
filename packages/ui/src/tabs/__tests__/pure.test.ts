/**
 * L1 单元 —— Tabs 的**纯函数层**（不挂组件，所以很轻）。
 *
 * ⚠️ 为什么与 `index.test.ts` 分开：这里穷举的是「几何与配置」的函数，与「几十处组件挂载」
 *    放同一个文件会让 vitest 的 worker 起不来（pagination 的 224 行判定表踩过这条）。
 *
 * ── 覆盖的判据（逐条对应 `docs/analysis/tabs.md`）──────────────────────────────
 *
 * | 纯函数 | 判据 |
 * |---|---|
 * | `getAnimateConfig` | `false` / `true` / `undefined` / 对象 四分支 + `tabPaneMotion` 的 motionName（**`prefixCls-switch`**） |
 * | `genDataNodeKey` | `"` → `TABS_DQ` |
 * | `getRemovable` | **四条件** |
 * | `filterItems` | 过滤 `null` / 非对象 / 无 `key` |
 * | `getUnitValue` / `getTransformRange` / `alignInRange` | 三区间（**RTL 与另两者符号相反**） |
 * | `getTabOffsets` | 缺项复用前一项 + `right` 的基准是**第一项**的右边界 |
 * | `getVisibleRange` | 两种位置口径 + 两个哨兵（空 tabs ⇒ `[0,0]`；空区间 ⇒ `[0,-1]`） |
 * | `getScrollToTabTransform` | 横向 LTR / 横向 RTL / 纵向 三分支 |
 * | `getIndicatorStyle` | `align` 三档 × `rtl` 两态 + `size` 三形态 |
 * | `isIndicatorStyleEqual` | 数值取整相等、其余严格相等 |
 *
 * ── 这个文件没有证明什么 ───────────────────────────────────────────────────────
 *   - 没证明 DOM 结构（L2 / L4）
 *   - 没证明真实尺寸下的滚动（jsdom 无布局 ⇒ 只能 L6 视觉，见分析 §R2）
 */

import { describe, expect, it } from 'vitest';
import { getAnimateConfig } from '../hooks/use-animate-config';
import {
  getIndicatorLength,
  getIndicatorStyle,
  isIndicatorStyleEqual,
} from '../hooks/use-indicator';
import { EMPTY_TAB_OFFSET, getTabOffsets, type TabSizeMap } from '../hooks/use-offsets';
import { getScrollToTabTransform, getVisibleRange } from '../hooks/use-visible-range';
import {
  alignInRange,
  filterItems,
  genDataNodeKey,
  getRemovable,
  getSize,
  getTransformRange,
  getUnitValue,
  isMobile,
  isTopOrBottom,
  stringify,
  stringifyKeys,
  TABS_DQ,
} from '../util';

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

describe('getAnimateConfig · 四分支', () => {
  it('默认值（undefined）⇒ inkBar 开、tabPane 关', () => {
    const merged = getAnimateConfig('apollo-tabs', undefined);
    expect(merged).toEqual({ inkBar: true, tabPane: false });
    expect(merged.tabPaneMotion).toBeUndefined();
  });

  it('`false` ⇒ 两个都关', () => {
    expect(getAnimateConfig('apollo-tabs', false)).toEqual({ inkBar: false, tabPane: false });
  });

  it('`true` ⇒ 两个都开 + tabPaneMotion', () => {
    const merged = getAnimateConfig('apollo-tabs', true);
    expect(merged.inkBar).toBe(true);
    expect(merged.tabPane).toBe(true);
    expect(merged.tabPaneMotion).toEqual({
      motionAppear: false,
      motionEnter: true,
      motionLeave: true,
      motionName: 'apollo-tabs-switch',
    });
  });

  it('对象：只给 tabPane ⇒ inkBar 仍为 true；只给 inkBar 时不产生 motion', () => {
    expect(getAnimateConfig('apollo-tabs', { tabPane: true }).inkBar).toBe(true);
    expect(getAnimateConfig('apollo-tabs', { tabPane: true }).tabPaneMotion?.motionName).toBe(
      'apollo-tabs-switch',
    );
    expect(getAnimateConfig('apollo-tabs', { inkBar: false }).tabPaneMotion).toBeUndefined();
  });

  it('★ motionName 用的是**传入的 prefixCls**（不是 rootPrefixCls）', () => {
    // 写错成 `apollo-switch` 会让动效**静默失效**（PITFALLS 180 同族）
    expect(getAnimateConfig('my-tabs', true).tabPaneMotion?.motionName).toBe('my-tabs-switch');
  });
});

// ---------------------------------------------------------------------------
// key / removability / items
// ---------------------------------------------------------------------------

describe('genDataNodeKey / getRemovable / filterItems', () => {
  it('`"` → `TABS_DQ`（不是转义，是哨兵替换）', () => {
    expect(TABS_DQ).toBe('TABS_DQ');
    expect(genDataNodeKey('a"b')).toBe('aTABS_DQb');
    expect(genDataNodeKey(1)).toBe('1');
  });

  it('getRemovable 的**四条件**', () => {
    // ⚠️ `getRemovable` 的第 3 参只用到 `removeIcon`（结构化类型）⇒ 测试里按那个形状传，
    //    传 `{ onEdit }` 会报 TS2559（「没有共同属性」）
    const editable = { removeIcon: '×' };
    // ① 不是 editable ⇒ 永不可删
    expect(getRemovable(true, undefined, undefined, false)).toBe(false);
    // ② disabled ⇒ 不可删
    expect(getRemovable(true, undefined, editable, true)).toBe(false);
    // ③ closable === false ⇒ 不可删
    expect(getRemovable(false, undefined, editable, false)).toBe(false);
    // ④ closable === undefined 且 closeIcon 是 false / null ⇒ 不可删
    expect(getRemovable(undefined, false, editable, false)).toBe(false);
    expect(getRemovable(undefined, null, editable, false)).toBe(false);
    // 其余 ⇒ 可删
    expect(getRemovable(undefined, undefined, editable, false)).toBe(true);
    expect(getRemovable(true, undefined, editable, false)).toBe(true);
    // ⚠️ `closable === true` 时即使 closeIcon 是 false 也可删（只看 undefined）
    expect(getRemovable(true, false, editable, false)).toBe(true);
  });

  it('filterItems 丢掉 null / 非对象 / 无 key 的项', () => {
    const items = [
      null,
      undefined,
      'x',
      { label: 'no key' },
      { key: 'a', label: 'A' },
    ] as never as Parameters<typeof filterItems>[0];
    expect(filterItems(items).map((i) => i.key)).toEqual(['a']);
    expect(filterItems(undefined)).toEqual([]);
  });

  it('stringifyKeys / stringify(Map)', () => {
    expect(
      stringifyKeys([
        { key: 'a', label: '' },
        { key: 'b', label: '' },
      ]),
    ).toBe('a_b');
    const map = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    expect(stringify(map)).toBe('{"a":1,"b":2}');
    expect(stringify({ a: 1 })).toBe('{"a":1}');
  });
});

// ---------------------------------------------------------------------------
// 几何
// ---------------------------------------------------------------------------

describe('几何纯函数', () => {
  it('getUnitValue：横向取 [0]、纵向取 [1]', () => {
    expect(getUnitValue([10, 20], true)).toBe(10);
    expect(getUnitValue([10, 20], false)).toBe(20);
  });

  it('isTopOrBottom / isMobile / getSize(空元素)', () => {
    expect(isTopOrBottom('top')).toBe(true);
    expect(isTopOrBottom('bottom')).toBe(true);
    expect(isTopOrBottom('left')).toBe(false);
    expect(isTopOrBottom('right')).toBe(false);
    expect(typeof isMobile()).toBe('boolean');
    expect(getSize(null)).toEqual([0, 0]);
    expect(getSize(undefined)).toEqual([0, 0]);
  });

  it('alignInRange 夹取', () => {
    // 横向 LTR：区间 [-100, 0]
    expect(alignInRange(0, -100, 0)).toBe(0);
    expect(alignInRange(-50, -100, 0)).toBe(-50);
    expect(alignInRange(-200, -100, 0)).toBe(-100);
    expect(alignInRange(50, -100, 0)).toBe(0);
  });

  it('★ getTransformRange 的**三个分支不对称**（RTL 与另两者符号相反）', () => {
    // 横向 LTR：[-（content−visible）, 0]
    expect(getTransformRange(true, false, 100, 300)).toEqual([-200, 0]);
    // 横向 RTL：[0, content−visible]
    expect(getTransformRange(true, true, 100, 300)).toEqual([0, 200]);
    // 纵向：与横向 LTR 同形
    expect(getTransformRange(false, false, 100, 300)).toEqual([-200, 0]);
    // 内容比可视区小 ⇒ 区间退化成 [0, 0]（三个分支都要成立）
    expect(getTransformRange(true, false, 300, 100)).toEqual([0, 0]);
    expect(getTransformRange(true, true, 300, 100)).toEqual([0, 0]);
    expect(getTransformRange(false, false, 300, 100)).toEqual([0, 0]);
  });
});

// ---------------------------------------------------------------------------
// 偏移 / 可见区间
// ---------------------------------------------------------------------------

const sizes = (entries: [string, [number, number, number, number]][]): TabSizeMap =>
  new Map(entries);

describe('getTabOffsets', () => {
  it('四个字段 + right（基准是**第一项**的右边界）', () => {
    const map = getTabOffsets(
      ['a', 'b'],
      sizes([
        ['a', [50, 20, 0, 0]],
        ['b', [60, 20, 50, 0]],
      ]),
      110,
    );
    expect(map.get('a')).toEqual({ width: 50, height: 20, left: 0, top: 0, right: 0 });
    // rightOffset = a.left + a.width = 50 ⇒ b.right = 50 − 50 − 60 = −60
    expect(map.get('b')).toEqual({ width: 60, height: 20, left: 50, top: 0, right: -60 });
  });

  it('缺项复用**前一项**的尺寸（新插入的页签还没测到时不跳）', () => {
    const map = getTabOffsets(
      ['a', 'b', 'c'],
      sizes([
        ['a', [50, 20, 0, 0]],
        // b 没有测量结果
      ]),
      100,
    );
    expect(map.get('b')).toEqual(map.get('a'));
    // 🚨 复用**只递一层**：查的是「测量表里的前一项」，不是「上一轮算出的偏移」
    //    ⇒ c 查测量表里的 b（没测到）⇒ 落到默认 0（**不是** a 的值）
    expect(map.get('c')).toEqual({ width: 0, height: 0, left: 0, top: 0, right: 50 });
  });

  it('完全没有测量结果 ⇒ 全 0', () => {
    const map = getTabOffsets(['a'], new Map(), 0);
    expect(map.get('a')).toEqual(EMPTY_TAB_OFFSET);
  });
});

describe('getVisibleRange', () => {
  const offsets = getTabOffsets(
    ['a', 'b', 'c'],
    sizes([
      ['a', [50, 20, 0, 0]],
      ['b', [50, 20, 50, 0]],
      ['c', [50, 20, 100, 0]],
    ]),
    150,
  );

  it('★ 看全 ⇒ `[0, len]`（`endIndex` 的初值是 `len`，不是 `len - 1`）', () => {
    // 全部可见时循环里**没有**任何一项越界 ⇒ endIndex 保持初值 `len`（= 3）
    // 消费方 `slice(0, start)` / `slice(end + 1)` 在越界时都是空数组，所以语义没问题
    expect(
      getVisibleRange(offsets, 200, 0, 150, 0, 0, {
        keys: ['a', 'b', 'c'],
        tabPosition: 'top',
        rtl: false,
      }),
    ).toEqual([0, 3]);
  });

  it('★ 两个哨兵：空 tabs ⇒ [0,0]；区间为空 ⇒ [0,-1]', () => {
    expect(
      getVisibleRange(new Map(), 100, 0, 0, 0, 0, { keys: [], tabPosition: 'top', rtl: false }),
    ).toEqual([0, 0]);
  });

  it('可视区只够第一项 ⇒ 后面的被判定为隐藏', () => {
    const [start, end] = getVisibleRange(offsets, 50, 0, 150, 0, 0, {
      keys: ['a', 'b', 'c'],
      tabPosition: 'top',
      rtl: false,
    });
    expect(start).toBe(0);
    expect(end).toBeLessThan(2);
  });

  it('位移为负（LTR 向左滚）⇒ 前面的项被判定为隐藏', () => {
    const [start, end] = getVisibleRange(offsets, 50, -100, 150, 0, 0, {
      keys: ['a', 'b', 'c'],
      tabPosition: 'top',
      rtl: false,
    });
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThanOrEqual(start);
  });

  it('纵向用 `height` / `top` 口径（与横向不同）', () => {
    const vertical = getTabOffsets(
      ['a', 'b'],
      sizes([
        ['a', [100, 20, 0, 0]],
        ['b', [100, 20, 0, 20]],
      ]),
      0,
    );
    const range = getVisibleRange(vertical, 20, 0, 40, 0, 0, {
      keys: ['a', 'b'],
      tabPosition: 'left',
      rtl: false,
    });
    expect(range[0]).toBe(0);
    expect(range[1]).toBeLessThanOrEqual(1);
  });
});

describe('getScrollToTabTransform', () => {
  const offset = { width: 50, height: 20, left: 100, top: 0, right: 0 };

  it('横向 LTR：跑出右边界 ⇒ 负位移把它拉进来', () => {
    const next = getScrollToTabTransform(offset, 0, 100, true, false);
    // left + width(150) > 0 + 100 ⇒ -(150 − 100) = -50
    expect(next).toBe(-50);
  });

  it('★ 横向 LTR：第一分支优先 ⇒ 「已可见但位移没归零」时会被**主动归位**', () => {
    // `offset.left(100) < -transform(200)` 命中第一分支 ⇒ 结果 -offset.left = -100
    // （不是「已可见就保持 -200」—— 三条 if 有优先级）
    expect(getScrollToTabTransform(offset, -200, 100, true, false)).toBe(-100);
    // 位移归零时改由**第二分支**命中：`left + width(150) > 0 + visible(100)`
    // ⇒ -(150 − 100) = -50（把跑出右边界的页签拉进来）
    expect(getScrollToTabTransform(offset, 0, 100, true, false)).toBe(-50);
    // 页签完整落在可视区内（left=0、visible=200）⇒ 两个分支都不命中 ⇒ 保持 0
    expect(
      getScrollToTabTransform(
        { width: 50, height: 20, left: 0, top: 0, right: 0 },
        0,
        200,
        true,
        false,
      ),
    ).toBe(0);
  });

  it('横向 RTL：用 `right + width` 口径（符号方向相反）', () => {
    const rtlOffset = { width: 50, height: 20, left: 0, top: 0, right: 30 };
    // right > 0 + width(50) > 0 + 100 ? 不成立 ⇒ 不变
    expect(getScrollToTabTransform(rtlOffset, 0, 100, true, true)).toBe(0);
    // right(30) < transform(100) ⇒ 取 right
    expect(getScrollToTabTransform(rtlOffset, 100, 100, true, true)).toBe(30);
  });

  it('纵向：用 `top + height` 口径', () => {
    const vertical = { width: 100, height: 20, left: 0, top: 100, right: 0 };
    expect(getScrollToTabTransform(vertical, 0, 50, false, false)).toBe(-70);
    // 同上：`top(100) < -transform(200)` ⇒ 归位到 -100
    expect(getScrollToTabTransform(vertical, -200, 50, false, false)).toBe(-100);
  });
});

// ---------------------------------------------------------------------------
// 指示条
// ---------------------------------------------------------------------------

describe('getIndicatorStyle · align × rtl × size', () => {
  const offset = { width: 100, height: 40, left: 200, top: 10, right: 0 };

  it('横向 LTR：三档 align', () => {
    expect(getIndicatorStyle(offset, true, false, { align: 'start' })).toEqual({
      width: '100px',
      left: '200px',
    });
    expect(getIndicatorStyle(offset, true, false, { align: 'center' })).toEqual({
      width: '100px',
      left: '250px',
      transform: 'translateX(-50%)',
    });
    expect(getIndicatorStyle(offset, true, false, { align: 'end' })).toEqual({
      width: '100px',
      left: '300px',
      transform: 'translateX(-100%)',
    });
  });

  it('★ 横向 RTL：定位键换成 `right`，但 center 的 transform 翻转、end 的**不翻转**', () => {
    // ⚠️ 换成 `right` 之后取的是 `offset.right`（不是 `offset.left`）
    expect(getIndicatorStyle(offset, true, true, { align: 'center' })).toEqual({
      width: '100px',
      right: '50px', // offset.right(0) + width/2(50)
      transform: 'translateX(50%)',
    });
    // 上游如此：end 恒为 translateX(-100%)
    expect(getIndicatorStyle(offset, true, true, { align: 'end' })).toEqual({
      width: '100px',
      right: '100px', // offset.right(0) + width(100)
      transform: 'translateX(-100%)',
    });
  });

  it('纵向：用 `height` / `top` 与 translateY', () => {
    expect(getIndicatorStyle(offset, false, false, { align: 'center' })).toEqual({
      height: '40px',
      top: '30px',
      transform: 'translateY(-50%)',
    });
    expect(getIndicatorStyle(offset, false, false, { align: 'end' })).toEqual({
      height: '40px',
      top: '50px',
      transform: 'translateY(-100%)',
    });
  });

  it('align 缺省 ⇒ center', () => {
    expect(getIndicatorStyle(offset, true, false, {})).toHaveProperty('left', '250px');
    expect(getIndicatorStyle(offset, true, false, undefined)).toHaveProperty('left', '250px');
  });

  it('size 三形态：数字 / 函数 / 缺省', () => {
    expect(getIndicatorLength(100, 20)).toBe(20);
    expect(getIndicatorLength(100, (origin) => origin / 2)).toBe(50);
    expect(getIndicatorLength(100, undefined)).toBe(100);
    expect(getIndicatorStyle(offset, true, false, { size: 20 })?.width).toBe('20px');
  });

  it('没有激活页签的偏移 ⇒ undefined（不渲染 style）', () => {
    expect(getIndicatorStyle(undefined, true, false, undefined)).toBeUndefined();
  });

  it('isIndicatorStyleEqual：数值取整相等、其余严格相等（px 串也按数值比）', () => {
    expect(isIndicatorStyleEqual({ left: '1.2px' }, { left: '1.4px' })).toBe(true);
    expect(isIndicatorStyleEqual({ left: '1.2px' }, { left: '1.6px' })).toBe(false);
    expect(isIndicatorStyleEqual({ left: '1px' }, { left: '1px', width: '2px' })).toBe(false);
    // `transform` 这类非数值串走严格相等
    expect(
      isIndicatorStyleEqual({ transform: 'translateX(-50%)' }, { transform: 'translateX(50%)' }),
    ).toBe(false);
    expect(
      isIndicatorStyleEqual({ transform: 'translateX(-50%)' }, { transform: 'translateX(-50%)' }),
    ).toBe(true);
    expect(isIndicatorStyleEqual(undefined, undefined)).toBe(true);
    expect(isIndicatorStyleEqual(undefined, { left: '1px' })).toBe(false);
  });

  it('★ 所有数值字段都**带单位**（PITFALLS 8 / D94：Vue 不给 style 里的裸数字补 px）', () => {
    // 这条是本轮 L6 视觉抓到的真 bug 的哨兵：不加单位时 `el.style.width = '33.45'`
    // 是非法值会被浏览器**静默丢弃**，指示条恒 0 宽、贴在容器左上角。
    const cases: [
      Parameters<typeof getIndicatorStyle>[1],
      Parameters<typeof getIndicatorStyle>[2],
      string,
    ][] = [
      [true, false, ''],
      [true, true, ''],
      [false, false, ''],
    ];
    for (const [horizontal, rtl] of cases) {
      for (const align of ['start', 'center', 'end'] as const) {
        const style = getIndicatorStyle(offset, horizontal, rtl, { align });
        for (const [key, value] of Object.entries(style ?? {})) {
          if (key === 'transform') continue;
          expect(typeof value).toBe('string');
          expect(value as string).toMatch(/^-?\d+(\.\d+)?px$/);
        }
      }
    }
  });
});
