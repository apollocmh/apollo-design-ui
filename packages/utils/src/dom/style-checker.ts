/**
 * `isStyleSupport` —— 浏览器是否支持某个 CSS 属性（或属性 + 值）。
 *
 * 契约来源：`@rc-component/util/Dom/styleChecker`。
 *
 * 两个重载：
 *   - `isStyleSupport('backdropFilter')` → 属性是否存在于 `documentElement.style`
 *   - `isStyleSupport('position', 'sticky')` → 属性存在，**且**赋值后值发生变化
 *   - `isStyleSupport(['a', 'b'])` → **任一**支持即为 `true`（`some`，不是 `every`）
 *
 * ⚠️ 没有 DOM 时一律返回 `false`（而不是抛错）。
 *    这意味着 SSR 下所有 `isStyleSupport` 判定都会走"不支持"分支 ——
 *    调用方必须保证那条分支是安全降级，而不是崩溃。
 */

import canUseDom from './can-use-dom';

function isStyleNameSupport(styleName: string | string[]): boolean {
  if (!canUseDom() || !window.document.documentElement) {
    return false;
  }
  const names = Array.isArray(styleName) ? styleName : [styleName];
  const { documentElement } = window.document;
  return names.some((name) => name in documentElement.style);
}

function isStyleValueSupport(styleName: string, value: unknown): boolean {
  if (!isStyleNameSupport(styleName)) {
    return false;
  }
  const ele = document.createElement('div');
  const origin = (ele.style as unknown as Record<string, unknown>)[styleName];
  (ele.style as unknown as Record<string, unknown>)[styleName] = value;
  // 值被浏览器接受才会变化；不被接受时赋值被忽略（或保持原值）
  return (ele.style as unknown as Record<string, unknown>)[styleName] !== origin;
}

export function isStyleSupport(styleName: string | string[]): boolean;
export function isStyleSupport(styleName: string, styleValue: unknown): boolean;
export function isStyleSupport(styleName: string | string[], styleValue?: unknown): boolean {
  if (!Array.isArray(styleName) && styleValue !== undefined) {
    return isStyleValueSupport(styleName, styleValue);
  }
  return isStyleNameSupport(styleName);
}
