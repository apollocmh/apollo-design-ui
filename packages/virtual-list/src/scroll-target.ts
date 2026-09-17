/**
 * `scrollTo` 的一轮计算。
 *
 * 契约来源：`@rc-component/virtual-list@1.5.1/es/hooks/useScrollTo.js:4-7`（`getOffset`）
 * 与 `:13-113`（迭代体）。
 *
 * ⚠️ **与上游的结构差异（有意）**：上游把这一轮写在 `useLayoutEffect` 里，与 React 的
 *    state 更新耦合，无法单独测试。本包把它抽成纯函数，Vue 侧只负责循环。
 *    行为等价 —— 同样的 `MAX_TIMES = 10`、同样的 `lastTop` 比较、同样的 dev 告警。
 *    见契约文档 §5.2。
 */

import type { HeightsLookup, ItemKey, ScrollAlign, ScrollOffsetInfo, ScrollPos } from './types';

/** 迭代上限（`useScrollTo.js:3`）。超过就打 dev 告警。 */
export const MAX_SCROLL_TO_TIMES = 10;

/**
 * 解析 `offset`（`useScrollTo.js:4-7`）。
 *
 * ```js
 * const resolvedOffset = typeof rawOffset === 'function' ? rawOffset(info) : rawOffset;
 * return Number.isFinite(resolvedOffset) ? resolvedOffset : 0;
 * ```
 *
 * ⚠️ `Number.isFinite` 对 `undefined` / `NaN` / `Infinity` 都是 `false` ⇒ 一律归 0。
 *    所以「不传 offset」与「传 NaN」在这里是同一件事。
 */
export function resolveScrollOffset(
  rawOffset: number | ((info: ScrollOffsetInfo) => number) | undefined,
  info: ScrollOffsetInfo,
): number {
  const resolved = typeof rawOffset === 'function' ? rawOffset(info) : rawOffset;
  // `Number.isFinite` 不会把 `number | undefined` 窄化成 number，所以显式判类型
  return typeof resolved === 'number' && Number.isFinite(resolved) ? resolved : 0;
}

export interface ComputeScrollTargetInput<T> {
  data: readonly T[];
  getKey: (item: T) => ItemKey;
  heights: HeightsLookup;
  itemHeight: number;
  /** 目标项下标；**`< 0` 表示「按 key 没找到」** */
  index: number;
  /** 本轮的对齐方式。首轮来自调用方，之后来自上一轮的 `nextAlign` */
  align: ScrollAlign | undefined;
  /** 已解析的偏移（`resolveScrollOffset` 的结果） */
  offset: number;
  /** 容器高（`clientHeight`） */
  containerHeight: number;
  /** 当前 `scrollTop` */
  scrollTop: number;
  /** 上一轮算出的目标位置，用于判断「位置是否已经稳定」 */
  lastTop?: number | null;
}

export interface ComputeScrollTargetResult {
  /**
   * 要滚到的位置。
   *
   * ⚠️ **`null` 表示本轮不滚** —— 发生在 `align` 缺省（既不 `top` 也不 `bottom`）时：
   *    此时只算出 `nextAlign` 留给下一轮。这不是 bug，是「目标已在视口内就不动」的实现方式。
   */
  targetTop: number | null;
  /** 传给下一轮的 align */
  nextAlign: ScrollAlign | undefined;
  /** 是否需要再收集一次高度并重算 */
  needCollectHeight: boolean;
}

/**
 * 算一轮「该滚到哪」。
 *
 * 三段（`useScrollTo.js:39-98`）：
 *   1. 从 0 累加到目标项，得到 `itemTop` / `itemBottom`
 *   2. **反向**检查可见范围内有没有未测量的项 —— 有就必须再收集一次
 *   3. 按 `align` 算 `targetTop`；`align` 缺省时只决定 `nextAlign`
 *
 * ⚠️ 第 2 段的起点是 `mergedAlign === 'top' ? offset : containerHeight - offset` ——
 *    「从上往下数 offset 这么高」或「从下往上数」。这一段的目的是「判断目标项附近
 *    是否有还没测量过的项」，因为未测量的项用的是 `itemHeight` 估算，位置会偏。
 */
export function computeScrollTarget<T>(
  input: ComputeScrollTargetInput<T>,
): ComputeScrollTargetResult {
  const {
    data,
    getKey,
    heights,
    itemHeight,
    index,
    align,
    offset,
    containerHeight,
    scrollTop,
    lastTop,
  } = input;

  // 按 key 没找到 ⇒ 数据还没就绪，必须再收集一次
  let needCollectHeight = index < 0;
  let nextAlign = align;
  let targetTop: number | null = null;

  if (containerHeight && index >= 0) {
    // ---------- 1. 累加到目标项 ----------
    let stackTop = 0;
    let itemTop = 0;
    let itemBottom = 0;
    const maxLen = Math.min(data.length - 1, index);

    for (let i = 0; i <= maxLen; i += 1) {
      const item = data[i];
      // 稀疏数组的洞：上游会把 undefined 交给 getKey（可能抛错）；
      // 这里当作「未测量」，用 itemHeight 兜底，不影响非稀疏数组的行为
      const cacheHeight = item === undefined ? undefined : heights.get(getKey(item));
      itemTop = stackTop;
      itemBottom = itemTop + (cacheHeight === undefined ? itemHeight : cacheHeight);
      stackTop = itemBottom;
    }

    // ---------- 2. 可见范围内有未测量的项吗 ----------
    let leftHeight = align === 'top' ? offset : containerHeight - offset;
    for (let i = maxLen; i >= 0; i -= 1) {
      const item = data[i];
      const cacheHeight = item === undefined ? undefined : heights.get(getKey(item));
      if (cacheHeight === undefined) {
        needCollectHeight = true;
        break;
      }
      leftHeight -= cacheHeight;
      if (leftHeight <= 0) {
        break;
      }
    }

    // ---------- 3. 算目标 ----------
    switch (align) {
      case 'top':
        targetTop = itemTop - offset;
        break;
      case 'bottom':
        targetTop = itemBottom - containerHeight + offset;
        break;
      default: {
        // 缺省 align：只在「目标不在视口内」时决定方向，本轮不滚
        const scrollBottom = scrollTop + containerHeight;
        if (itemTop < scrollTop) {
          nextAlign = 'top';
        } else if (itemBottom > scrollBottom) {
          nextAlign = 'bottom';
        }
        break;
      }
    }

    // 位置还没稳定 ⇒ 再算一轮
    if (targetTop !== lastTop) {
      needCollectHeight = true;
    }
  }

  return { targetTop, nextAlign, needCollectHeight };
}

/**
 * `scrollTo` 的入参（`useScrollTo.js:125-151`）。
 *
 * ⚠️ **非泛型** —— 上游的 `ScrollTo` 也不是泛型（键类型是 `ItemKey`，与数据无关）。
 */
export type ScrollArg =
  | number
  | {
      index?: number;
      key?: ItemKey;
      align?: ScrollAlign;
      offset?: number | ((info: ScrollOffsetInfo) => number);
    }
  | { left?: number; top?: number }
  | null
  | undefined;

/**
 * 是不是「按坐标滚动」的形态（上游的 `isPosScroll`）。
 *
 * ⚠️ 必须写成**类型谓词**：`ScrollPos` 的两个字段都是可选的，直接用 `'left' in arg`
 *    在**假分支**里 TS 无法把 `ScrollPos` 从联合里减掉（`{}` 也满足 `ScrollPos`），
 *    于是后面访问 `arg.index` 会报「属性不存在」。谓词在真假两个分支都精确。
 */
function isPosScroll(arg: object): arg is ScrollPos {
  return 'left' in arg || 'top' in arg;
}

/**
 * 归一后的滚动目标。
 *
 * ⚠️ 刻意写成**判别联合**而不是「一个带可选字段的接口」：
 *    `kind === 'top'` 时 `top` 一定是数字、`kind === 'item'` 时 `index` 一定存在，
 *    写成可选字段会逼出 `target.top ?? 0` / `target.index ?? -1` 这种**永远不可达**的兜底，
 *    而不可达分支会永久拉低分支覆盖率（同 a11y 的处理）。
 */
export type NormalizedScrollTarget =
  | { kind: 'flash' }
  | { kind: 'top'; top: number }
  | { kind: 'pos'; left?: number; top?: number }
  | {
      kind: 'item';
      /** 目标项下标；`-1` 表示「按 key 没找到」（调用方据此重试） */
      index: number;
      key?: ItemKey;
      align?: ScrollAlign;
      offset?: number | ((info: ScrollOffsetInfo) => number);
    };

/**
 * 把四种入参归一成一个中间表示。
 *
 * - `null` / `undefined` ⇒ `flash`（上游是「闪一下自绘滚动条」；本包无自绘滚动条 ⇒ 调用方 no-op）
 * - `number` ⇒ `top`
 * - `{ left?, top? }` ⇒ `pos`（**优先于 index/key**）
 * - 其余对象 ⇒ `item`（`index` 优先，否则用 `key` 查下标）
 *
 * ⚠️ 这里刻意**没有**末尾的兜底 `return` —— 每条路径都显式返回。
 *    写成 `if (typeof arg === 'object') {...} return { kind: 'flash' }` 的话，
 *    那个末尾 return 在类型上不可达，覆盖率会永远差一行（见 a11y 的同类处理）。
 */
export function normalizeScrollArg<T>(
  arg: ScrollArg,
  data: readonly T[],
  getKey: (item: T) => ItemKey,
): NormalizedScrollTarget {
  if (typeof arg === 'number') {
    return { kind: 'top', top: arg };
  }
  if (arg === null || arg === undefined) {
    return { kind: 'flash' };
  }
  // ⚠️ 坐标形态优先于 index/key —— 上游的 `isPosScroll` 就是先判 `'left' in arg || 'top' in arg`，
  //    所以 `{ index: 5, top: 10 }` 会被当成坐标（index 被忽略）。
  if (isPosScroll(arg)) {
    return { kind: 'pos', left: arg.left, top: arg.top };
  }
  if (arg.index !== undefined) {
    return {
      kind: 'item',
      index: arg.index,
      align: arg.align,
      offset: arg.offset,
    };
  }
  const key = arg.key;
  return {
    kind: 'item',
    key,
    index: data.findIndex((item) => getKey(item) === key),
    align: arg.align,
    offset: arg.offset,
  };
}
