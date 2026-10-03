/** L7 主题 —— Mentions 组件变量（22 条声明）+ `prepareComponentToken` 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genMentionsStyle, genTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Mentions', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Mentions · token 契约', () => {
  const css = genMentionsStyle('apollo');
  const decls = genTokenDecls('apollo').join('\n');

  it('22 条组件变量声明（逐条对拍 antd 的 `.css-var-root.ant-mentions` 块）', () => {
    expect(decls).toContain('--apollo-mentions-line-width-focus:1px');
    expect(decls).toContain('--apollo-mentions-padding-block:4px');
    expect(decls).toContain('--apollo-mentions-padding-block-sm:0px');
    expect(decls).toContain('--apollo-mentions-padding-block-lg:7px');
    expect(decls).toContain('--apollo-mentions-padding-inline:11px');
    expect(decls).toContain('--apollo-mentions-padding-inline-sm:7px');
    expect(decls).toContain('--apollo-mentions-padding-inline-lg:11px');
    expect(decls).toContain('--apollo-mentions-input-font-size:14px');
    expect(decls).toContain('--apollo-mentions-input-font-size-lg:16px');
    expect(decls).toContain('--apollo-mentions-input-font-size-sm:14px');
    expect(decls).toContain('--apollo-mentions-dropdown-height:250px');
    expect(decls).toContain('--apollo-mentions-control-item-width:100px');
    expect(decls).toContain('--apollo-mentions-z-index-popup:1050');
    expect(decls).toContain('--apollo-mentions-item-padding-vertical:5px');
    // 别名派生（随主题自适应）
    expect(decls).toContain('--apollo-mentions-active-border-color:var(--apollo-color-primary)');
    expect(decls).toContain('--apollo-mentions-hover-bg:var(--apollo-color-bg-container)');
  });

  it('声明块挂在 `.apollo-mentions`（affix 形态的根自带该类 ⇒ 一条覆盖两种根）', () => {
    expect(css).toContain('.apollo-mentions{\n  --apollo-mentions-line-width-focus:1px;');
  });

  it('规则段：根 / textarea / measure / suffix / dropdown', () => {
    expect(css).toContain('.apollo-mentions >textarea{');
    expect(css).toContain('.apollo-mentions .apollo-mentions-measure{');
    expect(css).toContain('.apollo-mentions .apollo-mentions-suffix{');
    expect(css).toContain('.apollo-mentions-has-suffix >textarea{');
    expect(css).toContain('.apollo-mentions-dropdown{');
    expect(css).toContain('.apollo-mentions-dropdown .apollo-mentions-dropdown-menu-item{');
    expect(css).toContain('.apollo-mentions-dropdown .apollo-mentions-dropdown-menu-item-active{');
  });

  it('ant 残留核查（cssinjs hash / `--ant-` / keyframes / 双重 var 包裹）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toContain('--ant-');
    expect(css).not.toContain('@keyframes');
    expect(css).not.toContain('var(--apollo-var(');
  });

  it('前缀守恒：`gen("ant")` 里 `.apollo-` 一个不剩，且计数相等', () => {
    const ant = genMentionsStyle('ant');
    expect(ant.includes('.apollo-')).toBe(false);
    expect(css.includes('.apollo-')).toBe(true);
    const count = (text: string, prefix: string): number =>
      (text.match(new RegExp(`\\.${prefix}-`, 'g')) ?? []).length;
    expect(count(ant, 'ant')).toBe(count(css, 'apollo'));
  });
});

describe('Mentions · prepareComponentToken 判据', () => {
  it('默认主题关键值（对拍 antd 的 22 条声明）', () => {
    const t = prepareComponentToken({
      controlHeight: 32,
      controlHeightSM: 24,
      controlHeightLG: 40,
      fontSize: 14,
      fontSizeLG: 16,
      lineHeight: 1.5714285714285714,
      lineHeightLG: 1.5,
      lineWidth: 1,
      lineWidthFocus: 3,
      paddingSM: 12,
      controlPaddingHorizontal: 12,
      controlPaddingHorizontalSM: 8,
      controlOutlineWidth: 2,
      fontHeight: 22,
      zIndexPopupBase: 1000,
    });
    expect(t.paddingBlock).toBe('4px');
    expect(t.paddingBlockSM).toBe('0px');
    expect(t.paddingBlockLG).toBe('7px');
    expect(t.paddingInline).toBe('11px');
    expect(t.paddingInlineSM).toBe('7px');
    expect(t.paddingInlineLG).toBe('11px');
    expect(t.dropdownHeight).toBe('250px');
    expect(t.controlItemWidth).toBe('100px');
    expect(t.zIndexPopup).toBe('1050');
    expect(t.itemPaddingVertical).toBe('5px');
  });
});
