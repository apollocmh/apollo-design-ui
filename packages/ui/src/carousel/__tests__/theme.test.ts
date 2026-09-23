/**
 * L7 主题矩阵 —— Carousel 有 **8 个 Component Token**（antd 同，规则 R7 逐字段对齐）。
 * 这一层钉的是：主题无关性（themeTest）+ Token 声明的**解析值** + 关键 token 的消费 +
 * 产物特征（slick 命名空间类、两个 @keyframes、`display:flex !important`）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genCarouselStyle, genTokenDecls as genCarouselTokenDecls } from '../style';

themeTest('Carousel', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Carousel · 主题无关性', () => {
  const css = genCarouselStyle('apollo');
  const decls = genCarouselTokenDecls('apollo');

  it('Component Token 恰好 8 个，值是构建期算好的解析值', () => {
    expect(decls).toHaveLength(8);
    expect(css).toContain('--apollo-carousel-arrow-size:16px;');
    expect(css).toContain('--apollo-carousel-arrow-offset:8px;'); // marginXS
    expect(css).toContain('--apollo-carousel-dot-width:16px;');
    expect(css).toContain('--apollo-carousel-dot-height:3px;');
    expect(css).toContain('--apollo-carousel-dot-gap:4px;'); // marginXXS
    expect(css).toContain('--apollo-carousel-dot-offset:12px;');
    expect(css).toContain('--apollo-carousel-dot-width-active:24px;'); // deprecated 别名
    expect(css).toContain('--apollo-carousel-dot-active-width:24px;');
  });

  it('样式挂在 slick 命名空间类上（.slick-* 不随 prefixCls 变）', () => {
    expect(css).toContain('.apollo-carousel .slick-slider{');
    expect(css).toContain('.apollo-carousel .slick-list .slick-slide{');
    expect(css).toContain(
      '.apollo-carousel .slick-track::before,.apollo-carousel .slick-track::after{',
    );
    expect(css).toContain('.apollo-carousel .slick-prev,.apollo-carousel .slick-next{');
    expect(css).toContain('.apollo-carousel .slick-dots{');
    expect(css).toContain('display:flex !important;');
  });

  it('两个 @keyframes（横向 width / 纵向 height），动画时长消费 var(--dot-duration)', () => {
    expect(css).toContain('@keyframes apollo-carousel-dot-animation{');
    expect(css).toContain('@keyframes apollo-carousel-dot-vertical-animation{');
    expect(css).toContain('animation-duration:var(--dot-duration);');
    expect(css).toContain('animation-fill-mode:forwards;');
  });

  it('箭头 ::after 的 √2 几何是构建期解析值（arrowLength = 16/√2）', () => {
    // antd：calc(arrowSize).sub(arrowLength).div(2) → JS 解析值 (16 - 16/√2)/2
    const arrowLength = 16 / Math.SQRT2;
    const center = (16 - arrowLength) / 2;
    expect(css).toContain(`top:${center}px;`);
    expect(css).toContain(`width:${arrowLength}px;`);
    expect(css).toContain('border-inline-start-width:2px;');
  });

  it('纵向段宽高对调 + rtl 交集选择器', () => {
    expect(css).toContain('.apollo-carousel-vertical .slick-dots{');
    expect(css).toContain('.apollo-carousel-vertical .slick-dots li{');
    expect(css).toContain('.apollo-carousel-vertical .slick-dots.apollo-carousel-rtl{');
    expect(css).toContain('.apollo-carousel-rtl{');
    expect(css).toContain('direction:rtl;');
  });

  it('slick-active 的圆点进度动画 + hover 透明度', () => {
    expect(css).toContain('.apollo-carousel .slick-dots li.slick-active::after{');
    expect(css).toContain('.apollo-carousel .slick-dots li button:hover{');
    expect(css).toContain('opacity:0.2;');
    expect(css).toContain('opacity:0.75;');
  });
});
