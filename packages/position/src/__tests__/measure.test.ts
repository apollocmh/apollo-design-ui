/**
 * L1 单元测试 —— `measure.ts`（DOM 测量层）。
 *
 * 覆盖两块：
 *   1. 纯数据侧（`toSafeNum` … `shouldMeasure`）—— 不碰 DOM，可穷举
 *   2. DOM 侧（`collectScroller` / `getVisibleArea` / 区域构造 / `measureAlign`）
 *      —— 在 jsdom 里用**桩替的度量值**驱动，逐项断言 `position-contract.md` §3.2 的公式
 *
 * 为什么必须对 DOM 侧逐项断言：jsdom 没有布局引擎，`getBoundingClientRect()`
 * 恒为 0、`offsetWidth/clientWidth` 恒为 0，于是**任何**真实公式都会退化成 0，
 * 退化后的断言证明不了任何事。所以这里的每个元素都被 `stubEle` 装上可控的度量值，
 * 让公式里的每一个中间量都能被单独看到。
 *
 * 副作用相关的行为（inline style 还原、placeholder 生命周期）在
 * `measure-session.test.ts`，那里才是 jsdom 真实 DOM 的场景。
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { Area } from '../index';
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
import { buildRig, CONTAINER, POPUP_SIZE, resetDom, stubDocEl, stubEle } from './measure-rig';

afterEach(resetDom);

// ---------------------------------------------------------------------------
// 纯数据侧
// ---------------------------------------------------------------------------

describe('toSafeNum', () => {
  it('NaN 落到兜底值，默认兜底 1', () => {
    expect(toSafeNum(Number.NaN)).toBe(1);
    expect(toSafeNum(Number.NaN, 0)).toBe(0);
    expect(toSafeNum(Number.NaN, -1)).toBe(-1);
  });

  it('非 NaN 原样返回 —— 含 0 与负数', () => {
    expect(toSafeNum(2)).toBe(2);
    expect(toSafeNum(0)).toBe(0);
    expect(toSafeNum(-3)).toBe(-3);
  });

  it('Infinity 不是 NaN，不被兜底 —— 与 antd 的 toNum 一致', () => {
    expect(toSafeNum(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('pxValue', () => {
  it('解析 px 串', () => {
    expect(pxValue('10px')).toBe(10);
    expect(pxValue('0px')).toBe(0);
    expect(pxValue('-2.5px')).toBe(-2.5);
  });

  it('不可解析的一律 0', () => {
    expect(pxValue(undefined)).toBe(0);
    expect(pxValue('')).toBe(0);
    expect(pxValue('auto')).toBe(0);
  });
});

describe('normalizeHtmlRegion', () => {
  it('白名单内的两个值原样保留', () => {
    expect(normalizeHtmlRegion('scroll')).toBe('scroll');
    expect(normalizeHtmlRegion('visibleFirst')).toBe('visibleFirst');
  });

  it('其余任何值（含 undefined / 空串 / 拼错）一律降级 visible', () => {
    expect(normalizeHtmlRegion('visible')).toBe('visible');
    expect(normalizeHtmlRegion(undefined)).toBe('visible');
    expect(normalizeHtmlRegion('')).toBe('visible');
    expect(normalizeHtmlRegion('Scroll')).toBe('visible');
    expect(normalizeHtmlRegion('scrollx')).toBe('visible');
  });

  it('这是白名单不是黑名单 —— 反向写成「非 visible 即 scroll」会改变默认行为', () => {
    // 拼错的值若被当成 scroll，浮层会被放进滚动区而不是视口区，是肉眼可见的错位
    expect(normalizeHtmlRegion('scrlll')).not.toBe('scroll');
  });
});

describe('pointRect / toRect', () => {
  it('pointRect 产出 0×0 矩形（右键菜单这类坐标型 target）', () => {
    expect(pointRect(30, 40)).toEqual({ x: 30, y: 40, width: 0, height: 0 });
  });

  it('toRect 在 x 缺失时回落到 left（antd 的 rect.x ?? rect.left）', () => {
    expect(toRect({ left: 1, top: 2, width: 3, height: 4 })).toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
    });
  });

  it('x 存在时优先于 left —— 包括 x 为 0 的情形', () => {
    // `??` 只跳过 null/undefined。若误写成 `||`，x=0 会被 left 顶掉
    expect(toRect({ x: 0, left: 99, top: 0, width: 1, height: 1 })).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });

  it('两组都缺失时归零', () => {
    expect(toRect({ width: 1, height: 2 })).toEqual({ x: 0, y: 0, width: 1, height: 2 });
  });
});

describe('scaleFloor', () => {
  it('scale 为 1 才取整', () => {
    expect(scaleFloor(10.7, 1)).toBe(10);
    expect(scaleFloor(-10.7, 1)).toBe(-11);
  });

  it('有缩放时保留小数 —— 取整会把误差按 1/scale 放大', () => {
    expect(scaleFloor(10.7, 0.5)).toBe(10.7);
    expect(scaleFloor(10.7, 2)).toBe(10.7);
  });
});

describe('mirrorOffsetR / mirrorOffsetB', () => {
  // 容器视口位置 (100,200)，尺寸 300×200；浮层 80×40
  // 归零后 popup.x=100；镜像后 mirror.x = 100+300-80 = 320
  const popup = { x: 100, y: 200, width: 80, height: 40 };
  const mirror = { x: 320, y: 360, width: 80, height: 40 };

  it('offsetR = 容器右缘到浮层右缘的距离', () => {
    // 浮层按 offsetX=5 摆好后右缘在 100+5+80=185，容器右缘在 400 → 400-185=215
    expect(mirrorOffsetR(mirror, popup, 5)).toBe(215);
  });

  it('offsetB = 容器下缘到浮层下缘的距离', () => {
    // 200+3+40=243，容器下缘 400 → 400-243=157
    expect(mirrorOffsetB(mirror, popup, 3)).toBe(157);
  });
});

describe('shouldMeasure', () => {
  it('只有 scale 两轴都非 0 且 target 可见时才继续', () => {
    expect(shouldMeasure(1, 1, true)).toBe(true);
    expect(shouldMeasure(0.5, 2, true)).toBe(true);
  });

  it('任一轴 scale 为 0 → 放弃测量', () => {
    expect(shouldMeasure(0, 1, true)).toBe(false);
    expect(shouldMeasure(1, 0, true)).toBe(false);
  });

  it('target 不可见 → 放弃测量', () => {
    expect(shouldMeasure(1, 1, false)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DOM 侧 · 取值
// ---------------------------------------------------------------------------

describe('getWin', () => {
  it('正常文档树返回 window', () => {
    expect(getWin(stubEle())).toBe(window);
  });

  it('无 defaultView 的文档返回 null —— 不用全局 window 的理由', () => {
    const orphanDoc = document.implementation.createHTMLDocument('orphan');
    expect(orphanDoc.defaultView).toBeNull();
    expect(getWin(orphanDoc.body)).toBeNull();
    // node 本身是 Document 的分支（ownerDocument 对 Document 自身为 null）
    expect(getWin(orphanDoc)).toBeNull();
  });

  it('Document 自身走第二条分支 —— ownerDocument 对它是 null', () => {
    // ⚠️ `getWin` 里还有一条「既无 ownerDocument 也不是 Document」的 `return null`，
    //    它在 DOM 规范下**不可达**（`ownerDocument` 为 null 的节点只有 Document 本身），
    //    因此没有对应的用例，覆盖率会记它未覆盖 —— 这是预期的，不是遗漏。
    //    它存在的唯一目的是让返回类型完整而不必写 `as Document` 断言。
    //    ⚠️ 另外：造不出能触发它的替身 —— jsdom 生成的 IDL getter 带 brand 校验，
    //       `Object.create(Node.prototype)` 会抛
    //       "'get ownerDocument' called on an object that is not a valid instance of Node"。
    const orphanDoc = document.implementation.createHTMLDocument('orphan');
    expect(orphanDoc.ownerDocument).toBeNull();
    expect(getWin(orphanDoc)).toBeNull();
  });
});

describe('collectScroller', () => {
  function buildTree(): {
    self: HTMLElement;
    inner: HTMLElement;
    mid: HTMLElement;
    outer: HTMLElement;
  } {
    const outer = stubEle({ css: { overflow: 'auto' } });
    const mid = stubEle();
    const inner = stubEle({ css: { overflow: 'hidden' } });
    const self = stubEle();

    outer.appendChild(mid);
    mid.appendChild(inner);
    inner.appendChild(self);
    return { self, inner, mid, outer };
  }

  it('自内向外收集，且不含自身', () => {
    const { self, inner, mid, outer } = buildTree();
    const list = collectScroller(self);
    expect(list).toEqual([inner, outer]);
    expect(list).not.toContain(self);
    expect(list).not.toContain(mid);
  });

  it('默认 body / html 不是滚动容器（computed overflow 为空串）', () => {
    const { self } = buildTree();
    expect(collectScroller(self)).not.toContain(document.body);
    expect(collectScroller(self)).not.toContain(document.documentElement);
  });

  it('只看 overflowX / overflowY 会漏掉第三种情形 —— antd 三项取 or', () => {
    // `overflow: hidden` 先把两轴都设为 hidden，再用 `overflow-x: visible` 覆盖 X。
    // jsdom 不会做「一轴非 visible 时另一轴的 visible 计算成 auto」的联动，
    // 于是 computed 是 overflowX=visible / overflowY=visible / overflow=hidden。
    // 只看两个 longhand 的实现会把这个元素漏掉。
    const scroller = stubEle();
    scroller.style.overflow = 'hidden';
    scroller.style.overflowX = 'visible';

    const computed = window.getComputedStyle(scroller);
    expect(computed.overflowX).toBe('visible');
    expect(computed.overflowY).toBe('visible');
    expect(computed.overflow).toBe('hidden');

    expect(collectScroller(stubEle({ css: {} }))).toEqual([]);
    const child = document.createElement('div');
    scroller.appendChild(child);
    expect(collectScroller(child)).toEqual([scroller]);
  });

  it('clip 也算裁剪（CSS overflow: clip 同样裁掉溢出）', () => {
    const scroller = stubEle({ css: { overflow: 'clip' } });
    const child = document.createElement('div');
    scroller.appendChild(child);
    expect(collectScroller(child)).toEqual([scroller]);
  });

  it('无 defaultView 的祖先被跳过而不是抛错', () => {
    const orphanDoc = document.implementation.createHTMLDocument('orphan');
    expect(collectScroller(orphanDoc.body)).toEqual([]);
  });
});

describe('getVisibleArea', () => {
  const full: Area = { left: 0, top: 0, right: 1000, bottom: 800 };

  it('无滚动容器时原样返回', () => {
    expect(getVisibleArea(full, [])).toEqual(full);
  });

  it('逐项复算 antd 的公式 —— 边框 + 滚动条 + 无 clip margin', () => {
    // rect(100,50,200x100)，外框 200x100 ⇒ scale 1
    // 内框 185x88 ⇒ 滚动条 W=(200-185-4-5)=6，H=(100-88-2-3)=7
    // eleLeft  = 100 + 4 = 104        （左边框往里推）
    // eleTop   =  50 + 2 =  52
    // eleRight = 104 + 200 - 4 - 5 - 6  = 289
    // eleBottom=  52 + 100 - 2 - 3 - 7  = 140
    const scroller = stubEle({
      rect: { x: 100, y: 50, width: 200, height: 100 },
      offset: { width: 200, height: 100 },
      client: { width: 185, height: 88 },
      border: { top: 2, bottom: 3, left: 4, right: 5 },
    });

    expect(getVisibleArea(full, [scroller])).toEqual({
      left: 104,
      top: 52,
      right: 289,
      bottom: 140,
    });
  });

  it('overflow: clip 时 clip margin 双向外扩 —— 左/上减、右/下加 2 倍', () => {
    const scroller = stubEle({
      rect: { x: 100, y: 50, width: 200, height: 100 },
      offset: { width: 200, height: 100 },
      client: { width: 185, height: 88 },
      border: { top: 2, bottom: 3, left: 4, right: 5 },
      css: { overflow: 'clip', 'overflow-clip-margin': '10px' },
    });

    // eleLeft  = 100 + 4 - 10 = 94
    // eleTop   =  50 + 2 - 10 = 42
    // eleRight =  94 + 200 + 20 - 4 - 5 - 6 = 299
    // eleBottom=  42 + 100 + 20 - 2 - 3 - 7 = 150
    expect(getVisibleArea(full, [scroller])).toEqual({
      left: 94,
      top: 42,
      right: 299,
      bottom: 150,
    });
  });

  it('非 clip 取值下 clip margin 必须为 0 —— 即使 CSS 里声明了它', () => {
    const scroller = stubEle({
      rect: { x: 100, y: 50, width: 200, height: 100 },
      offset: { width: 200, height: 100 },
      client: { width: 185, height: 88 },
      border: { top: 2, bottom: 3, left: 4, right: 5 },
      css: { overflow: 'hidden', 'overflow-clip-margin': '10px' },
    });

    expect(getVisibleArea(full, [scroller])).toEqual({
      left: 104,
      top: 52,
      right: 289,
      bottom: 140,
    });
  });

  it('滚动条尺寸是「先减边框，再乘 scale」—— 顺序反了会多扣', () => {
    // rect 100x100，外框 200x50 ⇒ scaleX = 0.5，scaleY = 2
    // 正确：W = (200-190-2-2) * 0.5 = 3   H = (50-40-2-2) * 2 = 12
    // 错误（先乘后减）：W = (200-190)*0.5 - 4 = 1
    const scroller = stubEle({
      rect: { x: 0, y: 0, width: 100, height: 100 },
      offset: { width: 200, height: 50 },
      client: { width: 190, height: 40 },
      border: { top: 2, bottom: 2, left: 2, right: 2 },
      css: { overflow: 'auto' },
    });

    // eleLeft  = 0 + 2*0.5 = 1
    // eleTop   = 0 + 2*2   = 4
    // eleRight = 1 + 100 - 1 - 1 - 3  = 96
    // eleBottom= 4 + 100 - 4 - 4 - 12 = 84
    expect(getVisibleArea(full, [scroller])).toEqual({
      left: 1,
      top: 4,
      right: 96,
      bottom: 84,
    });
  });

  it('多个容器逐级取交集，且不会越裁越大', () => {
    const a = stubEle({
      rect: { x: 10, y: 10, width: 300, height: 300 },
      offset: { width: 300, height: 300 },
      client: { width: 300, height: 300 },
    });
    const b = stubEle({
      rect: { x: 50, y: 50, width: 400, height: 400 },
      offset: { width: 400, height: 400 },
      client: { width: 400, height: 400 },
    });

    expect(getVisibleArea(full, [a, b])).toEqual({ left: 50, top: 50, right: 310, bottom: 310 });
  });

  it('body 与 html 被跳过 —— 它们已由 initArea 表达', () => {
    // antd 用 `instanceof HTMLBodyElement / HTMLHtmlElement`；同 realm 下等价于与文档比较
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    expect(window.getComputedStyle(document.body).overflow).toBe('hidden');

    expect(getVisibleArea(full, [document.body])).toEqual(full);
    expect(getVisibleArea(full, [document.documentElement])).toEqual(full);
  });

  it('无 defaultView 的容器被跳过而不是抛错', () => {
    const orphanDoc = document.implementation.createHTMLDocument('orphan');
    const orphan = orphanDoc.createElement('div');
    expect(getVisibleArea(full, [orphan])).toEqual(full);
  });
});

describe('getViewportArea / getScrollArea', () => {
  it('视口区原点为 0，尺寸取 clientWidth/Height（不含滚动条）', () => {
    const restore = stubDocEl({ clientWidth: 800, clientHeight: 600 });
    try {
      expect(getViewportArea(document)).toEqual({ left: 0, top: 0, right: 800, bottom: 600 });
    } finally {
      restore();
    }
  });

  it('滚动区原点是 (-scrollLeft, -scrollTop) —— 文档坐标系，不是视口坐标系', () => {
    const restore = stubDocEl({
      scrollWidth: 2000,
      scrollHeight: 1500,
      scrollLeft: 20,
      scrollTop: 10,
    });
    try {
      expect(getScrollArea(document)).toEqual({
        left: -20,
        top: -10,
        right: 1980,
        bottom: 1490,
      });
    } finally {
      restore();
    }
  });

  it('写错成原点 0 会让 htmlRegion=scroll 整体错位一个滚动量', () => {
    const restore = stubDocEl({
      scrollWidth: 2000,
      scrollHeight: 1500,
      scrollLeft: 20,
      scrollTop: 10,
    });
    try {
      const area = getScrollArea(document);
      expect(area.left).not.toBe(0);
      expect(area.right).toBe(1980); // 不是 2000
    } finally {
      restore();
    }
  });
});

describe('measureRect / measureScale', () => {
  it('measureRect 走 toRect，兼容 x 缺失', () => {
    const el = stubEle({ rect: { x: 10, y: 20, width: 30, height: 40 } });
    expect(measureRect(el)).toEqual({ x: 10, y: 20, width: 30, height: 40 });
  });

  it('scale = 实测矩形 / CSS 声明值', () => {
    const el = stubEle({
      rect: { x: 0, y: 0, width: 80, height: 40 },
      css: { width: '40px', height: '80px' },
    });
    expect(measureScale(el, measureRect(el), window)).toEqual({ scaleX: 2, scaleY: 0.5 });
  });

  it('CSS 声明值为 auto 时 NaN 兜底为 1 —— jsdom 下的常态', () => {
    const el = stubEle({ rect: { x: 0, y: 0, width: 80, height: 40 } });
    expect(window.getComputedStyle(el).width).toBe('auto');
    expect(measureScale(el, measureRect(el), window)).toEqual({ scaleX: 1, scaleY: 1 });
  });
});

// ---------------------------------------------------------------------------
// measureAlign
// ---------------------------------------------------------------------------

describe('measureAlign', () => {
  it('§3.1 归零不变量：popupRect 直接就是容器的视口坐标，无需换算容器偏移', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      const result = measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });
      expect(result).not.toBeNull();
      // 浮层被归零到 left/top=0 后测得的 x/y **就是**容器自身的视口坐标。
      // 这正是 `getPopupContainer` 不需要任何坐标换算的原因：
      // 容器偏移同时出现在 targetAlignPoint 与 popupAlignPoint 里，相减时自动消掉。
      expect(result?.popup).toEqual({ x: CONTAINER.x, y: CONTAINER.y, width: 80, height: 40 });
    } finally {
      restoreDoc();
    }
  });

  it('镜像矩形测于 right/bottom 归零之后', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      const result = measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });
      expect(result?.mirror).toEqual({
        x: CONTAINER.x + CONTAINER.width - POPUP_SIZE.width,
        y: CONTAINER.y + CONTAINER.height - POPUP_SIZE.height,
        width: 80,
        height: 40,
      });
    } finally {
      restoreDoc();
    }
  });

  it('镜像矩形可直接反解 offsetR —— 容器右缘到浮层右缘', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      const result = measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });
      expect(result).not.toBeNull();
      const { mirror, popup: p } = result ?? { mirror: undefined, popup: undefined };
      if (!mirror || !p) throw new Error('unreachable');
      expect(mirrorOffsetR(mirror, p, 5)).toBe(215);
    } finally {
      restoreDoc();
    }
  });

  it('元素型 target 取它的实测矩形；坐标型 target 是 0×0 点', () => {
    const { popup, restoreDoc } = buildRig();
    const target = stubEle({ rect: { x: 150, y: 250, width: 60, height: 20 } });
    try {
      expect(measureAlign({ popupEle: popup, target, scrollers: [] })?.target).toEqual({
        x: 150,
        y: 250,
        width: 60,
        height: 20,
      });
      expect(measureAlign({ popupEle: popup, target: [70, 90], scrollers: [] })?.target).toEqual({
        x: 70,
        y: 90,
        width: 0,
        height: 0,
      });
    } finally {
      restoreDoc();
    }
  });

  it('htmlRegion 默认 visible —— visible 与 check 同为视口区', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      const result = measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] });
      expect(result?.visible).toEqual({ left: 0, top: 0, right: 800, bottom: 600 });
      expect(result?.check).toEqual(result?.visible);
    } finally {
      restoreDoc();
    }
  });

  it('htmlRegion=scroll —— 两个区域都切到文档滚动区', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      const result = measureAlign({
        popupEle: popup,
        target: [0, 0],
        scrollers: [],
        htmlRegion: 'scroll',
      });
      expect(result?.visible).toEqual({ left: -20, top: -10, right: 1980, bottom: 1490 });
      expect(result?.check).toEqual(result?.visible);
    } finally {
      restoreDoc();
    }
  });

  it('htmlRegion=visibleFirst —— 摆放用滚动区，翻转判定用视口区', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      const result = measureAlign({
        popupEle: popup,
        target: [0, 0],
        scrollers: [],
        htmlRegion: 'visibleFirst',
      });
      expect(result?.visible).toEqual({ left: -20, top: -10, right: 1980, bottom: 1490 });
      expect(result?.check).toEqual({ left: 0, top: 0, right: 800, bottom: 600 });
    } finally {
      restoreDoc();
    }
  });

  it('未传 scrollers 时自行收集', () => {
    const { popup, restoreDoc } = buildRig();
    const scroller = stubEle({
      css: { overflow: 'auto' },
      rect: { x: 0, y: 0, width: 50, height: 50 },
    });
    scroller.appendChild(popup);
    try {
      const result = measureAlign({ popupEle: popup, target: [0, 0] });
      // scroller 的裁剪框是 rect(0,0,50x50)，与视口区相交后是 (0,0,50,50)
      expect(result?.visible).toEqual({ left: 0, top: 0, right: 50, bottom: 50 });
    } finally {
      restoreDoc();
    }
  });

  it('scale 为 0 时返回 null —— 调用方不应更新位置', () => {
    const { popup, restoreDoc } = buildRig();
    // 实测宽 0 而 CSS 声明 80px ⇒ scaleX = 0
    popup.getBoundingClientRect = () => new DOMRect(0, 0, 0, 40);
    try {
      expect(measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] })).toBeNull();
    } finally {
      restoreDoc();
    }
  });

  it('target 是元素但不可见时返回 null', () => {
    const { popup, restoreDoc } = buildRig();
    // jsdom 无布局引擎 ⇒ `offsetParent` 恒 null；宽高都为 0 时 isVisible 三级判定全败
    const target = stubEle({ rect: { x: 0, y: 0, width: 0, height: 0 } });
    try {
      expect(measureAlign({ popupEle: popup, target, scrollers: [] })).toBeNull();
    } finally {
      restoreDoc();
    }
  });

  it('坐标型 target 恒视为可见 —— 不受 isVisible 影响', () => {
    const { popup, restoreDoc } = buildRig();
    try {
      expect(measureAlign({ popupEle: popup, target: [0, 0], scrollers: [] })).not.toBeNull();
    } finally {
      restoreDoc();
    }
  });

  it('无 defaultView 时返回 null', () => {
    const orphanDoc = document.implementation.createHTMLDocument('orphan');
    const orphan = orphanDoc.createElement('div');
    expect(measureAlign({ popupEle: orphan, target: [0, 0] })).toBeNull();
  });
});
