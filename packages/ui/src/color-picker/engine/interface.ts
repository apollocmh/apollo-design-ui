/**
 * `@rc-component/color-picker` 的类型面（G2 产物）。
 *
 * 契约来源：`node_modules/@rc-component/color-picker/es/interface.d.ts`
 * —— **重新定义**（H2），逐字段对齐，不做搬运。
 *
 * ⚠️ **这一层为什么落在 `ui/color-picker/engine/` 而不是 foundation**：
 * registry 的 `dependencies.json` 里 `@rc-component/color-picker` 的
 * `strategy` 是 **`in-ui`**、`target` 就是本目录（见 `docs/analysis/color-picker.md` §4.1）。
 * rc 那一层本来就归 ui。
 *
 * ── 与上游的三处**有意**差异 ──────────────────────────────────────────────────
 *
 * 1. `ColorGenInput` 的默认类型参数是**本仓引擎的 `Color`**（上游是 rc 的 `Color`）。
 * 2. 上游 `BaseColorPickerProps['onChange']` 的第二个参数是匿名对象
 *    `{ type?, value? }`；这里给了它一个名字 `ColorPickerInfo`（同名结构，无行为差异）。
 * 3. 通道类型保留 `number | string`（上游如此）。**字符串通道**在两条实现里都被
 *    算术隐式转成数字（`'120' % 360 === 120`），所以行为一致 —— 但类型上必须
 *    显式收窄一次，落点见 `engine/color.ts` 的 `convertHsb2Hsv`。
 */

import type { Color } from './color';

/** HSB（= HSV 的别名记法）。`h` 是角度，`s` / `b` 是 0–1 的比例。 */
export interface HSB {
  h: number | string;
  s: number | string;
  b: number | string;
}

/** RGB 记法。通道 0–255。 */
export interface RGB {
  r: number | string;
  g: number | string;
  b: number | string;
}

/** 带 alpha 的 HSB。`a` 恒是 0–1 的**数字**（上游把 `a` 排除在 `number | string` 之外）。 */
export interface HSBA extends HSB {
  a: number;
}

/** 带 alpha 的 RGB。同上。 */
export interface RGBA extends RGB {
  a: number;
}

/** 引擎能接受的全部颜色输入。 */
export type ColorGenInput<T = Color> = string | number | RGB | RGBA | HSB | HSBA | T;

/** HSV 记法（= `HSB` 的等价形态，只是把 `b` 写成 `v`）。 */
export interface HSV {
  h: number | string;
  s: number | string;
  v: number | string;
}

/** 带 alpha 的 HSV。 */
export interface HSVA extends HSV {
  a: number;
}

/**
 * **构造器**接受的输入面。
 *
 * ⚠️ 比 `ColorGenInput` 多出 `HSV` / `HSVA` 是**必需的**，不是宽松：
 * 上游 `FastColor.setHue` 的实现是
 * `const hsv = this.toHsv(); hsv.h = value; return this._c(hsv)` ——
 * 它把 `toHsv()` 的结果（**带 `v` 不带 `b`**）**直接回传构造器**。
 * 上游的 `ColorGenInput` 只声明了 `HSB`，靠 `FastColor` 的运行时分支兜底
 * （`matchFormat('hsv')` 那一支）；这里把这条真实路径显式写进类型。
 */
export type ColorConstructorInput = ColorGenInput | HSV | HSVA;

/** 拖拽产生的两种「单一通道」变化。 */
export type HsbaColorType = 'hue' | 'alpha';

/** 手柄相对容器左上角的**像素**偏移（不是百分比）。 */
export interface TransformOffset {
  x: number;
  y: number;
}

/** 引擎 `onChange` / `onChangeComplete` 的第二个参数。 */
export interface ColorPickerInfo {
  type?: HsbaColorType;
  value?: number;
}

/** 引擎组件（`Picker` / `Slider` / `ColorPicker`）的公共 props。 */
export interface BaseColorPickerProps {
  color?: Color;
  prefixCls?: string;
  disabled?: boolean;
  onChange?: (color: Color, info?: ColorPickerInfo) => void;
  onChangeComplete?: (value: Color, info?: ColorPickerInfo) => void;
}
