import { getPlacements } from '@apollo-design/position';
import { getDesignToken, type ThemeConfig, transformToken } from '@apollo-design/theme';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Trigger } from '../trigger';

const placements = getPlacements({
  arrowPointAtCenter: false,
  autoAdjustOverflow: true,
  arrowWidth: 4,
  borderRadius: 6,
  offset: 4,
  visibleFirst: true,
});
const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount();
  document.body.innerHTML = '';
});
const trigger = (className = 'theme-popup', popupStyle?: Record<string, string | number>) =>
  h(
    Trigger,
    {
      prefixCls: className,
      open: true,
      builtinPlacements: placements,
      placement: 'bottomLeft',
      popupStyle,
      motion: { supportMotion: false },
      popup: () => h('input', { 'aria-label': 'Popup business draft' }),
    },
    { default: () => h('button', { type: 'button' }, 'Open') },
  );
const mountHost = (render: () => ReturnType<typeof h>) => {
  const w = mount(defineComponent({ setup: () => render }), {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(w);
  return w;
};
const popup = (selector = '.theme-popup') => {
  const n = document.querySelector<HTMLDivElement>(selector);
  if (!n) throw new Error(`Missing real popup ${selector}`);
  return n;
};

describe('Trigger current CSS theme across native Portal', () => {
  it('forwards the actual source alias variables on the first portaled render', async () => {
    const token = { controlHeightLG: 52, colorTextSecondary: '#435266' };
    mountHost(() => h(ConfigProvider, { theme: { token } }, () => trigger()));
    await nextTick();
    expect(popup().style.getPropertyValue('--apollo-control-height-lg')).toBe('52px');
    expect(popup().style.getPropertyValue('--apollo-color-text-secondary')).toBe('#435266');
    expect(popup().closest('[style*="display: contents"]')).toBeNull();
  });

  it('replaces and removes current theme variables while keeping native input state and focus', async () => {
    const theme = shallowRef<ThemeConfig | undefined>();
    mountHost(() => h(ConfigProvider, { theme: theme.value }, () => trigger()));
    await nextTick();
    const original = popup();
    const input = original.querySelector('input');
    if (!input) throw new Error('Missing editor');
    input.value = 'Saved business draft';
    input.focus();
    for (const height of [52, 63]) {
      theme.value = { token: { controlHeightLG: height } };
      await nextTick();
      expect(popup()).toBe(original);
      expect(original.style.getPropertyValue('--apollo-control-height-lg')).toBe(`${height}px`);
      expect(input.value).toBe('Saved business draft');
      expect(document.activeElement).toBe(input);
    }
    theme.value = undefined;
    await nextTick();
    expect(popup()).toBe(original);
    expect(original.style.getPropertyValue('--apollo-control-height-lg')).toBe('');
    expect(input.value).toBe('Saved business draft');
    expect(document.activeElement).toBe(input);
  });

  it('gives explicit popup style priority and restores the current theme after its removal', async () => {
    const custom = ref(true);
    mountHost(() =>
      h(ConfigProvider, { theme: { token: { controlHeightLG: 52 } } }, () =>
        trigger('theme-popup', custom.value ? { '--apollo-control-height-lg': '73px' } : undefined),
      ),
    );
    await nextTick();
    expect(popup().style.getPropertyValue('--apollo-control-height-lg')).toBe('73px');
    custom.value = false;
    await nextTick();
    expect(popup().style.getPropertyValue('--apollo-control-height-lg')).toBe('52px');
  });

  it('keeps the nearest source theme isolated between two live popup instances', async () => {
    const height = ref(52);
    mountHost(() =>
      h(ConfigProvider, { theme: { token: { controlHeightLG: height.value } } }, () =>
        h('main', [
          trigger('outer-popup'),
          h(ConfigProvider, { theme: { token: { controlHeightLG: 73 } } }, () =>
            trigger('inner-popup'),
          ),
        ]),
      ),
    );
    await nextTick();
    const outer = popup('.outer-popup'),
      inner = popup('.inner-popup');
    expect(outer.style.getPropertyValue('--apollo-control-height-lg')).toBe('52px');
    expect(inner.style.getPropertyValue('--apollo-control-height-lg')).toBe('73px');
    height.value = 63;
    await nextTick();
    expect(popup('.outer-popup')).toBe(outer);
    expect(popup('.inner-popup')).toBe(inner);
    expect(outer.style.getPropertyValue('--apollo-control-height-lg')).toBe('63px');
    expect(inner.style.getPropertyValue('--apollo-control-height-lg')).toBe('73px');
    const expected = transformToken(getDesignToken({ token: { controlHeightLG: 73 } })).vars;
    expect(inner.style.getPropertyValue('--apollo-font-size')).toBe(expected['--apollo-font-size']);
  });
});
