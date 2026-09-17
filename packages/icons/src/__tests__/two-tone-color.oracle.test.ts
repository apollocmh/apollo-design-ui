/**
 * L0 差分验证：TwoTone 调色板与上游 `@ant-design/colors` 逐位一致。
 *
 * 上游包在这里的身份是 **Oracle**（`ARCHITECTURE.md` R7 允许的三种位置之一），
 * 只出现在 devDependencies。删掉本文件后 `@apollo-design/icons` 依然零 antd 依赖。
 *
 * 为什么单独立一个文件：L4 DOM 契约（`semantic.test.ts`）比对的是**默认**双色下
 * 848 个图标的 DOM，覆盖不到「用户自定义 twoToneColor」这条路径。
 * 那条路径的取色完全由 `getSecondaryColor` 决定，而它是一个纯函数 ——
 * 纯函数就该用差分测试，不该靠渲染。
 */

import { generate as antdGenerate, blue } from '@ant-design/colors';
import { describe, expect, it } from 'vitest';
import { DEFAULT_TWOTONE_COLOR, getSecondaryColor } from '../two-tone-color';

describe('TwoTone 调色板 —— 对 @ant-design/colors 的差分验证', () => {
  it('DEFAULT_TWOTONE_COLOR 等于上游的 blue.primary', () => {
    // 我们把它固化成了字面量（运行时不读上游），所以必须有一条断言防止两边漂移。
    expect(DEFAULT_TWOTONE_COLOR).toBe(blue.primary);
  });

  it('getSecondaryColor 等于上游色板的第 0 档', () => {
    const primaries = ['#333', '#1677ff', '#eb2f96', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
    for (const color of primaries) {
      expect(getSecondaryColor(color), color).toBe(antdGenerate(color)[0]);
    }
  });

  it('钉住默认主色的派生副色：#1677ff → #e6f4ff', () => {
    expect(getSecondaryColor(DEFAULT_TWOTONE_COLOR)).toBe('#e6f4ff');
  });
});
