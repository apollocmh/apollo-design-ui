/**
 * roving tabindex —— 「一组控件只占一个 Tab 停靠点，组内用方向键移动」。
 *
 * 契约来源：`@rc-component/menu@1.5.0/es/hooks/useAccessibility.js:113-138`
 * （`getNextFocusElement` 的环绕算术）与 `:216-221`（HOME / END）。
 *
 * ⚠️ 只有**索引算术**是可移植的。上游 `getOffset(mode, isRootLevel, isRtl, which)`
 * 那六张 inline / horizontal / vertical × root / sub 分派表是 **Menu 的私有语义**，
 * 不属于通用原语 —— 调用方自己决定「哪个键对应哪个 offset」。
 *
 * 本文件是纯函数：不涉及 DOM，可以在 L1 里穷举。
 */

/** 没有可聚焦项时的哨兵。与 `Array.prototype.findIndex` 的约定一致。 */
export const NO_ACTIVE_INDEX = -1;

/**
 * 环绕地取下一个下标。
 *
 * 逐行对应 `useAccessibility.js:126-137`：
 * ```js
 * if (offset < 0) {
 *   if (focusIndex === -1) focusIndex = count - 1;   // 没有当前项 ⇒ 从尾开始
 *   else focusIndex -= 1;
 * } else if (offset > 0) {
 *   focusIndex += 1;                                  // 没有当前项 ⇒ -1+1 = 0，从头开始
 * }
 * focusIndex = (focusIndex + count) % count;
 * ```
 *
 * 两条容易写反的语义：
 *   - `offset > 0` 且 `focusIndex === -1` ⇒ 得到 `0`（**从头**）
 *   - `offset < 0` 且 `focusIndex === -1` ⇒ 得到 `count - 1`（**从尾**）
 *
 * @param focusIndex 当前下标；`-1` 表示「还没有当前项」
 * @param offset     `> 0` 向后、`< 0` 向前、`0` 原地
 * @param count      总项数
 * @returns 下一个下标；`count <= 0` 时返回 `NO_ACTIVE_INDEX`
 *
 * ⚠️ 与上游的一处**有意**差异：`count <= 0` 时上游会算出 `NaN`（`(x + 0) % 0`），
 *    然后 `list[NaN]` 得到 `undefined`。我们返回 `-1` —— 对调用方而言同样是「没有目标」，
 *    但 `-1` 是可用下标哨兵，不会把 NaN 带进后续算术。见契约文档 §6。
 */
export function nextRovingIndex(focusIndex: number, offset: number, count: number): number {
  if (count <= 0) {
    return NO_ACTIVE_INDEX;
  }

  let index = focusIndex;
  if (offset < 0) {
    if (index === NO_ACTIVE_INDEX) {
      index = count - 1;
    } else {
      index -= 1;
    }
  } else if (offset > 0) {
    index += 1;
  }

  return (index + count) % count;
}

/** `HOME` —— 跳到第一项（`useAccessibility.js:217`）。 */
export function resolveRovingHome(count: number): number {
  return count > 0 ? 0 : NO_ACTIVE_INDEX;
}

/** `END` —— 跳到最后一项（`useAccessibility.js:219`）。 */
export function resolveRovingEnd(count: number): number {
  return count > 0 ? count - 1 : NO_ACTIVE_INDEX;
}

/**
 * 单个项的 `tabindex`：只有「当前项」是 0，其余全 -1。
 *
 * 这就是 roving 的全部形态语义 —— 整组在 Tab 序列里只占一个停靠点。
 */
export function getRovingTabIndex(activeIndex: number, itemIndex: number): 0 | -1 {
  return activeIndex === itemIndex ? 0 : -1;
}

/**
 * 同 `nextRovingIndex`，但可以关掉环绕。
 *
 * ⚠️ **上游没有这个函数** —— rc-menu 永远环绕。这是给「不循环」的控件
 * （例如某些 Toolbar / Segmented 的语义）留的口子，默认仍是环绕。
 *
 * 不循环时：
 *   - 已经到头 ⇒ 停在原地（`clamp`）
 *   - 还没有当前项 ⇒ 向后取第 0 项、向前取最后一项（与环绕版一致）
 */
export function moveRovingIndex(
  current: number,
  offset: number,
  count: number,
  loop = true,
): number {
  if (count <= 0) {
    return NO_ACTIVE_INDEX;
  }
  if (loop) {
    return nextRovingIndex(current, offset, count);
  }

  // -1 起头时把 base 推到「刚好在边界外」，于是 +offset 后自然落在首/尾
  const base = current === NO_ACTIVE_INDEX ? (offset > 0 ? -1 : count) : current;
  return Math.min(Math.max(base + offset, 0), count - 1);
}

/** 方向键的解释方式。 */
export type RovingOrientation = 'vertical' | 'horizontal' | 'both';

/**
 * 把方向键翻译成 offset。
 *
 * ⚠️ **这不是 rc-menu 的分派表**。上游的 `getOffset(mode, isRootLevel, isRtl, which)`
 * 里 `vertical` 的 LEFT/RIGHT 映射的是「父/子菜单」（层级跳转），不是「前一项/后一项」——
 * 那是 Menu 私有的层级语义（§3.6），不属于通用原语。
 *
 * 这里用的是 **APG（ARIA Authoring Practices）的通用映射**：
 *   - `vertical`：Up/Down 移动，Left/Right 不管
 *   - `horizontal`：Left/Right 移动，Up/Down 不管
 *   - `both`：四个方向都移动
 *   - RTL 时 Left/Right 互换
 *
 * @returns offset；该键在此方向下不参与导航时返回 `null`
 */
export function getRovingOffset(
  orientation: RovingOrientation,
  rtl: boolean,
  key: string,
): number | null {
  switch (key) {
    case 'ArrowDown':
      return orientation === 'horizontal' ? null : 1;
    case 'ArrowUp':
      return orientation === 'horizontal' ? null : -1;
    case 'ArrowRight':
      return orientation === 'vertical' ? null : rtl ? -1 : 1;
    case 'ArrowLeft':
      return orientation === 'vertical' ? null : rtl ? 1 : -1;
    default:
      return null;
  }
}
