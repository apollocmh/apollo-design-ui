import { type ComputedRef, computed, inject, toValue } from 'vue';
import { localeContextKey } from './context';
import enUS from './locales/en_US';
import type { Locale, LocaleComponentName } from './types';

/** 兜底数据（上游的 `defaultLocaleData`）。 */
const defaultLocaleData: Locale = enUS;

/**
 * Current component locale and language code. Read both computed refs inside
 * render/computed (or unwrap them in templates) to follow provider updates.
 * Component fragments merge shallowly; context values override defaults.
 */
export function useLocale<C extends LocaleComponentName>(
  componentName: C,
  defaultLocale?: Locale[C] | (() => Locale[C]),
): readonly [ComputedRef<NonNullable<Locale[C]>>, ComputedRef<string | undefined>] {
  const injected = inject(localeContextKey, undefined);

  const merged = computed<NonNullable<Locale[C]>>(() => {
    const fullLocale = injected === undefined ? undefined : toValue(injected);
    const locale = defaultLocale ?? defaultLocaleData[componentName];
    const localeFromContext = (fullLocale?.[componentName] ?? {}) as Locale[C];
    return {
      ...(typeof locale === 'function' ? (locale as () => Locale[C])() : locale),
      ...(localeFromContext || {}),
    } as NonNullable<Locale[C]>;
  });

  const localeCode = computed<string | undefined>(() => {
    const fullLocale = injected === undefined ? undefined : toValue(injected);
    const code = fullLocale?.locale;
    return fullLocale?.exist && !code ? defaultLocaleData.locale : code;
  });

  return [merged, localeCode] as const;
}

export { defaultLocaleData };
