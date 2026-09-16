import { FastColor } from '@ant-design/fast-color';
import { PresetColors } from '../seed';
import type {
  ColorMapToken,
  ColorNeutralMapToken,
  ColorPalette,
  PresetColorKey,
  SeedToken,
} from '../types';

/** 中性色派生的签名。default 与 dark 各实现一份。 */
export type GenerateNeutralColorPalettes = (
  bgBaseColor: string,
  textBaseColor: string,
  shadowColor?: string,
) => ColorNeutralMapToken;

/**
 * 由 Seed 派生全部功能色与中性色。
 *
 * `generateColorPalettes` / `generateNeutralColorPalettes` 由具体算法（default / dark）注入。
 * 这个「注入」不是过度设计：dark 与 default 的**取档顺序不同**（dark 的 5/6/7 是 6/5/4），
 * 且中性色的默认值与公式都不同。抽出来才保证两者共用同一套键集合。
 */
export default function genColorMapToken(
  seed: SeedToken,
  options: {
    generateColorPalettes: (baseColor: string) => ColorPalette;
    generateNeutralColorPalettes: GenerateNeutralColorPalettes;
  },
): ColorMapToken {
  const {
    colorSuccess: colorSuccessBase,
    colorWarning: colorWarningBase,
    colorError: colorErrorBase,
    colorInfo: colorInfoBase,
    colorPrimary: colorPrimaryBase,
    colorBgBase,
    colorTextBase,
  } = seed;

  const primaryColors = options.generateColorPalettes(colorPrimaryBase);
  const successColors = options.generateColorPalettes(colorSuccessBase);
  const warningColors = options.generateColorPalettes(colorWarningBase);
  const errorColors = options.generateColorPalettes(colorErrorBase);
  const infoColors = options.generateColorPalettes(colorInfoBase);
  const neutralColors = options.generateNeutralColorPalettes(colorBgBase, colorTextBase);

  // colorLink 为空串时回落到 colorInfo —— 空串 seed 值是有意义的分支，不能改成默认值合并
  const colorLink = seed.colorLink || seed.colorInfo;
  const linkColors = options.generateColorPalettes(colorLink);

  const colorErrorBgFilledHover = new FastColor(errorColors[1])
    .mix(new FastColor(errorColors[3]), 50)
    .toHexString();

  // 断言一次性建立空对象：13 个预设色在 defaultSeedToken 里**恒有值**，
  // 所以这两组键一定会被填满。用 Record<string,string> 会让下面的展开丢掉
  // `blueHover` 等具体键，编译期就通不过 —— 这个断言就是那条约束的落点。
  type PresetStateKey = `${PresetColorKey}Hover` | `${PresetColorKey}Active`;
  const presetColorTokens = {} as Record<PresetStateKey, string>;
  for (const colorKey of PresetColors) {
    const colorBase = seed[colorKey];
    if (colorBase) {
      const colorPalette = options.generateColorPalettes(colorBase);
      presetColorTokens[`${colorKey}Hover`] = colorPalette[5];
      presetColorTokens[`${colorKey}Active`] = colorPalette[7];
    }
  }

  return {
    ...neutralColors,
    colorPrimaryBg: primaryColors[1],
    colorPrimaryBgHover: primaryColors[2],
    colorPrimaryBorder: primaryColors[3],
    colorPrimaryBorderHover: primaryColors[4],
    colorPrimaryHover: primaryColors[5],
    colorPrimary: primaryColors[6],
    colorPrimaryActive: primaryColors[7],
    colorPrimaryTextHover: primaryColors[8],
    colorPrimaryText: primaryColors[9],
    colorPrimaryTextActive: primaryColors[10],
    colorSuccessBg: successColors[1],
    colorSuccessBgHover: successColors[2],
    colorSuccessBorder: successColors[3],
    colorSuccessBorderHover: successColors[4],
    // ⚠️ 注意：success / warning / info 的 Hover 取的是第 4 档，不是第 5 档。
    // 只有 primary 与 error 用第 5 档。这是 antd 的实际取值，看起来像笔误但必须照抄。
    colorSuccessHover: successColors[4],
    colorSuccess: successColors[6],
    colorSuccessActive: successColors[7],
    colorSuccessTextHover: successColors[8],
    colorSuccessText: successColors[9],
    colorSuccessTextActive: successColors[10],
    colorErrorBg: errorColors[1],
    colorErrorBgHover: errorColors[2],
    colorErrorBgFilledHover,
    colorErrorBgActive: errorColors[3],
    colorErrorBorder: errorColors[3],
    colorErrorBorderHover: errorColors[4],
    colorErrorHover: errorColors[5],
    colorError: errorColors[6],
    colorErrorActive: errorColors[7],
    colorErrorTextHover: errorColors[8],
    colorErrorText: errorColors[9],
    colorErrorTextActive: errorColors[10],
    colorWarningBg: warningColors[1],
    colorWarningBgHover: warningColors[2],
    colorWarningBorder: warningColors[3],
    colorWarningBorderHover: warningColors[4],
    colorWarningHover: warningColors[4],
    colorWarning: warningColors[6],
    colorWarningActive: warningColors[7],
    colorWarningTextHover: warningColors[8],
    colorWarningText: warningColors[9],
    colorWarningTextActive: warningColors[10],
    colorInfoBg: infoColors[1],
    colorInfoBgHover: infoColors[2],
    colorInfoBorder: infoColors[3],
    colorInfoBorderHover: infoColors[4],
    colorInfoHover: infoColors[4],
    colorInfo: infoColors[6],
    colorInfoActive: infoColors[7],
    colorInfoTextHover: infoColors[8],
    colorInfoText: infoColors[9],
    colorInfoTextActive: infoColors[10],
    colorLinkHover: linkColors[4],
    colorLink: linkColors[6],
    colorLinkActive: linkColors[7],
    ...presetColorTokens,
    colorBgMask: new FastColor('#000').setA(0.45).toRgbString(),
    colorWhite: '#fff',
  };
}
