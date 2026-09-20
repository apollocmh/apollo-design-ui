/**
 * L1/L2 的主题矩阵 + Component Token 断言
 *
 * ⚠️ 与 Divider 一样，**只做到「四态下都能渲染 + Token 计算逐键与 antd 对齐」**，
 *    没做到「四态下视觉正确」。原因不是偷懒：Button 的样式里没有**任何字面视觉值**，
 *    颜色/圆角/高度/间距/阴影全部是 `var(--apollo-*)`（见 `style/index.ts`）。
 *    主题切换改变的是**变量值**，不是我们的 CSS；断言「dark 下颜色不同」需要浏览器
 *    计算样式（jsdom 不做布局与层叠），那是 L6 的职责。
 *
 * ── 这一层真正在防什么 ────────────────────────────────────────────────────────
 *
 * `prepareComponentToken` 是**纯函数**（Alias token → Component token）。它写错了
 * 不会有任何测试红 —— 因为产物是 CSS 文本，jsdom 不计算层叠，L4 的 DOM 契约也看不到
 * 变量名。所以这里把它当**普通函数**逐键断言，是这个风险的唯一正解。
 *
 * ── 两处**如实登记**的缺口（不掩饰，也没有偷偷补）────────────────────────────
 *
 * 1. `solidTextColor` **不在**返回值里。antd 用 color-picker 的
 *    `isBright(new AggregationColor(token.colorBgSolid), '#fff')` 算它
 *    （`button/style/token.js:28`），本仓库没有等价能力 ⇒ 缺失，且由断言钉住「就是缺」。
 *    影响：亮色主题下 antd 算出的也是 `#fff`，我们退回 `colorTextLightSolid`，两者相同；
 *    **暗色主题会分叉**（`style/index.ts` 文件头「缺口 1」）。
 * 2. 13 个 `${colorKey}ShadowColor` 由 `getAlphaColor` 迭代求解，CSS 里没有等价写法
 *    ⇒ 构建期算出并内联成 `rgba(...)`。代价：这 13 个阴影色**不随 dark 主题自适应**。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Button } from '../index';
import { genButtonStyle } from '../style';
import { prepareComponentToken } from '../style/token';

const P = 'apollo-btn';

themeTest('Button', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

/** 一个够用的 Alias token 切片：值都是**整数或短字符串**，便于手算期望值。 */
const ALIAS = {
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
} as never;

/**
 * antd 6.6.4 `button/style/token.js:20-82` 的返回键全集（**减去** `solidTextColor`）。
 *
 * 逐键抄自上游，不是从我们的实现反推的。多一个少一个都红 —— 这是「Token 面漂移」
 * 唯一的可执行判据（`registry/components.json` 的 `derived.tokenCount` 只是个数字）。
 */
const ANTD_TOKEN_KEYS = [
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
  it('★ 返回键与 antd 6.6.4 逐键一致（缺 `solidTextColor`，见文件头缺口 1）', () => {
    const keys = Object.keys(prepareComponentToken(ALIAS)).sort();
    expect(keys).toEqual(ANTD_TOKEN_KEYS);
  });

  it('★ `solidTextColor` 缺失是**登记的缺口**，不是漏写', () => {
    // 若哪天补上了 color-picker 的 `isBright`，这条会红 —— 那时应当同时更新
    // `style/index.ts` 文件头的「缺口 1」与 `README.md` §7，并把这条断言改成正向断言。
    expect(prepareComponentToken(ALIAS)).not.toHaveProperty('solidTextColor');
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
    const other = { ...(ALIAS as Record<string, unknown>), marginXS: 20 } as never;
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
