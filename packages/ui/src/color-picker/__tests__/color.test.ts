/**
 * ColorPicker · L1 纯逻辑（jsdom 即可，无需布局）。
 *
 * 本文件钉的是**引擎与值类型**，不是组件 DOM —— 组件行为在 `index.test.ts`。
 * 之所以先有这一层：`docs/analysis/color-picker.md` §5 的风险 1 指出
 * 「jsdom 没有布局 ⇒ 几何算法在 L1 只能测到不崩」，所以几何被抽成
 * **纯函数**（`engine/util.ts` 的 `calculateColor` / `calcOffset`），
 * 这里直接喂矩形把边界钉死。
 *
 * 期望值全部是**手算/文档值**，不是从实现反推 —— 反推的断言抓不到实现写错。
 */
import { describe, expect, it } from 'vitest';
import { AggregationColor, getHex, toHexFormat } from '../color';
import { Color } from '../engine/color';
import { calcOffset, calculateColor, HUE_COLORS } from '../engine/util';
import { genAlphaColor, generateColor, getColorAlpha, getGradientPercentColor } from '../util';

const BLUE = '#1677ff'; // colorPrimary

// ---------------------------------------------------------------------------
// 引擎 Color（utils 的 Color + rc 的三样）
// ---------------------------------------------------------------------------

describe('ColorPicker · 引擎 Color', () => {
  it('🚨 falsy 输入 ⇒ 黑 + 不透明（**不抛错**）—— 上游 `FastColor` 的 `if (!input)`', () => {
    // 这条是真路径：`AggregationColor` 对空值走 `new RcColor('')`，
    // 而 utils 的 Color 对 `''` 会抛「无法解析颜色」。
    const empty = new Color('');
    expect(empty.toRgbString()).toBe('rgb(0,0,0)');
    expect(empty.a).toBe(1);
    expect(empty.toHexString()).toBe('#000000');

    // `0` 同理（上游 `!0` 也为真）
    expect(new Color(0).toRgbString()).toBe('rgb(0,0,0)');
    // 不传
    expect(new Color().toRgbString()).toBe('rgb(0,0,0)');
  });

  it('`toHsb()` 把 `toHsv()` 的 `v` 改名成 `b`，并带上 `a`', () => {
    const hsb = new Color(BLUE).toHsb();
    expect(hsb.h).toBe(215);
    expect(hsb.s).toBeCloseTo(233 / 255, 10);
    expect(hsb.b).toBe(1);
    expect(hsb.a).toBe(1);
  });

  it('`toHsbString()`：a=1 用 `hsb(...)`，否则 `hsba(...)` 且 a 固定两位', () => {
    expect(new Color(BLUE).toHsbString()).toBe('hsb(215, 91%, 100%)');
    // a = 0.5 ⇒ 两位小数
    expect(new Color({ r: 0, g: 0, b: 0, a: 0.5 }).toHsbString()).toBe('hsba(0, 0%, 0%, 0.50)');
    // 🚨 a === 0 ⇒ `toFixed(0)`（不是 `0.00`）
    expect(new Color({ r: 0, g: 0, b: 0, a: 0 }).toHsbString()).toBe('hsba(0, 0%, 0%, 0)');
  });

  it('`setHue` 返回**引擎** Color，且保留 alpha 与其它通道', () => {
    const src = new Color({ r: 22, g: 119, b: 255, a: 0.5 });
    const next = src.setHue(120);
    expect(next).toBeInstanceOf(Color);
    expect(next.toHsb().h).toBe(120);
    expect(next.a).toBe(0.5);
    expect(next.toHsb().s).toBeCloseTo(233 / 255, 10);
  });

  it('🚨 `setAlpha` 必须返回**引擎** Color（基类的 `setAlpha` 会掉回基类）', () => {
    // 基类的 `setAlpha` 里 `new Color(...)` 指的是基类（词法作用域）⇒ 直接用它，
    // `AggregationColor.metaColor` 会掉回基类，随后 `metaColor.toHsb()` 不存在。
    const next = new Color(BLUE).setAlpha(0);
    expect(next).toBeInstanceOf(Color);
    expect(() => next.toHsb()).not.toThrow();
    expect(next.toHsb().a).toBe(0);
  });

  it('`setHue` / `setAlpha` 都是**不可变**的（原实例不动）', () => {
    const src = new Color(BLUE);
    src.setHue(0);
    src.setAlpha(0.1);
    expect(src.toHexString()).toBe(BLUE);
    expect(src.a).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// AggregationColor
// ---------------------------------------------------------------------------

describe('ColorPicker · AggregationColor', () => {
  it('空值 ⇒ `cleared = true` + alpha=0（**不是** null）', () => {
    const empty = new AggregationColor('');
    expect(empty.cleared).toBe(true);
    expect(empty.isGradient()).toBe(false);
    expect(empty.toRgbString()).toBe('rgba(0,0,0,0)');
    expect(empty.toCssString()).toBe('rgba(0,0,0,0)');
    // 🚨 `metaColor` 必须是引擎 Color ⇒ `toHsb()` 可调用（`setAlpha` 覆写的哨兵）
    expect(empty.toHsb().a).toBe(0);
    // `getColors()` 对单色也返回数组
    expect(empty.getColors()).toHaveLength(1);
    expect(empty.getColors()[0]?.percent).toBe(0);
  });

  it('空数组与空串同判（`isArray && !this.colors`）', () => {
    const emptyArr = new AggregationColor([]);
    expect(emptyArr.cleared).toBe(true);
    expect(emptyArr.isGradient()).toBe(false);
  });

  it('单色：hex / rgb / css 三个输出', () => {
    const c = new AggregationColor(BLUE);
    expect(c.cleared).toBe(false);
    expect(c.toHexString()).toBe(BLUE);
    expect(c.toRgbString()).toBe('rgb(22,119,255)');
    expect(c.toCssString()).toBe('rgb(22,119,255)');
    expect(c.isGradient()).toBe(false);
  });

  it('🚨 `toHex()` 的判据是 `metaColor.a < 1`（半透明 ⇒ 8 位）', () => {
    expect(new AggregationColor(BLUE).toHex()).toBe('1677ff');
    expect(new AggregationColor({ r: 22, g: 119, b: 255, a: 0.5 }).toHex()).toBe('1677ff80');
  });

  it('渐变：`isGradient()` / `getColors()` / `toCssString()`', () => {
    const g = new AggregationColor([
      { color: '#ffffff', percent: 0 },
      { color: '#000000', percent: 100 },
    ]);
    expect(g.isGradient()).toBe(true);
    expect(g.getColors()).toHaveLength(2);
    expect(g.toCssString()).toBe('linear-gradient(90deg, rgb(255,255,255) 0%, rgb(0,0,0) 100%)');
  });

  it('🚨 被清空的渐变**不是**渐变（`isGradient` 把 `cleared` 算进去）', () => {
    const cleared = new AggregationColor([]);
    expect(cleared.cleared).toBe(true);
    expect(cleared.isGradient()).toBe(false);
  });

  it('从另一个 AggregationColor 克隆（含渐变与 cleared）', () => {
    const src = new AggregationColor([
      { color: '#fff', percent: 0 },
      { color: '#000', percent: 100 },
    ]);
    const clone = new AggregationColor(src);
    expect(clone.isGradient()).toBe(true);
    expect(clone.equals(src)).toBe(true);
    // 与源**不共享**内部数组（改了源不影响克隆）
    expect(clone.getColors()).not.toBe(src.getColors());

    const clearedSrc = new AggregationColor('');
    expect(new AggregationColor(clearedSrc).cleared).toBe(true);
  });

  it('`equals`：非渐变比 hex；渐变逐段比 percent + color', () => {
    expect(new AggregationColor(BLUE).equals(new AggregationColor(BLUE))).toBe(true);
    expect(new AggregationColor(BLUE).equals(new AggregationColor('#ff0000'))).toBe(false);
    // 渐变 vs 单色 ⇒ false
    expect(new AggregationColor(BLUE).equals(new AggregationColor([]))).toBe(false);
    // null ⇒ false
    expect(new AggregationColor(BLUE).equals(null)).toBe(false);
    // 段数不同 ⇒ false
    const one = new AggregationColor([{ color: '#fff', percent: 0 }]);
    const two = new AggregationColor([
      { color: '#fff', percent: 0 },
      { color: '#000', percent: 100 },
    ]);
    expect(one.equals(two)).toBe(false);
  });

  it('`toHexFormat` / `getHex`（正则的字符类与截断长度是判据）', () => {
    expect(toHexFormat('#1677FF')).toBe('1677FF');
    expect(toHexFormat('#1677FF', true)).toBe('1677FF');
    expect(toHexFormat('#1677ff80', true)).toBe('1677ff80');
    // alpha=false ⇒ 截到 6 位
    expect(toHexFormat('#1677ff80')).toBe('1677ff');
    expect(getHex('')).toBe('');
    expect(getHex(undefined)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// util.ts 的四个函数
// ---------------------------------------------------------------------------

describe('ColorPicker · util', () => {
  it('`generateColor`：已是实例则**原样返回**（身份不变）', () => {
    const c = new AggregationColor(BLUE);
    expect(generateColor(c)).toBe(c);
    expect(generateColor(BLUE).toHexString()).toBe(BLUE);
  });

  it('`getColorAlpha` 走 `toHsb().a` 的百分数', () => {
    expect(getColorAlpha(new AggregationColor(BLUE))).toBe(100);
    expect(getColorAlpha(new AggregationColor({ r: 0, g: 0, b: 0, a: 0.5 }))).toBe(50);
    expect(getColorAlpha(new AggregationColor(''))).toBe(0);
  });

  it('🚨 `genAlphaColor`：rgb 全 0 时改从 `hsb` 取（纯黑不是「透明黑」）', () => {
    // rgb 全 0 的**不透明**黑 —— 若走 rgb 分支会得到 `rgb(0,0,0)`（也对），
    // 但半透明黑必须走 hsb 分支才能保住色相/饱和度语义
    const translucentBlack = new AggregationColor({ r: 0, g: 0, b: 0, a: 0.5 });
    const fixed = genAlphaColor(translucentBlack);
    expect(fixed.toRgbString()).toBe('rgb(0,0,0)');
    expect(fixed.toHsb().a).toBe(1);

    // 非零 rgb 走 rgb 分支
    const translucentRed = new AggregationColor({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(genAlphaColor(translucentRed).toRgbString()).toBe('rgb(255,0,0)');

    // 显式 alpha 覆盖
    expect(genAlphaColor(translucentRed, 0.25).toRgbString()).toBe('rgba(255,0,0,0.25)');
  });

  it('`getGradientPercentColor` 在两端各补一个端点后插值', () => {
    const colors = [
      { percent: 0, color: '#ffffff' },
      { percent: 100, color: '#000000' },
    ];
    expect(getGradientPercentColor(colors, 50)).toBe('rgb(128,128,128)');
    // 🚨 0% 端点：`dist === 0` ⇒ 上游**原样返回输入的字符串**（`#ffffff`，不是 `rgb(...)`）
    expect(getGradientPercentColor(colors, 0)).toBe('#ffffff');
    // 100% 端点落在最后一段（dist = 100）⇒ 走 mix，得到 rgb()
    expect(getGradientPercentColor(colors, 100)).toBe('rgb(0,0,0)');
    // 空数组（上游会抛 TypeError，本仓返回空串 —— 见 util.ts 的 PLATFORM 注记）
    expect(getGradientPercentColor([], 50)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 纯几何（engine/util.ts）
// ---------------------------------------------------------------------------

describe('ColorPicker · 纯几何', () => {
  const color = new Color(BLUE); // hsb = {h:215, s:233/255, b:1, a:1}
  /** 容器 200×200，手柄 10×10（中心补 5）。 */
  const container = { width: 200, height: 200 };
  const target = { width: 10, height: 10 };

  it('`calcOffset`：三档的 x/y 公式', () => {
    expect(calcOffset(color, 'hue')).toEqual({ x: (215 / 360) * 100, y: 50 });
    expect(calcOffset(color, 'alpha')).toEqual({ x: 100, y: 50 });
    const panel = calcOffset(color);
    expect(panel.x).toBeCloseTo((233 / 255) * 100, 10);
    expect(panel.y).toBeCloseTo(0, 10); // b = 1 ⇒ 1 - 1 = 0
  });

  it('取色面板：`s = (x + 半手柄) / 宽`，`b = 1 - (y + 半手柄) / 高`', () => {
    const next = calculateColor({ x: 95, y: 5 }, container, target, color);
    const hsb = next.toHsb();
    expect(hsb.s).toBeCloseTo(0.5, 10); // (95+5)/200
    expect(hsb.b).toBeCloseTo(0.95, 10); // 1 - (5+5)/200
    expect(hsb.h).toBe(215); // 色相不变
    expect(hsb.a).toBe(1);
  });

  it('🚨 取色面板的两处夹取：`s <= 0 ⇒ 0`、`b >= 1 ⇒ 1`（只夹这两侧）', () => {
    // 左上角越界：x=-5 ⇒ s = 0/200 = 0（夹）；y=-5 ⇒ b = 1 - 0/200 = 1（夹）
    const left = calculateColor({ x: -5, y: -5 }, container, target, color).toHsb();
    expect(left.s).toBe(0);
    expect(left.b).toBe(1);

    // 右下角越界 ⇒ s > 1、b < 0 **不夹**（上游如此）
    const beyond = calculateColor({ x: 215, y: 215 }, container, target, color).toHsb();
    expect(beyond.s).toBeCloseTo(1.1, 10);
    expect(beyond.b).toBeCloseTo(-0.1, 10);
  });

  it('`hue` 档：`h = (x + 半手柄) / 宽 * 360`，`h <= 0 ⇒ 0`', () => {
    const mid = calculateColor({ x: 95, y: 0 }, container, target, color, 'hue').toHsb();
    expect(mid.h).toBe(180); // (95+5)/200*360
    // s / b 来自原色（spread `...hsb` 后只覆盖 h）
    expect(mid.s).toBeCloseTo(233 / 255, 10);
    expect(mid.b).toBe(1);

    const left = calculateColor({ x: -5, y: 0 }, container, target, color, 'hue').toHsb();
    expect(left.h).toBe(0);
  });

  it('`alpha` 档：`a = (x + 半手柄) / 宽`，`a <= 0 ⇒ 0`', () => {
    const mid = calculateColor({ x: 95, y: 0 }, container, target, color, 'alpha');
    expect(mid.a).toBeCloseTo(0.5, 10);
    // 其余通道来自原色
    expect(mid.toHsb().h).toBe(215);

    const left = calculateColor({ x: -5, y: 0 }, container, target, color, 'alpha');
    expect(left.a).toBe(0);
  });

  it('`HUE_COLORS` 是上游手调的 7 个停靠点（不是 60 的整数倍）', () => {
    expect(HUE_COLORS).toHaveLength(7);
    expect(HUE_COLORS.map((h) => h.percent)).toEqual([0, 17, 33, 50, 67, 83, 100]);
    expect(HUE_COLORS[0]?.color).toBe('rgb(255, 0, 0)');
    expect(HUE_COLORS[6]?.color).toBe('rgb(255, 0, 0)');
  });
});
