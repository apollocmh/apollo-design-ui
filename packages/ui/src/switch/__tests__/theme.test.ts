/**
 * Switch 主题回归：保留静态 CSS 的 13 项默认值与 reduced-motion 断言，
 * 补当前主题、覆盖、嵌套、派生、移除与 SSR 的实际根变量消费。
 */

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
import Switch from '../Switch';
import { genSwitchStyle, genTokenDecls as genSwitchTokenDecls } from '../style';

themeTest('Switch', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Switch · current source component tokens', () => {
  it('serializes all thirteen overrides with CSS length units, including negative track padding', () => {
    const wrapper = mount(ConfigProvider, {
      props: {
        theme: {
          components: {
            Switch: {
              trackHeight: 30,
              trackHeightSM: '1.25rem',
              trackMinWidth: 64,
              trackMinWidthSM: 40,
              trackPadding: -3,
              handleBg: '#123456',
              handleShadow: '0 0 4px #abcdef',
              handleSize: 24,
              handleSizeSM: 16,
              innerMinMargin: 10,
              innerMaxMargin: 32,
              innerMinMarginSM: 6,
              innerMaxMarginSM: 20,
            },
          },
        },
      },
      slots: { default: () => h(Switch) },
    });
    const style = wrapper.get<HTMLButtonElement>('button').element.style;
    const expected = {
      '--apollo-switch-track-height': '30px',
      '--apollo-switch-track-height-sm': '1.25rem',
      '--apollo-switch-track-min-width': '64px',
      '--apollo-switch-track-min-width-sm': '40px',
      '--apollo-switch-track-padding': '-3px',
      '--apollo-switch-handle-bg': '#123456',
      '--apollo-switch-handle-shadow': '0 0 4px #abcdef',
      '--apollo-switch-handle-size': '24px',
      '--apollo-switch-handle-size-sm': '16px',
      '--apollo-switch-inner-min-margin': '10px',
      '--apollo-switch-inner-max-margin': '32px',
      '--apollo-switch-inner-min-margin-sm': '6px',
      '--apollo-switch-inner-max-margin-sm': '20px',
    };
    for (const [name, value] of Object.entries(expected)) {
      expect(style.getPropertyValue(name)).toBe(value);
    }
    wrapper.unmount();
  });

  it('inherits missing nested fields and restores parent overrides when the inner theme is withdrawn', async () => {
    const inner = ref<ThemeConfig | undefined>({ components: { Switch: { trackHeight: 48 } } });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: { components: { Switch: { trackHeight: 36, handleBg: '#123456' } } } },
            () => [
              h(Switch, { id: 'outer' }),
              h(ConfigProvider, { theme: inner.value }, () => h(Switch, { id: 'inner' })),
            ],
          ),
      }),
    );
    const outer = wrapper.get<HTMLButtonElement>('#outer').element;
    const nested = wrapper.get<HTMLButtonElement>('#inner').element;
    expect(outer.style.getPropertyValue('--apollo-switch-track-height')).toBe('36px');
    expect(nested.style.getPropertyValue('--apollo-switch-track-height')).toBe('48px');
    expect(nested.style.getPropertyValue('--apollo-switch-handle-bg')).toBe('#123456');
    inner.value = { components: { Switch: { handleBg: '#654321' } } };
    await nextTick();
    expect(nested.style.getPropertyValue('--apollo-switch-track-height')).toBe('36px');
    expect(nested.style.getPropertyValue('--apollo-switch-handle-bg')).toBe('#654321');
    inner.value = undefined;
    await nextTick();
    expect(nested.style.getPropertyValue('--apollo-switch-handle-bg')).toBe('#123456');
    expect(outer.style.getPropertyValue('--apollo-switch-handle-bg')).toBe('#123456');
    wrapper.unmount();
  });

  it('replaces component overrides with current global derivation and clears a removed source on the same button', async () => {
    const theme = ref<ThemeConfig | undefined>({
      token: { fontSize: 18, lineHeight: 2, controlHeight: 40, fontFamily: 'monospace' },
      components: { Switch: { trackHeight: 41, handleBg: '#123456' } },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(ConfigProvider, { theme: theme.value }, () => h(Switch)),
      }),
    );
    const button = wrapper.get<HTMLButtonElement>('button').element;
    expect(button.style.getPropertyValue('--apollo-switch-track-height')).toBe('41px');
    expect(button.style.getPropertyValue('--apollo-switch-track-height-sm')).toBe('20px');
    expect(button.style.getPropertyValue('--apollo-font-family')).toBe('monospace');
    theme.value = {
      token: { fontSize: 16, lineHeight: 2, controlHeight: 36, colorWhite: '#abcdef' },
    };
    await nextTick();
    expect(wrapper.get('button').element).toBe(button);
    expect(button.style.getPropertyValue('--apollo-switch-track-height')).toBe('32px');
    expect(button.style.getPropertyValue('--apollo-switch-handle-size')).toBe('28px');
    expect(button.style.getPropertyValue('--apollo-switch-track-height-sm')).toBe('18px');
    expect(button.style.getPropertyValue('--apollo-switch-handle-bg')).toBe('#abcdef');
    expect(button.style.getPropertyValue('--apollo-font-size')).toBe('16px');
    theme.value = { algorithm: [darkAlgorithm, compactAlgorithm] };
    await nextTick();
    const current = getDesignToken(theme.value);
    expect(button.style.getPropertyValue('--apollo-switch-track-height')).toBe(
      `${current.fontSize * current.lineHeight}px`,
    );
    expect(button.style.getPropertyValue('--apollo-switch-track-height-sm')).toBe(
      `${current.controlHeight / 2}px`,
    );
    expect(button.style.getPropertyValue('--apollo-switch-handle-bg')).toBe(current.colorWhite);
    theme.value = undefined;
    await nextTick();
    expect(button.style.getPropertyValue('--apollo-switch-track-height')).toBe('');
    expect(button.style.getPropertyValue('--apollo-switch-handle-bg')).toBe('');
    expect(button.style.getPropertyValue('--apollo-font-size')).toBe('');
    wrapper.unmount();
  });

  it('tracks current prefixes and keeps Provider, semantic and native root styles above theme values', async () => {
    const prefix = ref('brand-switch');
    const native = ref<string>();
    const semantic = ref<Record<string, string>>({ '--brand-switch-track-height': '45px' });
    const provider = ref<Record<string, string>>({ '--brand-switch-track-height': '40px' });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              theme: { components: { Switch: { trackHeight: 35 } } },
              components: { switch: { style: provider.value } },
            },
            () =>
              h(Switch, {
                prefixCls: prefix.value,
                styles: { root: semantic.value },
                style: native.value,
              }),
          ),
      }),
    );
    const button = wrapper.get<HTMLButtonElement>('button').element;
    expect(button.style.getPropertyValue('--brand-switch-track-height')).toBe('45px');
    native.value = '--brand-switch-track-height:49px';
    await nextTick();
    expect(button.style.getPropertyValue('--brand-switch-track-height')).toBe('49px');
    native.value = undefined;
    semantic.value = {};
    await nextTick();
    expect(button.style.getPropertyValue('--brand-switch-track-height')).toBe('40px');
    provider.value = {};
    await nextTick();
    expect(button.style.getPropertyValue('--brand-switch-track-height')).toBe('35px');
    prefix.value = 'next-switch';
    await nextTick();
    expect(wrapper.get('button').element).toBe(button);
    expect(button.style.getPropertyValue('--next-switch-track-height')).toBe('35px');
    expect(button.style.getPropertyValue('--brand-switch-track-height')).toBe('');
    wrapper.unmount();
  });

  it('narrows generic boolean values and serializes the current source during SSR', async () => {
    const wrapper = mount(ThemeProvider, {
      props: {
        theme: {
          components: {
            Switch: {
              trackHeight: true,
              trackHeightSM: Number.NaN,
              handleBg: false,
              handleShadow: 22,
            },
          },
        },
      },
      slots: { default: () => h(Switch) },
    });
    const style = wrapper.get<HTMLButtonElement>('button').element.style;
    expect(style.getPropertyValue('--apollo-switch-track-height')).toBe('22px');
    expect(style.getPropertyValue('--apollo-switch-track-height-sm')).toBe('16px');
    expect(style.getPropertyValue('--apollo-switch-handle-bg')).toBe('#fff');
    expect(style.getPropertyValue('--apollo-switch-handle-shadow')).toBe(
      '0 2px 4px 0 rgba(0,35,11,0.2)',
    );
    wrapper.unmount();
    const html = await renderToString(
      h(
        ThemeProvider,
        { theme: { components: { Switch: { trackHeight: 30, handleBg: '#123456' } } } },
        () => h(Switch, { prefixCls: 'server-switch' }),
      ),
    );
    expect(html).toContain('--server-switch-track-height:30px');
    expect(html).toContain('--server-switch-handle-bg:#123456');
  });
});

describe('Switch · 主题无关性', () => {
  const css = genSwitchStyle('apollo');
  const decls = genSwitchTokenDecls('apollo');

  it('Component Token 恰好 13 个，值是构建期算好的解析值', () => {
    expect(decls).toHaveLength(13);
    expect(css).toContain('--apollo-switch-track-height:22px;');
    expect(css).toContain('--apollo-switch-track-height-sm:16px;');
    expect(css).toContain('--apollo-switch-track-min-width:44px;');
    expect(css).toContain('--apollo-switch-track-min-width-sm:28px;');
    expect(css).toContain('--apollo-switch-track-padding:2px;');
    expect(css).toContain('--apollo-switch-handle-bg:#fff;');
    expect(css).toContain('--apollo-switch-handle-size:18px;');
    expect(css).toContain('--apollo-switch-handle-size-sm:12px;');
    // antd 的 `FastColor('#00230b').setA(0.2).toRgbString()` 逐字节相同
    expect(css).toContain('--apollo-switch-handle-shadow:0 2px 4px 0 rgba(0,35,11,0.2);');
    expect(css).toContain('--apollo-switch-inner-min-margin:9px;');
    expect(css).toContain('--apollo-switch-inner-max-margin:24px;');
    expect(css).toContain('--apollo-switch-inner-min-margin-sm:6px;');
    expect(css).toContain('--apollo-switch-inner-max-margin-sm:18px;');
  });

  it('两个字面量声明（E10 豁免区，唯一真源在 token.ts）', () => {
    expect(css).toContain('border-radius:100px;');
    expect(css).toContain('color:rgba(0, 0, 0, var(--apollo-opacity-loading));');
  });

  it('派生量的 calc 组合（handle 位移 / 内容区负 margin）', () => {
    expect(css).toContain(
      'inset-inline-start:calc(100% - calc(var(--apollo-switch-handle-size) + var(--apollo-switch-track-padding)));',
    );
    expect(css).toContain(
      'margin-inline-start:calc(-100% + calc(var(--apollo-switch-handle-size) + var(--apollo-switch-track-padding) * 2) - calc(var(--apollo-switch-inner-max-margin) * 2));',
    );
    expect(css).toContain('border-radius:calc(var(--apollo-switch-handle-size) / 2);');
    expect(css).toContain('content:"";');
  });

  it('按压反馈用 switchHandleActiveInset（-30%）', () => {
    expect(css).toContain('inset-inline-end:-30%;');
    expect(css).toContain('inset-inline-start:-30%;');
  });

  it('5 处 prefers-reduced-motion，且**没有** hover media query', () => {
    const matches = css.match(/@media \(prefers-reduced-motion: reduce\)\{/g) ?? [];
    expect(matches).toHaveLength(5);
    expect(css).not.toContain('@media (hover: hover)');
  });

  it('reduced-motion 的伪元素逐个展开（PITFALLS 141 的 a,b:hover 陷阱）', () => {
    // 两个选择器的列表要展开成「基 + ::before×2 + ::after×2」共 6 项
    expect(css).toContain(
      '.apollo-switch .apollo-switch-inner .apollo-switch-inner-checked,.apollo-switch .apollo-switch-inner .apollo-switch-inner-unchecked,.apollo-switch .apollo-switch-inner .apollo-switch-inner-checked::before,.apollo-switch .apollo-switch-inner .apollo-switch-inner-unchecked::before,.apollo-switch .apollo-switch-inner .apollo-switch-inner-checked::after,.apollo-switch .apollo-switch-inner .apollo-switch-inner-unchecked::after{',
    );
    // `handle::before` 走 raw 变体（不展开，否则会出现 ::before::before）
    expect(css).not.toContain('::before::before');
    expect(css).toContain('.apollo-switch .apollo-switch-handle::before{');
  });

  it('ant 前缀产物同构（Token 声明随前缀换名）', () => {
    const ant = genSwitchStyle('ant');
    expect(ant).toContain('.ant-switch{');
    expect(ant).toContain('--ant-switch-track-height:22px;');
    expect(ant).toContain('var(--ant-switch-track-height)');
  });
});
