/**
 * 水印绘制的 canvas 三步（内容 → 旋转 → 交错平铺）。
 *
 * 契约来源：antd 6.6.4 的 `es/watermark/useClips.js` —— **机械移植**
 * （求值顺序与几何计算逐行对齐；`FontGap = 3` 是布局契约的一部分）。
 */

import type { WatermarkFont } from './interface';
import { getCanvasFont, getFontSize } from './utils';

export const FontGap = 3;

const prepareCanvas = (
  width: number,
  height: number,
  ratio = 1,
): [CanvasRenderingContext2D, HTMLCanvasElement, number, number] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const realWidth = width * ratio;
  const realHeight = height * ratio;
  canvas.setAttribute('width', `${realWidth}px`);
  canvas.setAttribute('height', `${realHeight}px`);
  ctx.save();
  return [ctx, canvas, realWidth, realHeight];
};

/** 旋转后坐标（文本四角包围盒用）。 */
const getRotatePos = (x: number, y: number, angle: number): [number, number] => {
  const targetX = x * Math.cos(angle) - y * Math.sin(angle);
  const targetY = x * Math.sin(angle) + y * Math.cos(angle);
  return [targetX, targetY];
};

/** 交错平铺画布上的内容类型：图片元素或文本行列表。 */
export type ClipsContent = HTMLImageElement | { text: string; font: WatermarkFont }[];

/**
 * 单元 clips：返回 `[base64, filledWidth, filledHeight]`（CSS 像素）。
 *
 * ⚠️ `content` 为空列表时不调用任何 drawImage（零尺寸画布保护 —— 上游测试钉住）。
 */
export function getClips(
  content: ClipsContent,
  rotate: number,
  ratio: number,
  width: number,
  height: number,
  gapX: number,
  gapY: number,
): [string, number, number] {
  // ================= Text / Image =================
  const [ctx, canvas, contentWidth, contentHeight] = prepareCanvas(width, height, ratio);
  if (content instanceof HTMLImageElement) {
    // Image
    ctx.drawImage(content, 0, 0, contentWidth, contentHeight);
  } else {
    // Text
    ctx.textBaseline = 'top';
    let top = 0;
    content.forEach(({ text, font }) => {
      ctx.font = getCanvasFont(font, ratio, height);
      ctx.fillStyle = font.color as string;
      ctx.textAlign = font.textAlign as CanvasTextAlign;
      ctx.fillText(text, contentWidth / 2, top);
      top += getFontSize(font, ratio) + FontGap * ratio;
    });
  }

  // ==================== Rotate ====================
  const angle = (Math.PI / 180) * Number(rotate);
  const maxSize = Math.max(width, height);
  const [rCtx, rCanvas, realMaxSize] = prepareCanvas(maxSize, maxSize, ratio);
  // Copy from `ctx` and rotate
  rCtx.translate(realMaxSize / 2, realMaxSize / 2);
  rCtx.rotate(angle);
  if (contentWidth > 0 && contentHeight > 0) {
    rCtx.drawImage(canvas, -contentWidth / 2, -contentHeight / 2);
  }

  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  const halfWidth = contentWidth / 2;
  const halfHeight = contentHeight / 2;
  const points: [number, number][] = [
    [0 - halfWidth, 0 - halfHeight],
    [0 + halfWidth, 0 - halfHeight],
    [0 + halfWidth, 0 + halfHeight],
    [0 - halfWidth, 0 + halfHeight],
  ];
  points.forEach(([x, y]) => {
    const [targetX, targetY] = getRotatePos(x, y, angle);
    left = Math.min(left, targetX);
    right = Math.max(right, targetX);
    top = Math.min(top, targetY);
    bottom = Math.max(bottom, targetY);
  });
  const cutLeft = left + realMaxSize / 2;
  const cutTop = top + realMaxSize / 2;
  const cutWidth = right - left;
  const cutHeight = bottom - top;

  // ================ Fill Alternate ================
  const realGapX = gapX * ratio;
  const realGapY = gapY * ratio;
  const filledWidth = (cutWidth + realGapX) * 2;
  const filledHeight = cutHeight + realGapY;
  const [fCtx, fCanvas] = prepareCanvas(filledWidth, filledHeight);
  const drawImg = (targetX = 0, targetY = 0) => {
    if (cutWidth <= 0 || cutHeight <= 0) {
      return;
    }
    fCtx.drawImage(
      rCanvas,
      cutLeft,
      cutTop,
      cutWidth,
      cutHeight,
      targetX,
      targetY,
      cutWidth,
      cutHeight,
    );
  };
  drawImg();
  drawImg(cutWidth + realGapX, -cutHeight / 2 - realGapY / 2);
  drawImg(cutWidth + realGapX, +cutHeight / 2 + realGapY / 2);

  return [fCanvas.toDataURL(), filledWidth / ratio, filledHeight / ratio];
}
