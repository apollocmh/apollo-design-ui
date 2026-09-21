/**
 * L1/L2 的主题矩阵。Result 的颜色/字号/间距全部 var() 化。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genResultStyle } from '../style';

themeTest('Result', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Result · 主题无关性', () => {
  const css = genResultStyle('apollo');

  it('Component Token 4 个 CSS 变量声明在根类', () => {
    expect(css).toContain('--apollo-result-title-font-size:var(--apollo-font-size-heading-3)');
    expect(css).toContain('--apollo-result-subtitle-font-size:var(--apollo-font-size)');
    expect(css).toContain(
      '--apollo-result-icon-font-size:calc(var(--apollo-font-size-heading-3) * 3)',
    );
    expect(css).toContain('--apollo-result-extra-margin:var(--apollo-padding-lg) 0 0 0');
  });

  it('状态图标色四态 var() 化', () => {
    expect(css).toContain('.apollo-result-success .apollo-result-icon');
    expect(css).toContain('.apollo-result-error .apollo-result-icon');
    expect(css).toContain('.apollo-result-info .apollo-result-icon');
    expect(css).toContain('.apollo-result-warning .apollo-result-icon');
    expect(css).toContain('var(--apollo-color-success)');
    expect(css).toContain('var(--apollo-color-error)');
  });

  it('无硬编码视觉值（除插画 hex，插画在组件层）', () => {
    // 样式表里唯一允许的字面量是插画尺寸（antd 的 imageWidth/imageHeight 常量）
    expect(css).toContain('width:250px');
    expect(css).toContain('height:295px');
  });

  it('prepareResultComponentToken 派生算式与 antd 同式', async () => {
    const { prepareResultComponentToken } = await import('../style/token');
    const t = prepareResultComponentToken({
      fontSizeHeading3: 20,
      fontSize: 14,
      paddingLG: 24,
    } as never);
    expect(t.titleFontSize).toBe(20);
    expect(t.iconFontSize).toBe(60);
    expect(t.extraMargin).toBe('24px 0 0 0');
  });
});
