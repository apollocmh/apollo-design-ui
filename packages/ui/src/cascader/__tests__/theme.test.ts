/**
 * L7 主题矩阵 —— Cascader 有 **8 个 Component Token**（规则 R7 逐字段对齐）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genCascaderStyle, genTokenDecls as genCascaderTokenDecls } from '../style';

themeTest('Cascader', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Cascader · 主题无关性', () => {
  const css = genCascaderStyle('apollo');
  const decls = genCascaderTokenDecls('apollo');

  it('Component Token 恰好 8 个（antd 的 ComponentToken 接口全字段）', () => {
    expect(decls).toHaveLength(8);
    expect(css).toContain('--apollo-cascader-control-width:184px;');
    expect(css).toContain('--apollo-cascader-control-item-width:111px;');
    expect(css).toContain('--apollo-cascader-dropdown-height:180px;');
    expect(css).toContain(
      '--apollo-cascader-option-selected-bg:var(--apollo-control-item-bg-active);',
    );
    expect(css).toContain(
      '--apollo-cascader-option-selected-font-weight:var(--apollo-font-weight-strong);',
    );
    // 派生实值（构建期求解）：round((32 - 14×1.5714…)/2)=5 + paddingSM 12
    expect(css).toContain('--apollo-cascader-option-padding:5px 12px;');
    expect(css).toContain('--apollo-cascader-menu-padding:var(--apollo-padding-xxs);');
    expect(css).toContain('--apollo-cascader-option-selected-color:var(--apollo-color-text);');
  });

  it('无双点类名（root 变量自带点，拼接处不得再加点——L6 全样式失效抓出）', () => {
    expect(css).not.toContain('..apollo-');
    expect(css).toContain('.apollo-cascader-menus{');
  });

  it('无双点类名（root 变量自带点，拼接处不得再加点——L6 全样式失效抓出）', () => {
    expect(css).not.toContain('..apollo-');
    expect(css).toContain('.apollo-cascader-menus{');
  });

  it('resetFont: false —— 上游没有 fontFamily 重置（逐字保留）', () => {
    expect(css).not.toContain('font-family');
  });

  it('columns 规则（menus / menu / menu-item / 选中态 / 关键词）', () => {
    expect(css).toContain('.apollo-cascader-menus{');
    expect(css).toContain('.apollo-cascader-menu{');
    expect(css).toContain('min-width:var(--apollo-cascader-control-item-width);');
    expect(css).toContain('height:var(--apollo-cascader-dropdown-height);');
    expect(css).toContain('background-color:var(--apollo-cascader-option-selected-bg);');
    expect(css).toContain('color:var(--apollo-color-highlight);');
    // 仅中间列有右边框（rc issue 11857 判据）
    expect(css).toContain('.apollo-cascader-menu:not(:last-child){');
  });

  it('RTL 与 dropdown 的 padding 清零规则', () => {
    expect(css).toContain('.apollo-cascader-dropdown-rtl{');
    // antd 的 `&${antCls}-select-dropdown{padding:0}`（dropdown 与 select-dropdown 同节点）
    expect(css).toContain('padding:0;');
    expect(css).toContain('.apollo-select-dropdown');
  });
});
