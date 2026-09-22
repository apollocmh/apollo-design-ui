/**
 * 单例缓存：只记最近一次的 `cacheParams`，相同则复用旧结果
 * （antd 的 `useSingletonCache.js` 机械移植）。
 *
 * ⚠️ 不可比较的键（HTMLElement / NaN）以空串参与比较 —— antd 逐字保留
 * （图片元素引用每次都变，参与比较会让缓存永远失效）。
 */

export function isHTMLElement(item: unknown): item is HTMLElement {
  return typeof HTMLElement !== 'undefined' && item instanceof HTMLElement;
}

export function useSingletonCache<K, V>(): (cacheKeys: K[], callback: () => V) => V {
  let cacheRef: [K[] | null, V | null] = [null, null];

  return (cacheKeys: K[], callback: () => V): V => {
    const filteredKeys = cacheKeys.map((item) =>
      isHTMLElement(item) || (typeof item === 'number' && Number.isNaN(item))
        ? ('' as unknown as K)
        : item,
    );
    if (!isEqualArray(cacheRef[0], filteredKeys)) {
      cacheRef = [filteredKeys, callback()];
    }
    return cacheRef[1] as V;
  };
}

function isEqualArray(a: unknown[] | null, b: unknown[]): boolean {
  if (a === b) return true;
  if (!a || a.length !== b.length) return false;
  return a.every((item, i) => item === b[i]);
}
