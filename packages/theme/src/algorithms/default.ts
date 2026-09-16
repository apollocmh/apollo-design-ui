import { generate } from '@ant-design/colors';
import genColorMapToken from '../shared/color-map-token';
import { genCommonMapToken } from '../shared/common-map-token';
import { genControlHeight } from '../shared/control-height';
import genFontMapToken from '../shared/font-map-token';
import { genSizeMapToken } from '../shared/size-map-token';
import type { MapToken, PresetColorKey, SeedToken } from '../types';
import {
  generateColorPalettes,
  generateNeutralColorPalettes,
  genPresetColorPalettes,
} from './palettes';

/**
 * 默认（亮色）派生算法。
 *
 * 签名 `(token, mapToken)` 里的第二个参数在 default 上用不到
 * （default 永远是链首），但必须保留：三个算法共享 `MappingAlgorithm` 类型，
 * 由 `getDesignToken` 用 reduce 串联。
 */
export default function defaultAlgorithm(token: SeedToken): MapToken {
  const colorPalettes = genPresetColorPalettes(
    token as unknown as Record<PresetColorKey, string>,
    (base) => generate(base),
  );

  return {
    ...token,
    ...colorPalettes,
    ...genColorMapToken(token, {
      generateColorPalettes,
      generateNeutralColorPalettes,
    }),
    ...genFontMapToken(token.fontSize),
    ...genSizeMapToken(token),
    ...genControlHeight(token.controlHeight),
    ...genCommonMapToken(token),
  } as MapToken;
}
