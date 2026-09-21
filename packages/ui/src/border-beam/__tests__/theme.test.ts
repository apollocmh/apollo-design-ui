/**
 * L1/L2 的主题矩阵。BorderBeam 的默认渐变/线宽全部走别名 token var()。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genBorderBeamStyle } from '../style';

themeTest('BorderBeam', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('BorderBeam · 主题无关性', () => {
  it('默认渐变与线宽全部 var() 化', () => {
    const css = genBorderBeamStyle('apollo');
    expect(css).toContain('var(--apollo-color-primary)');
    expect(css).toContain('var(--apollo-line-width)');
  });

  it('reduced-motion 双保险存在', () => {
    const css = genBorderBeamStyle('apollo');
    expect(css.match(/prefers-reduced-motion/g)?.length).toBe(2);
  });
});
