/** L7 主题 —— Select 组件变量（DECLS 字面量）+ prepareComponentToken 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genSelectStyle, genSelectTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Select', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Select · token 契约', () => {
  const css = genSelectStyle();
  const decls = genSelectTokenDecls();

  it('组件变量声明块（关键值对拍 antd .ant-select-css-var）', () => {
    expect(decls).toContain('--apollo-select-z-index-popup:1050;');
    expect(decls).toContain('--apollo-select-option-padding:5px 12px;');
    expect(decls).toContain('--apollo-select-option-height:32px;');
    expect(decls).toContain('--apollo-select-multiple-item-height:24px;');
    expect(decls).toContain('--apollo-select-show-arrow-padding-inline-end:18px;');
    expect(decls).toContain('--apollo-select-active-border-color:#1677ff;');
  });

  it('base 段（root / placeholder / clear / dropdown / item）', () => {
    expect(css).toContain('.apollo-select{');
    expect(css).toContain('.apollo-select .apollo-select-placeholder{');
    expect(css).toContain('.apollo-select .apollo-select-clear{');
    expect(css).toContain('.apollo-select-dropdown{');
    expect(css).toContain('.apollo-select-dropdown .apollo-select-item{');
  });

  it('多选段（-selection-item）', () => {
    expect(css).toContain('.apollo-select-multiple');
  });

  it('motion：slide-up（动效名是 rootPrefixCls 前缀 ⇒ 裸 .apollo-slide-up-*）', () => {
    expect(css).toContain('.apollo-slide-up-enter,.apollo-slide-up-appear{');
    expect(css).toContain('@keyframes apollo-slide-up-in{');
  });

  it('ant 残留三坑核查（#79/#80/#81）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toMatch(/[^a-z-]anticon[^-]/);
    expect(css).not.toContain('@supports');
  });
});

describe('Select · prepareComponentToken 判据', () => {
  it('默认主题关键值（对拍 antd prepareComponentToken）', () => {
    const t = prepareComponentToken({
      fontSize: 14,
      lineHeight: 1.5714285714285714,
      lineWidth: 1,
      lineWidthFocus: 4,
      controlHeight: 32,
      controlHeightSM: 24,
      controlHeightLG: 40,
      paddingXXS: 4,
      paddingSM: 12,
      controlPaddingHorizontal: 12,
      zIndexPopupBase: 1000,
      fontWeightStrong: 600,
    });
    expect(t.zIndexPopup).toBe(1050);
    // ⚠️ lineHeight 是 22/14 = 1.5714…，(32 - 14*1.5714…)/2 = 5 —— 不是 5.5
    expect(t.optionPadding).toBe('5px 12px');
    expect(t.optionHeight).toBe('32px');
    expect(t.multipleItemHeight).toBe('24px');
    expect(t.multipleItemHeightSM).toBe('16px');
    expect(t.multipleItemHeightLG).toBe('32px');
    expect(t.showArrowPaddingInlineEnd).toBe('18px');
    expect(t.selectAffixPadding).toBe('4px');
    expect(t.inputPaddingHorizontalBase).toBe('11px');
    expect(t.INTERNAL_FIXED_ITEM_MARGIN).toBe('2px');
  });

  it('lineWidthFocus === 0 时保持 0（antd 同款派生）', () => {
    const t = prepareComponentToken({
      fontSize: 14,
      lineHeight: 1.5714285714285714,
      lineWidth: 1,
      lineWidthFocus: 0,
      controlHeight: 32,
      controlHeightSM: 24,
      controlHeightLG: 40,
      paddingXXS: 4,
      paddingSM: 12,
      controlPaddingHorizontal: 12,
      zIndexPopupBase: 1000,
      fontWeightStrong: 600,
    });
    expect(t.lineWidthFocus).toBe('0px');
  });
});
