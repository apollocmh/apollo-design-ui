/**
 * L7 · 主题与样式 —— Splitter（4 个 Component Token 常量默认值 + 样式段全量）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genSplitterStyle, genTokenDecls } from '../style';

describe('Splitter · 样式', () => {
  const css = genSplitterStyle('apollo');
  const decls = genTokenDecls('apollo');

  it('4 个 Component Token 是常量默认值（构建期解析值，token.ts 文件头）', () => {
    expect(decls).toContain('  --apollo-splitter-split-bar-size:2px;');
    expect(decls).toContain('  --apollo-splitter-split-trigger-size:6px;');
    expect(decls).toContain('  --apollo-splitter-resize-spinner-size:20px;');
    expect(decls).toContain('  --apollo-splitter-split-bar-draggable-size:20px;');
  });

  it('组件作用域 CSS 变量（bar-preview-offset，B7 先例）', () => {
    expect(decls).toContain('  --apollo-splitter-bar-preview-offset:0px;');
  });

  it('根段：resetComponent 全套 + flex 布局', () => {
    expect(css).toContain('.apollo-splitter{');
    expect(css).toContain('  display:flex;');
    expect(css).toContain('  align-items:stretch;');
    expect(css).toContain('  font-family:var(--apollo-font-family);');
  });

  it('dragger 三态（hover/active/disabled）与 centerStyle', () => {
    expect(css).toContain('.apollo-splitter-bar-dragger{');
    expect(css).toContain('  position:absolute;');
    expect(css).toContain('  transform:translate(-50%,-50%);');
    expect(css).toContain('.apollo-splitter-bar-dragger-active{');
    expect(css).toContain('.apollo-splitter-bar-dragger-disabled.apollo-splitter-bar-dragger{');
    expect(css).toContain('  cursor:col-resize;');
    expect(css).toContain('  cursor:row-resize;');
  });

  it('collapse-bar 三态显隐 + hover:none 恒显 + focus-visible', () => {
    expect(css).toContain('.apollo-splitter-bar-collapse-bar-hover-only{');
    expect(css).toContain('@media(hover:none){');
    expect(css).toContain('.apollo-splitter-bar-collapse-bar-always-hidden{');
    expect(css).toContain('.apollo-splitter-bar-collapse-bar-always-visible{');
    expect(css).toContain('.apollo-splitter-bar-collapse-bar:focus-visible{');
  });

  it('两段 layout（horizontal/vertical）的 preview/dragger/collapse-bar 几何', () => {
    expect(css).toContain('.apollo-splitter-horizontal{');
    expect(css).toContain('  flex-direction:row;');
    expect(css).toContain('.apollo-splitter-vertical{');
    expect(css).toContain('  flex-direction:column;');
    expect(css).toContain(
      '.apollo-splitter-horizontal > .apollo-splitter-bar .apollo-splitter-bar-dragger{',
    );
    expect(css).toContain(
      '.apollo-splitter-vertical > .apollo-splitter-bar .apollo-splitter-bar-dragger{',
    );
    expect(css).toContain('transform:translate3d(var(--apollo-splitter-bar-preview-offset),0,0);');
    expect(css).toContain('transform:translate3d(0,var(--apollo-splitter-bar-preview-offset),0);');
  });

  it('panel 段：overflow/hidden/transition + prefers-reduced-motion', () => {
    expect(css).toContain('.apollo-splitter-panel{');
    expect(css).toContain('  overflow:auto;');
    expect(css).toContain('.apollo-splitter-panel-transition{');
    expect(css).toContain('@media (prefers-reduced-motion: reduce){');
    expect(css).toContain('.apollo-splitter-panel:has(.apollo-splitter:only-child){');
  });

  it('mask 段（拖拽中的光标遮罩）', () => {
    expect(css).toContain('.apollo-splitter-mask{');
    expect(css).toContain('  position:fixed;');
    expect(css).toContain('  cursor:col-resize;');
    expect(css).toContain('  cursor:row-resize;');
  });
});

themeTest('Splitter', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});
