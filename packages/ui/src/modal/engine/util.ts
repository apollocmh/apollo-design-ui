/**
 * dialog 内核的工具 —— `@rc-component/dialog@1.10.0` `es/util.js` 的 Vue 版。
 *
 * | rc 侧 | 本仓 |
 * |---|---|
 * | `getMotionName` | 同名（`transitionName` 优先，否则 `{p}-{animationName}`） |
 * | `offset` | 同名（`getBoundingClientRect` + 页面滚动偏移） |
 */

/** `getMotionName(prefixCls, transitionName, animationName)` —— 上游逐字。 */
export function getMotionName(
  prefixCls: string,
  transitionName?: string,
  animationName?: string,
): string | undefined {
  let motionName = transitionName;
  if (!motionName && animationName) {
    motionName = `${prefixCls}-${animationName}`;
  }
  return motionName;
}

/** 取窗口在某个轴上的滚动偏移（`pageXOffset` 优先，退到 `documentElement` / `body`）。 */
function getScroll(win: Window & typeof globalThis, top?: boolean): number {
  const w = win as unknown as Record<string, unknown>;
  let ret = w[`page${top ? 'Y' : 'X'}Offset`];
  const method = `scroll${top ? 'Top' : 'Left'}`;

  if (typeof ret !== 'number') {
    const doc = win.document as unknown as Record<string, unknown>;
    const documentElement = doc.documentElement as unknown as Record<string, unknown>;
    ret = documentElement[method];
    if (typeof ret !== 'number') {
      const body = doc.body as unknown as Record<string, unknown>;
      ret = body[method];
    }
  }

  return typeof ret === 'number' ? ret : 0;
}

/**
 * 元素相对**页面**（不是视口）的左上角。
 *
 * ⚠️ 用途只有一个：算 zoom 动效的 `transformOrigin`
 * （`mousePosition - offset(panel)`）。⚠️ 别用它做定位。
 */
export function offset(el: HTMLElement): { left: number; top: number } {
  const rect = el.getBoundingClientRect();
  const pos = { left: rect.left, top: rect.top };
  const doc = el.ownerDocument;
  const win = (doc.defaultView ?? null) as (Window & typeof globalThis) | null;

  if (win) {
    pos.left += getScroll(win);
    pos.top += getScroll(win, true);
  }

  return pos;
}

export { toCssSize } from '../../_internal/to-css-size';

/**
 * `clsx` 的最小实现（引擎内共用）。
 *
 * ⚠️ 仓库没有全局的 `clsx`（`drawer/engine/DrawerPopup.ts` 里各有一份）。
 *    这里放在 util 里让 5 个引擎文件共用一份，避免出现第 3、4 份拷贝。
 */
export function clsx(
  ...args: Array<string | false | null | undefined | Record<string, unknown>>
): string {
  const out: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') out.push(arg);
    else {
      for (const [key, value] of Object.entries(arg)) if (value) out.push(key);
    }
  }
  return out.join(' ');
}
