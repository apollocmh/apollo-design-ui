/**
 * L7 主题 —— Avatar 的 Component Token（12 个）+ 2 个 `mergeToken` 派生的落点。
 *
 * ── 这个文件证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：
 *   1. `prepareComponentToken` 的**键、顺序、默认值来源**与 antd 6.6.4 逐条一致；
 *   2. `genTokenDecls` 的 12 条声明（变量名 + 构建期解析值）与 antd 产物里
 *      `--ant-avatar-*` 的 css-var 块**逐条同构**（含 4 个**交叉验证的硬值**：
 *      `32px` / `40px` / `24px` / `-8px`）；
 *   3. 🚨 **双向检查**：规则引用的自有变量都在声明里（拼错 = 静默失效），
 *      且声明块**真的在根规则内部**；
 *   4. 规则引用的 `--apollo-*` **全局** token 都在 `tokens.css` 里有声明；
 *   5. 2 个 `mergeToken` 派生（用户不可覆盖）落的是**全局** token，不是自有变量。
 *
 * 不证明：这些值被正确消费进 CSS（那是 L4/L6 的事）、视觉正确（L6 逐像素）。
 *
 * ── 🚨 第 3 条为什么必须写（breadcrumb / card 实测踩到）────────────────────────
 *
 * `genAvatarStyle` 若**忘了** `...genTokenDecls(p)`（本仓约定：声明块内联在组件根规则里），
 * 12 个 `--apollo-avatar-*` **全部未声明** ⇒ `width:var(...)` / `background:var(...)`
 * 静默失效（未定义 var 不是回退默认值，而是 invalid at computed-value time）⇒
 * **头像全部塌成 0×0**，而 `lint:types` / L1 / L3 / L5 **全都是绿的**。
 * 只有 L6 与这条检查能发现它。
 */

import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genAvatarStyle, genTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

const PREFIX = 'apollo';
const CLS = `.${PREFIX}-avatar`;

/** 与 antd 的 css-var 块逐字对齐的顺序（`--ant-avatar-*` 的声明顺序）。 */
const EXPECTED_VARS = [
  '--apollo-avatar-container-size',
  '--apollo-avatar-container-size-lg',
  '--apollo-avatar-container-size-sm',
  '--apollo-avatar-text-font-size',
  '--apollo-avatar-text-font-size-lg',
  '--apollo-avatar-text-font-size-sm',
  '--apollo-avatar-icon-font-size',
  '--apollo-avatar-icon-font-size-lg',
  '--apollo-avatar-icon-font-size-sm',
  '--apollo-avatar-group-space',
  '--apollo-avatar-group-overlapping',
  '--apollo-avatar-group-border-color',
];

const token = getDesignToken();
const decls = genTokenDecls(PREFIX);
const css = genAvatarStyle(PREFIX);

/** `--apollo-avatar-x:value;` → `['--apollo-avatar-x', 'value']`。 */
const splitDecl = (decl: string): [string, string] => {
  const trimmed = decl.trim().replace(/;$/, '');
  const at = trimmed.indexOf(':');
  return [trimmed.slice(0, at), trimmed.slice(at + 1)];
};

describe('Avatar · Component Token 判定值', () => {
  it('`prepareComponentToken` 的**键与顺序**与上游一致（12 个）', () => {
    const t = prepareComponentToken(token);
    expect(Object.keys(t)).toEqual([
      'containerSize',
      'containerSizeLG',
      'containerSizeSM',
      'textFontSize',
      'textFontSizeLG',
      'textFontSizeSM',
      'iconFontSize',
      'iconFontSizeLG',
      'iconFontSizeSM',
      'groupSpace',
      'groupOverlapping',
      'groupBorderColor',
    ]);
  });

  it('默认值逐条来自对应的别名 token（上游 `prepareComponentToken` 的算式）', () => {
    const t = prepareComponentToken(token);
    expect(t.containerSize).toBe(token.controlHeight);
    expect(t.containerSizeLG).toBe(token.controlHeightLG);
    expect(t.containerSizeSM).toBe(token.controlHeightSM);
    expect(t.textFontSize).toBe(token.fontSize);
    expect(t.textFontSizeLG).toBe(token.fontSize);
    expect(t.textFontSizeSM).toBe(token.fontSize);
    // ⚠️ `Math.round` 不能省（换主题后可能是 .5）
    expect(t.iconFontSize).toBe(Math.round((token.fontSizeLG + token.fontSizeXL) / 2));
    expect(t.iconFontSizeLG).toBe(token.fontSizeHeading3);
    expect(t.iconFontSizeSM).toBe(token.fontSize);
    expect(t.groupSpace).toBe(token.marginXXS);
    // ⚠️ 是**负数**
    expect(t.groupOverlapping).toBe(-token.marginXS);
    expect(t.groupBorderColor).toBe(token.colorBorderBg);
  });

  it('`genTokenDecls` 产出 **12** 条声明，变量名与顺序与 antd 的 css-var 块一致', () => {
    expect(decls).toHaveLength(12);
    expect(decls.map((d) => splitDecl(d)[0])).toEqual(EXPECTED_VARS);
  });

  it('声明值是**构建期解析值**（颜色是字面量、尺寸带 `px`、负值保留符号）', () => {
    const map = new Map(decls.map(splitDecl));
    expect(map.get('--apollo-avatar-container-size')).toBe(`${token.controlHeight}px`);
    expect(map.get('--apollo-avatar-container-size-lg')).toBe(`${token.controlHeightLG}px`);
    expect(map.get('--apollo-avatar-container-size-sm')).toBe(`${token.controlHeightSM}px`);
    expect(map.get('--apollo-avatar-text-font-size')).toBe(`${token.fontSize}px`);
    expect(map.get('--apollo-avatar-icon-font-size')).toBe(
      `${Math.round((token.fontSizeLG + token.fontSizeXL) / 2)}px`,
    );
    expect(map.get('--apollo-avatar-icon-font-size-lg')).toBe(`${token.fontSizeHeading3}px`);
    expect(map.get('--apollo-avatar-group-space')).toBe(`${token.marginXXS}px`);
    expect(map.get('--apollo-avatar-group-overlapping')).toBe(`${-token.marginXS}px`);
    expect(map.get('--apollo-avatar-group-border-color')).toBe(String(token.colorBorderBg));
  });

  /**
   * 🚨 4 个**交叉验证的硬值** —— 逐字来自 antd 6.6.4 的真实产物
   * （`extract-avatar-css.mjs` 的 css-var 块）：
   *
   * ```
   * --ant-avatar-container-size:32px;
   * --ant-avatar-container-size-lg:40px;
   * --ant-avatar-container-size-sm:24px;
   * --ant-avatar-group-overlapping:-8px;
   * ```
   *
   * 这是**防腐断言**：本仓的 `controlHeight` / `marginXS` 等别名 token 一旦漂了，
   * G3 就会报出来（而不是等到 L6 才发现头像尺寸全变）。
   */
  it('🚨 四个硬值 == antd 产物里的值（防腐断言）', () => {
    const map = new Map(decls.map(splitDecl));
    expect(map.get('--apollo-avatar-container-size')).toBe('32px');
    expect(map.get('--apollo-avatar-container-size-lg')).toBe('40px');
    expect(map.get('--apollo-avatar-container-size-sm')).toBe('24px');
    expect(map.get('--apollo-avatar-group-overlapping')).toBe('-8px');
    expect(map.get('--apollo-avatar-icon-font-size')).toBe('18px');
    expect(map.get('--apollo-avatar-icon-font-size-lg')).toBe('24px');
  });
});

describe('Avatar · 声明 ↔ 引用（双向）', () => {
  it('🚨 声明块**必须在根规则内部**（漏了它 = 12 个变量全未声明、头像塌成 0×0）', () => {
    const rootStart = css.indexOf(`${CLS}{`);
    expect(rootStart).toBeGreaterThanOrEqual(0);
    const rootRule = css.slice(rootStart, css.indexOf('}', rootStart));

    for (const decl of decls) {
      expect(rootRule).toContain(decl.trim());
    }
  });

  it('🚨 规则引用的**自有**变量全部在 `genTokenDecls` 里（拼错 = 静默失效）', () => {
    const declared = new Set(decls.map((d) => splitDecl(d)[0]));
    const referenced = [...css.matchAll(/var\((--apollo-avatar-[a-z-]+)\)/g)].map(
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
      // 自有变量（`--apollo-avatar-*`）由 `genTokenDecls` 声明，不在 tokens.css 里
      .filter((name) => !name.startsWith('--apollo-avatar-'));

    expect(referenced.length).toBeGreaterThan(0);
    for (const name of new Set(referenced)) {
      expect(declaredGlobals).toContain(name);
    }
  });
});

describe('Avatar · 2 个 `mergeToken` 派生的落点（用户不可覆盖）', () => {
  /**
   * 上游 `mergeToken<AvatarToken>(token, { avatarBg, avatarColor })` —— 它们**不进**
   * `ComponentToken`，产物里直接展开成**全局** token 引用。
   * ⚠️ 同处声明的 `avatarBgColor` 是**死键**（mergeToken 里从没赋值）⇒ 本仓不引入。
   */
  it.each([
    ['avatarBg → colorTextPlaceholder', 'background:var(--apollo-color-text-placeholder)'],
    ['avatarColor → colorTextLightSolid', 'color:var(--apollo-color-text-light-solid)'],
  ])('%s', (_label, expected) => {
    expect(css).toContain(expected);
  });

  it('它们**不**出现在 `genTokenDecls` 里（派生值不是 Component Token）', () => {
    for (const name of ['avatar-bg', 'avatar-color', 'avatar-bg-color']) {
      expect(decls.join('\n')).not.toContain(`--apollo-${name}`);
    }
  });
});

describe('Avatar · 关键选择器形态（从产物抄下来的四处非显然结构）', () => {
  it('🚨 尺寸工厂产出的是**复合**选择器（`&{cls}-square` ⇒ `.apollo-avatar.apollo-avatar-square`）', () => {
    expect(css).toContain(`${CLS}.${PREFIX}-avatar-square{`);
    expect(css).toContain(`${CLS}.${PREFIX}-avatar-icon{`);
    expect(css).toContain(`${CLS}-lg.${PREFIX}-avatar-square{`);
    expect(css).toContain(`${CLS}-sm.${PREFIX}-avatar-icon{`);
    // ⚠️ **不是**后代选择器
    expect(css).not.toContain(`${CLS} .${PREFIX}-avatar-square{`);
  });

  it('两条规则用的是 **antCls / iconCls**（`.apollo-image-img` / `.apollo-icon`）', () => {
    expect(css).toContain(`${CLS} .${PREFIX}-image-img{`);
    expect(css).toContain(`${CLS}.${PREFIX}-avatar-icon >.${PREFIX}-icon{`);
  });

  it('`-group` 的第三条是**子选择器 + `:not()`**', () => {
    expect(css).toContain(`${CLS}-group >*:not(:first-child){`);
  });

  it('`-group-popover` 用相邻兄弟选择器', () => {
    expect(css).toContain(`${CLS}-group-popover ${CLS}+${CLS}{`);
  });
});
