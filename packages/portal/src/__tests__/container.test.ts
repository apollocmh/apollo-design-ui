/**
 * L1 —— `container.ts` 的纯数据侧。
 *
 * ⚠️ 这里的期望值**不是**照着实现写的，是从
 * `@rc-component/portal@2.1.0` 与 antd 6.6.4 `_util/hooks/useZIndex.ts`
 * 逐行读出来后手算的。改实现前先看这段注释。
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CONTAINER_MAX_OFFSET,
  CONTAINER_MAX_OFFSET_WITH_CHILDREN,
  CONTAINER_OFFSET,
  CONTAINER_OFFSET_MAX_COUNT,
  computeZIndex,
  consumerBaseZIndexOffset,
  containerBaseZIndexOffset,
  DEFAULT_Z_INDEX_POPUP_BASE,
  enqueueAppend,
  flushAppendQueue,
  isContainerType,
  resolveContainer,
  shouldWarnZIndex,
  type ZIndexComponentType,
  type ZIndexConsumer,
  type ZIndexContainer,
} from '../index';

const CONTAINERS: readonly ZIndexContainer[] = [
  'Modal',
  'Drawer',
  'Popover',
  'Popconfirm',
  'Tooltip',
  'Tour',
  'FloatButton',
];
const CONSUMERS: readonly ZIndexConsumer[] = [
  'SelectLike',
  'Dropdown',
  'DatePicker',
  'Menu',
  'ImagePreview',
];
const ALL_TYPES: readonly ZIndexComponentType[] = [...CONTAINERS, ...CONSUMERS];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('常量', () => {
  it('四个偏移常量与 antd 逐字一致', () => {
    expect(CONTAINER_OFFSET).toBe(100);
    expect(CONTAINER_OFFSET_MAX_COUNT).toBe(10);
    expect(CONTAINER_MAX_OFFSET).toBe(1000);
    expect(CONTAINER_MAX_OFFSET_WITH_CHILDREN).toBe(1100);
    expect(DEFAULT_Z_INDEX_POPUP_BASE).toBe(1000);
  });

  it('⭐ 七种容器**都是** 100 —— 差异化在 CSS，不在这张表', () => {
    for (const name of CONTAINERS) {
      expect(containerBaseZIndexOffset[name]).toBe(100);
    }
  });

  it('⭐ ImagePreview 是 1 而不是 50 —— 它是唯一贴着父级走的消费者', () => {
    expect(consumerBaseZIndexOffset.SelectLike).toBe(50);
    expect(consumerBaseZIndexOffset.Dropdown).toBe(50);
    expect(consumerBaseZIndexOffset.DatePicker).toBe(50);
    expect(consumerBaseZIndexOffset.Menu).toBe(50);
    expect(consumerBaseZIndexOffset.ImagePreview).toBe(1);
  });
});

describe('isContainerType', () => {
  it('容器为真，消费者为假', () => {
    for (const name of CONTAINERS) expect(isContainerType(name)).toBe(true);
    for (const name of CONSUMERS) expect(isContainerType(name)).toBe(false);
  });
});

describe('computeZIndex', () => {
  it('⭐ 最外层浮层**不设** z-index —— 靠 DOM 顺序堆叠', () => {
    expect(computeZIndex({ componentType: 'Modal' })).toEqual([undefined, 1100]);
    expect(computeZIndex({ componentType: 'Tooltip' })).toEqual([undefined, 1100]);
    expect(computeZIndex({ componentType: 'SelectLike' })).toEqual([undefined, 50]);
    expect(computeZIndex({ componentType: 'ImagePreview' })).toEqual([undefined, 1]);
  });

  it('嵌套浮层拿到数值，且父级不再叠加 base', () => {
    // 1100（父） + 0（有父不叠 base） + 100（container offset）
    expect(computeZIndex({ componentType: 'Modal', parentZIndex: 1100 })).toEqual([1200, 1200]);
    // 1100 + 50（consumer offset）—— 这里**不**加 base
    expect(computeZIndex({ componentType: 'SelectLike', parentZIndex: 1100 })).toEqual([
      1150, 1150,
    ]);
    expect(computeZIndex({ componentType: 'ImagePreview', parentZIndex: 1100 })).toEqual([
      1101, 1101,
    ]);
  });

  it('customZIndex 完全跳过计算，两个返回值都是它', () => {
    expect(computeZIndex({ componentType: 'Modal', customZIndex: 5000 })).toEqual([5000, 5000]);
    // 即便有父级也不叠加
    expect(
      computeZIndex({ componentType: 'Modal', parentZIndex: 1100, customZIndex: 5000 }),
    ).toEqual([5000, 5000]);
  });

  it('zIndexPopupBase 可覆盖', () => {
    expect(computeZIndex({ componentType: 'Modal', zIndexPopupBase: 2000 })).toEqual([
      undefined,
      2100,
    ]);
    expect(
      computeZIndex({ componentType: 'Modal', parentZIndex: 2100, zIndexPopupBase: 2000 }),
    ).toEqual([2200, 2200]);
  });

  it('⭐ parentZIndex 为 0 时的诡异组合 —— 两个判据给出的答案相反', () => {
    // `parentZIndex ? 0 : base` 用**真值**判断 ⇒ 0 视为「无父」，仍然叠 base；
    // 但 `parentZIndex === undefined ? customZIndex : zIndex` 用 **undefined** 判断
    // ⇒ 0 视为「有父」，于是 result[0] 拿到算出来的数值而不是 undefined。
    // 这不是我们要修的 bug，是 antd 的原始语义，必须钉住。
    expect(computeZIndex({ componentType: 'Modal', parentZIndex: 0 })).toEqual([1100, 1100]);
  });

  it('穷举：第二个返回值永远等于「算出来的数值」，且恒为 number', () => {
    for (const componentType of ALL_TYPES) {
      for (const parentZIndex of [undefined, 0, 1100, 2100]) {
        for (const zIndexPopupBase of [undefined, 2000]) {
          const [, context] = computeZIndex({ componentType, parentZIndex, zIndexPopupBase });
          expect(typeof context).toBe('number');
          // 有 customZIndex 时两个都等于它
          const [a, b] = computeZIndex({ componentType, parentZIndex, customZIndex: 777 });
          expect(a).toBe(777);
          expect(b).toBe(777);
        }
      }
    }
  });

  it('穷举：第一个返回值只在「顶层且无 customZIndex」时为 undefined', () => {
    for (const componentType of ALL_TYPES) {
      for (const parentZIndex of [0, 1100]) {
        const [zIndex] = computeZIndex({ componentType, parentZIndex });
        expect(zIndex).not.toBeUndefined();
      }
      const [top] = computeZIndex({ componentType });
      expect(top).toBeUndefined();
    }
  });
});

describe('shouldWarnZIndex', () => {
  it('阈值是 base + 1100，自身不算越界', () => {
    expect(shouldWarnZIndex({ currentZIndex: 2100 })).toBe(false);
    expect(shouldWarnZIndex({ currentZIndex: 2101 })).toBe(true);
    expect(shouldWarnZIndex({ currentZIndex: undefined })).toBe(false);
  });

  it('给了 customZIndex 就**不**告警（antd 认为用户自己负责）', () => {
    expect(shouldWarnZIndex({ currentZIndex: 9999, customZIndex: 9999 })).toBe(false);
  });

  it('base 变化时阈值跟着变', () => {
    expect(shouldWarnZIndex({ currentZIndex: 3100, zIndexPopupBase: 2000 })).toBe(false);
    expect(shouldWarnZIndex({ currentZIndex: 3101, zIndexPopupBase: 2000 })).toBe(true);
    expect(CONTAINER_MAX_OFFSET_WITH_CHILDREN).toBe(1100);
  });
});

describe('resolveContainer', () => {
  it('`false` 原样返回（内联渲染）', () => {
    expect(resolveContainer(false)).toBe(false);
  });

  it('null / undefined 都得到 null', () => {
    expect(resolveContainer(null)).toBeNull();
    expect(resolveContainer(undefined)).toBeNull();
  });

  it('元素 / ShadowRoot 原样返回', () => {
    const el = document.createElement('div');
    expect(resolveContainer(el)).toBe(el);
  });

  it('不传 doc ⇒ 用全局 document', () => {
    const target = document.createElement('section');
    target.id = 'global-holder';
    document.body.appendChild(target);
    try {
      expect(resolveContainer('#global-holder')).toBe(target);
    } finally {
      target.remove();
    }
  });

  it('选择器字符串走注入的 doc', () => {
    const host = document.createElement('div');
    const target = document.createElement('section');
    target.id = 'my-holder';
    host.appendChild(target);

    const fakeDoc = { querySelector: (s: string) => host.querySelector(s) } as unknown as Document;
    expect(resolveContainer('#my-holder', fakeDoc)).toBe(target);
    // 查不到 ⇒ null，不是 undefined
    expect(resolveContainer('#nope', fakeDoc)).toBeNull();
  });

  it('⭐ 函数返回 undefined 时**保持 undefined** —— 这是「未就绪」态', () => {
    // 归一化成 null 会让「依赖 ref 的容器」在首帧错误地渲染到默认容器再跳走
    expect(resolveContainer(() => undefined)).toBeUndefined();
    // 返回 null 才是「解析过了，但没有容器」
    expect(resolveContainer(() => null)).toBeNull();
  });

  it('函数返回元素时透传', () => {
    const el = document.createElement('div');
    expect(resolveContainer(() => el)).toBe(el);
  });

  it('SSR（无 window）下连选择器都不查，直接 null', () => {
    vi.stubGlobal('window', undefined);
    const el = document.createElement('div');
    expect(resolveContainer(el)).toBeNull();
    expect(resolveContainer('#x')).toBeNull();
    expect(resolveContainer(() => el)).toBeNull();
  });
});

describe('嵌套顺序队列', () => {
  it('⭐ 新的排**前面**，flush 按数组顺序执行 ⇒ 后登记的先 append', () => {
    const order: string[] = [];
    let queue: (() => void)[] = [];
    queue = enqueueAppend(queue, () => order.push('first'));
    queue = enqueueAppend(queue, () => order.push('second'));
    queue = enqueueAppend(queue, () => order.push('third'));

    flushAppendQueue(queue);
    expect(order).toEqual(['third', 'second', 'first']);
  });

  it('空队列 flush 不抛错', () => {
    expect(() => flushAppendQueue([])).not.toThrow();
  });
});
