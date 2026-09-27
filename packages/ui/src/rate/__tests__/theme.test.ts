/** L7 主题 —— Rate 组件变量（DECLS 字面量）+ prepareComponentToken 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genRateStyle, genTokenDecls as genRateTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Rate', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Rate · token 契约', () => {
  const css = genRateStyle('apollo');
  const decls = genRateTokenDecls('apollo').join('\n');

  it('组件变量声明块（关键值对拍 antd .ant-rate 根块）', () => {
    expect(decls).toContain('--apollo-rate-star-color:var(--apollo-yellow-6)');
    expect(decls).toContain('--apollo-rate-star-size:calc(var(--apollo-control-height) * 0.625)');
    expect(decls).toContain('--apollo-rate-star-hover-scale:scale(1.1)');
    expect(decls).toContain('--apollo-rate-star-bg:var(--apollo-color-fill-content)');
    expect(decls).toContain('--apollo-rate-line-width-focus:var(--apollo-line-width)');
  });

  it('base 段（根 / star / first / second / 尺寸）', () => {
    expect(css).toContain('.apollo-rate{');
    expect(css).toContain('.apollo-rate .apollo-rate-star{');
    expect(css).toContain('.apollo-rate-star-first{');
    expect(css).toContain('.apollo-rate-small{');
    expect(css).toContain('.apollo-rate-large{');
  });

  it('状态段（half / full / disabled / rtl / focus-visible）', () => {
    expect(css).toContain('.apollo-rate-star-half .apollo-rate-star-first');
    expect(css).toContain('.apollo-rate-star-full .apollo-rate-star-second');
    expect(css).toContain('.apollo-rate-disabled.apollo-rate .apollo-rate-star{');
    expect(css).toContain('.apollo-rate-rtl.apollo-rate{');
    expect(css).toContain(
      'outline:var(--apollo-rate-line-width-focus) dashed var(--apollo-rate-star-color)',
    );
  });

  it('ant 残留核查（D15 / cssinjs hash / 无 keyframes）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toContain('--ant-');
    expect(css).not.toContain('@keyframes');
  });
});

describe('Rate · prepareComponentToken 判据', () => {
  it('默认主题关键值（对拍 antd prepareComponentToken）', () => {
    const t = prepareComponentToken({
      yellow6: '#fadb14',
      controlHeight: 32,
      controlHeightSM: 24,
      controlHeightLG: 40,
      colorFillContent: 'rgba(0, 0, 0, 0.06)',
    } as never);
    expect(t.starColor).toBe('#fadb14');
    expect(t.starSize).toBe(20);
    expect(t.starSizeSM).toBe(15);
    expect(t.starSizeLG).toBe(25);
    expect(t.starHoverScale).toBe('scale(1.1)');
    expect(t.starBg).toBe('rgba(0, 0, 0, 0.06)');
  });
});
