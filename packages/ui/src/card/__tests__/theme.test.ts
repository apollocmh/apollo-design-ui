/**
 * L7 主题 —— Card 的 Component Token（13 个）+ 4 个 `mergeToken` 派生的落点。
 *
 * ── 这个文件证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：
 *   1. `prepareComponentToken` 的**键、顺序、默认值来源**与 antd 6.6.4 逐条一致；
 *   2. `genTokenDecls` 的 13 条声明（变量名 + 构建期解析值）与 antd 产物里
 *      `--ant-card-*` 的 css-var 块**逐条同构**（含 4 个**交叉验证的硬值**：
 *      `56px` / `38px` / `-17px` / `12px 0`）；
 *   3. 🚨 **双向检查**：规则引用的自有变量都在声明里（拼错 = 静默失效），
 *      且声明块**真的在根规则内部**；
 *   4. 规则引用的 `--apollo-*` **全局** token 都在 `tokens.css` 里有声明；
 *   5. 4 个 `mergeToken` 派生（用户不可覆盖）落的是**全局** token，不是自有变量。
 *
 * 不证明：这些值被正确消费进 CSS（那是 L4/L6 的事）、视觉正确（L6 逐像素）。
 *
 * ── 🚨 第 3 条为什么必须写（breadcrumb 实测踩到）──────────────────────────────
 *
 * `genCardStyle` 若**忘了** `...genTokenDecls(p)`（本仓约定：声明块内联在组件根规则里），
 * 13 个 `--apollo-card-*` **全部未声明** ⇒ `padding:var(...)` / `background:var(...)`
 * 静默失效（未定义 var 不是回退默认值，而是 invalid at computed-value time）⇒
 * 视觉全错，而 `lint:types` / L1 / L3 / L5 **全都是绿的**。
 * 只有 L6 与这条检查能发现它。
 */

import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genCardStyle, genTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

const PREFIX = 'apollo';
const CLS = `.${PREFIX}-card`;

/** 与 antd 的 css-var 块逐字对齐的顺序（`--ant-card-*` 的声明顺序）。 */
const EXPECTED_VARS = [
  '--apollo-card-header-bg',
  '--apollo-card-header-font-size',
  '--apollo-card-header-font-size-sm',
  '--apollo-card-header-height',
  '--apollo-card-header-height-sm',
  '--apollo-card-actions-bg',
  '--apollo-card-actions-li-margin',
  '--apollo-card-tabs-margin-bottom',
  '--apollo-card-extra-color',
  '--apollo-card-body-padding-sm',
  '--apollo-card-header-padding-sm',
  '--apollo-card-body-padding',
  '--apollo-card-header-padding',
];

const token = getDesignToken();
const decls = genTokenDecls(PREFIX);
const css = genCardStyle(PREFIX);

/** `--apollo-card-x:value;` → `['--apollo-card-x', 'value']`。 */
const splitDecl = (decl: string): [string, string] => {
  const trimmed = decl.trim().replace(/;$/, '');
  const at = trimmed.indexOf(':');
  return [trimmed.slice(0, at), trimmed.slice(at + 1)];
};

describe('Card · Component Token 判定值', () => {
  it('`prepareComponentToken` 的**键与顺序**与上游一致（13 个）', () => {
    const t = prepareComponentToken(token);
    expect(Object.keys(t)).toEqual([
      'headerBg',
      'headerFontSize',
      'headerFontSizeSM',
      'headerHeight',
      'headerHeightSM',
      'actionsBg',
      'actionsLiMargin',
      'tabsMarginBottom',
      'extraColor',
      'bodyPaddingSM',
      'headerPaddingSM',
      'bodyPadding',
      'headerPadding',
    ]);
  });

  it('默认值逐条来自对应的别名 token / 字面量（上游 `prepareComponentToken` 的算式）', () => {
    const t = prepareComponentToken(token);
    // 字面量
    expect(t.headerBg).toBe('transparent');
    expect(t.bodyPaddingSM).toBe(12);
    expect(t.headerPaddingSM).toBe(12);
    // 别名派生
    expect(t.headerFontSize).toBe(token.fontSizeLG);
    expect(t.headerFontSizeSM).toBe(token.fontSize);
    expect(t.actionsBg).toBe(token.colorBgContainer);
    expect(t.extraColor).toBe(token.colorText);
    expect(t.actionsLiMargin).toBe(`${token.paddingSM}px 0`);
    // 算式派生
    expect(t.headerHeight).toBe(token.fontSizeLG * token.lineHeightLG + token.padding * 2);
    expect(t.headerHeightSM).toBe(token.fontSize * token.lineHeight + token.paddingXS * 2);
    expect(t.tabsMarginBottom).toBe(-token.padding - token.lineWidth);
    // ⚠️ 上游是 `token.bodyPadding ?? token.paddingLG` —— 那两个键**不在** `AliasToken` 里
    //    （antd v4 遗留），产物交叉验证它们恒为 `undefined` ⇒ 本仓直接写 `paddingLG`。
    expect(t.bodyPadding).toBe(token.paddingLG);
    expect(t.headerPadding).toBe(token.paddingLG);
  });

  it('`genTokenDecls` 产出 **13** 条声明，变量名与顺序与 antd 的 css-var 块一致', () => {
    expect(decls).toHaveLength(13);
    expect(decls.map((d) => splitDecl(d)[0])).toEqual(EXPECTED_VARS);
  });

  it('声明值是**构建期解析值**（颜色是字面量、尺寸带 `px`）', () => {
    const map = new Map(decls.map(splitDecl));
    expect(map.get('--apollo-card-header-bg')).toBe('transparent');
    expect(map.get('--apollo-card-header-font-size')).toBe(`${token.fontSizeLG}px`);
    expect(map.get('--apollo-card-header-font-size-sm')).toBe(`${token.fontSize}px`);
    expect(map.get('--apollo-card-header-height')).toBe(
      `${token.fontSizeLG * token.lineHeightLG + token.padding * 2}px`,
    );
    expect(map.get('--apollo-card-header-height-sm')).toBe(
      `${token.fontSize * token.lineHeight + token.paddingXS * 2}px`,
    );
    expect(map.get('--apollo-card-actions-bg')).toBe(String(token.colorBgContainer));
    expect(map.get('--apollo-card-actions-li-margin')).toBe(`${token.paddingSM}px 0`);
    expect(map.get('--apollo-card-tabs-margin-bottom')).toBe(
      `${-token.padding - token.lineWidth}px`,
    );
    expect(map.get('--apollo-card-extra-color')).toBe(String(token.colorText));
    expect(map.get('--apollo-card-body-padding-sm')).toBe('12px');
    expect(map.get('--apollo-card-header-padding-sm')).toBe('12px');
    expect(map.get('--apollo-card-body-padding')).toBe(`${token.paddingLG}px`);
    expect(map.get('--apollo-card-header-padding')).toBe(`${token.paddingLG}px`);
  });

  /**
   * 🚨 4 个**交叉验证的硬值** —— 它们**不**从 `getDesignToken()` 推导，而是
   * 逐字来自 antd 6.6.4 的真实产物（`extract-card-css.mjs` 的 css-var 块）：
   *
   * ```
   * --ant-card-header-height:56px;
   * --ant-card-header-height-sm:38px;
   * --ant-card-tabs-margin-bottom:-17px;
   * --ant-card-actions-li-margin:12px 0;
   * ```
   *
   * 这条用例是**防腐断言**：如果哪天本仓的 `fontSize` / `lineHeight` / `padding`
   * 等别名 token 漂了，它会在 G3 就报出来（而不是等到 L6 才发现整片间距变了）。
   */
  it('🚨 四个算式派生的值 == antd 产物里的硬值（防腐断言）', () => {
    const map = new Map(decls.map(splitDecl));
    expect(map.get('--apollo-card-header-height')).toBe('56px');
    expect(map.get('--apollo-card-header-height-sm')).toBe('38px');
    expect(map.get('--apollo-card-tabs-margin-bottom')).toBe('-17px');
    expect(map.get('--apollo-card-actions-li-margin')).toBe('12px 0');
  });
});

describe('Card · 声明 ↔ 引用（双向）', () => {
  it('🚨 声明块**必须在根规则内部**（漏了它 = 13 个变量全未声明、整片样式静默失效）', () => {
    const rootStart = css.indexOf(`${CLS}{`);
    expect(rootStart).toBeGreaterThanOrEqual(0);
    const rootRule = css.slice(rootStart, css.indexOf('}', rootStart));

    for (const decl of decls) {
      expect(rootRule).toContain(decl.trim());
    }
  });

  it('🚨 规则引用的**自有**变量全部在 `genTokenDecls` 里（拼错 = 静默失效）', () => {
    const declared = new Set(decls.map((d) => splitDecl(d)[0]));
    const referenced = [...css.matchAll(/var\((--apollo-card-[a-z-]+)\)/g)].map(
      (m) => m[1] as string,
    );

    expect(referenced.length).toBeGreaterThan(0);
    for (const name of new Set(referenced)) {
      expect(declared).toContain(name);
    }
  });

  it('🚨 `genTokenDecls` 的每条都被规则引用（没有死变量）', () => {
    for (const decl of decls) {
      expect(css).toContain(`var(${splitDecl(decl)[0]})`);
    }
  });

  it('🚨 规则引用的 `--apollo-*` 全局 token 都在 `tokens.css` 里有声明', () => {
    // ⚠️ `getCSSVarDeclarations(token, options)` 返回的是一段 **CSS 文本**
    //    （`:root{--apollo-color-primary:#1677ff;…}`），不是声明数组。
    const globalCss = getCSSVarDeclarations(getDesignToken());
    const declaredGlobals = new Set(
      [...globalCss.matchAll(/(--apollo-[a-z0-9-]+):/g)].map((m) => m[1] as string),
    );

    const referenced = [...css.matchAll(/var\((--apollo-[a-z0-9-]+)\)/g)]
      .map((m) => m[1] as string)
      // 自有变量（`--apollo-card-*`）由 `genTokenDecls` 声明，不在 tokens.css 里
      .filter((name) => !name.startsWith('--apollo-card-'));

    expect(referenced.length).toBeGreaterThan(0);
    for (const name of new Set(referenced)) {
      expect(declaredGlobals).toContain(name);
    }
  });
});

describe('Card · 4 个 `mergeToken` 派生的落点（用户不可覆盖）', () => {
  /**
   * 上游 `mergeToken<CardToken>(token, { cardShadow, cardHeadPadding, cardPaddingBase,
   * cardActionsIconSize })` —— 它们**不进** `ComponentToken`，产物里直接展开成
   * **全局** token 引用。本仓照抄 ⇒ 断言它们是 `var(--apollo-*)` 而不是自有变量。
   */
  it.each([
    ['cardShadow → boxShadowCard', 'box-shadow:var(--apollo-box-shadow-card)'],
    ['cardHeadPadding → padding', 'padding-top:var(--apollo-padding)'],
    ['cardPaddingBase → paddingLG', 'padding:var(--apollo-padding-lg)'],
    ['cardActionsIconSize → fontSize', 'min-width:calc(var(--apollo-font-size) * 2)'],
  ])('%s', (_label, expected) => {
    expect(css).toContain(expected);
  });

  it('它们**不**出现在 `genTokenDecls` 里（派生值不是 Component Token）', () => {
    for (const name of [
      'card-shadow',
      'card-head-padding',
      'card-padding-base',
      'card-actions-icon-size',
    ]) {
      expect(decls.join('\n')).not.toContain(`--apollo-card-${name}`);
    }
  });
});

describe('Card · 关键选择器形态（从产物抄下来的三处非显然结构）', () => {
  it('head 里的 tabs 用的是**全局** Tabs 类名（`antCls`），不是 `apollo-card-tabs`', () => {
    expect(css).toContain(`${CLS} ${CLS}-head .apollo-tabs-top{`);
    expect(css).toContain(`${CLS} ${CLS}-head .apollo-tabs-top-bar{`);
  });

  it('🚨 RTL 是**独立**选择器（`.apollo-card-rtl`，**不是**复合 —— 上游把它放在 genCardStyle 顶层）', () => {
    expect(css).toContain(`${CLS}-rtl{`);
    expect(css).toContain('direction:rtl;');
  });

  it('`-contain-tabs` 用**子选择器** `>div.{p}-head`（少一个 `>` 语义就变了）', () => {
    expect(css).toContain(`${CLS}-contain-tabs >div${CLS}-head{`);
  });

  it('`-contain-grid` 的 `:has()` 里是**子选择器**', () => {
    expect(css).toContain(`${CLS}-contain-grid:not(:has(> ${CLS}-head)){`);
  });

  it('🚨 两条「死选择器」照抄（UPSTREAM quirk，见 README §2）', () => {
    // 上游把 Typography 的前缀写成了 `${componentCls}-typography`（应为 `.apollo-typography`）
    expect(css).toContain(`${CLS} ${CLS}-head-title >${CLS}-typography`);
    // Card 里没有 `-btn`
    expect(css).toContain(`a:not(${CLS}-btn)`);
  });
});
