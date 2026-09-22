/**
 * L1/L2 的主题矩阵。BackTop 的颜色/尺寸全部 var() 化。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genBackTopStyle } from '../style';

themeTest('BackTop', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('BackTop · 主题无关性', () => {
  const css = genBackTopStyle('apollo');

  it('Component Token：zIndexPopup = zIndexBase + 10（calc 表达）', () => {
    expect(css).toContain('--apollo-back-top-z-index-popup:calc(var(--apollo-z-index-base) + 10)');
  });

  it('定位与配色 var() 化', () => {
    expect(css).toContain('position:fixed');
    expect(css).toContain('calc(var(--apollo-control-height-lg) * 2.5)');
    expect(css).toContain('background-color:var(--apollo-color-text-description)');
    expect(css).toContain(':hover');
  });

  it('响应式两档（screenMD / screenXS）', () => {
    expect(css.match(/@media \(max-width/g)?.length).toBe(2);
  });

  it('无 fade keyframes（antd 产物逐字）', () => {
    expect(css).not.toContain('@keyframes');
  });
});
