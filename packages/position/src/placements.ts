import type { AlignPoint, AlignType, OverflowConfig, Placement, PlacementConfig } from './types';

/**
 * antd 的 12 个 placement → 对齐点。
 *
 * 逐字取自 antd 6.6.4 `es/_util/placements.js` 的 `PlacementAlignMap`。
 * `points: [浮层点, 目标点]` —— 例如 `top: ['bc','tc']` 表示浮层下边缘中点
 * 对齐目标上边缘中点（浮层在目标上方）。
 */
export const PLACEMENT_POINTS: Record<Placement, readonly [AlignPoint, AlignPoint]> = {
  left: ['cr', 'cl'],
  right: ['cl', 'cr'],
  top: ['bc', 'tc'],
  bottom: ['tc', 'bc'],
  topLeft: ['bl', 'tl'],
  leftTop: ['tr', 'tl'],
  topRight: ['br', 'tr'],
  rightTop: ['tl', 'tr'],
  bottomRight: ['tr', 'br'],
  rightBottom: ['bl', 'br'],
  bottomLeft: ['tl', 'bl'],
  leftBottom: ['br', 'bl'],
};

/**
 * `arrowPointAtCenter` 为真时，8 个角 placement 改用这套点，
 * 使箭头指向目标中心而不是目标角。
 */
export const ARROW_CENTER_PLACEMENT_POINTS: Partial<
  Record<Placement, readonly [AlignPoint, AlignPoint]>
> = {
  topLeft: ['bl', 'tc'],
  leftTop: ['tr', 'cl'],
  topRight: ['br', 'tc'],
  rightTop: ['tl', 'cr'],
  bottomRight: ['tr', 'bc'],
  rightBottom: ['bl', 'cr'],
  bottomLeft: ['tl', 'bc'],
  leftBottom: ['br', 'cl'],
};

/** 这 8 个角 placement 的箭头位置由设计稿固定，禁用自动箭头。 */
const DISABLE_AUTO_ARROW = new Set<Placement>([
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
  'leftTop',
  'leftBottom',
  'rightTop',
  'rightBottom',
]);

/** antd `MAX_VERTICAL_CONTENT_RADIUS`。 */
const MAX_VERTICAL_CONTENT_RADIUS = 8;

/**
 * antd `getArrowOffsetToken({ contentRadius, limitVerticalRadius: true })`。
 * 圆角大于 12 时箭头偏移随之增大，否则固定 12。
 */
export function getArrowOffsetToken(contentRadius: number): {
  arrowOffsetHorizontal: number;
  arrowOffsetVertical: number;
} {
  const arrowOffset = contentRadius > 12 ? contentRadius + 2 : 12;
  return {
    arrowOffsetHorizontal: arrowOffset,
    arrowOffsetVertical: MAX_VERTICAL_CONTENT_RADIUS,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * antd `getOverflowOptions`。
 *
 * 关键点：`shiftX` / `shiftY` 一旦为真值就不会再设置 `adjustX` / `adjustY`；
 * 未设置 shift 的轴才回退为 adjust。8 个角 placement 的 `baseOverflow` 是空的，
 * 因此它们只做翻转、不做平移。
 */
export function getOverflowOptions(
  placement: Placement,
  arrowWidth: number,
  borderRadius: number,
  autoAdjustOverflow?: boolean | OverflowConfig,
): OverflowConfig {
  if (autoAdjustOverflow === false) {
    return { adjustX: false, adjustY: false };
  }
  const overflow = isPlainObject(autoAdjustOverflow) ? autoAdjustOverflow : {};
  const arrowOffset = getArrowOffsetToken(borderRadius);
  const baseOverflow: OverflowConfig = {};

  switch (placement) {
    case 'top':
    case 'bottom':
      baseOverflow.shiftX = arrowOffset.arrowOffsetHorizontal * 2 + arrowWidth;
      baseOverflow.shiftY = true;
      baseOverflow.adjustY = true;
      break;
    case 'left':
    case 'right':
      baseOverflow.shiftY = arrowOffset.arrowOffsetVertical * 2 + arrowWidth;
      baseOverflow.shiftX = true;
      baseOverflow.adjustX = true;
      break;
    default:
      break;
  }

  const merged: OverflowConfig = { ...baseOverflow, ...overflow };
  if (!merged.shiftX) merged.adjustX = true;
  if (!merged.shiftY) merged.adjustY = true;
  return merged;
}

/**
 * 生成 12 个 placement 的完整配置 —— antd `getPlacements` 的等价实现。
 *
 * 生成的 `offset` 已包含箭头宽度的一半与 `config.offset` 间距，
 * 因此调用方不需要再自己加箭头偏移。
 */
export function getPlacements(config: PlacementConfig): Record<Placement, AlignType> {
  const { arrowWidth, offset, borderRadius, autoAdjustOverflow, arrowPointAtCenter, visibleFirst } =
    config;
  const halfArrowWidth = arrowWidth / 2;
  const arrowOffset = getArrowOffsetToken(borderRadius);

  const result = {} as Record<Placement, AlignType>;

  for (const key of Object.keys(PLACEMENT_POINTS) as Placement[]) {
    const template =
      (arrowPointAtCenter ? ARROW_CENTER_PLACEMENT_POINTS[key] : undefined) ??
      PLACEMENT_POINTS[key];

    const info: AlignType & { offset: number[] } = {
      points: template,
      offset: [0, 0],
      dynamicInset: true,
    };

    if (DISABLE_AUTO_ARROW.has(key)) {
      info.autoArrow = false;
    }

    switch (key) {
      case 'top':
      case 'topLeft':
      case 'topRight':
        info.offset[1] = -halfArrowWidth - offset;
        break;
      case 'bottom':
      case 'bottomLeft':
      case 'bottomRight':
        info.offset[1] = halfArrowWidth + offset;
        break;
      case 'left':
      case 'leftTop':
      case 'leftBottom':
        info.offset[0] = -halfArrowWidth - offset;
        break;
      case 'right':
      case 'rightTop':
      case 'rightBottom':
        info.offset[0] = halfArrowWidth + offset;
        break;
      default:
        break;
    }

    // 箭头指向中心时，角 placement 需要额外的横向/纵向补偿
    if (arrowPointAtCenter) {
      switch (key) {
        case 'topLeft':
        case 'bottomLeft':
          info.offset[0] = -arrowOffset.arrowOffsetHorizontal - halfArrowWidth;
          break;
        case 'topRight':
        case 'bottomRight':
          info.offset[0] = arrowOffset.arrowOffsetHorizontal + halfArrowWidth;
          break;
        case 'leftTop':
        case 'rightTop':
          info.offset[1] = -arrowOffset.arrowOffsetHorizontal * 2 + halfArrowWidth;
          break;
        case 'leftBottom':
        case 'rightBottom':
          info.offset[1] = arrowOffset.arrowOffsetHorizontal * 2 - halfArrowWidth;
          break;
        default:
          break;
      }
    }

    info.overflow = getOverflowOptions(key, arrowWidth, borderRadius, autoAdjustOverflow);
    if (visibleFirst) {
      info.htmlRegion = 'visibleFirst';
    }

    result[key] = info;
  }

  return result;
}
