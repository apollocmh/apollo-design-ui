/**
 * oracle.js —— antd 参考实现的**机械移植**，仅用于差分测试。
 *
 * 来源：@rc-component/trigger@3.10.1 `es/hooks/useAlign.js` 第 228–502 行
 *      （即 offset 解析之后的全部数学部分），以及 `es/util.js` 的 getUnitOffset 系列。
 *
 * 移植原则：
 *   1. 不做任何"顺手优化"，保持 antd 的变量名、求值顺序与可变状态（let / 闭包）；
 *   2. DOM 相关的部分（placeholder element、mirror rect、scale 测量）已经在
 *      调用方测好并以参数传入，这里只保留纯计算；
 *   3. 本文件**不参与生产构建**，也不导出到包外 —— 它存在的唯一目的是回答
 *      "我们的实现与 antd 逐位一致吗"。
 *
 * 若 antd 升级导致行为变化，应当同步更新本文件，并让差分测试先变红。
 */

function getUnitOffset(size, offset = 0) {
  const offsetStr = `${offset}`;
  const cells = offsetStr.match(/^(.*)%$/);
  if (cells) {
    return size * (parseFloat(cells[1]) / 100);
  }
  return parseFloat(offsetStr);
}

function getNumberOffset(rect, offset) {
  const [offsetX, offsetY] = offset || [];
  return [getUnitOffset(rect.width, offsetX), getUnitOffset(rect.height, offsetY)];
}

function splitPoints(points = '') {
  return [points[0], points[1]];
}

function getAlignPoint(rect, points) {
  const topBottom = points[0];
  const leftRight = points[1];
  let x;
  let y;

  if (topBottom === 't') {
    y = rect.y;
  } else if (topBottom === 'b') {
    y = rect.y + rect.height;
  } else {
    y = rect.y + rect.height / 2;
  }

  if (leftRight === 'l') {
    x = rect.x;
  } else if (leftRight === 'r') {
    x = rect.x + rect.width;
  } else {
    x = rect.x + rect.width / 2;
  }
  return { x, y };
}

function reversePoints(points, index) {
  const reverseMap = { t: 'b', b: 't', l: 'r', r: 'l' };
  const clone = [...points];
  clone[index] = reverseMap[points[index]] || 'c';
  return clone;
}

function flatPoints(points) {
  return points.join('');
}

/**
 * @param {object} input
 * @param {{x:number,y:number,width:number,height:number}} input.target
 * @param {{x:number,y:number,width:number,height:number}} input.popup
 * @param {{left:number,top:number,right:number,bottom:number}} input.visible  视口可视区
 * @param {{left:number,top:number,right:number,bottom:number}} input.scroll   文档滚动区
 * @param {object} input.align   AlignType
 * @param {object} [input.flip]  prevFlipRef.current
 * @param {number} [input.scaleX]
 * @param {number} [input.scaleY]
 * @param {boolean} [input.clampIntersection]
 *   false（默认）= 逐字复刻 antd，含 `Math.max(0, w*h)` 的缺陷；
 *   true = 改用逐轴夹取，与本项目 `getIntersectionArea` 一致。
 *   差分测试用 true 证明「除这一处有意差异外，移植是保真的」。
 */
export function alignOracle(input) {
  const { target, popup, visible, scroll, align: placementInfo, flip } = input;
  const clampIntersection = input.clampIntersection ?? false;
  const scaleX = input.scaleX ?? 1;
  const scaleY = input.scaleY ?? 1;
  const prevFlipRef = { ...(flip || {}) };

  // 结构和 antd 一致：这些从 DOM 量出来的量在这里直接作为参数
  const popupRect = { ...popup };
  const popupHeight = popupRect.height;
  const popupWidth = popupRect.width;
  const targetRect = { ...target };
  const targetHeight = targetRect.height;
  const targetWidth = targetRect.width;

  const visibleRegionArea = visible;
  const scrollRegionArea = scroll;

  // htmlRegion
  const VISIBLE = 'visible';
  const VISIBLE_FIRST = 'visibleFirst';
  let { htmlRegion } = placementInfo;
  if (htmlRegion !== 'scroll' && htmlRegion !== VISIBLE_FIRST) {
    htmlRegion = VISIBLE;
  }
  const isVisibleFirst = htmlRegion === VISIBLE_FIRST;
  const visibleArea = htmlRegion === VISIBLE ? visibleRegionArea : scrollRegionArea;
  const adjustCheckVisibleArea = isVisibleFirst ? visibleRegionArea : visibleArea;

  // Offset
  const { offset, targetOffset } = placementInfo;
  let [popupOffsetX, popupOffsetY] = getNumberOffset(popupRect, offset);
  const [targetOffsetX, targetOffsetY] = getNumberOffset(targetRect, targetOffset);
  targetRect.x -= targetOffsetX;
  targetRect.y -= targetOffsetY;

  // Points
  const [popupPoint, targetPoint] = placementInfo.points || [];
  const targetPoints = splitPoints(targetPoint);
  const popupPoints = splitPoints(popupPoint);
  const targetAlignPoint = getAlignPoint(targetRect, targetPoints);
  const popupAlignPoint = getAlignPoint(popupRect, popupPoints);

  let nextPoints = [popupPoints, targetPoints];

  let nextOffsetX = targetAlignPoint.x - popupAlignPoint.x + popupOffsetX;
  let nextOffsetY = targetAlignPoint.y - popupAlignPoint.y + popupOffsetY;

  // ============== Intersection ===============
  function getIntersectionVisibleArea(offsetX, offsetY, area = visibleArea) {
    const l = popupRect.x + offsetX;
    const t = popupRect.y + offsetY;
    const r = l + popupWidth;
    const b = t + popupHeight;
    const visibleL = Math.max(l, area.left);
    const visibleT = Math.max(t, area.top);
    const visibleR = Math.min(r, area.right);
    const visibleB = Math.min(b, area.bottom);
    const w = visibleR - visibleL;
    const h = visibleB - visibleT;
    // clampIntersection=true 时逐轴夹取，与本项目 getIntersectionArea 一致
    if (clampIntersection) {
      return Math.max(0, w) * Math.max(0, h);
    }
    // 默认：逐字复刻 antd 的 `Math.max(0, w * h)`（含其缺陷）
    return Math.max(0, w * h);
  }
  const originIntersectionVisibleArea = getIntersectionVisibleArea(nextOffsetX, nextOffsetY);
  const originIntersectionRecommendArea = getIntersectionVisibleArea(
    nextOffsetX,
    nextOffsetY,
    visibleRegionArea,
  );

  // ========================== Overflow ===========================
  const targetAlignPointTL = getAlignPoint(targetRect, ['t', 'l']);
  const popupAlignPointTL = getAlignPoint(popupRect, ['t', 'l']);
  const targetAlignPointBR = getAlignPoint(targetRect, ['b', 'r']);
  const popupAlignPointBR = getAlignPoint(popupRect, ['b', 'r']);
  const overflowConfig = placementInfo.overflow || {};
  const { adjustX, adjustY, shiftX, shiftY } = overflowConfig;
  const supportAdjust = (val) => {
    if (typeof val === 'boolean') {
      return val;
    }
    return val >= 0;
  };

  let nextPopupY;
  let nextPopupBottom;
  let nextPopupX;
  let nextPopupRight;
  function syncNextPopupPosition() {
    nextPopupY = popupRect.y + nextOffsetY;
    nextPopupBottom = nextPopupY + popupHeight;
    nextPopupX = popupRect.x + nextOffsetX;
    nextPopupRight = nextPopupX + popupWidth;
  }
  syncNextPopupPosition();

  // >>>>>>>>>> Top & Bottom
  const needAdjustY = supportAdjust(adjustY);
  const sameTB = popupPoints[0] === targetPoints[0];

  if (
    needAdjustY &&
    popupPoints[0] === 't' &&
    (nextPopupBottom > adjustCheckVisibleArea.bottom || prevFlipRef.bt)
  ) {
    let tmpNextOffsetY = nextOffsetY;
    if (sameTB) {
      tmpNextOffsetY -= popupHeight - targetHeight;
    } else {
      tmpNextOffsetY = targetAlignPointTL.y - popupAlignPointBR.y - popupOffsetY;
    }
    const newVisibleArea = getIntersectionVisibleArea(nextOffsetX, tmpNextOffsetY);
    const newVisibleRecommendArea = getIntersectionVisibleArea(
      nextOffsetX,
      tmpNextOffsetY,
      visibleRegionArea,
    );
    if (
      newVisibleArea > originIntersectionVisibleArea ||
      (newVisibleArea === originIntersectionVisibleArea &&
        (!isVisibleFirst || newVisibleRecommendArea >= originIntersectionRecommendArea))
    ) {
      prevFlipRef.bt = true;
      nextOffsetY = tmpNextOffsetY;
      popupOffsetY = -popupOffsetY;
      nextPoints = [reversePoints(nextPoints[0], 0), reversePoints(nextPoints[1], 0)];
    } else {
      prevFlipRef.bt = false;
    }
  }

  if (
    needAdjustY &&
    popupPoints[0] === 'b' &&
    (nextPopupY < adjustCheckVisibleArea.top || prevFlipRef.tb)
  ) {
    let tmpNextOffsetY = nextOffsetY;
    if (sameTB) {
      tmpNextOffsetY += popupHeight - targetHeight;
    } else {
      tmpNextOffsetY = targetAlignPointBR.y - popupAlignPointTL.y - popupOffsetY;
    }
    const newVisibleArea = getIntersectionVisibleArea(nextOffsetX, tmpNextOffsetY);
    const newVisibleRecommendArea = getIntersectionVisibleArea(
      nextOffsetX,
      tmpNextOffsetY,
      visibleRegionArea,
    );
    if (
      newVisibleArea > originIntersectionVisibleArea ||
      (newVisibleArea === originIntersectionVisibleArea &&
        (!isVisibleFirst || newVisibleRecommendArea >= originIntersectionRecommendArea))
    ) {
      prevFlipRef.tb = true;
      nextOffsetY = tmpNextOffsetY;
      popupOffsetY = -popupOffsetY;
      nextPoints = [reversePoints(nextPoints[0], 0), reversePoints(nextPoints[1], 0)];
    } else {
      prevFlipRef.tb = false;
    }
  }

  // >>>>>>>>>> Left & Right
  const needAdjustX = supportAdjust(adjustX);
  const sameLR = popupPoints[1] === targetPoints[1];

  if (
    needAdjustX &&
    popupPoints[1] === 'l' &&
    (nextPopupRight > adjustCheckVisibleArea.right || prevFlipRef.rl)
  ) {
    let tmpNextOffsetX = nextOffsetX;
    if (sameLR) {
      tmpNextOffsetX -= popupWidth - targetWidth;
    } else {
      tmpNextOffsetX = targetAlignPointTL.x - popupAlignPointBR.x - popupOffsetX;
    }
    const newVisibleArea = getIntersectionVisibleArea(tmpNextOffsetX, nextOffsetY);
    const newVisibleRecommendArea = getIntersectionVisibleArea(
      tmpNextOffsetX,
      nextOffsetY,
      visibleRegionArea,
    );
    if (
      newVisibleArea > originIntersectionVisibleArea ||
      (newVisibleArea === originIntersectionVisibleArea &&
        (!isVisibleFirst || newVisibleRecommendArea >= originIntersectionRecommendArea))
    ) {
      prevFlipRef.rl = true;
      nextOffsetX = tmpNextOffsetX;
      popupOffsetX = -popupOffsetX;
      nextPoints = [reversePoints(nextPoints[0], 1), reversePoints(nextPoints[1], 1)];
    } else {
      prevFlipRef.rl = false;
    }
  }

  if (
    needAdjustX &&
    popupPoints[1] === 'r' &&
    (nextPopupX < adjustCheckVisibleArea.left || prevFlipRef.lr)
  ) {
    let tmpNextOffsetX = nextOffsetX;
    if (sameLR) {
      tmpNextOffsetX += popupWidth - targetWidth;
    } else {
      tmpNextOffsetX = targetAlignPointBR.x - popupAlignPointTL.x - popupOffsetX;
    }
    const newVisibleArea = getIntersectionVisibleArea(tmpNextOffsetX, nextOffsetY);
    const newVisibleRecommendArea = getIntersectionVisibleArea(
      tmpNextOffsetX,
      nextOffsetY,
      visibleRegionArea,
    );
    if (
      newVisibleArea > originIntersectionVisibleArea ||
      (newVisibleArea === originIntersectionVisibleArea &&
        (!isVisibleFirst || newVisibleRecommendArea >= originIntersectionRecommendArea))
    ) {
      prevFlipRef.lr = true;
      nextOffsetX = tmpNextOffsetX;
      popupOffsetX = -popupOffsetX;
      nextPoints = [reversePoints(nextPoints[0], 1), reversePoints(nextPoints[1], 1)];
    } else {
      prevFlipRef.lr = false;
    }
  }

  const nextAlignPoints = [flatPoints(nextPoints[0]), flatPoints(nextPoints[1])];

  // ============================ Shift ============================
  syncNextPopupPosition();
  const numShiftX = shiftX === true ? 0 : shiftX;
  if (typeof numShiftX === 'number') {
    if (nextPopupX < visibleRegionArea.left) {
      nextOffsetX -= nextPopupX - visibleRegionArea.left - popupOffsetX;
      if (targetRect.x + targetWidth < visibleRegionArea.left + numShiftX) {
        nextOffsetX += targetRect.x - visibleRegionArea.left + targetWidth - numShiftX;
      }
    }
    if (nextPopupRight > visibleRegionArea.right) {
      nextOffsetX -= nextPopupRight - visibleRegionArea.right - popupOffsetX;
      if (targetRect.x > visibleRegionArea.right - numShiftX) {
        nextOffsetX += targetRect.x - visibleRegionArea.right + numShiftX;
      }
    }
  }
  const numShiftY = shiftY === true ? 0 : shiftY;
  if (typeof numShiftY === 'number') {
    if (nextPopupY < visibleRegionArea.top) {
      nextOffsetY -= nextPopupY - visibleRegionArea.top - popupOffsetY;
      if (targetRect.y + targetHeight < visibleRegionArea.top + numShiftY) {
        nextOffsetY += targetRect.y - visibleRegionArea.top + targetHeight - numShiftY;
      }
    }
    if (nextPopupBottom > visibleRegionArea.bottom) {
      nextOffsetY -= nextPopupBottom - visibleRegionArea.bottom - popupOffsetY;
      if (targetRect.y > visibleRegionArea.bottom - numShiftY) {
        nextOffsetY += targetRect.y - visibleRegionArea.bottom + numShiftY;
      }
    }
  }

  // ============================ Arrow ============================
  const popupLeft = popupRect.x + nextOffsetX;
  const popupRight = popupLeft + popupWidth;
  const popupTop = popupRect.y + nextOffsetY;
  const popupBottom = popupTop + popupHeight;
  const targetLeft = targetRect.x;
  const targetRight = targetLeft + targetWidth;
  const targetTop = targetRect.y;
  const targetBottom = targetTop + targetHeight;

  const maxLeft = Math.max(popupLeft, targetLeft);
  const minRight = Math.min(popupRight, targetRight);
  const xCenter = (maxLeft + minRight) / 2;
  const nextArrowX = xCenter - popupLeft;
  const maxTop = Math.max(popupTop, targetTop);
  const minBottom = Math.min(popupBottom, targetBottom);
  const yCenter = (maxTop + minBottom) / 2;
  const nextArrowY = yCenter - popupTop;

  // ============================ 取整 ============================
  let offsetX4Right = 0;
  let offsetY4Bottom = 0;
  if (scaleX === 1) {
    nextOffsetX = Math.floor(nextOffsetX);
    offsetX4Right = Math.floor(offsetX4Right);
  }
  if (scaleY === 1) {
    nextOffsetY = Math.floor(nextOffsetY);
    offsetY4Bottom = Math.floor(offsetY4Bottom);
  }

  return {
    offsetX: nextOffsetX / scaleX,
    offsetY: nextOffsetY / scaleY,
    arrowX: nextArrowX / scaleX,
    arrowY: nextArrowY / scaleY,
    points: nextAlignPoints,
    flip: {
      bt: prevFlipRef.bt,
      tb: prevFlipRef.tb,
      rl: prevFlipRef.rl,
      lr: prevFlipRef.lr,
    },
  };
}
