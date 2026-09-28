/**
 * Circle 的 SVG 计算内核 —— rc-progress 数学事实的自研实现（H5：不依赖
 * `@rc-component/progress`；规则从 antd 6.6.4 实测 DOM 逐值反推并写明来源）。
 *
 * ⚠️ 文件名是 `kernel.ts`：同目录已有 `Circle.ts`（组件），macOS 文件系统
 * 大小写不敏感（`circle.ts` 会被解析为同一文件，Circle.ts 期踩坑）。
 */

export const VIEW_BOX_SIZE = 100;

export interface CircleStackStyle {
  stroke?: string;
  strokeDasharray: string;
  strokeDashoffset: number;
  transform: string;
  transformOrigin: string;
  transition: string;
  fillOpacity: number;
}

/**
 * rc-progress `getCircleStyle` 的逐值复刻：
 *
 *   dasharray  = perimeterWithoutGap(px) + perimeter（第二段无 px，产物逐字）
 *   dashoffset = (100 - percent)/100 * perimeterWithoutGap
 *                + strokeWidth/2（round 圆头修正，ptg 不为 100 时）
 *                clamp 到 perimeterWithoutGap - 0.01
 *   rotate     = rotateDeg + offsetDeg + positionDeg
 */
export const getCircleStyle = (
  perimeter: number,
  perimeterWithoutGap: number,
  offset: number,
  percent: number,
  rotateDeg: number,
  gapDegree: number,
  gapPosition: 'top' | 'bottom' | 'left' | 'right' | undefined,
  strokeColor: string | Record<string, string> | null,
  strokeLinecap: string,
  strokeWidth: number,
  stepSpace = 0,
): CircleStackStyle => {
  const offsetDeg = (offset / 100) * 360 * ((360 - gapDegree) / 360);
  const positionDeg =
    gapDegree === 0
      ? 0
      : (({ bottom: 0, top: 180, left: 90, right: -90 } as const)[
          gapPosition as 'top' | 'bottom' | 'left' | 'right'
        ] ?? 0);
  let strokeDashoffset = ((100 - percent) / 100) * perimeterWithoutGap;
  // Fix percent accuracy when strokeLinecap is round（antd issue 35009）
  if (strokeLinecap === 'round' && percent !== 100) {
    strokeDashoffset += strokeWidth / 2;
    if (strokeDashoffset >= perimeterWithoutGap) {
      strokeDashoffset = perimeterWithoutGap - 0.01;
    }
  }
  const halfSize = VIEW_BOX_SIZE / 2;
  return {
    stroke: typeof strokeColor === 'string' ? strokeColor : undefined,
    strokeDasharray: `${perimeterWithoutGap}px ${perimeter}`,
    strokeDashoffset: strokeDashoffset + stepSpace,
    transform: `rotate(${rotateDeg + offsetDeg + positionDeg}deg)`,
    transformOrigin: `${halfSize}px ${halfSize}px`,
    transition:
      'stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s, stroke-width .06s ease .3s, opacity .3s ease 0s',
    fillOpacity: 0,
  };
};

/** rc-progress PtgCircle 的 gradient 站点：conic colors（% 键 → ptg）。 */
export const getPtgColors = (color: Record<string, string>, scale: number): string[] =>
  Object.keys(color).map((key) => {
    const parsedKey = Number.parseFloat(key);
    const ptgKey = `${Math.floor(parsedKey * scale)}%`;
    return `${color[key]} ${ptgKey}`;
  });
