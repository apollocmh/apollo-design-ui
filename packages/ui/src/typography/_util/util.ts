/**
 * `Base` 家族的小工具。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Base/util.js`（**逐条对齐**）。
 * 三个函数各被两处以上消费：`toCopyConfigList` / `getNode` 服务于 `CopyBtn` 的
 * 「图标与提示都可以是 `[未复制, 已复制]` 二元组」，`isEleEllipsis` 服务于
 * 「原生 CSS 省略号是否真的截断了」的测量。
 */

import { toList } from '@apollo-design/utils';
import type { VNodeChild } from 'vue';

/**
 * `copyable.icon` / `copyable.tooltips` 的取值。
 *
 * ⚠️ `false` 是**独立分支**：antd 的 `toCopyConfigList` 先判 `val === false` 再走
 *    `toList`。少了这一步，`false` 会被包成 `[false]`，`[1]` 位置变成 `undefined`，
 *    而 `getNode(undefined, default, true)` 会退回默认图标 —— 也就是说
 *    `icon: false` 的「显式不渲染」语义会**静默失效**。
 */
export type CopyConfigListNode = VNodeChild | [VNodeChild, VNodeChild];

/** 与 antd 的 `toCopyConfigList` 逐字对应。 */
export function toCopyConfigList(val: CopyConfigListNode | undefined): [VNodeChild, VNodeChild] {
  if (val === false) {
    return [false, false];
  }
  const list = toList(val as VNodeChild);
  return [list[0], list[1]];
}

/**
 * 与 antd 的 `getNode` 逐字对应：
 *
 * ```
 * dom === true || dom === undefined → defaultNode
 * 否则                              → dom || (needDom && defaultNode)
 * ```
 *
 * ⚠️ 两个必须保留的细节：
 *   1. **`undefined` 走默认分支，`false` / `null` 不走**。`needDom` 为假时
 *      `icon: false` 渲染出 `false`（即「什么都不画」），而不是默认图标。
 *   2. 返回值可能是 `false` / `''` / `0` —— 它们是合法的 `VNodeChild`，
 *      调用方不能再做一次真值判断，否则「显式关闭」与「未传」又混在一起了。
 */
export function getNode(
  dom: VNodeChild | boolean | undefined,
  defaultNode: VNodeChild,
  needDom?: boolean,
): VNodeChild {
  if (dom === true || dom === undefined) {
    return defaultNode;
  }
  return dom || (needDom && defaultNode);
}

/**
 * 「这个元素的原生省略号是不是真的截断了」。
 *
 * 与 antd 的 `isEleEllipsis` 逐字对应：往元素里塞一个空的 `<em>`，比较它与元素
 * 自身的外接矩形 —— 只要子元素越界（任一方向），就说明内容被截断。
 *
 * ⚠️ 这是**读布局**的操作（`getBoundingClientRect` 会强制 reflow），所以只在
 *    「需要原生省略号提示」且「用户正在悬浮」时才调用（见 `Base.ts` 的
 *    `measureNativeEllipsis`）。
 *
 * ⚠️ 开发期给 `<em>` 加的类名是**契约的一部分** —— 上游的测试用它定位这个临时元素。
 *    antd 把前缀**写死**成 `ant`（`ant-typography-css-ellipsis-content-measure`），
 *    而本项目的默认前缀是 `apollo`（`prefix-cls-default` 裁决 A），所以这里取
 *    `prefixCls` 而不是写死。仅开发期可见，登记为 D-typography-7（PLATFORM）。
 */
export function isEleEllipsis(ele: HTMLElement, prefixCls: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  // 建一个临时元素量尺寸
  const childDiv = document.createElement('em');
  ele.appendChild(childDiv);

  if (process.env.NODE_ENV !== 'production') {
    childDiv.className = `${prefixCls}-css-ellipsis-content-measure`;
  }

  const rect = ele.getBoundingClientRect();
  const childRect = childDiv.getBoundingClientRect();

  // 复位
  ele.removeChild(childDiv);

  // 越界判定：横向 + 纵向
  return (
    rect.left > childRect.left ||
    childRect.right > rect.right ||
    rect.top > childRect.top ||
    childRect.bottom > rect.bottom
  );
}
