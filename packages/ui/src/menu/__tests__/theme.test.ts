/**
 * L7 主题 —— Menu 的组件变量（DECLS 字面量 79 个 --apollo-menu-*）+
 * prepareComponentToken 关键判定值 + 分段断言（base/placement 覆盖式的
 * submenu/motion/keyframes）。ZIndexPopup=1050（zIndexPopupBase+50）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genMenuStyle, genMenuTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Menu', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Menu · token 契约', () => {
  const css = genMenuStyle();
  const decls = genMenuTokenDecls();

  it('组件变量声明块（关键值对拍 antd .ant-menu-css-var）', () => {
    expect(decls).toContain('--apollo-menu-dropdown-width:160px;');
    expect(decls).toContain('--apollo-menu-z-index-popup:1050;');
    expect(decls).toContain('--apollo-menu-radius-item:8px;');
    expect(decls).toContain('--apollo-menu-item-border-radius:8px;');
    expect(decls).toContain('--apollo-menu-radius-sub-menu-item:4px;');
    expect(decls).toContain('--apollo-menu-item-margin-inline:4px;');
  });

  it('base 段（root / -hidden / item / submenu-title）', () => {
    expect(css).toContain(
      '.apollo-menu{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);',
    );
    expect(css).toContain('.apollo-menu-hidden{display:none;}');
    expect(css).toContain('.apollo-menu .apollo-menu-item,');
    expect(css).toContain('.apollo-menu .apollo-menu-submenu-title{');
  });

  it('mode 段（horizontal 的 inline-block 与 dark 主题族）', () => {
    expect(css).toContain(
      '.apollo-menu-horizontal{line-height:var(--apollo-menu-horizontal-line-height);',
    );
    expect(css).toContain('.apollo-menu-dark,.apollo-menu-dark>.apollo-menu{');
    expect(css).toContain('.apollo-menu-inline{');
  });

  it('motion 段（slide-up / zoom-big / collapse）+ keyframes', () => {
    expect(css).toContain('.apollo-slide-up-enter,.apollo-slide-up-appear{');
    expect(css).toContain('.apollo-zoom-big-enter,.apollo-zoom-big-appear{');
    expect(css).toContain('.apollo-menu .apollo-motion-collapse-legacy{overflow:hidden;}');
    expect(css).toContain(
      '@keyframes apollo-menu-slide-up-in{0%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}100%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}}',
    );
    expect(css).toContain('@keyframes apollo-icon-loading-circle{100%{transform:rotate(360deg);}}');
  });

  it('禁用/danger/选中态类', () => {
    expect(css).toContain(
      '.apollo-menu .apollo-menu-item-disabled,.apollo-menu .apollo-menu-submenu-disabled{',
    );
    expect(css).toContain('.apollo-menu-item-danger.');
    expect(css).toContain('.apollo-menu-item-selected,');
  });

  it('ant 残留三坑核查（#79/#80/#81）', () => {
    expect(css).not.toContain('css-dev');
    expect(css).not.toMatch(/[^a-z-]anticon/);
    expect(css).not.toContain('@supports');
  });
});

describe('Menu · prepareComponentToken 判据', () => {
  it('zIndexPopup = zIndexPopupBase + 50；radiusItem = borderRadiusLG', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      lineWidth: 1,
      lineWidthBold: 2,
      marginXXS: 4,
    });
    expect(t.zIndexPopup).toBe(1050);
    expect(t.dropdownWidth).toBe(160);
    expect(t.radiusItem).toBe(8);
    expect(t.radiusSubMenuItem).toBe(4);
    expect(t.activeBarWidth).toBe(0);
    expect(t.activeBarBorderWidth).toBe(1);
    expect(t.itemMarginInline).toBe(4);
  });

  it('快捷色覆盖（activeBarWidth 等）', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      lineWidth: 1,
      lineWidthBold: 2,
      marginXXS: 4,
      activeBarWidth: 20,
      activeBarBorderWidth: 0,
      itemMarginInline: 8,
    });
    expect(t.activeBarWidth).toBe(20);
    expect(t.activeBarBorderWidth).toBe(0);
    expect(t.itemMarginInline).toBe(8);
  });
});
