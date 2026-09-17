/**
 * 色板派生：预设色展开的两条历史护栏。
 *
 * 上游 antd 在这里有一条「预设色快路径」（seed 等于预设主色时直接查 `presetPalettes`），
 * 而那条路径**只在亮色下启用**、暗色下必须逐个 `generate(base, { theme: 'dark' })`。
 * 历史上把快路径误套到 dark 上，4 个 dark 用例全红。
 *
 * 我们的实现按 R7 去掉了快路径（见 `algorithms/palettes.ts`），那类 bug 在结构上
 * 已不可能发生。但「结构上不可能」不等于「已经验证过」—— 本文件用
 * `@ant-design/colors`（devDependency，身份是 Oracle）把两条结论钉住：
 *   1. 亮色 / 暗色的预设色板分别等于 `generate(base)` 与 `generate(base, {theme:'dark'})`
 *   2. 暗色的 `gold-10` 与亮色**不同** —— 这是当年那次事故的具体取值
 */

import { generate as antdGenerate } from '@ant-design/colors';
import { describe, expect, it } from 'vitest';
import { darkAlgorithm, getDesignToken } from '../get-design-token';
import { defaultPresetColors } from '../seed';
import type { PresetColorKey } from '../types';

const KEYS = Object.keys(defaultPresetColors) as PresetColorKey[];
const lightToken = getDesignToken() as unknown as Record<string, string>;
const darkToken = getDesignToken({ algorithm: darkAlgorithm }) as unknown as Record<string, string>;

describe('预设色板展开', () => {
  it('亮色：13 个预设色的 -1..-10 与 1..10 双键，值等于 generate(base)', () => {
    const token = lightToken;
    for (const key of KEYS) {
      const expected = antdGenerate(defaultPresetColors[key]);
      for (let rank = 1; rank <= 10; rank += 1) {
        expect((token as Record<string, string>)[`${key}-${rank}`], `${key}-${rank}`).toBe(
          expected[rank - 1],
        );
        expect((token as Record<string, string>)[`${key}${rank}`], `${key}${rank}`).toBe(
          expected[rank - 1],
        );
      }
    }
  });

  it('暗色：预设色板等于 generate(base, { theme: "dark" })', () => {
    const token = darkToken;
    for (const key of KEYS) {
      const expected = antdGenerate(defaultPresetColors[key], { theme: 'dark' });
      for (let rank = 1; rank <= 10; rank += 1) {
        expect((token as Record<string, string>)[`${key}-${rank}`], `dark ${key}-${rank}`).toBe(
          expected[rank - 1],
        );
      }
    }
  });

  it('★ 暗色 gold-10 不是亮色值（快路径误套到 dark 的回归用例）', () => {
    const light = lightToken;
    const dark = darkToken;

    expect(dark['gold-10']).not.toBe(light['gold-10']);
    // 亮色第 10 档是亮色色板的最深一档；暗色第 10 档是暗色色板的最浅一档。
    expect(light['gold-10']).toBe(antdGenerate(defaultPresetColors.gold)[9]);
    expect(dark['gold-10']).toBe(antdGenerate(defaultPresetColors.gold, { theme: 'dark' })[9]);
  });

  it('pink 与 magenta 的色板逐档相同（废弃名别名）', () => {
    const token = lightToken;
    for (let rank = 1; rank <= 10; rank += 1) {
      expect(token[`pink-${rank}`]).toBe(token[`magenta-${rank}`]);
    }
  });
});
