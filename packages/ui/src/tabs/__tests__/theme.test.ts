/**
 * L7 主题 —— Tabs 的 Component Token（**26 个** + 6 个内部 token）。
 *
 * 判定值逐字对拍 antd 6.6.4 产物（可复现命令：
 * `node tests/visual/debug/extract-tabs-css.mjs --tokens`）。
 *
 * G11 起 demo 是真的，主题矩阵也接上了：`themeTest('Tabs', { demos })` 会把 13 个 demo
 * 在 light / dark / compact / token-override 四种主题下各渲染一遍。
 *
 * ── 这个文件证明了什么 / 没证明什么 ────────────────────────────────────────────
 *
 * 证明：26 个 token 的**判定值与派生算式**与上游一致；内部 token 的 6 个字段与判定值；
 * 三个 `cardHeight` 覆盖位真的参与「合并后回写」；纯函数性质。
 *
 * 没证明：这些值在**产物 CSS** 里被正确消费（那是 G4 的机械移植 + L6 的逐像素比对）；
 * 也没证明 ConfigProvider 能覆盖它们（本仓没有那条管线，见 `style/token.ts` 的缺口说明）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import {
  prepareComponentToken,
  prepareInternalToken,
  type TabsSeedToken,
  tabsInternalTokenValues,
  tabsTokenValues,
} from '../style/token';

const seed = (): TabsSeedToken => getDesignToken() as unknown as TabsSeedToken;

describe('Tabs · Component Token 判定值（antd 产物逐字对拍）', () => {
  const t = tabsTokenValues();

  it('26 个字段恰好齐全（不多不少）', () => {
    expect(Object.keys(t).sort()).toEqual(
      [
        'zIndexPopup',
        'cardBg',
        'cardHeight',
        'cardHeightSM',
        'cardHeightLG',
        'cardPadding',
        'cardPaddingSM',
        'cardPaddingLG',
        'titleFontSize',
        'titleFontSizeLG',
        'titleFontSizeSM',
        'inkBarColor',
        'horizontalMargin',
        'horizontalItemGutter',
        'horizontalItemMargin',
        'horizontalItemMarginRTL',
        'horizontalItemPadding',
        'horizontalItemPaddingSM',
        'horizontalItemPaddingLG',
        'verticalItemPadding',
        'verticalItemMargin',
        'itemColor',
        'itemActiveColor',
        'itemHoverColor',
        'itemSelectedColor',
        'cardGutter',
      ].sort(),
    );
    expect(Object.keys(t).length).toBe(26);
  });

  it('z-index：`zIndexPopupBase + 50`', () => {
    expect(t.zIndexPopup).toBe(1050); // 1000 + 50
  });

  it('cardHeight 家族：三档高度（合并后的值）', () => {
    expect(t.cardHeight).toBe(40); // ?? controlHeightLG
    expect(t.cardHeightSM).toBe(32); // ?? controlHeight
    expect(t.cardHeightLG).toBe(48); // ?? controlHeightLG + 8
  });

  it('cardPadding 家族：`(h − fontHeight)/2 − lineWidth` + 内边距', () => {
    // (40 − 22)/2 − 1 = 8，配 padding 16
    expect(t.cardPadding).toBe('8px 16px');
    // (32 − 22)/2 − 1 = 4，配 paddingXS 8
    expect(t.cardPaddingSM).toBe('4px 8px');
    // (48 − 24)/2 − 1 = 11，配 padding 16
    expect(t.cardPaddingLG).toBe('11px 16px');
  });

  it('titleFontSize 家族：fontSize / fontSizeLG；SM 复用 fontSize', () => {
    expect(t.titleFontSize).toBe(14);
    expect(t.titleFontSizeLG).toBe(16);
    expect(t.titleFontSizeSM).toBe(14); // 上游就是 token.fontSize（不是 fontSizeSM）
  });

  it('颜色族（别名直取）', () => {
    expect(t.cardBg).toBe('rgba(0,0,0,0.02)'); // colorFillAlter
    expect(t.inkBarColor).toBe('#1677ff'); // colorPrimary
    expect(t.itemColor).toBe('rgba(0,0,0,0.88)'); // colorText
    expect(t.itemSelectedColor).toBe('#1677ff'); // colorPrimary
    expect(t.itemHoverColor).toBe('#4096ff'); // colorPrimaryHover
    expect(t.itemActiveColor).toBe('#0958d9'); // colorPrimaryActive
  });

  it('横向：margin / 固定 gutter / 三档 padding', () => {
    expect(t.horizontalMargin).toBe('0 0 16px 0');
    expect(t.horizontalItemGutter).toBe(32); // 固定值
    expect(t.horizontalItemPadding).toBe('12px 0'); // paddingSM
    expect(t.horizontalItemPaddingSM).toBe('8px 0'); // paddingXS
    expect(t.horizontalItemPaddingLG).toBe('16px 0'); // padding
  });

  it('两个「空串占位」token 存在且为空（与上游的 26 个逐字对齐）', () => {
    expect(t.horizontalItemMargin).toBe('');
    expect(t.horizontalItemMarginRTL).toBe('');
  });

  it('纵向：padding / margin 与 cardGutter', () => {
    expect(t.verticalItemPadding).toBe('8px 24px'); // paddingXS + paddingLG
    expect(t.verticalItemMargin).toBe('16px 0 0 0'); // margin
    expect(t.cardGutter).toBe(2); // marginXXS / 2
  });

  it('★ cardHeight 的三个覆盖位真的参与「合并后回写」', () => {
    // 上游注释：`cardHeight` 会锁住 nav add 按钮的高度 ⇒ 回写的是**合并后**的值。
    const overridden = prepareComponentToken({ ...seed(), cardHeight: 56, cardHeightLG: 64 });
    expect(overridden.cardHeight).toBe(56);
    expect(overridden.cardHeightLG).toBe(64);
    // 高度变了 ⇒ cardPadding 跟着重算（(56 − 22)/2 − 1 = 16）
    expect(overridden.cardPadding).toBe('16px 16px');
    // 未覆盖的那一档仍是默认派生
    expect(overridden.cardHeightSM).toBe(32);
  });

  it('纯函数：同一入参必得同一出参', () => {
    const a = prepareComponentToken(seed());
    const b = prepareComponentToken(seed());
    expect(a).toEqual(b);
    expect(a).not.toBe(b); // 不是同一个对象引用
    // 且与缓存路径的结果一致
    expect(tabsTokenValues()).toEqual(a);
  });

  it('与 seed 的取值一一对应（改一个 seed 字段，判定值跟着变）', () => {
    const customized = prepareComponentToken({
      ...seed(),
      colorPrimary: '#ff0000',
      colorPrimaryHover: '#ff3333',
      colorPrimaryActive: '#cc0000',
      margin: 20,
    });
    expect(customized.inkBarColor).toBe('#ff0000');
    expect(customized.itemSelectedColor).toBe('#ff0000');
    expect(customized.itemHoverColor).toBe('#ff3333');
    expect(customized.itemActiveColor).toBe('#cc0000');
    expect(customized.horizontalMargin).toBe('0 0 20px 0');
    expect(customized.verticalItemMargin).toBe('20px 0 0 0');
  });
});

describe('Tabs · 内部 token（mergeToken 的本地复刻）', () => {
  const i = tabsInternalTokenValues();

  it('恰好 6 个字段（上游 .d.ts 里的第 7 个是死字段，刻意不实现）', () => {
    expect(Object.keys(i).sort()).toEqual(
      [
        'tabsCardPadding',
        'dropdownEdgeChildVerticalPadding',
        'tabsDropdownHeight',
        'tabsDropdownWidth',
        'tabsHorizontalItemMargin',
        'tabsHorizontalItemMarginRTL',
      ].sort(),
    );
    expect(Object.keys(i)).not.toContain('tabsNavWrapPseudoWidth');
  });

  it('判定值：两个字面量 + 一个别名 + 两个拼串', () => {
    expect(i.tabsCardPadding).toBe(tabsTokenValues().cardPadding); // 冗余别名
    expect(i.dropdownEdgeChildVerticalPadding).toBe(4); // paddingXXS
    expect(i.tabsDropdownHeight).toBe(200); // 字面量
    expect(i.tabsDropdownWidth).toBe(120); // 字面量
    expect(i.tabsHorizontalItemMargin).toBe('0 0 0 32px');
    expect(i.tabsHorizontalItemMarginRTL).toBe('0 0 0 32px');
  });

  it('gutter 变化会带动两个 margin 串（不是写死的 32px）', () => {
    const customized = prepareInternalToken(seed(), {
      ...tabsTokenValues(),
      horizontalItemGutter: 48,
    });
    expect(customized.tabsHorizontalItemMargin).toBe('0 0 0 48px');
    expect(customized.tabsHorizontalItemMarginRTL).toBe('0 0 0 48px');
  });
});

themeTest('Tabs', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});
