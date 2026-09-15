/**
 * `getScroll` —— 取目标在垂直方向的滚动量。
 *
 * 契约来源：antd `es/_util/getScroll.js`（antd 自己的 `_util`，不是 rc-util）。
 *
 * 支持四类目标：`window` / `document` / `HTMLElement` / 类形状对象。
 * 最后一类是**为测试保留**的：测试常传 `{ documentElement: { scrollTop: 400 } }`
 * 这种假对象来避开真实布局。原实现的注释明确说明了这一点，所以不能"清理"掉这个分支。
 *
 * ⚠️ 返回类型可能是 `undefined`（目标既不是上述四类、又没有 `ownerDocument` 时）。
 *    调用方需自行兜底，不要假设一定是数字。
 */

import { isDocument, isHTMLElement, isNumber, isWindow } from '../is';

export type ScrollTarget =
  | Window
  | Document
  | HTMLElement
  | { scrollTop?: number }
  | null
  | undefined;

export default function getScroll(target: ScrollTarget): number | undefined {
  if (typeof window === 'undefined') {
    return 0;
  }

  let result: number | undefined = 0;

  if (isWindow(target)) {
    result = target.pageYOffset;
  } else if (isDocument(target)) {
    result = target.documentElement.scrollTop;
  } else if (isHTMLElement(target)) {
    result = target.scrollTop;
  } else if (target) {
    // 测试用的类形状对象
    result = (target as { scrollTop?: number }).scrollTop;
  }

  if (target && !isWindow(target) && !isNumber(result)) {
    const owner = (target as { ownerDocument?: Document }).ownerDocument ?? (target as Document);
    result = owner?.documentElement?.scrollTop;
  }

  return result;
}
