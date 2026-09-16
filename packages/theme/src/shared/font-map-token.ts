import type { FontMapToken } from '../types';
import genFontSizes from './font-sizes';

/**
 * 由基础字号派生 17 个字体 Map Token。
 *
 * 注意 `fontSizeXL` 与 `fontSizeHeading4` 同值（都取 fontSizes[3]）、
 * `fontSizeLG` 与 `fontSizeHeading5` 同值（fontSizes[2]）—— 这不是笔误，
 * antd 就是这么定义的，改成不同的值会让 DOM 契约与视觉基线同时漂移。
 */
export default function genFontMapToken(fontSize: number): FontMapToken {
  const p = genFontSizes(fontSize);

  const fontSizeSM = p[0].size;
  const fontSizeMD = p[1].size;
  const fontSizeLG = p[2].size;
  const lineHeight = p[1].lineHeight;
  const lineHeightSM = p[0].lineHeight;
  const lineHeightLG = p[2].lineHeight;

  return {
    fontSizeSM,
    fontSize: fontSizeMD,
    fontSizeLG,
    fontSizeXL: p[3].size,
    fontSizeHeading1: p[6].size,
    fontSizeHeading2: p[5].size,
    fontSizeHeading3: p[4].size,
    // ⚠️ heading4 与 XL 同值、heading5 与 LG 同值 —— antd 的冗余定义，不是笔误
    fontSizeHeading4: p[3].size,
    fontSizeHeading5: p[2].size,
    lineHeight,
    lineHeightLG,
    lineHeightSM,
    fontHeight: Math.round(lineHeight * fontSizeMD),
    fontHeightLG: Math.round(lineHeightLG * fontSizeLG),
    fontHeightSM: Math.round(lineHeightSM * fontSizeSM),
    lineHeightHeading1: p[6].lineHeight,
    lineHeightHeading2: p[5].lineHeight,
    lineHeightHeading3: p[4].lineHeight,
    lineHeightHeading4: p[3].lineHeight,
    lineHeightHeading5: p[2].lineHeight,
  };
}
