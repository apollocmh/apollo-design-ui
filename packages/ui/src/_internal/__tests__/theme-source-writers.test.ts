import {
  getDesignToken,
  type ThemeConfig,
  type ThemeContext,
  ThemeContextKey,
  ThemeProvider,
  useTheme,
} from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import {
  type Component,
  type ComputedRef,
  computed,
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  provide,
  ref,
  shallowRef,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { useAvatarTheme } from '../../avatar/use-avatar-theme';
import { useBadgeTheme } from '../../badge/use-badge-theme';
import { useBreadcrumbTheme } from '../../breadcrumb/use-breadcrumb-theme';
import { useButtonTheme } from '../../button/use-button-theme';
import ConfigProvider from '../../config-provider/ConfigProvider';
import { useDescriptionsTheme } from '../../descriptions/use-descriptions-theme';
import { Flex } from '../../flex';
import { useImageTheme } from '../../image/hooks/useImageTheme';
import { useListTheme } from '../../list/use-list-theme';
import { useQRCodeTheme } from '../../qr-code/use-qrcode-theme';
import { Result } from '../../result';
import { useSkeletonTheme } from '../../skeleton/use-skeleton-theme';
import { Space, SpaceAddon, SpaceCompact } from '../../space';
import { useSpinTheme } from '../../spin/use-spin-theme';
import { useStatisticTheme } from '../../statistic/use-statistic-theme';
import { useTableTheme } from '../../table/use-table-theme';
import { useTagTheme } from '../../tag/hooks/use-theme';
import { useTimelineTheme } from '../../timeline/use-theme';
import { useTypographyTheme } from '../../typography/use-typography-theme';

const factories = [
  { name: 'Avatar', make: () => useAvatarTheme(() => 'apollo-avatar') },
  { name: 'Badge', make: () => useBadgeTheme(() => 'apollo-badge') },
  { name: 'Breadcrumb', make: () => useBreadcrumbTheme(() => 'apollo-breadcrumb') },
  { name: 'Button', make: () => useButtonTheme(() => 'apollo-btn') },
  { name: 'Descriptions', make: () => useDescriptionsTheme(() => 'apollo-descriptions') },
  { name: 'Image', make: () => useImageTheme().styles },
  {
    name: 'List',
    make: () =>
      useListTheme(
        () => 'apollo-list',
        () => false,
      ).styles,
  },
  { name: 'QRCode', make: () => useQRCodeTheme(() => 'apollo-qrcode').styles },
  { name: 'Skeleton', make: () => useSkeletonTheme(() => 'apollo-skeleton').styles },
  { name: 'Spin', make: () => useSpinTheme(() => 'apollo-spin').styles },
  { name: 'Statistic', make: () => useStatisticTheme(() => 'apollo-statistic').styles },
  { name: 'Table', make: () => useTableTheme(() => 'apollo-table') },
  { name: 'Tag', make: () => useTagTheme(() => 'apollo-tag') },
  { name: 'Timeline', make: () => useTimelineTheme(() => 'apollo-timeline') },
  { name: 'Typography', make: () => useTypographyTheme(() => 'apollo-typography') },
] satisfies { name: string; make: () => ComputedRef<Record<string, string>> }[];

function context(configuration: ThemeConfig, active?: { readonly value: boolean }) {
  const config = shallowRef<ThemeConfig>(configuration);
  let reads = 0;
  const source: ThemeContext = {
    config,
    token: computed(() => {
      reads++;
      return getDesignToken(config.value);
    }),
    ...(active ? { sourceActive: computed(() => active.value) } : {}),
  };
  return { source, config, reads: () => reads };
}
function probe(make: () => ComputedRef<Record<string, string>>, source?: ThemeContext) {
  let current: ComputedRef<Record<string, string>> | undefined;
  const Child = defineComponent({
    setup() {
      current = make();
      return () => h('div', { style: current?.value }, 'Actual source writer');
    },
  });
  const wrapper = mount(
    defineComponent({
      setup() {
        if (source) provide(ThemeContextKey, source);
        return () => h(Child);
      },
    }),
  );
  return {
    wrapper,
    style() {
      if (!current) throw new Error('Writer did not mount');
      return current.value;
    },
  };
}
const font = '--apollo-font-family';

describe('UI Alias writers respect actual source identity', () => {
  for (const factory of factories) {
    it(`${factory.name}: custom context without metadata remains explicit even when empty`, () => {
      const source = context({});
      const p = probe(factory.make, source.source);
      expect(p.style()[font]).toBe(getDesignToken().fontFamily);
      p.wrapper.unmount();
    });
    it(`${factory.name}: inactive metadata skips derivation even with config data`, () => {
      const active = ref(false),
        source = context({ token: { fontFamily: 'Inactive source' } }, active);
      const p = probe(factory.make, source.source);
      expect(p.style()).toEqual({});
      expect(source.reads()).toBe(0);
      p.wrapper.unmount();
    });
    it(`${factory.name}: empty reset and source disable/re-enable clear cached aliases`, async () => {
      const active = ref(true),
        source = context({ token: { fontFamily: 'Current source' } }, active);
      const p = probe(factory.make, source.source);
      expect(p.style()[font]).toBe('Current source');
      source.config.value = {};
      await nextTick();
      expect(p.style()[font]).toBe(getDesignToken().fontFamily);
      active.value = false;
      await nextTick();
      expect(p.style()).toEqual({});
      active.value = true;
      source.config.value = { token: { fontFamily: 'Reactivated source' } };
      await nextTick();
      expect(p.style()[font]).toBe('Reactivated source');
      p.wrapper.unmount();
    });
    it(`${factory.name}: simultaneous contexts stay isolated through source changes`, async () => {
      const activeA = ref(true),
        activeB = ref(true);
      const a = context({ token: { fontFamily: 'Source A' } }, activeA),
        b = context({ token: { fontFamily: 'Source B' } }, activeB);
      const first = probe(factory.make, a.source),
        second = probe(factory.make, b.source);
      expect(first.style()[font]).toBe('Source A');
      expect(second.style()[font]).toBe('Source B');
      activeA.value = false;
      b.config.value = {};
      await nextTick();
      expect(first.style()).toEqual({});
      expect(second.style()[font]).toBe(getDesignToken().fontFamily);
      activeA.value = true;
      await nextTick();
      expect(first.style()[font]).toBe('Source A');
      expect(second.style()[font]).toBe(getDesignToken().fontFamily);
      first.wrapper.unmount();
      second.wrapper.unmount();
    });
    it(`${factory.name}: ordinary active config is a positive control`, () => {
      const source = context({ token: { fontFamily: 'Positive control' } }, ref(true));
      const p = probe(factory.make, source.source);
      expect(p.style()[font]).toBe('Positive control');
      p.wrapper.unmount();
    });
    it(`${factory.name}: no-source fallback leaves static CSS in charge`, () => {
      const p = probe(factory.make);
      expect(p.style()).toEqual({});
      p.wrapper.unmount();
    });
  }
});

const inline = [
  { name: 'Result', component: Result, selector: '.apollo-result' },
  { name: 'Space', component: Space, selector: '.apollo-space' },
  { name: 'Addon', component: SpaceAddon, selector: '.apollo-space-addon' },
  { name: 'Compact', component: SpaceCompact, selector: '.apollo-space-compact' },
  { name: 'Flex', component: Flex, selector: '.apollo-flex' },
] satisfies { name: string; component: Component; selector: string }[];

function alias(element: Element) {
  if (!(element instanceof HTMLElement)) throw new Error('Expected actual HTML root');
  return element.style.getPropertyValue('--apollo-padding-xs');
}
for (const item of inline) {
  it(`${item.name}: actual root projects explicit empty ThemeProvider defaults`, () => {
    const w = mount(ThemeProvider, {
      props: { theme: {}, injectCssVar: false },
      slots: { default: () => h(item.component, {}, () => h('span', 'Complete')) },
    });
    expect(alias(w.get(item.selector).element)).toBe('8px');
    w.unmount();
  });
  it(`${item.name}: actual root skips inactive custom source aliases`, () => {
    const source = context({ token: { paddingXS: 29 } }, ref(false));
    const w = mount(
      defineComponent({
        setup() {
          provide(ThemeContextKey, source.source);
          return () => h(item.component, {}, () => h('span', 'Complete'));
        },
      }),
    );
    expect(alias(w.get(item.selector).element)).toBe('');
    w.unmount();
  });
}
it('Flex: no-theme ConfigProvider preserves CSS-only gap ownership', () => {
  const w = mount(ConfigProvider, {
    slots: { default: () => h(Flex, { gap: 'small' }, () => [h('span', 'A'), h('span', 'B')]) },
  });
  expect(alias(w.get('.apollo-flex').element)).toBe('');
  w.unmount();
});

for (const item of inline)
  for (const active of [true, false]) {
    it(`${item.name}: SSR honors sourceActive=${active} without a browser`, async () => {
      const source = context({}, ref(active));
      const app = createSSRApp(
        defineComponent({
          setup() {
            provide(ThemeContextKey, source.source);
            return () => h(item.component, {}, () => h('span', 'Server source'));
          },
        }),
      );
      const html = await renderToString(app);
      expect(html.includes('--apollo-padding-xs:8px')).toBe(active);
      expect(html).toContain('Server source');
    });
  }

// The implicit context is shared by siblings in one app, never by separate mounts/apps.
it('Flex same-app fallback activates and clears its three aliases while native styles still win', async () => {
  let fallback: ThemeContext | undefined;
  const controller = mount(
    defineComponent({
      setup() {
        fallback = useTheme();
        return () =>
          h('div', [
            h(Flex, { gap: 'small', 'data-fallback-first': '' }, () => h('span', 'Fallback')),
            h(
              Flex,
              { 'data-fallback-local': '', style: { '--apollo-padding-xs': '29px' } },
              () => 'Local',
            ),
          ]);
      },
    }),
  );
  if (!fallback) throw new Error('Fallback source was not created');
  const source = fallback,
    previous = source.config.value;
  const first = controller.get('[data-fallback-first]');
  const local = controller.get('[data-fallback-local]');
  try {
    source.config.value = { token: { paddingXS: 17, padding: 23, paddingLG: 31 } };
    await nextTick();
    expect(alias(first.element)).toBe('17px');
    expect(alias(local.element)).toBe('29px');
    source.config.value = {};
    await nextTick();
    expect(alias(first.element)).toBe('');
    expect(alias(local.element)).toBe('29px');
  } finally {
    source.config.value = previous;
    controller.unmount();
  }
});
