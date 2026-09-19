/**
 * L1/L2 的主题矩阵：light / dark / compact / token-override 四态。
 *
 * ⚠️ 与 divider 同理：**只做到「四态下都能渲染」**，没做到「四态下视觉正确」。
 *
 * Spin 的样式里没有任何字面颜色：颜色/间距/层级全部是 `var(--apollo-*)`。
 * 于是主题切换改变的是**变量值**，不是我们的 CSS；断言「dark 下颜色不同」需要
 * 浏览器计算样式（jsdom 不做布局与层叠），那是 L6 的职责。
 *
 * 所以这里断言的是**这条架构性质本身**，外加 Spin 特有的一条：**样式里的字面值
 * 恰好是那一组、且每一个都有出处**（H7 的可执行判据）。
 *
 * 「变量真的存在」由 `tests/build/run.mjs` 的 B7 校验 —— 那才是这个风险的正解。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Spin } from '../index';
import { genSpinStyle } from '../style';
import { CONTENT_HEIGHT, prepareComponentToken } from '../style/token';

const P = 'apollo-spin';

themeTest('Spin', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Spin · 主题无关性', () => {
  it('四态下的 DOM 完全相同（差异全在 CSS 变量里）', () => {
    const html = mount(Spin).html();
    // 组件本身不读任何 token 值，所以同一份 HTML 在四态下都成立。
    // 这条断言的作用是：一旦有人往组件里塞进「按主题分支」的逻辑，它会红。
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain('class="apollo-spin');
  });

  it('样式里引用的变量名全部是 `--apollo-*` 形态', () => {
    const vars = [...genSpinStyle('apollo').matchAll(/var\((--[a-z0-9-]+)\)/g)].map(
      (m) => m[1] ?? '',
    );
    expect(vars.length).toBeGreaterThan(0);
    for (const name of vars) {
      expect(name.startsWith('--apollo-')).toBe(true);
    }
  });

  it('前缀不同则产物不同（否则 prefixCls 参数是摆设）', () => {
    expect(genSpinStyle('apollo')).not.toBe(genSpinStyle('ant'));
    expect(genSpinStyle('ant')).toContain('.ant-spin-dot-holder');
    expect(genSpinStyle('ant')).toContain('.ant-spin-fullscreen');
  });

  it('★ keyframes 名字随前缀走（否则 apollo / ant 两套规则会互相覆盖同名动画）', () => {
    expect(genSpinStyle('apollo')).toContain('@keyframes apollo-spin-rotate');
    expect(genSpinStyle('apollo')).toContain('@keyframes apollo-spin-move');
    expect(genSpinStyle('ant')).toContain('@keyframes ant-spin-rotate');
    expect(genSpinStyle('ant')).toContain('@keyframes ant-spin-move');
  });

  it('★ 样式里**没有**任何硬编码颜色（H7 的可执行判据）', () => {
    const css = genSpinStyle('apollo');
    expect(css.match(/#[0-9a-f]{3,8}\b|rgba?\(/g) ?? []).toEqual([]);
  });

  it('★ 三个尺寸各自展开一份 calc（代替 antd 的组件级 CSS 变量）', () => {
    const css = genSpinStyle('apollo');
    const lg = 'var(--apollo-control-height-lg)';
    expect(css).toContain(`calc(${lg} / 2)`); // dotSize
    expect(css).toContain(`calc(${lg} * 0.35)`); // dotSizeSM
    expect(css).toContain('var(--apollo-control-height)'); // dotSizeLG
    // 三个尺寸类各自覆盖 holder 尺寸
    expect(css).toContain(`.${P}-sm`);
    expect(css).toContain(`.${P}-lg`);
  });
});

describe('Spin · Component Token', () => {
  it('★ 四个 token 的名称与默认值与 antd 的 `prepareComponentToken` 逐字一致', () => {
    // antd 6.6.4 `components/spin/style/index.ts`：
    //   prepareComponentToken = (token) => ({
    //     contentHeight: 400,
    //     dotSize: controlHeightLG / 2,
    //     dotSizeSM: controlHeightLG * 0.35,
    //     dotSizeLG: controlHeight,
    //   })
    const alias = { controlHeightLG: 40, controlHeight: 32 };
    const prepared = prepareComponentToken(alias as never);
    expect(prepared).toEqual({
      contentHeight: 400,
      dotSize: 20,
      dotSizeSM: 14,
      dotSizeLG: 32,
    });
    // 数量也是契约：多一个少一个都算漂移
    expect(Object.keys(prepared).sort()).toEqual([
      'contentHeight',
      'dotSize',
      'dotSizeLG',
      'dotSizeSM',
    ]);
  });

  it('★ `contentHeight` 声明但**不产 CSS** —— antd 6.6.4 也没有任何规则引用它', () => {
    // 由 `@ant-design/cssinjs` 的 `extractStyle` 提取的真实产物确认：
    // `--ant-spin-content-height` 被声明、从未被 `var()` 消费。
    expect(CONTENT_HEIGHT).toBe(400);
    expect(genSpinStyle('apollo')).not.toContain('400');
  });
});
