/**
 * L1/L2 的主题矩阵。Grid 的样式里没有字面视觉值（断点 px 是**结构值**，
 * 来自 token 的 screen 尺寸而非视觉 token）—— 四态下 DOM 恒定。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Col, Row } from '../index';
import { genGridStyle } from '../style';

themeTest('Grid', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Grid · 主题无关性', () => {
  it('四态下的 DOM 完全相同', () => {
    const html = mount({
      components: { Row, Col },
      template: '<Row><Col :span="8">x</Col></Row>',
    }).html();
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain('apollo-row');
    expect(html).toContain('apollo-col-8');
  });

  it('media query 的断点值来自 token（576/768/992/1200/1600/1920）', () => {
    const css = genGridStyle('apollo');
    for (const px of ['576px', '768px', '992px', '1200px', '1600px', '1920px']) {
      expect(css).toContain(`(min-width: ${px})`);
    }
  });

  it('样式里无字面视觉值（flex 百分比是栅格结构值；无颜色/字体）', () => {
    const css = genGridStyle('apollo');
    expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(css).not.toContain('font-size');
  });
});
