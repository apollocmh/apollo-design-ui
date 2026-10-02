/**
 * L7 · Component Token 判定值与「声明 ↔ 引用」双向检查。
 *
 * 这一层**不进真实浏览器**，但它挡住的是一整类「构建期产物错了」的问题：
 * 变量名拼错、声明块漏了某个根形态、`calc()` 被预计算成字面量、token 默认值与上游漂移。
 *
 * ── 本文件钉的五类判据 ───────────────────────────────────────────────────────
 *
 * 1. **`prepareComponentToken` 的键与顺序**（11 个，与产物 css-var 块逐条一致）。
 * 2. **每个默认值的来源**（别名 token 或字面量）—— 上游算式逐条对拍。
 * 3. **`genTokenDecls` 产出 11 条声明**，变量名与顺序与 antd 的 css-var 块一致。
 * 4. 🚨 **声明块必须覆盖两个根形态**（`.{p}-list` + `.{p}-list-container`）——
 *    上游的 `extraCssVarPrefixCls`（D95 家族，image 两根 / input 三根同判）。
 * 5. 🚨 **两处 `calc()` 必须保留为表达式**（`borderRadiusLG - lineWidth` /
 *    `fontHeight - marginXXS * 2`）—— 预计算成字面量会与产物分叉。
 */

import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genListStyle, genTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

const CLS = '.apollo-list';
const decls = genTokenDecls('apollo');
const css = genListStyle('apollo');

/** `  --x:y;` → `['--x', 'y']` */
const splitDecl = (decl: string): [string, string] => {
  const trimmed = decl.trim().replace(/;$/, '');
  const idx = trimmed.indexOf(':');
  return [trimmed.slice(0, idx), trimmed.slice(idx + 1)];
};

const EXPECTED_VARS = [
  '--apollo-list-content-width',
  '--apollo-list-item-padding',
  '--apollo-list-item-padding-sm',
  '--apollo-list-item-padding-lg',
  '--apollo-list-header-bg',
  '--apollo-list-footer-bg',
  '--apollo-list-empty-text-padding',
  '--apollo-list-meta-margin-bottom',
  '--apollo-list-avatar-margin-right',
  '--apollo-list-title-margin-bottom',
  '--apollo-list-description-font-size',
];

describe('List · Component Token 判定值', () => {
  it('`prepareComponentToken` 的**键与顺序**与上游一致（11 个）', () => {
    const token = getDesignToken();
    const t = prepareComponentToken(token);
    expect(Object.keys(t)).toEqual([
      'contentWidth',
      'itemPadding',
      'itemPaddingSM',
      'itemPaddingLG',
      'headerBg',
      'footerBg',
      'emptyTextPadding',
      'metaMarginBottom',
      'avatarMarginRight',
      'titleMarginBottom',
      'descriptionFontSize',
    ]);
  });

  it('默认值逐条来自对应的别名 token（上游 `prepareComponentToken` 的算式）', () => {
    const token = getDesignToken();
    const t = prepareComponentToken(token);
    expect(t.contentWidth).toBe(220);
    expect(t.itemPadding).toBe(`${token.paddingContentVertical}px 0`);
    expect(t.itemPaddingSM).toBe(
      `${token.paddingContentVerticalSM}px ${token.paddingContentHorizontal}px`,
    );
    expect(t.itemPaddingLG).toBe(
      `${token.paddingContentVerticalLG}px ${token.paddingContentHorizontalLG}px`,
    );
    expect(t.headerBg).toBe('transparent');
    expect(t.footerBg).toBe('transparent');
    expect(t.emptyTextPadding).toBe(token.padding);
    expect(t.metaMarginBottom).toBe(token.padding);
    expect(t.avatarMarginRight).toBe(token.padding);
    expect(t.titleMarginBottom).toBe(token.paddingSM);
    expect(t.descriptionFontSize).toBe(token.fontSize);
  });

  it('`genTokenDecls` 产出 **11** 条声明，变量名与顺序与 antd 的 css-var 块一致', () => {
    expect(decls).toHaveLength(11);
    expect(decls.map((d) => splitDecl(d)[0])).toEqual(EXPECTED_VARS);
  });

  it('声明值是**构建期解析值**（尺寸带 `px`、颜色/关键字原样）', () => {
    const map = new Map(decls.map(splitDecl));
    expect(map.get('--apollo-list-content-width')).toBe('220px');
    expect(map.get('--apollo-list-item-padding')).toBe('12px 0');
    expect(map.get('--apollo-list-item-padding-sm')).toBe('8px 16px');
    expect(map.get('--apollo-list-item-padding-lg')).toBe('16px 24px');
    expect(map.get('--apollo-list-header-bg')).toBe('transparent');
    expect(map.get('--apollo-list-footer-bg')).toBe('transparent');
    expect(map.get('--apollo-list-empty-text-padding')).toBe('16px');
    expect(map.get('--apollo-list-meta-margin-bottom')).toBe('16px');
    expect(map.get('--apollo-list-avatar-margin-right')).toBe('16px');
    expect(map.get('--apollo-list-title-margin-bottom')).toBe('12px');
    expect(map.get('--apollo-list-description-font-size')).toBe('14px');
  });

  /**
   * 🚨 **防腐断言** —— 逐字来自 antd 6.6.4 的真实产物
   * （`extract-list-css.mjs` 的 css-var 块）：
   *
   * ```
   * --ant-list-content-width:220px;
   * --ant-list-item-padding:12px 0;
   * --ant-list-item-padding-sm:8px 16px;
   * --ant-list-item-padding-lg:16px 24px;
   * ```
   *
   * 本仓的 `paddingContentVertical` / `padding` 等别名 token 一旦漂了，
   * G3 就会报出来（而不是等到 L6 才发现列表间距全变）。
   */
  it('🚨 四个硬值 == antd 产物里的值（防腐断言）', () => {
    const map = new Map(decls.map(splitDecl));
    expect(map.get('--apollo-list-content-width')).toBe('220px');
    expect(map.get('--apollo-list-item-padding')).toBe('12px 0');
    expect(map.get('--apollo-list-item-padding-sm')).toBe('8px 16px');
    expect(map.get('--apollo-list-item-padding-lg')).toBe('16px 24px');
  });
});

describe('List · 声明 ↔ 引用（双向）', () => {
  it('🚨 声明块**必须在根规则内部**（漏了它 = 11 个变量全未声明、间距全丢）', () => {
    const rootStart = css.indexOf(`${CLS}{`);
    expect(rootStart).toBeGreaterThanOrEqual(0);
    const rootRule = css.slice(rootStart, css.indexOf('}', rootStart));

    for (const decl of decls) {
      expect(rootRule).toContain(decl.trim());
    }
  });

  it('🚨 判据 4：声明块覆盖**两个根形态**（`.{p}-list` + `.{p}-list-container`）', () => {
    // 上游的 `extraCssVarPrefixCls: ({ prefixCls }) => [`${prefixCls}-container`]`
    // ⇒ css-var 块同时挂 `.ant-list` 与 `.ant-list-container`（D95 家族）。
    const containerStart = css.indexOf(`${CLS}-container{`);
    expect(containerStart).toBeGreaterThanOrEqual(0);
    const containerRule = css.slice(containerStart, css.indexOf('}', containerStart));
    for (const decl of decls) {
      expect(containerRule).toContain(decl.trim());
    }
  });

  it('🚨 规则引用的**自有**变量全部在 `genTokenDecls` 里（拼错 = 静默失效）', () => {
    const declared = new Set(decls.map((d) => splitDecl(d)[0]));
    const referenced = [...css.matchAll(/var\((--apollo-list-[a-z-]+)\)/g)].map(
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
    const globalCss = getCSSVarDeclarations(getDesignToken());
    const declaredGlobals = new Set(
      [...globalCss.matchAll(/(--apollo-[a-z0-9-]+):/g)].map((m) => m[1] as string),
    );

    const referenced = [...css.matchAll(/var\((--apollo-[a-z0-9-]+)\)/g)]
      .map((m) => m[1] as string)
      // 自有变量（`--apollo-list-*`）由 `genTokenDecls` 声明，不在 tokens.css 里
      .filter((name) => !name.startsWith('--apollo-list-'));

    expect(referenced.length).toBeGreaterThan(0);
    for (const name of new Set(referenced)) {
      expect(declaredGlobals).toContain(name);
    }
  });

  it('🚨 产物里没有**嵌套的 var 包装**（`var(--apollo-var(...))`，PITFALLS 305）', () => {
    expect(css).not.toMatch(/var\(--[a-z0-9-]*var\(/);
  });
});

describe('List · 两处 `calc()` 与两条死选择器（逐字对齐产物）', () => {
  it('判据 5：`borderRadiusLG - lineWidth` 保留为 `calc()`（**不是** `7px`）', () => {
    expect(css).toContain(
      'border-radius:calc(var(--apollo-border-radius-lg) - var(--apollo-line-width)) calc(var(--apollo-border-radius-lg) - var(--apollo-line-width)) 0 0;',
    );
  });

  it('判据 5：`-item-action-split` 的 height 保留为 `calc()`', () => {
    expect(css).toContain('height:calc(var(--apollo-font-height) - var(--apollo-margin-xxs) * 2);');
  });

  it('🚨 两条**死选择器**逐字保留（UPSTREAM quirk，radio U7/U8 同类）', () => {
    // ① `-action`（真类名是 `-item-action`）
    expect(css).toContain('.apollo-list .apollo-list-item .apollo-list-action{');
    // ② `-spin-nested-loading`（真类名是 `.apollo-spin-nested-loading`）
    expect(css).toContain('.apollo-list-loading .apollo-list-spin-nested-loading{');
  });

  it('🚨 两条 media 的**冒号后空格不同**（逐字保留上游写法）', () => {
    expect(css).toContain('@media screen and (max-width:768px){');
    expect(css).toContain('@media screen and (max-width: 576px){');
  });

  it('`genListStyle` 的规则条数 == 产物（56 条组件规则 + 1 条 `-container` 声明块 = 57）', () => {
    const rules = css.split('\n').filter((line) => /^\.apollo-list[^{]*\{$/.test(line));
    expect(rules).toHaveLength(57);
  });
});
