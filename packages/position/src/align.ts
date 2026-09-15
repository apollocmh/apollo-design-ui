import { getIntersectionArea } from './area';
import { getNumberOffset } from './offset';
import { flatPoint, getAlignPoint, reversePoint, splitPoints } from './point';
import type {
  AlignContext,
  AlignResult,
  AlignType,
  Area,
  FlipMemory,
  HorizontalPoint,
  OverflowConfig,
  Rect,
  VerticalPoint,
} from './types';

/**
 * 浮层定位几何核心。
 *
 * 这是 AR1 的答案：**浮层定位可以完全表达为纯函数**。
 * 输入是三个矩形（target / popup）+ 两个区域（visible / scroll）+ 一份对齐配置，
 * 输出是位移量与箭头位置。不涉及任何 DOM 读取、不涉及 Vue、不涉及触发时机。
 *
 * 行为与 antd 6.6.4 的 `@rc-component/trigger@3.10.1` `useAlign` 逐位一致，
 * 由 `__tests__/oracle.js`（参考实现的机械移植）差分验证。
 */

/** antd `supportAdjust`：布尔直接用；数值要求 ≥ 0；undefined 视为 false。 */
function supportAdjust(value: boolean | number | undefined): boolean {
  if (typeof value === 'boolean') return value;
  return value !== undefined && value >= 0;
}

function topLeft(rect: Rect) {
  return getAlignPoint(rect, ['t', 'l']);
}
function bottomRight(rect: Rect) {
  return getAlignPoint(rect, ['b', 'r']);
}

export interface AlignOutcome {
  /** 相对浮层当前位置的位移 */
  offsetX: number;
  offsetY: number;
  /** 箭头中心相对浮层左上角的偏移（已按 scale 归一） */
  arrowX: number;
  arrowY: number;
  /** 实际生效的对齐点（翻转后与原配置不同） */
  points: [string, string];
  /** 本次结果对应的翻转记忆，调用方需保存并在下次对齐时回传 */
  flip: FlipMemory;
  /** 实际生效的 overflow 配置回显，便于调试与快照 */
  overflow: OverflowConfig;
}

/**
 * 计算一次对齐。
 *
 * @param ctx  测量好的矩形与区域
 * @param align 对齐配置（来自 `getPlacements` 或用户传入）
 * @param flip 上一次的翻转记忆；首次对齐传 `{}` 或省略
 */
export function alignPopup(
  ctx: AlignContext,
  align: AlignType,
  flip: FlipMemory = {},
): AlignOutcome {
  const { target, popup } = ctx;
  const scaleX = ctx.scaleX ?? 1;
  const scaleY = ctx.scaleY ?? 1;
  const overflow: OverflowConfig = align.overflow ?? {};

  // -------------------------------------------------------------------------
  // 1. offset 解析
  //    targetOffset 从**原始** target 矩形算百分比，再把目标整体平移
  // -------------------------------------------------------------------------
  const [targetOffsetX, targetOffsetY] = getNumberOffset(target, align.targetOffset);
  const targetRect: Rect = {
    x: target.x - targetOffsetX,
    y: target.y - targetOffsetY,
    width: target.width,
    height: target.height,
  };
  let [popupOffsetX, popupOffsetY] = getNumberOffset(popup, align.offset);

  // -------------------------------------------------------------------------
  // 2. 区域选择（对应 antd 的 htmlRegion 三态）
  // -------------------------------------------------------------------------
  const htmlRegion = align.htmlRegion ?? 'visible';
  const isVisibleFirst = htmlRegion === 'visibleFirst';
  /** 相交面积比较的基准区 */
  const compareArea: Area = htmlRegion === 'visible' ? ctx.visible : ctx.scroll;
  /** 翻转是否触发的判定区 */
  const adjustArea: Area = htmlRegion === 'scroll' ? ctx.scroll : ctx.visible;
  /** 平移（shift）与「推荐区」比较都用视口可视区 */
  const recommendArea: Area = ctx.visible;

  // -------------------------------------------------------------------------
  // 3. 初始对齐：把浮层的对齐点移到目标的对齐点上
  // -------------------------------------------------------------------------
  const [popupPoint, targetPoint] = align.points ?? [];
  const targetPoints = splitPoints(targetPoint ?? '');
  const popupPoints = splitPoints(popupPoint ?? '');

  const targetAlignPoint = getAlignPoint(targetRect, targetPoints);
  const popupAlignPoint = getAlignPoint(popup, popupPoints);

  let nextPoints: [
    readonly [VerticalPoint, HorizontalPoint],
    readonly [VerticalPoint, HorizontalPoint],
  ] = [popupPoints, targetPoints];

  let nextOffsetX = targetAlignPoint.x - popupAlignPoint.x + popupOffsetX;
  let nextOffsetY = targetAlignPoint.y - popupAlignPoint.y + popupOffsetY;

  const originIntersectionArea = getIntersectionArea(popup, nextOffsetX, nextOffsetY, compareArea);
  const originRecommendArea = getIntersectionArea(popup, nextOffsetX, nextOffsetY, recommendArea);

  // -------------------------------------------------------------------------
  // 4. 翻转（flip）
  //    翻转只在「可见面积不减少」时才被接受 —— 这是避免抖动的关键。
  //    一旦翻转过就写进 flip 记忆，下次即使不再溢出也保持翻转（粘滞）。
  // -------------------------------------------------------------------------
  const nextFlip: FlipMemory = { ...flip };

  const targetTL = topLeft(targetRect);
  const targetBR = bottomRight(targetRect);
  const popupTL = topLeft(popup);
  const popupBR = bottomRight(popup);

  let nextPopupY = popup.y + nextOffsetY;
  let nextPopupBottom = nextPopupY + popup.height;
  let nextPopupX = popup.x + nextOffsetX;
  let nextPopupRight = nextPopupX + popup.width;

  const tryFlip = (
    axis: 0 | 1,
    trigger: boolean,
    memoryKey: keyof FlipMemory,
    compute: () => number,
    apply: (value: number) => void,
    negateOffset: () => void,
  ) => {
    if (!trigger) return;
    const candidate = compute();
    const newArea =
      axis === 0
        ? getIntersectionArea(popup, nextOffsetX, candidate, compareArea)
        : getIntersectionArea(popup, candidate, nextOffsetY, compareArea);
    const newRecommend =
      axis === 0
        ? getIntersectionArea(popup, nextOffsetX, candidate, recommendArea)
        : getIntersectionArea(popup, candidate, nextOffsetY, recommendArea);

    // 面积更大 → 接受；相等时仅在非 visibleFirst 或推荐区不变差时接受
    const accepted =
      newArea > originIntersectionArea ||
      (newArea === originIntersectionArea &&
        (!isVisibleFirst || newRecommend >= originRecommendArea));

    nextFlip[memoryKey] = accepted;
    if (!accepted) return;

    apply(candidate);
    negateOffset();
    nextPoints = [reversePoint(nextPoints[0], axis), reversePoint(nextPoints[1], axis)];
  };

  // ---- Y 轴 ----
  const needAdjustY = supportAdjust(overflow.adjustY);
  const sameTB = popupPoints[0] === targetPoints[0];

  // 下 → 上：浮层下边超出判定区
  tryFlip(
    0,
    needAdjustY && popupPoints[0] === 't' && (nextPopupBottom > adjustArea.bottom || !!flip.bt),
    'bt',
    () =>
      sameTB
        ? nextOffsetY - (popup.height - targetRect.height)
        : targetTL.y - popupBR.y - popupOffsetY,
    (v) => {
      nextOffsetY = v;
    },
    () => {
      popupOffsetY = -popupOffsetY;
    },
  );

  // 上 → 下：浮层上边超出判定区
  tryFlip(
    0,
    needAdjustY && popupPoints[0] === 'b' && (nextPopupY < adjustArea.top || !!flip.tb),
    'tb',
    () =>
      sameTB
        ? nextOffsetY + (popup.height - targetRect.height)
        : targetBR.y - popupTL.y - popupOffsetY,
    (v) => {
      nextOffsetY = v;
    },
    () => {
      popupOffsetY = -popupOffsetY;
    },
  );

  // ---- X 轴 ----
  const needAdjustX = supportAdjust(overflow.adjustX);
  const sameLR = popupPoints[1] === targetPoints[1];

  // 右 → 左
  tryFlip(
    1,
    needAdjustX && popupPoints[1] === 'l' && (nextPopupRight > adjustArea.right || !!flip.rl),
    'rl',
    () =>
      sameLR
        ? nextOffsetX - (popup.width - targetRect.width)
        : targetTL.x - popupBR.x - popupOffsetX,
    (v) => {
      nextOffsetX = v;
    },
    () => {
      popupOffsetX = -popupOffsetX;
    },
  );

  // 左 → 右
  tryFlip(
    1,
    needAdjustX && popupPoints[1] === 'r' && (nextPopupX < adjustArea.left || !!flip.lr),
    'lr',
    () =>
      sameLR
        ? nextOffsetX + (popup.width - targetRect.width)
        : targetBR.x - popupTL.x - popupOffsetX,
    (v) => {
      nextOffsetX = v;
    },
    () => {
      popupOffsetX = -popupOffsetX;
    },
  );

  // -------------------------------------------------------------------------
  // 5. 平移（shift）
  //    翻转之后仍然越界时，把浮层推回可视区；
  //    若目标本身已远离可视区，则停止平移（否则浮层会飞离目标）。
  // -------------------------------------------------------------------------
  nextPopupY = popup.y + nextOffsetY;
  nextPopupBottom = nextPopupY + popup.height;
  nextPopupX = popup.x + nextOffsetX;
  nextPopupRight = nextPopupX + popup.width;

  const numShiftX = overflow.shiftX === true ? 0 : overflow.shiftX;
  if (typeof numShiftX === 'number') {
    if (nextPopupX < recommendArea.left) {
      nextOffsetX -= nextPopupX - recommendArea.left - popupOffsetX;
      if (targetRect.x + targetRect.width < recommendArea.left + numShiftX) {
        nextOffsetX += targetRect.x - recommendArea.left + targetRect.width - numShiftX;
      }
    }
    if (nextPopupRight > recommendArea.right) {
      nextOffsetX -= nextPopupRight - recommendArea.right - popupOffsetX;
      if (targetRect.x > recommendArea.right - numShiftX) {
        nextOffsetX += targetRect.x - recommendArea.right + numShiftX;
      }
    }
  }

  const numShiftY = overflow.shiftY === true ? 0 : overflow.shiftY;
  if (typeof numShiftY === 'number') {
    if (nextPopupY < recommendArea.top) {
      nextOffsetY -= nextPopupY - recommendArea.top - popupOffsetY;
      if (targetRect.y + targetRect.height < recommendArea.top + numShiftY) {
        nextOffsetY += targetRect.y - recommendArea.top + targetRect.height - numShiftY;
      }
    }
    if (nextPopupBottom > recommendArea.bottom) {
      nextOffsetY -= nextPopupBottom - recommendArea.bottom - popupOffsetY;
      if (targetRect.y > recommendArea.bottom - numShiftY) {
        nextOffsetY += targetRect.y - recommendArea.bottom + numShiftY;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 6. 箭头：取浮层与目标的交叉区中心
  // -------------------------------------------------------------------------
  const popupLeft = popup.x + nextOffsetX;
  const popupRight = popupLeft + popup.width;
  const popupTop = popup.y + nextOffsetY;
  const popupBottom = popupTop + popup.height;
  const targetLeft = targetRect.x;
  const targetRight = targetLeft + targetRect.width;
  const targetTop = targetRect.y;
  const targetBottom = targetTop + targetRect.height;

  const xCenter = (Math.max(popupLeft, targetLeft) + Math.min(popupRight, targetRight)) / 2;
  const yCenter = (Math.max(popupTop, targetTop) + Math.min(popupBottom, targetBottom)) / 2;
  const nextArrowX = xCenter - popupLeft;
  const nextArrowY = yCenter - popupTop;

  // -------------------------------------------------------------------------
  // 7. 取整与缩放归一
  //    antd 只在 scale === 1 时 floor —— 有缩放时取整会累积误差
  // -------------------------------------------------------------------------
  let finalOffsetX = nextOffsetX;
  let finalOffsetY = nextOffsetY;
  if (scaleX === 1) finalOffsetX = Math.floor(finalOffsetX);
  if (scaleY === 1) finalOffsetY = Math.floor(finalOffsetY);

  return {
    offsetX: finalOffsetX / scaleX,
    offsetY: finalOffsetY / scaleY,
    arrowX: nextArrowX / scaleX,
    arrowY: nextArrowY / scaleY,
    points: [flatPoint(nextPoints[0]), flatPoint(nextPoints[1])],
    flip: nextFlip,
    overflow,
  };
}

/** `alignPopup` 的简化签名：只关心位移与箭头时用它。 */
export function toAlignResult(outcome: AlignOutcome): AlignResult {
  return {
    offsetX: outcome.offsetX,
    offsetY: outcome.offsetY,
    arrowX: outcome.arrowX,
    arrowY: outcome.arrowY,
    points: outcome.points,
    flip: outcome.flip,
  };
}
