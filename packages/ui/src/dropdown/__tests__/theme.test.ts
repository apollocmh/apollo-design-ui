/** L7 主题 —— Dropdown 组件变量（DECLS 字面量）+ prepareComponentToken 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genDropdownStyle, genDropdownTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Dropdown', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
  allow: [
    {
      // demo/dropdown-button.vue 用到 deprecated 的 DropdownButton（D91）。
      match: '`Dropdown.Button` is deprecated',
      reason: 'D91：组件整体 deprecated，demo 用到即有同款告警。',
    },
  ],
});

describe('Dropdown · token 契约', () => {
  const css = genDropdownStyle();
  const decls = genDropdownTokenDecls();

  it('组件变量声明块（关键值对拍 antd .ant-dropdown-css-var）', () => {
    expect(decls).toContain('--apollo-dropdown-z-index-popup:1050;');
    expect(decls).toContain('--apollo-dropdown-padding-block:5px;');
    expect(decls).toContain('--apollo-dropdown-arrow-offset-horizontal:12px;');
    expect(decls).toContain('--apollo-dropdown-arrow-offset-vertical:8px;');
    expect(decls).toContain('--apollo-dropdown-arrow-shadow-width:8.970562748477143px;');
  });

  it('base 段（root / arrow 定位）', () => {
    expect(css).toContain('.apollo-dropdown{');
    expect(css).toContain('.apollo-dropdown .apollo-dropdown-arrow{position:absolute;');
  });

  it('menu 层叠覆盖段（menuCls：{p} {p}-menu 内的 item/submenu-title）', () => {
    expect(css).toContain(
      '.apollo-dropdown .apollo-dropdown-menu .apollo-dropdown-menu-item,.apollo-dropdown-menu-submenu .apollo-dropdown-menu .apollo-dropdown-menu-item',
    );
  });

  it('motion 四向（slide-up/down/left/right）+ keyframes 稳定命名', () => {
    expect(css).toContain('.apollo-slide-up-enter,.apollo-slide-up-appear{');
    expect(css).toContain('.apollo-slide-down-enter,.apollo-slide-down-appear{');
    expect(css).toContain('.apollo-slide-left-enter,.apollo-slide-left-appear{');
    expect(css).toContain('.apollo-slide-right-enter,.apollo-slide-right-appear{');
    expect(css).toContain(
      '@keyframes apollo-dropdown-slide-up-in{0%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}100%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}}',
    );
  });

  it('ant 残留三坑核查（#79/#80/#81）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toMatch(/[^a-z-]anticon[^-]/);
    expect(css).not.toContain('@supports');
  });
});

describe('Dropdown · prepareComponentToken 判据', () => {
  it('zIndexPopup = zIndexPopupBase + 50；paddingBlock = 5', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      sizePopupArrow: 16,
      borderRadius: 6,
      borderRadiusXS: 2,
      borderRadiusOuter: 4,
      marginXXS: 4,
    });
    expect(t.zIndexPopup).toBe(1050);
    expect(t.paddingBlock).toBe(5);
    expect(t.arrowOffsetHorizontal).toBe(12);
    expect(t.arrowOffsetVertical).toBe(8);
    expect(t.arrowShadowWidth).toBeCloseTo(8.970562748477143, 12);
  });
});
