/**
 * L7 主题 —— Anchor 的 Component Token（**2 个**）+ 4 个 `mergeToken` 派生值。
 *
 * ── 这个文件证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：
 *   1. `prepareComponentToken` 的**键、顺序、默认值来源**与 antd 6.6.4 一致；
 *   2. `genTokenDecls` 的 2 条声明（变量名 + 构建期解析值）；
 *   3. 🚨 **双向检查**：规则引用的自有变量都在声明里（拼错 = 静默失效），
 *      且声明块**真的在规则内部**（PITFALLS 287：漏了它 = 7/2 个变量全未声明）；
 *   4. 规则引用的 `--apollo-*` 全局 token 都在 `tokens.css` 里有声明；
 *   5. 4 个 `mergeToken` 派生值是**用户不可覆盖**的（不进 `prepareComponentToken`）。
 *
 * 不证明：这些值被正确消费进 CSS（L4/L6）、视觉正确（L6 逐像素）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genAnchorStyle, genTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Anchor', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
});

const PREFIX = 'apollo';
const token = getDesignToken();
const decls = genTokenDecls(PREFIX);
const css = genAnchorStyle(PREFIX);

const splitDecl = (d: string) => {
  const t = d.trim().replace(/;$/, '');
  return [t.slice(0, t.indexOf(':')), t.slice(t.indexOf(':') + 1)];
};

describe('Anchor · Component Token 判定值', () => {
  it('`prepareComponentToken` 的**键与顺序**（2 个，都是别名派生）', () => {
    expect(Object.keys(prepareComponentToken(token))).toEqual([
      'linkPaddingBlock',
      'linkPaddingInlineStart',
    ]);
  });

  it('两个默认值分别来自 `paddingXXS` / `padding`', () => {
    const t = prepareComponentToken(token);
    expect(t.linkPaddingBlock).toBe(token.paddingXXS);
    expect(t.linkPaddingInlineStart).toBe(token.padding);
  });

  it('`genTokenDecls` 产出 **2** 条声明（数值带 `px`）', () => {
    expect(decls).toHaveLength(2);
    expect(decls[0]).toContain(`--${PREFIX}-anchor-link-padding-block:${token.paddingXXS}px;`);
    expect(decls[1]).toContain(`--${PREFIX}-anchor-link-padding-inline-start:${token.padding}px;`);
  });

  it('4 个 `mergeToken` 派生值**不进** `prepareComponentToken`（用户不可覆盖）', () => {
    const keys = Object.keys(prepareComponentToken(token));
    for (const k of [
      'holderOffsetBlock',
      'anchorPaddingBlockSecondary',
      'anchorTitleBlock',
      'anchorPaddingBlock',
    ]) {
      expect(keys).not.toContain(k);
    }
  });
});

describe('Anchor · 声明 ↔ 引用（双向）', () => {
  it('🚨 声明块**必须在规则内部**（漏了它 = 变量全未声明、整片样式静默失效）', () => {
    const start = css.indexOf(`.${PREFIX}-anchor-wrapper .${PREFIX}-anchor{`);
    expect(start).toBeGreaterThanOrEqual(0);
    const rule = css.slice(start, css.indexOf('}', start));
    for (const d of decls) {
      expect(rule).toContain(d.trim());
    }
  });

  it('🚨 规则引用的**自有**变量全部在 `genTokenDecls` 里', () => {
    const declared = new Set(decls.map((d) => splitDecl(d)[0]));
    const referenced = [...css.matchAll(/var\((--apollo-anchor-[a-z-]+)\)/g)].map(
      (m) => m[1] as string,
    );
    expect(referenced.length).toBeGreaterThan(0);
    for (const n of new Set(referenced)) {
      expect(declared).toContain(n);
    }
  });

  it('🚨 `genTokenDecls` 的每条都被规则引用（无死变量）', () => {
    for (const d of decls) {
      expect(css).toContain(`var(${splitDecl(d)[0]})`);
    }
  });
});

describe('Anchor · 全局 token 引用', () => {
  it('规则引用的 `--apollo-*` 全局 token 都在 `tokens.css` 里有声明', () => {
    const declared = new Set(
      [...getCSSVarDeclarations(getDesignToken()).matchAll(/(--apollo-[a-z0-9-]+):/g)].map(
        (m) => m[1] as string,
      ),
    );
    const referenced = [...css.matchAll(/var\((--apollo-[a-z0-9-]+)\)/g)]
      .map((m) => m[1] as string)
      .filter((n) => !n.startsWith('--apollo-anchor-'));
    expect(referenced.length).toBeGreaterThan(0);
    for (const n of new Set(referenced)) {
      expect(declared).toContain(n);
    }
  });
});
