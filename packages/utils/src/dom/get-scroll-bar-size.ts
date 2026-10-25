/**
 * 滚动条尺寸与「body 是否在滚动」—— `@rc-component/util` 的 `getScrollBarSize.js`
 * + `@rc-component/portal` 的 `util.js:isBodyOverflowing`。
 *
 * 契约来源：`@rc-component/util@1.13.0` `es/getScrollBarSize.js`、
 * `@rc-component/portal@2.2.1` `es/util.js`。
 * 消费方：`@apollo-design/portal` 的 `useScrollLocker`。
 *
 * ⚠️ 与上游的两处有意差异（INTENDED）：
 *   1. 上游测量时会 `getComputedStyle(ele)` 并**克隆**目标元素的 scrollbar 样式
 *      （含 `::-webkit-scrollbar` 的宽高）再 `updateCSS` 一段临时样式，并在 CSP 失败时
 *      回退到解析出的数值 —— 本仓只做「目标元素不参与测量」的**基础测量**
 *      （100×100 + overflow:scroll 的探针元素）。对默认主题（滚动条由浏览器决定）
 *      结果一致；对「自定义了滚动条宽度」的站点会与上游有差。
 *      这条差异**登记在 COMPATIBILITY**，且 `useScrollLocker` 只在
 *      `isBodyOverflowing()` 为真时才用到它（那时才是真的需要补回滚动条宽度）。
 *   2. 上游的 `getScrollBarSize(fresh)` 有模块级缓存；本仓只提供 `getTargetScrollBarSize`
 *      （每次实测）—— 上游 `useScrollLocker` 用的正是后者。
 */

/** 探针元素的 id 前缀（与上游同形，便于对照）。 */
const MEASURE_PREFIX = 'apollo-scrollbar-measure';

function measureScrollbarSize(doc: Document): { width: number; height: number } {
  if (!doc.body) return { width: 0, height: 0 };

  const id = `${MEASURE_PREFIX}-${Math.random().toString(36).slice(7)}`;
  const measureEle = doc.createElement('div');
  measureEle.id = id;

  const style = measureEle.style;
  style.position = 'absolute';
  style.left = '0';
  style.top = '0';
  style.width = '100px';
  style.height = '100px';
  style.overflow = 'scroll';

  doc.body.appendChild(measureEle);
  const width = measureEle.offsetWidth - measureEle.clientWidth;
  const height = measureEle.offsetHeight - measureEle.clientHeight;
  doc.body.removeChild(measureEle);

  return { width, height };
}

function isElement(target: unknown): target is Element {
  return (
    !!target &&
    typeof target === 'object' &&
    'nodeType' in target &&
    target.nodeType === 1 &&
    'ownerDocument' in target &&
    !!target.ownerDocument &&
    'getAttribute' in target &&
    typeof target.getAttribute === 'function'
  );
}
/** Measure in the target's own document, including native foreign-realm elements. */
export function getTargetScrollBarSize(target?: unknown): { width: number; height: number } {
  if (!isElement(target)) {
    return { width: 0, height: 0 };
  }
  return measureScrollbarSize(target.ownerDocument);
}

/** Body overflow in the requested document; omitted/null is current document/SSR-safe false. */
export function isBodyOverflowing(
  doc: Document | null = typeof document === 'undefined' ? null : document,
): boolean {
  const view = doc?.defaultView;
  if (!doc?.body || !view) return false;
  return (
    doc.body.scrollHeight > (view.innerHeight || doc.documentElement.clientHeight) &&
    view.innerWidth > doc.body.offsetWidth
  );
}
