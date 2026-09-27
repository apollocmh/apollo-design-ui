/** L7 主题 —— Steps 组件变量（DECLS 字面量）+ prepareComponentToken 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genStepsStyle, genStepsTokenDecls } from '../style';
import { prepareStepsComponentToken } from '../style/token';

themeTest('Steps', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Steps · token 契约', () => {
  const css = genStepsStyle();
  const decls = genStepsTokenDecls();

  it('组件变量声明块（关键值对拍 antd .ant-steps 根块）', () => {
    expect(decls).toContain('--apollo-steps-title-line-height:32px;');
    expect(decls).toContain('--apollo-steps-icon-size:32px;');
    expect(decls).toContain('--apollo-steps-icon-top:-0.5px;');
    expect(decls).toContain('--apollo-steps-dot-size:8px;');
    expect(decls).toContain('--apollo-steps-dot-current-size:10px;');
    expect(decls).toContain('--apollo-steps-icon-size-sm:24px;');
  });

  it('base 段（root / item / wrapper / icon / header / title / rail / content）', () => {
    expect(css).toContain('.apollo-steps{');
    expect(css).toContain('.apollo-steps .apollo-steps-item{');
    expect(css).toContain('.apollo-steps .apollo-steps-item-icon{');
    expect(css).toContain('.apollo-steps .apollo-steps-item-header{');
    expect(css).toContain('.apollo-steps-item-rail{');
  });

  it('status 变量链（filled process 实心 active）', () => {
    expect(css).toContain('.apollo-steps.apollo-steps-filled .apollo-steps-item-process');
    expect(css).toContain('item-icon-active-bg-color:var(--apollo-color-primary)');
    expect(css).toContain('item-icon-active-text-color:var(--apollo-color-text-light-solid)');
  });

  it('布局变体类（vertical / nav / panel / inline / small）', () => {
    expect(css).toContain('.apollo-steps-vertical');
    expect(css).toContain('.apollo-steps-navigation');
    expect(css).toContain('.apollo-steps-panel');
    expect(css).toContain('.apollo-steps-inline');
    expect(css).toContain('.apollo-steps-small');
  });

  it('ant 残留核查（D15 / cssinjs hash / 无 keyframes —— motion 基线职责）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toContain('--ant-');
    expect(css).not.toContain('@keyframes');
  });
});

describe('Steps · prepareComponentToken 判据', () => {
  it('默认主题关键值（对拍 antd prepareComponentToken）', () => {
    const t = prepareStepsComponentToken({
      controlHeight: 32,
      controlHeightSM: 24,
      controlHeightLG: 40,
      fontSize: 14,
      fontSizeHeading3: 20,
      colorTextDisabled: 'rgba(0, 0, 0, 0.25)',
      colorTextLabel: 'rgba(0, 0, 0, 0.45)',
      colorBgContainer: '#ffffff',
      colorFillContent: 'rgba(0, 0, 0, 0.06)',
      colorPrimary: '#1677ff',
      controlItemBgActive: '#e6f4ff',
      wireframe: false,
    });
    expect(t.titleLineHeight).toBe(32);
    expect(t.customIconSize).toBe(32);
    expect(t.customIconFontSize).toBe(24);
    expect(t.iconSize).toBe(32);
    expect(t.iconTop).toBe(-0.5);
    expect(t.iconFontSize).toBe(14);
    expect(t.iconSizeSM).toBe(20);
    expect(t.dotSize).toBe(8);
    expect(t.dotCurrentSize).toBe(10);
    expect(t.navArrowColor).toBe('rgba(0, 0, 0, 0.25)');
    expect(t.navContentMaxWidth).toBe('unset');
  });
});
