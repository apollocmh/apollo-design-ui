/**
 * L7 主题矩阵 —— Radio 有 **16 个 Component Token**（antd 同，规则 R7 逐字段对齐）。
 * 这一层钉的是：主题无关性（themeTest）+ Token 声明形态 + 关键 token 的 var() 消费 +
 * 「unitless 两个按默认主题算成常量」这条边界。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import { RadioGroup } from '../index';
import { genRadioStyle, genTokenDecls as genRadioTokenDecls } from '../style';

themeTest('Radio', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Radio · 主题无关性', () => {
  const css = genRadioStyle('apollo');
  const decls = genRadioTokenDecls('apollo');

  it('Component Token 恰好 16 个（antd 的 ComponentToken 接口全字段）', () => {
    expect(decls).toHaveLength(16);
    expect(css).toContain('--apollo-radio-radio-size:16;');
    expect(css).toContain('--apollo-radio-dot-size:6;');
    expect(css).toContain('--apollo-radio-dot-color-disabled:var(--apollo-color-text-disabled);');
    expect(css).toContain('--apollo-radio-button-bg:var(--apollo-color-bg-container);');
    expect(css).toContain('--apollo-radio-button-color:var(--apollo-color-text);');
    expect(css).toContain(
      '--apollo-radio-button-checked-bg-disabled:var(--apollo-control-item-bg-active-disabled);',
    );
    expect(css).toContain(
      '--apollo-radio-button-padding-inline:calc(var(--apollo-padding) - var(--apollo-line-width));',
    );
    expect(css).toContain('--apollo-radio-wrapper-margin-inline-end:var(--apollo-margin-xs);');
    // internal 两个（wireframe=false 分支）
    expect(css).toContain('--apollo-radio-radio-color:var(--apollo-color-white);');
    expect(css).toContain('--apollo-radio-radio-bg-color:var(--apollo-color-primary);');
  });

  it('静态 fallback 的 unitless 变量消费侧乘 1px；当前主题由原生根投影', () => {
    // antd 的 unitless 集合 = { radioSize, dotSize }，产物是裸数字 16 / 6
    expect(css).toContain('width:calc(var(--apollo-radio-radio-size) * 1px);');
    expect(css).toContain('height:calc(var(--apollo-radio-radio-size) * 1px);');
    expect(css).toContain('width:calc(var(--apollo-radio-dot-size) * 1px);');
    expect(css).toContain('height:calc(var(--apollo-radio-dot-size) * 1px);');
  });

  it('圆点几何与动效（antd 产物逐字）', () => {
    expect(css).toContain('border-radius:50%;');
    expect(css).toContain('transform:translate(-50%, -50%) scale(0);');
    expect(css).toContain(
      'transition:all var(--apollo-motion-duration-slow) var(--apollo-motion-ease-in-out-circ);',
    );
    expect(css).toContain('background-color:var(--apollo-color-bg-container-disabled);');
    expect(css).toContain('background-color:var(--apollo-radio-dot-color-disabled);');
    expect(css).toContain('content:"\\a0";');
  });

  it('焦点环走 genFocusOutline（radioFocusShadow 未被消费，不落变量）', () => {
    expect(css).toContain(
      'outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);',
    );
    expect(css).toContain('outline-offset:1px;');
    expect(css).not.toContain('radio-focus-shadow');
  });

  it('button 段的 chrome 对齐 hack 逐字保留（+ 0.02px）', () => {
    expect(css).toContain('border-block-start-width:calc(var(--apollo-line-width) + 0.02px);');
    expect(css).toContain(
      'line-height:calc(var(--apollo-control-height) - var(--apollo-line-width) * 2);',
    );
    expect(css).toContain('margin-inline-end:calc(var(--apollo-line-width) * -1);');
  });

  it('vertical 与 badge 伴随选择器（Badge 已收口，逐条保留）', () => {
    expect(css).toContain('row-gap:var(--apollo-margin-xs);');
    expect(css).toContain(
      ':has(> .apollo-radio-button-wrapper, > .apollo-badge > .apollo-radio-button-wrapper)',
    );
    expect(css).toContain('.apollo-radio-group .apollo-badge .apollo-badge-count{');
  });

  it('上游的两处死选择器逐字保留（UPSTREAM，见 README §2）', () => {
    // `${antCls}-button-wrapper` 在 prefixCls=apollo 下拼成 `.apollo-button-wrapper`
    expect(css).toContain(
      '.apollo-radio-group >.apollo-badge:not(:first-child)>.apollo-button-wrapper{',
    );
    // button 形态下内层 span 实际叫 `.apollo-radio-button`，这条恒不命中
    expect(css).toContain('.apollo-radio-button-wrapper .apollo-radio,');
  });

  it('radio **没有** hover media query，也没有 prefers-reduced-motion 段（与 checkbox 的差异）', () => {
    expect(css).not.toContain('@media');
  });

  it('ant 前缀产物同构（Token 声明随前缀换名）', () => {
    const ant = genRadioStyle('ant');
    expect(ant).toContain('.ant-radio-group{');
    expect(ant).toContain('--ant-radio-radio-size:16;');
    expect(ant).toContain('calc(var(--ant-radio-radio-size) * 1px)');
  });
});

it('projects all sixteen current Radio tokens onto Group and button roots, then removes overrides', async () => {
  const custom = ref(true);
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            theme: custom.value
              ? {
                  components: {
                    Radio: {
                      radioSize: 22,
                      dotSize: 11,
                      dotColorDisabled: '#123456',
                      buttonSolidCheckedColor: '#223344',
                      buttonSolidCheckedBg: '#334455',
                      buttonSolidCheckedHoverBg: '#445566',
                      buttonSolidCheckedActiveBg: '#556677',
                      buttonBg: '#667788',
                      buttonCheckedBg: '#778899',
                      buttonColor: '#8899aa',
                      buttonCheckedBgDisabled: '#99aabb',
                      buttonCheckedColorDisabled: '#aabbcc',
                      buttonPaddingInline: 23,
                      wrapperMarginInlineEnd: 24,
                      radioColor: '#bbccdd',
                      radioBgColor: '#ccddee',
                    },
                  },
                }
              : {},
          },
          { default: () => h(RadioGroup, { options: ['a', 'b'], optionType: 'button' }) },
        ),
    }),
  );
  const expected = {
    'radio-size': '22',
    'dot-size': '11',
    'dot-color-disabled': '#123456',
    'button-solid-checked-color': '#223344',
    'button-solid-checked-bg': '#334455',
    'button-solid-checked-hover-bg': '#445566',
    'button-solid-checked-active-bg': '#556677',
    'button-bg': '#667788',
    'button-checked-bg': '#778899',
    'button-color': '#8899aa',
    'button-checked-bg-disabled': '#99aabb',
    'button-checked-color-disabled': '#aabbcc',
    'button-padding-inline': '23px',
    'wrapper-margin-inline-end': '24px',
    'radio-color': '#bbccdd',
    'radio-bg-color': '#ccddee',
  };
  const roots = wrapper.findAll<HTMLElement>('.apollo-radio-group, label');
  expect(roots).toHaveLength(3);
  for (const root of roots) {
    for (const [name, value] of Object.entries(expected)) {
      expect(root.element.style.getPropertyValue(`--apollo-radio-${name}`)).toBe(value);
    }
  }
  custom.value = false;
  await nextTick();
  for (const root of roots) {
    expect(root.element.style.getPropertyValue('--apollo-radio-radio-size')).toBe('16');
    expect(root.element.style.getPropertyValue('--apollo-radio-dot-size')).toBe('6');
    expect(root.element.style.getPropertyValue('--apollo-radio-button-padding-inline')).toBe(
      '15px',
    );
  }
  wrapper.unmount();
});
