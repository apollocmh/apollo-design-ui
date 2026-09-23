/**
 * L7 主题矩阵 —— InputNumber 的 9 个 Component Token 以 CSS 变量声明在组件根；
 * 别名色消费 var(--apollo-*)（随主题自适应）；尺寸算式为构建期解析值。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genInputNumberStyle } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('InputNumber', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('InputNumber · token 契约', () => {
  const css = genInputNumberStyle('apollo');

  it('9 个 Component Token 全部声明在组件根（--apollo-input-number-*）', () => {
    expect(css).toContain('--apollo-input-number-control-width:90px;');
    expect(css).toContain('--apollo-input-number-handle-width:');
    expect(css).toContain('--apollo-input-number-handle-font-size:7px;');
    expect(css).toContain('--apollo-input-number-handle-visible:auto;');
    expect(css).toContain('--apollo-input-number-handle-active-bg:var(--apollo-color-fill-alter);');
    expect(css).toContain('--apollo-input-number-handle-bg:var(--apollo-color-bg-container);');
    expect(css).toContain('--apollo-input-number-filled-handle-bg:#f0f0f0;');
    expect(css).toContain('--apollo-input-number-handle-hover-color:var(--apollo-color-primary);');
    expect(css).toContain('--apollo-input-number-handle-border-color:var(--apollo-color-border);');
  });

  it('handleOpacity / handleVisibleWidth 派生（handleVisible=auto ⇒ 0）', () => {
    expect(css).toContain('--apollo-input-number-handle-opacity:0;');
    expect(css).toContain('--apollo-input-number-handle-visible-width:0px;');
  });

  it('input 族基础（initComponentToken 对拍：4px/11px/7px）', () => {
    expect(css).toContain('--apollo-input-number-padding-block:4px;');
    expect(css).toContain('--apollo-input-number-padding-inline:11px;');
    expect(css).toContain('--apollo-input-number-padding-inline-sm:7px;');
  });

  it('hover/focus 展开 actions（width 0 → handleWidth）', () => {
    expect(css).toContain(
      '.apollo-input-number-mode-input:hover .apollo-input-number-actions,.apollo-input-number-mode-input-focused .apollo-input-number-actions{width:var(--apollo-input-number-handle-width);opacity:1;}',
    );
  });

  it('四 variant 根规则存在', () => {
    expect(css).toContain('.apollo-input-number-outlined{');
    expect(css).toContain('.apollo-input-number-filled{');
    expect(css).toContain('.apollo-input-number-borderless{');
    expect(css).toContain('.apollo-input-number-underlined{');
  });
});

describe('InputNumber · prepareComponentToken 判据', () => {
  const token = prepareComponentToken({
    lineWidth: 1,
    fontSize: 14,
    lineHeight: 1.5714285714285714,
    lineHeightLG: 1.5,
    controlHeight: 32,
    controlHeightSM: 24,
    controlHeightLG: 40,
    fontSizeLG: 16,
    paddingSM: 12,
    paddingXXS: 4,
    controlPaddingHorizontal: 12,
    controlPaddingHorizontalSM: 8,
    colorFillSecondary: 'rgba(0, 0, 0, 0.06)',
    colorBgContainer: '#ffffff',
  });

  it('handleWidth = controlHeightSM - lineWidth*2 = 22px', () => {
    expect(token.handleWidth).toBe('22px');
  });
  it('handleFontSize = fontSize / 2 = 7px', () => {
    expect(token.handleFontSize).toBe('7px');
  });
  it('controlWidth 固定 90px', () => {
    expect(token.controlWidth).toBe('90px');
  });
  it('filledHandleBg = colorFillSecondary onBackground(colorBgContainer) = #f0f0f0', () => {
    expect(token.filledHandleBg).toBe('#f0f0f0');
  });
  it('paddingBlock = round((32-14*1.5714)/2*10)/10 - 1 = 4px', () => {
    expect(token.paddingBlock).toBe('4px');
  });
  it('handleVisible=auto ⇒ opacity 0 / visibleWidth 0px', () => {
    expect(token.handleOpacity).toBe(0);
    expect(token.handleVisibleWidth).toBe('0px');
  });
  it('handleVisible=true ⇒ opacity 1 / visibleWidth = handleWidth', () => {
    const t = prepareComponentToken(
      {
        lineWidth: 1,
        fontSize: 14,
        lineHeight: 1.5714285714285714,
        lineHeightLG: 1.5,
        controlHeight: 32,
        controlHeightSM: 24,
        controlHeightLG: 40,
        fontSizeLG: 16,
        paddingSM: 12,
        paddingXXS: 4,
        controlPaddingHorizontal: 12,
        controlPaddingHorizontalSM: 8,
        colorFillSecondary: 'rgba(0, 0, 0, 0.06)',
        colorBgContainer: '#ffffff',
      },
      true,
    );
    expect(t.handleOpacity).toBe(1);
    expect(t.handleVisibleWidth).toBe('22px');
  });
});
