/**
 * L7 主题 —— Pagination 的 Component Token（**12 个自有** + 输入框族 + 派生）。
 *
 * 判定值逐字对拍 antd 6.6.4 产物（可复现命令：
 * `node tests/visual/debug/extract-pagination-css.mjs --tokens`）。
 *
 * ⚠️ `themeTest('Pagination', { demos })` 的**主题矩阵**刻意留到 G11（demo 落地后再接）——
 *    现在挂上去只会因为「拿占位 demo 渲染成功」而假绿（与 slider 同判）。
 */

import { describe, expect, it } from 'vitest';
import {
  paginationDerivedToken,
  paginationInputTokenValues,
  paginationTokenValues,
  prepareComponentToken,
} from '../style/token';

describe('Pagination · Component Token 判定值（antd 产物逐字对拍）', () => {
  const t = paginationTokenValues();

  it('12 个自有字段恰好齐全（不多不少）', () => {
    expect(Object.keys(t).sort()).toEqual(
      [
        'itemActiveBg',
        'itemActiveBgDisabled',
        'itemActiveColor',
        'itemActiveColorDisabled',
        'itemActiveColorHover',
        'itemBg',
        'itemInputBg',
        'itemLinkBg',
        'itemSize',
        'itemSizeLG',
        'itemSizeSM',
        'miniOptionsSizeChangerTop',
      ].sort(),
    );
  });

  it('尺寸族：controlHeight 三档 + 字面量 0', () => {
    expect(t.itemSize).toBe('32px'); // controlHeight
    expect(t.itemSizeSM).toBe('24px'); // controlHeightSM
    expect(t.itemSizeLG).toBe('40px'); // controlHeightLG
    expect(t.miniOptionsSizeChangerTop).toBe('0px');
  });

  it('颜色族（别名直取 / 色值）', () => {
    expect(t.itemBg).toBe('#ffffff'); // colorBgContainer
    expect(t.itemActiveBg).toBe('#ffffff');
    expect(t.itemLinkBg).toBe('#ffffff');
    expect(t.itemInputBg).toBe('#ffffff');
    expect(t.itemActiveColor).toBe('#1677ff'); // colorPrimary
    expect(t.itemActiveColorHover).toBe('#4096ff'); // colorPrimaryHover
    expect(t.itemActiveColorDisabled).toBe('rgba(0,0,0,0.25)'); // colorTextDisabled
    expect(t.itemActiveBgDisabled).toBe('rgba(0,0,0,0.15)'); // controlItemBgActiveDisabled
  });

  it('prepareComponentToken 是纯函数（同 seed ⇒ 同结果）', () => {
    expect(
      prepareComponentToken({
        controlHeight: 32,
        controlHeightSM: 24,
        controlHeightLG: 40,
        fontSize: 14,
        fontSizeLG: 16,
        lineHeight: 1.5714285714285714,
        lineHeightLG: 1.5,
        lineWidth: 1,
        lineWidthFocus: 4,
        paddingSM: 12,
        paddingXXS: 4,
        controlPaddingHorizontal: 12,
        controlPaddingHorizontalSM: 8,
        controlOutlineWidth: 2,
        controlOutline: 'rgba(5,145,255,0.1)',
        colorErrorOutline: 'rgba(255,38,5,0.06)',
        colorWarningOutline: 'rgba(255,215,5,0.1)',
        colorBgContainer: '#ffffff',
        colorPrimary: '#1677ff',
        colorPrimaryHover: '#4096ff',
        colorTextDisabled: 'rgba(0,0,0,0.25)',
        controlItemBgActiveDisabled: 'rgba(0,0,0,0.15)',
      }),
    ).toEqual(t);
  });
});

describe('Pagination · 输入框族（本地复刻，与 input 同式）', () => {
  const i = paginationInputTokenValues();

  it('19 个字段齐全', () => {
    expect(Object.keys(i).sort()).toEqual(
      [
        'activeBg',
        'activeBorderColor',
        'activeShadow',
        'addonBg',
        'errorActiveShadow',
        'hoverBg',
        'hoverBorderColor',
        'inputAffixPadding',
        'inputFontSize',
        'inputFontSizeLG',
        'inputFontSizeSM',
        'lineWidthFocus',
        'paddingBlock',
        'paddingBlockLG',
        'paddingBlockSM',
        'paddingInline',
        'paddingInlineLG',
        'paddingInlineSM',
        'warningActiveShadow',
      ].sort(),
    );
  });

  it('padding 系算式与产物逐字一致', () => {
    expect(i.paddingBlock).toBe('4px');
    expect(i.paddingBlockSM).toBe('0px');
    expect(i.paddingBlockLG).toBe('7px');
    expect(i.paddingInline).toBe('11px');
    expect(i.paddingInlineSM).toBe('7px');
    expect(i.paddingInlineLG).toBe('11px');
  });

  it('字号 / 焦点线宽 / 阴影模板串', () => {
    expect(i.inputFontSize).toBe('14px');
    expect(i.inputFontSizeLG).toBe('16px');
    expect(i.inputFontSizeSM).toBe('14px');
    expect(i.lineWidthFocus).toBe('1px');
    expect(i.activeShadow).toBe('0 0 0 2px var(--apollo-control-outline)');
    expect(i.errorActiveShadow).toBe('0 0 0 2px var(--apollo-color-error-outline)');
  });

  it('别名派生走 var()（随主题自适应，B7 可校验）', () => {
    expect(i.addonBg).toBe('var(--apollo-color-fill-alter)');
    expect(i.hoverBg).toBe('var(--apollo-color-bg-container)');
    expect(i.activeBorderColor).toBe('var(--apollo-color-primary)');
    expect(i.hoverBorderColor).toBe('var(--apollo-color-primary-hover)');
  });
});

describe('Pagination · 派生 Token', () => {
  it('itemSizeActual 是 var 套 var；itemSpacingActual 指到 marginXS', () => {
    const d = paginationDerivedToken('apollo');
    expect(d.itemSizeActual).toBe('var(--apollo-pagination-item-size)');
    expect(d.itemSpacingActual).toBe('var(--apollo-margin-xs)');
  });
});
