/**
 * L7 主题 —— Tour 的 Component Token（**4 个自有字段** + 箭头族）。
 *
 * 钉：主题无关性（themeTest 四态）+ token 判定值（与 antd 6.6.4 产物逐字对拍，
 * 见 style/token.ts 头注释）+ 关键选择器的 var() 消费 + 单位规则
 * （`z-index-popup` 无单位，其余数值 token 带 px —— antd 的 unitless 白名单不含它们）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genTourStyle, genTourTokenDecls } from '../style';
import { tourInternalTokenValues, tourTokenValues } from '../style/token';

themeTest('Tour', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Tour · Component Token 判定值（antd 产物逐字对拍）', () => {
  const t = tourTokenValues();

  it('4 个自有字段', () => {
    expect(t.zIndexPopup).toBe(1070); // zIndexPopupBase(1000) + 70
    expect(t.closeBtnSize).toBeCloseTo(22, 10); // fontSize(14) × lineHeight(1.5714…)
    expect(t.primaryPrevBtnBg).toBe('rgba(255,255,255,0.15)');
    expect(t.primaryNextBtnHoverBg).toBe('rgb(240,240,240)');
  });

  it('箭头族（与 tooltip / dropdown 共享的派生 token）', () => {
    expect(t.arrowOffsetHorizontal).toBe(12);
    expect(t.arrowOffsetVertical).toBe(8);
    expect(t.arrowShadowWidth).toBeCloseTo(8.970562748477143, 12);
    expect(t.arrowPath).toContain('M 0 8');
    expect(t.arrowPolygon).toContain('polygon(');
  });

  it('内部 token（mergeToken 注入，不进公开面）', () => {
    const internal = tourInternalTokenValues();
    expect(internal).toEqual({ indicatorWidth: 6, indicatorHeight: 6, tourBorderRadius: 8 });
  });
});

describe('Tour · 静态 CSS（var() 消费与单位规则）', () => {
  const css = genTourStyle('apollo');
  const decls = genTourTokenDecls();

  it('变量声明块：z-index-popup 无单位，数值 token 带 px（token.ts 单位规则）', () => {
    expect(decls).toContain('--apollo-tour-z-index-popup:1070;');
    expect(decls).toContain('--apollo-tour-close-btn-size:22px;');
    expect(decls).toContain('--apollo-tour-primary-prev-btn-bg:rgba(255,255,255,0.15);');
    expect(decls).toContain('--apollo-tour-primary-next-btn-hover-bg:rgb(240,240,240);');
    expect(decls).toContain('--apollo-tour-arrow-offset-horizontal:12px;');
    expect(decls).toContain('--apollo-tour-arrow-offset-vertical:8px;');
    expect(decls).toContain('--apollo-tour-arrow-shadow-width:8.970562748477143px;');
    expect(decls).toContain('--apollo-tour-arrow-path:');
    expect(decls).toContain('--apollo-tour-arrow-polygon:');
  });

  it('根规则：z-index 消费 token、宽度 520px 字面量（E10 豁免）、借 tooltip 组箭头变量', () => {
    expect(css).toContain('z-index:var(--apollo-tour-z-index-popup);');
    expect(css).toContain('width:520px;');
    expect(css).toContain(
      '--apollo-tooltip-arrow-background-color:var(--apollo-color-bg-elevated);',
    );
  });

  it('面板 / 关闭钮 / 指示器 / primary 形态的规则', () => {
    expect(css).toContain('.apollo-tour .apollo-tour-section{');
    expect(css).toContain('width:var(--apollo-tour-close-btn-size);');
    expect(css).toContain('.apollo-tour .apollo-tour-section .apollo-tour-close:focus-visible{');
    expect(css).toContain('.apollo-tour-indicator{width:6px;height:6px;');
    expect(css).toContain('background:var(--apollo-color-primary);');
    // primary：prev 幽灵化 + 两个专用色
    expect(css).toContain('border-color:var(--apollo-tour-primary-prev-btn-bg);');
    expect(css).toContain('background:var(--apollo-tour-primary-next-btn-hover-bg);');
    // 蒙层挖洞动效
    expect(css).toContain(
      '.apollo-tour-mask .apollo-tour-placeholder-animated{transition:all var(--apollo-motion-duration-slow);}',
    );
  });

  it('无 @keyframes（rc-tour 的 Trigger 不传 motion；动效只有蒙层 transition）', () => {
    expect(css).not.toContain('@keyframes');
  });

  it('ant 前缀产物：类名替换、变量名保持 --apollo-*（popover 同判）', () => {
    const ant = genTourStyle('ant');
    expect(ant).toContain('.ant-tour{');
    expect(ant).toContain('.ant-tour .ant-tour-section{');
    expect(ant).toContain('.ant-btn{');
    expect(ant).toContain('var(--apollo-tour-z-index-popup)');
  });
});
