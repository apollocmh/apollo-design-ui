/**
 * L7 主题 —— Slider 的 Component Token（**18 个字段**）。
 *
 * 判定值逐字对拍 antd 6.6.4 产物（可复现命令：
 * `node tests/visual/debug/extract-slider-css.mjs --tokens`）。
 *
 * G11 起 demo 是真的，主题矩阵也接上了：`themeTest('Slider', { demos })` 会把 13 个 demo
 * 在 light / dark / compact / token-override 四种主题下各渲染一遍。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Slider from '../Slider.vue';
import { prepareComponentToken, sliderTokenValues } from '../style/token';

themeTest('Slider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Slider · Component Token 判定值（antd 产物逐字对拍）', () => {
  const t = sliderTokenValues();

  it('18 个字段恰好齐全（不多不少）', () => {
    expect(Object.keys(t).sort()).toEqual(
      [
        'controlSize',
        'dotActiveBorderColor',
        'dotBorderColor',
        'dotSize',
        'handleActiveColor',
        'handleActiveOutlineColor',
        'handleColor',
        'handleColorDisabled',
        'handleLineWidth',
        'handleLineWidthHover',
        'handleSize',
        'handleSizeHover',
        'railBg',
        'railHoverBg',
        'railSize',
        'trackBg',
        'trackBgDisabled',
        'trackHoverBg',
      ].sort(),
    );
  });

  it('尺寸族（构建期算式：controlHeightLG/4、controlHeightSM/2、lineWidth±）', () => {
    expect(t.controlSize).toBe(10); // controlHeightLG 40 / 4
    expect(t.handleSize).toBe(10); // = controlSize
    expect(t.handleSizeHover).toBe(12); // controlHeightSM 24 / 2
    expect(t.railSize).toBe(4);
    expect(t.dotSize).toBe(8);
    expect(t.handleLineWidth).toBe(2); // lineWidth 1 + 1
    expect(t.handleLineWidthHover).toBe(2.5); // lineWidth 1 + 1.5
  });

  it('颜色族（别名 token 直取）', () => {
    expect(t.railBg).toBe('rgba(0,0,0,0.04)'); // colorFillTertiary
    expect(t.railHoverBg).toBe('rgba(0,0,0,0.06)'); // colorFillSecondary
    expect(t.trackBg).toBe('#91caff'); // colorPrimaryBorder
    expect(t.trackHoverBg).toBe('#69b1ff'); // colorPrimaryBorderHover
    expect(t.handleColor).toBe('#91caff'); // colorPrimaryBorder
    expect(t.handleActiveColor).toBe('#1677ff'); // colorPrimary
    expect(t.dotBorderColor).toBe('#f0f0f0'); // colorBorderSecondary
    expect(t.dotActiveBorderColor).toBe('#91caff'); // colorPrimaryBorder
    expect(t.trackBgDisabled).toBe('rgba(0,0,0,0.04)'); // colorBgContainerDisabled
  });

  it('两处构建期算式：setA(0.2) 与 onBackground 合成', () => {
    // FastColor(colorPrimary).setA(0.2)
    expect(t.handleActiveOutlineColor).toBe('rgba(22,119,255,0.2)');
    // FastColor(colorTextDisabled).onBackground(colorBgContainer).toHexString()
    expect(t.handleColorDisabled).toBe('#bfbfbf');
  });

  it('prepareComponentToken 是纯函数（同 seed ⇒ 同结果）', () => {
    const seed = {
      controlHeightLG: 40,
      controlHeightSM: 24,
      lineWidth: 1,
      colorPrimary: '#1677ff',
      colorFillTertiary: 'rgba(0,0,0,0.04)',
      colorFillSecondary: 'rgba(0,0,0,0.06)',
      colorPrimaryBorder: '#91caff',
      colorPrimaryBorderHover: '#69b1ff',
      colorTextDisabled: 'rgba(0,0,0,0.25)',
      colorBgContainer: '#fff',
      colorBorderSecondary: '#f0f0f0',
      colorBgContainerDisabled: 'rgba(0,0,0,0.04)',
    };
    expect(prepareComponentToken(seed)).toEqual(t);
  });
});

it('consumes all eighteen current component token overrides and releases them', async () => {
  const enabled = ref(true);
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            theme: enabled.value
              ? {
                  components: {
                    Slider: {
                      controlSize: 16,
                      railSize: 6,
                      handleSize: 18,
                      handleSizeHover: 22,
                      dotSize: 9,
                      handleLineWidth: 3,
                      handleLineWidthHover: 4,
                      railBg: '#111111',
                      railHoverBg: '#222222',
                      trackBg: '#333333',
                      trackHoverBg: '#444444',
                      handleColor: '#555555',
                      handleActiveColor: '#666666',
                      handleActiveOutlineColor: '#777777',
                      handleColorDisabled: '#888888',
                      dotBorderColor: '#999999',
                      dotActiveBorderColor: '#aaaaaa',
                      trackBgDisabled: '#bbbbbb',
                    },
                  },
                }
              : {},
          },
          { default: () => h(Slider, { tooltip: { open: false } }) },
        ),
    }),
  );
  const root = wrapper.get<HTMLElement>('.apollo-slider');
  const values = {
    'control-size': '16px',
    'rail-size': '6px',
    'handle-size': '18px',
    'handle-size-hover': '22px',
    'dot-size': '9px',
    'handle-line-width': '3px',
    'handle-line-width-hover': '4px',
    'rail-bg': '#111111',
    'rail-hover-bg': '#222222',
    'track-bg': '#333333',
    'track-hover-bg': '#444444',
    'handle-color': '#555555',
    'handle-active-color': '#666666',
    'handle-active-outline-color': '#777777',
    'handle-color-disabled': '#888888',
    'dot-border-color': '#999999',
    'dot-active-border-color': '#aaaaaa',
    'track-bg-disabled': '#bbbbbb',
  };
  for (const [name, value] of Object.entries(values))
    expect(root.element.style.getPropertyValue(`--apollo-slider-${name}`)).toBe(value);
  enabled.value = false;
  await nextTick();
  expect(root.element.style.getPropertyValue('--apollo-slider-control-size')).toBe('10px');
  expect(root.element.style.getPropertyValue('--apollo-slider-handle-size')).toBe('10px');
  expect(root.element.style.getPropertyValue('--apollo-slider-track-bg')).toBe('#91caff');
  wrapper.unmount();
});
