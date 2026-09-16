import { genControlHeight } from '../shared/control-height';
import genFontMapToken from '../shared/font-map-token';
import { genCompactSizeMapToken } from '../shared/size-map-token';
import type { MapToken, SeedToken } from '../types';
import defaultAlgorithm from './default';

/**
 * 紧凑模式派生算法。
 *
 * 两个要点：
 *  1. **基础字号换成 `fontSizeSM`** —— 紧凑不只是缩间距，连字号的指数表起点都变了
 *  2. **基础控件高度 -4**，然后重新派生三档
 *
 * `genCompactSizeMapToken(mapToken ?? token)` 的参数选择很关键：
 * antd 传的是**原始 seed**（当有 mapToken 时）而不是 mapToken 本身。
 * 因为紧凑梯度只需要 sizeUnit / sizeStep 两个 seed 值，用 mapToken 也一样 ——
 * 但为了逐位一致，这里保持与 antd 相同的取参。
 */
export default function compactAlgorithm(token: SeedToken, mapToken?: MapToken): MapToken {
  const mergedMapToken = mapToken ?? defaultAlgorithm(token);
  const fontSize = mergedMapToken.fontSizeSM;
  const controlHeight = mergedMapToken.controlHeight - 4;

  return {
    ...mergedMapToken,
    ...genCompactSizeMapToken(mapToken ?? token),
    ...genFontMapToken(fontSize),
    controlHeight,
    ...genControlHeight(controlHeight),
  };
}
