/**
 * L7 主题 —— Modal 的组件变量（DECLS 字面量）+ token 判据。
 *
 * ⚠️ demos 与 `expectCount` 在 G11 补齐（现在还没有 demo 目录）。
 */
import { describe, expect, it } from 'vitest';
import { genModalStyle, genModalTokenDecls } from '../style';
import { modalTokenValues, prepareComponentToken } from '../style/token';

describe('Modal · token 契约', () => {
  const css = genModalStyle();
  const decls = genModalTokenDecls();

  it('组件变量声明块（18 键 = 公开 6 + internal 12，对拍 antd .ant-modal-css-var）', () => {
    // 公开 6
    expect(decls).toContain('--apollo-modal-footer-bg:transparent;');
    expect(decls).toContain('--apollo-modal-header-bg:transparent;');
    expect(decls).toContain('--apollo-modal-title-line-height:1.5;');
    expect(decls).toContain('--apollo-modal-title-font-size:16px;');
    expect(decls).toContain('--apollo-modal-content-bg:#ffffff;');
    expect(decls).toContain('--apollo-modal-title-color:rgba(0,0,0,0.88);');
    // internal 12
    expect(decls).toContain('--apollo-modal-content-padding:20px 24px;');
    expect(decls).toContain('--apollo-modal-header-padding:0px;');
    expect(decls).toContain('--apollo-modal-header-border-bottom:none;');
    expect(decls).toContain('--apollo-modal-header-margin-bottom:8px;');
    expect(decls).toContain('--apollo-modal-body-padding:0px;');
    expect(decls).toContain('--apollo-modal-footer-padding:0px;');
    expect(decls).toContain('--apollo-modal-footer-border-top:none;');
    expect(decls).toContain('--apollo-modal-footer-border-radius:0px;');
    expect(decls).toContain('--apollo-modal-footer-margin-top:12px;');
    expect(decls).toContain('--apollo-modal-confirm-body-padding:0px;');
    expect(decls).toContain('--apollo-modal-confirm-icon-margin-inline-end:12px;');
    expect(decls).toContain('--apollo-modal-confirm-btns-margin-top:12px;');
    // 键数钉死（18 个 `--apollo-modal-` 声明）
    expect(decls.match(/--apollo-modal-[a-z-]+:/g)?.length).toBe(18);
  });

  it('声明块挂在 .apollo-modal 上（不是 -root —— PurePanel 没有 root）', () => {
    expect(css).toContain(`.apollo-modal{${decls}}`);
  });

  it('关键规则：root / mask / wrap / 面板三段 / confirm', () => {
    expect(css).toContain('.apollo-modal-root .apollo-modal-mask{');
    expect(css).toContain('.apollo-modal-root .apollo-modal-wrap{');
    expect(css).toContain('.apollo-modal .apollo-modal-container{');
    expect(css).toContain('.apollo-modal .apollo-modal-header{');
    expect(css).toContain('.apollo-modal .apollo-modal-body{');
    expect(css).toContain('.apollo-modal .apollo-modal-footer{');
    expect(css).toContain('.apollo-modal .apollo-modal-close{');
    expect(css).toContain('.apollo-modal-pure-panel{');
    expect(css).toContain('.apollo-modal-confirm .apollo-modal-confirm-body{');
    // 5 种 confirm 形态的图标色
    expect(css).toContain('.apollo-modal-confirm-error .apollo-modal-confirm-body>.apollo-icon{');
    expect(css).toContain('.apollo-modal-confirm-success .apollo-modal-confirm-body>.apollo-icon{');
    expect(css).toContain('.apollo-modal-confirm-info .apollo-modal-confirm-body>.apollo-icon{');
  });

  it('动效：fade（mask）与 zoom（面板）各两套 keyframes + 稳定名引用', () => {
    for (const name of [
      'apollo-modal-fade-in',
      'apollo-modal-fade-out',
      'apollo-modal-zoom-in',
      'apollo-modal-zoom-out',
    ]) {
      expect(css).toContain(`@keyframes ${name}{`);
      expect(css).toContain(`animation-name:${name};`);
    }
    // mask 的动效规则挂在 root 下，zoom 的是裸类
    expect(css).toContain('.apollo-modal-root .apollo-fade-enter');
    expect(css).toContain('.apollo-zoom-enter,');
  });

  it('响应式宽度的阶梯变量', () => {
    expect(css).toContain('--apollo-modal-sm-width:var(--apollo-modal-xs-width)');
    expect(css).toContain('--apollo-modal-xxxl-width:var(--apollo-modal-xxl-width)');
    expect(css).toContain('width:var(--apollo-modal-xs-width)');
  });

  it('ant 残留三坑核查', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toMatch(/[^a-z-]anticon[^-]/);
    expect(css).not.toContain('@supports');
    // loadingCircle 属 Skeleton，不该出现在 modal 的产物里
    expect(css).not.toContain('loadingCircle');
  });

  it('前缀替换只动类名段（CSS 变量名与 keyframes 名不变）', () => {
    const renamed = genModalStyle('ant');
    expect(renamed).toContain('.ant-modal{');
    expect(renamed).toContain('.ant-modal-root .ant-modal-mask{');
    expect(renamed).toContain('--apollo-modal-title-font-size:16px;');
    expect(renamed).toContain('@keyframes apollo-modal-fade-in{');
  });
});

describe('Modal · prepareComponentToken 判据', () => {
  const seed = {
    lineHeightHeading5: 1.5,
    fontSizeHeading5: 16,
    colorBgElevated: '#ffffff',
    colorTextHeading: 'rgba(0,0,0,0.88)',
    paddingMD: 20,
    paddingContentHorizontalLG: 24,
    padding: 16,
    paddingLG: 24,
    paddingXS: 8,
    lineWidth: 1,
    lineType: 'solid',
    colorSplit: 'rgba(5,5,5,0.06)',
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginLG: 24,
    borderRadiusLG: 8,
  };

  it('非 wireframe：padding 类内部键归零、margin 类取值', () => {
    const t = prepareComponentToken(seed);
    expect(t.contentPadding).toBe('20px 24px');
    expect(t.headerPadding).toBe(0);
    expect(t.headerBorderBottom).toBe('none');
    expect(t.headerMarginBottom).toBe(8);
    expect(t.bodyPadding).toBe(0);
    expect(t.footerPadding).toBe(0);
    expect(t.footerBorderTop).toBe('none');
    expect(t.footerBorderRadius).toBe(0);
    expect(t.footerMarginTop).toBe(12);
    expect(t.confirmBodyPadding).toBe(0);
    expect(t.confirmIconMarginInlineEnd).toBe(12);
    expect(t.confirmBtnsMarginTop).toBe(12);
    expect(t.mask).toBe(true);
  });

  it('wireframe：padding 类取组合串、margin 类归零', () => {
    const t = prepareComponentToken({ ...seed, wireframe: true });
    expect(t.contentPadding).toBe(0);
    expect(t.headerPadding).toBe('16px 24px');
    expect(t.headerBorderBottom).toBe('1px solid rgba(5,5,5,0.06)');
    expect(t.headerMarginBottom).toBe(0);
    expect(t.bodyPadding).toBe(24);
    expect(t.footerPadding).toBe('8px 16px');
    expect(t.footerBorderTop).toBe('1px solid rgba(5,5,5,0.06)');
    expect(t.footerBorderRadius).toBe('0 0 8px 8px');
    expect(t.footerMarginTop).toBe(0);
    expect(t.confirmBodyPadding).toBe('32px 32px 24px');
    expect(t.confirmIconMarginInlineEnd).toBe(16);
    expect(t.confirmBtnsMarginTop).toBe(24);
  });

  it('modalTokenValues 与 DECLS 字面量一致', () => {
    const t = modalTokenValues();
    const decls = genModalTokenDecls();
    expect(decls).toContain(`--apollo-modal-title-font-size:${t.titleFontSize}px;`);
    expect(decls).toContain(`--apollo-modal-title-line-height:${t.titleLineHeight};`);
    expect(decls).toContain(`--apollo-modal-content-bg:${t.contentBg};`);
    expect(decls).toContain(`--apollo-modal-title-color:${t.titleColor};`);
    expect(decls).toContain(`--apollo-modal-content-padding:${t.contentPadding};`);
    expect(decls).toContain(
      `--apollo-modal-confirm-icon-margin-inline-end:${t.confirmIconMarginInlineEnd}px;`,
    );
  });

  it('公开面是 6 键（registry 的 tokenCount=6）', () => {
    const t = modalTokenValues();
    const publicKeys = [
      'headerBg',
      'titleLineHeight',
      'titleFontSize',
      'titleColor',
      'contentBg',
      'footerBg',
    ];
    for (const key of publicKeys) {
      expect(Object.keys(t)).toContain(key);
    }
    // 公开 6 + internal 12 + mask = 19
    expect(Object.keys(t).length).toBe(19);
  });
});
