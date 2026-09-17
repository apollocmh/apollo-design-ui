/**
 * 10 阶色板生成 —— `@ant-design/colors` 的 `generate()` 的**等价实现**。
 *
 * 为什么自己实现（ARCHITECTURE.md R7）：发布包运行时不得依赖 `@ant-design/*`。
 * 为什么不用别的颜色库替代：色板梯度是 Token 的像素级判据，两个实现来源
 * 等于两套舍入行为。这里做的是**移植**，每个常数都与上游逐一对齐，
 * 并由 `color.oracle.test.ts` 对上游做差分验证。
 *
 * 算法形状（与上游一致，不是我们的设计）：
 *   10 档 = 主色上方 5 档（更浅）+ 主色本体 + 主色下方 4 档（更深）。
 *   每一档在 HSV 空间独立移动色相 / 饱和度 / 明度，步长是常数，
 *   其中「色相往哪边转」取决于主色色相是否落在 [60, 240]。
 *
 * ⚠️ 三处容易被"顺手修正"成看起来更合理、但会改变取值的地方：
 *   1. `getSaturation` 的灰特判是 `h === 0 && s === 0`（**同时**为 0），不是 `s === 0`
 *   2. 饱和度下限 0.06 是在**所有**分支之后统一施加的，包括灰特判的早退分支之外
 *   3. 第 1 档（`i === 5` 的浅色）额外有 0.1 的上限，只在浅色侧生效
 */

import { Color } from './color';

const HUE_STEP = 2;
/** 浅色侧的饱和度步长（递减）。 */
const SATURATION_STEP_LIGHT = 0.16;
/** 深色侧的饱和度步长（递增），最后一档例外。 */
const SATURATION_STEP_DARK = 0.05;
/** 浅色侧的明度步长（递增）。 */
const BRIGHTNESS_STEP_LIGHT = 0.05;
/** 深色侧的明度步长（递减）。 */
const BRIGHTNESS_STEP_DARK = 0.15;
const LIGHT_COUNT = 5;
const DARK_COUNT = 4;

/**
 * 暗色主题的取档表：`[取第几档, 与背景混合的百分比]`。
 *
 * 注意 index 是**降序**的（7 → 1），而 amount 是升序的（15 → 98）：
 * 暗色下越深的档位越接近纯背景色。
 */
const DARK_COLOR_MAP: ReadonlyArray<readonly [index: number, amount: number]> = [
  [7, 15],
  [6, 25],
  [5, 30],
  [5, 45],
  [5, 65],
  [5, 85],
  [4, 90],
  [3, 95],
  [2, 97],
  [1, 98],
];

/** 色相偏移。落在 [60, 240]（青—蓝—紫）时浅色侧往**减**方向转，其余往**加**方向转。 */
function getHue(hue: number, i: number, light: boolean): number {
  const base = Math.round(hue);
  let next =
    base >= 60 && base <= 240
      ? light
        ? base - HUE_STEP * i
        : base + HUE_STEP * i
      : light
        ? base + HUE_STEP * i
        : base - HUE_STEP * i;
  if (next < 0) {
    next += 360;
  } else if (next >= 360) {
    next -= 360;
  }
  return next;
}

/** 饱和度。灰（h 与 s 同时为 0）不参与调整。 */
function getSaturation(hue: number, saturation: number, i: number, light: boolean): number {
  if (hue === 0 && saturation === 0) {
    return saturation;
  }

  let next: number;
  if (light) {
    next = saturation - SATURATION_STEP_LIGHT * i;
  } else if (i === DARK_COUNT) {
    next = saturation + SATURATION_STEP_LIGHT;
  } else {
    next = saturation + SATURATION_STEP_DARK * i;
  }

  if (next > 1) {
    next = 1;
  }
  // 最浅一档的饱和度额外封顶，避免浅色发灰发脏。
  if (light && i === LIGHT_COUNT && next > 0.1) {
    next = 0.1;
  }
  if (next < 0.06) {
    next = 0.06;
  }
  return Math.round(next * 100) / 100;
}

/** 明度。 */
function getValue(value: number, i: number, light: boolean): number {
  const next = light ? value + BRIGHTNESS_STEP_LIGHT * i : value - BRIGHTNESS_STEP_DARK * i;
  return Math.round(Math.max(0, Math.min(1, next)) * 100) / 100;
}

/**
 * 生成选项。
 *
 * ⚠️ 暗色下的 `backgroundColor` 是**必填**的，这是一个刻意的设计差异：
 *   上游 `generate(color, { theme: 'dark' })` 把它默认成一个硬编码的色值。
 *   那个色值属于**设计值**，放在 L0 的通用工具包里违反 R3（L0 不出现色值字面量），
 *   所以这里不提供默认值，改由拥有设计值的 `theme` 传入。
 *
 *   用可辨识联合而不是「可选 + 运行时报错」：调用方漏传时在**编译期**就红，
 *   而不是等某条暗色路径被走到才炸。
 */
export type GenerateOptions =
  | {
      /** 亮色（默认）。返回未经混合的 10 阶色板。 */
      theme?: 'default';
    }
  | {
      /** 暗色。把亮色色板再与 `backgroundColor` 按比例混合。 */
      theme: 'dark';
      /** 混合背景色。由 `theme` 提供（见上）。 */
      backgroundColor: string;
    };

/**
 * 由一个基色生成 10 阶色板，索引 0 最浅、9 最深，索引 5 是**基色本体**。
 *
 * @example generatePalette('#1677ff')
 * // ['#e6f4ff', '#bae0ff', '#91caff', '#69b1ff', '#4096ff',
 * //  '#1677ff', '#0958d9', '#003eb3', '#002c8c', '#001d66']
 */
export function generatePalette(color: string, opts: GenerateOptions = {}): string[] {
  const base = new Color(color);
  const { h, s, v } = base.toHsv();
  const patterns: Color[] = [];

  for (let i = LIGHT_COUNT; i > 0; i -= 1) {
    patterns.push(
      new Color({
        h: getHue(h, i, true),
        s: getSaturation(h, s, i, true),
        v: getValue(v, i, true),
      }),
    );
  }
  patterns.push(base);
  for (let i = 1; i <= DARK_COUNT; i += 1) {
    patterns.push(
      new Color({
        h: getHue(h, i, false),
        s: getSaturation(h, s, i, false),
        v: getValue(v, i, false),
      }),
    );
  }

  if (opts.theme === 'dark') {
    const background = new Color(opts.backgroundColor);
    return DARK_COLOR_MAP.map(([index, amount]) => {
      const pattern = patterns[index];
      return background.mix(pattern ?? base, amount).toHexString();
    });
  }

  return patterns.map((c) => c.toHexString());
}
