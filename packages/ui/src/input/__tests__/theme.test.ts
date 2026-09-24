/**
 * L7 主题 —— Input 的 18 个 Component Token 以 CSS 变量声明在组件根；
 * 别名色消费 var(--apollo-*)；padding/shadow 算式为构建期解析值。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genInputStyle, genTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Input', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Input · token 契约', () => {
  const css = genInputStyle('apollo');
  const decls = genTokenDecls('apollo');

  it('18 个 Component Token 全部声明（--apollo-input-*）', () => {
    expect(decls.length).toBe(18);
    expect(css).toContain('--apollo-input-padding-block:4px;');
    expect(css).toContain('--apollo-input-padding-block-sm:0px;');
    expect(css).toContain('--apollo-input-padding-block-lg:7px;');
    expect(css).toContain('--apollo-input-padding-inline:11px;');
    expect(css).toContain('--apollo-input-padding-inline-sm:7px;');
    expect(css).toContain('--apollo-input-padding-inline-lg:11px;');
    expect(css).toContain('--apollo-input-line-width-focus:1px;');
    expect(css).toContain('--apollo-input-addon-bg:var(--apollo-color-fill-alter);');
    expect(css).toContain('--apollo-input-active-border-color:var(--apollo-color-primary);');
    expect(css).toContain('--apollo-input-hover-border-color:var(--apollo-color-primary-hover);');
    expect(css).toContain('--apollo-input-hover-bg:var(--apollo-color-bg-container);');
    expect(css).toContain('--apollo-input-active-bg:var(--apollo-color-bg-container);');
    expect(css).toContain('--apollo-input-input-font-size:14px;');
    expect(css).toContain('--apollo-input-input-font-size-lg:16px;');
    expect(css).toContain('--apollo-input-input-font-size-sm:14px;');
  });

  it('activeShadow 组合串（构建期模板 + var() 色引用）', () => {
    expect(css).toContain(
      '--apollo-input-active-shadow:0 0 0 var(--apollo-control-outline-width)px var(--apollo-control-outline);',
    );
    expect(css).toContain(
      '--apollo-input-error-active-shadow:0 0 0 var(--apollo-control-outline-width)px var(--apollo-color-error-outline);',
    );
    expect(css).toContain(
      '--apollo-input-warning-active-shadow:0 0 0 var(--apollo-control-outline-width)px var(--apollo-color-warning-outline);',
    );
  });

  it('裸 input 基础规则（padding/color/font-family）', () => {
    expect(css).toContain(
      '.apollo-input{box-sizing:border-box;margin:0;padding:var(--apollo-input-padding-block) var(--apollo-input-padding-inline);',
    );
    expect(css).toContain('.apollo-input::placeholder{color:var(--apollo-color-text-placeholder);');
  });

  it('四 variant 根规则存在', () => {
    expect(css).toContain('.apollo-input-outlined{');
    expect(css).toContain('.apollo-input-filled{');
    expect(css).toContain('.apollo-input-borderless{');
    expect(css).toContain('.apollo-input-underlined{');
  });

  it('textarea 家族（affix-wrapper / show-count / allow-clear）', () => {
    expect(css).toContain('.apollo-input-textarea-affix-wrapper');
    expect(css).toContain('.apollo-input-textarea-show-count');
    expect(css).toContain('.apollo-input-textarea-allow-clear');
  });

  it('addon 家族（group-wrapper / group-addon）', () => {
    expect(css).toContain('.apollo-input-group-wrapper{');
    expect(css).toContain('.apollo-input-group-addon{');
  });
});

describe('Input · prepareComponentToken 判据', () => {
  const token = prepareComponentToken({
    controlHeight: 32,
    controlHeightSM: 24,
    controlHeightLG: 40,
    fontSize: 14,
    fontSizeLG: 16,
    lineHeight: 1.5714285714285714,
    lineHeightLG: 1.5,
    lineWidth: 1,
    lineWidthFocus: 2,
    paddingSM: 12,
    paddingXXS: 4,
    controlPaddingHorizontal: 12,
    controlPaddingHorizontalSM: 8,
    controlOutlineWidth: 2,
    controlOutline: 'rgba(5, 145, 255, 0.1)',
    colorErrorOutline: 'rgba(255, 38, 5, 0.06)',
    colorWarningOutline: 'rgba(255, 215, 5, 0.1)',
  });

  it('paddingBlock = round((32-14*1.5714)/2*10)/10 - 1 = 4px', () => {
    expect(token.paddingBlock).toBe('4px');
  });
  it('paddingBlockSM = 0px；paddingBlockLG = ceil((40-16*1.5)/2*10)/10-1 = 7px', () => {
    expect(token.paddingBlockSM).toBe('0px');
    expect(token.paddingBlockLG).toBe('7px');
  });
  it('paddingInline = paddingSM - lineWidth = 11px', () => {
    expect(token.paddingInline).toBe('11px');
    expect(token.paddingInlineSM).toBe('7px');
    expect(token.paddingInlineLG).toBe('11px');
  });
  it('lineWidthFocus：lineWidthFocus=2 ≠ 0 ⇒ 取 lineWidth（1px）', () => {
    expect(token.lineWidthFocus).toBe('1px');
  });
  it('activeShadow 组合串', () => {
    expect(token.activeShadow).toBe('0 0 0 2px var(--apollo-control-outline)');
    expect(token.errorActiveShadow).toBe('0 0 0 2px var(--apollo-color-error-outline)');
  });
});
