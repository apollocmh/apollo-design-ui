/**
 * 颜色值对象 —— `@ant-design/fast-color` 的 `FastColor` 的**等价实现**。
 *
 * 为什么自己实现而不是继续依赖（`ARCHITECTURE.md` R7 / ADR 0004）：
 *   发布包的运行时依赖里不允许出现 `@ant-design/*`。`FastColor` 是纯算法，
 *   所以走的是「移植 + 差分验证」而不是「换一个第三方颜色库」—— 换库会引入
 *   第二个颜色语义来源，而颜色是本项目**像素级对齐**的判据之一，
 *   两个来源意味着两套可能的舍入行为。
 *
 * 移植范围（只实现本仓库真实用到的部分）：
 *   构造：hex / rgb() / hsl() / hsv() 字符串，以及 `{r,g,b,a}` / `{h,s,l,a}` / `{h,s,v,a}`
 *   读取：toRgb / toHsv / toHsl / toHexString / toRgbString
 *   运算：setAlpha / darken / lighten / mix
 *
 * 与上游的两处**有意**差异（都有测试钉住）：
 *   1. 不支持 CSS 颜色名（`red` / `aliceblue` …）—— 那是一份色值数据，
 *      放进 L0 通用工具包会违反 R3。见 `types.ts` 的注释。
 *   2. 不可变。上游的 `setR/setG/setB/setA` 返回**克隆**，本类所有方法同样返回新实例，
 *      因此 `clone()` 直接返回 `this`，语义等价且少一次分配。
 *
 * ⚠️ 惰性缓存不是性能优化，是**行为的一部分**：`hslToChannels` 会把传入的 `h` 直接
 *    存为色相缓存，后续 `toHsv()` 返回的是当初传入的 `h`，而不是从 rgb 反算出来的值
 *    （两者可能差 1）。上游如此，我们必须一致，否则 `darken` 后再取 hsv 会漂移。
 */

import type { ColorInput, ColorObject, HslColor, HsvColor, Rgba, RgbColor } from './types';

/** 把数值夹到 `[0, max]`。 */
function clamp(value: number, max: number): number {
  if (value > max) {
    return max;
  }
  if (value < 0) {
    return 0;
  }
  return value;
}

/** hex 是否合法：`#rgb` … `#rrggbbaa`。 */
const HEX_RE = /^#?[A-F\d]{3,8}$/i;

/**
 * 解析 hex。
 *
 * 短写法（长度 < 6）每通道 1 位，重复成 2 位（`#abc` → `#aabbcc`）；
 * 长写法每通道 2 位。alpha 可选，按 `x / 255` 归一到 0–1。
 *
 * 用 `charAt` 而不是 `s[i]`：越界时前者给空串、后者给 `undefined`，
 * 而两者拼出来的字符串都解析成 NaN —— 行为一致，
 * 但 `charAt` 不触发 `noUncheckedIndexedAccess`，省掉一处无意义的收窄。
 */
function parseHex(trimStr: string): Rgba {
  const s = trimStr.replace('#', '');
  if (s.length < 6) {
    const channel = (i: number) => parseInt(s.charAt(i) + s.charAt(i), 16);
    return {
      r: channel(0),
      g: channel(1),
      b: channel(2),
      a: s.charAt(3) ? channel(3) / 255 : 1,
    };
  }
  const channel = (i: number) => parseInt(s.slice(i, i + 2), 16);
  return {
    r: channel(0),
    g: channel(2),
    b: channel(4),
    a: s.charAt(6) ? channel(6) / 255 : 1,
  };
}

/**
 * 拆出函数式颜色记法里的四个数值。
 *
 * `parseNum` 负责把「第 index 个通道的原始数字」换算成目标量纲
 * （rgb 是 0–255；hsl / hsv 的 s / l / v 是 0–1，h 是角度）。
 * alpha 不走 `parseNum`，百分比统一折成 0–1（`50%` → `0.5`）。
 */
function splitColorStr(
  str: string,
  parseNum: (num: number, txt: string, index: number) => number,
): [number, number, number, number] {
  const match =
    str
      .replace(/^[^(]*\((.*)/, '$1')
      .replace(/\).*/, '')
      .match(/\d*\.?\d+%?/g) ?? [];
  const raw = match.map((item) => parseFloat(item));
  // `|| 0`：匹配缺失或解析失败时 `parseFloat` 给 NaN，上游也是这么兜的。
  const num = (i: number) => raw[i] || 0;
  const txt = (i: number) => match[i] || '';

  const alphaToken = match[3];
  const alpha = alphaToken ? (alphaToken.includes('%') ? num(3) / 100 : num(3)) : 1;

  return [
    parseNum(num(0), txt(0), 0),
    parseNum(num(1), txt(1), 1),
    parseNum(num(2), txt(2), 2),
    alpha,
  ];
}

/** hsl / hsv 的通道换算：第一个是角度，其余是百分比。 */
const parseAngleOrRatio = (num: number, _txt: string, index: number): number =>
  index === 0 ? num : num / 100;

/** rgb 的通道换算：百分比按 255 缩放，否则原样。 */
const parseRgbChannel = (num: number, txt: string): number =>
  txt.includes('%') ? Math.round((num / 100) * 255) : num;

/** HSL → RGB 的结果。`h` / `s` / `l` 原样带出，供惰性缓存使用（见文件头说明）。 */
interface HslChannels extends Rgba {
  hue: number;
  hslSaturation: number;
  lightness: number;
}

/** HSV → RGB 的结果。同样把入参带出。 */
interface HsvChannels extends Rgba {
  hue: number;
  hsvSaturation: number;
  value: number;
}

function hslToChannels({ h: rawHue, s, l, a }: HslColor): HslChannels {
  const h = ((rawHue % 360) + 360) % 360;
  const alpha = typeof a === 'number' ? a : 1;

  if (s <= 0) {
    const grey = Math.round(l * 255);
    return { r: grey, g: grey, b: grey, a: alpha, hue: h, hslSaturation: s, lightness: l };
  }

  const huePrime = h / 60;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const second = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (huePrime < 1) {
    r = chroma;
    g = second;
  } else if (huePrime < 2) {
    r = second;
    g = chroma;
  } else if (huePrime < 3) {
    g = chroma;
    b = second;
  } else if (huePrime < 4) {
    g = second;
    b = chroma;
  } else if (huePrime < 5) {
    r = second;
    b = chroma;
  } else {
    r = chroma;
    b = second;
  }
  const offset = l - chroma / 2;
  return {
    r: Math.round((r + offset) * 255),
    g: Math.round((g + offset) * 255),
    b: Math.round((b + offset) * 255),
    a: alpha,
    hue: h,
    hslSaturation: s,
    lightness: l,
  };
}

function hsvToChannels({ h: rawHue, s, v, a }: HsvColor): HsvChannels {
  const h = ((rawHue % 360) + 360) % 360;
  const alpha = typeof a === 'number' ? a : 1;
  const peak = Math.round(v * 255);

  if (s <= 0) {
    return { r: peak, g: peak, b: peak, a: alpha, hue: h, hsvSaturation: s, value: v };
  }

  const huePrime = h / 60;
  const sector = Math.floor(huePrime);
  const ff = huePrime - sector;
  const p = Math.round(v * (1 - s) * 255);
  const q = Math.round(v * (1 - s * ff) * 255);
  const t = Math.round(v * (1 - s * (1 - ff)) * 255);

  let r = peak;
  let g = peak;
  let b = peak;
  if (sector === 0) {
    g = t;
    b = p;
  } else if (sector === 1) {
    r = q;
    b = p;
  } else if (sector === 2) {
    r = p;
    b = t;
  } else if (sector === 3) {
    r = p;
    g = q;
  } else if (sector === 4) {
    r = t;
    g = p;
  } else {
    g = p;
    b = q;
  }
  return { r, g, b, a: alpha, hue: h, hsvSaturation: s, value: v };
}

export class Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;

  private hueCache?: number;
  private hslSaturationCache?: number;
  private hsvSaturationCache?: number;
  private lightnessCache?: number;
  private valueCache?: number;
  private maxCache?: number;
  private minCache?: number;

  constructor(input?: ColorInput) {
    if (input === undefined || input === null) {
      this.r = 0;
      this.g = 0;
      this.b = 0;
      this.a = 1;
      return;
    }

    if (typeof input === 'string') {
      const trimStr = input.trim();
      if (HEX_RE.test(trimStr)) {
        const { r, g, b, a } = parseHex(trimStr);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return;
      }
      if (trimStr.startsWith('rgb')) {
        const [r, g, b, a] = splitColorStr(trimStr, parseRgbChannel);
        this.r = clamp(r, 255);
        this.g = clamp(g, 255);
        this.b = clamp(b, 255);
        this.a = clamp(a, 1);
        return;
      }
      if (trimStr.startsWith('hsl')) {
        const [h, s, l, a] = splitColorStr(trimStr, parseAngleOrRatio);
        const c = hslToChannels({ h, s, l, a });
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
        this.a = c.a;
        this.hueCache = c.hue;
        this.hslSaturationCache = c.hslSaturation;
        this.lightnessCache = c.lightness;
        return;
      }
      if (trimStr.startsWith('hsv') || trimStr.startsWith('hsb')) {
        const [h, s, v, a] = splitColorStr(trimStr, parseAngleOrRatio);
        const c = hsvToChannels({ h, s, v, a });
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
        this.a = c.a;
        this.hueCache = c.hue;
        this.hsvSaturationCache = c.hsvSaturation;
        this.valueCache = c.value;
        return;
      }
      throw new Error(`@apollo-design/utils: 无法解析颜色 "${input}"`);
    }

    if (input instanceof Color) {
      this.r = input.r;
      this.g = input.g;
      this.b = input.b;
      this.a = input.a;
      this.hueCache = input.hueCache;
      this.hslSaturationCache = input.hslSaturationCache;
      this.hsvSaturationCache = input.hsvSaturationCache;
      this.lightnessCache = input.lightnessCache;
      this.valueCache = input.valueCache;
      // max / min 不复制：它们是 rgb 的纯函数，复制反而会让「改通道」的路径失效。
      return;
    }

    if ('r' in input && 'g' in input && 'b' in input) {
      const rgb = input as RgbColor;
      this.r = clamp(rgb.r, 255);
      this.g = clamp(rgb.g, 255);
      this.b = clamp(rgb.b, 255);
      this.a = typeof rgb.a === 'number' ? clamp(rgb.a, 1) : 1;
      return;
    }

    if ('h' in input && 's' in input && 'l' in input) {
      const c = hslToChannels(input as HslColor);
      this.r = c.r;
      this.g = c.g;
      this.b = c.b;
      this.a = c.a;
      this.hueCache = c.hue;
      this.hslSaturationCache = c.hslSaturation;
      this.lightnessCache = c.lightness;
      return;
    }

    if ('h' in input && 's' in input && 'v' in input) {
      const c = hsvToChannels(input as HsvColor);
      this.r = c.r;
      this.g = c.g;
      this.b = c.b;
      this.a = c.a;
      this.hueCache = c.hue;
      this.hsvSaturationCache = c.hsvSaturation;
      this.valueCache = c.value;
      return;
    }

    throw new Error(
      `@apollo-design/utils: 不支持的颜色输入 ${JSON.stringify(input as ColorObject)}`,
    );
  }

  // ========================== 读取 ==========================

  toRgb(): Rgba {
    return { r: this.r, g: this.g, b: this.b, a: this.a };
  }

  toHsv(): HsvColor & { a: number } {
    return {
      h: this.getHue(),
      s: this.getHsvSaturation(),
      v: this.getValue(),
      a: this.a,
    };
  }

  toHsl(): HslColor & { a: number } {
    return {
      h: this.getHue(),
      s: this.getHslSaturation(),
      l: this.getLightness(),
      a: this.a,
    };
  }

  /**
   * `#rrggbb`，alpha < 1 时追加两位。
   *
   * 恒为小写 —— antd 的色板常量（`blue-1 = '#e6f4ff'`）也是小写，
   * Token 比对面用的是字符串全等。
   */
  toHexString(): string {
    const channel = (value: number) => {
      const hex = (value || 0).toString(16);
      return hex.length === 2 ? hex : `0${hex}`;
    };
    let hex = `#${channel(this.r)}${channel(this.g)}${channel(this.b)}`;
    if (this.a >= 0 && this.a < 1) {
      hex += channel(Math.round(this.a * 255));
    }
    return hex;
  }

  toRgbString(): string {
    return this.a !== 1
      ? `rgba(${this.r},${this.g},${this.b},${this.a})`
      : `rgb(${this.r},${this.g},${this.b})`;
  }

  toString(): string {
    return this.toRgbString();
  }

  // ========================== 运算 ==========================

  /** 本类不可变，克隆就是自己。 */
  clone(): Color {
    return this;
  }

  setAlpha(alpha: number): Color {
    return new Color({ r: this.r, g: this.g, b: this.b, a: clamp(alpha, 1) });
  }

  /**
   * 降低 HSL 亮度。
   *
   * ⚠️ 取的是 **HSV** 的饱和度（`getHsvSaturation`），却喂给 HSL 构造 ——
   * 这是上游的行为，`getSolidColor` 的取值依赖它，不能"修正"成 HSL 饱和度。
   */
  darken(amount = 10): Color {
    return new Color({
      h: this.getHue(),
      s: this.getHsvSaturation(),
      l: Math.max(0, this.getLightness() - amount / 100),
      a: this.a,
    });
  }

  /** 提高 HSL 亮度。饱和度的取法同 {@link darken}。 */
  lighten(amount = 10): Color {
    return new Color({
      h: this.getHue(),
      s: this.getHsvSaturation(),
      l: Math.min(1, this.getLightness() + amount / 100),
      a: this.a,
    });
  }

  /** 按 `amount`（0–100）向 `input` 混合。0 = 不变，100 = 完全变成 input。 */
  mix(input: ColorInput, amount = 50): Color {
    const other = new Color(input);
    const p = amount / 100;
    const calc = (key: 'r' | 'g' | 'b' | 'a') => (other[key] - this[key]) * p + this[key];
    return new Color({
      r: Math.round(calc('r')),
      g: Math.round(calc('g')),
      b: Math.round(calc('b')),
      a: Math.round(calc('a') * 100) / 100,
    });
  }

  equals(other: Color): boolean {
    return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
  }

  // ====================== 惰性派生值 ======================

  private getMax(): number {
    if (this.maxCache === undefined) {
      this.maxCache = Math.max(this.r, this.g, this.b);
    }
    return this.maxCache;
  }

  private getMin(): number {
    if (this.minCache === undefined) {
      this.minCache = Math.min(this.r, this.g, this.b);
    }
    return this.minCache;
  }

  getHue(): number {
    if (this.hueCache === undefined) {
      const delta = this.getMax() - this.getMin();
      if (delta === 0) {
        this.hueCache = 0;
      } else {
        const max = this.getMax();
        this.hueCache = Math.round(
          60 *
            (this.r === max
              ? (this.g - this.b) / delta + (this.g < this.b ? 6 : 0)
              : this.g === max
                ? (this.b - this.r) / delta + 2
                : (this.r - this.g) / delta + 4),
        );
      }
    }
    return this.hueCache;
  }

  getHsvSaturation(): number {
    if (this.hsvSaturationCache === undefined) {
      const delta = this.getMax() - this.getMin();
      this.hsvSaturationCache = delta === 0 ? 0 : delta / this.getMax();
    }
    return this.hsvSaturationCache;
  }

  getHslSaturation(): number {
    if (this.hslSaturationCache === undefined) {
      const delta = this.getMax() - this.getMin();
      this.hslSaturationCache =
        delta === 0 ? 0 : delta / 255 / (1 - Math.abs(2 * this.getLightness() - 1));
    }
    return this.hslSaturationCache;
  }

  getLightness(): number {
    if (this.lightnessCache === undefined) {
      this.lightnessCache = (this.getMax() + this.getMin()) / 510;
    }
    return this.lightnessCache;
  }

  getValue(): number {
    if (this.valueCache === undefined) {
      this.valueCache = this.getMax() / 255;
    }
    return this.valueCache;
  }
}
