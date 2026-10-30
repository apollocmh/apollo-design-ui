/** L7 主题 —— Select 组件变量（DECLS 字面量）+ prepareComponentToken 判据。 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genSelectStyle, genSelectTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Select', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
});

describe('Select · token 契约', () => {
  const css = genSelectStyle();
  const decls = genSelectTokenDecls();

  it('组件变量声明块（关键值对拍 antd .ant-select-css-var）', () => {
    expect(decls).toContain('--apollo-select-z-index-popup:1050;');
    expect(decls).toContain('--apollo-select-option-padding:5px 12px;');
    expect(decls).toContain('--apollo-select-option-height:32px;');
    expect(decls).toContain('--apollo-select-multiple-item-height:24px;');
    expect(decls).toContain('--apollo-select-show-arrow-padding-inline-end:18px;');
    expect(decls).toContain('--apollo-select-active-border-color:#1677ff;');
  });

  it('base 段（root / placeholder / clear / dropdown / item）', () => {
    expect(css).toContain('.apollo-select{');
    expect(css).toContain('.apollo-select .apollo-select-placeholder{');
    expect(css).toContain('.apollo-select .apollo-select-clear{');
    expect(css).toContain('.apollo-select-dropdown{');
    expect(css).toContain('.apollo-select-dropdown .apollo-select-item{');
  });

  it('多选段（-selection-item）', () => {
    expect(css).toContain('.apollo-select-multiple');
  });

  it('motion：slide-up（动效名是 rootPrefixCls 前缀 ⇒ 裸 .apollo-slide-up-*）', () => {
    expect(css).toContain('.apollo-slide-up-enter,.apollo-slide-up-appear{');
    expect(css).toContain('@keyframes apollo-slide-up-in{');
  });

  it('ant 残留三坑核查（#79/#80/#81）', () => {
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).not.toMatch(/[^a-z-]anticon[^-]/);
    expect(css).not.toContain('@supports');
  });
});

describe('Select · prepareComponentToken 判据', () => {
  it('默认主题关键值（对拍 antd prepareComponentToken）', () => {
    const t = prepareComponentToken({
      fontSize: 14,
      lineHeight: 1.5714285714285714,
      lineWidth: 1,
      lineWidthFocus: 4,
      controlHeight: 32,
      controlHeightSM: 24,
      controlHeightLG: 40,
      paddingXXS: 4,
      paddingSM: 12,
      controlPaddingHorizontal: 12,
      zIndexPopupBase: 1000,
      fontWeightStrong: 600,
    });
    expect(t.zIndexPopup).toBe(1050);
    // ⚠️ lineHeight 是 22/14 = 1.5714…，(32 - 14*1.5714…)/2 = 5 —— 不是 5.5
    expect(t.optionPadding).toBe('5px 12px');
    expect(t.optionHeight).toBe('32px');
    expect(t.multipleItemHeight).toBe('24px');
    expect(t.multipleItemHeightSM).toBe('16px');
    expect(t.multipleItemHeightLG).toBe('32px');
    expect(t.showArrowPaddingInlineEnd).toBe('18px');
    expect(t.selectAffixPadding).toBe('4px');
    expect(t.inputPaddingHorizontalBase).toBe('11px');
    expect(t.INTERNAL_FIXED_ITEM_MARGIN).toBe('2px');
  });

  it('lineWidthFocus === 0 时保持 0（antd 同款派生）', () => {
    const t = prepareComponentToken({
      fontSize: 14,
      lineHeight: 1.5714285714285714,
      lineWidth: 1,
      lineWidthFocus: 0,
      controlHeight: 32,
      controlHeightSM: 24,
      controlHeightLG: 40,
      paddingXXS: 4,
      paddingSM: 12,
      controlPaddingHorizontal: 12,
      zIndexPopupBase: 1000,
      fontWeightStrong: 600,
    });
    expect(t.lineWidthFocus).toBe('0px');
  });
});

import type { ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref, type VNodeChild } from 'vue';
import { ConfigProvider } from '../../config-provider';
import PurePanel from '../PurePanel';
import Select from '../Select';

it('uses current and nested Select tokens on the selector, teleported popup and PurePanel', async () => {
  const theme = ref<ThemeConfig | undefined>({
    token: { colorText: '#123456', controlHeight: 36 },
    components: { Select: { optionHeight: 40, optionSelectedBg: '#ffeedd', zIndexPopup: 1500 } },
  });
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { theme: theme.value }, () => [
          h(Select, {
            classNames: { popup: { root: 'current-popup' } },
            open: true,
            options: [{ value: 'a', label: 'Apple' }],
            'aria-label': 'Themed',
          }),
          h(ConfigProvider, { theme: { components: { Select: { optionHeight: 48 } } } }, () =>
            h(Select, { class: 'nested', 'aria-label': 'Nested' }),
          ),
          h(PurePanel, { options: [{ value: 'b', label: 'Banana' }], 'aria-label': 'Panel' }),
        ]),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  await nextTick();
  await nextTick();
  const root = wrapper.get<HTMLElement>('.apollo-select').element;
  expect(root.style.getPropertyValue('--apollo-select-option-height')).toBe('40px');
  expect(root.style.getPropertyValue('--apollo-color-text')).toBe('#123456');
  expect(
    wrapper
      .get<HTMLElement>('.nested')
      .element.style.getPropertyValue('--apollo-select-option-height'),
  ).toBe('48px');
  const popup = document.querySelector<HTMLElement>('.current-popup');
  expect(popup?.style.getPropertyValue('--apollo-select-option-height')).toBe('40px');
  expect(popup?.style.getPropertyValue('--apollo-select-z-index-popup')).toBe('1500');
  const panelPopup = wrapper.get<HTMLElement>(
    '.apollo-select-dropdown-wrapper .apollo-select-dropdown',
  ).element;
  expect(panelPopup.style.position).toBe('relative');
  expect(panelPopup.style.getPropertyValue('--apollo-select-option-height')).toBe('40px');
  theme.value = { components: { Select: { optionHeight: 52 } } };
  await nextTick();
  expect(root.style.getPropertyValue('--apollo-select-option-height')).toBe('52px');
  expect(popup?.style.getPropertyValue('--apollo-select-option-height')).toBe('52px');
  theme.value = undefined;
  await nextTick();
  expect(root.style.getPropertyValue('--apollo-select-option-height')).toBe('');
  expect(popup?.style.getPropertyValue('--apollo-select-option-height')).toBe('');
});

it('provides the current real popup layer to descendants and keeps nested increments and zero overrides', async () => {
  const theme = ref<ThemeConfig>({ components: { Select: { zIndexPopup: 1500 } } });
  const explicit = ref<number | undefined>();
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { theme: theme.value }, () =>
          h(
            Select,
            {
              options: [{ value: 'a', label: 'Apple' }],
              open: true,
              popupStyle: { zIndex: explicit.value },
              classNames: { popup: { root: 'parent-layer' } },
              'aria-label': 'Parent layer',
            },
            {
              popupRender: ({ menu }: { menu: VNodeChild }) =>
                h('div', [
                  menu,
                  h(Select, {
                    options: [{ value: 'b', label: 'Banana' }],
                    open: true,
                    classNames: { popup: { root: 'child-layer' } },
                    'aria-label': 'Child layer',
                  }),
                ]),
            },
          ),
        ),
    }),
    { attachTo: document.body, global: { stubs: { teleport: false } } },
  );
  await nextTick();
  await nextTick();
  const parentLayer = () => document.querySelector<HTMLElement>('.parent-layer')?.style.zIndex;
  const childLayer = () => document.querySelector<HTMLElement>('.child-layer')?.style.zIndex;
  expect(parentLayer()).toBe('1500');
  expect(childLayer()).toBe('1550');
  theme.value = { components: { Select: { zIndexPopup: 1600 } } };
  await nextTick();
  expect(parentLayer()).toBe('1600');
  expect(childLayer()).toBe('1650');
  explicit.value = 0;
  await nextTick();
  expect(parentLayer()).toBe('0');
  expect(childLayer()).toBe('50');
  wrapper.unmount();
});
