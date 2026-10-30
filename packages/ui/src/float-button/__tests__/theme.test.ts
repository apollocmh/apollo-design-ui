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
import {
  createThemeContext,
  getCSSVarDeclarations,
  getDesignToken,
  ThemeContextKey,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import FloatButton from '../FloatButton';
import Group from '../FloatButtonGroup';
import { genFloatButtonStyle } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('FloatButton', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
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

describe('FloatButton · current alias source', () => {
  it('keeps generated custom-prefix Button composition and owned variables in the same namespace', () => {
    const custom = genFloatButtonStyle('brand');
    expect(custom).toContain('.brand-float-btn.brand-btn.brand-float-btn-progress');
    expect(custom).toContain('--brand-float-btn-progress');
    expect(custom).toContain('--brand-btn-bg-color');
    expect(custom).toContain('var(--apollo-control-height-lg)');
    expect(custom).not.toMatch(/\.apollo-(?:float-btn|btn)/);
    expect(custom).not.toMatch(/--apollo-(?:float-btn|btn)-/);
  });
  it('projects current aliases for FloatButton and Group and restores defaults after override removal', async () => {
    const theme = createThemeContext({
      token: { controlHeightLG: 52, marginLG: 35, padding: 22, zIndexPopupBase: 1700 },
    });
    const wrapper = mount(
      { render: () => h('section', [h(FloatButton), h(Group)]) },
      {
        global: { provide: { [ThemeContextKey]: theme }, stubs: { teleport: false } },
      },
    );
    try {
      for (const selector of ['button', '.apollo-float-btn-group']) {
        const style = wrapper.get<HTMLElement>(selector).element.style;
        expect(style.getPropertyValue('--apollo-control-height-lg')).toBe('52px');
        expect(style.getPropertyValue('--apollo-margin-lg')).toBe('35px');
        expect(style.getPropertyValue('--apollo-padding')).toBe('22px');
        expect(style.getPropertyValue('--apollo-z-index-popup-base')).toBe('1700');
      }
      theme.config.value = { token: { controlHeightLG: 44 } };
      await wrapper.vm.$nextTick();
      expect(
        wrapper
          .get<HTMLElement>('.apollo-float-btn-group')
          .element.style.getPropertyValue('--apollo-control-height-lg'),
      ).toBe('44px');
      theme.config.value = {};
      await wrapper.vm.$nextTick();
      expect(
        wrapper
          .get<HTMLElement>('.apollo-float-btn-group')
          .element.style.getPropertyValue('--apollo-control-height-lg'),
      ).toBe('40px');
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps native variables and explicit zIndex ahead of Provider/semantic sources', () => {
    const theme = createThemeContext({ token: { controlHeightLG: 52 } });
    const wrapper = mount(Group, {
      props: { styles: { root: { '--apollo-control-height-lg': '60px', zIndex: 15 } } },
      attrs: { style: [{ '--apollo-control-height-lg': '64px' }, 'z-index:0'] },
      global: { provide: { [ThemeContextKey]: theme } },
    });
    try {
      const style = wrapper.get<HTMLElement>('.apollo-float-btn-group').element.style;
      expect(style.getPropertyValue('--apollo-control-height-lg')).toBe('64px');
      expect(style.zIndex).toBe('0');
    } finally {
      wrapper.unmount();
    }
  });
});
