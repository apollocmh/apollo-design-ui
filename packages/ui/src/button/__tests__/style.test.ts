/**
 * Button 样式的**构建期**校验（L1 侧的静态一致性）。
 *
 * 为什么这里要重复做一遍 B7 的事：`tests/build/run.mjs` 的 B7 · ui 判据是
 * 「ui 的每份 CSS 里出现的每个 `var(--apollo-*)` 都能在 theme 的 `tokens.css`
 * 的 `:root` 里找到声明」。它**依赖一次全量构建**（本环境实测每个包 ≈6 分钟，
 * 14 个包 ≈80 分钟），而这条风险的本质是「样式文件里写错了变量名」——
 * 它**不需要**构建就能查。所以这里在**源码层**直接跑 `genButtonStyle` 并复算一遍。
 *
 * ⚠️ 它是 B7 的**补充**，不是替代：B7 还比对「CSS 产物 vs 运行时默认值」，
 *    那个只能构建后做。
 *
 * ── 三条断言各自防的是什么 ──────────────────────────────────────────────────
 *
 * 1. **变量存在性**：`var(--apollo-x)` 写错不会报错、只会**静默失效**（浏览器把未定义的
 *    `var()` 当空值）⇒ 按钮会变成没有颜色/圆角的裸元素，而所有其它测试**全绿**。
 * 2. **无 `undefined` / `NaN`**：表驱动生成里一旦某个 token 取到 `undefined`
 *    （例如预设色板键名拼错），字符串模板会安静地写出 `var(undefined)`。
 * 3. **无字面硬编码颜色**（H9）：`#` / `rgb(` / `rgba(` 只允许出现在两处已登记的缺口里
 *    ——13 个预设阴影色是 `getAlphaColor` 的迭代求解结果，CSS 里没有等价写法，
 *    只能构建期算出并内联（见 `style/index.ts` 文件头「缺口 2」）。
 */

import { getDesignToken, transformToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genButtonStyle } from '../style';

const CSS = genButtonStyle('apollo');
const CSS_ANT = genButtonStyle('ant');

/**
 * theme 会声明出来的变量全集。
 *
 * ⚠️ 走 `transformToken(getDesignToken())` 而**不是**读 `packages/theme/dist/tokens.css`：
 *    后者是构建产物（gitignore），在「只跑 `test:unit`」的干净环境里不存在，
 *    会让这条断言因为**缺构建**而红 —— 那不是它要防的风险。
 *    B7 比对的两个来源（CSS 里声明的值 vs 运行时默认值）在这里本就是同一个函数，
 *    所以「变量存在性」这一半不需要产物。
 */
function declaredThemeVars(): Set<string> {
  return new Set(Object.keys(transformToken(getDesignToken()).vars));
}

describe('Button · 样式静态一致性', () => {
  it('CSS 里没有 undefined / NaN（表驱动生成的静默失败）', () => {
    expect(CSS).not.toContain('undefined');
    expect(CSS).not.toContain('NaN');
    expect(CSS_ANT).not.toContain('undefined');
  });

  it('引用到的每个 --apollo-* 都在 theme 的 tokens.css 里声明过（B7 的源码层复算）', () => {
    const declared = declaredThemeVars();
    const used = new Set(CSS.match(/var\((--apollo-[a-z0-9-]+)/g)?.map((m) => m.slice(4)) ?? []);
    expect(used.size).toBeGreaterThan(20);
    const missing = [...used].filter((name) => !declared.has(name));
    expect(missing, `未声明的变量：${missing.join(', ')}`).toEqual([]);
  });

  it('除了预设阴影色，CSS 里没有内联的字面色值（H9）', () => {
    // 允许的只有 `getAlphaColor` 的产物 `rgba(...)`：13 个预设色各一个，
    // 但 `pink` 与 `magenta` 同值（`seed.ts`）⇒ 去重后是 12 个。
    // ⚠️ 断言的是「形态」与「去重上界」，不是具体数字 —— 数字会随预设色表变化。
    const lit = CSS.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
    for (const value of lit) {
      expect(value.startsWith('rgba('), `非 rgba 的字面色值：${value}`).toBe(true);
    }
    expect(new Set(lit).size).toBeLessThanOrEqual(13);
    expect(new Set(lit).size).toBeGreaterThan(0);
  });

  it('两个前缀产物只差前缀，其余完全一致', () => {
    // ⚠️ 替换的是 `ant-btn` 而不是 `ant-`：后者会把 `-variant-` 变成 `-variapollo-`。
    expect(CSS_ANT.replaceAll('ant-btn', 'apollo-btn')).toBe(CSS);
  });

  it('-background-ghost 的覆盖必须带进组合选择器（否则被 hover 规则压过）', () => {
    expect(CSS).toContain('.apollo-btn-background-ghost');
    // 幽灵按钮的三个状态各自都要带上 ghost 类 —— 写成单独的 `.apollo-btn-background-ghost:hover`
    // 特异性（0,4,0）低于组合的 hover 规则（0,5,0），背景会变回实色。
    expect(CSS).toMatch(
      /\.apollo-btn-color-default\.apollo-btn-variant-outlined\.apollo-btn-background-ghost:not\(:disabled\)/,
    );
  });
});
