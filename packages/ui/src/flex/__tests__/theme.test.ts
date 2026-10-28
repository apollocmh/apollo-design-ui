/** Render-level theme regression. Actual alias consumption, scoped/nested resets and four-theme geometry are checked in the Flex contracts and browser fixture. Flex retains zero component tokens. */

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
