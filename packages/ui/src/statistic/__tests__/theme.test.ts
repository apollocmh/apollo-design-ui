/**
 * L7 主题矩阵。Statistic 的颜色/字号全部 var() 化；
 * Component Token 2 个（titleFontSize / contentFontSize）都落 CSS 变量。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genStatisticStyle } from '../style';

themeTest('Statistic', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Statistic · 主题无关性', () => {
  const css = genStatisticStyle('apollo');

  it('Component Token 2 个 CSS 变量声明在根类', () => {
    expect(css).toContain('--apollo-statistic-title-font-size:var(--apollo-font-size)');
    expect(css).toContain('--apollo-statistic-content-font-size:var(--apollo-font-size-heading-3)');
  });

  it('规则侧消费组件变量（不直接引用 alias token）', () => {
    expect(css).toContain('.apollo-statistic-title{');
    expect(css).toContain('font-size:var(--apollo-statistic-title-font-size)');
    expect(css).toContain('font-size:var(--apollo-statistic-content-font-size)');
  });

  it('title / skeleton / content / value / prefix / suffix 全覆盖', () => {
    expect(css).toContain('.apollo-statistic .apollo-statistic-header{');
    expect(css).toContain('padding-bottom:var(--apollo-margin-xxs)');
    expect(css).toContain('.apollo-statistic .apollo-statistic-skeleton{');
    expect(css).toContain('padding-top:var(--apollo-padding)');
    expect(css).toContain('.apollo-statistic .apollo-statistic-content{');
    expect(css).toContain('color:var(--apollo-color-text-heading)');
    expect(css).toContain(
      '.apollo-statistic .apollo-statistic-content .apollo-statistic-content-value{',
    );
    expect(css).toContain('direction:ltr');
    expect(css).toContain('.apollo-statistic-content-prefix{');
    expect(css).toContain('margin-inline-end:var(--apollo-margin-xxs)');
    expect(css).toContain('.apollo-statistic-content-suffix{');
    expect(css).toContain('margin-inline-start:var(--apollo-margin-xxs)');
  });

  it('ant 前缀产物同构', () => {
    const ant = genStatisticStyle('ant');
    // ⚠️ alias token 变量恒为 --apollo-*（token2CSSVar 不随 rootPrefixCls 变，
    //    back-top/tag 同判）；组件变量才随前缀走。
    expect(ant).toContain('--ant-statistic-title-font-size:var(--apollo-font-size)');
    expect(ant).toContain('.ant-statistic .ant-statistic-header{');
  });
});
