/**
 * oracle.js 的类型声明。
 *
 * 为什么单独放一个 .d.ts：oracle.js 是**刻意保留的 JS**（它逐字复刻 antd 的实现，
 * 连可变状态与求值顺序都不许动，不参与生产构建）。但 diff 测试在 TS 里调用它，
 * 没有声明会退化成 implicit any —— 而本项目开了 `strict`，那是一个硬错误。
 *
 * 这里只声明**签名**，不声明实现，避免有人误以为它是受支持的公共 API。
 */

import type { AlignType, Area, FlipMemory, Rect } from '../types';

export interface OracleInput {
  target: Rect;
  popup: Rect;
  visible: Area;
  scroll: Area;
  align: AlignType;
  flip?: Partial<FlipMemory>;
  scaleX?: number;
  scaleY?: number;
  /**
   * false（默认）= 逐字复刻 antd，含 `Math.max(0, w * h)` 的缺陷；
   * true = 改用逐轴夹取，与本项目 `getIntersectionArea` 一致。
   */
  clampIntersection?: boolean;
}

export interface OracleResult {
  offsetX: number;
  offsetY: number;
  arrowX: number;
  arrowY: number;
  points: [string, string];
  flip: FlipMemory;
}

export function alignOracle(input: OracleInput): OracleResult;
