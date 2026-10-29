import {
  createThemeContext,
  getDesignToken,
  type ThemeConfig,
  type ThemeContext,
  ThemeContextKey,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, nextTick, provide, ref, shallowRef } from 'vue';
import { Divider } from '../index';

function withSource(source: ThemeContext) {
  return mount(
    defineComponent({
      setup() {
        provide(ThemeContextKey, source);
        return () => h(Divider, {}, () => 'Title');
      },
    }),
  );
}

describe('Divider current theme source and component tokens', () => {
  it('DIV-04/DIV-05 consumes all tokens, resets to explicit defaults, then clears inactive values', async () => {
    const config = shallowRef<ThemeConfig>({
      token: { fontSize: 22, marginXS: 31 },
      components: {
        Divider: { textPaddingInline: '31px', orientationMargin: 0.25, verticalMarginInline: 37 },
      },
    });
    const active = ref(true);
    const source: ThemeContext = {
      config,
      token: computed(() => getDesignToken(config.value)),
      sourceActive: computed(() => active.value),
    };
    const wrapper = withSource(source);
    const root = wrapper.get<HTMLDivElement>('.apollo-divider').element;
    expect(root.style.getPropertyValue('--apollo-divider-text-padding-inline')).toBe('31px');
    expect(root.style.getPropertyValue('--apollo-divider-orientation-margin')).toBe('0.25');
    expect(root.style.getPropertyValue('--apollo-divider-vertical-margin-inline')).toBe('37px');
    expect(root.style.getPropertyValue('--apollo-font-size')).toBe('22px');
    config.value = {};
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-divider-text-padding-inline')).toBe('1em');
    expect(root.style.getPropertyValue('--apollo-divider-orientation-margin')).toBe('0.05');
    expect(root.style.getPropertyValue('--apollo-divider-vertical-margin-inline')).toBe('8px');
    expect(root.style.getPropertyValue('--apollo-font-size')).toBe('14px');
    active.value = false;
    await nextTick();
    expect(root.style.length).toBe(0);
    expect(wrapper.get<HTMLDivElement>('.apollo-divider').element).toBe(root);
    active.value = true;
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-divider-orientation-margin')).toBe('0.05');
  });

  it('an inactive source with data does not read or project its token', () => {
    const config = shallowRef<ThemeConfig>({ token: { fontSize: 33 } });
    const derive = vi.fn(() => getDesignToken(config.value));
    const source: ThemeContext = {
      config,
      token: computed(derive),
      sourceActive: computed(() => false),
    };
    const wrapper = withSource(source);
    expect(wrapper.get<HTMLDivElement>('.apollo-divider').element.style.length).toBe(0);
    expect(derive).not.toHaveBeenCalled();
  });

  it('a manually provided empty context without source metadata is explicit', () => {
    const config = shallowRef<ThemeConfig>({});
    const wrapper = withSource({ config, token: computed(() => getDesignToken(config.value)) });
    expect(
      wrapper
        .get<HTMLDivElement>('.apollo-divider')
        .element.style.getPropertyValue('--apollo-font-size'),
    ).toBe('14px');
  });

  it('a bare default fallback leaves CSS inheritance and native variables intact', () => {
    const wrapper = mount(Divider, { attrs: { style: { '--apollo-font-size': '29px' } } });
    expect(
      wrapper
        .get<HTMLDivElement>('.apollo-divider')
        .element.style.getPropertyValue('--apollo-font-size'),
    ).toBe('29px');
    expect(
      wrapper
        .get<HTMLDivElement>('.apollo-divider')
        .element.style.getPropertyValue('--apollo-divider-orientation-margin'),
    ).toBe('');
  });

  it('source namespaces follow dynamic prefix and remain local to each instance', async () => {
    const source = createThemeContext({ components: { Divider: { textPaddingInline: 13 } } });
    const prefix = ref('first-divider');
    const wrapper = mount(
      defineComponent({
        setup() {
          provide(ThemeContextKey, source);
          return () => [
            h(Divider, { id: 'one', prefixCls: prefix.value }),
            h(Divider, { id: 'two' }),
          ];
        },
      }),
    );
    const one = wrapper.get<HTMLDivElement>('#one').element,
      two = wrapper.get<HTMLDivElement>('#two').element;
    expect(one.style.getPropertyValue('--first-divider-text-padding-inline')).toBe('13px');
    expect(two.style.getPropertyValue('--apollo-divider-text-padding-inline')).toBe('13px');
    prefix.value = 'second-divider';
    await nextTick();
    expect(wrapper.get<HTMLDivElement>('#one').element).toBe(one);
    expect(one.style.getPropertyValue('--first-divider-text-padding-inline')).toBe('');
    expect(one.style.getPropertyValue('--second-divider-text-padding-inline')).toBe('13px');
    expect(two.style.getPropertyValue('--second-divider-text-padding-inline')).toBe('');
  });

  it('native variables retain final priority over source and semantic root variables', () => {
    const source = createThemeContext({ components: { Divider: { textPaddingInline: 31 } } });
    const wrapper = mount(
      defineComponent({
        setup() {
          provide(ThemeContextKey, source);
          return () =>
            h(
              Divider,
              {
                styles: { root: { '--apollo-divider-text-padding-inline': '17px' } },
                style: [
                  '--apollo-divider-text-padding-inline:13px',
                  { '--apollo-font-size-lg': '41px' },
                ],
              },
              () => 'Title',
            );
        },
      }),
    );
    const style = wrapper.get<HTMLDivElement>('.apollo-divider').element.style;
    expect(style.getPropertyValue('--apollo-divider-text-padding-inline')).toBe('13px');
    expect(style.getPropertyValue('--apollo-font-size-lg')).toBe('41px');
  });

  it.each([-1, 1.1, Number.NaN, Number.POSITIVE_INFINITY, '0.25', ''])(
    'invalid ratio %s falls back without serializing invalid values',
    (value) => {
      const wrapper = withSource(
        createThemeContext({ components: { Divider: { orientationMargin: value } } }),
      );
      expect(
        wrapper
          .get<HTMLDivElement>('.apollo-divider')
          .element.style.getPropertyValue('--apollo-divider-orientation-margin'),
      ).toBe('0.05');
    },
  );

  it('zero/fractional tokens, signed margins and CSS expressions keep their units', () => {
    const wrapper = withSource(
      createThemeContext({
        components: {
          Divider: {
            textPaddingInline: 'calc(1em + 2px)',
            orientationMargin: 0,
            verticalMarginInline: -2.5,
          },
        },
      }),
    );
    const style = wrapper.get<HTMLDivElement>('.apollo-divider').element.style;
    expect(style.getPropertyValue('--apollo-divider-text-padding-inline')).toBe('calc(1em + 2px)');
    expect(style.getPropertyValue('--apollo-divider-orientation-margin')).toBe('0');
    expect(style.getPropertyValue('--apollo-divider-vertical-margin-inline')).toBe('-2.5px');
  });

  it('invalid dimensions use their own defaults and do not affect another source', () => {
    const first = withSource(
      createThemeContext({
        components: { Divider: { textPaddingInline: -1, verticalMarginInline: Number.NaN } },
      }),
    );
    const second = withSource(
      createThemeContext({
        components: { Divider: { textPaddingInline: 0.5, verticalMarginInline: 0 } },
      }),
    );
    const a = first.get<HTMLDivElement>('.apollo-divider').element.style,
      b = second.get<HTMLDivElement>('.apollo-divider').element.style;
    expect(a.getPropertyValue('--apollo-divider-text-padding-inline')).toBe('1em');
    expect(a.getPropertyValue('--apollo-divider-vertical-margin-inline')).toBe('8px');
    expect(b.getPropertyValue('--apollo-divider-text-padding-inline')).toBe('0.5px');
    expect(b.getPropertyValue('--apollo-divider-vertical-margin-inline')).toBe('0px');
  });
});
