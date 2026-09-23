/**
 * L7 · 主题与样式 —— Collapse（10 个 Component Token + 五段样式）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genCollapseStyle, genTokenDecls } from '../style';

describe('Collapse · 样式', () => {
  const css = genCollapseStyle('apollo');
  const decls = genTokenDecls('apollo');

  it('10 个 Component Token：别名引用 var() + padding 组合构建期解析值', () => {
    // 别名引用（D46 同判）
    expect(decls).toContain('  --apollo-collapse-header-bg:var(--apollo-color-fill-alter);');
    expect(decls).toContain('  --apollo-collapse-content-bg:var(--apollo-color-bg-container);');
    // padding 组合串（含固定 16px）——构建期解析值（D50 同判）
    expect(decls).toContain('  --apollo-collapse-header-padding:12px 16px;');
    expect(decls).toContain('  --apollo-collapse-content-padding:16px 16px;');
    expect(decls).toContain('  --apollo-collapse-borderless-content-padding:4px 16px 16px;');
    // mergeToken 派生：borderRadiusLG
    expect(decls).toContain('  --apollo-collapse-panel-border-radius:8px;');
  });

  it('根段：resetComponent 全套 + headerBg + 边框 + 圆角', () => {
    expect(css).toContain('.apollo-collapse{');
    expect(css).toContain('  background-color:var(--apollo-collapse-header-bg);');
    expect(css).toContain(
      '  border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);',
    );
    expect(css).toContain('  border-radius:var(--apollo-collapse-panel-border-radius);');
  });

  it('header/arrow/title 段（含 focus 环与 svg 对齐）', () => {
    expect(css).toContain('.apollo-collapse > .apollo-collapse-item > .apollo-collapse-header{');
    expect(css).toContain('  cursor:pointer;');
    expect(css).toContain('  margin-inline-end:var(--apollo-margin-sm);');
    expect(css).toContain(
      '.apollo-collapse > .apollo-collapse-item > .apollo-collapse-header .apollo-collapse-arrow{',
    );
    expect(css).toContain('  transition:transform var(--apollo-motion-duration-mid);');
    expect(css).toContain(
      '.apollo-collapse > .apollo-collapse-item > .apollo-collapse-header > .apollo-collapse-title{',
    );
    expect(css).toContain('  flex:auto;');
  });

  it('collapsible 两态的 cursor 规则', () => {
    expect(css).toContain(
      '.apollo-collapse > .apollo-collapse-item > .apollo-collapse-collapsible-header{',
    );
    expect(css).toContain('  cursor:default;');
    expect(css).toContain(
      '.apollo-collapse > .apollo-collapse-item > .apollo-collapse-collapsible-icon{',
    );
    expect(css).toContain('  cursor:unset;');
  });

  it('panel/body 段 + hidden', () => {
    expect(css).toContain('.apollo-collapse-panel{');
    expect(css).toContain(
      '  border-top:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);',
    );
    expect(css).toContain('.apollo-collapse-panel > .apollo-collapse-body{');
    expect(css).toContain('.apollo-collapse-panel-hidden{');
    expect(css).toContain('  display:none;');
  });

  it('small/large 两档 + icon-placement-end + borderless/ghost + rtl 箭头 + motion', () => {
    expect(css).toContain(
      '.apollo-collapse-small > .apollo-collapse-item > .apollo-collapse-header{',
    );
    expect(css).toContain('.apollo-collapse-large > .apollo-collapse-item{');
    expect(css).toContain(
      '.apollo-collapse-icon-placement-end > .apollo-collapse-item > .apollo-collapse-header > .apollo-collapse-expand-icon{',
    );
    expect(css).toContain('  order:1;');
    expect(css).toContain('.apollo-collapse-borderless{');
    expect(css).toContain('.apollo-collapse-ghost{');
    expect(css).toContain(
      '.apollo-collapse-rtl > .apollo-collapse-item > .apollo-collapse-header .apollo-collapse-arrow{',
    );
    expect(css).toContain('  transform:rotate(180deg);');
    expect(css).toContain('.apollo-collapse .apollo-motion-collapse{');
    expect(css).toContain(
      '  transition:height var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out) !important, opacity var(--apollo-motion-duration-mid) var(--apollo-motion-ease-in-out) !important;',
    );
  });

  it('disabled 段', () => {
    expect(css).toContain(
      '.apollo-collapse .apollo-collapse-item-disabled > .apollo-collapse-header{',
    );
    expect(css).toContain('  cursor:not-allowed;');
  });
});

themeTest('Collapse', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});
