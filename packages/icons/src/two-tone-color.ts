/**
 * TwoTone 调色板与全局双色 API。
 *
 * 契约来源：`@ant-design/icons` 的 `components/twoTonePrimaryColor.ts` +
 * `components/IconBaseTwoTone.ts`（模块级可变调色板）+ `colorUtils.ts`（副色派生）。
 *
 * 为什么副色是「派生」而不是另一个常量：
 *   `getSecondaryColor(primary)` 取 10 阶色板第 0 阶（最浅一档）。
 *   `#1677ff` → `#e6f4ff`。这正是 antd 的 TwoTone 图标默认观感的来源，
 *   换成任何"看起来差不多"的浅色都会让图标级像素比对失败。
 *
 * 🚨 R7：色板算法来自 `@apollo-design/utils` 的 `generatePalette`
 * （上游 `@ant-design/colors` 的 `generate()` 的移植，由 `color.oracle.test.ts`
 * 对上游做逐位差分验证）。本文件运行时不得 import `@ant-design/*`。
 */

import { generatePalette } from '@apollo-design/utils';

/** 双色图标的颜色。单值 = 主色（副色派生）；二元组 = `[主色, 副色]`。 */
export type TwoToneColor = string | [string, string];

/**
 * 默认主色。
 *
 * 这个值等于 `@ant-design/colors` 的 `blue.primary`，但**不是**从它读来的 ——
 * R7 禁止运行时依赖上游。它是一个被钉住的字面量，钉子在本包的
 * `__tests__/two-tone-color.oracle.test.ts`：那里用上游包断言
 * `DEFAULT_TWOTONE_COLOR === blue.primary`。上游若改了这个默认值，那里会红。
 */
export const DEFAULT_TWOTONE_COLOR: string = '#1677ff';

/**
 * `generatePalette()` 恒返回 10 个色值，但它的类型只是 `string[]`，
 * 在 `noUncheckedIndexedAccess` 下 `colors[0]` 是 `string | undefined`。
 *
 * 与 `packages/theme/src/algorithms/palettes.ts` 采用同一处理方式：在一处收成定长元组并注明依据，
 * 而不是把 `!` 散落到每个调用点（下一眼分不清是「知道不会空」还是「懒得处理」）。
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

/**
 * 由主色派生副色：取 10 阶色板最浅一阶。
 *
 * @example getSecondaryColor('#1677ff') === '#e6f4ff'
 */
export function getSecondaryColor(primaryColor: string): string {
  return (generatePalette(primaryColor) as unknown as Colors10)[0];
}

/** {@link setTwoToneColors} 的入参。 */
export interface TwoToneColorPaletteSetter {
  primaryColor: string;
  /** 省略时由 `primaryColor` 派生。 */
  secondaryColor?: string;
}

/** 调色板的完整状态。 */
export interface TwoToneColorPalette {
  primaryColor: string;
  secondaryColor: string;
  /** `true` 表示副色是**显式指定**的（而不是派生的）。决定 `getTwoToneColor()` 返回单值还是二元组。 */
  calculated: boolean;
}

/**
 * 模块级调色板。
 *
 * ⚠️ 这是**有意保留的可变模块状态**，不是疏忽：antd 的 `setTwoToneColor` 就是全局设置，
 *    语义上「整站默认双色」而不是「单个图标的 prop」。改成 provide/inject 会改变公开语义。
 */
const twoToneColorPalette: TwoToneColorPalette = {
  primaryColor: '#333',
  secondaryColor: '#E6E6E6',
  calculated: false,
};

/** 设置全局双色调色板。副色省略时按主色派生。 */
export function setTwoToneColors({
  primaryColor,
  secondaryColor,
}: TwoToneColorPaletteSetter): void {
  twoToneColorPalette.primaryColor = primaryColor;
  twoToneColorPalette.secondaryColor = secondaryColor || getSecondaryColor(primaryColor);
  twoToneColorPalette.calculated = !!secondaryColor;
}

/** 读取全局双色调色板的快照（拷贝，避免外部改写模块状态）。 */
export function getTwoToneColors(): TwoToneColorPalette {
  return { ...twoToneColorPalette };
}

/**
 * 把 `TwoToneColor` 归一化为数组。
 *
 * 与 antd 一致：空值 → 空数组；单值 → `[主色]`；二元组原样。
 */
export function normalizeTwoToneColors(twoToneColor: TwoToneColor | undefined): string[] {
  if (!twoToneColor) {
    return [];
  }
  return Array.isArray(twoToneColor) ? twoToneColor : [twoToneColor];
}

/**
 * 设置全局双色（公开 API，`@ant-design/icons` 同名导出）。
 *
 * @example
 * setTwoToneColor('#eb2f96');                 // 只给主色
 * setTwoToneColor(['#eb2f96', '#fff1f0']);    // 主色 + 副色
 */
export function setTwoToneColor(twoToneColor: TwoToneColor): void {
  const colors = normalizeTwoToneColors(twoToneColor);
  const primaryColor = colors[0];
  // 类型上不可达（`TwoToneColor` 非空时必有一项），但 `noUncheckedIndexedAccess` 要求显式收窄。
  if (primaryColor === undefined) return;
  setTwoToneColors({ primaryColor, secondaryColor: colors[1] });
}

/**
 * 读取全局双色（公开 API，`@ant-design/icons` 同名导出）。
 *
 * 与 antd 一致：**副色是派生的时候返回单值**，只有显式设过副色才返回二元组。
 * 这条很容易被"顺手统一成数组"改坏 —— `twoToneProbe` 基线钉住了它。
 */
export function getTwoToneColor(): TwoToneColor {
  const colors = getTwoToneColors();
  if (!colors.calculated) {
    return colors.primaryColor;
  }
  return [colors.primaryColor, colors.secondaryColor];
}

/**
 * 模块加载即写入默认色。
 *
 * antd 把这行放在 `AntdIcon.js` 里，靠"导入 barrel 必然经过 TwoTone 图标 → 经过 AntdIcon"生效。
 * 我们放在本模块：生成物是单文件 barrel，必然引入本模块，可观察行为一致；
 * 而放在这里的好处是「调色板与它的初始化」不会再被一次重构意外拆开。
 */
setTwoToneColor(DEFAULT_TWOTONE_COLOR);
