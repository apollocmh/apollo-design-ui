/**
 * L7 主题矩阵 —— Layout 的 Component Token 19 个全部 var() 化（两个字面常量
 * #001529 / #002140 是 antd 的硬编码值，E10 对声明行豁免）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genLayoutStyle, genSiderStyle } from '../style';

themeTest('Layout', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Layout · 主题无关性', () => {
  const css = genLayoutStyle('apollo');
  const siderCss = genSiderStyle('apollo');

  it('19 个 Component Token 声明在根类', () => {
    for (const name of [
      'body-bg',
      'color-bg-body',
      'color-bg-header',
      'color-bg-trigger',
      'header-bg',
      'header-height',
      'header-padding',
      'header-color',
      'footer-padding',
      'footer-bg',
      'sider-bg',
      'trigger-height',
      'trigger-bg',
      'trigger-color',
      'zero-trigger-width',
      'zero-trigger-height',
      'light-sider-bg',
      'light-trigger-bg',
      'light-trigger-color',
    ]) {
      expect(css).toContain(`--apollo-layout-${name}:`);
    }
  });

  it('派生用 calc / var（不写死 64px、50px）', () => {
    expect(css).toContain('--apollo-layout-header-height:calc(var(--apollo-control-height) * 2)');
    expect(css).toContain(
      '--apollo-layout-header-padding:0 calc(var(--apollo-control-height-lg) * 1.25)',
    );
    expect(css).toContain(
      '--apollo-layout-trigger-height:calc(var(--apollo-control-height-lg) + var(--apollo-margin-xxs) * 2)',
    );
    expect(css).toContain(
      '--apollo-layout-footer-padding:var(--apollo-control-height-sm) calc(var(--apollo-control-height-lg) * 1.25)',
    );
  });

  it('Layout 主体规则（flex / has-sider / rtl）', () => {
    expect(css).toContain('.apollo-layout{');
    expect(css).toContain('background:var(--apollo-layout-body-bg)');
    expect(css).toContain('.apollo-layout.apollo-layout-has-sider{');
    expect(css).toContain('flex-direction:row;');
    expect(css).toContain('.apollo-layout-rtl{');
    expect(css).toContain('direction:rtl;');
  });

  it('Header / Footer / Content 三段', () => {
    expect(css).toContain('.apollo-layout-header{');
    expect(css).toContain('line-height:var(--apollo-layout-header-height);');
    expect(css).toContain('.apollo-layout-footer{');
    expect(css).toContain('.apollo-layout-content{');
    expect(css).toContain('min-height:0;');
  });

  it('Sider 规则（trigger / zero-width / light）', () => {
    expect(siderCss).toContain('.apollo-layout-sider{');
    expect(siderCss).toContain('transition:all var(--apollo-motion-duration-mid),background 0s;');
    expect(siderCss).toContain('.apollo-layout-sider .apollo-layout-sider-trigger{');
    expect(siderCss).toContain(
      'inset-inline-end:calc(var(--apollo-layout-zero-trigger-width) * -1);',
    );
    expect(siderCss).toContain('.apollo-layout-sider-light{');
    expect(siderCss).toContain(
      'border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-layout-body-bg);',
    );
  });

  it('ant 前缀产物同构', () => {
    const ant = genLayoutStyle('ant');
    // ⚠️ 全局 alias token 的变量名恒为 `--apollo-*`（theme 包产出单一套 CSS 变量），
    //    只有**组件前缀**随 rootPrefixCls 变（alert / tag 同约定）。
    expect(ant).toContain('--ant-layout-body-bg:var(--apollo-color-bg-layout)');
    expect(genSiderStyle('ant')).toContain('--ant-layout-sider-bg:#001529');
  });
});
