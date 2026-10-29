import { themeTest } from '@apollo-design/test-utils';
import {
  createThemeContext,
  getDesignToken,
  type ThemeConfig,
  ThemeContextKey,
  ThemeProvider,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, nextTick, provide, ref, shallowRef } from 'vue';
import { Collapse } from '../index';
import { genCollapseStyle, genTokenDecls, prepareComponentToken } from '../style';
import { tokenEntries } from '../style/token';

const items = [{ key: 'a', label: 'Alpha', children: 'Body' }];
describe('Collapse current theme and static styles', () => {
  it('declares every public token and derives padding/radius from live Alias variables', () => {
    const decls = genTokenDecls('apollo').join('\n');
    expect(decls.split('\n')).toHaveLength(11);
    for (const [, suffix] of tokenEntries) expect(decls).toContain(`--apollo-collapse-${suffix}:`);
    expect(decls).toContain(
      '--apollo-collapse-header-padding:var(--apollo-padding-sm) var(--apollo-padding);',
    );
    expect(decls).toContain('--apollo-collapse-content-padding:var(--apollo-padding) 16px;');
    expect(decls).toContain(
      '--apollo-collapse-panel-border-radius:var(--apollo-border-radius-lg);',
    );
    const defaults = prepareComponentToken(getDesignToken());
    expect(defaults).toMatchObject({
      headerPadding: '12px 16px',
      contentPadding: '16px 16px',
      collapsePanelBorderRadius: '8px',
      borderlessContentBg: 'transparent',
    });
  });
  it('uses self-contained Panel selectors, native focus, all variants and valid motion CSS', () => {
    const css = genCollapseStyle('custom');
    for (const name of [
      'item',
      'header',
      'heading',
      'trigger',
      'title',
      'expand-icon',
      'arrow',
      'panel',
      'body',
      'item-small',
      'item-large',
      'item-header',
      'item-icon',
      'item-disabled',
      'item-end',
      'item-rtl',
      'item-borderless',
      'item-ghost',
    ])
      expect(css).toContain(`.custom-collapse-${name}`);
    expect(css).toContain('.custom-collapse-trigger:focus-visible');
    expect(css).toContain('font:inherit');
    expect(css).toContain('background-color:var(--custom-collapse-borderless-content-bg)');
    expect(css).toContain('.custom-collapse-motion{overflow:hidden;transition:height');
    expect(css).toContain('@media (prefers-reduced-motion:reduce)');
    expect(css).not.toContain('!important,');
  });
  it('consumes all ten current component tokens and removes stale values after replacement', async () => {
    const custom = {
      headerPadding: '21px 22px',
      headerPaddingSM: '11px 12px',
      headerPaddingLG: '31px 32px',
      headerBg: 'rgb(1, 2, 3)',
      contentPadding: '25px 26px',
      contentPaddingSM: '15px',
      contentPaddingLG: '35px',
      contentBg: 'rgb(4, 5, 6)',
      borderlessContentPadding: '5px 6px 7px',
      borderlessContentBg: 'rgb(7, 8, 9)',
    };
    const config = shallowRef<ThemeConfig>({
      token: { padding: 19, paddingSM: 13, borderRadiusLG: 17 },
      components: { Collapse: custom },
    });
    const active = ref(true);
    const w = mount(
      defineComponent({
        setup() {
          provide(ThemeContextKey, {
            config,
            token: computed(() => getDesignToken(config.value)),
            sourceActive: computed(() => active.value),
          });
          return () => h(Collapse, { items, defaultActiveKey: 'a' });
        },
      }),
    );
    const root = w.get<HTMLDivElement>('.apollo-collapse').element;
    for (const [name, suffix] of tokenEntries)
      expect(root.style.getPropertyValue(`--apollo-collapse-${suffix}`)).toBe(
        name === 'collapsePanelBorderRadius' ? '17px' : custom[name],
      );
    config.value = { token: { padding: 23, paddingSM: 15, borderRadiusLG: 9 } };
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-collapse-header-padding')).toBe('15px 23px');
    expect(root.style.getPropertyValue('--apollo-collapse-borderless-content-bg')).toBe(
      'transparent',
    );
    config.value = {};
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-collapse-header-padding')).toBe('12px 16px');
    active.value = false;
    await nextTick();
    expect(root.style.length).toBe(0);
    expect(w.get('.apollo-collapse').element).toBe(root);
    active.value = true;
    await nextTick();
    expect(root.style.getPropertyValue('--apollo-collapse-panel-border-radius')).toBe('8px');
  });
  it('empty explicit ThemeProvider resets inherited source while bare fallback preserves CSS-only variables', () => {
    const w = mount(ThemeProvider, {
      props: { theme: { components: { Collapse: { headerPadding: '33px' } } } },
      slots: {
        default: () => [
          h(Collapse, { id: 'outer', items }),
          h(ThemeProvider, {}, () => h(Collapse, { id: 'reset', items })),
        ],
      },
    });
    expect(
      w
        .get<HTMLElement>('#outer')
        .element.style.getPropertyValue('--apollo-collapse-header-padding'),
    ).toBe('33px');
    expect(
      w
        .get<HTMLElement>('#reset')
        .element.style.getPropertyValue('--apollo-collapse-header-padding'),
    ).toBe('12px 16px');
    const bare = mount(Collapse, {
      props: { items },
      attrs: {
        style: { '--apollo-collapse-header-padding': '29px', '--apollo-font-size': '27px' },
      },
    });
    expect(
      bare
        .get<HTMLElement>('.apollo-collapse')
        .element.style.getPropertyValue('--apollo-collapse-header-padding'),
    ).toBe('29px');
    expect(bare.get<HTMLElement>('.apollo-collapse').element.style.length).toBe(2);
  });
  it('native root style wins theme/semantic styles and custom sources without metadata are explicit', () => {
    const source = createThemeContext({ components: { Collapse: { headerPadding: '31px' } } });
    const w = mount(
      defineComponent({
        setup() {
          provide(ThemeContextKey, { config: source.config, token: source.token });
          return () =>
            h(Collapse, {
              items,
              styles: { root: { '--apollo-collapse-header-padding': '17px' } },
              style: { '--apollo-collapse-header-padding': '41px' },
            });
        },
      }),
    );
    expect(
      w
        .get<HTMLElement>('.apollo-collapse')
        .element.style.getPropertyValue('--apollo-collapse-header-padding'),
    ).toBe('41px');
    expect(
      w.get<HTMLElement>('.apollo-collapse').element.style.getPropertyValue('--apollo-font-size'),
    ).toBe('14px');
  });
  it('uses the current prefix and isolates nested Collapse source scopes', async () => {
    const config = shallowRef<ThemeConfig>({ components: { Collapse: { headerPadding: '31px' } } }),
      prefix = ref('first-collapse');
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(ThemeProvider, { theme: config.value }, () =>
            h(Collapse, { prefixCls: prefix.value, defaultActiveKey: 'a' }, () =>
              h(Collapse.Panel, { key: 'a', header: 'Outer' }, () =>
                h(
                  ThemeProvider,
                  { theme: { components: { Collapse: { headerPadding: '9px' } } } },
                  () => h(Collapse, { items, id: 'inner' }),
                ),
              ),
            ),
          ),
      }),
    );
    const root = w.get<HTMLElement>('.first-collapse').element;
    prefix.value = 'second-collapse';
    await nextTick();
    expect(root.style.getPropertyValue('--first-collapse-header-padding')).toBe('');
    expect(root.style.getPropertyValue('--second-collapse-header-padding')).toBe('31px');
    expect(
      w
        .get<HTMLElement>('#inner')
        .element.style.getPropertyValue('--apollo-collapse-header-padding'),
    ).toBe('9px');
    config.value = {};
    await nextTick();
    expect(root.style.getPropertyValue('--second-collapse-header-padding')).toBe('12px 16px');
  });
});
themeTest('Collapse', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});
