/**
 * DOM 测量层 —— `position` 包的另一半。
 *
 * 几何内核（`align.ts`）是纯函数：给它矩形与区域，它给出位移。
 * 但「矩形与区域从哪来」这件事无法纯函数化 —— 它必须问 DOM。本模块就是那一次问询。
 *
 * 为什么这一层**必须**留在 `position` 而不是 `overlay`：
 *   `dependencies.json` 的 `purpose` 写的是「纯几何 **+ 尺寸测量**」，
 *   `ARCHITECTURE.md` §9.1 明确写着「别把 DOM 测量外壳误派给 overlay」。
 *   ⚠️ `src/index.ts` 与 `src/types.ts` 的旧头部注释说「测量由 overlay 完成后传入」，
 *   与该契约冲突 —— 已随本次实现改正。
 *
 * 设计原则与几何内核一致：**能纯函数化的部分一律纯函数化**，
 * DOM 侧只做「取值 + 临时改写 + 还原」这一件不可测的事。
 * 于是 §「纯数据侧」的所有函数都可以被穷举测试，而副作用集中在 `measureAlign` 一处。
 *
 * 初期公式参考 `@rc-component/trigger@3.10.1` 的 `useAlign.js` / `util.js`。
 * 已交付纯几何与 Oracle 保留；DOM 侧按当前所属文档、CSS 盒模型及恢复契约工作。
 * 当前约定和带日期的历史证据见 `docs/foundation/position-contract.md`。
 */

import { isDocument, isHTMLElement, isShadowRoot, isVisible } from '@apollo-design/utils';

import { clipArea } from './area';
import type { Area, Rect } from './types';

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/**
 * 最小矩形投影。
 *
 * `x/left` 与 `y/top` 两组都存在是因为 antd 有 `rect.x = rect.x ?? rect.left` 的
 * 兼容分支：老浏览器（与部分 DOMRect polyfill）只提供 `left/top`。
 * 这里把兼容逻辑收进 `toRect`，而不是散落在每个测量点。
 */
export interface RectLike {
  x?: number;
  y?: number;
  left?: number;
  top?: number;
  width: number;
  height: number;
}

/** `htmlRegion` 的合法取值。antd 里其余任何值（含 `undefined`）都降级为 `'visible'`。 */
export type HtmlRegion = 'visible' | 'scroll' | 'visibleFirst';

/** target 的两种形态：元素（对齐到它）或坐标点（右键菜单这类场景）。 */
export type MeasureTarget = Element | readonly [number, number];

export interface MeasureInput {
  /** 浮层元素。会被临时改写 inline style，结束时**一定**还原。 */
  popupEle: HTMLElement;
  target: MeasureTarget;
  htmlRegion?: HtmlRegion;
  /**
   * 复用已收集的滚动容器。
   *
   * 缺省每次读取当前组合祖先树。复用列表的调用者负责在祖先/容器改变后重采；
   * 列表内每个元素的当前 computed overflow 仍会按轴重新读取。
   */
  scrollers?: readonly HTMLElement[];
}

export interface MeasureResult {
  /** 目标矩形（已减 `targetOffset` 之前 —— 那是几何内核的事） */
  target: Rect;
  /** 浮层矩形，测得于「left/top 归零」之后 —— 见 `docs/.../position-contract.md` §3.1 */
  popup: Rect;
  /** 镜像矩形，测得于「right/bottom 归零」之后。仅用于 `offsetR` / `offsetB`。 */
  mirror: Rect;
  scaleX: number;
  scaleY: number;
  /** 几何计算用的区域（由 `htmlRegion` 选定） */
  visible: Area;
  /** 翻转判定用的区域。`htmlRegion='visibleFirst'` 时与 `visible` 不同。 */
  check: Area;
}

export interface ScaleResult {
  scaleX: number;
  scaleY: number;
}

// ---------------------------------------------------------------------------
// 纯数据侧 —— 可穷举测试，不碰 DOM
// ---------------------------------------------------------------------------

/**
 * antd 的 `toNum`：NaN → 兜底值。
 *
 * 这个兜底**不是防御性编程，是 jsdom 下唯一能让测量跑通的路径**：
 * jsdom 没有布局引擎，`offsetWidth` 恒为 0，于是
 * `rect.width / offsetWidth` = `0 / 0` = NaN，再经这里变回 1（无缩放）。
 */
export function toSafeNum(value: number, fallback = 1): number {
  return Number.isNaN(value) ? fallback : value;
}

/** `parseFloat` 的 NaN → 0 版本。用于 border-width 这类「缺省即 0」的量。 */
export function pxValue(value: string | undefined): number {
  return toSafeNum(Number.parseFloat(value ?? ''), 0);
}

/**
 * `htmlRegion` 归一化。
 *
 * antd（`useAlign.js` 185–193）只保留 `'scroll'` 与 `'visibleFirst'`，
 * 其余（含 `undefined`、拼错的串）**一律**降级为 `'visible'`。
 * 这是白名单而不是黑名单，反向抄成「非 visible 即 scroll」会改变默认行为。
 */
export function normalizeHtmlRegion(value: string | undefined): HtmlRegion {
  return value === 'scroll' || value === 'visibleFirst' ? value : 'visible';
}

/** 数组态 target → 0×0 矩形（`useAlign.js` 134–140）。 */
export function pointRect(x: number, y: number): Rect {
  return { x, y, width: 0, height: 0 };
}

/** DOMRect → Rect，含 `x ?? left` 兼容。 */
export function toRect(rect: RectLike): Rect {
  return {
    x: rect.x ?? rect.left ?? 0,
    y: rect.y ?? rect.top ?? 0,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * `scale === 1` 才取整（antd `useAlign.js` 483–490）。
 *
 * 有缩放时取整会把误差按 1/scale 放大 —— 这也是为什么必须在**除以 scale 之前**取整：
 * antd 的顺序是「先 `Math.floor(nextOffsetX)`，再 `/ scaleX`」。
 * `align.ts` 的 309–316 行已按此实现。
 */
export function scaleFloor(value: number, scale: number): number {
  return scale === 1 ? Math.floor(value) : value;
}

/**
 * 由镜像矩形反解「浮层右缘到**容器**右缘的距离」（antd `useAlign.js` 481）。
 *
 * 与 `offsetX` 的差别：这个量是给 `dynamicInset` 走 `right` 定位用的
 * （见 `useOffsetStyle.js` 19–32），而 `offsetX` 走 `left`。
 */
export function mirrorOffsetR(mirror: Rect, popup: Rect, offsetX: number): number {
  return mirror.x + mirror.width - popup.x - (offsetX + popup.width);
}

/** `mirrorOffsetR` 的 Y 轴版本（antd `useAlign.js` 482）。 */
export function mirrorOffsetB(mirror: Rect, popup: Rect, offsetY: number): number {
  return mirror.y + mirror.height - popup.y - (offsetY + popup.height);
}

/**
 * 早退判定（antd `useAlign.js` 224）。
 *
 * 抽成纯函数是为了让「早退」这条分支能被穷举 —— 在 jsdom 里
 * `isVisible` 恒为 false（无布局引擎），真实早退路径**测不到**，
 * 只能靠这个纯函数保证条件本身是对的。
 *
 * @param targetVisible 非元素形态的 target（坐标点）恒为 `true`
 */
export function shouldMeasure(scaleX: number, scaleY: number, targetVisible: boolean): boolean {
  return scaleX !== 0 && scaleY !== 0 && targetVisible;
}

// ---------------------------------------------------------------------------
// DOM 侧 —— 只做取值
// ---------------------------------------------------------------------------

/**
 * 取元素所属窗口（antd `util.js` 21–23）。
 *
 * 刻意不用全局 `window`：浮层可能挂在 iframe 的文档里。
 * 所属 Document 没有 defaultView 时返回 null；普通 detached 元素仍保留其所属窗口。
 */
export function getWin(node: Node): Window | null {
  return isDocument(node) ? node.defaultView : (node.ownerDocument?.defaultView ?? null);
}

/** computed style 的 overflow 中哪些值表示「会裁剪可视区」（antd `util.js` 33）。 */
const SCROLL_STYLES: readonly string[] = ['hidden', 'scroll', 'clip', 'auto'];

/**
 * 自内向外收集会裁剪可视区的祖先（antd `util.js` 30–46）。
 *
 * 从组合父节点起，不含自身；沿 assignedSlot 和 ShadowRoot.host 继续。
 * ⚠️ 必须读**计算值**而不是 inline style：CSS 规范里 `overflow-x: hidden`
 *    会把 `overflow-y: visible` 计算成 `auto`，这个组合理应被收进来，
 *    读 inline style 会漏掉它。
 *
 * @returns 自内向外的滚动容器列表
 */
function parentElement(element: Element): HTMLElement | null {
  if (element.assignedSlot) return element.assignedSlot;
  if (element.parentElement) return element.parentElement;
  const root = element.getRootNode();
  return isShadowRoot(root) && isHTMLElement(root.host) ? root.host : null;
}

export function collectScroller(ele: Element): HTMLElement[] {
  const list: HTMLElement[] = [];
  let current = parentElement(ele);

  while (current) {
    const win = getWin(current);
    if (win) {
      const { overflowX, overflowY, overflow } = win.getComputedStyle(current);
      // antd 是 `[overflowX, overflowY, overflow].some(o => scrollStyle.includes(o))`
      if (
        SCROLL_STYLES.includes(overflowX) ||
        SCROLL_STYLES.includes(overflowY) ||
        SCROLL_STYLES.includes(overflow)
      ) {
        list.push(current);
      }
    }
    current = parentElement(current);
  }

  return list;
}

/**
 * 用滚动容器逐级裁剪区域（antd `util.js` 75–137）。
 *
 * 与 `clipArea` 的分工：**本函数负责 DOM 侧采集**（把一个元素换算成一个裁剪矩形），
 * 交集运算仍走已有的 `clipArea` 纯函数 —— 不重写，避免两份实现各自漂移（T2）。
 *
 * ⚠️ 逐项公式见 `docs/foundation/position-contract.md` §3.2。两处易错点：
 *    · `eleRight` 从 `eleLeft` 起算，不是从 `eleRect.x` —— 否则丢掉左边框与 clip margin
 *    · 滚动条尺寸是「先减边框，再乘 scale」，顺序反了会多扣
 */
/** The owning document's shell is already represented by the initial area. */
function isHtmlShell(ele: Element): boolean {
  const doc = ele.ownerDocument;
  return ele === doc.body || ele === doc.documentElement;
}

export function getVisibleArea(initArea: Area, scrollers: readonly HTMLElement[]): Area {
  const clips: Area[] = [];

  for (const ele of scrollers) {
    if (isHtmlShell(ele)) {
      continue;
    }

    const win = getWin(ele);
    if (!win) continue;

    const style = win.getComputedStyle(ele);
    const overflowX = style.overflowX || style.overflow;
    const overflowY = style.overflowY || style.overflow;
    const clipX = SCROLL_STYLES.includes(overflowX);
    const clipY = SCROLL_STYLES.includes(overflowY);
    if (!clipX && !clipY) continue;
    // Consume the browser's computed visual-box + px length, rather than authored CSS.
    const [clipBox, clipLength] = (style.overflowClipMargin || '').split(/\s+/);
    const clipMargin = pxValue(clipLength ?? clipBox);
    const borderTop = pxValue(style.borderTopWidth);
    const borderBottom = pxValue(style.borderBottomWidth);
    const borderLeft = pxValue(style.borderLeftWidth);
    const borderRight = pxValue(style.borderRightWidth);

    const eleRect = ele.getBoundingClientRect();
    const eleOutWidth = ele.offsetWidth;
    const eleOutHeight = ele.offsetHeight;
    const eleInnerWidth = ele.clientWidth;
    const eleInnerHeight = ele.clientHeight;

    const scaleX = toSafeNum(Math.round((eleRect.width / eleOutWidth) * 1000) / 1000);
    const scaleY = toSafeNum(Math.round((eleRect.height / eleOutHeight) * 1000) / 1000);

    // 滚动条（含边框）占据的尺寸
    const eleScrollWidth = (eleOutWidth - eleInnerWidth - borderLeft - borderRight) * scaleX;
    const eleScrollHeight = (eleOutHeight - eleInnerHeight - borderTop - borderBottom) * scaleY;

    const scaledBorderTop = borderTop * scaleY;
    const scaledBorderBottom = borderBottom * scaleY;
    const scaledBorderLeft = borderLeft * scaleX;
    const scaledBorderRight = borderRight * scaleX;

    // 只有 overflow: clip 才有 clip margin —— 其余取值下它是 0
    const marginLeft =
      overflowX === 'clip'
        ? (clipMargin +
            (clipBox === 'border-box'
              ? borderLeft
              : clipBox === 'content-box'
                ? -pxValue(style.paddingLeft)
                : 0)) *
          scaleX
        : 0;
    const marginRight =
      overflowX === 'clip'
        ? (clipMargin +
            (clipBox === 'border-box'
              ? borderRight
              : clipBox === 'content-box'
                ? -pxValue(style.paddingRight)
                : 0)) *
          scaleX
        : 0;
    const marginTop =
      overflowY === 'clip'
        ? (clipMargin +
            (clipBox === 'border-box'
              ? borderTop
              : clipBox === 'content-box'
                ? -pxValue(style.paddingTop)
                : 0)) *
          scaleY
        : 0;
    const marginBottom =
      overflowY === 'clip'
        ? (clipMargin +
            (clipBox === 'border-box'
              ? borderBottom
              : clipBox === 'content-box'
                ? -pxValue(style.paddingBottom)
                : 0)) *
          scaleY
        : 0;

    const eleLeft = eleRect.x + scaledBorderLeft - marginLeft;
    const eleTop = eleRect.y + scaledBorderTop - marginTop;
    const eleRight =
      eleLeft +
      eleRect.width +
      marginLeft +
      marginRight -
      scaledBorderLeft -
      scaledBorderRight -
      eleScrollWidth;
    const eleBottom =
      eleTop +
      eleRect.height +
      marginTop +
      marginBottom -
      scaledBorderTop -
      scaledBorderBottom -
      eleScrollHeight;

    clips.push({
      left: clipX ? eleLeft : initArea.left,
      top: clipY ? eleTop : initArea.top,
      right: clipX ? eleRight : initArea.right,
      bottom: clipY ? eleBottom : initArea.bottom,
    });
  }

  return clipArea(initArea, clips);
}

/**
 * 视口可视区（antd `useAlign.js` 173–178）。
 *
 * 用 `documentElement` 的 `clientWidth/clientHeight` —— 即**不含**滚动条的可视区，
 * 与「横向滚动条不该算作可放置区域」的意图一致。
 */
export function getViewportArea(doc: Document): Area {
  const { clientWidth, clientHeight } = doc.documentElement;
  return { left: 0, top: 0, right: clientWidth, bottom: clientHeight };
}

/**
 * 文档滚动区（antd `useAlign.js` 179–184）。
 *
 * ⚠️ 原点是 `(-scrollLeft, -scrollTop)` 而不是 0 —— 这是「文档坐标系」，
 * 与视口坐标系差一个滚动量。写错成 0 会让 `htmlRegion='scroll'` 整体错位。
 */
export function getScrollArea(doc: Document): Area {
  const { scrollWidth, scrollHeight, scrollTop, scrollLeft } = doc.documentElement;
  return {
    left: -scrollLeft,
    top: -scrollTop,
    right: scrollWidth - scrollLeft,
    bottom: scrollHeight - scrollTop,
  };
}

/** 元素的视口矩形。 */
export function measureRect(ele: Element): Rect {
  return toRect(ele.getBoundingClientRect());
}

/**
 * CSS `scale` 测量（antd `useAlign.js` 219–221）。
 *
 * 分子是**实测**矩形（`getBoundingClientRect`，受 transform 影响），
 * 分母是 computed width/height 对应的未变换 border-box；content-box 时包含
 * computed padding 与 border。两者之比才是缩放系数，不把装饰尺寸当成缩放。
 *
 * ⚠️ 分母可能是 `auto`（内容撑开的浮层）→ `parseFloat` → NaN → 比值 NaN →
 *    经 `toSafeNum` 兜底为 1。这也是 jsdom 下的常态（见 `toSafeNum` 注释）。
 */
export function measureScale(ele: Element, rect: Rect, win: Window): ScaleResult {
  const style = win.getComputedStyle(ele);
  const contentBox = style.boxSizing !== 'border-box';
  const width =
    Number.parseFloat(style.width) +
    (contentBox
      ? pxValue(style.paddingLeft) +
        pxValue(style.paddingRight) +
        pxValue(style.borderLeftWidth) +
        pxValue(style.borderRightWidth)
      : 0);
  const height =
    Number.parseFloat(style.height) +
    (contentBox
      ? pxValue(style.paddingTop) +
        pxValue(style.paddingBottom) +
        pxValue(style.borderTopWidth) +
        pxValue(style.borderBottomWidth)
      : 0);
  return {
    scaleX: toSafeNum(Math.round((rect.width / width) * 1000) / 1000),
    scaleY: toSafeNum(Math.round((rect.height / height) * 1000) / 1000),
  };
}

// ---------------------------------------------------------------------------
// 测量会话 —— 唯一有副作用的地方
// ---------------------------------------------------------------------------

interface InlineSnapshot {
  style: string | null;
  placeholder: HTMLElement | null;
}

function snapshot(popupEle: HTMLElement): InlineSnapshot {
  return { style: popupEle.getAttribute('style'), placeholder: null };
}

function restore(popupEle: HTMLElement, snap: InlineSnapshot): void {
  // Reset the declaration block before removing an originally absent attribute.
  popupEle.setAttribute('style', snap.style ?? '');
  if (snap.style === null) popupEle.removeAttribute('style');
  // A measurement callback may already have removed/moved this owned node.
  // remove() releases its actual parent without hiding the original error.
  snap.placeholder?.remove();
}

function isPointTarget(target: MeasureTarget): target is readonly [number, number] {
  return Array.isArray(target);
}

/**
 * 一次完整的测量：归零 → 测 → 镜像 → 还原。
 *
 * 对应 antd `onAlign` 的 DOM 侧（94–226 行）。**顺序不可调换**：
 *   1. 插 placeholder     —— 防止 popup 被改成 `left:0` 时父容器塌陷，塌陷会污染后续 rect
 *   2. 归零 left/top      —— 见 `position-contract.md` §3.1，这一步让 `getPopupContainer`
 *                            的容器偏移在减法里自动消掉，是**免换算**的关键
 *   3. 测 target / popup  —— 必须在归零之后
 *   4. 镜像 right/bottom  —— 只为了 offsetR / offsetB
 *   5. 还原 + 移除 placeholder（早退也**必须**还原 —— antd 把还原放在早退之前）
 *
 * ⚠️ 与 antd 的一处**有意**差异：antd 没有 `try/finally`，任一步抛异常就会把
 *    `left:0/right:0/overflow:hidden` 永久留在 inline style 上。这里用 `finally`
 *    包住，保证任何退出路径都还原。正常路径下两者的可观测行为完全一致，
 *    差异只出现在异常路径 —— 而异常路径下 antd 的行为是「把浮层留在错误位置」，
 *    不构成需要复刻的契约。
 *
 * @returns 不可测时 `null`（scale 为 0，或目标是元素但不可见）。
 *          对应 antd 的 `return` —— 此时调用方不应更新浮层位置。
 */
export function measureAlign(input: MeasureInput): MeasureResult | null {
  const { popupEle, target } = input;
  const win = getWin(popupEle);
  if (!win) return null;

  const doc = popupEle.ownerDocument;
  const scrollers = input.scrollers ?? collectScroller(popupEle);
  const htmlRegion = normalizeHtmlRegion(input.htmlRegion);

  // 两个区域**都**要算（antd 194–195 不短路）：visibleFirst 需要同时用到两者
  const viewportClipped = getVisibleArea(getViewportArea(doc), scrollers);
  const scrollClipped = getVisibleArea(getScrollArea(doc), scrollers);
  const visible: Area = htmlRegion === 'visible' ? viewportClipped : scrollClipped;
  const check: Area = htmlRegion === 'visibleFirst' ? viewportClipped : visible;

  const snap = snapshot(popupEle);
  // antd 99–101：position 必须在动 DOM **之前**取，随后由 placeholder 复制。
  const popupPosition = win.getComputedStyle(popupEle).position;
  let result: MeasureResult | null = null;

  try {
    // 1. placeholder 顶住布局。
    //    ⚠️ 顺序照抄 antd（117–123）：**先插入，再读尺寸、再设样式**。
    //    反过来（先设样式再插入）会改变「插入」这一动作发生时的父容器布局，
    //    从而让紧随其后读到的 offsetLeft/offsetTop 与 antd 不一致 ——
    //    flex / grid 容器下插入一个空块级项会推移既有子项，差异是真实可见的。
    const placeholder = doc.createElement('div');
    snap.placeholder = placeholder;
    popupEle.parentNode?.appendChild(placeholder);
    placeholder.style.left = `${popupEle.offsetLeft}px`;
    placeholder.style.top = `${popupEle.offsetTop}px`;
    placeholder.style.position = popupPosition;
    placeholder.style.height = `${popupEle.offsetHeight}px`;
    placeholder.style.width = `${popupEle.offsetWidth}px`;

    // 2 + 3. 归零后测量
    popupEle.style.left = '0';
    popupEle.style.top = '0';
    popupEle.style.right = 'auto';
    popupEle.style.bottom = 'auto';
    popupEle.style.overflow = 'hidden';

    const targetRect: Rect = isPointTarget(target)
      ? pointRect(target[0], target[1])
      : measureRect(target);
    const popupRect = measureRect(popupEle);
    const { scaleX, scaleY } = measureScale(popupEle, popupRect, win);

    // 4. 镜像
    popupEle.style.left = 'auto';
    popupEle.style.top = 'auto';
    popupEle.style.right = '0';
    popupEle.style.bottom = '0';
    const mirrorRect = measureRect(popupEle);

    // 5. 早退判定。这里只**记录**结果、不 return —— 还原交给 finally，
    //    净效果与 antd 一致（antd 也是先还原（209–217）再 return（224））。
    const targetVisible = isPointTarget(target) ? true : isVisible(target);
    if (shouldMeasure(scaleX, scaleY, targetVisible)) {
      result = {
        target: targetRect,
        popup: popupRect,
        mirror: mirrorRect,
        scaleX,
        scaleY,
        visible,
        check,
      };
    }
  } finally {
    restore(popupEle, snap);
  }

  return result;
}
