/**
 * `@rc-component/table@1.11.1` 的 `es/utils/offsetUtil.js`（13 行）—— 本仓等价物。
 *
 * 上游先用 `getDOM(node)` 把 ref/元素归一成 DOM 再量；本仓的调用点拿到的一律是
 * `HTMLElement`（Vue 的模板 ref 不会像 React 的 `ref` 那样可能是组件实例）
 * ⇒ 这里只保留量测部分。**行为逐字相同**。
 *
 * ⚠️ 这是「**表格相对页面**」的偏移（`stickyScrollBar` 的可见性判断要用），
 *    不是相对父元素 —— `getBoundingClientRect()` + 页面滚动量。
 */

export interface PageOffset {
  left: number;
  top: number;
}

/** 元素相对**页面**的偏移（含滚动量，减掉 `documentElement` 的 border）。 */
export function getOffset(element: HTMLElement): PageOffset {
  const box = element.getBoundingClientRect();
  const docElem = document.documentElement;

  return {
    left:
      box.left +
      (window.pageXOffset || docElem.scrollLeft) -
      (docElem.clientLeft || document.body.clientLeft || 0),
    top:
      box.top +
      (window.pageYOffset || docElem.scrollTop) -
      (docElem.clientTop || document.body.clientTop || 0),
  };
}
