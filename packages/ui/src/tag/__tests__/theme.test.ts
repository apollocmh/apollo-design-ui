/**
 * L1/L2 的主题矩阵。Tag 的颜色/边框全部 var() 化（预设/状态色走色板变量）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genTagStyle } from '../style';

themeTest('Tag', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Tag · 主题无关性', () => {
  const css = genTagStyle('apollo');

  it('Component Token 3 个 CSS 变量声明在根类', () => {
    expect(css).toContain('--apollo-tag-default-bg:#f5f5f5');
    expect(css).toContain('--apollo-tag-default-color:var(--apollo-color-text)');
    expect(css).toContain('--apollo-tag-solid-text-color:#fff');
  });

  it('预设色 × 三 variant（blue 抽样）', () => {
    expect(css).toContain(
      '.apollo-tag.apollo-tag-blue:not(.apollo-tag-disabled).apollo-tag-outlined',
    );
    expect(css).toContain('var(--apollo-blue-1)');
    expect(css).toContain('var(--apollo-blue-3)');
    expect(css).toContain('var(--apollo-blue-7)');
    expect(css).toContain('.apollo-tag.apollo-tag-blue:not(.apollo-tag-disabled).apollo-tag-solid');
    expect(css).toContain('var(--apollo-blue-6)');
  });

  it('状态四色 × 三 variant（processing 走 Info 系）', () => {
    expect(css).toContain(
      '.apollo-tag.apollo-tag-processing:not(.apollo-tag-disabled).apollo-tag-outlined',
    );
    expect(css).toContain('var(--apollo-color-info-bg)');
    expect(css).toContain('var(--apollo-color-info-border)');
  });

  it('checkable / group / hidden / close-icon 全覆盖', () => {
    expect(css).toContain('.apollo-tag-checkable-checked');
    expect(css).toContain('.apollo-tag-checkable-group');
    expect(css).toContain('.apollo-tag-hidden');
    expect(css).toContain('.apollo-tag .apollo-tag-close-icon');
  });
});
