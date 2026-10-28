import { ThemeContextKey, token2CSSVar, transformToken, useTheme } from '@apollo-design/theme';
import { type ComputedRef, computed, type InjectionKey, inject, provide } from 'vue';
import type { ComponentToken } from './style/token';

const fields = [
  'colorBgBody',
  'colorBgHeader',
  'colorBgTrigger',
  'bodyBg',
  'headerBg',
  'headerHeight',
  'headerPadding',
  'headerColor',
  'footerPadding',
  'footerBg',
  'siderBg',
  'triggerHeight',
  'triggerBg',
  'triggerColor',
  'zeroTriggerWidth',
  'zeroTriggerHeight',
  'lightSiderBg',
  'lightTriggerBg',
  'lightTriggerColor',
] as const satisfies readonly (keyof ComponentToken)[];
const lengths = new Set<string>([
  'headerHeight',
  'headerPadding',
  'footerPadding',
  'triggerHeight',
  'zeroTriggerWidth',
  'zeroTriggerHeight',
]);
const sources = new WeakMap<ReturnType<typeof useTheme>, ComputedRef<Record<string, string>>>();
interface LayoutThemeScope {
  theme: ReturnType<typeof useTheme>;
  prefix: () => string;
}
const layoutThemeScopeKey: InjectionKey<LayoutThemeScope> = Symbol('apollo-layout-theme');

/** Current data only; static property fallbacks retain stylesheet/native overrides. */
export function useLayoutTheme(getPrefix: () => string) {
  const theme = useTheme();
  const provided = inject(ThemeContextKey, undefined) !== undefined;
  const parent = inject(layoutThemeScopeKey, undefined);
  provide(layoutThemeScopeKey, { theme, prefix: getPrefix });
  let source = sources.get(theme);
  if (!source) {
    source = computed(() => {
      if (theme.sourceActive?.value === false) return {};
      const data: Record<string, string> = { ...transformToken(theme.token.value).vars };
      const custom = theme.config.value.components?.Layout;
      for (const field of fields) {
        const value = custom?.[field];
        // Clear inherited theme data at this scope; public/native variables stay independent.
        data[field] = 'initial';
        if (typeof value === 'string' && value.trim()) data[field] = value;
        else if (
          lengths.has(field) &&
          typeof value === 'number' &&
          Number.isFinite(value) &&
          value >= 0
        )
          data[field] = `${value}px`;
      }
      return data;
    });
    sources.set(theme, source);
  }
  const current = source;
  return computed(() => {
    if (!provided) return {};
    return Object.fromEntries(
      Object.entries(current.value)
        .filter(([key]) => {
          if (parent?.theme !== theme) return true;
          // Family members inherit the current scope instead of shadowing native overrides.
          return !key.startsWith('--') && parent.prefix() !== getPrefix();
        })
        .map(([key, value]) => [
          key.startsWith('--') ? key : token2CSSVar(key, getPrefix() + '-source'),
          value,
        ]),
    );
  });
}
