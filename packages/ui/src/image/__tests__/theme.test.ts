/** L7 主题 —— Image 的组件变量（DECLS 字面量）+ prepareComponentToken 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genImageStyle, genImageTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Image', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Image · token 契约', () => {
  const css = genImageStyle();
  const decls = genImageTokenDecls();

  it('组件变量声明块（关键值对拍 antd .ant-image-css-var）', () => {
    expect(decls).toContain('--apollo-image-z-index-popup:1080;');
    expect(decls).toContain('--apollo-image-preview-operation-size:18px;');
    // ⚠️ antd 产物的 rgba 是无空格压缩形态 —— 逐字
    expect(decls).toContain('--apollo-image-preview-operation-color:rgba(255,255,255,0.65);');
    expect(decls).toContain('--apollo-image-progress-animation-duration:3s;');
  });

  it('base 段（root / img / placeholder / cover）', () => {
    expect(css).toContain('.apollo-image{position:relative;display:inline-block;}');
    expect(css).toContain('.apollo-image-img{width:100%;height:auto;vertical-align:middle;}');
    expect(css).toContain('.apollo-image-placeholder{');
    expect(css).toContain('.apollo-image-cover{');
  });

  it('组件变量声明块覆盖两个根形态（预览浮层在 .apollo-image 子树之外）', () => {
    // 预览浮层经 Teleport 挂在 body 上，拿不到挂在 `.apollo-image` 上的组件变量
    // ⇒ 关闭按钮 font-size 会由 18px 回退成继承的 16px（图标 1em ⇒ 16px）。
    // antd 靠预览根也带 `-css-var` 类解决；本仓等价做法是声明块挂两个根（同 input D69）。
    // ⚠️ 只有 L6 能抓它（L4 的 contract 档丢 style，L1/L7 只看字面量）。
    expect(css).toContain(`.apollo-image{${decls}}`);
    expect(css).toContain(`.apollo-image-preview{${decls}}`);
  });

  it('cover placement 三向（center 是基础规则，top/bottom 独立）', () => {
    expect(css).toContain('.apollo-image-cover{');
    expect(css).toContain('.apollo-image-cover-top{inset:0 0 auto 0;justify-content:center;}');
    expect(css).toContain('.apollo-image-cover-bottom{inset:auto 0 0 0;justify-content:center;}');
  });

  it('preview 段 + progress 段 + motion', () => {
    expect(css).toContain('.apollo-image-preview{text-align:center;inset:0;position:fixed;');
    expect(css).toContain('.apollo-image-preview-mask{inset:0;position:absolute;');
    expect(css).toContain('.apollo-image-preview-footer{position:absolute;');
    expect(css).toContain('.apollo-image-progress-wrapper{position:relative;display:inline-block;');
    expect(css).toContain('.apollo-image-preview-fade-enter,.apollo-image-preview-fade-appear{');
  });

  it('keyframes 稳定命名（ink-flow ×3 + progress-active）', () => {
    expect(css).toContain('@keyframes apollo-image-ink-flow-1{');
    expect(css).toContain('@keyframes apollo-image-ink-flow-2{');
    expect(css).toContain('@keyframes apollo-image-ink-flow-3{');
    expect(css).toContain('@keyframes apollo-image-progress-active{');
  });

  it('ant 残留三坑核查（#79/#80/#81）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toMatch(/[^a-z-]anticon[^-]/);
    expect(css).not.toContain('@supports');
  });
});

describe('Image · prepareComponentToken 判据', () => {
  it('zIndexPopup = zIndexPopupBase + 80；operationSize = fontSizeIcon * 1.5', () => {
    const t = prepareComponentToken({
      zIndexPopupBase: 1000,
      colorTextLightSolid: '#fff',
      fontSizeIcon: 12,
      controlHeightLG: 40,
    });
    expect(t.zIndexPopup).toBe(1080);
    expect(t.previewOperationSize).toBe(18);
    expect(t.progressAnimationDuration).toBe('3s');
    expect(t.imagePreviewSwitchSize).toBe(40);
    expect(t.previewOperationColor).toBe('rgba(255, 255, 255, 0.65)');
    expect(t.previewOperationHoverColor).toBe('rgba(255, 255, 255, 0.85)');
    expect(t.previewOperationColorDisabled).toBe('rgba(255, 255, 255, 0.25)');
  });
});
