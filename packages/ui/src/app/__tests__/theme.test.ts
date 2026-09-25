/** L7 主题 —— App 无 ComponentToken（antd 同款空）；单规则样式逐字。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genAppStyle } from '../style';

themeTest('App', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('App · 样式契约', () => {
  it('base 段（color/fontSize/lineHeight/fontFamily + rtl）', () => {
    const css = genAppStyle();
    expect(css).toBe(
      '.apollo-app{color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);font-family:var(--apollo-font-family);}\n' +
        '.apollo-app.apollo-app-rtl{direction:rtl;}',
    );
  });

  it('ant 残留核查', () => {
    const css = genAppStyle();
    expect(css).not.toContain('css-dev');
    expect(css).not.toMatch(/[^a-z-]anticon/);
  });
});
