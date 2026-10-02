/**
 * `AggregationColor` —— ColorPicker 的**公共值类型**（antd `es/color-picker/color.js`
 * 114 行的移植，H2：重新定义，不搬运）。
 *
 * 为什么需要它（而不是直接用引擎的 `Color`）：它多背了**两件引擎没有的事** ——
 * **渐变**（`colors`）与**已清空**（`cleared`）。`ColorPicker` 的 `value` / `onChange`
 * 的载荷就是它。
 *
 * ── 🚨 四条判据（写错必红）────────────────────────────────────────────────────
 *
 * 1. **「清空」不是 `null`，是 alpha=0 的颜色 + `cleared = true`**
 *    （`if (!color || (isArray && !this.colors))`）。这解释了 `allowClear` 的语义，
 *    也是 `ColorTrigger` 里 `color.cleared ? <ColorClear/> : <ColorBlock/>` 的判据。
 * 2. **`isGradient()` 要把 `cleared` 算进去**：`!!colors && !cleared` ——
 *    一个被清空的渐变**不是**渐变。
 * 3. **`getColors()` 对单色也返回数组**（`[{ color: this, percent: 0 }]`）——
 *    调用方（`PanelPicker`）拿它当统一入口，别在这里分叉。
 * 4. **`toHex()` 的 alpha 判据是 `metaColor.a < 1`**（取 8 位）——不是 `cleared`。
 */

import { Color as EngineColor } from './engine/color';
import type { ColorGenInput } from './engine/interface';

/**
 * 只留 hex 字符并截断。
 *
 * ⚠️ 正则的字符类是 `[^0-9a-f]`（**不是** `[^0-9a-fA-F]`）—— 上游用的是 `/gi`，
 * `i` 已经覆盖了大写。照抄，别"简化"。
 */
export const toHexFormat = (value?: string, alpha?: boolean): string =>
  value?.replace(/[^0-9a-f]/gi, '').slice(0, alpha ? 8 : 6) || '';

/** 空值 ⇒ 空串（与 `toHexFormat` 的差别只有这一条）。 */
export const getHex = (value?: string, alpha?: boolean): string =>
  value ? toHexFormat(value, alpha) : '';

/** 渐变的颜色段（与 antd 的 `GradientColor` 同形）。 */
export type GradientColor = {
  color: AggregationColor;
  percent: number;
}[];

/** 渐变输入的原始形态（`{ color, percent }[]`）。 */
export type Colors<T> = {
  color: ColorGenInput<T>;
  percent: number;
}[];

export class AggregationColor {
  /**
   * 底层颜色对象。
   *
   * 🚨 **必须是 `public`（不能用 `private`）** —— 2026-10-02 实测：
   * Vue 模板里读一个 `ComputedRef<AggregationColor>` 时，模板类型工具会过一遍
   * `UnwrapRef`，而它是**映射类型**（`{ [K in keyof T]: … }`）⇒ **只保留公开成员**
   * ⇒ 得到的是一个**结构类型**、丢掉了 `private` 字段 ⇒ 不再可赋值给 `AggregationColor`
   * （`TS2345: … is missing the following properties: metaColor, colors`）。
   * 于是「模板里把颜色传给 `getColorAlpha(color)` / 传给 `<ColorClear :value>`」全部报错。
   *
   * 换成公开字段后，结构类型与类**双向可赋值**，模板侧自然通过。
   * 语义上这两个字段仍是**内部实现**（外部只该用方法），用 `@internal` 标注。
   *
   * @internal
   */
  public metaColor: EngineColor;

  /** 渐变段；单色时为 `undefined`。 @internal */
  public colors: GradientColor | undefined;

  /** 是否已被「清空」（alpha 强制 0）。 */
  public cleared = false;

  constructor(color: ColorGenInput<AggregationColor> | Colors<AggregationColor>) {
    // 从另一个 AggregationColor 克隆（含渐变与 cleared）
    if (color instanceof AggregationColor) {
      this.metaColor = color.metaColor.clone();
      this.colors = color.colors?.map((info) => ({
        color: new AggregationColor(info.color),
        percent: info.percent,
      }));
      this.cleared = color.cleared;
      return;
    }

    const isArray = Array.isArray(color);

    if (isArray && color.length) {
      const colors: GradientColor = color.map(({ color: c, percent }) => ({
        color: new AggregationColor(c),
        percent,
      }));
      this.colors = colors;
      // ⚠️ 单色那一支也要能走通：空数组走 else（长度 0 ⇒ falsy）
      const first = colors[0];
      this.metaColor = new EngineColor(first?.color.metaColor);
    } else {
      // ⚠️ 数组但为空 ⇒ 传空串（上游 `isArray ? '' : color`）—— `new EngineColor('')`
      //    是「黑 + 不透明」（见 engine/color.ts 文件头第 2 条），随后被置成 alpha=0。
      this.metaColor = new EngineColor(isArray ? '' : color);
    }

    if (!color || (isArray && !this.colors)) {
      this.metaColor = this.metaColor.setAlpha(0);
      this.cleared = true;
    }
  }

  toHsb() {
    return this.metaColor.toHsb();
  }

  toHsbString() {
    return this.metaColor.toHsbString();
  }

  toHex() {
    return getHex(this.toHexString(), this.metaColor.a < 1);
  }

  toHexString() {
    return this.metaColor.toHexString();
  }

  toRgb() {
    return this.metaColor.toRgb();
  }

  toRgbString() {
    return this.metaColor.toRgbString();
  }

  isGradient(): boolean {
    return !!this.colors && !this.cleared;
  }

  getColors(): GradientColor {
    return this.colors || [{ color: this, percent: 0 }];
  }

  toCssString(): string {
    const { colors } = this;

    // CSS line-gradient
    if (colors) {
      const colorsStr = colors.map((c) => `${c.color.toRgbString()} ${c.percent}%`).join(', ');
      return `linear-gradient(90deg, ${colorsStr})`;
    }

    return this.metaColor.toRgbString();
  }

  equals(color: AggregationColor | null): boolean {
    if (!color || this.isGradient() !== color.isGradient()) {
      return false;
    }

    const self = this.colors;
    const other = color.colors;

    // 两侧都不是渐变（`isGradient()` 已经相等）⇒ 比 hex
    if (!self || !other) {
      return this.toHexString() === color.toHexString();
    }

    return (
      self.length === other.length &&
      self.every((c, i) => {
        const target = other[i];
        return !!target && c.percent === target.percent && c.color.equals(target.color);
      })
    );
  }
}
