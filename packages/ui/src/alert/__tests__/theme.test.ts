/**
 * L7 主题矩阵。Alert 的颜色/尺寸全部 var() 化；
 * Component Token 4 个落 CSS 变量（两个别名派生 + 两个字符串常量）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genAlertStyle } from '../style';

themeTest('Alert', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Alert · 主题无关性', () => {
  const css = genAlertStyle('apollo');

  it('Component Token 4 个 CSS 变量声明在根类', () => {
    expect(css).toContain('--apollo-alert-border-radius:var(--apollo-border-radius-lg)');
    expect(css).toContain(
      '--apollo-alert-with-description-icon-size:var(--apollo-font-size-heading-3)',
    );
    expect(css).toContain('--apollo-alert-default-padding:8px 12px');
    expect(css).toContain('--apollo-alert-with-description-padding:20px 24px');
  });

  it('四 type 的边框 + 背景 + 图标色', () => {
    expect(css).toContain('border-color:var(--apollo-color-success-border)');
    expect(css).toContain('background:var(--apollo-color-success-bg)');
    expect(css).toContain('color:var(--apollo-color-success)');
    expect(css).toContain('border-color:var(--apollo-color-info-border)');
    expect(css).toContain('background:var(--apollo-color-info-bg)');
    expect(css).toContain('border-color:var(--apollo-color-warning-border)');
    expect(css).toContain('border-color:var(--apollo-color-error-border)');
    // error 的 pre 规则
    expect(css).toContain('.apollo-alert-error .apollo-alert-description>pre{');
  });

  it('close-icon / close-text / focus-visible 全覆盖', () => {
    expect(css).toContain('.apollo-alert .apollo-alert-close-icon:focus-visible{');
    expect(css).toContain(
      'outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border)',
    );
    expect(css).toContain('.apollo-alert-close-icon .apollo-icon-close{');
    expect(css).toContain('color:var(--apollo-color-icon-hover)');
  });

  it('motion-leave 收起动画（maxHeight 链路）', () => {
    expect(css).toContain('.apollo-alert.apollo-alert-motion-leave{');
    expect(css).toContain(
      'transition:max-height var(--apollo-motion-duration-slow) var(--apollo-motion-ease-in-out-circ)',
    );
    expect(css).toContain('.apollo-alert.apollo-alert-motion-leave-active{');
    expect(css).toContain('max-height:0;');
  });

  it('banner / with-description / ant 前缀产物', () => {
    expect(css).toContain('.apollo-alert.apollo-alert-banner{');
    expect(css).toContain('border:0!important;');
    expect(css).toContain('.apollo-alert.apollo-alert-with-description{');
    expect(css).toContain('padding:var(--apollo-alert-with-description-padding)');
    const ant = genAlertStyle('ant');
    expect(ant).toContain('--ant-alert-border-radius:var(--apollo-border-radius-lg)');
  });
});
