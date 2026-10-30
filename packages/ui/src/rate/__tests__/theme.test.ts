/** L7 主题 —— Rate 组件变量（DECLS 字面量）+ prepareComponentToken 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import {
  compactAlgorithm,
  darkAlgorithm,
  getDesignToken,
  type ThemeConfig,
  ThemeProvider,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ConfigProvider from '../../config-provider';
import Rate from '../Rate';
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

describe('Rate · current scoped component tokens', () => {
  it('projects all six public overrides onto the actual root with numeric length units', () => {
    const w = mount(ConfigProvider, {
      props: {
        theme: {
          components: {
            Rate: {
              starColor: '#123456',
              starSize: 34,
              starSizeSM: 22,
              starSizeLG: 46,
              starHoverScale: 'scale(1.35)',
              starBg: '#abcdef',
            },
          },
        },
      },
      slots: { default: () => h(Rate) },
    });
    const style = w.get<HTMLUListElement>('ul').element.style;
    expect(style.getPropertyValue('--apollo-rate-star-color')).toBe('#123456');
    expect(style.getPropertyValue('--apollo-rate-star-size')).toBe('34px');
    expect(style.getPropertyValue('--apollo-rate-star-size-sm')).toBe('22px');
    expect(style.getPropertyValue('--apollo-rate-star-size-lg')).toBe('46px');
    expect(style.getPropertyValue('--apollo-rate-star-hover-scale')).toBe('scale(1.35)');
    expect(style.getPropertyValue('--apollo-rate-star-bg')).toBe('#abcdef');
    w.unmount();
  });

  it('inherits missing fields from the nearest current nested Provider without leaking to siblings', async () => {
    const inner = ref<ThemeConfig>({
      components: { Rate: { starColor: '#224466', starSize: 40 } },
    });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              theme: {
                components: { Rate: { starColor: '#112233', starSize: 30, starSizeSM: 18 } },
              },
            },
            () => [
              h(Rate, { id: 'outer-rate' }),
              h(ConfigProvider, { theme: inner.value }, () => h(Rate, { id: 'inner-rate' })),
            ],
          ),
      }),
    );
    const outer = w.get<HTMLUListElement>('#outer-rate').element;
    const current = w.get<HTMLUListElement>('#inner-rate').element;
    expect(outer.style.getPropertyValue('--apollo-rate-star-color')).toBe('#112233');
    expect(current.style.getPropertyValue('--apollo-rate-star-color')).toBe('#224466');
    expect(current.style.getPropertyValue('--apollo-rate-star-size-sm')).toBe('18px');
    inner.value = { components: { Rate: { starSize: 44 } } };
    await nextTick();
    expect(current.style.getPropertyValue('--apollo-rate-star-color')).toBe('#112233');
    expect(current.style.getPropertyValue('--apollo-rate-star-size')).toBe('44px');
    expect(outer.style.getPropertyValue('--apollo-rate-star-size')).toBe('30px');
    w.unmount();
  });

  it('replaces and removes component overrides and restores current global derivation on the same root', async () => {
    const theme = ref<ThemeConfig | undefined>({
      token: { controlHeight: 48, controlHeightSM: 32, controlHeightLG: 64 },
      components: { Rate: { starSize: 42, starColor: '#123456' } },
    });
    const w = mount(
      defineComponent({
        setup: () => () => h(ConfigProvider, { theme: theme.value }, () => h(Rate)),
      }),
    );
    const root = w.get<HTMLUListElement>('ul').element;
    expect(root.style.getPropertyValue('--apollo-rate-star-size')).toBe('42px');
    theme.value = { token: { controlHeight: 56, controlHeightSM: 40, controlHeightLG: 72 } };
    await nextTick();
    expect(w.get('ul').element).toBe(root);
    expect(root.style.getPropertyValue('--apollo-rate-star-size')).toBe('35px');
    expect(root.style.getPropertyValue('--apollo-rate-star-size-sm')).toBe('25px');
    expect(root.style.getPropertyValue('--apollo-rate-star-size-lg')).toBe('45px');
    expect(root.style.getPropertyValue('--apollo-rate-star-color')).toBe(
      getDesignToken(theme.value).yellow6,
    );
    theme.value = undefined;
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-rate-star-size')).toBe('');
    expect(root.style.getPropertyValue('--apollo-rate-star-color')).toBe('');
    expect(root.style.getPropertyValue('--apollo-font-family')).toBe('');
    w.unmount();
  });

  it('derives colors, sizes and consumed aliases from an explicit source theme and its current algorithm', async () => {
    const theme = ref<ThemeConfig>({
      token: {
        controlHeight: 48,
        fontFamily: 'monospace',
        fontSize: 18,
        marginXS: 12,
        lineWidth: 2,
        motionDurationMid: '0s',
        yellow6: '#abcdef',
        colorFillContent: '#123456',
      },
    });
    const w = mount(
      defineComponent({
        setup: () => () => h(ThemeProvider, { theme: theme.value }, () => h(Rate)),
      }),
    );
    const style = w.get<HTMLUListElement>('ul').element.style;
    expect(style.getPropertyValue('--apollo-rate-star-size')).toBe('30px');
    expect(style.getPropertyValue('--apollo-rate-star-color')).toBe('#abcdef');
    expect(style.getPropertyValue('--apollo-rate-star-bg')).toBe('#123456');
    expect(style.getPropertyValue('--apollo-font-family')).toBe('monospace');
    expect(style.getPropertyValue('--apollo-font-size')).toBe('18px');
    expect(style.getPropertyValue('--apollo-margin-xs')).toBe('12px');
    expect(style.getPropertyValue('--apollo-line-width')).toBe('2px');
    expect(style.getPropertyValue('--apollo-motion-duration-mid')).toBe('0s');
    theme.value = { algorithm: [darkAlgorithm, compactAlgorithm] };
    await nextTick();
    const current = getDesignToken(theme.value);
    expect(style.getPropertyValue('--apollo-rate-star-size')).toBe(
      `${current.controlHeight * 0.625}px`,
    );
    expect(style.getPropertyValue('--apollo-rate-star-bg')).toBe(current.colorFillContent);
    expect(style.getPropertyValue('--apollo-rate-star-color')).toBe(current.yellow6);
    w.unmount();
  });

  it('tracks the current component prefix with Provider and native style precedence', async () => {
    const prefix = ref('brand-rate');
    const native = ref<string>();
    const local = ref<Record<string, string>>({ '--brand-rate-star-size': '41px' });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              theme: { components: { Rate: { starSize: 37, starSizeSM: '1.5rem' } } },
              components: { rate: { style: local.value } },
            },
            () => h(Rate, { prefixCls: prefix.value, style: native.value }),
          ),
      }),
    );
    const root = w.get<HTMLUListElement>('ul').element;
    expect(root.style.getPropertyValue('--brand-rate-star-size')).toBe('41px');
    expect(root.style.getPropertyValue('--brand-rate-star-size-sm')).toBe('1.5rem');
    native.value = '--brand-rate-star-size:49px';
    await nextTick();
    expect(root.style.getPropertyValue('--brand-rate-star-size')).toBe('49px');
    native.value = undefined;
    local.value = {};
    await nextTick();
    expect(root.style.getPropertyValue('--brand-rate-star-size')).toBe('37px');
    prefix.value = 'next-rate';
    await nextTick();
    expect(w.get('ul').element).toBe(root);
    expect(root.style.getPropertyValue('--next-rate-star-size')).toBe('37px');
    expect(root.style.getPropertyValue('--brand-rate-star-size')).toBe('');
    w.unmount();
  });

  it('keeps invalid generic values out of CSS and serializes the current source in SSR', async () => {
    const w = mount(ThemeProvider, {
      props: {
        theme: {
          components: {
            Rate: {
              starSize: -1,
              starSizeSM: true,
              starSizeLG: Number.NaN,
              starColor: false,
              starBg: 22,
              starHoverScale: true,
            },
          },
        },
      },
      slots: { default: () => h(Rate) },
    });
    const style = w.get<HTMLUListElement>('ul').element.style;
    expect(style.getPropertyValue('--apollo-rate-star-size')).toBe('20px');
    expect(style.getPropertyValue('--apollo-rate-star-size-sm')).toBe('15px');
    expect(style.getPropertyValue('--apollo-rate-star-size-lg')).toBe('25px');
    expect(style.getPropertyValue('--apollo-rate-star-color')).toBe(getDesignToken().yellow6);
    expect(style.getPropertyValue('--apollo-rate-star-bg')).toBe(getDesignToken().colorFillContent);
    expect(style.getPropertyValue('--apollo-rate-star-hover-scale')).toBe('scale(1.1)');
    w.unmount();
    const html = await renderToString(
      h(
        ThemeProvider,
        {
          theme: { components: { Rate: { starSize: 36, starColor: '#123456' } } },
        },
        () => h(Rate, { prefixCls: 'server-rate' }),
      ),
    );
    expect(html).toContain('--server-rate-star-size:36px');
    expect(html).toContain('--server-rate-star-color:#123456');
  });
});
