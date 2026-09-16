import type { HeightMapToken } from '../types';

/**
 * 由基础控件高度派生三档。
 *
 * 结果是**浮点数**（0.75 / 0.5 / 1.25 倍），不是取整后的整数 ——
 * antd 直接把它们写进 CSS，浏览器负责亚像素渲染。取整会改变视觉基线。
 */
export function genControlHeight(controlHeight: number): Omit<HeightMapToken, 'controlHeight'> {
  return {
    controlHeightSM: controlHeight * 0.75,
    controlHeightXS: controlHeight * 0.5,
    controlHeightLG: controlHeight * 1.25,
  };
}
