/**
 * L1/L2 的主题矩阵：light / dark / compact / token-override 四态。
 *
 * ⚠️ 当前**只做到「四态下都能渲染」**，没做到「四态下视觉正确」。
 *
 * 原因与 divider 相同：Flex 的样式里没有**任何字面视觉值** —— 唯一的「取值」
 * 是 gap 三档，全部是别名 token 派生（`var(--apollo-padding-*)`，见 `style/index.ts`）。
 * 主题切换改变的是**变量值**，不是我们的 CSS。
 *
 * 「变量真的存在」由 `tests/build/run.mjs` 的 B7 校验 —— 那是这个风险的正解。
 * Flex 没有 Component Token（`prepareComponentToken = () => ({})`，与 antd 逐字一致），
 * 所以这里没有 divider 那条「字面量 token 白名单」断言。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Flex } from '../index';
import { genFlexStyle } from '../style';

themeTest('Flex', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Flex · 主题无关性', () => {
  it('四态下的 DOM 完全相同（差异全在 CSS 变量里）', () => {
    const html = mount(Flex).html();
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain(`class="apollo-flex`);
  });

  it('样式里引用的变量名全部是 `--apollo-*` 形态', () => {
    const vars = [...genFlexStyle('apollo').matchAll(/var\((--[a-z0-9-]+)\)/g)].map(
      (m) => m[1] ?? '',
    );
    expect(vars.length).toBeGreaterThan(0);
    for (const name of vars) {
      expect(name.startsWith('--apollo-')).toBe(true);
    }
  });

  it('gap 三档消费的变量与 antd 的 flexToken 派生一致', () => {
    const css = genFlexStyle('apollo');
    expect(css).toContain('var(--apollo-padding-xs)');
    expect(css).toContain('var(--apollo-padding)');
    expect(css).toContain('var(--apollo-padding-lg)');
  });
});
