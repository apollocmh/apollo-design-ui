/**
 * L7 主题矩阵 —— Popconfirm 有 **1 个 Component Token**（antd 同，规则 R7）。
 * 钉：主题无关性（themeTest）+ Token 声明形态 + 关键 token 的 var() 消费。
 */

import { themeTest } from '@apollo-design/test-utils';
import type { ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Popover from '../../popover/Popover';
import Popconfirm from '../Popconfirm';
import PurePanel from '../PurePanel';
import { genPopconfirmStyle, genTokenDecls as genPopconfirmTokenDecls } from '../style';

themeTest('Popconfirm', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Popconfirm · 主题无关性', () => {
  const css = genPopconfirmStyle('apollo');
  const decls = genPopconfirmTokenDecls('apollo');

  it('Component Token 恰好 1 个（zIndexPopup = zIndexPopupBase + 60）', () => {
    expect(decls).toHaveLength(1);
    expect(css).toContain(
      '--apollo-popconfirm-z-index-popup:calc(var(--apollo-z-index-popup-base) + 60);',
    );
    expect(css).toContain('z-index:var(--apollo-popconfirm-z-index-popup);');
  });

  it('resetStyle: false —— 上游没有 resetComponent 段（逐字保留）', () => {
    expect(css).not.toContain('box-sizing:border-box;');
  });

  it('message / icon / title / description / buttons 的规则', () => {
    expect(css).toContain('.apollo-popconfirm-message{');
    expect(css).toContain('.apollo-popconfirm-message>.apollo-popconfirm-message-icon{');
    expect(css).toContain('color:var(--apollo-color-warning);');
    expect(css).toContain('font-weight:var(--apollo-font-weight-strong);');
    expect(css).toContain('color:var(--apollo-color-text-heading);');
    // 只有 title 没有 description 时不加粗（上游 &:only-child）
    expect(css).toContain('.apollo-popconfirm-title:only-child{');
    expect(css).toContain('margin-top:var(--apollo-margin-xxs);');
    expect(css).toContain('.apollo-popconfirm-buttons button{');
  });

  it('浮层字号由 `.apollo-popconfirm.apollo-popover` 单独给（上游同构）', () => {
    expect(css).toContain('.apollo-popconfirm.apollo-popover{');
    expect(css).toContain('font-size:var(--apollo-font-size);');
  });

  it('consumes its own current token and aliases in popup, static panel and nested z-index context', async () => {
    const theme = ref<ThemeConfig | undefined>({
      token: { colorWarning: '#123456', marginXS: 18 },
      components: {
        Popconfirm: { zIndexPopup: 2060 },
        Popover: { zIndexPopup: 9030 },
        Tooltip: { zIndexPopup: 9999 },
      },
    });
    const wrapper = mount(
      () =>
        h(ConfigProvider, { theme: theme.value }, () => [
          h(
            Popconfirm,
            { open: true, title: 'Delete?', classNames: { root: 'current-confirm' } },
            {
              default: () => h('button', 'Target'),
              description: () =>
                h(
                  Popover,
                  { open: true, title: 'Nested', classNames: { root: 'nested-popover' } },
                  () => h('button', 'Nested target'),
                ),
            },
          ),
          h(PurePanel, { title: 'Panel', class: 'current-panel' }),
          h(ConfigProvider, { theme: { components: { Popconfirm: { zIndexPopup: 3060 } } } }, () =>
            h(PurePanel, { title: 'Nested panel', class: 'nested-panel' }),
          ),
        ]),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    const settle = async () => {
      await nextTick();
      await nextTick();
    };
    const value = (selector: string, property: string) =>
      document.querySelector<HTMLElement>(selector)?.style.getPropertyValue(property);
    try {
      await settle();
      expect(value('.current-confirm', '--apollo-popconfirm-z-index-popup')).toBe('2060');
      expect(value('.current-panel', '--apollo-popconfirm-z-index-popup')).toBe('2060');
      expect(value('.nested-panel', '--apollo-popconfirm-z-index-popup')).toBe('3060');
      expect(value('.current-confirm', '--apollo-margin-xs')).toBe('18px');
      expect(value('.current-panel', '--apollo-color-warning')).toBe('#123456');
      expect(value('.nested-popover', 'z-index')).toBe('2260');
      theme.value = {
        token: { colorWarning: '#654321', marginXS: 10 },
        components: { Popconfirm: { zIndexPopup: 0 } },
      };
      await settle();
      expect(value('.current-confirm', '--apollo-popconfirm-z-index-popup')).toBe('0');
      expect(value('.current-panel', '--apollo-popconfirm-z-index-popup')).toBe('0');
      expect(value('.current-panel', '--apollo-color-warning')).toBe('#654321');
      expect(value('.nested-popover', 'z-index')).toBe('200');
      theme.value = {
        token: { zIndexPopupBase: 3000 },
        components: { Popconfirm: { zIndexPopup: 'invalid' } },
      };
      await settle();
      expect(value('.current-confirm', '--apollo-popconfirm-z-index-popup')).toBe('3060');
      theme.value = undefined;
      await settle();
      expect(value('.current-confirm', '--apollo-popconfirm-z-index-popup')).toBe('');
      expect(value('.current-panel', '--apollo-popconfirm-z-index-popup')).toBe('');
      expect(value('.nested-popover', 'z-index')).toBe('1260');
      expect(value('.nested-panel', '--apollo-popconfirm-z-index-popup')).toBe('3060');
    } finally {
      wrapper.unmount();
    }
  });
});
