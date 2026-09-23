/**
 * L7 主题矩阵 —— Switch 有 **13 个 Component Token**（antd 同，规则 R7 逐字段对齐）。
 * 这一层钉的是：主题无关性（themeTest）+ Token 声明的**解析值** + 关键 token 的消费 +
 * 「5 处 prefers-reduced-motion、0 处 hover media query」这条产物特征。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genSwitchStyle, genTokenDecls as genSwitchTokenDecls } from '../style';

themeTest('Switch', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Switch · 主题无关性', () => {
  const css = genSwitchStyle('apollo');
  const decls = genSwitchTokenDecls('apollo');

  it('Component Token 恰好 13 个，值是构建期算好的解析值', () => {
    expect(decls).toHaveLength(13);
    expect(css).toContain('--apollo-switch-track-height:22px;');
    expect(css).toContain('--apollo-switch-track-height-sm:16px;');
    expect(css).toContain('--apollo-switch-track-min-width:44px;');
    expect(css).toContain('--apollo-switch-track-min-width-sm:28px;');
    expect(css).toContain('--apollo-switch-track-padding:2px;');
    expect(css).toContain('--apollo-switch-handle-bg:#fff;');
    expect(css).toContain('--apollo-switch-handle-size:18px;');
    expect(css).toContain('--apollo-switch-handle-size-sm:12px;');
    // antd 的 `FastColor('#00230b').setA(0.2).toRgbString()` 逐字节相同
    expect(css).toContain('--apollo-switch-handle-shadow:0 2px 4px 0 rgba(0,35,11,0.2);');
    expect(css).toContain('--apollo-switch-inner-min-margin:9px;');
    expect(css).toContain('--apollo-switch-inner-max-margin:24px;');
    expect(css).toContain('--apollo-switch-inner-min-margin-sm:6px;');
    expect(css).toContain('--apollo-switch-inner-max-margin-sm:18px;');
  });

  it('两个字面量声明（E10 豁免区，唯一真源在 token.ts）', () => {
    expect(css).toContain('border-radius:100px;');
    expect(css).toContain('color:rgba(0, 0, 0, var(--apollo-opacity-loading));');
  });

  it('派生量的 calc 组合（handle 位移 / 内容区负 margin）', () => {
    expect(css).toContain(
      'inset-inline-start:calc(100% - calc(var(--apollo-switch-handle-size) + var(--apollo-switch-track-padding)));',
    );
    expect(css).toContain(
      'margin-inline-start:calc(-100% + calc(var(--apollo-switch-handle-size) + var(--apollo-switch-track-padding) * 2) - calc(var(--apollo-switch-inner-max-margin) * 2));',
    );
    expect(css).toContain('border-radius:calc(var(--apollo-switch-handle-size) / 2);');
    expect(css).toContain('content:"";');
  });

  it('按压反馈用 switchHandleActiveInset（-30%）', () => {
    expect(css).toContain('inset-inline-end:-30%;');
    expect(css).toContain('inset-inline-start:-30%;');
  });

  it('5 处 prefers-reduced-motion，且**没有** hover media query', () => {
    const matches = css.match(/@media \(prefers-reduced-motion: reduce\)\{/g) ?? [];
    expect(matches).toHaveLength(5);
    expect(css).not.toContain('@media (hover: hover)');
  });

  it('reduced-motion 的伪元素逐个展开（PITFALLS 141 的 a,b:hover 陷阱）', () => {
    // 两个选择器的列表要展开成「基 + ::before×2 + ::after×2」共 6 项
    expect(css).toContain(
      '.apollo-switch .apollo-switch-inner .apollo-switch-inner-checked,.apollo-switch .apollo-switch-inner .apollo-switch-inner-unchecked,.apollo-switch .apollo-switch-inner .apollo-switch-inner-checked::before,.apollo-switch .apollo-switch-inner .apollo-switch-inner-unchecked::before,.apollo-switch .apollo-switch-inner .apollo-switch-inner-checked::after,.apollo-switch .apollo-switch-inner .apollo-switch-inner-unchecked::after{',
    );
    // `handle::before` 走 raw 变体（不展开，否则会出现 ::before::before）
    expect(css).not.toContain('::before::before');
    expect(css).toContain('.apollo-switch .apollo-switch-handle::before{');
  });

  it('ant 前缀产物同构（Token 声明随前缀换名）', () => {
    const ant = genSwitchStyle('ant');
    expect(ant).toContain('.ant-switch{');
    expect(ant).toContain('--ant-switch-track-height:22px;');
    expect(ant).toContain('var(--ant-switch-track-height)');
  });
});
