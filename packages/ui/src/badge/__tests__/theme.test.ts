/**
 * L1/L2 的主题矩阵：light / dark / compact / token-override 四态。
 *
 * Badge 的样式取值几乎全是别名 token 派生（colorError / fontSize / lineWidth …），
 * Component Token 的 9 个值是**派生常量**（见 style/token.ts 的已知边界）：
 * 主题切换改变的是 var() 的解析值，不是我们的 CSS。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Badge } from '../index';
import { genBadgeStyle } from '../style';

themeTest('Badge', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Badge · 主题无关性', () => {
  it('四态下的 DOM 完全相同（差异全在 CSS 变量里）', () => {
    const html = mount(Badge, { props: { count: 5 }, slots: { default: () => 'x' } }).html();
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain('apollo-badge');
    expect(html).toContain('apollo-scroll-number');
  });

  it('样式里引用的变量名全部是 --apollo-* 形态', () => {
    const css = genBadgeStyle('apollo');
    for (const m of css.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      expect(m[1]?.startsWith('--apollo-')).toBe(true);
    }
  });

  it('Component Token 的 9 个变量全部有声明（B7 形态）', () => {
    const css = genBadgeStyle('apollo');
    for (const token of [
      'indicator-z-index',
      'indicator-height',
      'indicator-height-sm',
      'dot-size',
      'text-font-size',
      'text-font-size-sm',
      'text-font-weight',
      'status-size',
      'padding-inline',
    ]) {
      expect(css).toContain(`--apollo-badge-${token}:`);
    }
  });
});
