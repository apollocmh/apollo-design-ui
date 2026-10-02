/**
 * 引擎的 `Color` —— 在 `@apollo-design/utils` 的 `Color`（`FastColor` 的等价实现）
 * 之上，补齐 **rc 自己加的那几个方法**。
 *
 * ── 为什么是「子类」而不是「扩 utils」（G1 的裁决，有证据）──────────────────────
 *
 * 1. registry 的 `dependencies.json` 把 `@rc-component/color-picker` 判为 **`in-ui`**，
 *    `target` 就是本目录 ⇒ rc 那一层归 ui。
 * 2. `toHsb` / `toHsbString` **不是 `FastColor` 的方法**（实测 `FastColor.js` 的 API 表里
 *    没有它们），是 rc 的 `Color extends FastColor` 加的。而 `utils` 的 `Color` 文件头
 *    明说自己是「**`FastColor` 的等价实现**」—— 往里加 rc 的扩展会破坏那条等价声明。
 * 3. `setA` 不是缺口，本仓叫 `setAlpha`（`utils/src/color/color.ts`），只是改名。
 *
 * 取证命令：`grep -n "toHsb\|setHue" <rc>/es/color.js`、`grep -n "setHue" <fast-color>/es/FastColor.js`。
 *
 * ── 移植清单（三样，逐字对齐上游）──────────────────────────────────────────────
 *
 * | 来源 | 内容 |
 * |---|---|
 * | rc `color.js` | `convertHsb2Hsv`（构造归一）、`toHsb`、`toHsbString` |
 * | `FastColor.js` | `setHue`（`const hsv = this.toHsv(); hsv.h = value; return this._c(hsv)`） |
 *
 * ── 🚨 两条**必须自己补**的行为（照抄上游会丢）──────────────────────────────────
 *
 * 1. **`setAlpha` 必须返回引擎 `Color`**。`utils` 的 `setAlpha` 里 `new Color(...)`
 *    指的是**基类**（词法作用域）⇒ 直接用它会让 `AggregationColor.metaColor` 掉回基类，
 *    之后 `metaColor.toHsb()` **不存在**。上游靠 `_sc()` → `this.clone()` → `_c()`（按
 *    `this.constructor` 建实例）避免这一点，本仓靠覆写。
 * 2. **falsy 输入必须走「黑 + 不透明」**。上游 `FastColor` 的构造第一句是
 *    `if (!input) { … }`（保持初始值）⇒ `new Color('')` 是**黑色不透明**（不抛错）。
 *    而 `utils` 的 `Color` 对 `''` 会抛「无法解析颜色」。**这条是真路径**：
 *    `AggregationColor` 对空值就走 `new RcColor(isArray ? '' : color)`，
 *    而 `useModeColor` 里也有 `generateColor(mergedColor || '')`。
 *    所以构造函数的判据写成 `color ? convertHsb2Hsv(color) : undefined` ——
 *    它同时覆盖 `''` / `0` / `null` / `undefined`，与上游 `!input` **逐字等价**。
 */

import { Color as BaseColor, type ColorInput as BaseColorInput } from '@apollo-design/utils';
import type { ColorConstructorInput, HSB, HSBA } from './interface';

/** 上游 `getRoundNumber`（rc `color.js` 与 antd `util.ts` 各有一份，同式）。 */
export const getRoundNumber = (value: number): number => Math.round(Number(value || 0));

/**
 * hsb → hsv 的构造归一（rc `color.js` 逐字）。
 *
 * 三支：已是颜色实例 ⇒ 原样；对象带 `h` + `b` ⇒ 把 `b` 改名 `v`；
 * 字符串含 `hsb` ⇒ 换成 `hsv`。**其余原样返回**（含 `number`）。
 *
 * ⚠️ 返回类型收窄成基类的 `ColorInput` 时有一次 `as unknown as`：上游的 `HSB` 允许
 * **字符串通道**，而基类只声明数字。运行时行为一致（两条实现的通道运算都会隐式转数字），
 * 这里断言的是「同构」，不是「绕过类型」。
 */
function convertHsb2Hsv(color: ColorConstructorInput): BaseColorInput {
  if (color instanceof BaseColor) {
    return color;
  }
  if (color && typeof color === 'object' && 'h' in color && 'b' in color) {
    const { b, ...resets } = color as HSB;
    return { ...resets, v: b } as unknown as BaseColorInput;
  }
  if (typeof color === 'string' && /hsb/.test(color)) {
    return color.replace(/hsb/, 'hsv');
  }
  return color as unknown as BaseColorInput;
}

/**
 * 引擎颜色。
 *
 * 与基类的**唯一**语义差别就是上面那三样（`toHsb` / `toHsbString` / `setHue`）
 * 加上两条必须自己补的行为（`setAlpha` 的返回类型、falsy 输入）。
 */
export class Color extends BaseColor {
  constructor(color?: ColorConstructorInput) {
    // `color ? … : undefined` 等价于上游的 `if (!input) { … }`（保持初始值）：
    // 空串 / 0 / null / undefined 一律得到「黑 + 不透明」，而不是基类的抛错。
    super(color ? convertHsb2Hsv(color) : undefined);
  }

  /**
   * `hsb(h, s%, b%)` / `hsba(h, s%, b%, a)`。
   *
   * ⚠️ alpha 的位数是判据：`alpha === 0` 时 `toFixed(0)`（`hsba(0, 0%, 0%, 0)`），
   * 否则 `toFixed(2)`（`hsba(0, 0%, 0%, 0.50)`）。
   */
  toHsbString(): string {
    const hsb = this.toHsb();
    const saturation = getRoundNumber(Number(hsb.s) * 100);
    const lightness = getRoundNumber(Number(hsb.b) * 100);
    const hue = getRoundNumber(Number(hsb.h));
    const alpha = hsb.a;

    const hsbString = `hsb(${hue}, ${saturation}%, ${lightness}%)`;
    const hsbaString = `hsba(${hue}, ${saturation}%, ${lightness}%, ${alpha.toFixed(
      alpha === 0 ? 0 : 2,
    )})`;

    return alpha === 1 ? hsbString : hsbaString;
  }

  /** `{h, s, b, a}` —— 把基类 `toHsv()` 的 `v` 改名成 `b`。 */
  toHsb(): HSBA {
    const { v, ...resets } = this.toHsv();
    return { ...resets, b: v, a: this.a };
  }

  /**
   * 换色相（`FastColor.js` 的 `setHue` 逐字：`this._c(hsv)` 等价于 `new Color(hsv)`）。
   *
   * ⚠️ `hsv` 里带 `a`，构造时会被基类的 `{h,s,v,a}` 分支接住 —— 与上游一致。
   */
  setHue(value: number): Color {
    const hsv = this.toHsv();
    hsv.h = value;
    return new Color(hsv);
  }

  /**
   * 覆写 `clone` —— 只为**收窄返回类型**（基类的签名返回基类 `Color`，
   * 而 `AggregationColor` 的克隆路径要的是引擎 `Color`）。
   *
   * 语义与基类**逐字相同**：本类不可变，克隆就是自己。
   */
  override clone(): Color {
    return this;
  }

  /**
   * 换 alpha。**覆写基类**（理由见文件头第 1 条）：返回引擎 `Color`，不是基类 `Color`。
   *
   * 值的夹取交给基类构造（`clamp(a, 1)`），与基类 `setAlpha` 同值。
   */
  override setAlpha(alpha: number): Color {
    return new Color({ r: this.r, g: this.g, b: this.b, a: alpha });
  }
}
