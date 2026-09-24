/**
 * L7 主题 —— Tooltip 的组件变量（zIndexPopup/maxWidth + arrow 派生 5 件套）
 * 以 CSS 变量声明在根 `.apollo-tooltip`；箭头 path/polygon 为构建期解析值；
 * 4 个 @keyframes（SSR 不吐，从 fade.ts/zoom.ts 手抄）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genTooltipStyle, genTooltipTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Tooltip', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Tooltip · token 契约', () => {
  const css = genTooltipStyle();
  const decls = genTooltipTokenDecls();

  it('组件变量声明块（7 个 --apollo-tooltip-*）', () => {
    expect(decls).toContain('--apollo-tooltip-z-index-popup:1070;');
    expect(decls).toContain('--apollo-tooltip-max-width:250px;');
    expect(decls).toContain('--apollo-tooltip-arrow-offset-horizontal:12px;');
    expect(decls).toContain('--apollo-tooltip-arrow-offset-vertical:8px;');
    expect(decls).toContain('--apollo-tooltip-arrow-shadow-width:8.970562748477143px;');
    expect(decls).toContain('--apollo-tooltip-arrow-path:path(');
    expect(decls).toContain('--apollo-tooltip-arrow-polygon:polygon(');
  });

  it('base 段（root 定位 / -hidden / container / content）', () => {
    expect(css).toContain(
      '.apollo-tooltip{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);',
    );
    expect(css).toContain('.apollo-tooltip-hidden{display:none;}');
    expect(css).toContain('.apollo-tooltip .apollo-tooltip-container{');
    expect(css).toContain('.apollo-tooltip .apollo-tooltip-content{position:relative;}');
  });

  it('placement 段（12 方向的箭头定位 + 边缘 minWidth）', () => {
    expect(css).toContain(
      '.apollo-tooltip-placement-top>.apollo-tooltip-arrow{left:50%;transform:translateX(-50%) translateY(100%) rotate(180deg);}',
    );
    expect(css).toContain(
      '.apollo-tooltip-placement-bottomLeft >.apollo-tooltip-arrow{left:var(--apollo-tooltip-arrow-offset-horizontal);}',
    );
    expect(css).toContain(
      '.apollo-tooltip-placement-rightTop>.apollo-tooltip-arrow{top:var(--apollo-tooltip-arrow-offset-vertical);}',
    );
    expect(css).toContain(
      'min-width:calc(var(--apollo-border-radius) + var(--apollo-size-popup-arrow) + var(--apollo-tooltip-arrow-offset-horizontal));',
    );
  });

  it('arrow 段（::before clip-path + ::after 阴影斜块）', () => {
    expect(css).toContain(
      '.apollo-tooltip .apollo-tooltip-arrow::before{position:absolute;bottom:0;inset-inline-start:0;',
    );
    expect(css).toContain('clip-path:var(--apollo-tooltip-arrow-path);');
    expect(css).toContain(
      'width:var(--apollo-tooltip-arrow-shadow-width);height:var(--apollo-tooltip-arrow-shadow-width);',
    );
  });

  it('预设色段（13 个 {p}-{color}）', () => {
    for (const color of ['blue', 'red', 'gold', 'lime', 'geekblue']) {
      expect(css).toContain(`.apollo-tooltip.ant-tooltip-${color}`.replace('ant-', 'apollo-'));
    }
    expect(css).toContain(
      '.apollo-tooltip.apollo-tooltip-blue .apollo-tooltip-container{background-color:var(--apollo-blue-6);}',
    );
  });

  it('motion 段（zoom-big-fast + container fade + 4 个 keyframes）', () => {
    expect(css).toContain('.apollo-zoom-big-fast-enter,.apollo-zoom-big-fast-appear{');
    expect(css).toContain(
      '.apollo-zoom-big-fast-leave.apollo-zoom-big-fast-leave-active{animation-name:apollo-tooltip-zoom-big-out;',
    );
    expect(css).toContain('.apollo-tooltip .apollo-tooltip-container.apollo-fade-enter');
    expect(css).toContain('@keyframes apollo-tooltip-fade-in{0%{opacity:0;}100%{opacity:1;}}');
    expect(css).toContain(
      '@keyframes apollo-tooltip-zoom-big-in{0%{transform:scale(0.8);opacity:0;}100%{transform:scale(1);opacity:1;}}',
    );
  });

  it('pure 段 + rtl 段', () => {
    expect(css).toContain('.apollo-tooltip-pure{position:relative;max-width:none;');
    expect(css).toContain('.apollo-tooltip-rtl{direction:rtl;}');
  });
});

describe('Tooltip · prepareComponentToken 判据', () => {
  it('zIndexPopup = zIndexPopupBase + 70；maxWidth = 250', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      borderRadius: 6,
      borderRadiusXS: 2,
      borderRadiusOuter: 4,
      sizePopupArrow: 16,
    });
    expect(t.zIndexPopup).toBe(1070);
    expect(t.maxWidth).toBe(250);
    expect(t.arrowOffsetHorizontal).toBe(12);
    expect(t.arrowOffsetVertical).toBe(8);
    expect(t.arrowShadowWidth).toBeCloseTo(8.970562748477143, 12);
  });

  it('contentRadius > 12 时 arrowOffsetHorizontal = contentRadius + 2', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      borderRadius: 14,
      borderRadiusXS: 2,
      borderRadiusOuter: 4,
      sizePopupArrow: 16,
    });
    expect(t.arrowOffsetHorizontal).toBe(16);
  });
});
