/**
 * L7 主题 —— Progress 的 Component Token（**6 个**）。
 *
 * ⚠️ 与其它组件不同，Progress 的样式走**字符串管线**（`DECLS` + `RULES` 两段常量，
 * 从 antd 产物机械转换），而不是 `genXxxStyle` 拼规则数组。所以这里的断言形态也不同：
 *   - `genProgressTokenDecls()` 返回**一整段**声明文本（不是 `string[]`）；
 *   - 它必须**出现在** `genProgressStyle()` 的产物里（否则就是「声明了但没进 CSS」）。
 *
 * 这个文件证明：① 6 个 token 的判定值逐条对齐；② `DECLS` 与判定值**一致**
 * （不是两处各写一份）；③ `DECLS` 真的进了 CSS；④ `token.ts` 不是占位。
 */

import fs from 'node:fs';
import path from 'node:path';
import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genProgressStyle, genProgressTokenDecls } from '../style';
import { prepareProgressComponentToken, progressTokenValues } from '../style/token';

themeTest('Progress', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 17,
});

const PREFIX = 'apollo';
const decls = genProgressTokenDecls();
const css = genProgressStyle(PREFIX);
/** 默认主题的别名 token（与 `progressTokenValues` 的入参同一组）。 */
const ALIAS = {
  // ⚠️ 与 `progressTokenValues()` 的入参**逐字一致**（含 `rgba(...)` 里没有空格）
  colorText: 'rgba(0,0,0,0.88)',
  colorInfo: '#1677ff',
  colorFillSecondary: 'rgba(0,0,0,0.06)',
  fontSize: 14,
  fontSizeSM: 12,
};

describe('Progress · Component Token 判定值', () => {
  it('`prepareProgressComponentToken` 的**键与顺序**（6 个）', () => {
    expect(Object.keys(prepareProgressComponentToken(ALIAS))).toEqual([
      'circleTextColor',
      'defaultColor',
      'remainingColor',
      'lineBorderRadius',
      'circleTextFontSize',
      'circleIconFontSize',
    ]);
  });

  it('6 个默认值逐条来自对应的别名 token', () => {
    const t = prepareProgressComponentToken(ALIAS);
    expect(t.circleTextColor).toBe(ALIAS.colorText);
    expect(t.defaultColor).toBe(ALIAS.colorInfo);
    expect(t.remainingColor).toBe(ALIAS.colorFillSecondary);
    expect(t.lineBorderRadius).toBe(100);
    expect(t.circleTextFontSize).toBe('1em');
    // ⚠️ 图标字号是**比值**：`fontSize / fontSizeSM` ⇒ 14/12
    expect(t.circleIconFontSize).toBe(`${ALIAS.fontSize / ALIAS.fontSizeSM}em`);
  });

  it('`progressTokenValues()`（默认主题的构建期取值）与 `prepare…` 一致', () => {
    expect(progressTokenValues()).toEqual(prepareProgressComponentToken(ALIAS));
  });
});

describe('Progress · 声明 ↔ 引用', () => {
  it('🚨 `DECLS` 与判定值**一致**（不是两处各写一份）', () => {
    const t = progressTokenValues();
    for (const [name, value] of [
      ['circle-text-color', t.circleTextColor],
      ['default-color', t.defaultColor],
      ['remaining-color', t.remainingColor],
      ['line-border-radius', `${t.lineBorderRadius}px`],
      ['circle-text-font-size', t.circleTextFontSize],
      ['circle-icon-font-size', t.circleIconFontSize],
    ]) {
      expect(decls).toContain(`--${PREFIX}-progress-${name}:${value}`);
    }
  });

  it('🚨 `DECLS` **真的进了** `genProgressStyle()` 的产物', () => {
    for (const d of decls.split(';').filter(Boolean)) {
      expect(css).toContain(`${d};`);
    }
  });

  it('🚨 规则引用的自有变量全部在 `DECLS` 里（拼错 = 静默失效）', () => {
    const declared = new Set(
      decls
        .split(';')
        .filter(Boolean)
        .map((d) => d.slice(0, d.indexOf(':'))),
    );
    const referenced = [...css.matchAll(/var\((--apollo-progress-[a-z-]+)\)/g)].map(
      (m) => m[1] as string,
    );
    expect(referenced.length).toBeGreaterThan(0);
    for (const n of new Set(referenced)) {
      expect(declared).toContain(n);
    }
  });

  it('`style/token.ts` 是**真实实现**（不是 `TODO(G3)` 占位）', () => {
    const src = fs.readFileSync(path.resolve(import.meta.dirname, '../style/token.ts'), 'utf8');
    expect(src).not.toContain('TODO(G3)');
  });
});
