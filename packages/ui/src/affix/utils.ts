/**
 * Affix 的定位判据 —— **逐行移植**自 antd 6.6.4 的
 * `es/affix/utils.js`（3 个纯函数，无副作用，全部可单测）。
 *
 * ⚠️ 这些函数是**判据本体**：`Affix.vue` 只是「测量 → 喂进来 → 应用结果」。
 *    所以单测把这三个函数钉死，组件的行为就有了一半的把握。
 *
 * ⚠️ 移植时保留了两处**反直觉**的细节（见各函数注释）：
 *    1. `Math.round` **只参与比较**，不参与结果计算
 *    2. `getFixedBottom` 用的是 `window.innerHeight`（不是 target 的高度）
 */

/** 矩形快照。与 DOM 的 `DOMRect` 的 `top/bottom/height/width` 字段子集对齐。 */
export interface AffixRect {
  top: number;
  bottom: number;
  /** window 分支没有这两个字段（antd 原样，判据也只读 top/bottom）。 */
  height?: number;
  width?: number;
  left?: number;
}

/** `Affix.vue` 写入 Vue inline style 的位置会是 `"80px"`，不是 React 的数值 `80`。 */
export function hasSameFixedPosition(
  style: { top?: string | number; bottom?: string | number } | undefined,
  fixedTop: number | undefined,
  fixedBottom: number | undefined,
): boolean {
  const matches = (current: string | number | undefined, next: number | undefined): boolean =>
    next !== undefined && (current === next || current === `${next}px`);

  return matches(style?.top, fixedTop) || matches(style?.bottom, fixedBottom);
}

/**
 * 目标容器的矩形。
 *
 * `window`（或任何没有 `getBoundingClientRect` 的对象）⇒ 返回
 * `{ top: 0, bottom: window.innerHeight }` —— **没有** `height/width` 字段
 * （antd 原样如此，`getFixedTop` 只读 `top`、`getFixedBottom` 只读 `bottom`）。
 */
export function getTargetRect(target: Window | HTMLElement | null): AffixRect {
  if (target && typeof (target as HTMLElement).getBoundingClientRect === 'function') {
    return (target as HTMLElement).getBoundingClientRect();
  }
  return {
    top: 0,
    bottom: typeof window !== 'undefined' ? window.innerHeight : 0,
  };
}

/**
 * 「应该固在顶部」的判据。
 *
 * ⚠️ **`Math.round` 只参与比较**：两边都 round 过再比，**消除亚像素抖动**
 *    （滚动时 `getBoundingClientRect()` 会给出 `123.4` 这类值，不 round 会导致
 *    固钉状态在相邻两帧之间反复翻转）。**返回值用原始值算**，不 round。
 *
 * @returns 固定后的 `top` 值（像素），不满足条件时 `undefined`
 *          —— **`undefined` 是「不该固钉」的信号**，调用方据此分支。
 */
export function getFixedTop(
  placeholderRect: AffixRect,
  targetRect: AffixRect,
  offsetTop: number | undefined,
): number | undefined {
  if (
    offsetTop !== undefined &&
    Math.round(targetRect.top) > Math.round(placeholderRect.top) - offsetTop
  ) {
    return offsetTop + targetRect.top;
  }
  return undefined;
}

/**
 * 「应该固在底部」的判据。
 *
 * ⚠️ **用的是 `window.innerHeight`，不是 target 的高度**：
 *    `targetBottomOffset = window.innerHeight - targetRect.bottom` 是
 *    「target 底边到视口底边的距离」。当 target 就是 window 时它恒为 0，
 *    于是结果就是 `offsetBottom`；当 target 是某个滚动容器时，
 *    钉在「容器可视区底部」⇒ 需要 offset 加上容器底边到视口底边的距离。
 *    （这就是为什么不能用 `targetRect.height` —— 那是容器的总高，不是可视高。）
 *
 * @returns 固定后的 `bottom` 值（像素），不满足条件时 `undefined`
 */
export function getFixedBottom(
  placeholderRect: AffixRect,
  targetRect: AffixRect,
  offsetBottom: number | undefined,
): number | undefined {
  if (
    offsetBottom !== undefined &&
    Math.round(targetRect.bottom) < Math.round(placeholderRect.bottom) + offsetBottom
  ) {
    const targetBottomOffset =
      typeof window !== 'undefined' ? window.innerHeight - targetRect.bottom : 0;
    return offsetBottom + targetBottomOffset;
  }
  return undefined;
}
