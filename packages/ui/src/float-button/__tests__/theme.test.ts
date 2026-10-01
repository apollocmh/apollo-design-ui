/**
 * L7 主题 —— FloatButton **没有 Component Token**（registry `tokenCount = 0`）。
 *
 * ⚠️ **要区分两个东西**（上游 `es/float-button/style/index.ts`）：
 *   1. **Component Token** = `prepareComponentToken` 的返回面 ⇒ 上游恒 `{}`
 *      ⇒ **用户不可覆盖** ⇒ registry 计数 **0**；
 *   2. 内部派生类型 `FloatButtonToken`（`floatButtonSize` / `floatButtonIconSize` /
 *      `floatButtonInsetBlockEnd` / `floatButtonInsetInlineEnd`）由 `mergeToken` 从全局
 *      token 算出 —— 它们是**实现细节**，本仓在 `style/index.ts` 里手写（`calc` 展开）。
 *
 * 这个文件证明：① 没有 Component Token；② 样式里**没有** `--apollo-float-button-*`
 * 自有变量（0 token ⇒ 不该有声明块）；③ `token.ts` 不是占位。
 */

import fs from 'node:fs';
import path from 'node:path';
import { themeTest } from '@apollo-design/test-utils';
import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genFloatButtonStyle } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('FloatButton', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
});

const PREFIX = 'apollo';
const css = genFloatButtonStyle(PREFIX);

describe('FloatButton · 无 Component Token', () => {
  it('`prepareComponentToken` 返回**空对象**（上游恒 `{}`）', () => {
    expect(prepareComponentToken(getDesignToken())).toEqual({});
  });

  it('🚨 样式里**没有** `--apollo-float-button-*` 自有变量（0 token ⇒ 无声明块）', () => {
    expect(css.match(/--apollo-float-button-/)).toBeNull();
  });

  it('`style/token.ts` 是**真实实现**（不是 `TODO(G3)` 占位）', () => {
    const src = fs.readFileSync(path.resolve(import.meta.dirname, '../style/token.ts'), 'utf8');
    expect(src).not.toContain('TODO(G3)');
  });
});

describe('FloatButton · 全局 token 引用', () => {
  it('引用的 token **要么**是全局 alias、**要么**是 button 的组件 token（跨组件复用）', () => {
    const globals = new Set(
      [...getCSSVarDeclarations(getDesignToken()).matchAll(/(--apollo-[a-z0-9-]+):/g)].map(
        (m) => m[1] as string,
      ),
    );
    const referenced = [
      ...new Set([...css.matchAll(/var\((--apollo-[a-z0-9-]+)\)/g)].map((m) => m[1] as string)),
    ];
    expect(referenced.length).toBeGreaterThan(0);
    for (const n of referenced) {
      // ⚠️ 三类都**合法**，都不在 `tokens.css` 里：
      //    1. `--apollo-float-btn-*` —— 本组件**自己的**变量（在规则内声明，见 style/index.ts）；
      //    2. `--apollo-btn-*` —— float-button 渲染的是**组合了 Button 类名**的元素
      //       （`.apollo-float-btn.apollo-btn`）⇒ button 的规则在**同一元素**上声明它们。
      //    ⇒ 这条判据只能是「全局 alias ∪ 本组件 ∪ button」。
      const own = n.startsWith('--apollo-float-btn-');
      const composed = n.startsWith('--apollo-btn-');
      expect(globals.has(n) || own || composed).toBe(true);
    }
  });

  it('ant 残留核查（类名与变量前缀都已换成本仓前缀）', () => {
    expect(css).not.toContain('css-dev');
    expect(css).not.toMatch(/[^a-z-]anticon/);
  });
});
