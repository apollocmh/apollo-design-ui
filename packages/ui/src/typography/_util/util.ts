/** Configuration-node helpers originally referenced antd6.6.4 Base/util. */
import type { VNodeChild } from 'vue';

export type CopyConfigListNode = VNodeChild | [VNodeChild, VNodeChild];
/** Exactly two entries select the two states; other arrays are complete VNode content. */
export function toCopyConfigList(value: CopyConfigListNode | undefined): [VNodeChild, VNodeChild] {
  if (value === false) return [false, false];
  if (Array.isArray(value) && value.length === 2) return [value[0], value[1]];
  return [value, undefined];
}
export function getNode(
  value: VNodeChild | undefined,
  fallback: VNodeChild,
  required?: boolean,
): VNodeChild {
  if (value === true || value === undefined) return fallback;
  if (
    required &&
    (value === null ||
      value === false ||
      value === '' ||
      (Array.isArray(value) && value.length === 0))
  )
    return fallback;
  return value;
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
