/**
 * 高度缓存。
 *
 * 契约来源：`@rc-component/virtual-list@1.5.1/es/utils/CacheMap.js`（32 行）。
 *
 * 两个细节都是契约的一部分，不是实现选择：
 *
 *   1. **`Object.create(null)` 而不是 `{}`** —— 用普通对象时，
 *      `'constructor'` / `'toString'` / `'__proto__'` 这类键会命中原型链上的成员，
 *      于是「没缓存过」会被误判成「缓存过一个函数」。项键来自业务数据，
 *      出现这种字符串完全可能。
 *   2. **`id` 每次 `set` 自增** —— 它是外部的响应式依赖：`createSizeGetter` 的缓存
 *      挂在 `id` 上，高度一变就整个重建。少了它，尺寸查询会一直返回旧值。
 */

import type { ItemKey } from './types';

/**
 * ⚠️ 这里**不写** `implements HeightsLookup` —— 那个接口的 `get` 返回 `number | undefined`，
 *    而泛型 `V` 不保证是 number。`CacheMap<number>` 会**结构化**地满足 `HeightsLookup`，
 *    不需要显式实现（显式实现反而在泛型下无法通过检查）。
 */
export class CacheMap<V = number> {
  /** 每次 `set` 自增。外部拿它当「缓存代次」。 */
  id = 0;

  /** ⚠️ 无原型 —— 见文件头第 1 条 */
  readonly maps: Record<string, V | undefined> = Object.create(null) as Record<
    string,
    V | undefined
  >;

  /** 每个键的**上一次**值。`undefined` 表示「这次是首次测量」。 */
  private readonly diffRecords = new Map<ItemKey, V | undefined>();

  set(key: ItemKey, value: V): void {
    this.diffRecords.set(key, this.maps[key]);
    this.maps[key] = value;
    this.id += 1;
  }

  get(key: ItemKey): V | undefined {
    return this.maps[key];
  }

  /** 清空「本次变更记录」。**每次布局后都要调**，否则记录会一直累积。 */
  resetRecord(): void {
    this.diffRecords.clear();
  }

  getRecord(): ReadonlyMap<ItemKey, V | undefined> {
    return this.diffRecords;
  }
}

/** 与 `CacheMap` 的构造签名一致的工厂。 */
export function createCacheMap<V = number>(): CacheMap<V> {
  return new CacheMap<V>();
}
