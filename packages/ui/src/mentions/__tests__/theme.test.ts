/** Mentions 当前 21 项变量、默认派生与主题行为。 */

import { themeTest } from '@apollo-design/test-utils';
import { token2CSSVar } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ConfigProvider from '../../config-provider';
import { MentionsUnstableProvider } from '../engine/context';
import Mentions from '../index';
import { genMentionsStyle, genTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Mentions', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Mentions · token 契约', () => {
  const css = genMentionsStyle('apollo');
  const decls = genTokenDecls('apollo').join('\n');

  it('renders current theme variables on the server without mounting a popup', async () => {
    const html = await renderToString(
      h(
        ConfigProvider,
        {
          theme: { components: { Mentions: { paddingInline: 17, dropdownHeight: 180 } } },
        },
        () => h(Mentions, { value: '@', options: [{ value: 'alpha', label: 'Alpha' }] }),
      ),
    );
    expect(html).toContain('--apollo-mentions-padding-inline:17px');
    expect(html).toContain('--apollo-mentions-dropdown-height:180px');
    expect(html).not.toContain('role="menu"');
  });

  it('consumes all 21 current component fields with native and semantic style precedence', async () => {
    const custom = {
      lineWidthFocus: 2,
      paddingBlock: 8,
      paddingBlockSM: 3,
      paddingBlockLG: 10,
      paddingInline: 18,
      paddingInlineSM: 12,
      paddingInlineLG: 22,
      activeBorderColor: '#123456',
      hoverBorderColor: '#654321',
      activeShadow: '0 0 0 3px red',
      errorActiveShadow: '0 0 0 4px pink',
      warningActiveShadow: '0 0 0 4px orange',
      hoverBg: '#eeeeee',
      activeBg: '#dddddd',
      inputFontSize: 18,
      inputFontSizeLG: 22,
      inputFontSizeSM: 16,
      dropdownHeight: 180,
      controlItemWidth: 210,
      zIndexPopup: 1500,
      itemPaddingVertical: 7,
    };
    const nativeStyle = shallowRef<string | undefined>();
    const semanticStyle = shallowRef<
      { root: { '--apollo-mentions-padding-inline': string } } | undefined
    >();
    const wrapper = mount(ConfigProvider, {
      props: { theme: { components: { Mentions: custom } } },
      slots: {
        default: () =>
          h(MentionsUnstableProvider, { value: { open: true } }, () =>
            h(Mentions, {
              value: '@',
              options: [{ value: 'alpha', label: 'Alpha' }],
              style: nativeStyle.value,
              styles: semanticStyle.value,
            }),
          ),
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    const root = wrapper.get<HTMLElement>('.apollo-mentions').element;
    const popup = document.querySelector<HTMLElement>('.apollo-mentions-dropdown');
    for (const [field, value] of Object.entries(custom)) {
      const expected =
        typeof value === 'number' && field !== 'zIndexPopup' ? `${value}px` : String(value);
      const key = token2CSSVar(field, 'apollo-mentions');
      expect(root.style.getPropertyValue(key), field).toBe(expected);
      expect(popup?.style.getPropertyValue(key), field).toBe(expected);
    }
    expect(decls).not.toContain('addon-bg');
    semanticStyle.value = { root: { '--apollo-mentions-padding-inline': '24px' } };
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-mentions-padding-inline')).toBe('24px');
    nativeStyle.value = '--apollo-mentions-padding-inline: 27px';
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-mentions-padding-inline')).toBe('27px');
    nativeStyle.value = undefined;
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-mentions-padding-inline')).toBe('24px');
    semanticStyle.value = undefined;
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-mentions-padding-inline')).toBe('18px');
    wrapper.unmount();
  });

  it('当前组件变量保留既有默认值', () => {
    expect(decls).toContain('--apollo-mentions-line-width-focus:1px');
    expect(decls).toContain('--apollo-mentions-padding-block:4px');
    expect(decls).toContain('--apollo-mentions-padding-block-sm:0px');
    expect(decls).toContain('--apollo-mentions-padding-block-lg:7px');
    expect(decls).toContain('--apollo-mentions-padding-inline:11px');
    expect(decls).toContain('--apollo-mentions-padding-inline-sm:7px');
    expect(decls).toContain('--apollo-mentions-padding-inline-lg:11px');
    expect(decls).toContain('--apollo-mentions-input-font-size:14px');
    expect(decls).toContain('--apollo-mentions-input-font-size-lg:16px');
    expect(decls).toContain('--apollo-mentions-input-font-size-sm:14px');
    expect(decls).toContain('--apollo-mentions-dropdown-height:250px');
    expect(decls).toContain('--apollo-mentions-control-item-width:100px');
    expect(decls).toContain('--apollo-mentions-z-index-popup:1050');
    expect(decls).toContain('--apollo-mentions-item-padding-vertical:5px');
    // 别名派生（随主题自适应）
    expect(decls).toContain('--apollo-mentions-active-border-color:var(--apollo-color-primary)');
    expect(decls).toContain('--apollo-mentions-hover-bg:var(--apollo-color-bg-container)');
  });

  it('声明块挂在 `.apollo-mentions`（affix 形态的根自带该类 ⇒ 一条覆盖两种根）', () => {
    expect(css).toContain('.apollo-mentions{\n  --apollo-mentions-line-width-focus:1px;');
  });

  it('规则段：根 / textarea / measure / suffix / dropdown', () => {
    expect(css).toContain(
      ':is(.apollo-mentions[data-apollo-mentions-host="editor"],.apollo-mentions >[data-apollo-mentions-host="editor"]) >[data-apollo-input-host="group"] >[data-apollo-input-host="wrapper"] >[data-apollo-input-host="affix"] >textarea{',
    );
    expect(css).toContain('.apollo-mentions .apollo-mentions-measure{');
    expect(css).toContain('.apollo-mentions .apollo-mentions-suffix{');
    expect(css).toContain(
      ':is(.apollo-mentions-has-suffix[data-apollo-mentions-host="editor"],.apollo-mentions-has-suffix >[data-apollo-mentions-host="editor"]) >[data-apollo-input-host="group"] >[data-apollo-input-host="wrapper"] >[data-apollo-input-host="affix"] >textarea{',
    );
    expect(css).toContain('.apollo-mentions-dropdown{');
    expect(css).toContain('.apollo-mentions-dropdown .apollo-mentions-dropdown-menu-item{');
    expect(css).toContain('.apollo-mentions-dropdown .apollo-mentions-dropdown-menu-item-active{');
  });

  it('ant 残留核查（cssinjs hash / `--ant-` / keyframes / 双重 var 包裹）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toContain('--ant-');
    expect(css).not.toContain('@keyframes');
    expect(css).not.toContain('var(--apollo-var(');
  });

  it('前缀守恒：`gen("ant")` 里 `.apollo-` 一个不剩，且计数相等', () => {
    const ant = genMentionsStyle('ant');
    expect(ant.includes('.apollo-')).toBe(false);
    expect(css.includes('.apollo-')).toBe(true);
    const count = (text: string, prefix: string): number =>
      (text.match(new RegExp(`\\.${prefix}-`, 'g')) ?? []).length;
    expect(count(ant, 'ant')).toBe(count(css, 'apollo'));
  });
});

describe('Mentions · prepareComponentToken 判据', () => {
  it('默认主题关键值（对拍 antd 的 22 条声明）', () => {
    const t = prepareComponentToken({
      controlHeight: 32,
      controlHeightSM: 24,
      controlHeightLG: 40,
      fontSize: 14,
      fontSizeLG: 16,
      lineHeight: 1.5714285714285714,
      lineHeightLG: 1.5,
      lineWidth: 1,
      lineWidthFocus: 3,
      paddingSM: 12,
      controlPaddingHorizontal: 12,
      controlPaddingHorizontalSM: 8,
      controlOutlineWidth: 2,
      fontHeight: 22,
      zIndexPopupBase: 1000,
    });
    expect(t.paddingBlock).toBe('4px');
    expect(t.paddingBlockSM).toBe('0px');
    expect(t.paddingBlockLG).toBe('7px');
    expect(t.paddingInline).toBe('11px');
    expect(t.paddingInlineSM).toBe('7px');
    expect(t.paddingInlineLG).toBe('11px');
    expect(t.dropdownHeight).toBe('250px');
    expect(t.controlItemWidth).toBe('100px');
    expect(t.zIndexPopup).toBe('1050');
    expect(t.itemPaddingVertical).toBe('5px');
  });
});
