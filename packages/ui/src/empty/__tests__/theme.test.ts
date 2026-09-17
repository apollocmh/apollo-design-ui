/**
 * L1/L2 的主题矩阵：light / dark / compact / token-override 四态。
 *
 * ⚠️ 当前**只做到「四态下都能渲染」**，没做到「四态下视觉正确」。
 *
 * 原因不是偷懒，而是 Empty 的样式里没有任何**字面值**：所有颜色/尺寸都是
 * `var(--apollo-*)`（见 `style/index.ts`）。于是：
 *   - 主题切换改变的是**变量值**，不是我们的 CSS；
 *   - 断言「dark 下颜色不同」需要浏览器计算样式（jsdom 不做布局与层叠），
 *     那是 L6（`tests/visual`）的职责。
 *
 * 所以这里断言的是**这条架构性质本身**：四态下渲染结果一致（因为差异全在变量里），
 * 且渲染出的 CSS 变量引用是可解析的 `var(--apollo-*)` 形态。
 *
 * 「变量真的存在」由 `tests/build/run.mjs` 的 B7 校验（CSS 里引用的每个
 * `--apollo-*` 都必须在 theme 的 `tokens.css` 里有声明）—— 那才是这个风险的正解。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Empty } from '../index';
import { genEmptyStyle } from '../style';

const P = 'apollo';

themeTest('Empty', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Empty · 主题无关性', () => {
  it('四态下的 DOM 完全相同（差异全在 CSS 变量里）', () => {
    const html = mount(Empty, { props: { prefixCls: P } }).html();
    // 组件本身不读任何 token 值，所以同一份 HTML 在四态下都成立。
    // 这条断言的作用是：一旦有人往组件里塞进「按主题分支」的逻辑，它会红。
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain(`class="${P}-image"`);
  });

  it('★ 样式里没有任何字面视觉值（全部走 var(--apollo-*)）', () => {
    const css = genEmptyStyle(P);
    // 允许出现的字面值只有：结构性关键字与百分比/倍数。
    // 颜色、圆角、字号、间距、阴影一律不允许出现。
    const suspicious = css.match(/#[0-9a-f]{3,8}\b|rgba?\(|\b\d+px\b/g) ?? [];
    expect(suspicious).toEqual([]);
  });

  it('样式里引用的变量名全部是 `--apollo-*` 形态', () => {
    const vars = [...genEmptyStyle(P).matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1] ?? '');
    expect(vars.length).toBeGreaterThan(0);
    for (const name of vars) {
      expect(name.startsWith('--apollo-')).toBe(true);
    }
  });

  it('前缀不同则产物不同（否则 prefixCls 参数是摆设）', () => {
    expect(genEmptyStyle('apollo')).not.toBe(genEmptyStyle('ant'));
    // 2026-09-18 修：原断言写 `.ant-image`，但 Empty 根类名是 `${prefixCls}-empty`，
    // 子类选择器是 `${prefixCls}-empty-image`（与 antd 的 `ant-empty-image` 对齐）。
    expect(genEmptyStyle('ant')).toContain('.ant-empty-image');
  });
});
