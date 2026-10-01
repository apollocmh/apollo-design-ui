/**
 * L7 主题 —— Breadcrumb 的 Component Token（7 个）。
 *
 * ── 这个文件证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：
 *   1. `prepareComponentToken` 的**键、顺序、默认值来源**与 antd 6.6.4 逐条一致；
 *   2. `genTokenDecls` 的 7 条声明（变量名 + 构建期解析值）；
 *   3. 🚨 **双向检查**：规则引用的自有变量都在声明里（拼错 = 静默失效），
 *      且声明块**真的在根规则内部**；
 *   4. 规则引用的 `--apollo-*` **全局** token 都在 `tokens.css` 里有声明。
 *
 * 不证明：这些值被正确消费进 CSS（那是 L4/L6 的事）、视觉正确（L6 逐像素）。
 *
 * ── 🚨 第 3 条为什么必须写（本轮实测踩到）────────────────────────────────────
 *
 * 第一版 `genBreadcrumbStyle` **忘了** `...genTokenDecls(p)`（本仓约定：声明块内联在
 * 组件根规则里，见 anchor / cascader / input-number / segmented / date-picker）⇒
 * 7 个 `--apollo-breadcrumb-*` **全部未声明** ⇒ `margin-inline: var(...)` 静默失效
 * ⇒ L6 的 **24 个变体全部 block-diff**（分隔符两侧少了 8px）。
 * `lint:types` / L1 / L3 / L5 **全都是绿的** —— 只有 L6 和这条检查能发现它。
 */

import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genBreadcrumbStyle, genTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

const PREFIX = 'apollo';
const CLS = `.${PREFIX}-breadcrumb`;

/** 与 antd 的 css-var 块逐字对齐的顺序。 */
const EXPECTED_VARS = [
  '--apollo-breadcrumb-item-color',
  '--apollo-breadcrumb-last-item-color',
  '--apollo-breadcrumb-icon-font-size',
  '--apollo-breadcrumb-link-color',
  '--apollo-breadcrumb-link-hover-color',
  '--apollo-breadcrumb-separator-color',
  '--apollo-breadcrumb-separator-margin',
];

const token = getDesignToken();
const decls = genTokenDecls(PREFIX);
const css = genBreadcrumbStyle(PREFIX);

/** `--apollo-breadcrumb-x:value;` → `['--apollo-breadcrumb-x', 'value']`。 */
const splitDecl = (decl: string): [string, string] => {
  const trimmed = decl.trim().replace(/;$/, '');
  const at = trimmed.indexOf(':');
  return [trimmed.slice(0, at), trimmed.slice(at + 1)];
};

describe('Breadcrumb · Component Token 判定值', () => {
  it('`prepareComponentToken` 的**键与顺序**与上游一致（7 个）', () => {
    const t = prepareComponentToken(token);
    expect(Object.keys(t)).toEqual([
      'itemColor',
      'lastItemColor',
      'iconFontSize',
      'linkColor',
      'linkHoverColor',
      'separatorColor',
      'separatorMargin',
    ]);
  });

  it('7 个默认值逐条来自对应的**别名 token**（全部是别名派生）', () => {
    const t = prepareComponentToken(token);
    expect(t.itemColor).toBe(token.colorTextDescription);
    expect(t.lastItemColor).toBe(token.colorText);
    expect(t.iconFontSize).toBe(token.fontSize);
    expect(t.linkColor).toBe(token.colorTextDescription);
    expect(t.linkHoverColor).toBe(token.colorText);
    expect(t.separatorColor).toBe(token.colorTextDescription);
    expect(t.separatorMargin).toBe(token.marginXS);
  });

  it('`genTokenDecls` 产出 **7** 条声明，变量名与顺序与 antd 的 css-var 块一致', () => {
    expect(decls).toHaveLength(7);
    expect(decls.map((d) => splitDecl(d)[0])).toEqual(EXPECTED_VARS);
  });

  it('声明值是**构建期解析值**（颜色是字面量、尺寸带 `px`）', () => {
    const map = new Map(decls.map(splitDecl));
    expect(map.get('--apollo-breadcrumb-item-color')).toBe(String(token.colorTextDescription));
    expect(map.get('--apollo-breadcrumb-last-item-color')).toBe(String(token.colorText));
    expect(map.get('--apollo-breadcrumb-link-color')).toBe(String(token.colorTextDescription));
    expect(map.get('--apollo-breadcrumb-link-hover-color')).toBe(String(token.colorText));
    expect(map.get('--apollo-breadcrumb-separator-color')).toBe(String(token.colorTextDescription));
    expect(map.get('--apollo-breadcrumb-icon-font-size')).toBe(`${token.fontSize}px`);
    expect(map.get('--apollo-breadcrumb-separator-margin')).toBe(`${token.marginXS}px`);
  });
});

describe('Breadcrumb · 声明 ↔ 引用（双向）', () => {
  it('🚨 声明块**必须在根规则内部**（漏了它 = 7 个变量全未声明、整片样式静默失效）', () => {
    const rootStart = css.indexOf(`${CLS}{`);
    expect(rootStart).toBeGreaterThanOrEqual(0);
    const rootRule = css.slice(rootStart, css.indexOf('}', rootStart));

    for (const decl of decls) {
      expect(rootRule).toContain(decl.trim());
    }
  });

  it('🚨 规则引用的**自有**变量全部在 `genTokenDecls` 里（拼错 = 静默失效）', () => {
    const declared = new Set(decls.map((d) => splitDecl(d)[0]));
    const referenced = [...css.matchAll(/var\((--apollo-breadcrumb-[a-z-]+)\)/g)].map(
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
});

describe('Breadcrumb · 全局 token 引用', () => {
  it('规则引用的 `--apollo-*` 全局 token 都在 `tokens.css` 里有声明', () => {
    // ⚠️ `getCSSVarDeclarations(token, options)` 返回的是一段 **CSS 文本**
    //    （`:root{--apollo-color-primary:#1677ff;…}`），不是声明数组。
    const globalCss = getCSSVarDeclarations(getDesignToken());
    const declaredGlobals = new Set(
      [...globalCss.matchAll(/(--apollo-[a-z0-9-]+):/g)].map((m) => m[1] as string),
    );

    const referenced = [...css.matchAll(/var\((--apollo-[a-z0-9-]+)\)/g)]
      .map((m) => m[1] as string)
      // 自有变量（`--apollo-breadcrumb-*`）由 `genTokenDecls` 声明，不在 tokens.css 里
      .filter((name) => !name.startsWith('--apollo-breadcrumb-'));

    expect(referenced.length).toBeGreaterThan(0);
    for (const name of new Set(referenced)) {
      expect(declaredGlobals).toContain(name);
    }
  });

  it('RTL 规则用的是**复合选择器**（`&.{p}-rtl` ⇒ `.apollo-breadcrumb.apollo-breadcrumb-rtl`）', () => {
    expect(css).toContain(`${CLS}.${PREFIX}-breadcrumb-rtl{`);
    expect(css).toContain('direction:rtl;');
  });
});
