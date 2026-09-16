import { generate } from '@ant-design/colors';
import { PresetColors } from '../seed';
import genColorMapToken from '../shared/color-map-token';
import type { MapToken, PresetColorKey, SeedToken } from '../types';
import defaultAlgorithm from './default';
import {
  generateColorPalettesDark,
  generateNeutralColorPalettesDark,
  genPresetColorPalettes,
} from './palettes';

/**
 * 暗色派生算法。
 *
 * 与 default 的关键差异（每一条都影响取值，不能省）：
 *  1. 功能色用 `generate(base, { theme: 'dark' })`，且 5/6/7 档反转
 *  2. 中性色的默认基色是 #000 / #fff，且用 lighten 而不是 darken
 *  3. 预设色的 Hover/Active **对调**：Hover 取第 7 档、Active 取第 5 档（亮色是 5/7）
 *  4. `colorPrimaryBg` / `colorPrimaryBgHover` 被覆写为 Border 档位
 *     （antd issue #30524：暗色下选中的背景色要更实）
 *
 * `mapToken` 为 undefined 时自己先跑一遍 default —— 这是 `Theme.getDerivativeToken`
 * reduce 的第一步，保证 dark 可以单独使用也能作为链首。
 */
export default function darkAlgorithm(token: SeedToken, mapToken?: MapToken): MapToken {
  // 第三个参数 false = 不用 presetPalettes 快路径（见 palettes.ts 的说明）
  const colorPalettes = genPresetColorPalettes(
    token as unknown as Record<PresetColorKey, string>,
    (base) => generate(base, { theme: 'dark' }),
    false,
  );

  const mergedMapToken = mapToken ?? defaultAlgorithm(token);

  const colorMapToken = genColorMapToken(token, {
    generateColorPalettes: generateColorPalettesDark,
    generateNeutralColorPalettes: generateNeutralColorPalettesDark,
  });

  // 暗色下 Hover 比 Active 更深（与亮色相反）
  const presetColorHoverActiveTokens: Record<string, string> = {};
  for (const colorKey of PresetColors) {
    const colorBase = token[colorKey];
    if (colorBase) {
      const colorPalette = generateColorPalettesDark(colorBase);
      presetColorHoverActiveTokens[`${colorKey}Hover`] = colorPalette[7];
      presetColorHoverActiveTokens[`${colorKey}Active`] = colorPalette[5];
    }
  }

  return {
    ...mergedMapToken,
    ...colorPalettes,
    ...colorMapToken,
    ...presetColorHoverActiveTokens,
    colorPrimaryBg: colorMapToken.colorPrimaryBorder,
    colorPrimaryBgHover: colorMapToken.colorPrimaryBorderHover,
  };
}
