/**
 * 单例缓存：只记最近一次的 `cacheParams`，相同则复用旧结果
 * 调用者提供实际内容键；DOM 对象保持真实身份，NaN 使用 Object.is 比较。
 */

export function useSingletonCache<K, V>(): (cacheKeys: readonly K[], callback: () => V) => V {
  let cache: { keys: readonly K[]; value: V } | undefined;
  return (keys, callback) => {
    if (!cache || !isEqualArray(cache.keys, keys)) {
      cache = { keys: [...keys], value: callback() };
    }
    return cache.value;
  };
}

function isEqualArray(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
}
