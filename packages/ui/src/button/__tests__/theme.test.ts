/** Current Button token preparation; source/theme/browser acceptance is recorded separately. */

import { themeTest } from '@apollo-design/test-utils';
import { getDesignToken } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Button } from '../index';
import { genButtonStyle } from '../style';
import type { ButtonTokenInput } from '../style/token';
import { prepareComponentToken } from '../style/token';

const P = 'apollo-btn';

themeTest('Button', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

/** 一个够用的 Alias token 切片：值都是**整数或短字符串**，便于手算期望值。 */
const ALIAS = {
  ...getDesignToken(),
  fontSize: 14,
  fontSizeLG: 16,
  controlHeight: 32,
  controlHeightSM: 24,
  controlHeightLG: 40,
  lineWidth: 1,
  marginXS: 8,
  controlOutlineWidth: 2,
  colorBgContainer: '#ffffff',
  colorText: 'rgba(0, 0, 0, 0.88)',
  colorBorder: '#d9d9d9',
  colorBorderDisabled: '#d9d9d9',
  colorPrimaryHover: '#4096ff',
  colorPrimaryActive: '#0958d9',
  colorTextLightSolid: '#fff',
  colorErrorOutline: 'rgba(255, 38, 5, 0.06)',
  controlOutline: 'rgba(5, 145, 255, 0.1)',
  controlTmpOutline: 'rgba(0, 0, 0, 0.02)',
  colorBgContainerDisabled: 'rgba(0, 0, 0, 0.04)',
  colorFillTertiary: 'rgba(0, 0, 0, 0.04)',
  paddingContentHorizontal: 16,
  // 13 个预设色板的一级色（阴影色由它 + colorBgContainer 求解）
  blue1: '#e6f4ff',
  purple1: '#f9f0ff',
  cyan1: '#e6fffb',
  green1: '#f6ffed',
  magenta1: '#fff0f6',
  pink1: '#fff0f6',
  red1: '#fff1f0',
  orange1: '#fff7e6',
  yellow1: '#feffe6',
  volcano1: '#fff2e8',
  geekblue1: '#f0f5ff',
  lime1: '#fcffe6',
  gold1: '#fffbe6',
} satisfies ButtonTokenInput;

/**
 * antd 6.6.4 `button/style/token.js:20-82` 的返回键全集（**减去** `solidTextColor`）。
 *
 * 逐键抄自上游，不是从我们的实现反推的。多一个少一个都红 —— 这是「Token 面漂移」
 * 唯一的可执行判据（`registry/components.json` 的 `derived.tokenCount` 只是个数字）。
 */
const BUTTON_TOKEN_KEYS = [
  'solidTextColor',
  'blueShadowColor',
  'borderColorDisabled',
  'contentFontSize',
  'contentFontSizeLG',
  'contentFontSizeSM',
  'contentLineHeight',
  'contentLineHeightLG',
  'contentLineHeightSM',
  'cyanShadowColor',
  'dangerColor',
  'dangerShadow',
  'dashedBgDisabled',
  'defaultActiveBg',
  'defaultActiveBorderColor',
  'defaultActiveColor',
  'defaultBg',
  'defaultBgDisabled',
  'defaultBorderColor',
  'defaultBorderColorDisabled',
  'defaultColor',
  'defaultGhostBorderColor',
  'defaultGhostColor',
  'defaultHoverBg',
  'defaultHoverBorderColor',
  'defaultHoverColor',
  'defaultShadow',
  'fontWeight',
  'geekblueShadowColor',
  'ghostBg',
  'goldShadowColor',
  'greenShadowColor',
  'groupBorderColor',
  'iconGap',
  'limeShadowColor',
  'linkHoverBg',
  'magentaShadowColor',
  'onlyIconSize',
  'onlyIconSizeLG',
  'onlyIconSizeSM',
  'orangeShadowColor',
  'paddingBlock',
  'paddingBlockLG',
  'paddingBlockSM',
  'paddingInline',
  'paddingInlineLG',
  'paddingInlineSM',
  'pinkShadowColor',
  'primaryColor',
  'primaryShadow',
  'purpleShadowColor',
  'redShadowColor',
  'textHoverBg',
  'textTextActiveColor',
  'textTextColor',
  'textTextHoverColor',
  'volcanoShadowColor',
  'yellowShadowColor',
].sort();

describe('Button · Component Token', () => {
  it('全部58个现有字段均有默认值，含solidTextColor与13个阴影', () => {
    const keys = Object.keys(prepareComponentToken(ALIAS)).sort();
    expect(keys).toEqual(BUTTON_TOKEN_KEYS);
  });

  it('solidTextColor 准备默认值，自动前景由浏览器按实际实色背景处理', () => {
    expect(prepareComponentToken(ALIAS).solidTextColor).toBe(ALIAS.colorTextLightSolid);
  });
  it('字号0保留，非有限负值回退且所有派生值有限', () => {
    for (const contentFontSize of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const token = prepareComponentToken({ ...ALIAS, contentFontSize });
      expect(token.contentFontSize).toBe(contentFontSize === 0 ? 0 : ALIAS.fontSize);
      expect(Number.isFinite(token.contentLineHeight)).toBe(true);
      expect(Number.isFinite(token.paddingBlock)).toBe(true);
    }
  });

  it('字面量 Token：`fontWeight` 恒为 400', () => {
    expect(prepareComponentToken(ALIAS).fontWeight).toBe(400);
  });

  it('三个「透明」字面量：`ghostBg` / `linkHoverBg` 是 transparent', () => {
    const t = prepareComponentToken(ALIAS);
    expect(t.ghostBg).toBe('transparent');
    expect(t.linkHoverBg).toBe('transparent');
  });

  it('★ `paddingInline = paddingContentHorizontal - lineWidth`、`paddingInlineSM = 8 - lineWidth`', () => {
    const t = prepareComponentToken(ALIAS);
    expect(t.paddingInline).toBe(15);
    expect(t.paddingInlineLG).toBe(15);
    expect(t.paddingInlineSM).toBe(7);
  });

  it('★ `paddingBlock` 是「(高度 - 内容高)/2 - 线宽」且**不为负**（Math.max(…, 0)）', () => {
    const t = prepareComponentToken(ALIAS);
    // `getLineHeight(n) = (n + 8) / n`（`theme/src/shared/font-sizes.ts:27`，与 antd 同式）
    //   ⇒ 内容高恒为 `fontSize + 8`：
    //   base:  controlHeight 32、fontSize 14 → 内容高 22 → (32-22)/2 - 1 = 4
    //   sm:    controlHeight 24、fontSize 14 → 内容高 22 → (24-22)/2 - 1 = 0
    //   lg:    controlHeight 40、fontSizeLG 16 → 内容高 24 → (40-24)/2 - 1 = 7
    expect(t.paddingBlock).toBe(4);
    expect(t.paddingBlockSM).toBe(0);
    expect(t.paddingBlockLG).toBe(7);
  });

  it('★ 13 个预设阴影色都在，且是 `getAlphaColor` 的产物（`rgba(...)`）', () => {
    const t = prepareComponentToken(ALIAS);
    const shadows = Object.keys(t).filter((k) => k.endsWith('ShadowColor'));
    expect(shadows).toHaveLength(13);
    for (const key of shadows) {
      const value = String(t[key as keyof typeof t]);
      // 形态断言（不是具体值）：`0 <outlineWidth>px 0 rgba(...)`。
      // 具体值依赖 `getAlphaColor` 的迭代求解，由 utils 的测试覆盖。
      expect(value.startsWith('0 2px 0 rgba('), `${key} = ${value}`).toBe(true);
    }
  });

  it('★ 派生自 Alias 的 token 跟着入参走（换 Alias 值 ⇒ 换结果）', () => {
    const other = { ...ALIAS, marginXS: 20 } satisfies ButtonTokenInput;
    expect(prepareComponentToken(other).iconGap).toBe(20);
    expect(prepareComponentToken(ALIAS).iconGap).toBe(8);
  });
});

describe('Button · 主题无关性', () => {
  it('四态下的 DOM 完全相同（差异全在 CSS 变量里）', () => {
    // 组件本身不读任何 token 值，所以同一份 HTML 在四态下都成立。
    // 这条断言的作用是：一旦有人往组件里塞进「按主题分支」的逻辑，它会红。
    const html = mount(Button).html();
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain(`class="${P}`);
  });

  it('样式里引用的变量全部是 `--apollo-*` 形态（H9）', () => {
    const vars = [...genButtonStyle('apollo').matchAll(/var\((--[a-z0-9-]+)\)/g)].map(
      (m) => m[1] ?? '',
    );
    expect(vars.length).toBeGreaterThan(40);
    for (const name of vars) {
      expect(name.startsWith('--apollo-')).toBe(true);
    }
  });

  it('前缀不同则产物不同（否则 prefixCls 参数是摆设）', () => {
    expect(genButtonStyle('apollo')).not.toBe(genButtonStyle('ant'));
    expect(genButtonStyle('ant')).toContain('.ant-btn-icon');
    expect(genButtonStyle('ant')).toContain('.ant-btn-variant-solid');
  });

  it('★ 圆角/高度/字号全部走变量，没有内联的 px 字面量（E10 家族）', () => {
    const css = genButtonStyle('apollo');
    // `border-radius` 后面必须是 `var(--apollo-*)`；唯一允许的字面量是 `0`
    // （compact-item 的方角，`style/index.ts:631,658`，`0` 不是设计值、不需要 token）。
    expect(css).not.toMatch(/border-radius:\s*[1-9]/);
    expect(css).toContain('border-radius:0');
    expect(css).toContain('border-radius:var(--apollo-border-radius)');
    expect(css).toContain('height:var(--apollo-control-height)');
  });
});
