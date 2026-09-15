/**
 * `isVisible` —— 元素是否在页面上可见。
 *
 * 契约来源：`@rc-component/util/Dom/isVisible`。
 *
 * 三级判定，任一成立即视为可见：
 *   1. `offsetParent` 存在 —— 最快的路径，覆盖绝大多数"在文档流里且未被隐藏"的情况
 *   2. `getBBox()` 有宽或高 —— SVG 元素没有 `offsetParent`，走这条
 *   3. `getBoundingClientRect()` 有宽或高 —— 定位元素（`position: fixed`）没有 `offsetParent`，走这条
 *
 * 注意判的是 `width || height` 而非 `width && height`：
 * 一条 1px 高的分隔线也是"可见"的。浮层定位依赖这个宽松判定。
 */
export default function isVisible(element: Element | null | undefined): boolean {
  if (!element) {
    return false;
  }

  if (typeof Element !== 'undefined' && element instanceof Element) {
    if ((element as HTMLElement).offsetParent) {
      return true;
    }

    const getBBox = (element as SVGGraphicsElement).getBBox;
    if (getBBox) {
      const { width, height } = getBBox.call(element);
      if (width || height) {
        return true;
      }
    }

    if (element.getBoundingClientRect) {
      const { width, height } = element.getBoundingClientRect();
      if (width || height) {
        return true;
      }
    }
  }

  return false;
}
