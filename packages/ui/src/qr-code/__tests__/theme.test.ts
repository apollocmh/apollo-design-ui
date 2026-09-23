/**
 * L7 · 主题与样式 —— QrCode（1 个 Component Token 构建期解析值 + 样式段）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genQrCodeStyle, genTokenDecls, prepareComponentToken } from '../style';

describe('QrCode · 样式', () => {
  const css = genQrCodeStyle('apollo');
  const decls = genTokenDecls('apollo');

  it('唯一 Component Token：cover 背景色 = colorBgContainer 透明到 0.96（FastColor 同判）', () => {
    // antd: new FastColor(colorBgContainer).setA(0.96).toRgbString()
    // colorBgContainer 默认 #ffffff ⇒ rgba(255,255,255,0.96)
    expect(decls).toContain('  --apollo-qrcode-cover-background-color:rgba(255,255,255,0.96);');
    // prepareComponentToken 的输入输出契约
    expect(prepareComponentToken({ colorBgContainer: '#ffffff' }).QRCodeCoverBackgroundColor).toBe(
      'rgba(255,255,255,0.96)',
    );
  });

  it('根段：resetComponent 全套 + flex 居中 + 边框', () => {
    expect(css).toContain('.apollo-qrcode{');
    expect(css).toContain('  display:flex;');
    expect(css).toContain('  justify-content:center;');
    expect(css).toContain('  align-items:center;');
    expect(css).toContain('  padding:var(--apollo-padding-sm);');
    expect(css).toContain(
      '  border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);',
    );
    expect(css).toContain('  border-radius:var(--apollo-border-radius-lg);');
    expect(css).toContain('  overflow:hidden;');
  });

  it('cover 段：绝对定位 + 组件 Token 背景', () => {
    expect(css).toContain('.apollo-qrcode > .apollo-qrcode-cover{');
    expect(css).toContain('  position:absolute;');
    expect(css).toContain('  z-index:10;');
    expect(css).toContain('  background:var(--apollo-qrcode-cover-background-color);');
    expect(css).toContain('.apollo-qrcode > .apollo-qrcode-cover > .apollo-qrcode-expired,');
  });

  it('canvas / borderless 段', () => {
    expect(css).toContain('.apollo-qrcode > canvas{');
    expect(css).toContain('  align-self:stretch;');
    expect(css).toContain('  flex:auto;');
    expect(css).toContain('.apollo-qrcode-borderless{');
    expect(css).toContain('  border-color:transparent;');
    expect(css).toContain('  padding:0;');
  });
});

themeTest('QrCode', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});
