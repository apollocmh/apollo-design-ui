import type { ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { Trigger } from '../../_internal/trigger';
import ConfigProvider from '../../config-provider/ConfigProvider';
import PurePanel from '../PurePanel';
import Tooltip from '../Tooltip';

const wrappers: { unmount(): void }[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

async function settle() {
  await nextTick();
  await nextTick();
}

describe('Tooltip current theme', () => {
  it('applies replacement, nested and removed Tooltip tokens to live popup and panel roots', async () => {
    const theme = ref<ThemeConfig | undefined>({
      components: { Tooltip: { maxWidth: 180, zIndexPopup: 2070 } },
    });
    const wrapper = mount(
      () =>
        h(ConfigProvider, { theme: theme.value }, () => [
          h(Tooltip, { open: true, title: 'Hint', classNames: { root: 'theme-popup' } }, () =>
            h('button', 'Target'),
          ),
          h(PurePanel, { title: 'Panel', class: 'theme-panel' }),
          h(ConfigProvider, { theme: { components: { Tooltip: { maxWidth: 96 } } } }, () =>
            h(PurePanel, { title: 'Nested', class: 'nested-panel' }),
          ),
        ]),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    const popup = document.querySelector<HTMLElement>('.theme-popup');
    const panel = wrapper.get<HTMLElement>('.theme-panel').element;
    const nested = wrapper.get<HTMLElement>('.nested-panel').element;
    if (!popup) throw Error('Missing popup');
    expect(popup.style.getPropertyValue('--apollo-tooltip-max-width')).toBe('180px');
    expect(popup.style.getPropertyValue('--apollo-tooltip-z-index-popup')).toBe('2070');
    expect(panel.style.getPropertyValue('--apollo-tooltip-max-width')).toBe('180px');
    expect(nested.style.getPropertyValue('--apollo-tooltip-max-width')).toBe('96px');
    expect(nested.style.getPropertyValue('--apollo-tooltip-z-index-popup')).toBe('2070');
    theme.value = { components: { Tooltip: { maxWidth: 320, zIndexPopup: 3070 } } };
    await settle();
    expect(document.querySelector('.theme-popup')).toBe(popup);
    expect(popup.style.getPropertyValue('--apollo-tooltip-max-width')).toBe('320px');
    expect(panel.style.getPropertyValue('--apollo-tooltip-z-index-popup')).toBe('3070');
    theme.value = undefined;
    await settle();
    expect(popup.style.getPropertyValue('--apollo-tooltip-max-width')).toBe('');
    expect(panel.style.getPropertyValue('--apollo-tooltip-z-index-popup')).toBe('');
    expect(nested.style.getPropertyValue('--apollo-tooltip-max-width')).toBe('96px');
    expect(nested.style.getPropertyValue('--apollo-tooltip-z-index-popup')).toBe('1070');
  });

  it('derives current arrow geometry and placements from the same Alias token source', async () => {
    const theme = ref<ThemeConfig>({
      token: { borderRadius: 18, sizePopupArrow: 24, marginXXS: 10 },
    });
    const wrapper = mount(
      () =>
        h(ConfigProvider, { theme: theme.value }, () =>
          h(Tooltip, { open: true, title: 'Hint', arrow: { pointAtCenter: true } }, () =>
            h('button', 'Target'),
          ),
        ),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    const popup = document.querySelector<HTMLElement>('.apollo-tooltip');
    if (!popup) throw Error('Missing popup');
    expect(popup.style.getPropertyValue('--apollo-tooltip-arrow-offset-horizontal')).toBe('20px');
    expect(wrapper.getComponent(Trigger).props('builtinPlacements').top?.offset).toEqual([0, -22]);
    expect(wrapper.getComponent(Trigger).props('builtinPlacements').topLeft?.offset).toEqual([
      -32, -22,
    ]);
    const path = popup.style.getPropertyValue('--apollo-tooltip-arrow-path');
    theme.value = { token: { borderRadius: 6, sizePopupArrow: 16, marginXXS: 4 } };
    await settle();
    expect(popup.style.getPropertyValue('--apollo-tooltip-arrow-offset-horizontal')).toBe('12px');
    expect(popup.style.getPropertyValue('--apollo-tooltip-arrow-path')).not.toBe(path);
    expect(wrapper.getComponent(Trigger).props('builtinPlacements').top?.offset).toEqual([0, -12]);
  });

  it('keeps semantic and native CSS declarations above the current component theme', async () => {
    const wrapper = mount(
      () =>
        h(ConfigProvider, { theme: { components: { Tooltip: { maxWidth: 180 } } } }, () =>
          h(
            Tooltip,
            {
              open: true,
              title: 'Hint',
              styles: { root: { '--apollo-tooltip-max-width': '220px' } },
              style: '--apollo-tooltip-max-width: 280px',
            },
            () => h('button', 'Target'),
          ),
        ),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    wrappers.push(wrapper);
    await settle();
    const popup = document.querySelector<HTMLElement>('.apollo-tooltip');
    expect(popup?.style.getPropertyValue('--apollo-tooltip-max-width')).toBe('280px');
  });
});
