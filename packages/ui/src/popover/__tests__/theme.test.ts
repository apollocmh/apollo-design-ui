/**
 * L7 主题 —— Popover 的组件变量（titleMinWidth=177 / zIndexPopup=1030 /
 * innerPadding=12 / titleMarginBottom=8 + arrow 派生 5 件套，contentRadius=8、
 * limitVerticalRadius=true）以 CSS 变量声明在根 `.apollo-popover`；
 * 2 个 @keyframes（zoom-big，内容与 zoom-big-fast 一致）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genPopoverStyle, genPopoverTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Popover', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Popover · token 契约', () => {
  const css = genPopoverStyle();
  const decls = genPopoverTokenDecls();

  it('组件变量声明块（12 个 --apollo-popover-*）', () => {
    expect(decls).toContain('--apollo-popover-title-min-width:177px;');
    expect(decls).toContain('--apollo-popover-z-index-popup:1030;');
    expect(decls).toContain('--apollo-popover-arrow-offset-horizontal:12px;');
    expect(decls).toContain('--apollo-popover-arrow-offset-vertical:8px;');
    expect(decls).toContain('--apollo-popover-arrow-shadow-width:8.970562748477143px;');
    expect(decls).toContain('--apollo-popover-arrow-path:path(');
    expect(decls).toContain('--apollo-popover-arrow-polygon:polygon(');
    expect(decls).toContain('--apollo-popover-inner-padding:12px;');
    expect(decls).toContain('--apollo-popover-title-margin-bottom:8px;');
    expect(decls).toContain('--apollo-popover-title-padding:0px;');
    expect(decls).toContain('--apollo-popover-title-border-bottom:none;');
    expect(decls).toContain('--apollo-popover-inner-content-padding:0px;');
  });

  it('base 段（root 定位 / -hidden / title / content / container）', () => {
    expect(css).toContain(
      '.apollo-popover{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);',
    );
    expect(css).toContain(
      'font-weight:normal;white-space:normal;text-align:start;cursor:auto;user-select:text;filter:var(--apollo-drop-shadow-popover);',
    );
    expect(css).toContain('.apollo-popover-hidden{display:none;}');
    expect(css).toContain(
      '.apollo-popover .apollo-popover-content{color:var(--apollo-color-text);padding:var(--apollo-popover-inner-content-padding);}',
    );
    expect(css).toContain(
      '.apollo-popover .apollo-popover-container{background-color:var(--apollo-color-bg-elevated);background-clip:padding-box;border-radius:var(--apollo-border-radius-lg);padding:var(--apollo-popover-inner-padding);}',
    );
    expect(css).toContain(
      '.apollo-popover .apollo-popover-title{min-width:var(--apollo-popover-title-min-width);margin-bottom:var(--apollo-popover-title-margin-bottom);color:var(--apollo-color-text-heading);font-weight:var(--apollo-font-weight-strong);border-bottom:var(--apollo-popover-title-border-bottom);padding:var(--apollo-popover-title-padding);}',
    );
  });

  it('transform-origin 走 --arrow-x/--arrow-y 运行时变量（antd 逐字同构）', () => {
    expect(css).toContain(
      '--apollo-tooltip-valid-offset-x:var(--apollo-tooltip-arrow-offset-x, var(--arrow-x));',
    );
    expect(css).toContain(
      'transform-origin:var(--apollo-tooltip-valid-offset-x, 50%) var(--arrow-y, 50%);',
    );
  });

  it('placement 段（12 方向的箭头定位）', () => {
    expect(css).toContain(
      '.apollo-popover-placement-top>.apollo-popover-arrow{left:50%;transform:translateX(-50%) translateY(100%) rotate(180deg);}',
    );
    expect(css).toContain(
      '.apollo-popover-placement-topLeft{--apollo-tooltip-arrow-offset-x:var(--apollo-popover-arrow-offset-horizontal);}',
    );
    expect(css).toContain(
      '.apollo-popover-placement-bottomLeft >.apollo-popover-arrow{left:var(--apollo-popover-arrow-offset-horizontal);}',
    );
    expect(css).toContain(
      '.apollo-popover-placement-rightTop>.apollo-popover-arrow{top:var(--apollo-popover-arrow-offset-vertical);}',
    );
  });

  it('arrow 段（::before clip-path + ::after 无阴影斜块）', () => {
    expect(css).toContain(
      '.apollo-popover .apollo-popover-arrow::before{position:absolute;bottom:0;inset-inline-start:0;',
    );
    expect(css).toContain('clip-path:var(--apollo-popover-arrow-path);');
    expect(css).toContain(
      '.apollo-popover .apollo-popover-arrow::after{content:"";position:absolute;width:var(--apollo-popover-arrow-shadow-width);',
    );
    expect(css).toContain('background:transparent;}');
  });

  it('预设色段（13 个 {p}-{color} ⇒ arrow-background-color + -inner 背景 + 箭头透明）', () => {
    expect(css).toContain(
      '.apollo-popover.apollo-popover-blue{--apollo-tooltip-arrow-background-color:var(--apollo-blue-6);}',
    );
    expect(css).toContain(
      '.apollo-popover.apollo-popover-blue .apollo-popover-inner{background-color:var(--apollo-blue-6);}',
    );
    expect(css).toContain(
      '.apollo-popover.apollo-popover-gold .apollo-popover-arrow{background:transparent;}',
    );
  });

  it('motion 段（zoom-big）+ 2 个 keyframes + pure 段', () => {
    expect(css).toContain(
      '.apollo-zoom-big-enter,.apollo-zoom-big-appear{animation-duration:var(--apollo-motion-duration-mid);',
    );
    expect(css).toContain(
      '.apollo-zoom-big-enter,.apollo-zoom-big-appear{transform:scale(0);opacity:0;animation-timing-function:var(--apollo-motion-ease-out-circ);}',
    );
    expect(css).toContain(
      '.apollo-zoom-big-enter-prepare,.apollo-zoom-big-appear-prepare{transform:none;}',
    );
    expect(css).toContain(
      '@keyframes apollo-popover-zoom-big-in{0%{transform:scale(0.8);opacity:0;}100%{transform:scale(1);opacity:1;}}',
    );
    expect(css).toContain(
      '@keyframes apollo-popover-zoom-big-out{0%{transform:scale(1);}100%{transform:scale(0.8);opacity:0;}}',
    );
    expect(css).toContain(
      '.apollo-popover-pure{position:relative;max-width:none;margin:var(--apollo-size-popup-arrow);display:inline-block;}',
    );
  });
});

describe('Popover · prepareComponentToken 判据', () => {
  it('zIndexPopup = zIndexPopupBase + 30；titleMinWidth = 177', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      borderRadiusLG: 8,
      sizePopupArrow: 16,
      borderRadiusXS: 2,
      borderRadiusOuter: 4,
    });
    expect(t.zIndexPopup).toBe(1030);
    expect(t.titleMinWidth).toBe(177);
    expect(t.innerPadding).toBe(12);
    expect(t.titleMarginBottom).toBe(8);
    expect(t.arrowOffsetHorizontal).toBe(12);
    expect(t.arrowOffsetVertical).toBe(8);
    expect(t.arrowShadowWidth).toBeCloseTo(8.970562748477143, 12);
  });

  it('contentRadius(borderRadiusLG) > 12 时 arrowOffsetHorizontal = contentRadius + 2', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      borderRadiusLG: 14,
      sizePopupArrow: 16,
      borderRadiusXS: 2,
      borderRadiusOuter: 4,
    });
    expect(t.arrowOffsetHorizontal).toBe(16);
    expect(t.arrowOffsetVertical).toBe(8);
  });
});
