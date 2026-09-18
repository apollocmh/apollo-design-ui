/**
 * `src/color/` 的**行为测试**（L1）。
 *
 * 与 `color.oracle.test.ts` 的分工：
 *   - **oracle** 回答「和上游是否逐位一致」—— 它是对外契约的证据，样本广、断言严；
 *   - **本文件**回答「我们自己的 API 形态与边界行为是否如文档所述」——
 *     无参构造、抛错、夹取、别名、缓存语义、以及几个纯函数方法。
 *
 * 为什么两者都要：oracle 只走「上游也支持的输入」，所以**我们独有的边界**
 * （`toString` / `clone` / `equals` / 非法输入抛错 / 数值夹取）在它那里永远不被执行。
 * 这些恰恰是 L0 的公共 API 面，必须自己测。
 */

import { describe, expect, it } from 'vitest';
import { Color } from '../color';

describe('Color —— 构造', () => {
  it('无参构造是黑色、不透明', () => {
    const c = new Color();
    expect(c.toRgb()).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(c.toHexString()).toBe('#000000');
    expect(c.toRgbString()).toBe('rgb(0,0,0)');
  });

  it('显式 null 与无参等价（不是抛错）', () => {
    // 上游 FastColor 的构造签名是 `input?: ColorInput`，但运行期传 null 是常见写法
    // （例如从可选配置里取值）。这里断言「不炸」这条运行期保证 —— 类型上 ColorInput
    // 不含 null，所以需要一次显式转换把意图写出来。
    const c = new Color(null as unknown as undefined);
    expect(c.toHexString()).toBe('#000000');
  });

  it('可以用另一个 Color 拷贝构造（含惰性缓存）', () => {
    const src = new Color({ h: 210, s: 0.8, v: 0.9 });
    const copy = new Color(src);
    expect(copy.toRgb()).toEqual(src.toRgb());
    // 缓存被一起带过来：拷构造后 toHsv().h 仍是当初传入的 210，而不是从 rgb 反算的值
    expect(copy.toHsv().h).toBe(210);
  });

  it('对象形式：rgb / hsl / hsv 三种通道组合都接受', () => {
    expect(new Color({ r: 22, g: 119, b: 255 }).toHexString()).toBe('#1677ff');
    expect(new Color({ r: 22, g: 119, b: 255, a: 0.5 }).toRgbString()).toBe('rgba(22,119,255,0.5)');
    expect(new Color({ h: 210, s: 0.8, l: 0.5 }).toHexString()).toBe(
      new Color('hsl(210, 80%, 50%)').toHexString(),
    );
    expect(new Color({ h: 210, s: 0.8, v: 0.9 }).toHexString()).toBe(
      new Color('hsv(210, 80%, 90%)').toHexString(),
    );
  });

  it('对象形式的通道值会被夹到合法区间', () => {
    expect(new Color({ r: 300, g: -10, b: 100 }).toRgb()).toEqual({
      r: 255,
      g: 0,
      b: 100,
      a: 1,
    });
  });

  it('hsb 是 hsv 的别名', () => {
    expect(new Color('hsb(210, 80%, 90%)').toHexString()).toBe(
      new Color('hsv(210, 80%, 90%)').toHexString(),
    );
  });

  it('rgb 的百分比记法按 255 缩放', () => {
    expect(new Color('rgb(50%, 100%, 0%)').toHexString()).toBe('#80ff00');
  });

  it('hsl 的 alpha 支持百分比', () => {
    expect(new Color('hsl(270deg 60% 40% / 50%)').a).toBe(0.5);
  });

  it('无法解析的字符串抛错（不静默给黑色）', () => {
    expect(() => new Color('not-a-color')).toThrow(/无法解析颜色/);
  });

  it('不支持的输入形状抛错', () => {
    expect(() => new Color({ c: 1 } as unknown as undefined)).toThrow(/不支持的颜色输入/);
  });
});

describe('Color —— 读取', () => {
  it('toHexString 在 alpha < 1 时追加两位', () => {
    expect(new Color('#1677ff').setAlpha(0.5).toHexString()).toBe('#1677ff80');
  });

  it('toString 与 toRgbString 同值（便于模板里直接插值）', () => {
    const c = new Color('#1677ff');
    expect(c.toString()).toBe(c.toRgbString());
    expect(`${c}`).toBe('rgb(22,119,255)');
  });

  it('灰色的饱和度是 0（delta === 0 分支）', () => {
    const grey = new Color('#808080').toHsl();
    expect(grey.h).toBe(0);
    expect(grey.s).toBe(0);
    expect(grey.l).toBeCloseTo(0.502, 3);
    expect(new Color('#000000').toHsv()).toEqual({ h: 0, s: 0, v: 0, a: 1 });
  });

  it('色相在三个通道各自最大时都正确（含 g < b 的回绕）', () => {
    expect(new Color('#00ff00').getHue()).toBe(120);
    expect(new Color('#0000ff').getHue()).toBe(240);
    expect(new Color('#ff0080').getHue()).toBe(330);
  });

  it('toHsv 返回的是构造时传入的 h，不是反算值（缓存语义）', () => {
    // 这条不是"实现细节"，是**行为契约**：darken/lighten 依赖它，改了会让色板漂移。
    expect(new Color({ h: 210, s: 0.8, v: 0.9 }).toHsv().h).toBe(210);
    expect(new Color({ h: 210, s: 0.8, l: 0.5 }).toHsl().h).toBe(210);
  });
});

describe('Color —— 运算与相等', () => {
  it('clone 返回自身（本类不可变）', () => {
    const c = new Color('#1677ff');
    expect(c.clone()).toBe(c);
  });

  it('equals 逐通道比较', () => {
    const c = new Color('#1677ff');
    expect(c.equals(new Color('#1677ff'))).toBe(true);
    expect(c.equals(new Color('#1677fe'))).toBe(false);
    expect(c.equals(new Color({ r: 22, g: 119, b: 255, a: 0.5 }))).toBe(false);
  });

  it('setAlpha 夹到 [0, 1]', () => {
    expect(new Color('#1677ff').setAlpha(2).toRgbString()).toBe('rgb(22,119,255)');
    expect(new Color('#1677ff').setAlpha(-1).toRgbString()).toBe('rgba(22,119,255,0)');
  });

  it('darken / lighten 的默认步长是 10', () => {
    const base = new Color('#1677ff');
    expect(base.darken().toHexString()).toBe(base.darken(10).toHexString());
    expect(base.lighten().toHexString()).toBe(base.lighten(10).toHexString());
  });

  it('darken / lighten 的亮度夹到 [0, 1]', () => {
    expect(new Color('#ffffff').darken(200).toHexString()).toBe('#000000');
    expect(new Color('#000000').lighten(200).toHexString()).toBe('#ffffff');
  });

  it('mix 的默认比例是 50，且 0 / 100 是恒等与全覆盖', () => {
    const black = new Color('#000000');
    expect(black.mix('#ffffff').toHexString()).toBe(black.mix('#ffffff', 50).toHexString());
    expect(black.mix('#ffffff', 0).toHexString()).toBe('#000000');
    expect(black.mix('#ffffff', 100).toHexString()).toBe('#ffffff');
  });
});
