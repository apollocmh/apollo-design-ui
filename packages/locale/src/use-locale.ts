/**
 * 取某个组件的 locale。
 *
 * 契约来源：antd 6.6.4 的 `es/locale/useLocale.js`（**机械移植**）。
 *
 * ⚠️ 名字里的 `get` 是**误导性的** —— 返回的两个值都已经求好了，不是函数。
 */

import { inject, toValue } from 'vue';
import { localeContextKey } from './context';
import enUS from './locales/en_US';
import type { Locale, LocaleComponentName } from './types';

/** 兜底数据（上游的 `defaultLocaleData`）。 */
const defaultLocaleData: Locale = enUS;

/**
 * 取 `componentName` 对应的 locale 与语言码。
 *
 * ```ts
 * const [locale, localeCode] = useLocale('Modal');
 * ```
 *
 * 四条与上游逐字对齐的判据：
 *
 *   1. **`defaultLocale` 可以是函数**（惰性求值，避免每个组件都构造一份对象）。
 *   2. **合并是浅合并，且 context 侧赢**（`{...default, ...context}`）。
 *      ⇒ context 只给了 `Table.filterTitle` 的话，`Table` 的其余字段会**全部丢失**。
 *      **这是上游的真实行为，别「顺手修」成深合并**（契约文档 §3.5 第 2 条）。
 *   3. **`exist` 标志**：`LocaleProvider` 会把 `exist: true` 混进 context 值，
 *      它唯一的用途是「挂了 Provider 但没给 `locale` 字段」时回退到 `'en'`。
 *   4. 返回 `[locale, localeCode]`；`localeCode` 在「没挂 Provider」时是 `undefined`。
 *
 * ⚠️ 与上游的一处**有意**差异：上游把 `localeCode` 声明成 `string`，但它实际可能是
 *    `undefined`（`fullLocale?.locale`）。本包按真实情况声明为 `string | undefined`
 *    —— 让类型是真的。见契约文档 §5 与 `COMPATIBILITY.md`。
 */
export function useLocale<C extends LocaleComponentName>(
  componentName: C,
  defaultLocale?: Locale[C] | (() => Locale[C]),
): readonly [NonNullable<Locale[C]>, string | undefined] {
  const injected = inject(localeContextKey, undefined);
  const fullLocale = injected === undefined ? undefined : toValue(injected);

  const locale = defaultLocale ?? defaultLocaleData[componentName];
  const localeFromContext = (fullLocale?.[componentName] ?? {}) as Locale[C];

  const merged = {
    ...(typeof locale === 'function' ? (locale as () => Locale[C])() : locale),
    ...(localeFromContext || {}),
  } as NonNullable<Locale[C]>;

  const localeCode = fullLocale?.locale;
  const resolvedCode = fullLocale?.exist && !localeCode ? defaultLocaleData.locale : localeCode;

  return [merged, resolvedCode];
}

export { defaultLocaleData };
