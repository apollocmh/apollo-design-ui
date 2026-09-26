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

function measureScrollbarSize(): { width: number; height: number } {
  if (typeof document === 'undefined') return { width: 0, height: 0 };

  const id = `${MEASURE_PREFIX}-${Math.random().toString(36).slice(7)}`;
  const measureEle = document.createElement('div');
  measureEle.id = id;

  const style = measureEle.style;
  style.position = 'absolute';
  style.left = '0';
  style.top = '0';
  style.width = '100px';
  style.height = '100px';
  style.overflow = 'scroll';

  document.body.appendChild(measureEle);
  const width = measureEle.offsetWidth - measureEle.clientWidth;
  const height = measureEle.offsetHeight - measureEle.clientHeight;
  document.body.removeChild(measureEle);

  return { width, height };
}

/** 实测滚动条尺寸（⚠️ 非元素目标或 SSR 下返回 `{0, 0}` —— 与上游同判）。 */
export function getTargetScrollBarSize(target?: unknown): { width: number; height: number } {
  if (typeof document === 'undefined' || !target || !(target instanceof Element)) {
    return { width: 0, height: 0 };
  }
  return measureScrollbarSize();
}

/** body 是否「纵向溢出且出现了纵向滚动条」（上游逐字）。 */
export function isBodyOverflowing(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  return (
    document.body.scrollHeight > (window.innerHeight || document.documentElement.clientHeight) &&
    window.innerWidth > document.body.offsetWidth
  );
}
