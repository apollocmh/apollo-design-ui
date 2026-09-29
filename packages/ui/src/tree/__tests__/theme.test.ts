/**
 * L7 主题 —— Tree 的 Component Token（**9 个自有字段**：7 shared + 2 directory）。
 *
 * 钉：主题无关性（themeTest）+ token 判定值（与 antd 6.6.4 产物逐字对拍，
 * 见 style/token.ts 头注释 / docs/analysis/tree.md §5）+ 变量声明单位规则
 * （title/switcher/indent 三个尺寸带 px）+ 展开动效类（-motion-collapse）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genTreeStyle, genTreeTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Tree', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Tree · Component Token 判定值（antd 产物逐字对拍）', () => {
  const t = prepareComponentToken(getDesignToken() as never);

  it('9 个字段（G3 产物对拍：extract-tree-css.mjs）', () => {
    expect(t.titleHeight).toBe(24); // controlHeightSM
    expect(t.switcherSize).toBe(24);
    expect(t.indentSize).toBe(24);
    expect(t.nodeHoverBg).toBe('rgba(0,0,0,0.04)'); // controlItemBgHover
    expect(t.nodeHoverColor).toBe('rgba(0,0,0,0.88)'); // colorText
    expect(t.nodeSelectedBg).toBe('#e6f4ff'); // controlItemBgActive
    expect(t.nodeSelectedColor).toBe('rgba(0,0,0,0.88)');
    expect(t.directoryNodeSelectedColor).toBe('#fff'); // colorTextLightSolid
    expect(t.directoryNodeSelectedBg).toBe('#1677ff'); // colorPrimary
  });
});

describe('Tree · 静态 CSS（变量声明 / var() 消费 / 动效类）', () => {
  const css = genTreeStyle('apollo');
  const decls = genTreeTokenDecls();

  it('变量声明块：三个尺寸带 px，颜色逐字', () => {
    expect(decls).toContain('--apollo-tree-title-height:24px;');
    expect(decls).toContain('--apollo-tree-switcher-size:24px;');
    expect(decls).toContain('--apollo-tree-indent-size:24px;');
    expect(decls).toContain('--apollo-tree-node-hover-bg:rgba(0,0,0,0.04);');
    expect(decls).toContain('--apollo-tree-node-selected-bg:#e6f4ff;');
    expect(decls).toContain('--apollo-tree-directory-node-selected-color:#fff;');
    expect(decls).toContain('--apollo-tree-directory-node-selected-bg:#1677ff;');
  });

  it('关键选择器消费 token 变量', () => {
    expect(css).toContain('line-height:var(--apollo-tree-title-height);');
    expect(css).toContain('width:var(--apollo-tree-switcher-size);');
    // ⚠️ 上游怪值：选中态用的是 `color: var(--node-selected-bg)`（非 background）
    expect(css).toContain('color:var(--apollo-tree-node-selected-bg);');
    expect(css).toContain('color:var(--apollo-tree-directory-node-selected-color);');
  });

  it('展开动效类 -motion-collapse（-legacy/-active 三件套）', () => {
    expect(css).toContain('.apollo-tree .apollo-motion-collapse-legacy-active');
    expect(css).toContain('.apollo-tree .apollo-motion-collapse');
  });

  it('checkbox 视觉（antd 自定义勾选框非原生）', () => {
    expect(css).toContain('.apollo-tree .apollo-tree-checkbox');
    expect(css).toContain('.apollo-tree-checkbox-indeterminate');
    expect(css).toContain('.apollo-tree-checkbox-checked:after');
  });

  it('自定义前缀替换（R9：genTreeStyle(prefixCls)）', () => {
    const custom = genTreeStyle('x');
    expect(custom).toContain('.x-tree{');
    expect(custom).not.toContain('.apollo-tree');
  });
});
