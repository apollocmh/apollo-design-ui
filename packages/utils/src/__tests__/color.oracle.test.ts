/**
 * L0 差分验证：`src/color/` 与上游 `@ant-design/colors` / `@ant-design/fast-color` 逐位一致。
 *
 * 为什么需要这个文件：
 *   `src/color/` 是上游颜色算法的**移植**，不是包装。只要移植与上游有任何一位不同，
 *   Token 与 TwoTone 图标的取色就会静默漂移 —— 而这类漂移在单元测试里看不出来
 *   （`"#e6f4ff"` 和 `"#e6f4fe"` 都是合法颜色），只有逐位比对能抓到。
 *
 * 上游包在这里的身份是 **Oracle**，不是运行时依赖：
 *   它们只出现在 `devDependencies`（ARCHITECTURE.md R7 允许的三种位置之一），
 *   产物与发布包都不含它们。删掉本文件后，`@apollo-design/utils` 依然零 antd 依赖。
 *
 * ⚠️ 本文件的断言**不允许**为了变绿而放宽（AGENTS.md H7）。
 * 若某天上游改了算法导致这里变红，正确动作是：确认上游改动 → 同步移植 → 保持红灯消失，
 * 而不是给容差或删用例。
 */

import { generate as antdGenerate, presetPrimaryColors } from '@ant-design/colors';
import { FastColor } from '@ant-design/fast-color';
import { describe, expect, it } from 'vitest';
import { Color, generatePalette } from '../color';

/**
 * 差分样本。
 *
 * 组成：13 个预设主色（真实使用面最广）+ 灰阶 + 边界色 + 确定性伪随机 64 色。
 * 伪随机用固定种子的 LCG 而不是 `Math.random()` —— 差分测试的样本集必须可复现，
 * 否则「今天过、明天红」会分不清是上游变了还是样本变了。
 */
function samples(): string[] {
  const seeds = [
    ...Object.values(presetPrimaryColors),
    '#000000',
    '#ffffff',
    '#333333',
    '#808080',
    '#fefefe',
    '#010101',
    '#1677ff',
    '#ff4d4f',
    '#00ff00',
    '#ff00ff',
    '#00ffff',
    '#ffff00',
  ];

  // 数值线性同余，种子固定。
  let state = 20260917;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  for (let i = 0; i < 64; i += 1) {
    const channel = () =>
      Math.round(next() * 255)
        .toString(16)
        .padStart(2, '0');
    seeds.push(`#${channel()}${channel()}${channel()}`);
  }
  return seeds;
}

describe('颜色移植 —— 对 @ant-design/fast-color 的差分验证', () => {
  it('toRgb / toHsv / toHsl 与 FastColor 逐位一致', () => {
    for (const input of samples()) {
      const mine = new Color(input);
      const theirs = new FastColor(input);

      expect(mine.toRgb(), input).toEqual(theirs.toRgb());
      expect(mine.toHsv(), input).toEqual(theirs.toHsv());
      expect(mine.toHsl(), input).toEqual(theirs.toHsl());
      expect(mine.toHexString(), input).toBe(theirs.toHexString());
      expect(mine.toRgbString(), input).toBe(theirs.toRgbString());
    }
  });

  it('darken / lighten / setAlpha / mix 与 FastColor 逐位一致', () => {
    for (const input of samples()) {
      const mine = new Color(input);
      const theirs = new FastColor(input);

      for (const amount of [0, 4, 8, 12, 15, 19, 26, 50, 100]) {
        expect(mine.darken(amount).toHexString(), `${input} darken ${amount}`).toBe(
          theirs.darken(amount).toHexString(),
        );
        expect(mine.lighten(amount).toHexString(), `${input} lighten ${amount}`).toBe(
          theirs.lighten(amount).toHexString(),
        );
        expect(mine.mix('#ffffff', amount).toHexString(), `${input} mix ${amount}`).toBe(
          theirs.mix('#ffffff', amount).toHexString(),
        );
      }

      for (const alpha of [0, 0.02, 0.15, 0.45, 0.88, 0.95, 1]) {
        expect(mine.setAlpha(alpha).toRgbString(), `${input} alpha ${alpha}`).toBe(
          theirs.setA(alpha).toRgbString(),
        );
      }
    }
  });

  it('函数式记法与 alpha 的解析与 FastColor 一致', () => {
    const strings = [
      'rgb(255, 255, 255)',
      'rgba(255, 255, 255, 0.2)',
      'rgba(0, 0, 0, 0.45)',
      'rgb(100%, 50%, 0%)',
      'rgb(102 204 255 / .5)',
      'hsl(270, 60%, 40%)',
      'hsl(270deg 60% 40% / 50%)',
      'hsv(210, 80%, 90%)',
      '#abc',
      '#abcd',
      '#aabbcc',
      '#aabbccdd',
      '#1677FF',
    ];
    for (const input of strings) {
      const mine = new Color(input);
      const theirs = new FastColor(input);
      expect(mine.toRgb(), input).toEqual(theirs.toRgb());
      expect(mine.toRgbString(), input).toBe(theirs.toRgbString());
    }
  });

  it('不支持 CSS 颜色名 —— 这是有意的差异，与上游相反', () => {
    // 上游内置 148 个名字的查表；那是色值数据，放进 L0 会违反 R3（见 types.ts）。
    expect(() => new Color('red')).toThrow();
    // 上游在这里会成功解析：
    expect(new FastColor('red').toHexString()).toBe('#ff0000');
  });
});

describe('色板移植 —— 对 @ant-design/colors 的差分验证', () => {
  it('亮色色板：10 档与 generate() 逐位一致', () => {
    for (const input of samples()) {
      expect(generatePalette(input), `亮色 ${input}`).toEqual(antdGenerate(input));
    }
  });

  it('暗色色板：generate(x, { theme: "dark" }) 逐位一致', () => {
    // ⚠️ `backgroundColor` 必须显式传：上游把它硬编码成 `#141414`，
    //    而 `utils` 是 L0，不允许出现色值字面量（R3）—— 见 `generate.ts` 的 GenerateOptions。
    //    测试文件不受 R3 约束（不随包发布），所以这个字面量出现在这里是合适的：
    //    它正是「上游的默认值」这件事的**唯一**记录点。
    for (const input of samples()) {
      expect(
        generatePalette(input, { theme: 'dark', backgroundColor: '#141414' }),
        `暗色 ${input}`,
      ).toEqual(antdGenerate(input, { theme: 'dark' }));
    }
  });

  it('13 个预设主色的色板逐位一致（这是 Token 的真实取值面）', () => {
    for (const [name, color] of Object.entries(presetPrimaryColors)) {
      expect(generatePalette(color), `预设色 ${name}`).toEqual(antdGenerate(color));
    }
  });

  it('TwoTone 副色（色板第 0 档）逐位一致', () => {
    // icons 的 getSecondaryColor 用的就是这一档。
    const twoTonePrimaries = ['#333', '#1677ff', '#eb2f96', '#52c41a', '#faad14', '#f5222d'];
    for (const color of twoTonePrimaries) {
      expect(generatePalette(color)[0], `TwoTone ${color}`).toBe(antdGenerate(color)[0]);
    }
    // 钉住一条容易被误解的事实：icons 模块级调色板的初值 `#333` / `#E6E6E6`
    // 是 antd 的**字面量**，副色**不是**由主色派生的 —— `generate('#333')[0]` 是 #737373。
    // 曾有实现把默认值改成 `getSecondaryColor('#333')`，于是默认双色整体变灰。
    expect(generatePalette('#333')[0]).toBe('#737373');
    expect(generatePalette('#333')[0]).not.toBe('#e6e6e6');
  });
});
