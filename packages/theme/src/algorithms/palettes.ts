import { Color, generatePalette } from '@apollo-design/utils';
import { DARK_PALETTE_BASE, defaultPresetColors } from '../seed';
import type { ColorNeutralMapToken, ColorPalette, PresetColorKey } from '../types';

/**
 * 🚨 R7：本文件运行时**不得** import `@ant-design/*`。
 *
 * 色板算法用 `@apollo-design/utils` 的 `generatePalette`（上游 `generate()` 的移植，
 * 由 `color.oracle.test.ts` 对上游做逐位差分验证），颜色运算用同包的 `Color`。
 * 这两个符号是 `theme` 与 `icons` 共用的唯一颜色来源。
 */

/**
 * `generatePalette()` 恒返回 10 个色值，但它的类型只是 `string[]`，
 * 在 `noUncheckedIndexedAccess` 下 `colors[0]` 是 `string | undefined`。
 *
 * 这里收成定长元组，让下游的 `colors[6]` 拿到 `string` 而不是 `string | undefined`。
 * 用断言而不是 `!`：断言集中在一处且有注释说明依据，而 `!` 会散落到每个调用点、
 * 下一眼看上去分不清是"知道不会空"还是"懒得处理"。
 */
type Colors10 = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/** 亮色：baseColor 变暗 brightness 个亮度单位 */
export const getSolidColor = (baseColor: string, brightness: number): string =>
  new Color(baseColor).darken(brightness).toHexString();

/** 暗色：baseColor 变亮 brightness 个亮度单位 */
export const getSolidColorDark = (baseColor: string, brightness: number): string =>
  new Color(baseColor).lighten(brightness).toHexString();

/** 取带 alpha 的 rgb 字符串 */
export const getAlphaColor = (baseColor: string, alpha: number): string =>
  new Color(baseColor).setAlpha(alpha).toRgbString();

/**
 * 亮色色板：10 档取 generate() 的前 7 档，8/9/10 复用 4/5/6。
 *
 * 即 `8 → colors[4]`、`9 → colors[5]`、`10 → colors[6]` —— 与 5/6/7 重复。
 * 这是 antd 的取值（最深的几档不区分 Hover / Active / Text），照抄。
 */
export const generateColorPalettes = (baseColor: string): ColorPalette => {
  const colors = generatePalette(baseColor) as unknown as Colors10;
  return {
    1: colors[0],
    2: colors[1],
    3: colors[2],
    4: colors[3],
    5: colors[4],
    6: colors[5],
    7: colors[6],
    8: colors[4],
    9: colors[5],
    10: colors[6],
  };
};

/**
 * 暗色色板：generate(baseColor, { theme: 'dark' })，且 5/6/7 与 8/9/10 的取档顺序**反过来**。
 *
 * 5 → colors[6]、6 → colors[5]、7 → colors[4]（亮色是 5→4、6→5、7→6）。
 * 这个反转是暗色主题的核心：暗背景下「越深」的档位语义对调。
 */
export const generateColorPalettesDark = (baseColor: string): ColorPalette => {
  const colors = generatePalette(baseColor, {
    theme: 'dark',
    backgroundColor: DARK_PALETTE_BASE,
  }) as unknown as Colors10;
  return {
    1: colors[0],
    2: colors[1],
    3: colors[2],
    4: colors[3],
    5: colors[6],
    6: colors[5],
    7: colors[4],
    8: colors[6],
    9: colors[5],
    10: colors[4],
  };
};

/** 亮色中性色。空串入参落到 #fff / #000 —— 这是 Seed 默认值的真实分支。 */
export const generateNeutralColorPalettes = (
  bgBaseColor: string,
  textBaseColor: string,
  shadowColor?: string,
): ColorNeutralMapToken => {
  const colorBgBase = bgBaseColor || '#fff';
  const colorTextBase = textBaseColor || '#000';
  const colorShadow = shadowColor || '#000';
  return {
    colorBgBase,
    colorTextBase,
    colorShadow,
    colorText: getAlphaColor(colorTextBase, 0.88),
    colorTextSecondary: getAlphaColor(colorTextBase, 0.65),
    colorTextTertiary: getAlphaColor(colorTextBase, 0.45),
    colorTextQuaternary: getAlphaColor(colorTextBase, 0.25),
    colorFill: getAlphaColor(colorTextBase, 0.15),
    colorFillSecondary: getAlphaColor(colorTextBase, 0.06),
    colorFillTertiary: getAlphaColor(colorTextBase, 0.04),
    colorFillQuaternary: getAlphaColor(colorTextBase, 0.02),
    colorBgSolid: getAlphaColor(colorTextBase, 1),
    colorBgSolidHover: getAlphaColor(colorTextBase, 0.75),
    colorBgSolidActive: getAlphaColor(colorTextBase, 0.95),
    colorBgLayout: getSolidColor(colorBgBase, 4),
    colorBgContainer: getSolidColor(colorBgBase, 0),
    colorBgElevated: getSolidColor(colorBgBase, 0),
    colorBgSpotlight: getAlphaColor(colorTextBase, 0.85),
    colorBgBlur: 'transparent',
    colorBorder: getSolidColor(colorBgBase, 15),
    colorBorderDisabled: getSolidColor(colorBgBase, 15),
    colorBorderSecondary: getSolidColor(colorBgBase, 6),
  };
};

/** 暗色中性色。默认值是 #000 / #fff，且用 lighten 而不是 darken。 */
export const generateNeutralColorPalettesDark = (
  bgBaseColor: string,
  textBaseColor: string,
  shadowColor?: string,
): ColorNeutralMapToken => {
  const colorBgBase = bgBaseColor || '#000';
  const colorTextBase = textBaseColor || '#fff';
  const colorShadow = shadowColor || 'rgba(255, 255, 255, 0.2)';
  return {
    colorBgBase,
    colorTextBase,
    colorShadow,
    colorText: getAlphaColor(colorTextBase, 0.85),
    colorTextSecondary: getAlphaColor(colorTextBase, 0.65),
    colorTextTertiary: getAlphaColor(colorTextBase, 0.45),
    colorTextQuaternary: getAlphaColor(colorTextBase, 0.25),
    colorFill: getAlphaColor(colorTextBase, 0.18),
    colorFillSecondary: getAlphaColor(colorTextBase, 0.12),
    colorFillTertiary: getAlphaColor(colorTextBase, 0.08),
    colorFillQuaternary: getAlphaColor(colorTextBase, 0.04),
    colorBgSolid: getAlphaColor(colorTextBase, 0.95),
    colorBgSolidHover: getAlphaColor(colorTextBase, 1),
    colorBgSolidActive: getAlphaColor(colorTextBase, 0.9),
    colorBgElevated: getSolidColorDark(colorBgBase, 12),
    colorBgContainer: getSolidColorDark(colorBgBase, 8),
    colorBgLayout: getSolidColorDark(colorBgBase, 0),
    colorBgSpotlight: getSolidColorDark(colorBgBase, 26),
    colorBgBlur: getAlphaColor(colorTextBase, 0.04),
    colorBorder: getSolidColorDark(colorBgBase, 26),
    colorBorderDisabled: getSolidColorDark(colorBgBase, 26),
    colorBorderSecondary: getSolidColorDark(colorBgBase, 19),
  };
};

/**
 * 展开 13 个预设色的色板，产出 `blue-1`…`blue-10` 与 `blue1`…`blue10` 两套键。
 *
 * 两套键值相同、都是 antd 的对外契约（历史原因），不能只产一套。
 *
 * ⚠️ 上游在这里有一条「预设色快路径」：seed 恰好等于预设主色时直接查
 * `presetPalettes` 表，跳过 `generate()`。我们**去掉了这条分支**，因为它在 R7 下
 * 已经没有存在的理由，而且去掉不改变任何取值：
 *
 *   1. 实测 13 个预设色，`generate(预设主色)` 与 `presetPalettes[同名]` **逐位相同**
 *      （0 处差异）—— 快路径省的是一次计算，不是一次近似；
 *   2. 那张表是 `@ant-design/colors` 的数据，运行时依赖它违反 R7；
 *   3. 顺带消掉了上游那处 `presetPrimaryColors.pink = magenta` 的**就地赋值**
 *      （为废弃名 pink 补条目），本函数因此是纯函数，不再污染导入的模块。
 *
 * 取而代之的护栏是「亮色/暗色由调用方显式传入 generateFn 决定」——
 * 旧版曾把快路径误套到 dark 上，导致 `gold-10` 拿到亮色值（#faedb5 而非 #613400）。
 * 现在这条路径不存在了，对应的回归断言在 `__tests__/palettes.test.ts`。
 */
export function genPresetColorPalettes(
  seed: Record<PresetColorKey, string>,
  generateFn: (baseColor: string) => string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const colorKey of Object.keys(defaultPresetColors) as PresetColorKey[]) {
    const colors = generateFn(seed[colorKey]) as unknown as Colors10;

    // 解构成元组再遍历：`colors[i]`（i 是 number）在 noUncheckedIndexedAccess 下带 undefined，
    // 而解构出来的每一项都是确定的 string。
    const [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10] = colors;
    const ranked: ReadonlyArray<readonly [number, string]> = [
      [1, c1],
      [2, c2],
      [3, c3],
      [4, c4],
      [5, c5],
      [6, c6],
      [7, c7],
      [8, c8],
      [9, c9],
      [10, c10],
    ];
    for (const [rank, color] of ranked) {
      out[`${colorKey}-${rank}`] = color;
      out[`${colorKey}${rank}`] = color;
    }
  }
  return out;
}
