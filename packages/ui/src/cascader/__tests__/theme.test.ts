/**
 * L7 主题矩阵 —— Cascader 有 **8 个 Component Token**（规则 R7 逐字段对齐）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genCascaderStyle, genTokenDecls as genCascaderTokenDecls } from '../style';

themeTest('Cascader', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Cascader · 主题无关性', () => {
  const css = genCascaderStyle('apollo');
  const decls = genCascaderTokenDecls('apollo');

  it('Component Token 恰好 8 个（antd 的 ComponentToken 接口全字段）', () => {
    expect(decls).toHaveLength(8);
    expect(css).toContain('--apollo-cascader-control-width:184px;');
    expect(css).toContain('--apollo-cascader-control-item-width:111px;');
    expect(css).toContain('--apollo-cascader-dropdown-height:180px;');
    expect(css).toContain(
      '--apollo-cascader-option-selected-bg:var(--apollo-control-item-bg-active);',
    );
    expect(css).toContain(
      '--apollo-cascader-option-selected-font-weight:var(--apollo-font-weight-strong);',
    );
    // 派生实值（构建期求解）：round((32 - 14×1.5714…)/2)=5 + paddingSM 12
    expect(css).toContain('--apollo-cascader-option-padding:5px 12px;');
    expect(css).toContain('--apollo-cascader-menu-padding:var(--apollo-padding-xxs);');
    expect(css).toContain('--apollo-cascader-option-selected-color:var(--apollo-color-text);');
  });

  it('无双点类名（root 变量自带点，拼接处不得再加点——L6 全样式失效抓出）', () => {
    expect(css).not.toContain('..apollo-');
    expect(css).toContain('.apollo-cascader-menus{');
  });

  it('外壳样式按 cascader 前缀生成（antd `useSelectStyle(cascaderPrefixCls)` 同构）', () => {
    // 🚨 防回归：`genSelectStyle` 的第二个参数必须是**完整的 `${p}-cascader`**。
    //    传成 p 本身会命中 `prefixCls === target` 的同一性短路 ⇒ rename 退化成恒等
    //    ⇒ 产物是一份**重复的 `.apollo-select-*`**，而 `.apollo-cascader-*` 外壳
    //    一条规则都没有 —— 这就是 cascader 页面级「无样式」的根因
    //    （L6 浏览器 computed style 排查抓出）。
    //    注：断言用具体类而非 `.apollo-select`，因为 `${dropdown}.${p}-select-dropdown`
    //    是 antd 逐字同构的规则，它本来就叫 `.apollo-cascader-dropdown.apollo-select-dropdown`。
    expect(css).not.toContain('.apollo-select-content');
    expect(css).not.toContain('.apollo-select-input');
    expect(css).not.toContain('.apollo-select-suffix');
    expect(css).toContain('.apollo-cascader-content{');
    expect(css).toContain('.apollo-cascader-input{');
    expect(css).toContain('.apollo-cascader-suffix{');
    expect(css).toContain('.apollo-cascader-clear{');
    expect(css).toContain('.apollo-cascader-css-var{');
  });

  it('声明块覆盖**三个**根形态（浮层根 / 面板根都不在 .apollo-cascader 子树内）', () => {
    // PITFALLS 171 / D69 家族：漏挂时 `var(--apollo-cascader-*)` 静默失效
    // （L6 实测：panel 的列 min-width 111px → 43.56px、height 180 → auto、padding → 0）。
    expect(css).toContain('.apollo-cascader,.apollo-cascader-dropdown,.apollo-cascader-panel{');
    // 三个根都必须拿到完整 8 个 token（不是只落第一个）
    for (const decl of decls) {
      expect(css).toContain(decl.trim());
    }
  });

  it('resetFont: false —— Cascader 自己的根块不含 genCommonStyle', () => {
    // antd `genStyleHooks('Cascader', …, { resetFont: false })` 的**可观测后果**：
    // cascader 自己的根块只有 width（token 声明单独成块，见上一条）。font-family 是
    // `useSelectStyle` 那份外壳带进来的（有意差异 #6），整串里必然出现 —— 所以
    // **不能**写成 `expect(css).not.toContain('font-family')`：那条断言只在
    // 「rename 恒等」的错误产物下才成立，是条假不变量。
    const marker = 'width:var(--apollo-cascader-control-width);';
    const at = css.indexOf(marker);
    expect(at).toBeGreaterThan(-1);
    const start = css.lastIndexOf('.apollo-cascader{', at);
    expect(start).toBeGreaterThan(-1);
    const ownRoot = css.slice(start, css.indexOf('}', at));
    expect(ownRoot).not.toContain('font-family');
    expect(ownRoot).toContain(marker);
  });

  it('panel 块（antd `style/panel.js`：盒子 + menus 拉伸 + menu 高度 auto + -empty）', () => {
    expect(css).toContain('.apollo-cascader-panel{');
    expect(css).toContain('display:inline-flex;');
    expect(css).toContain('border-radius:var(--apollo-border-radius-lg);');
    expect(css).toContain('max-width:100%;');
    expect(css).toContain('.apollo-cascader-panel .apollo-cascader-menus{');
    expect(css).toContain('align-items:stretch;');
    expect(css).toContain('.apollo-cascader-panel .apollo-cascader-menu{');
    expect(css).toContain('height:auto;');
    expect(css).toContain('.apollo-cascader-panel-empty{');
    // antd 的 panel 钩子没有 `-panel-rtl` 规则（rc Panel 渲染该类但上游不给样式）
    expect(css).not.toContain('.apollo-cascader-panel-rtl');
  });

  it('columns 规则（menus / menu / menu-item / 选中态 / 关键词）', () => {
    expect(css).toContain('.apollo-cascader-menus{');
    expect(css).toContain('.apollo-cascader-menu{');
    expect(css).toContain('min-width:var(--apollo-cascader-control-item-width);');
    expect(css).toContain('height:var(--apollo-cascader-dropdown-height);');
    expect(css).toContain('background-color:var(--apollo-cascader-option-selected-bg);');
    expect(css).toContain('color:var(--apollo-color-highlight);');
    // 仅中间列有右边框（rc issue 11857 判据）
    expect(css).toContain('.apollo-cascader-menu:not(:last-child){');
  });

  it('checkbox 整套复用（antd `getCheckboxStyle(`${p}-checkbox`)` 同构）', () => {
    // ⚠️ 防回归：早期是手写「精简对齐版」（只有方框 + 选中 + indeterminate + disabled）
    // ⇒ L6 的多选形态差 0.008–0.032%、差异像素**全部**落在复选框上。
    // 现在直接复用 genCheckboxStyle(`${p}-cascader`)。
    expect(css).toContain('.apollo-cascader-checkbox{');
    expect(css).toContain('.apollo-cascader-checkbox-wrapper{');
    expect(css).toContain('.apollo-cascader-checkbox-input{');
    expect(css).toContain('.apollo-cascader-checkbox-indeterminate:after{');
    // 精简版漏掉的选中对勾
    expect(css).toContain('.apollo-cascader-checkbox-checked:after{');
  });

  it('RTL 与浮层 padding 清零规则', () => {
    expect(css).toContain('.apollo-cascader-dropdown-rtl{');
    // antd 的 `&${antCls}-select-dropdown{padding:0}`（浮层与 select-dropdown 同节点）。
    // ⚠️ 本仓浮层根**没有** `-select-dropdown` 那半个类名（差异 D112）⇒ 同一条规则
    //    必须也落到 cascader 前缀自己身上，否则浮层保留 select 壳的 paddingXXS(4px)
    //    （L6 实测：浮层 341×188 vs antd 333×180，内部项 x/y 各偏 +4px）。
    expect(css).toContain(
      '.apollo-cascader-dropdown,.apollo-cascader-dropdown.apollo-select-dropdown{',
    );
    expect(css).toContain('padding:0;');
  });
});
