import {
  compactAlgorithm,
  darkAlgorithm,
  getDesignToken,
  type ThemeConfig,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ConfigProvider from '../../config-provider/ConfigProvider';
import { InputNumber } from '../index';
import { prepareComponentToken } from '../style/token';

describe('InputNumber current theme source', () => {
  it('derives idle and hover visibility from the current boolean handleVisible token', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { theme: { components: { InputNumber: { handleWidth: 30, handleVisible: true } } } },
      slots: { default: () => h(InputNumber) },
    });
    try {
      const root = wrapper.get<HTMLDivElement>('.apollo-input-number');
      expect(root.element.style.getPropertyValue('--apollo-input-number-handle-opacity')).toBe('1');
      expect(
        root.element.style.getPropertyValue('--apollo-input-number-handle-visible-width'),
      ).toBe('var(--apollo-input-number-handle-width)');
      await wrapper.setProps({
        theme: { components: { InputNumber: { handleWidth: 36, handleVisible: false } } },
      });
      expect(root.element.style.getPropertyValue('--apollo-input-number-handle-opacity')).toBe('0');
      expect(
        root.element.style.getPropertyValue('--apollo-input-number-handle-visible-width'),
      ).toBe('0px');
      expect(root.element.style.getPropertyValue('--apollo-input-number-handle-hover-width')).toBe(
        '0px',
      );
      expect(
        root.element.style.getPropertyValue('--apollo-input-number-handle-hover-opacity'),
      ).toBe('0');
    } finally {
      wrapper.unmount();
    }
  });

  it('consumes declared component tokens and refreshes/removes the current override', async () => {
    const wrapper = mount(ConfigProvider, {
      props: {
        theme: {
          components: {
            InputNumber: {
              controlWidth: 180,
              handleWidth: 30,
              handleFontSize: 11,
              inputAffixPadding: 8,
              filledHandleBg: '#123456',
            },
          },
        },
      },
      slots: { default: () => h(InputNumber, { prefix: '$', suffix: 'USD', variant: 'filled' }) },
    });
    try {
      const root = wrapper.get<HTMLDivElement>('.apollo-input-number');
      expect(root.element.style.getPropertyValue('--apollo-input-number-control-width')).toBe(
        '180px',
      );
      expect(root.element.style.getPropertyValue('--apollo-input-number-handle-width')).toBe(
        '30px',
      );
      expect(root.element.style.getPropertyValue('--apollo-input-number-handle-font-size')).toBe(
        '11px',
      );
      expect(root.element.style.getPropertyValue('--apollo-input-number-input-affix-padding')).toBe(
        '8px',
      );
      expect(root.element.style.getPropertyValue('--apollo-input-number-filled-handle-bg')).toBe(
        '#123456',
      );
      await wrapper.setProps({
        theme: { components: { InputNumber: { controlWidth: '14rem', handleWidth: 36 } } },
      });
      expect(root.element.style.getPropertyValue('--apollo-input-number-control-width')).toBe(
        '14rem',
      );
      expect(root.element.style.getPropertyValue('--apollo-input-number-handle-width')).toBe(
        '36px',
      );
      expect(root.element.style.getPropertyValue('--apollo-input-number-filled-handle-bg')).toBe(
        '#f0f0f0',
      );
      await wrapper.setProps({ theme: undefined });
      expect(root.element.style.getPropertyValue('--apollo-input-number-control-width')).toBe('');
      expect(root.element.style.getPropertyValue('--apollo-input-number-handle-width')).toBe('');
    } finally {
      wrapper.unmount();
    }
  });

  it('derives dimensions and filled colors from the current dark/compact source', async () => {
    const theme: ThemeConfig = {
      algorithm: [darkAlgorithm, compactAlgorithm],
      token: { controlHeight: 44, fontSize: 20 },
    };
    const prepared = prepareComponentToken(getDesignToken(theme));
    const wrapper = mount(ConfigProvider, {
      props: { theme },
      slots: { default: () => h(InputNumber) },
    });
    try {
      const root = wrapper.get<HTMLDivElement>('.apollo-input-number');
      expect(root.element.style.getPropertyValue('--apollo-input-number-padding-block')).toBe(
        prepared.paddingBlock,
      );
      expect(root.element.style.getPropertyValue('--apollo-input-number-handle-width')).toBe(
        prepared.handleWidth,
      );
      expect(root.element.style.getPropertyValue('--apollo-input-number-input-font-size')).toBe(
        prepared.inputFontSize,
      );
      expect(root.element.style.getPropertyValue('--apollo-input-number-filled-handle-bg')).toBe(
        prepared.filledHandleBg,
      );
      const light = prepareComponentToken(getDesignToken());
      expect(prepared.filledHandleBg).not.toBe(light.filledHandleBg);
      expect(prepared.inputFontSize).not.toBe(light.inputFontSize);
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps nested overrides scoped and gives native CSS variables precedence', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { theme: { components: { InputNumber: { controlWidth: 160, handleWidth: 30 } } } },
      slots: {
        default: () => [
          h(InputNumber, { id: 'outer-number' }),
          h(
            ConfigProvider,
            { theme: { components: { InputNumber: { controlWidth: 220 } } } },
            {
              default: () =>
                h(InputNumber, {
                  id: 'inner-number',
                  style: { '--apollo-input-number-handle-width': '40px' },
                }),
            },
          ),
        ],
      },
    });
    try {
      const roots = wrapper.findAll<HTMLDivElement>('.apollo-input-number');
      expect(roots[0]?.element.style.getPropertyValue('--apollo-input-number-control-width')).toBe(
        '160px',
      );
      expect(roots[1]?.element.style.getPropertyValue('--apollo-input-number-control-width')).toBe(
        '220px',
      );
      expect(roots[0]?.element.style.getPropertyValue('--apollo-input-number-handle-width')).toBe(
        '30px',
      );
      expect(roots[1]?.element.style.getPropertyValue('--apollo-input-number-handle-width')).toBe(
        '40px',
      );
    } finally {
      wrapper.unmount();
    }
  });

  it('projects the explicit source in SSR without requiring mounted CSS injection', async () => {
    const html = await renderToString(
      h(
        ConfigProvider,
        {
          theme: { components: { InputNumber: { controlWidth: 210, handleWidth: 28 } } },
        },
        { default: () => h(InputNumber) },
      ),
    );
    expect(html).toContain('--apollo-input-number-control-width:210px');
    expect(html).toContain('--apollo-input-number-handle-width:28px');
  });
});
