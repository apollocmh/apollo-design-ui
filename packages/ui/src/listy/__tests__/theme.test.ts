/**
 * L7 · 主题与样式 —— Listy（2 个 Component Token 的落地形态 + 样式段）
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genListyStyle, genTokenDecls } from '../style';

describe('Listy · 样式', () => {
  const css = genListyStyle('apollo');
  const decls = genTokenDecls('apollo');

  it('两个 Component Token 是纯别名引用（var() 形态，radio D46 同判）', () => {
    expect(decls).toContain('  --apollo-listy-item-padding-block:var(--apollo-padding-sm);');
    expect(decls).toContain('  --apollo-listy-item-padding-inline:var(--apollo-padding);');
  });

  it('根段：resetComponent 全套 + position:relative', () => {
    expect(css).toContain('.apollo-listy{');
    expect(css).toContain('  position:relative;');
    expect(css).toContain('  box-sizing:border-box;');
    expect(css).toContain('  font-family:var(--apollo-font-family);');
  });

  it('item 段：padding 双 token + borderBottom(lineWidth/lineType/colorSplit) + hover', () => {
    expect(css).toContain(
      '  padding:var(--apollo-listy-item-padding-block) var(--apollo-listy-item-padding-inline);',
    );
    expect(css).toContain(
      '  border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);',
    );
    expect(css).toContain('  transition:background-color var(--apollo-motion-duration-mid)');
    expect(css).toContain('.apollo-listy-item:hover{');
    expect(css).toContain('  background-color:var(--apollo-control-item-bg-hover);');
  });

  it('组头三态类 + section + scrollbar（死规则保留对齐产物） + rtl', () => {
    expect(css).toContain('.apollo-listy-group-header{');
    expect(css).toContain('.apollo-listy-group-header-sticky{');
    expect(css).toContain('  position:sticky;');
    expect(css).toContain('.apollo-listy-group-header-fixed{');
    expect(css).toContain('  pointer-events:auto;');
    expect(css).toContain('.apollo-listy-group-header-holder{');
    expect(css).toContain('  pointer-events:none;');
    expect(css).toContain('.apollo-listy-group-section{');
    expect(css).toContain('.apollo-listy-scrollbar{');
    expect(css).toContain('.apollo-listy-rtl{');
  });
});

themeTest('Listy', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});
