import { createThemeContext, getDesignToken, ThemeProvider, useTheme } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import ConfigProvider from '../ConfigProvider';
import { useThemeConfig } from '../context';

const wrappers: Array<{ unmount(): void }> = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
});
const Probe = defineComponent({
  props: { name: { type: String, required: true } },
  setup(props) {
    const theme = useTheme();
    return () =>
      h('span', {
        'data-source-probe': props.name,
        'data-active': String(theme.sourceActive?.value),
        'data-font': String(theme.token.value.fontSize),
        'data-height': String(theme.token.value.controlHeight),
      });
  },
});
const ConfigProbe = defineComponent({
  setup() {
    const theme = useThemeConfig();
    return () => h('span', { 'data-config-font': String(getDesignToken(theme.value).fontSize) });
  },
});
function render(render: () => ReturnType<typeof h>) {
  const wrapper = mount(defineComponent({ render }), {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  return wrapper;
}

describe('Theme source identity and nearest Vue provider', () => {
  it.each([undefined, 18])(
    'reads the nearest ThemeProvider config for data consumers (%s)',
    async (fontSize) => {
      const wrapper = render(() =>
        h(ConfigProvider, { theme: { token: { fontSize: 12 } } }, () =>
          h(ThemeProvider, { theme: fontSize === undefined ? {} : { token: { fontSize } } }, () =>
            h(ConfigProbe),
          ),
        ),
      );
      await nextTick();
      expect(wrapper.get('[data-config-font]').attributes('data-config-font')).toBe(
        String(fontSize ?? 14),
      );
    },
  );
  it('marks an explicit empty factory context as an active source', () => {
    const theme = createThemeContext({});
    expect(theme.sourceActive?.value).toBe(true);
    expect(theme.token.value.fontSize).toBe(14);
  });

  it('keeps a missing theme source inactive', () => {
    const wrapper = render(() => h(Probe, { name: 'none' }));
    expect(wrapper.get('[data-source-probe="none"]').attributes('data-active')).toBe('false');
  });

  it('keeps locale-only ConfigProvider chains inactive', () => {
    const wrapper = render(() =>
      h(ConfigProvider, { componentSize: 'small' }, () =>
        h(ConfigProvider, {}, () => h(Probe, { name: 'locale-only' })),
      ),
    );
    expect(wrapper.get('[data-source-probe="locale-only"]').attributes('data-active')).toBe(
      'false',
    );
  });

  it('keeps an explicit empty ThemeProvider active', () => {
    const wrapper = render(() =>
      h(ThemeProvider, { theme: {} }, () => h(Probe, { name: 'empty' })),
    );
    const probe = wrapper.get('[data-source-probe="empty"]');
    expect(probe.attributes('data-active')).toBe('true');
    expect(probe.attributes('data-font')).toBe('14');
  });

  it('preserves ConfigProvider empty-theme inheritance', async () => {
    const wrapper = render(() =>
      h(ConfigProvider, { theme: { token: { fontSize: 12 } } }, () =>
        h(ConfigProvider, { theme: {} }, () => h(Probe, { name: 'inherits' })),
      ),
    );
    await nextTick();
    const probe = wrapper.get('[data-source-probe="inherits"]');
    expect(probe.attributes('data-active')).toBe('true');
    expect(probe.attributes('data-font')).toBe('12');
  });

  it('honors the nearest empty ThemeProvider through an unconfigured ConfigProvider', async () => {
    const wrapper = render(() =>
      h(ConfigProvider, { theme: { token: { fontSize: 12 } } }, () =>
        h(ThemeProvider, { theme: {} }, () =>
          h(ConfigProvider, {}, () => h(Probe, { name: 'nearest' })),
        ),
      ),
    );
    await nextTick();
    const probe = wrapper.get('[data-source-probe="nearest"]');
    expect(probe.attributes('data-font')).toBe('14');
    expect(probe.attributes('data-height')).toBe('32');
    expect(probe.attributes('data-active')).toBe('true');
  });

  it('uses a nearer ThemeProvider rather than the more distant ConfigContext theme', async () => {
    const wrapper = render(() =>
      h(ConfigProvider, { theme: { token: { fontSize: 12 } } }, () =>
        h(ThemeProvider, { theme: { token: { fontSize: 18 } } }, () =>
          h(ConfigProvider, {}, () => h(Probe, { name: 'nearer' })),
        ),
      ),
    );
    await nextTick();
    expect(wrapper.get('[data-source-probe="nearer"]').attributes('data-font')).toBe('18');
  });

  it('clears a local source when its theme prop is removed', async () => {
    const wrapper = mount(ConfigProvider, {
      props: { theme: { token: { fontSize: 18 } } },
      slots: { default: () => h(Probe, { name: 'removed' }) },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    wrappers.push(wrapper);
    await nextTick();
    expect(wrapper.get('[data-source-probe="removed"]').attributes('data-active')).toBe('true');
    await wrapper.setProps({ theme: undefined });
    expect(wrapper.get('[data-source-probe="removed"]').attributes('data-active')).toBe('false');
  });
});
